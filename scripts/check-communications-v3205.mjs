import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {classifyMessageReceipt,validateMessageReceiptContext}
 from "../supabase/functions/busy-mini-apps/messageReceiptV3205.mjs";
import {classifyOwnerInboxReceipt}
 from "../supabase/functions/busy-mini-apps/ownerInboxReceiptV3205.mjs";
import {reviewCommunicationOutcome}
 from "../src/core/requestCommunicationOutcomeV3205.mjs";
import {recoverExactSavedReply}
 from "../src/core/recoverSavedReplyV3205.mjs";
import {prepareDurableMessageAttempt}
 from "../src/core/durableMessageRetryV3185.mjs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const eq=(a,b,m)=>{assert.deepEqual(a,b,m);count++};
const ok=(v,m)=>{assert.ok(v,m);count++};
let count=0;
const owner="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
 customer="bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
 other="cccccccc-cccc-4ccc-8ccc-cccccccccccc",
 business="11111111-1111-4111-8111-111111111111",
 otherBusiness="22222222-2222-4222-8222-222222222222",
 app="33333333-3333-4333-8333-333333333333",
 request="44444444-4444-4444-8444-444444444444",
 messageId="55555555-5555-4555-8555-555555555555",
 outboxId="66666666-6666-4666-8666-666666666666";
const key="mini-app-owner-reply-001234567",body="Please confirm your availability";
const context={actorUserId:owner,businessId:business,
 requestId:request,role:"business",key,body};
const msg={id:messageId,request_id:request,business_id:business,
 mini_app_id:app,sender_user_id:owner,sender_role:"business",
 idempotency_key:key,body,contact_email:"SENSITIVE_CONTACT"};
const out={id:outboxId,message_id:messageId,request_id:request,
 business_id:business,mini_app_id:app,recipient_role:"customer",
 state:"pending",provider_delivery_verified:false};
ok(validateMessageReceiptContext(context).ok);
const positive=classifyMessageReceipt({...context,message:msg,outbox:out});
ok(positive.ok);
eq(positive.found,true);
eq(positive.messageSavedVerified,true);
eq(positive.deliveryIntentRecorded,true);
eq(positive.deliveryIntentState,"pending");
eq(positive.notificationDeliveredVerified,false);
eq(positive.providerSubmissionVerified,false);
eq(positive.appointmentConfirmed,false);
eq(positive.retryWillNotBeAutoSent,true);
for(const secret of [body,key,owner,customer,"SENSITIVE_CONTACT"])
 ok(!JSON.stringify(positive).includes(secret));
for(const bad of [
 {actorUserId:other},
 {businessId:otherBusiness},
 {requestId:other},
 {role:"customer"},
 {key:"another-valid-reply-key"},
 {body:"Edited message"},
 {body:" "+body},
 {body:""},
 {message:{...msg,business_id:otherBusiness}},
 {message:{...msg,mini_app_id:"oops"}},
 {message:{...msg,request_id:other}},
 {message:{...msg,sender_user_id:customer}},
 {message:{...msg,sender_role:"customer"}},
 {message:{...msg,idempotency_key:"different"}},
 {message:{...msg,body:"Different answer"}},
 {outbox:{...out,message_id:other}},
 {outbox:{...out,business_id:otherBusiness}},
 {outbox:{...out,recipient_role:"business"}},
 {outbox:{...out,state:"delivered"}},
 {outbox:{...out,provider_delivery_verified:true}},
 ]){
 const r=classifyMessageReceipt({...context,message:msg,outbox:out,...bad});
 eq(r.ok,false,"Invalid scoped message evidence must fail closed.");
}
const absent=classifyMessageReceipt({...context,message:null,outbox:null});
ok(absent.ok);eq(absent.found,false);eq(absent.canRetrySameText,true);
eq(absent.messageSavedVerified,false);
const pendingNoOut=classifyMessageReceipt({...context,message:msg,outbox:null});
ok(pendingNoOut.ok);eq(pendingNoOut.deliveryIntentRecorded,false);
eq(pendingNoOut.notificationDeliveredVerified,false);
const pushed=classifyMessageReceipt({...context,message:msg,
 outbox:{...out,state:"submitted_unverified"}});
