import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {guardReviewedOwnerSend,validateOwnerReplyAfterSave}
 from "../supabase/functions/busy-mini-apps/reviewedOwnerSendV3208.mjs";
import {interpretSavedOwnerReply}
 from "../src/core/reviewedReplyProofV3208.mjs";
import {decideFreshOwnerFollowup}
 from "../supabase/functions/busy-mini-apps/freshOwnerFollowupV3207.mjs";
import {checkCurrentOwnerFollowup}
 from "../src/core/followupProofV3207.mjs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
let checks=0;
const eq=(x,y,m)=>{assert.deepEqual(x,y,m);checks++};
const ok=(x,m)=>{assert.ok(x,m);checks++};
const businessId="11111111-1111-4111-8111-111111111111";
const appId="22222222-2222-4222-8222-222222222222";
const requestId="33333333-3333-4333-8333-333333333333";
const userId="44444444-4444-4444-8444-444444444444";
const messageId="55555555-5555-4555-8555-555555555555";
const message2="66666666-6666-4666-8666-666666666666";
const row={id:requestId,business_id:businessId,mini_app_id:appId,
 request_type:"enquiry",status:"received",request_origin:"busy_marketplace",
 consumer_user_id:userId,created_at:"2026-10-12T08:00:00Z",
 updated_at:"2026-10-12T08:00:00Z",
 contact_email:"PRIVATE_EMAIL",payload:{message:"PRIVATE_MESSAGE"}};
const at="2026-10-13T10:00:00.000Z";
const m=(id,sender_role,created_at)=>({id,
 business_id:businessId,mini_app_id:appId,request_id:requestId,
 sender_role,created_at,body:"DO_NOT_LEAK"});
const before=decideFreshOwnerFollowup({businessId,appId,requestId,
 row,messages:[],nowISO:at});
ok(before.ok);eq(before.category,"needsReply");
const checked=checkCurrentOwnerFollowup({businessId,appId,requestId,
 result:{ok:true,...before}});
ok(checked.ok);
const guard=guardReviewedOwnerSend({businessId,appId,requestId,
 expectedSourceStamp:checked.sourceStamp,fresh:{ok:true,...before}});
ok(guard.ok);eq(guard.maySend,true);
eq(guard.ownerApprovalStillRequired,true);
eq(guard.atomicCompareAndSend,false);
eq(guard.anotherMessageMayRace,true);
eq(guard.transactionalWriteHasNotHappened,true);
eq(guard.customerDeliveryVerified,false);
const lastCustomer=decideFreshOwnerFollowup({businessId,appId,requestId,row,
 messages:[m(message2,"customer","2026-10-13T09:00:00Z")],nowISO:at});
eq(lastCustomer.category,"needsReply");
eq(guardReviewedOwnerSend({businessId,appId,requestId,
 expectedSourceStamp:before.sourceStamp,
 fresh:{ok:true,...lastCustomer}}).ok,false);
const latestOwner=decideFreshOwnerFollowup({businessId,appId,requestId,row,
 messages:[m(messageId,"business","2026-10-13T09:00:00Z")],nowISO:at});
eq(latestOwner.category,"waiting");
const refusal=guardReviewedOwnerSend({businessId,appId,requestId,
 expectedSourceStamp:latestOwner.sourceStamp,
 fresh:{ok:true,...latestOwner}});
eq(refusal.ok,false);eq(refusal.staleOrUnsupported,true);
const closed=decideFreshOwnerFollowup({businessId,appId,requestId,
 row:{...row,status:"closed"},messages:[],nowISO:at});
eq(guardReviewedOwnerSend({businessId,appId,requestId,
 expectedSourceStamp:closed.sourceStamp,fresh:{ok:true,...closed}}).ok,false);
const guest=decideFreshOwnerFollowup({businessId,appId,requestId,
 row:{...row,request_origin:"guest_web"},messages:[],nowISO:at});
eq(guardReviewedOwnerSend({businessId,appId,requestId,
 expectedSourceStamp:guest.sourceStamp,fresh:{ok:true,...guest}}).ok,false);
const accepted=decideFreshOwnerFollowup({businessId,appId,requestId,
 row:{...row,request_type:"booking_request",status:"accepted"},
 messages:[],nowISO:at});
eq(guardReviewedOwnerSend({businessId,appId,requestId,
 expectedSourceStamp:accepted.sourceStamp,
 fresh:{ok:true,...accepted}}).ok,false);
for(const change of [
 {businessId:userId},{appId:userId},{requestId:userId},
 {expectedSourceStamp:"short"},
 {expectedSourceStamp:"f".repeat(601)},
 {fresh:null},
 {fresh:{...before,ok:false}},
 {fresh:{ok:true,...before,kind:"untrusted"}},
 {fresh:{ok:true,...before,businessId:userId}},
 {fresh:{ok:true,...before,appId:userId}},
 {fresh:{ok:true,...before,requestId:userId}},
 {fresh:{ok:true,...before,ownerApprovalRequired:false}},
 {fresh:{ok:true,...before,canAutoSend:true}},
 {fresh:{ok:true,...before,independentProviderDeliveryVerified:true}},
 {fresh:{ok:true,...before,customerOutcomeConfirmed:true}},
 {fresh:{ok:true,...before,canOfferDraft:false}},
]){
 const result=guardReviewedOwnerSend({businessId,appId,requestId,
 expectedSourceStamp:before.sourceStamp,
 fresh:{ok:true,...before},...change});
 eq(result.ok,false,"A stale or unsafe owner-reviewed reply must be blocked.");
 eq(result.maySend,false);
}
const sent={databaseMessageSaved:true,message:{id:messageId},
 providerDeliveryVerified:false};
