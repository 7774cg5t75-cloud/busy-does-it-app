import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import {createClient} from "jsr:@supabase/supabase-js@2";
import {formReadiness,cleanPublicSubmission,verifiedChallenge,expectedSiteOrigin} from "./formPolicy.mjs";
import {validatedLeadInput} from "./leadWorkflow.mjs";

const ROOT=Deno.env.get("SUPABASE_URL")||"";
const SECRET=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
const CHALLENGE_SECRET=Deno.env.get("BUSY_TURNSTILE_SECRET_KEY")||"";
const ENABLED=Deno.env.get("BUSY_WEBSITE_FORM_INTAKE_ENABLED")==="true";
const service=ROOT&&SECRET?createClient(ROOT,SECRET,
  {auth:{persistSession:false,autoRefreshToken:false}}):null;
const HEADERS={"Content-Type":"application/json","Cache-Control":"no-store",
  "Access-Control-Allow-Methods":"POST,OPTIONS",
  "Access-Control-Allow-Headers":"content-type"};
function safeOrigin(value){
  if(typeof value!=="string")return null;
  try{
    const url=new URL(value);
    if(url.protocol!=="https:"||url.username||url.password||url.port||url.pathname!=="/"||
       url.search||url.hash)return null;
    const name=url.hostname;
    if(!/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.busydoesit\.co\.uk$/.test(name))
      return null;
    return "https://"+name;
  }catch{return null;}
}
function result(status,body,origin){
  return new Response(JSON.stringify(body),{status,headers:{
    ...HEADERS,...(origin?{"Access-Control-Allow-Origin":origin,"Vary":"Origin"}:{})
  }});
}
async function verifyTurnstile(token){
  const payload=new URLSearchParams({secret:CHALLENGE_SECRET,response:token});
  const response=await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify",{
    method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},
    body:payload,signal:AbortSignal.timeout(5500)
  });
  if(!response.ok)return null;
  return await response.json().catch(()=>null);
}
Deno.serve(async(req)=>{
  const origin=safeOrigin(req.headers.get("origin"));
  // OPTIONS does not authorise a submission, and CORS is never sufficient
  // authentication; every POST verifies the live site and Turnstile token.
  if(req.method==="OPTIONS")
    return result(origin?200:403,{},origin);
  if(req.method!=="POST")return result(405,{error:"method_not_allowed"},origin);
  if(!ENABLED||!CHALLENGE_SECRET||!service)
    return result(503,{error:"website_enquiries_not_enabled"},origin);
  if(!origin)return result(403,{error:"untrusted_origin"},null);
  const length=Number(req.headers.get("content-length")||"0");
  if(!Number.isFinite(length)||length>8192)
    return result(413,{error:"request_too_large"},origin);
  if(!/^application\/json(?:;|$)/i.test(req.headers.get("content-type")||""))
    return result(415,{error:"json_required"},origin);
  try{
    const raw=await req.text();
    if(raw.length>8192)return result(413,{error:"request_too_large"},origin);
    const body=cleanPublicSubmission(JSON.parse(raw));
    if(!body)return result(400,{error:"invalid_submission"},origin);
    const checked=validatedLeadInput(body);
    if(!checked.ok)return result(400,{error:checked.error},origin);

    // Verify the single-use challenge before any database lookup. Unknown
    // site IDs cannot drive unbounded privileged database reads from bots.
    const proof=await verifyTurnstile(body.turnstileToken);
    const claimedHostname=origin.slice("https://".length);
    if(!verifiedChallenge(proof,claimedHostname))
      return result(403,{error:"human_verification_required"},origin);

    const site=await service.from("busy_websites")
      .select("id,business_id,default_hostname,current_live_deployment_id,public_form_enabled,health_status,delivery_status,last_health_check_at,last_healthy_at,last_observed_deployment_id")
      .eq("id",body.siteId).maybeSingle();
    if(site.error||!site.data)return result(404,{error:"website_form_unavailable"},origin);
    const gate=formReadiness(site.data,{globalEnabled:ENABLED,hasSecret:!!CHALLENGE_SECRET});
    if(!gate.ready||gate.expectedOrigin!==origin)
      return result(404,{error:"website_form_unavailable"},origin);

    const quota=await service.rpc("busy_claim_website_form_quota",{p_website_id:site.data.id});
    if(quota.error||quota.data!==true)
      return result(429,{error:"website_form_busy_try_later"},origin);

    const record={...checked.record,source:"website_form",
      website_id:site.data.id,business_id:site.data.business_id,
      created_by:null};
    const insert=await service.from("busy_website_leads")
      .insert(record).select("id").single();
    if(insert.error){
      if(insert.error.code==="23505")
        return result(200,{ok:true,received:true,duplicate:true,
          note:"This enquiry has already been received. No message was sent automatically."},origin);
      return result(503,{error:"website_enquiry_unavailable"},origin);
    }
    return result(200,{ok:true,received:true,
      note:"Your enquiry has been received. The business will review it."},origin);
  }catch{
    return result(503,{error:"website_enquiry_unavailable"},origin);
  }
});
