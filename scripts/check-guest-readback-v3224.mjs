/**
 * V3.224 genuine guest post-commit source validator checks.
 * All customer data are synthetic; no SQL/network/provider actions.
 */
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {verifyStoredGuestSubmissionV3224 as verify}
 from "../supabase/functions/busy-mini-app-guest/guestStoredPayloadV3224.mjs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
let n=0;
const eq=(a,b,label)=>{assert.deepEqual(a,b,label);n++;};
const ok=(v,label)=>{assert.ok(v,label);n++;};
const B="11111111-1111-4111-8111-111111111111";
const A="22222222-2222-4222-8222-222222222222";
const R="33333333-3333-4333-8333-333333333333";
const C="44444444-4444-4444-8444-444444444444";
const OTHER="55555555-5555-4555-8555-555555555555";
const KEY="idempotent-guest-xyz";
const raw=(type="enquiry")=>type==="enquiry"?
 {name:"Synthetic Owner",email:"owner@example.test",phone:"",
  service:"",message:"Please send fictional details"}:
 {name:"Synthetic Owner",email:"owner@example.test",phone:"",
  service:"Example appointment",preferredDate:"2026-11-01",note:"Example only"};
const context=(type="enquiry")=>{
 const payload=raw(type);
 const sanitized={payload,name:payload.name,email:payload.email,
  phone:payload.phone,service:payload.service,
  preferredDate:type==="booking_request"?payload.preferredDate:""};
 const row={id:R,business_id:B,mini_app_id:A,guest_challenge_id:C,
   request_type:type,request_origin:"guest_web",
   identity_assurance:"guest_browser_challenge",
   status:"received",payload,
   contact_name:sanitized.name,contact_email:sanitized.email,
   contact_phone:null,service_name:sanitized.service||null,
   preferred_date_text:sanitized.preferredDate||null,
   idempotency_key:KEY};
 return {row,sanitized,requestId:R,businessId:B,appId:A,
   challengeId:C,requestType:type,idempotencyKey:KEY};
};
for(const kind of ["enquiry","booking_request"]){
 const input=context(kind),got=verify(input);
 ok(got.ok,got.reason);
 eq(got.storedRequestMatchesSubmission,true);
 eq(got.mayNotifyOwner,true);
 eq(got.mayCreateAnotherRequest,false);
 eq(got.providerNotificationDelivered,false);
 eq(got.bookingConfirmed,false);
 eq(got.shouldRetryCreate,false);
 eq(got.contactDetailsIncluded,false);
 ok(!JSON.stringify(got).includes("owner@example.test"));
 const replay=verify({...input,row:{...input.row,status:"reviewing"}});
 ok(replay.ok);
 eq(replay.mayNotifyOwner,false);
 for(const [key,value] of [
  ["business_id",OTHER],["mini_app_id",OTHER],
  ["guest_challenge_id",OTHER],["id",OTHER],
  ["request_origin","signed_in"],["request_type",kind==="enquiry"?"booking_request":"enquiry"],
  ["identity_assurance","signed_in_account"],["idempotency_key","wrong-key"],
  ["contact_email","leaked@example.test"],["service_name","Different"],
  ["contact_name","Different"],["preferred_date_text","2035-01-01"],
  ["payload",{...input.row.payload,message:"Changed",note:"Changed"}],
  ["status","unknown"]]){
  const r=verify({...input,row:{...input.row,[key]:value}});
  eq(r.ok,false,"Reject forged stored "+key);
  eq(r.mayNotifyOwner,false);
  eq(r.mayCreateAnotherRequest,false);
  eq(r.customerDetailsIncluded,false);
 }
 const extra=verify({...input,row:{...input.row,payload:{
   ...input.row.payload,unapproved:"injected"}}});
 eq(extra.ok,false);
 const missing=verify({...input,row:{...input.row,payload:{
   ...input.row.payload,name:undefined}}});
 eq(missing.ok,false);
 const mismatch=verify({...input,sanitized:{...input.sanitized,payload:{
   ...input.sanitized.payload,name:"Different"}}});
 eq(mismatch.ok,false);
 for(const different of [
  {businessId:OTHER},{appId:OTHER},{requestId:OTHER},
  {challengeId:OTHER},{requestType:"unsupported"},
  {idempotencyKey:"reused-different"}]){
  const x=verify({...input,...different});
  eq(x.ok,false);
  eq(x.mayCreateAnotherRequest,false);
 }
}
const empty=context();
empty.idempotencyKey="";
empty.row.idempotency_key=null;
eq(verify(empty).ok,true,"No optional idempotency key must still match NULL");
const edge=read("supabase/functions/busy-mini-app-guest/index.ts");
ok(edge.includes('import {verifyStoredGuestSubmissionV3224}'));
ok(edge.includes("const storedMatch=verifyStoredGuestSubmissionV3224({"));
ok(edge.includes("if(!storedMatch.ok)"));
ok(edge.includes("row:requestRow.data,sanitized:safe"));
ok(edge.includes("const queued=await supabase"));
ok(edge.includes("notificationDeduplicationGuaranteed:false"));
ok(edge.includes('payload,contact_name,contact_email,contact_phone'));
ok(edge.indexOf("const storedMatch=verifyStoredGuestSubmissionV3224(")<
 edge.indexOf("const queued=await supabase"));
const probe=read("staging/CI_ONLY_v3224_assert_rollback.sql");
ok(probe.includes("rollback;"));
ok(probe.includes("relforcerowsecurity"));
ok(probe.includes("has_table_privilege"));
ok(!probe.includes("drop table cascade"));
console.log("V3.224 guest saved-payload, replay and notification source checks: "+
 n+" assertions passed; no guest request or provider operation was executed.");
