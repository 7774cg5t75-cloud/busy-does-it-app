/**
 * V3.230 local verification of provider receipt semantics, 68 migration
 * source completeness, on-demand owner clarity and disabled service boundary.
 * No hosted SQL, notifications, provider calls or paid builds.
 */
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {execFileSync} from "node:child_process";
import {classifyPushServiceReceiptV3230 as receipt}
 from "../supabase/functions/busy-mini-app-guest-alert-dispatch/pushServiceReceiptV3230.mjs";
import {ownerGuestAlertEvidenceV3227 as summary}
 from "../supabase/functions/busy-mini-apps/ownerGuestAlertEvidenceV3227.mjs";
let n=0;const eq=(a,b,m)=>{assert.deepEqual(a,b,m);n++;};
const ok=(x,m)=>{assert.ok(x,m);n++;};
const T="ticket-abc1234";
const good=receipt({ticketId:T,responseOk:true,receipts:{
 [T]:{status:"ok"}}});
eq(good.kind,"push_service_accepted");eq(good.persist,true);
eq(good.deviceDelivered,false);eq(good.ownerRead,false);
eq(good.mayResendPush,false);
const rejected=receipt({ticketId:T,responseOk:true,receipts:{
 [T]:{status:"error",details:{error:"DeviceNotRegistered"}}}});
eq(rejected.kind,"push_service_rejected");
eq(rejected.errorCode,"DeviceNotRegistered");
eq(rejected.deviceDelivered,false);eq(rejected.mayResendPush,false);
const other=receipt({ticketId:T,responseOk:true,receipts:{
 [T]:{status:"error",details:{error:"DifferentError"}}}});
eq(other.errorCode,"OtherProviderError");
for(const bad of [
 {ticketId:"not a ticket",responseOk:true,receipts:{[T]:{status:"ok"}}},
 {ticketId:T,responseOk:false,receipts:{[T]:{status:"ok"}}},
 {ticketId:T,responseOk:true,receipts:{}},
 {ticketId:T,responseOk:true,receipts:{[T]:{status:"weird"}}},
 {ticketId:T,responseOk:true,receipts:{[T]:{status:"error",details:{}}}},
 {ticketId:T,responseOk:true,receipts:{[T]:null}},
 {ticketId:T,responseOk:true,receipts:[{status:"ok"}]},
 {ticketId:T,responseOk:true,receipts:{[T]:{status:"error",details:{error:""}}}}
]){
 const x=receipt(bad);
 eq(x.persist,false);eq(x.kind,"receipt_unverified");
 eq(x.deviceDelivered,false);eq(x.mayResendPush,false);
}
const B="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const A="bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const base={businessId:B,appId:A,pending:1,retryWait:0,
 claimed:0,manualReview:1,gatewayAccepted:2};
const view=summary(base);
eq(view.ok,true);eq(view.gatewayAcceptedCount,2);
eq(view.gatewayAcceptedIsNotDeviceDelivery,true);
eq(view.deviceDelivered,false);eq(view.mayAutoResend,false);
for(const bad of [
 {...base,appId:"not-id"},
 {...base,gatewayAccepted:-1},
 {...base,gatewayAccepted:1.3},
 {...base,manualReview:Infinity}
])eq(summary(bad).ok,false);
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const sql=read("supabase/migrations/20261014211500_v3_230_push_service_receipt_truth.sql");
for(const fragment of [
 "busy_guest_alert_record_push_service_receipt_v3230",
 "push_service_accepted","push_service_rejected","expired_unverified",
 "push_service_state='not_checked'",
 "and d.gateway_state='accepted'",
 "and d.ticket_id=p_ticket_id",
 "force", // inherited RLS: validated separately
 "security invoker",
 "from public,anon,authenticated",
 "to service_role"
]){
 // Schema inheritance: existing V3.229 FORCE RLS protects receipt rows.
 if(fragment!=="force")ok(sql.toLowerCase().includes(fragment.toLowerCase()),fragment);
}
const prev=read("supabase/migrations/20261014194500_v3_229_guest_alert_device_evidence.sql");
ok(prev.includes("force row level security"));
ok(!sql.includes("contact_email"));ok(!sql.includes("expo_push_token"));
ok(!sql.includes("net.http_post"));ok(!sql.includes("cron.schedule"));
const worker=read("supabase/functions/busy-mini-app-guest-alert-receipts/index.ts");
ok(worker.includes('BUSY_GUEST_ALERT_RECEIPT_CHECK_ENABLED'));
ok(worker.includes('BUSY_GUEST_ALERT_RECEIPT_WORKER_SECRET'));
ok(worker.includes('/push/getReceipts'));
ok(!worker.includes('/push/send'));
ok(worker.includes("classifyPushServiceReceiptV3230"));
ok(worker.includes("busy_guest_alert_record_push_service_receipt_v3230"));
ok(worker.includes(".limit(10)"));
const owner=read("supabase/functions/busy-mini-apps/index.ts");
ok(owner.includes('countGuestIntents("provider_accepted")'));
ok(owner.includes("gatewayAccepted"));
const screen=read("src/screens/miniApps.js");
ok(screen.includes("Alerts accepted by push gateway (not phone delivery)"));
execFileSync(process.execPath,["scripts/prepare-phase-one-approval-v3229.mjs"],{stdio:"pipe"});
const source=JSON.parse(readFileSync("/tmp/bdi-v3229-phase-one-review/approval-review.json","utf8"));
eq(source.fullHistory.versionedMigrations,68);
eq(source.canExecute,false);eq(source.ownerApproved,false);
eq(source.SQLExecuted,false);
console.log("V3.230: "+n+" offline receipt, privacy, owner view and staging gate assertions passed.");
