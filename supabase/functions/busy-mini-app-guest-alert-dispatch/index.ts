import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import {classifyGuestAlertProviderTicketsV3227}
 from "./dispatchReceiptV3227.mjs";

/**
 * V3.227 SOURCE ONLY. NOT deployed or scheduled. DISABLED BY DEFAULT.
 * One request-scoped, service-only leased alert per authorised invocation.
 * Never send a customer notification, use customer contact data, or trust
 * a body-supplied request ID. Unknown provider outcomes are quarantined.
 */
const enabled=Deno.env.get("BUSY_GUEST_ALERT_DISPATCH_ENABLED")==="true";
const secret=Deno.env.get("BUSY_GUEST_ALERT_WORKER_SECRET")||"";
const SUPABASE_URL=Deno.env.get("SUPABASE_URL")||"";
const SERVICE_KEY=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
const EXPO="https://exp.host/--/api/v2/push/send";
const store=createClient(SUPABASE_URL,SERVICE_KEY,{
 auth:{persistSession:false,autoRefreshToken:false}
});
const json=(status:number,data:unknown)=>new Response(JSON.stringify(data),{
 status,headers:{"content-type":"application/json","cache-control":"no-store"}
});
const sha=async(value:string)=>{
 const bytes=new Uint8Array(await crypto.subtle.digest("SHA-256",
  new TextEncoder().encode(value)));
 return [...bytes].map(b=>b.toString(16).padStart(2,"0")).join("");
};
async function authorised(request:Request){
 const candidate=request.headers.get("x-busy-worker-secret")||"";
 // Compare hashes without a secret-bearing log or early string equality.
 if(secret.length<40||candidate.length<40||candidate.length>1024)return false;
 const [a,b]=await Promise.all([sha(secret),sha(candidate)]);
 let different=0;
 for(let i=0;i<a.length;i++)different|=a.charCodeAt(i)^b.charCodeAt(i);
 return different===0;
}
const validExpoToken=(v:unknown):v is string=>
 typeof v==="string"&&v.length<=260&&
 (/^ExponentPushToken\[[\w-]{10,}\]$/.test(v)||
  /^ExpoPushToken\[[\w-]{10,}\]$/.test(v));
async function runOnce(){
 // Keep crashed/unknown in-flight sends quarantined, not automatically
 // leased again. No timer or cron is scheduled by this function.
 const q=await store.rpc("busy_guest_alert_quarantine_expired_v3227");
 if(q.error)throw Error("Unable to reconcile expired alert leases.");
 const claim=await store.rpc("busy_guest_alert_claim_one_v3227");
 if(claim.error)throw Error("Unable to claim pending guest alert.");
 const item=Array.isArray(claim.data)?claim.data[0]:null;
 if(!item)return {kind:"no_eligible_guest_alert",providerContacted:false};
 const uuid=/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
 if(![item.intent_id,item.request_id,item.business_id,item.mini_app_id,
  item.lease_token].every(x=>typeof x==="string"&&uuid.test(x)))
  throw Error("Claim did not return a fully scoped intent.");
 let outcome:"provider_accepted"|"definitively_rejected"|"uncertain"="uncertain";
 let digest:string|null=null;
 try{
  const request=await store.from("busy_mini_app_requests")
   .select("id,business_id,mini_app_id,request_origin,request_type,status")
   .eq("id",item.request_id).eq("business_id",item.business_id)
   .eq("mini_app_id",item.mini_app_id).maybeSingle();
  if(request.error||!request.data||request.data.request_origin!=="guest_web"||
   !["enquiry","booking_request"].includes(request.data.request_type))
   throw Error("The original guest request cannot be verified.");
  const members=await store.from("busy_business_memberships")
   .select("user_id").eq("business_id",item.business_id)
   .in("role",["owner","admin"]).limit(20);
  if(members.error)throw Error("Owner membership lookup unavailable.");
  const userIds=[...new Set((members.data||[]).map((x:any)=>x.user_id))]
   .filter(x=>typeof x==="string"&&uuid.test(x));
  if(userIds.length<1){outcome="definitively_rejected";}
  else{
   const devices=await store.from("busy_push_devices")
    .select("expo_push_token").in("user_id",userIds)
    .eq("active",true).limit(20);
   if(devices.error)throw Error("Owner devices are unavailable.");
   const tokens=[...new Set((devices.data||[]).map((x:any)=>x.expo_push_token))]
    .filter(validExpoToken);
   if(tokens.length<1){outcome="definitively_rejected";}
   else{
    const response=await fetch(EXPO,{
     method:"POST",
     headers:{"content-type":"application/json","accept":"application/json"},
     body:JSON.stringify(tokens.map(to=>({
      to,sound:"default",
      title:request.data.request_type==="booking_request"?
       "BUSY Apps • New booking request":"BUSY Apps • New enquiry",
      body:"A new customer request is waiting in your BUSY Business App.",
      data:{route:"mini_app_request",role:"business",
       requestId:item.request_id,businessId:item.business_id}
     }))),
     signal:AbortSignal.timeout(12000)
    });
    const result=await response.json().catch(()=>null);
    const tickets=result&&Array.isArray(result.data)?result.data:null;
    const check=classifyGuestAlertProviderTicketsV3227({
      responseOk:response.ok,tickets,expectedCount:tokens.length
    });
    outcome=check.outcome;
    if(check.providerAccepted){
      // Store a digest of gateway tickets, NOT the raw Expo tokens, customer
      // identity or the receipts; even acceptance is NOT delivery evidence.
      digest=await sha(JSON.stringify(tickets));
    }
   }
  }
 }catch{
  // Transport may have reached provider before failing. Never blindly retry.
  outcome="uncertain";digest=null;
 }
 const saved=await store.rpc("busy_guest_alert_complete_v3227",{
  p_intent_id:item.intent_id,p_lease_token:item.lease_token,
  p_outcome:outcome,p_receipt_sha256:digest
 });
 if(saved.error||saved.data!==true)
  throw Error("Provider attempt cannot be safely reconciled. Keep the lease for manual review.");
 return {kind:"one_guest_alert_attempt_recorded",outcome,
  providerAccepted:outcome==="provider_accepted",
  delivered:false,deviceReceiptVerified:false,
  originalRequestSaved:true,bookingConfirmed:false,
  customerDetailsReturned:false};
}
Deno.serve(async(request:Request)=>{
 if(request.method!=="POST")return json(405,{error:"Use POST."});
 if(!enabled||!SUPABASE_URL||!SERVICE_KEY||secret.length<40)
  return json(503,{error:"Guest alert dispatcher is disabled."});
 if(!(await authorised(request)))return json(401,{error:"Not authorised."});
 try{return json(200,{ok:true,...(await runOnce())});}
 catch{return json(503,{ok:false,error:"Guest alert delivery state needs review. Do not automatically retry a request."});}
});