ok(pushed.ok);
eq(pushed.notificationSubmissionAttemptRecorded,true);
eq(pushed.notificationDeliveredVerified,false);
const noPush=classifyMessageReceipt({...context,message:msg,
 outbox:{...out,state:"no_submission_evidence"}});
ok(noPush.ok);eq(noPush.providerSubmissionVerified,false);
const customerContext={...context,actorUserId:customer,businessId:"",
 role:"customer",key:"customer-reply-001234567",body:"Thanks"};
const customerMsg={...msg,sender_user_id:customer,sender_role:"customer",
 idempotency_key:customerContext.key,body:"Thanks"};
const customerOut={...out,recipient_role:"business"};
const customerProof=classifyMessageReceipt({...customerContext,
 message:customerMsg,outbox:customerOut});
ok(customerProof.ok);
eq(customerProof.messageSavedVerified,true);
const inboxRow={id:request,business_id:business,mini_app_id:app,
 request_type:"booking_request",status:"received",payload:{email:"SECRET"}};
const inbox=classifyOwnerInboxReceipt({businessId:business,appId:app,
 requestId:request,membershipRole:"owner",row:inboxRow});
ok(inbox.ok);
eq(inbox.reachedCorrectBusinessVerified,true);
eq(inbox.ownerActuallyNotified,false);
eq(inbox.notificationDeliveredVerified,false);
ok(!JSON.stringify(inbox).includes("SECRET"));
const missingInbox=classifyOwnerInboxReceipt({businessId:business,appId:app,
 requestId:request,membershipRole:"admin",row:null});
ok(missingInbox.ok);eq(missingInbox.found,false);
eq(missingInbox.cannotInferMissingFromThirtyRowPage,true);
for(const changed of [
 {businessId:otherBusiness},{appId:other},
 {requestId:other},{membershipRole:"member"},
 {membershipRole:""},{row:{...inboxRow,business_id:otherBusiness}},
 {row:{...inboxRow,mini_app_id:other}},
 {row:{...inboxRow,id:other}},
 {row:{...inboxRow,status:"confirmed_via_magic"}}
])eq(classifyOwnerInboxReceipt({businessId:business,appId:app,
 requestId:request,membershipRole:"owner",row:inboxRow,...changed}).ok,false);
const inbound=reviewCommunicationOutcome({kind:"owner_inbox",
 businessId:business,appId:app,requestId:request,receipt:{ok:true,...inbox}});
ok(inbound.ok);
eq(inbound.requestReceivedByBusiness,true);
eq(inbound.ownerActuallyNotified,false);
eq(inbound.appointmentConfirmed,false);
const recovered=reviewCommunicationOutcome({kind:"owner_reply",
 requestId:request,receipt:{ok:true,...positive}});
ok(recovered.ok);
eq(recovered.messageSaved,true);
eq(recovered.messageDelivered,false);
eq(recovered.customerSawNotification,false);
eq(recovered.recipientReadVerified,false);
eq(recovered.automaticRetryAuthorised,false);
const recoveredCustomer=reviewCommunicationOutcome({kind:"customer_reply",
 requestId:request,receipt:{ok:true,...customerProof}});
ok(recoveredCustomer.ok);
eq(recoveredCustomer.role,"customer");
for(const wrong of [
 {requestId:other},
 {receipt:{...positive,ok:false}},
 {receipt:{...positive,found:false}},
 {receipt:{...positive,messageSavedVerified:false}},
 {receipt:{...positive,notificationDeliveredVerified:true}},
 {receipt:{...positive,requestId:other}},
])eq(reviewCommunicationOutcome({kind:"owner_reply",
 requestId:request,receipt:{...positive,ok:true},...wrong}).ok,false);
