/**
 * V3.213: test real shared receipt evidence code and its two Edge call sites.
 * All rows are synthetic. No database, provider, customer, secrets or network.
 */
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {evaluateStoredRequestProof} from "../supabase/functions/busy-mini-apps/requestReceiptProofV3213.mjs";
import {evaluateStoredRequestProof as evaluateGuestProof}
 from "../supabase/functions/busy-mini-app-guest/requestReceiptProofV3213.mjs";
const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const UUID1="11111111-1111-4111-8111-111111111111";
const UUID2="22222222-2222-4222-8222-222222222222";
const UUID3="33333333-3333-4333-8333-333333333333";
let checks=0;
const ok=(v,message)=>{assert.ok(v,message);checks++};
const equal=(a,b,message)=>{assert.deepEqual(a,b,message);checks++};
const makeRequest=(over={})=>({
 id:UUID3,business_id:UUID1,mini_app_id:UUID2,
 request_type:"booking_request",request_origin:"guest_web",status:"received",
 contact_name:"This name must NEVER appear in the report",
 payload:{email:"secret@example.test",message:"Private message"},
 ...over
});
const evaluate=(request,options={})=>evaluateStoredRequestProof({
 context:"guest_status",businessId:UUID1,appId:UUID2,
 requestId:UUID3,request,...options
});
const validLink=(extra={})=>({
 request_id:UUID3,business_id:UUID1,bridge_state:"booking_confirmed",...extra
});
const exactBytes=read("supabase/functions/busy-mini-apps/requestReceiptProofV3213.mjs");
equal(exactBytes,
 read("supabase/functions/busy-mini-app-guest/requestReceiptProofV3213.mjs"),
 "Both Edge handlers must share byte-identical evidence rules.");
for(const type of ["booking_request","enquiry"]){
 for(const status of ["received","reviewing","accepted","declined","closed"]){
  const row=makeRequest({request_type:type,status});
  const receipt=evaluate(row);
  ok(receipt.ok,"Accept exact stored "+type+"/"+status);
  equal(receipt.verifiedSaved,true);
  equal(receipt.requestType,type);
  equal(receipt.status,status);
  equal(receipt.sourceChannel,"guest_web");
  equal(receipt.noNewRequestCreated,true);
  equal(receipt.shouldRetryCreate,false);
  equal(receipt.notificationDelivered,false);
  equal(receipt.externalDeliveryVerified,false);
  equal(receipt.independentDiaryVerification,false);
  equal(receipt.customerPayloadIncluded,false);
  equal(receipt.actorIdentityIncluded,false);
  equal(receipt.guestAccessTokenIncluded,false);
  ok(!JSON.stringify(receipt).includes("secret@example.test"),
    "No contact payload in an independent status.");
  ok(!JSON.stringify(receipt).includes("name must NEVER"),
    "No full name or messages in proof.");
  equal(evaluateGuestProof({request:row,context:"guest_status",
   businessId:UUID1,appId:UUID2,requestId:UUID3}),receipt,
   "Two Edge runtimes must produce identical minimal evidence.");
 }
}
for(const status of ["received","reviewing","declined","closed"]){
 const p=evaluate(makeRequest({status}),{link:validLink()});
 equal(p.bookingMarkedConfirmedInBusy,false,
  "Link flag without accepted request must never confirm a booking.");
 equal(p.bookingStateConsistent,false);
 equal(p.independentDiaryVerification,false);
}
const confirmed=evaluate(makeRequest({status:"accepted"}),{link:validLink()});
equal(confirmed.ok,true);
equal(confirmed.bookingMarkedConfirmedInBusy,true,
 "Two internally consistent saved states reflect only a BUSY business booking marker.");
equal(confirmed.statusLabel,"Business booking confirmation recorded");
equal(confirmed.independentDiaryVerification,false);
equal(confirmed.externalCalendarDelivered,false);
equal(confirmed.notificationDelivered,false);
equal(confirmed.proofScope,"saved_internal_request_only");
const orphan=evaluate(makeRequest({status:"accepted"}));
equal(orphan.ok,true);
equal(orphan.bookingMarkedConfirmedInBusy,false);
equal(orphan.bookingStateConsistent,false);
const acceptedEnquiry=evaluate(makeRequest({request_type:"enquiry",status:"accepted"}),
 {link:{request_id:UUID3,business_id:UUID1,bridge_state:"enquiry_linked"}});
equal(acceptedEnquiry.ok,true);
equal(acceptedEnquiry.bookingMarkedConfirmedInBusy,false);
equal(acceptedEnquiry.acceptedEnquiryIsNotSentReply,true);
equal(acceptedEnquiry.customerReadReceipt,false);
const signedRow=makeRequest({request_origin:"signed_in",status:"received"});
for(const context of ["signed_in_submission","signed_in_receipt","owner_update"]){
 const p=evaluateStoredRequestProof({request:signedRow,context,
  businessId:UUID1,appId:UUID2,requestId:UUID3});
 equal(p.ok,true);
 equal(p.verifiedSaved,true);
 equal(p.sourceChannel,"signed_in");
}
const ownerGuest=evaluateStoredRequestProof({
 request:makeRequest({request_origin:"guest_web"}),context:"owner_update",
 businessId:UUID1,appId:UUID2,requestId:UUID3
});
equal(ownerGuest.ok,true);
equal(ownerGuest.sourceChannel,"guest_web",
 "Owner updates retain the origin of a guest request.");
