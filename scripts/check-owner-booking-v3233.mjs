/**
 * V3.233: Work-screen cancellation cannot bypass the original Work CAS.
 * Read-only owner revision / simple owner request actions are pure policies;
 * PostgreSQL 17 still tests transactional closure, and hosted Auth/JWT has
 * deliberately NOT been exercised or approved.
 */
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {execFileSync} from "node:child_process";
import {classifyBookingRevisionV3233 as server}
 from "../supabase/functions/busy-mini-apps/ownerBookingRevisionV3233.mjs";
import {assessBookingCancelReadbackV3233 as client}
 from "../src/core/bookingCancelReadbackV3233.mjs";
import {ownerRequestActionsV3233 as actions}
 from "../src/core/ownerRequestActionsV3233.mjs";
const B="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const A="bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const R="cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const OTHER="dddddddd-dddd-4ddd-8ddd-dddddddddddd";
const time="2026-10-14T22:05:00.123456+00:00";
let count=0;
const eq=(x,y)=>{assert.deepEqual(x,y);count++};
const ok=(x,msg)=>{assert.ok(x,msg);count++};
const request=(status)=>({id:R,business_id:B,mini_app_id:A,
 request_type:"booking_request",status,updated_at:time});
const link=(bridge_state)=>({request_id:R,business_id:B,bridge_state});
const work=(state)=>({request_id:R,business_id:B,state});
const draft=server({businessId:B,appId:A,requestId:R,
 request:request("reviewing"),link:link("booking_draft")});
eq(draft.ok,true);eq(draft.mayClose,true);
eq(draft.workLedgerState,"not_applicable");
const confirmed=server({businessId:B,appId:A,requestId:R,
 request:request("accepted"),link:link("booking_confirmed"),
 work:work("confirmed")});
eq(confirmed.ok,true);eq(confirmed.status,"accepted");
eq(confirmed.customerNotified,false);eq(confirmed.calendarDelivered,false);
eq(confirmed.ownerApprovalRequired,true);eq(confirmed.readOnly,true);
const closed=server({businessId:B,appId:A,requestId:R,
 request:request("closed"),link:link("closed"),work:work("cancelled")});
eq(closed.ok,true);eq(closed.alreadyClosed,true);eq(closed.mayClose,false);
for(const val of [
 {businessId:OTHER,appId:A,requestId:R,request:request("accepted"),link:link("booking_confirmed"),work:work("confirmed")},
 {businessId:B,appId:OTHER,requestId:R,request:request("accepted"),link:link("booking_confirmed"),work:work("confirmed")},
 {businessId:B,appId:A,requestId:R,request:{...request("accepted"),business_id:OTHER},link:link("booking_confirmed"),work:work("confirmed")},
 {businessId:B,appId:A,requestId:R,request:request("accepted"),link:{...link("booking_confirmed"),business_id:OTHER},work:work("confirmed")},
 {businessId:B,appId:A,requestId:R,request:request("accepted"),link:link("booking_confirmed"),work:{...work("confirmed"),business_id:OTHER}},
 {businessId:B,appId:A,requestId:R,request:request("accepted"),link:link("booking_confirmed"),work:null},
 {businessId:B,appId:A,requestId:R,request:request("reviewing"),link:link("booking_draft"),work:work("confirmed")},
 {businessId:B,appId:A,requestId:R,request:request("accepted"),link:link("booking_draft"),work:work("confirmed")},
 {businessId:B,appId:A,requestId:R,request:request("closed"),link:link("closed"),work:work("confirmed")},
 {businessId:B,appId:A,requestId:R,request:{...request("accepted"),updated_at:"invalid"},link:link("booking_confirmed"),work:work("confirmed")},
 {businessId:B,appId:A,requestId:R,request:null,link:null,work:null}
]){
 const x=server(val);eq(x.ok,false);eq(x.mayClose,false);
 eq(x.customerNotified,false);eq(x.calendarDelivered,false);
}
const good=client({businessId:B,requestId:R,
 response:{ok:true,revision:confirmed},localBookingStatus:"Confirmed"});
eq(good.ok,true);eq(good.expectedStatus,"accepted");
eq(good.expectedUpdatedAt,time);eq(good.maySend,false);
eq(good.mayRetryAutomatically,false);
eq(client({businessId:B,requestId:R,
 response:{ok:true,revision:draft},localBookingStatus:"Confirmed"}).ok,false);
eq(client({businessId:B,requestId:R,
 response:{ok:true,revision:closed}}).ok,false);
eq(client({businessId:OTHER,requestId:R,
 response:{ok:true,revision:confirmed}}).ok,false);
