import assert from "node:assert/strict";
import {readFileSync,writeFileSync,appendFileSync} from "node:fs";
import {join} from "node:path";
import {reviewPushGatewayReceipts}
 from "../supabase/functions/busy-mini-apps/pushGatewayReceiptEvidence.mjs";
import {recommendMeasuredOwnerActions}
 from "../src/core/measuredCustomerActionPriorityV3186.mjs";
import {verifyStagingPackage} from "./verify-staging-install-v3186.mjs";
import {report as intelligence} from "./track-intelligence-v3183.mjs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
let count=0;
const ok=x=>{assert.ok(x);count++},eq=(a,b)=>{assert.deepEqual(a,b);count++};
const business="11111111-1111-4111-8111-111111111111";
const app="33333333-3333-4333-8333-333333333333";
const other="22222222-2222-4222-8222-222222222222";
const req="44444444-4444-4444-8444-444444444444";
const uuids=[
"55555555-5555-4555-8555-555555555555",
"66666666-6666-4666-8666-666666666666",
"77777777-7777-4777-8777-777777777777",
"88888888-8888-4888-8888-888888888888",
"99999999-9999-4999-8999-999999999999"
];
const out=(message_id,i,state)=>({
 id:uuids[i],business_id:business,mini_app_id:app,
 request_id:req,message_id,state
});
const intents=[out(uuids[0],0,"submitted_unverified"),
 out(uuids[1],1,"submitted_unverified"),
 out(uuids[2],2,"pending"),
 out(uuids[3],3,"submitted_unverified"),
 out(uuids[4],4,"no_submission_evidence")];
const ticket=(message_id,provider_receipts,tenant=business)=>({
 business_id:tenant,
 notification_key:`miniapp:${req}:message:${message_id}`,
 provider_receipts,user_id:"PRIVATE_CUSTOMER_ID",
 expo_push_token:"ExponentPushToken[PRIVATE]",
 route_data:{phone:"PRIVATE_PHONE"}
});
const evidence=reviewPushGatewayReceipts({
 businessId:business,appId:app,outboxRows:intents,
 deliveryRows:[
 ticket(uuids[0],[{status:"ok",id:"private_ticket"}]),
 ticket(uuids[1],[{status:"error",message:"invalid_device"}]),
 ticket(uuids[3],[{status:"ok"},{status:"wat"}]),
 ticket(uuids[4],[{status:"ok"}]),
 {...ticket(uuids[0],[{status:"ok"}]),notification_key:"miniapp:"+other+":message:"+uuids[0]}
 ]});
ok(evidence.ok);
eq(evidence.counts.messagesReviewed,5);
eq(evidence.counts.gatewayAcceptedMessages,1);
eq(evidence.counts.gatewayRejectedMessages,1);
eq(evidence.counts.mixedOrUnknownGatewayTickets,1);
eq(evidence.counts.awaitingAttempt,1);
eq(evidence.counts.noSubmissionRecorded,1);
eq(evidence.counts.submittedNoSavedGatewayTicket,0);
eq(evidence.unexpectedOrOldDeliveryRowsIgnored,1);
eq(evidence.independentlyVerifiedDeviceDelivery,false);
eq(evidence.customerNotificationRead,false);
eq(evidence.automaticRetryEnabled,false);
ok(!JSON.stringify(evidence).includes("PRIVATE_CUSTOMER_ID"));
ok(!JSON.stringify(evidence).includes("PRIVATE_PHONE"));
ok(!JSON.stringify(evidence).includes("private_ticket"));
const missing=reviewPushGatewayReceipts({businessId:business,appId:app,
 outboxRows:[intents[0]],deliveryRows:[]});
eq(missing.counts.submittedNoSavedGatewayTicket,1);
eq(missing.counts.noGatewayDeliveryEvidence,1);
const ambiguous=reviewPushGatewayReceipts({businessId:business,appId:app,
 outboxRows:[intents[0]],deliveryRows:[ticket(uuids[0],[])]});
eq(ambiguous.counts.gatewayAcceptedMessages,0);
eq(ambiguous.counts.submittedNoSavedGatewayTicket,1);
ok(!reviewPushGatewayReceipts({businessId:business,appId:app,
 outboxRows:[{...intents[0],business_id:other}],deliveryRows:[]}).ok);
