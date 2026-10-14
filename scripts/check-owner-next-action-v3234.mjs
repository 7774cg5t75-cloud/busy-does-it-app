/**
 * V3.234 source-only complete chain:
 * fresh owner-scoped DB conversation -> bounded BUSY next action ->
 * strict client stamp binding -> one reviewable suggestion.
 * No hosted database, notifications, JWT claims, or paid AI build.
 */
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {execFileSync} from "node:child_process";
import {decideFreshOwnerFollowup}
 from "../supabase/functions/busy-mini-apps/freshOwnerFollowupV3207.mjs";
import {chooseOwnerConversationActionV3234 as suggest}
 from "../supabase/functions/busy-mini-apps/ownerConversationActionV3234.mjs";
import {verifyOwnerNextStepV3234 as verify}
 from "../src/core/followupNextActionV3234.mjs";
import {checkCurrentOwnerFollowup as check}
 from "../src/core/followupProofV3207.mjs";
let n=0;const eq=(a,b,m)=>{assert.deepEqual(a,b,m);n++};
const ok=(v,m)=>{assert.ok(v,m);n++};
const B="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const A="bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const R="cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const U="dddddddd-dddd-4ddd-8ddd-dddddddddddd";
const NOW="2026-10-14T22:20:00.000Z";
const row=(more={})=>({id:R,business_id:B,mini_app_id:A,
 request_type:"enquiry",request_origin:"busy_marketplace",
 consumer_user_id:U,status:"received",
 created_at:"2026-10-12T11:00:00.000Z",
 updated_at:"2026-10-14T22:00:00.000Z",...more});
const msg=(id,role,at)=>({id,business_id:B,mini_app_id:A,
 request_id:R,sender_role:role,created_at:at});
const run=(request=row(),messages=[])=>{
 const follow=decideFreshOwnerFollowup({
  businessId:B,appId:A,requestId:R,row:request,messages,nowISO:NOW
 });
 ok(follow.ok,follow.reason);
 const action=suggest({businessId:B,appId:A,requestId:R,
  decision:follow,request,nowISO:NOW});
 ok(action.ok,action.reason);
 const proof=verify({businessId:B,appId:A,requestId:R,
  decision:follow,nextAction:action});
 ok(proof.ok,proof.reason);
 const rendered=check({businessId:B,appId:A,requestId:R,
  result:{...follow,nextAction:action,ok:true}});
 ok(rendered.ok,rendered.reason);
 eq(rendered.nextStep.action,action.action);
 eq(rendered.nextStep.sourceStamp,follow.sourceStamp);
 eq(rendered.nextStep.maySend,false);
 eq(rendered.maySendWithoutApproval,false);
 eq(action.customerNotified,false);
 eq(action.mayConfirmBooking,false);
 eq(action.mayCharge,false);
 eq(action.externalDeliveryVerified,false);
 return {follow,action,proof,rendered};
};
const newCustomer=run();
eq(newCustomer.follow.category,"needsReply");
eq(newCustomer.action.action,"prepare_owner_reply");
eq(newCustomer.action.urgency,"attention");
eq(newCustomer.action.hoursSinceLatestRecordedActivity,59);
eq(newCustomer.rendered.nextStep.ownerApprovalRequired,true);
const latestCustomer=run(row(),[msg("eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
 "customer","2026-10-14T22:00:00.000Z")]);
eq(latestCustomer.action.urgency,"normal");
eq(latestCustomer.action.hoursSinceLatestRecordedActivity,0);
const ownerLast=run(row(),[msg("eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
 "business","2026-10-14T16:00:00.000Z")]);
