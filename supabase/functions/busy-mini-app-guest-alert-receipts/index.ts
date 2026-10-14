import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import {createClient} from "jsr:@supabase/supabase-js@2";
import {classifyPushServiceReceiptV3230}
 from "../busy-mini-app-guest-alert-dispatch/pushServiceReceiptV3230.mjs";

/**
 * V3.230 SOURCE ONLY: disabled and unscheduled independent receipt check.
 * Must have explicit phase/provider/device approval before enabling.
 * Never sends push notifications and never confirms phone arrival/read.
 * Uses the ORIGINAL service-only V3.229 recipient attempts (max 10).
 */
const enabled=Deno.env.get("BUSY_GUEST_ALERT_RECEIPT_CHECK_ENABLED")==="true";
const secret=Deno.env.get("BUSY_GUEST_ALERT_RECEIPT_WORKER_SECRET")||"";
const url=Deno.env.get("SUPABASE_URL")||"";
const key=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
const store=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
const EXPO="https://exp.host/--/api/v2/push/getReceipts";
const out=(status:number,data:unknown)=>new Response(JSON.stringify(data),{
 status,headers:{"content-type":"application/json","cache-control":"no-store"}
});
const digest=async(v:string)=>new Uint8Array(
 await crypto.subtle.digest("SHA-256",new TextEncoder().encode(v)));
async function allowed(request:Request){
 const candidate=request.headers.get("x-busy-receipt-worker-secret")||"";
 if(secret.length<40||candidate.length<40||candidate.length>1024)return false;
 const [a,b]=await Promise.all([digest(secret),digest(candidate)]);
 let different=0;
 for(let i=0;i<a.length;i++)different|=a[i]^b[i];
 return different===0;
}
async function checkOnce(){
 // Only gateway accepted tickets are eligible; unknown/failed sends
 // MUST NOT be queried as though Expo accepted them.
 const read=await store.from("busy_mini_app_guest_alert_device_attempts_v3229")
  .select("intent_id,attempt_no,recipient_slot,ticket_id,ticket_expires_at")
  .eq("gateway_state","accepted")
  .eq("push_service_state","not_checked")
  .order("ticket_expires_at",{ascending:true})
  .limit(10);
 if(read.error)throw Error("Private push receipt ledger unavailable.");
 const entries=read.data||[];
 let accepted=0,rejected=0,expired=0,unverified=0;
 const now=Date.now();
 const valid=entries.filter((e:any)=>e.ticket_id&&
  /^[A-Za-z0-9_-]{5,120}$/.test(e.ticket_id)&&
  Number.isFinite(Date.parse(e.ticket_expires_at)));
 if(valid.length!==entries.length)
  throw Error("Private receipt claim includes malformed original tickets.");
 for(const entry of entries){
  if(Date.parse(entry.ticket_expires_at)>now)continue;
  const mark=await store.rpc("busy_guest_alert_record_push_service_receipt_v3230",{
   p_intent_id:entry.intent_id,p_attempt_no:entry.attempt_no,
   p_recipient_slot:entry.recipient_slot,p_ticket_id:entry.ticket_id,
   p_result:"expired_unverified",p_error_code:null
  });
  if(mark.error)throw Error("Expired receipt row could not be reconciled.");
  if(mark.data===true)expired++;
 }
 const due=entries.filter((e:any)=>Date.parse(e.ticket_expires_at)>now);
 if(due.length>0){
  // Bounded, READ-only provider receipt lookup. This endpoint is NOT
  // push/send. A missing response is unverified, never proof of loss.
  const response=await fetch(EXPO,{
   method:"POST",headers:{"content-type":"application/json","accept":"application/json"},
   body:JSON.stringify({ids:due.map((e:any)=>e.ticket_id)}),
   signal:AbortSignal.timeout(12000)
  });
  const data=await response.json().catch(()=>null);
  const receipts=data&&typeof data==="object"&&
   !Array.isArray(data)?data.data:null;
  for(const e of due){
   const result=classifyPushServiceReceiptV3230({
    ticketId:e.ticket_id,responseOk:response.ok,receipts
   });
   if(!result.persist){unverified++;continue;}
   const mark=await store.rpc("busy_guest_alert_record_push_service_receipt_v3230",{
    p_intent_id:e.intent_id,p_attempt_no:e.attempt_no,
    p_recipient_slot:e.recipient_slot,p_ticket_id:e.ticket_id,
    p_result:result.kind,p_error_code:result.errorCode
   });
   if(mark.error)throw Error("Receipt could not be atomically recorded.");
   // Concurrent read-only workers can see the same ticket; CAS ensures
   // only the FIRST valid terminal update is persisted.
   if(mark.data===true){
    if(result.kind==="push_service_accepted")accepted++;
    else rejected++;
   }
  }
 }
 return {kind:"receipt_reconciliation_v3230",checked:entries.length,
  pushServiceAccepted:accepted,pushServiceRejected:rejected,
  expiredUnverified:expired,stillUnverified:unverified,
  deviceDelivered:false,ownerRead:false,pushSentByThisCall:false,
  customerDataReturned:false,bookingConfirmed:false};
}
Deno.serve(async(request:Request)=>{
 if(request.method!=="POST")return out(405,{error:"Use POST."});
 if(!enabled||!url||!key||secret.length<40)
  return out(503,{error:"Push receipt checker disabled."});
 if(!(await allowed(request)))return out(401,{error:"Not authorised."});
 try{return out(200,{ok:true,...await checkOnce()});}
 catch{return out(503,{ok:false,error:"Push receipt status cannot be verified. Do not resend customer alerts."});}
});