ok(!reviewPushGatewayReceipts({businessId:business,appId:app,
 outboxRows:[intents[0],intents[0]],deliveryRows:[]}).ok);
ok(!reviewPushGatewayReceipts({businessId:business,appId:app,
 outboxRows:[],deliveryRows:[ticket(uuids[0],[],other)]}).ok);
const choose=(journey,work,gateway,notification)=>
 recommendMeasuredOwnerActions({journey:{ok:true,counts:journey},
 work:{ok:true,counts:work},gateway:{ok:true,counts:gateway},
 notification:{ok:true,counts:notification}});
const priority=choose(
 {closedRequestsWithActiveWork:2,acceptedBookingsMissingWork:4,requestsAwaitingOwnerReply:11},
 {cancelledButStillActive:1,acceptedMissingWork:2},
 {gatewayRejectedMessages:9},{pendingOver60Minutes:1});
ok(priority.ok);eq(priority.highestPriority.id,"work_booking_conflict");
eq(priority.highestPriority.count,2);
eq(priority.nextActions[1].id,"accepted_request_missing_work");
eq(priority.nextActions[2].id,"owner_replies_waiting");
eq(priority.nextActions[3].id,"unconfirmed_push_submission");
eq(priority.customerOutcomeConversionRate,null);
eq(priority.saleRevenueMeasured,false);
eq(priority.noAutomaticCustomerContact,true);
eq(priority.independentDeviceDeliveryMeasured,false);
const noIssues=choose({}, {}, {}, {});
eq(noIssues.highestPriority.id,"review_external_delivery");
eq(noIssues.zeroIssuesDoesNotGuaranteeSuccess,true);
ok(!recommendMeasuredOwnerActions({journey:{ok:true,counts:{x:-1}}}).ok);
ok(!!recommendMeasuredOwnerActions({
 journey:{ok:true,counts:{},coveragePartial:true},
 work:{ok:true,counts:{}},gateway:{ok:true,counts:{}},
 notification:{ok:true,counts:{}}
}).coveragePartial);
const edge=read("supabase/functions/busy-mini-apps/index.ts");
ok(edge.includes('import {reviewPushGatewayReceipts} from "./pushGatewayReceiptEvidence.mjs"'));
ok(edge.includes('.from("busy_push_deliveries")'));
ok(edge.includes('.in("notification_key",keys)'));
ok(edge.includes('pushGatewayEvidence=reviewPushGatewayReceipts({'));
ok(edge.includes('pushGatewayEvidence,'));
const domain=read("src/domain/miniApps.js");
const screen=read("src/screens/miniApps.js");
ok(domain.includes("recommendMeasuredOwnerActions({"));
ok(domain.includes("pushGatewayEvidence:remote?.pushGatewayEvidence"));
ok(screen.includes("V3.186 • Notification gateway evidence"));
ok(screen.includes("V3.186 • What Busy thinks needs attention"));
ok(!read("supabase/functions/busy-mini-apps/pushGatewayReceiptEvidence.mjs")
 .includes("fetch("));
const preflight=verifyStagingPackage();
ok(preflight.ok);
eq(preflight.installed,false);eq(preflight.authorisedForInstall,false);
ok(preflight.migrationCount>=63);
const packaged=join("/tmp/bdi-isolated-staging-v3180","sql","001_ISOLATED_ONLY_business_core_v3180.sql");
const original=readFileSync(packaged);
try{
 appendFileSync(packaged,"\n-- intentional integrity-test tampering\n");
 const tampered=verifyStagingPackage();
 eq(tampered.ok,false);
 ok(tampered.problems.some(x=>x.includes("checksum mismatch")));
}finally{writeFileSync(packaged,original);}
ok(verifyStagingPackage().ok);
ok(intelligence.surveyedCapabilities.length>=16);
eq(intelligence.wiredSourceCapabilities,intelligence.surveyedCapabilities.length);
eq(intelligence.testsPresentForSample,intelligence.surveyedCapabilities.length);
eq(intelligence.realCustomerJourneysProven,false);
console.log("V3.186 "+count+" gateway, measured-actions and offline-staging assertions PASS.");