const slots=new Map();
const storage={
 getItemAsync:async k=>slots.get(k)||null,
 setItemAsync:async(k,v)=>{slots.set(k,v)},
 deleteItemAsync:async k=>{slots.delete(k)}
};
const prepared=await prepareDurableMessageAttempt(storage,{
 actorUserId:owner,businessId:business,requestId:request,
 role:"business",message:body
},()=>key);
ok(prepared.ok);eq(slots.size,1);
let reads=0;
const recovery=await recoverExactSavedReply({
 storage,attempt:prepared,requestId:request,body,role:"business",
 checkReceipt:async fields=>{
  reads++;
  eq(fields.requestKey,key);eq(fields.message,body);
  return {ok:true,...positive};
 }
});
ok(recovery.ok);eq(recovery.verifiedSaved,true);eq(recovery.secureRetryReferenceCleared,true);
eq(recovery.mayResendAutomatically,false);
eq(recovery.notificationDeliveredVerified,false);
eq(slots.size,0);eq(reads,1);
const newPending=await prepareDurableMessageAttempt(storage,{
 actorUserId:owner,businessId:business,requestId:request,
 role:"business",message:body
},()=>key);
ok(newPending.ok);
const noMatch=await recoverExactSavedReply({
 storage,attempt:newPending,requestId:request,body,role:"business",
 checkReceipt:async()=>({ok:true,found:false,messageSavedVerified:false})
});
eq(noMatch.ok,false);eq(slots.size,1);
const broken=await recoverExactSavedReply({
 storage,attempt:newPending,requestId:request,body,role:"business",
 checkReceipt:async()=>{throw Error("connection lost")}
});
eq(broken.ok,false);eq(slots.size,1);
const conflicting=await recoverExactSavedReply({
 storage,attempt:newPending,requestId:request,body,role:"business",
 checkReceipt:async()=>({ok:true,...positive,requestId:other})
});
eq(conflicting.ok,false);eq(slots.size,1);
const edge=read("supabase/functions/busy-mini-apps/index.ts");
const ctl=read("src/app/AppController.js");
const screen=read("src/screens/miniApps.js");
for(const pattern of [
 'async function exactMessageReceipt(',
 '.eq("consumer_user_id",actorUserId)',
 '.eq("idempotency_key",key).maybeSingle()',
 '.eq("message_id",stored.data.id).maybeSingle()',
 'if (action === "customer_message_receipt")',
 'if (action === "owner_message_receipt")',
 'if (action === "owner_inbox_receipt")',
 'if(!["owner","admin"].includes(member.role))',
 '...(await exactOwnerInboxReceipt('
])ok(edge.includes(pattern),"Missing signed-in server rule: "+pattern);
ok(edge.indexOf('if (action === "customer_message_receipt")')<
 edge.indexOf('const writeActions = new Set('));
ok(edge.indexOf('if (action === "owner_message_receipt")')>
 edge.indexOf('const member = await membership('));
for(const pattern of [
 'prepareDurableMessageAttempt(SecureStore',
 'recoverExactSavedReply({',
 '"owner_message_receipt"',
 '"customer_message_receipt"',
 '"owner_inbox_receipt"',
 'verifyOwnerRequestInbox=async',
 'latestCommunicationEvidence,',
 'clearDurableMessageAttempt(SecureStore,attempt)'
])ok(ctl.includes(pattern),"Missing real controller path: "+pattern);
ok(screen.includes("Verify this request in my inbox"));
ok(screen.includes('s.latestCommunicationEvidence.requestId===request.id'));
ok(screen.includes("A saved record is not proof"));
console.log("V3.205 "+count+" scoped owner-inbox, atomic reply recovery, provider evidence and no resend assertions PASS.");
