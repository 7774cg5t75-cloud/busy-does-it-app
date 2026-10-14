/**
 * V3.229 offline source contract regression: private device gateway ledger,
 * one genuinely matching newest customer enquiry, and staging permission
 * gates. Actual SQL is tested separately inside a disposable PostgreSQL CI
 * service. No network, hosted mutations, paid builds or provider calls.
 */
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {execFileSync} from "node:child_process";
import {buildGuestDeviceGatewayEvidenceV3229 as evidence}
 from "../supabase/functions/busy-mini-app-guest-alert-dispatch/deviceGatewayEvidenceV3229.mjs";
import {classifyGuestAlertProviderTicketsV3227 as classify}
 from "../supabase/functions/busy-mini-app-guest-alert-dispatch/dispatchReceiptV3227.mjs";
import {classifyOwnerRequestQueueV3225 as queue}
 from "../supabase/functions/busy-mini-apps/ownerRequestQueueV3225.mjs";
import {chooseOwnerRequestNextStepV3228 as next}
 from "../supabase/functions/busy-mini-apps/ownerNextStepV3228.mjs";
let checks=0;
const eq=(a,b,m)=>{assert.deepEqual(a,b,m);checks++};
const ok=(v,m)=>{assert.ok(v,m);checks++};
const B="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const A="bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const R="cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const H=["a".repeat(64),"b".repeat(64)];
const accepted=[{status:"ok",id:"ticket-aaa111"},{status:"ok",id:"ticket-bbb222"}];
const good=evidence({deviceHashes:H,tickets:accepted,responseOk:true});
eq(good.ok,true);eq(good.outcome,"provider_accepted");
eq(good.items.length,2);eq(good.accepted,2);
eq(good.items[0].device_hash,H[0]);eq(good.items[1].slot,1);
eq(good.notificationDelivered,false);eq(good.deviceReceiptVerified,false);
eq(good.customerDataIncluded,false);eq(good.rawDeviceTokensReturned,false);
const partial=evidence({deviceHashes:H,responseOk:true,tickets:[
 accepted[0],{status:"error",message:"DeviceNotRegistered"}]});
eq(partial.outcome,"uncertain");eq(partial.accepted,1);
eq(partial.rejected,1);eq(partial.unknown,0);
eq(partial.items[1].ticket_id,null);eq(partial.items[1].state,"rejected");
eq(partial.autoRetryUnknown,false);
const rejected=evidence({deviceHashes:H,responseOk:true,tickets:[
 {status:"error",message:"Invalid token"},{status:"error",message:"Expired token"}]});
eq(rejected.outcome,"definitively_rejected");
const duplicate=evidence({deviceHashes:H,responseOk:true,tickets:[
 accepted[0],accepted[0]]});
eq(duplicate.outcome,"uncertain");eq(duplicate.unknown,1);
eq(duplicate.items[1].state,"unknown");
const lost=evidence({deviceHashes:H,responseOk:false,tickets:accepted});
eq(lost.outcome,"uncertain");eq(lost.unknown,2);
eq(lost.items.length,2);
const empty=evidence({deviceHashes:[]});
eq(empty.outcome,"uncertain");eq(empty.items.length,0);
for(const bad of [[H[0],"short"],["invalid"],Array(21).fill(H[0])]){
 const x=evidence({deviceHashes:bad,tickets:accepted,responseOk:true});
 eq(x.ok,false);eq(x.mayPersist,false);
}
for(const bad of [null,[],[accepted[0]],[
 {status:"ok",id:"wrong id with spaces"},accepted[1]]]){
 const x=evidence({deviceHashes:H,tickets:bad,responseOk:true});
 eq(x.outcome,"uncertain");eq(x.notificationDelivered,false);
}
eq(classify({responseOk:true,tickets:accepted,expectedCount:2}).outcome,
 "provider_accepted");
const r=(status="received")=>({id:R,business_id:B,mini_app_id:A,
 request_type:"booking_request",status});
const latest=queue({businessId:B,appId:A,received:1,reviewing:2,
 latest:r("received")});
eq(latest.ok,true);eq(latest.latestRequestStatus,"received");
eq(next({queue:latest,alerts:{
 ok:true,businessId:B,appId:A,manualReview:0,needsProviderReview:0
}}).action,"review_new_enquiry");
const wrongPriority=queue({businessId:B,appId:A,received:1,reviewing:2,
 latest:r("reviewing")});
eq(wrongPriority.ok,false);
eq(queue({businessId:B,appId:A,received:0,reviewing:1,
 latest:r("received")}).ok,false);
eq(queue({businessId:B,appId:A,received:0,reviewing:0,
 latest:r("received")}).ok,false);
eq(queue({businessId:B,appId:A,received:0,reviewing:1,
 latest:r("reviewing")}).ok,true);
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const owner=read("supabase/functions/busy-mini-apps/index.ts");
ok(owner.includes('.eq("status",received>0?"received":"reviewing")'));
ok(owner.includes('.order("id",{ascending:false})'));
const guest=read("supabase/functions/busy-mini-app-guest/index.ts");
ok(guest.includes('.eq("business_id",request.data.business_id)'));
const worker=read("supabase/functions/busy-mini-app-guest-alert-dispatch/index.ts");
ok(worker.includes("BUSY_GUEST_ALERT_DISPATCH_ENABLED"));
ok(worker.includes("deviceTokenHmac"));
ok(worker.includes("buildGuestDeviceGatewayEvidenceV3229"));
ok(worker.includes("busy_guest_alert_finalize_attempt_v3229"));
ok(!worker.includes('store.rpc("busy_guest_alert_complete_v3227"'));
ok(!worker.includes("setInterval("));
const sql=read("supabase/migrations/20261014194500_v3_229_guest_alert_device_evidence.sql");
for(const field of [
 "busy_mini_app_guest_alert_device_attempts_v3229",
 "busy_guest_alert_finalize_attempt_v3229",
 "force row level security",
 "service_role",
 "device_hmac_sha256",
 "ticket_id",
 "receipt_state",
 "security invoker",
 "p_device_results jsonb",
 "for update",
 "raise exception 'Original dispatch lease could not be acknowledged'",
 "busy_guest_alert_complete_v3227"
])ok(sql.toLowerCase().includes(field.toLowerCase()),field);
ok(!/cron\.schedule\s*\(|net\.http_post\s*\(/i.test(sql));
ok(!sql.includes("expo_push_token"));
ok(!sql.includes("contact_email"));
ok(!sql.includes("security definer"));
const source=read("scripts/prepare-disposable-device-evidence-v3229.mjs");
ok(source.includes("V3.229_EPHEMERAL_DEVICE_EVIDENCE_ROLLBACK_PASS"));
ok(source.includes("sqlExecutedByThisScript:false"));
ok(!source.includes("https://"));
execFileSync(process.execPath,["scripts/prepare-phase-one-approval-v3229.mjs"],{stdio:"pipe"});
const phase=JSON.parse(readFileSync("/tmp/bdi-v3229-phase-one-review/approval-review.json","utf8"));
eq(phase.fullHistory.versionedMigrations,67);
eq(phase.source.proposedObjects,["busy_businesses","busy_business_memberships"]);
ok(/^[a-f0-9]{64}$/.test(phase.source.sha256));
eq(phase.canExecute,false);eq(phase.ownerApproved,false);
eq(phase.SQLExecuted,false);eq(phase.remoteProjectReadByScript,false);
eq(phase.realBackupRestoreTested,false);eq(phase.realJwtRlsTested,false);
console.log("V3.229: "+checks+" offline privacy, gateway, exact inbox and staged phase-one review checks passed.");
