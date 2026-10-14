import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {decideFreshOwnerFollowup,DRAFT}
 from "../supabase/functions/busy-mini-apps/freshOwnerFollowupV3207.mjs";
import {checkCurrentOwnerFollowup}
 from "../src/core/followupProofV3207.mjs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
let count=0;
const ok=(v,m)=>{assert.ok(v,m);count++};
const eq=(a,b,m)=>{assert.deepEqual(a,b,m);count++};
const businessId="11111111-1111-4111-8111-111111111111";
const appId="22222222-2222-4222-8222-222222222222";
const requestId="33333333-3333-4333-8333-333333333333";
const userId="44444444-4444-4444-8444-444444444444";
const id=i=>"00000000-0000-4000-8000-"+String(i).padStart(12,"0");
const nowISO="2026-10-13T10:00:00.000Z";
const row={id:requestId,business_id:businessId,mini_app_id:appId,
 request_type:"enquiry",status:"received",consumer_user_id:userId,
 request_origin:"busy_marketplace",
 created_at:"2026-10-12T08:00:00.000Z",
 updated_at:"2026-10-12T08:00:00.000Z",
 contact_email:"SENSITIVE_CUSTOMER_EMAIL",payload:{message:"PRIVATE CUSTOMER MESSAGE"}};
const m=(i,sender_role,created_at,more={})=>({
 id:id(i),business_id:businessId,mini_app_id:appId,
 request_id:requestId,sender_role,created_at,body:"SECRET_MSG",...more
});
const plan=(messages=[],overrides={})=>
 decideFreshOwnerFollowup({businessId,appId,requestId,row,messages,nowISO,...overrides});
const fresh=plan([]);
ok(fresh.ok,fresh.reason);eq(fresh.category,"needsReply");
eq(fresh.canOfferDraft,true);eq(fresh.replyDraft,DRAFT.enquiry);
eq(fresh.canAutoSend,false);eq(fresh.ownerApprovalRequired,true);
eq(fresh.independentProviderDeliveryVerified,false);
eq(fresh.confirmedAppointment,false);
eq(fresh.customerDataIncluded,false);
ok(fresh.sourceStamp.length>40);
for(const secret of ["SENSITIVE_CUSTOMER_EMAIL","PRIVATE CUSTOMER MESSAGE","SECRET_MSG",userId])
 ok(!JSON.stringify(fresh).includes(secret),"Server receipt leaked customer information");
const response={ok:true,...fresh};
const client=checkCurrentOwnerFollowup({businessId,appId,requestId,result:response});
ok(client.ok,client.reason);
eq(client.mayPrepareDraft,true);eq(client.draft,DRAFT.enquiry);
eq(client.maySendWithoutApproval,false);
eq(client.deliveryOrReadVerified,false);
eq(client.sourceStamp,fresh.sourceStamp);
eq(checkCurrentOwnerFollowup({businessId,appId,requestId,
 result:response,previousStamp:fresh.sourceStamp}).ok,true);
for(const change of [
 {businessId:id(11)},{appId:id(12)},{requestId:id(13)},
 {result:{...response,businessId:id(11)}},
 {result:{...response,appId:id(11)}},
 {result:{...response,requestId:id(11)}},
 {result:{...response,kind:"untrusted_offline_guess"}},
 {result:{...response,ownerApprovalRequired:false}},
 {result:{...response,canAutoSend:true}},
 {result:{...response,independentProviderDeliveryVerified:true}},
 {result:{...response,customerOutcomeConfirmed:true}},
 {result:{...response,sourceStamp:"not a real stamp"}},
 {result:{...response,replyDraft:""}},
 {result:{...response,canOfferDraft:false}},
 {result:{...response,category:"magic_sale"}},
 {result:{...response,why:"X".repeat(601)}}
]){
 const verdict=checkCurrentOwnerFollowup({businessId,appId,requestId,
  result:response,...change});
 eq(verdict.ok,false,"Wrong tenant, unsafe reply or fabricated evidence must be rejected.");
}
const changedStamp=checkCurrentOwnerFollowup({businessId,appId,requestId,
 result:response,previousStamp:"stale:version:before"});
eq(changedStamp.ok,false);eq(changedStamp.changedSinceReview,true);
eq(changedStamp.maySendWithoutApproval,false);
const latestOwner=plan([m(1,"business","2026-10-13T08:00:00Z")]);
ok(latestOwner.ok);eq(latestOwner.category,"waiting");
eq(latestOwner.replyDraft,null);eq(latestOwner.canOfferDraft,false);
eq(checkCurrentOwnerFollowup({businessId,appId,requestId,
 result:{ok:true,...latestOwner}}).ok,true);
const latestCustomer=plan([m(2,"customer","2026-10-13T09:00:00Z"),
 m(1,"business","2026-10-13T08:00:00Z")]);
ok(latestCustomer.ok);eq(latestCustomer.category,"needsReply");
eq(latestCustomer.latestMessageRole,"customer");
ok(latestCustomer.sourceStamp!==latestOwner.sourceStamp);
eq(checkCurrentOwnerFollowup({businessId,appId,requestId,
 result:{ok:true,...latestCustomer},previousStamp:latestOwner.sourceStamp}).ok,false);
