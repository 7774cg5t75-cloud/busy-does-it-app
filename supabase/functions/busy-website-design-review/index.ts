import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import {createClient} from "jsr:@supabase/supabase-js@2";
import {normalizeVisualCritique} from "../busy-website-worker/visualCriticContract.mjs";

/**
 * V3.105 authenticated, gated website screenshot visual critic.
 * No publishing, writes to the website or source-draft changes here.
 * Requires a separately configured TRUSTED browser renderer, server API key,
 * per-tenant opted-in meter and user confirmation. All disabled by default.
 */
const URL_BASE=Deno.env.get("SUPABASE_URL")||"";
const SERVICE_KEY=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
const RENDERER_URL=Deno.env.get("BUSY_WEBSITE_SCREENSHOT_RENDERER_URL")||"";
const RENDERER_SECRET=Deno.env.get("BUSY_WEBSITE_SCREENSHOT_RENDERER_SECRET")||"";
const VISION_KEY=Deno.env.get("OPENAI_API_KEY")||"";
const VISION_MODEL=Deno.env.get("BUSY_WEBSITE_VISUAL_AI_MODEL")||"";
const globallyEnabled=Deno.env.get("BUSY_WEBSITE_VISUAL_AI_ENABLED")==="true";
const supabase=createClient(URL_BASE,SERVICE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const asText=(v:unknown,n=160)=>String(v||"").trim().slice(0,n);
const json=(status:number,payload:unknown)=>new Response(JSON.stringify(payload),{
  status,headers:{"Content-Type":"application/json","Cache-Control":"no-store",
    "Access-Control-Allow-Origin":"*",
    "Access-Control-Allow-Headers":"authorization,apikey,content-type,x-client-info",
    "Access-Control-Allow-Methods":"POST,OPTIONS"}});
const pngHeader=[137,80,78,71,13,10,26,10];
const validUuid=(value:string)=>/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
const ready=()=>globallyEnabled&&!!RENDERER_URL&&!!RENDERER_SECRET&&
 !!VISION_KEY&&/^gpt-[a-z0-9.-]+$/i.test(VISION_MODEL)&&
 /^https:\/\//i.test(RENDERER_URL) && new URL(RENDERER_URL).username==="" &&
 new URL(RENDERER_URL).password==="";
const minutesRemaining=(utcNow:Date)=>{
  const today=utcNow.getUTCDate();
  return new Date(Date.UTC(utcNow.getUTCFullYear(),utcNow.getUTCMonth()+1,1)).getTime()-
   new Date(Date.UTC(utcNow.getUTCFullYear(),utcNow.getUTCMonth(),today)).getTime();
};
async function imageFromTrustedRenderer(signedUrl:string,viewport:{width:number,height:number},
  expectedDeployment:string){
 if(!ready())throw Error("Trusted screenshot service is not configured");
 const render=await fetch(RENDERER_URL,{
   method:"POST",
   headers:{"Authorization":"Bearer "+RENDERER_SECRET,
     "Content-Type":"application/json"},
   body:JSON.stringify({url:signedUrl,viewport,expectedDeployment,
     allowExternalNavigation:false,blockThirdPartyScripts:true}),
   signal:AbortSignal.timeout(16000)
 });
 if(!render.ok)throw Error("Trusted screenshot renderer unavailable");
 const bytes=new Uint8Array(await render.arrayBuffer());
 if(bytes.byteLength<64||bytes.byteLength>2100000||
   pngHeader.some((byte,i)=>bytes[i]!==byte)||
   String.fromCharCode(...bytes.slice(12,16))!=="IHDR")
   throw Error("Renderer returned invalid or oversized PNG");
 const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
 const w=view.getUint32(16),h=view.getUint32(20);
 if(w!==viewport.width||h<320||h>9500)
   throw Error("Renderer returned an unexpected screenshot size");
 let output="";for(let i=0;i<bytes.length;i+=32768)
   output+=String.fromCharCode(...bytes.subarray(i,i+32768));
 return btoa(output);
}
function extractResponse(body:any){
 const text=(Array.isArray(body?.output)?body.output:[])
   .flatMap((o:any)=>Array.isArray(o?.content)?o.content:[])
   .filter((x:any)=>x?.type==="output_text"&&typeof x.text==="string")
   .map((x:any)=>x.text).join("\n");
 let result:any;try{result=JSON.parse(text);}catch{throw Error("AI review was not returned in safe JSON format");}
 if(!result||typeof result!=="object")throw Error("Invalid AI review");
 return result;
}
const prompt=[
 "You are BUSY DOES IT's visual website designer.",
 "Analyse ACTUAL screenshots of a single customer's PRIVATE website: first MOBILE 390px and then DESKTOP 1440px.",
 "Check layout overflow, navigation clarity, typography, touch targets, contrast, visual hierarchy, whitespace.",
 "Return at most 3 design-only suggestions. Never change business facts, services, claims, photos, credentials or publishing.",
 "Allowed suggestion paths: theme.heroLayout, theme.cardLayout, theme.navStyle, theme.ornament, theme.typography, theme.paletteVariant, theme.heroSize, theme.spacing.",
 "Valid hero layouts with a photo: image-right,image-left,image-feature,image-frame. Without: type-left,type-right,type-center,type-poster.",
 "Valid cards: cards,outlines,rows. Nav: quiet,underline,pill. Ornament: ripple,arch,glow,stripes. Typography: confident,refined,compact. Palette: a,b,c. Hero size: medium,large,extra-large. Spacing: comfortable,generous.",
 "If there are no useful safe changes, suggest none.",
 "Return JSON ONLY in the exact format {\"summary\":\"brief review\",\"proposals\":[{\"path\":\"theme.cardLayout\",\"value\":\"rows\",\"reason\":\"brief visual reason\"}]}."
].join("\n");
async function runVision(mobile:string,desktop:string,approvedPhotos:number){
 const response=await fetch("https://api.openai.com/v1/responses",{
  method:"POST",
  headers:{"Authorization":"Bearer "+VISION_KEY,"Content-Type":"application/json"},
  body:JSON.stringify({model:VISION_MODEL,store:false,max_output_tokens:650,
    input:[{role:"user",content:[{type:"input_text",text:prompt},
      {type:"input_image",image_url:"data:image/png;base64,"+mobile,detail:"low"},
      {type:"input_image",image_url:"data:image/png;base64,"+desktop,detail:"low"}]}]}),
  signal:AbortSignal.timeout(24000)
 });
 if(!response.ok)throw Error("AI reviewer did not complete the requested visual check");
 const body=await response.json();
 const proposal=normalizeVisualCritique({...extractResponse(body),reviewedScreenshots:true},{approvedPhotos});
 if(!proposal.valid)throw Error("AI suggested unsupported website edits");
 return {proposal,inputTokens:Math.max(0,Number(body.usage?.input_tokens)||0),
   outputTokens:Math.max(0,Number(body.usage?.output_tokens)||0)};
}
Deno.serve(async(request:Request)=>{
 if(request.method==="OPTIONS")return json(200,{ok:true});
 if(request.method!=="POST")return json(405,{error:"POST required"});
 if(!SERVICE_KEY||!URL_BASE)return json(503,{error:"Review service unavailable"});
 try{
  // No user-supplied preview URL. All sites, deployments and signed links
  // must be resolved independently from the owner's authenticated tenant.
  const bearer=request.headers.get("Authorization")||"";
  const token=bearer.replace(/^Bearer\s+/i,"").trim();
  if(!token)return json(401,{error:"Sign in first"});
  const user=await supabase.auth.getUser(token);
  if(user.error||!user.data.user?.id)return json(401,{error:"Sign-in expired"});
  const body=await request.json();
  const businessId=asText(body.businessId,90),deploymentId=asText(body.deploymentId,90);
  if(!validUuid(businessId))return json(400,{error:"Select a valid business workspace"});
  const membership=await supabase.from("busy_business_memberships")
    .select("role").eq("user_id",user.data.user.id).eq("business_id",businessId)
    .in("role",["owner","admin"]).maybeSingle();
  if(membership.error||!membership.data)return json(403,{error:"Business owner/admin access required"});
  const action=asText(body.action,24)||"status";
  if(!["status","review"].includes(action))return json(400,{error:"Unsupported action"});
  // Billing preferences and remaining allowance must never come from client.
  const limit=await supabase.from("busy_website_visual_ai_limits")
    .select("enabled,monthly_request_cap").eq("business_id",businessId).maybeSingle();
  if(limit.error)return json(503,{error:"Website visual review billing is not configured"});
  const monthStart=new Date();monthStart.setUTCDate(1);monthStart.setUTCHours(0,0,0,0);
  const usage=await supabase.from("busy_website_visual_ai_calls")
    .select("id",{count:"exact",head:true}).eq("business_id",businessId)
    .gte("created_at",monthStart.toISOString());
  if(usage.error)return json(503,{error:"Usage meter unavailable"});
  const cap=Math.max(0,Number(limit.data?.monthly_request_cap||0));
  const used=Number(usage.count||0);
  const enabled=!!limit.data?.enabled && ready();
  if(action==="status")
    return json(200,{ok:true,enabled,remaining:Math.max(0,cap-used),monthlyLimit:cap,
      used,requiresOwnerConsent:true,modelReviewReady:ready(),
      message:enabled?"BUSY can review your private hosted website using one AI credit."
        :"Visual AI review is not enabled for this business yet. Existing website previews remain available."});
  if(!enabled)return json(503,{error:"Visual AI review is not enabled or configured"});
  if(body.ownerConsent!==true)return json(400,{error:"Owner consent required before sending screenshots to AI"});
  if(used>=cap)return json(429,{error:"Monthly website design review allowance reached"});
  if(!validUuid(deploymentId))return json(400,{error:"Select an existing hosted preview"});
  const website=await supabase.from("busy_websites").select("id,site_key")
    .eq("business_id",businessId).eq("site_key","main").maybeSingle();
  if(website.error||!website.data)return json(404,{error:"No hosted website found"});
  const deployment=await supabase.from("busy_website_deployments")
    .select("id,website_id,business_id,state,preview_storage_path,source_draft,source_generation")
    .eq("id",deploymentId).eq("business_id",businessId)
    .eq("website_id",website.data.id).maybeSingle();
  if(deployment.error||!deployment.data||deployment.data.state!=="preview_ready")
    return json(409,{error:"Prepare a private hosted website version first"});
  const prefix=businessId+"/"+website.data.id+"/deployments/"+deploymentId+"/";
  if(!deployment.data.preview_storage_path?.startsWith(prefix)||
     !deployment.data.preview_storage_path.endsWith(".html"))
    return json(409,{error:"Hosted preview provenance could not be verified"});
  const key=asText(body.requestKey,160);
  if(key.length<8||key.length>160||!/^[a-zA-Z0-9:_-]+$/.test(key))
    return json(400,{error:"A unique request key is needed"});
  const reserve=await supabase.rpc("busy_reserve_website_visual_ai_call",{
    p_business_id:businessId,p_request_key:key});
  if(reserve.error)return json(503,{error:"Could not reserve visual AI allowance"});
  const reservation=String(reserve.data||"");
  if(!validUuid(reservation))return json(429,{error:"Review allowance unavailable or request already handled"});
  let status:"failed"|"completed"="failed",inputTokens=0,outputTokens=0;
  try{
   const signed=await supabase.storage.from("busy-website-preview")
     .createSignedUrl(deployment.data.preview_storage_path,600);
   if(signed.error||!signed.data?.signedUrl)throw Error("Private preview signing failed");
   // Signed preview URL is passed ONLY to the configured trusted renderer.
   const [mobile,desktop]=await Promise.all([
     imageFromTrustedRenderer(signed.data.signedUrl,{width:390,height:844},deploymentId),
     imageFromTrustedRenderer(signed.data.signedUrl,{width:1440,height:900},deploymentId)]);
   const approvedPhotos=Number(deployment.data.source_draft?.designPlan?.signals?.approvedPhotos||0);
   const reviewed=await runVision(mobile,desktop,approvedPhotos);
   inputTokens=reviewed.inputTokens;outputTokens=reviewed.outputTokens;
   status="completed";
   return json(200,{ok:true,reviewId:reservation,businessId,deploymentId,
     sourceGeneration:deployment.data.source_generation,
     report:reviewed.proposal,
     usage:{inputTokens,outputTokens,reviewCalls:1},
     published:false,changesApplied:false,
     message:"BUSY inspected the mobile and desktop preview. Review suggestions before changing your private draft."});
  }finally{
    // Each attempted review permanently counts against this month's cap,
    // even if the renderer/model fails after a reservation. No implicit retry.
    await supabase.rpc("busy_finish_website_visual_ai_call",{
      p_business_id:businessId,p_call_id:reservation,p_state:status,
      p_input_tokens:inputTokens,p_output_tokens:outputTokens});
  }
 }catch(error){
  const message=error instanceof Error?error.message:"Visual review failed";
  console.error("website-visual-review",message);
  return json(500,{error:"BUSY could not complete this private visual review. If a credit was reserved, it may have been used. Please check usage before retrying."});
 }
});