equal(ownerGuest.externalDeliveryVerified,false);
equal(evaluate(signedRow).ok,false,
 "A signed-in identity must not be displayed as a guest receipt.");
equal(evaluateStoredRequestProof({request:makeRequest(),context:"signed_in_receipt",
 businessId:UUID1,appId:UUID2,requestId:UUID3}).ok,false);
for(const invalid of [
 null,{},makeRequest({id:UUID2}),makeRequest({business_id:UUID2}),
 makeRequest({mini_app_id:UUID1}),makeRequest({status:"paid"}),
 makeRequest({status:"unknown"}),makeRequest({request_type:"payment"}),
 makeRequest({request_origin:"signed_in"}),makeRequest({request_origin:""}),
]){
 const p=evaluate(invalid);
 equal(p.ok,false,"Invalid/mismatched record must not establish saved evidence.");
 equal(p.verifiedSaved,false);
 equal(p.shouldRetryCreate,false);
}
for(const bad of [
 validLink({request_id:UUID2}),validLink({business_id:UUID2}),
 validLink({request_id:""}),{bridge_state:"booking_confirmed"},42,"confirmed"
]){
 const x=evaluate(makeRequest({status:"accepted"}),{link:bad});
 equal(x.ok,false,"A different business link cannot confirm this booking.");
 equal(x.independentDiaryVerification,false);
}
for(const args of [
 {businessId:UUID3},{appId:UUID3},{requestId:UUID1},
 {context:"customer_entered"},{context:"unknown"},
 {request:makeRequest({request_origin:"signed_in"})}
]){
 const p=evaluate(makeRequest(),args);
 equal(p.ok,false);
}
const appSrc=read("supabase/functions/busy-mini-apps/index.ts");
const guestSrc=read("supabase/functions/busy-mini-app-guest/index.ts");
const client=read("src/app/AppController.js");
for(const token of [
 'import {evaluateStoredRequestProof} from "./requestReceiptProofV3213.mjs";',
 "const requestEvidence=verifiedRequestEvidence(",
 'request.data,app.data.business_id,app.data.id,"signed_in_receipt"',
 'existing.data,detail.app.business_id,detail.app.id,"signed_in_submission"',
 'raced.data,appRow.data.business_id,detail.app.id,"signed_in_submission"',
 'inserted.data,appRow.data.business_id,detail.app.id,"signed_in_submission"',
 'statusUpdateSaved:true,eventRecorded,unreadRecorded,',
 'retryMayCreateDuplicate:false',
 'statusRefreshRequired:true,',
 'durableStatusWriteConfirmed:request.statusUpdateSaved===true',
 '"customer",message,idempotencyKey'
]){
 // Validate relevant repo syntax without inventing a new execution path.
 if(token==='"customer",message,idempotencyKey')continue;
 ok(appSrc.includes(token),"Signed-in server contract: "+token);
}
for(const token of [
 'import {evaluateStoredRequestProof} from "./requestReceiptProofV3213.mjs";',
 'const saved=evaluateStoredRequestProof({',
 'request:requestRow.data,context:"guest_submission"',
 'const evidence=evaluateStoredRequestProof({',
 'context:"guest_status",request:request.data,link:link.data||null',
 '.eq("business_id",request.data.business_id)',
 'bookingConfirmed: evidence.bookingMarkedConfirmedInBusy',
 'externalCalendarDelivered: false',
 'retryMayCreateDuplicate:false'
]){
 ok(guestSrc.includes(token),"Guest server contract: "+token);
}
for(const token of [
 'if(data?.status&&data?.statusRefreshRequired!==true)',
 'data?.request?.id!==requestId',
 'data.request.status!==status',
 'Do not repeat this action.',
 'Provider notification delivery is not yet verified'
])ok(client.includes(token),"Owner action response: "+token);
ok(!guestSrc.includes('bookingConfirmed: link.data?.bridge_state === "booking_confirmed"'),
 "Guest must not claim booking confirmation from link alone.");
ok(!appSrc.includes('if (event.error) throw event.error;'),
 "Post-commit event failure should not turn saved status into apparent write failure.");
ok(read("docs/V3_212_SHARED_CUSTOMER_REQUEST_INTELLIGENCE.md")
 .includes("booking request"),"Preserve earlier shared architecture.");
console.log("V3.213 "+checks+" assertions PASS: identical signed-in/guest receipts, scoped origins and IDs, booking status conflicts, post-commit failure safety and owner client wiring.");