const raced=plan([m(2,"customer","2026-10-13T09:00:00Z"),
 m(1,"business","2026-10-13T09:00:00Z")]);
eq(raced.category,"unknown");eq(raced.replyDraft,null);
eq(raced.canOfferDraft,false);
ok(raced.why.includes("share a timestamp"));
const reversed=plan([m(1,"business","2026-10-13T08:00:00Z"),
 m(2,"customer","2026-10-13T09:00:00Z")]);
eq(reversed.category,"unknown");eq(reversed.canOfferDraft,false);
const acceptedBooking=plan([],{row:{...row,request_type:"booking_request",status:"accepted"}});
eq(acceptedBooking.category,"manual");eq(acceptedBooking.replyDraft,null);
const booking=plan([],{row:{...row,request_type:"booking_request"}});
eq(booking.category,"needsReply");eq(booking.replyDraft,DRAFT.booking_request);
ok(booking.replyDraft.includes("before confirming"));
const guest=plan([],{row:{...row,request_origin:"guest_web"}});
eq(guest.category,"manual");eq(guest.canOfferDraft,false);
const anonymous=plan([],{row:{...row,consumer_user_id:null}});
eq(anonymous.category,"manual");
for(const state of ["closed","declined"]){
 const terminal=plan([],{row:{...row,status:state}});
 eq(terminal.category,"closed");eq(terminal.canOfferDraft,false);
}
const priorToRequest=plan([m(1,"business","2026-10-11T10:00:00Z")]);
eq(priorToRequest.category,"unknown");
const badTime=plan([],{row:{...row,updated_at:"nonsense"}});
eq(badTime.category,"unknown");
const future=plan([m(1,"customer","2099-10-12T00:00:00Z")]);
eq(future.category,"unknown");
const lastModified=plan([],{row:{...row,updated_at:"2026-10-13T09:30:00Z"}});
ok(lastModified.sourceStamp!==fresh.sourceStamp);
for(const change of [
 {businessId:id(22)},
 {appId:id(22)},
 {requestId:id(22)},
 {row:{...row,business_id:id(22)}},
 {row:{...row,mini_app_id:id(22)}},
 {row:{...row,request_type:"paid_conversion"}},
 {row:{...row,status:"booking_confirmed"}},
 {messages:[m(1,"customer",nowISO,{business_id:id(22)})]},
 {messages:[m(1,"customer",nowISO,{mini_app_id:id(22)})]},
 {messages:[m(1,"customer",nowISO,{request_id:id(22)})]},
 {messages:[m(1,"provider",nowISO)]},
 {messages:[m(1,"customer",nowISO),m(1,"customer",nowISO)]},
 {messages:[m(1,"customer",nowISO),m(2,"customer",nowISO),m(3,"customer",nowISO)]},
 {nowISO:"invalid"}
]){
 const verdict=plan([],{...change});
 eq(verdict.ok,false);eq(verdict.canOfferDraft,false);
}
const edge=read("supabase/functions/busy-mini-apps/index.ts");
const ui=read("src/screens/miniApps.js");
const controller=read("src/app/AppController.js");
const helper=read("src/core/followupProofV3207.mjs");
for(const pattern of [
 'async function currentOwnerFollowup(businessId:string,body:any)',
 'readCurrentOwnerFollowupV3235({',
 'if (action === "owner_followup_check")',
 'if(!["owner","admin"].includes(member.role))',
 '...(await currentOwnerFollowup(resolvedBusinessId,body))'
])ok(edge.includes(pattern),"Edge owner-only route lost: "+pattern);
const readback=read("supabase/functions/busy-mini-apps/ownerFollowupReadbackV3235.mjs");
for(const pattern of [
 '.select("id,business_id,mini_app_id,request_type,status,request_origin,consumer_user_id,created_at,updated_at")',
 '.eq("business_id",businessId).eq("mini_app_id",appId)',
 '.eq("request_id",requestId)',
 '.limit(2)',
 'classifyOwnerOutcomeEvidenceV3235',
 'return {...decision,nextAction,outcomeEvidence};'
])ok(readback.includes(pattern),"Extracted genuine owner-scoped readback lost: "+pattern);
for(const pattern of [
 'const checkOwnerFollowup=async(',
 '"owner_followup_check"',
 'const prepareVerifiedOwnerFollowupDraft=async(',
 'previousStamp:expectedStamp',
 'liveOwnerFollowupScopeRef.current!==scope',
 'setOwnerFollowupReview(null);',
 'checkOwnerFollowup,',
 'prepareVerifiedOwnerFollowupDraft,'
])ok(controller.includes(pattern),"App Controller missing real refreshed approval: "+pattern);
for(const pattern of [
 's.checkOwnerFollowup(request.id)',
 's.prepareVerifiedOwnerFollowupDraft(',
 '"Check latest conversation"',
 '"Recheck and use draft"',
 '"Keep my text"',
 'Nothing will be sent.',
 's.ownerFollowupReview.businessId===request.business_id'
])ok(ui.includes(pattern),"Owner UI must independently review current conversation: "+pattern);
ok(!ui.includes("setDraft(followUpSuggestion.replyDraft)"));
ok(helper.includes("previousStamp!==result.sourceStamp"));
console.log("V3.207 "+count+" owner-specific latest-reply checks, stale review blocking, tenant scope, guest/booking safety and manual UI PASS.");