eq(ownerLast.action.action,"wait_for_customer");
eq(ownerLast.action.urgency,"none");
eq(ownerLast.action.ownerApprovalRequired,true);
const guest=run(row({request_origin:"guest_web",consumer_user_id:null}));
eq(guest.action.action,"review_guest_contact");
eq(guest.action.hasCustomerContact,false);
const bookingPending=run(row({request_type:"booking_request"}));
eq(bookingPending.action.action,"prepare_owner_reply");
ok(bookingPending.action.explanation.includes("before promising a time"));
const bookingAccepted=run(row({request_type:"booking_request",status:"accepted"}));
eq(bookingAccepted.action.action,"verify_work_booking");
eq(bookingAccepted.action.mayConfirmBooking,false);
const closed=run(row({status:"closed"}));
eq(closed.action.action,"no_followup");eq(closed.action.urgency,"none");
const declined=run(row({status:"declined"}));
eq(declined.action.action,"no_followup");
const tied=run(row(),[
 msg("eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee","customer","2026-10-13T10:00:00.000Z"),
 msg("ffffffff-ffff-4fff-8fff-ffffffffffff","business","2026-10-13T10:00:00.000Z")
]);
eq(tied.action.action,"refresh_conversation");
eq(tied.follow.category,"unknown");
// This status read is new, but the last customer message is old.
const oldConversation=run(row({updated_at:"2026-10-14T22:19:59.000Z"}));
eq(oldConversation.action.urgency,"attention");
eq(oldConversation.action.hoursSinceLatestRecordedActivity,59);
for(const wrong of [
 {businessId:U,appId:A,requestId:R,decision:newCustomer.follow,
  nextAction:newCustomer.action},
 {businessId:B,appId:U,requestId:R,decision:newCustomer.follow,
  nextAction:newCustomer.action},
 {businessId:B,appId:A,requestId:U,decision:newCustomer.follow,
  nextAction:newCustomer.action},
 {businessId:B,appId:A,requestId:R,decision:newCustomer.follow,
  nextAction:{...newCustomer.action,maySend:true}},
 {businessId:B,appId:A,requestId:R,decision:newCustomer.follow,
  nextAction:{...newCustomer.action,mayCharge:true}},
 {businessId:B,appId:A,requestId:R,decision:newCustomer.follow,
  nextAction:{...newCustomer.action,customerNotified:true}},
 {businessId:B,appId:A,requestId:R,decision:newCustomer.follow,
  nextAction:{...newCustomer.action,basedOnCurrentSourceStamp:"stale"}},
 {businessId:B,appId:A,requestId:R,decision:newCustomer.follow,
  nextAction:{...newCustomer.action,action:"verify_work_booking"}},
]){
 const x=verify(wrong);eq(x.ok,false);eq(x.maySend,false);
 eq(x.mayConfirmBooking,false);
}
const nowStale=check({businessId:B,appId:A,requestId:R,
 result:{ok:true,...newCustomer.follow,nextAction:{
  ...newCustomer.action,basedOnCurrentSourceStamp:"another"}}});
eq(nowStale.ok,false);
const source=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const edge=source("supabase/functions/busy-mini-apps/index.ts");
const extracted=source("supabase/functions/busy-mini-apps/ownerFollowupReadbackV3235.mjs");
ok(edge.includes("readCurrentOwnerFollowupV3235({"));
ok(extracted.includes("chooseOwnerConversationActionV3234({"));
ok(extracted.includes("if(!nextAction.ok)throw Error(nextAction.reason)"));
ok(extracted.includes("return {...decision,nextAction,outcomeEvidence};"));
ok(extracted.includes('.limit(2)'));
ok(extracted.includes('.eq("business_id",businessId)'));
ok(edge.includes('if (action === "owner_followup_check")'));
ok(edge.includes('if(!["owner","admin"].includes(member.role))'));
ok(edge.includes("guardReviewedOwnerSend({"));
const screen=source("src/screens/miniApps.js");
ok(screen.includes('eyebrow="BUSY suggests"'));
ok(screen.includes("s.ownerFollowupReview.nextStep.title"));
ok(screen.includes("s.ownerFollowupReview.nextStep.explanation"));
ok(screen.includes("BUSY has not contacted the customer or confirmed a booking."));
ok(screen.includes("Use as an editable draft"));
ok(screen.includes("Nothing is sent automatically"));
const proof=source("src/core/followupProofV3207.mjs");
ok(proof.includes("verifyOwnerNextStepV3234"));
ok(proof.includes("nextStep:nextStep?.ok?nextStep:null"));
const fresh=source("supabase/functions/busy-mini-apps/freshOwnerFollowupV3207.mjs");
ok(fresh.includes("latestRecordedActivityAt:latestTime"));
execFileSync(process.execPath,["scripts/prepare-followup-staging-v3234.mjs"],{stdio:"pipe"});
const packet=JSON.parse(readFileSync("/tmp/bdi-v3234-followup-stage/review.json","utf8"));
eq(packet.inheritedOriginalJWTScenarios.length,11);
eq(packet.inheritedBookingScenarios.length,11);
eq(packet.extraFollowupScenarios.length,12);
eq(packet.countVersionedMigrations,69);
ok(packet.extraFollowupScenarios.every(x=>x.status==="not_verified"));
ok(packet.sourceHashes.every(x=>/^[0-9a-f]{64}$/.test(x.sha256)));
for(const field of ["ownerApprovedInstallation","realJWTVerified","realBackupsRestored",
 "realBrowserJourneyVerified","hostedSqlApplied","externalProviderCalled",
 "realCustomersContacted","paidBuildTriggered","mayDeploy","mayAutoSend"])
 eq(packet[field],false);
console.log("V3.234: "+n+" owner action, draft approval, privacy, freshness, source and staging assertions passed.");
