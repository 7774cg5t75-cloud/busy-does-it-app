/**
 * V3.228 offline regression: mixed Expo batch, truthful next steps,
 * complete staging SHA inventory; no provider or hosted SQL requests.
 */
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {execFileSync} from "node:child_process";
import {classifyGuestAlertProviderTicketsV3227 as classify}
 from "../supabase/functions/busy-mini-app-guest-alert-dispatch/dispatchReceiptV3227.mjs";
import {chooseOwnerRequestNextStepV3228 as next}
 from "../supabase/functions/busy-mini-apps/ownerNextStepV3228.mjs";
import {classifyOwnerRequestQueueV3225 as queue}
 from "../supabase/functions/busy-mini-apps/ownerRequestQueueV3225.mjs";
import {ownerGuestAlertEvidenceV3227 as alerts}
 from "../supabase/functions/busy-mini-apps/ownerGuestAlertEvidenceV3227.mjs";
let n=0;const eq=(a,b)=>{assert.deepEqual(a,b);n++};
const ok=(x)=>{assert.ok(x);n++};
const yes=[{status:"ok",id:"ticket-abcdef123"},{status:"ok",id:"ticket-abcdef987"}];
const mixed=[yes[0],{status:"error",message:"DeviceNotRegistered"}];
const accepted=classify({responseOk:true,expectedCount:2,tickets:yes});
eq(accepted.outcome,"provider_accepted");eq(accepted.notificationDelivered,false);
eq(accepted.deviceReceiptChecked,false);eq(accepted.acceptedTicketCount,2);
const partial=classify({responseOk:true,expectedCount:2,tickets:mixed});
eq(partial.outcome,"uncertain");eq(partial.partialGatewayAcceptance,true);
eq(partial.acceptedTicketCount,1);eq(partial.rejectedTicketCount,1);
eq(partial.providerAccepted,false);eq(partial.safeToRetryAutomatically,false);
eq(partial.notificationDelivered,false);
eq(classify({responseOk:true,expectedCount:2,tickets:[
 {status:"error",message:"Bad"},{status:"error",message:"Bad"}]}).outcome,"definitively_rejected");
for(const bad of [
 [yes[0],{status:"ok",id:""}],
 [yes[0],{status:"ok",id:"bad id with spaces"}],
 [yes[0],{status:"error"}],
 [yes[0],null],
 [yes[0],{status:"other"}],
 [yes[0],{status:"ok",id:"x".repeat(121)}]
]){
 const verdict=classify({responseOk:true,expectedCount:2,tickets:bad});
 eq(verdict.outcome,"uncertain");eq(verdict.providerAccepted,false);
 eq(verdict.safeToRetryAutomatically,false);
}
eq(classify({responseOk:false,expectedCount:2,tickets:yes}).outcome,"uncertain");
const B="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const A="bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const R="cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const Q=(received=1,reviewing=0)=>queue({
 businessId:B,appId:A,received,reviewing,
 latest:received+reviewing?{id:R,business_id:B,mini_app_id:A,
  request_type:"enquiry",status:received>0?"received":"reviewing"}:null});
const G=(manualReview=0,pending=0)=>alerts({
 businessId:B,appId:A,pending,retryWait:0,claimed:0,manualReview});
const first=next({queue:Q(),alerts:G(1)});
eq(first.ok,true);eq(first.action,"review_new_enquiry");
eq(first.latestRequestId,R);eq(first.deviceDelivered,false);
eq(first.maySend,false);eq(first.mayConfirmBooking,false);
eq(first.customerContactIncluded,false);
eq(next({queue:Q(0,0),alerts:G(2)}).action,"check_uncertain_alerts");
eq(next({queue:Q(0,1),alerts:G()}).action,"continue_reviewing");
eq(next({queue:Q(0,0),alerts:G(0,2)}).action,"check_pending_alerts");
eq(next({queue:Q(0,0),alerts:G()}).action,"up_to_date");
for(const pair of [
 {queue:Q(),alerts:{...G(),businessId:R}},
 {queue:{...Q(),received:3},alerts:G()},
 {queue:{...Q(),latestRequestId:null},alerts:G()},
 {queue:Q(),alerts:{...G(),manualReview:4,needsProviderReview:2}},
 {queue:Q(),alerts:null}
]){
 const bad=next(pair);eq(bad.ok,false);eq(bad.maySend,false);
}
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const worker=read("supabase/functions/busy-mini-app-guest-alert-dispatch/index.ts");
ok(worker.includes("BUSY_GUEST_ALERT_DISPATCH_ENABLED"));
ok(worker.includes('outcome=check.outcome===mapped.outcome?mapped.outcome:"uncertain"'));
const owner=read("supabase/functions/busy-mini-apps/index.ts");
ok(owner.includes("chooseOwnerRequestNextStepV3228({queue:proof,alerts:guestAlerts})"));
ok(owner.includes('if(!["owner","admin"].includes(member.role))'));
const screen=read("src/screens/miniApps.js");
ok(screen.includes("BUSY suggests: "));
ok(screen.includes("nextStep?.businessId===app.business_id"));
execFileSync(process.execPath,["scripts/prepare-staging-gates-v3228.mjs"],{stdio:"pipe"});
const m=JSON.parse(readFileSync("/tmp/bdi-v3228-staging-review/source-manifest.json","utf8"));
eq(m.completeMigrationCount,68);eq(m.migrations.length,68);
eq(m.critical.length,7);
ok(m.migrations.every(x=>/^[a-f0-9]{64}$/.test(x.sha256)));
ok(m.critical.every(x=>/^[a-f0-9]{64}$/.test(x.sha256)));
eq(m.canInstall,false);eq(m.approvalGranted,false);
eq(m.actualSqlExecuted,false);eq(m.hostedProjectModified,false);
eq(m.gates.twoRealTenantJwtRlsVerified,false);
eq(m.gates.realBackupAndRestoreVerified,false);
eq(m.dispatcherEnabled,false);eq(m.providerContacted,false);
console.log("V3.228: "+n+" offline gateway, tenant-scoped owner advice and migration source assertions passed.");