const after=decideFreshOwnerFollowup({businessId,appId,requestId,row,
 messages:[m(messageId,"business","2026-10-13T09:00:00Z")],nowISO:at});
const complete=validateOwnerReplyAfterSave({businessId,appId,requestId,
 sent,current:{ok:true,...after}});
ok(complete.ok);eq(complete.databaseReplySaved,true);
eq(complete.freshRequestReadbackVerified,true);
eq(complete.lastRecordedMessageIsBusiness,true);
eq(complete.noFurtherReplySuggested,true);
eq(complete.externalNotificationDelivered,false);
eq(complete.customerReadReply,false);eq(complete.jobFinished,false);
eq(complete.convertedToSale,false);
ok(!JSON.stringify(complete).includes("PRIVATE_EMAIL"));
ok(!JSON.stringify(complete).includes("PRIVATE_MESSAGE"));
const ui=interpretSavedOwnerReply({businessId,appId,requestId,
 response:{ok:true,...sent,postSendEvidence:complete}});
ok(ui.ok);eq(ui.waitingForCustomerAtReadback,true);
eq(ui.messageDelivered,false);eq(ui.diaryBookingConfirmed,false);
eq(ui.businessBrainEvidenceLevel,"saved_owner_reply_plus_fresh_readback");
ok(ui.summary.includes("last recorded"));
const noRead=validateOwnerReplyAfterSave({businessId,appId,requestId,
 sent,current:null});
ok(noRead.ok);eq(noRead.freshRequestReadbackVerified,false);
eq(noRead.noFurtherReplySuggested,false);
const uiNoRead=interpretSavedOwnerReply({businessId,appId,requestId,
 response:{ok:true,...sent,postSendEvidence:noRead}});
ok(uiNoRead.ok);eq(uiNoRead.waitingForCustomerAtReadback,false);
eq(uiNoRead.businessBrainEvidenceLevel,"saved_owner_reply");
const newCustomer=decideFreshOwnerFollowup({businessId,appId,requestId,row,
 messages:[m(message2,"customer","2026-10-13T09:30:00Z"),
 m(messageId,"business","2026-10-13T09:00:00Z")],nowISO:at});
const change=validateOwnerReplyAfterSave({businessId,appId,requestId,
 sent,current:{ok:true,...newCustomer}});
eq(change.noFurtherReplySuggested,false);
const changedProof=interpretSavedOwnerReply({businessId,appId,requestId,
 response:{ok:true,...sent,postSendEvidence:change}});
eq(changedProof.waitingForCustomerAtReadback,false);
for(const change of [
 {businessId:userId},{appId:userId},{requestId:userId},
 {response:null},
 {response:{ok:false,...sent,postSendEvidence:complete}},
 {response:{ok:true,databaseMessageSaved:false,message:{id:messageId}}},
 {response:{ok:true,databaseMessageSaved:true,message:{id:"invalid"}}}
]){
 const verdict=interpretSavedOwnerReply({businessId,appId,requestId,
 response:{ok:true,...sent,postSendEvidence:complete},...change});
 eq(verdict.ok,false);
}
const badRead=interpretSavedOwnerReply({businessId,appId,requestId,
 response:{ok:true,...sent,postSendEvidence:{...complete,appId:userId}}});
ok(badRead.ok);eq(badRead.waitingForCustomerAtReadback,false);
const fraudulent=interpretSavedOwnerReply({businessId,appId,requestId,
 response:{ok:true,...sent,postSendEvidence:{...complete,externalNotificationDelivered:true}}});
ok(fraudulent.ok);eq(fraudulent.waitingForCustomerAtReadback,false);
const edge=read("supabase/functions/busy-mini-apps/index.ts");
const controller=read("src/app/AppController.js");
const screen=read("src/screens/miniApps.js");
for(const str of [
 'import {guardReviewedOwnerSend,validateOwnerReplyAfterSave}',
 'const reviewedStamp=body?.reviewedFollowupStamp;',
 'const fresh=await currentOwnerFollowup(businessId,{requestId});',
 'const guarded=guardReviewedOwnerSend({',
 'if(!guarded.ok)throw Error(guarded.reason);',
 'const saved=await sendAtomicConversation(supabase,{',
 'if(body?.reviewedFollowupStamp!==undefined&&',
 'postSendEvidence=validateOwnerReplyAfterSave({',
 'statusRefreshRequired:true'
])ok(edge.includes(str),"Missing trusted pre-send or post-send server path "+str);
const locGuard=edge.indexOf("const guarded=guardReviewedOwnerSend({");
const locWrite=edge.indexOf("const saved=await sendAtomicConversation(supabase,{",locGuard);
ok(locGuard>=0&&locWrite>locGuard);
for(const str of [
 'import {interpretSavedOwnerReply}',
 'sourceStamp:verified.sourceStamp,',
 'reviewedFollowupStamp=null',
 '...(reviewedFollowupStamp!==null?{reviewedFollowupStamp}:{})',
 'const verifiedPostSend=interpretSavedOwnerReply({',
 'setOwnerFollowupReview(null);',
 'verifiedPostSend.waitingForCustomerAtReadback'
])ok(controller.includes(str),"App Controller missing verified owner send path "+str);
for(const str of [
 'const [reviewedReplyStamp,setReviewedReplyStamp]',
 'setReviewedReplyStamp({',
 'sourceStamp:confirmed.sourceStamp',
 '{reviewedFollowupStamp:stamp}',
 'setReviewedReplyStamp(null);',
 'Busy will check the latest customer conversation once'
])ok(screen.includes(str),"Owner screen missing explicit stamped send "+str);
ok(!edge.includes("atomicCompareAndSend:true"));
console.log("V3.208 "+checks+" pre-send freshness, post-save readback, wrong-tenant and unverified delivery safeguards PASS.");