eq(client({businessId:B,requestId:R,
 response:{ok:false,revision:confirmed}}).ok,false);
eq(client({businessId:B,requestId:R,
 response:{ok:true,revision:{...confirmed,customerNotified:true}}}).ok,false);
const basic={request_type:"enquiry",status:"received"};
eq(actions({request:basic}).canReview,true);
eq(actions({request:basic}).canDecline,true);
eq(actions({request:{...basic,status:"reviewing"}}).canReview,false);
eq(actions({request:{...basic,status:"reviewing"}}).canDecline,true);
eq(actions({request:{...basic,status:"closed"}}).canDecline,false);
eq(actions({request:{...basic,status:"accepted"}}).canReview,false);
eq(actions({request:basic,link:{bridge_state:"enquiry_linked"}}).canDecline,false);
eq(actions({request:{...basic,request_type:"booking_request"},
 link:{bridge_state:"booking_draft"}}).showDraftBooking,true);
eq(actions({request:{...basic,request_type:"booking_request"},
 link:{bridge_state:"booking_confirmed"}}).showConfirmedBooking,true);
eq(actions({request:{...basic,status:"unknown"}}).needsOriginalRequestRefresh,true);
eq(actions({request:basic,link:{bridge_state:"invalid"}}).needsOriginalRequestRefresh,true);
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const edge=read("supabase/functions/busy-mini-apps/index.ts");
ok(edge.includes('if(bridgeState==="closed"&&!guardClose)'));
ok(edge.includes('if (action === "owner_booking_revision")'));
ok(edge.includes('if(!["owner","admin"].includes(member.role))'));
ok(edge.includes('classifyBookingRevisionV3233({'));
ok(edge.includes('busy_close_linked_booking_current_v3232'));
ok(edge.includes('p_expected_updated_at:clean(body?.expectedUpdatedAt,45)'));
const block=edge.slice(edge.indexOf("async function ownerBookingRevisionV3233("),
edge.indexOf("// Owner-only, actual database-sourced counts."));
ok(block.includes('.eq("business_id",businessId)'));
ok(block.includes('.eq("mini_app_id",app.id)'));
ok(block.includes(".select(\"request_id,business_id,state\")"));
ok(!block.includes("contact_phone"));
const app=read("src/app/AppController.js");
const start=app.indexOf("const setBookingStatus = async");
const end=app.indexOf("const markBookingCompleted =",start);
const section=app.slice(start,end);
ok(section.includes('miniAppsRequest("owner_booking_revision"'));
ok(section.includes('miniAppsRequest("update_request_status"'));
ok(section.includes('expectedStatus:approved.expectedStatus'));
ok(section.includes('expectedUpdatedAt:approved.expectedUpdatedAt'));
ok(section.includes("atomicBookingClosureCommitted!==true"));
ok(section.includes("if(cancellationWriteAttempted"));
ok(!section.includes('bridgeState:bookingStatus==="Confirmed"?"booking_confirmed":"closed"'));
ok(section.includes('bridgeState:"booking_confirmed"'));
ok(section.includes("refreshMiniAppsStatus({quiet:true})"));
const ui=read("src/screens/miniApps.js");
ok(ui.includes("ownerRequestActionsV3233({request,link})"));
ok(ui.includes("actions.canDecline"));
ok(ui.includes("actions.showConfirmedBooking"));
ok(ui.includes("ownerView && ownerRequestActionsV3233({request,link}).canDecline"));
const pg=read("staging/ci-linked-booking-close-v3232.sql");
ok(pg.includes("V3.232_ATOMIC_OWNER_BOOKING_CLOSE_AND_FAULT_ROLLBACK_PASS"));
ok(pg.includes("PARTIAL COMMIT after durable Work cancellation failure"));
execFileSync(process.execPath,["scripts/prepare-booking-staging-v3233.mjs"],{stdio:"pipe"});
const staging=JSON.parse(readFileSync("/tmp/bdi-v3233-booking-stage/review.json","utf8"));
eq(staging.originalRealTenantScenarios.length,11);
eq(staging.additionalScenarios.length,11);
ok(staging.sourceHashes.every(v=>/^[0-9a-f]{64}$/.test(v.sha256)));
ok(staging.additionalScenarios.every(v=>v.status==="not_verified"&&v.approvalRequired));
eq(staging.actualJwtTested,false);
eq(staging.ownerApprovedInstall,false);
eq(staging.remoteProjectContacted,false);
eq(staging.hostedSqlExecuted,false);
eq(staging.providerNotified,false);
console.log("V3.233: "+count+" offline exact owner cancellation and shared UX assertions passed.");
