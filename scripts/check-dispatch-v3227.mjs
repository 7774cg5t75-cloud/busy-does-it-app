/**
 * V3.227 — safe dispatch controls, provider-ticket evidence and private
 * owner status. Synthetic checks ONLY; SQL proven separately in Postgres.
 */
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {classifyGuestAlertProviderTicketsV3227 as classify}
 from "../supabase/functions/busy-mini-app-guest-alert-dispatch/dispatchReceiptV3227.mjs";
import {ownerGuestAlertEvidenceV3227 as owner}
 from "../supabase/functions/busy-mini-apps/ownerGuestAlertEvidenceV3227.mjs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
let n=0;
const ok=(v,m)=>{assert.ok(v,m);n++};
const eq=(a,b,m)=>{assert.deepEqual(a,b,m);n++};
const accepted=classify({responseOk:true,expectedCount:2,
 tickets:[{status:"ok",id:"ticket-abcdef12345"},{status:"error",message:"Invalid token"}]});
eq(accepted.outcome,"provider_accepted");
eq(accepted.providerAccepted,true);
eq(accepted.notificationDelivered,false);
eq(accepted.deviceReceiptChecked,false);
eq(accepted.safeToRetryAutomatically,false);
eq(accepted.customerDataReturned,false);
eq(accepted.acceptedTicketCount,1);
const denied=classify({responseOk:true,expectedCount:2,
 tickets:[{status:"error",message:"Invalid token"},{status:"error",message:"Device unknown"}]});
eq(denied.outcome,"definitively_rejected");
eq(denied.notificationDelivered,false);
eq(denied.safeToRetryAutomatically,false);
for(const data of [
 {},
 {responseOk:false,expectedCount:1,tickets:[{status:"ok",id:"accepted-ticket"}]},
 {responseOk:true,expectedCount:0,tickets:[]},
 {responseOk:true,expectedCount:21,tickets:Array(21).fill({status:"ok",id:"ticket"})},
 {responseOk:true,expectedCount:2,tickets:[{status:"ok",id:"ticket"}]},
 {responseOk:true,expectedCount:1,tickets:null},
 {responseOk:true,expectedCount:1,tickets:[{status:"ok",id:""}]},
 {responseOk:true,expectedCount:1,tickets:[{status:"not_available"}]},
 {responseOk:true,expectedCount:1,tickets:[{status:"error",details:{}}]},
 {responseOk:true,expectedCount:1,tickets:[null]}
]){
 const result=classify(data);
 eq(result.outcome,"uncertain");
 eq(result.notificationDelivered,false);
 eq(result.providerAccepted,false);
 eq(result.safeToRetryAutomatically,false);
}
const B="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const A="cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const proof=owner({businessId:B,appId:A,pending:3,retryWait:2,
 claimed:1,manualReview:4});
ok(proof.ok);
eq(proof.needsProviderReview,10);
eq(proof.manualReview,4);
eq(proof.deviceDelivered,false);
eq(proof.mayAutoResend,false);
eq(proof.readOnly,true);
eq(proof.privateCustomerDataIncluded,false);
ok(proof.explanation.includes("will not resend"));
const calm=owner({businessId:B,appId:A,pending:0,retryWait:0,
 claimed:0,manualReview:0});
ok(calm.ok);
eq(calm.needsProviderReview,0);
eq(calm.deviceDelivered,false);
for(const patch of [
 {businessId:"fake"},{appId:"fake"},{pending:-1},{pending:1.3},
 {pending:null},{retryWait:"3"},{claimed:Infinity},
 {manualReview:100000001},{claimed:-2}
]){
 const r=owner({businessId:B,appId:A,pending:0,retryWait:0,
 claimed:0,manualReview:0,...patch});
 eq(r.ok,false);
 eq(r.deviceDelivered,false);
}
const sql=read("supabase/migrations/20261014170000_v3_227_guest_alert_dispatch_leases.sql");
for(const key of [
 "security invoker","set search_path = ''",
 "for update of i skip locked",
 "i.attempt_count < 3",
 "lease_expires_at=pg_catalog.now()+interval '90 seconds'",
 "p_outcome is null",
 "p_receipt_sha256 !~",
 "manual_review",
 "p_outcome='uncertain'",
 "p_outcome='definitively_rejected'",
 "lease_expires_at>pg_catalog.now()",
 "busy_guest_alert_quarantine_expired_v3227",
 "revoke all on function public.busy_guest_alert_claim_one_v3227()",
 "grant execute on function public.busy_guest_alert_claim_one_v3227()",
 "service_role"
])ok(sql.includes(key),key);
ok(!sql.includes("security definer"));
ok(!/(?:cron\.schedule|net\.http_post|http\.post)\s*\(/i.test(sql));
const worker=read("supabase/functions/busy-mini-app-guest-alert-dispatch/index.ts");
for(const key of [
 'BUSY_GUEST_ALERT_DISPATCH_ENABLED',
 'BUSY_GUEST_ALERT_WORKER_SECRET',
 'if(!enabled||!SUPABASE_URL||!SERVICE_KEY||secret.length<40)',
 'if(!(await authorised(request)))',
 'busy_guest_alert_claim_one_v3227',
 'busy_guest_alert_quarantine_expired_v3227',
 'busy_guest_alert_complete_v3227',
 'AbortSignal.timeout(12000)',
 'outcome="uncertain"',
 'notificationDelivered', // note worker uses "delivered:false"
 'request.data.request_origin!=="guest_web"',
 'return {kind:"one_guest_alert_attempt_recorded"',
 'providerAccepted:outcome==="provider_accepted"'
].filter(x=>x!=="notificationDelivered"))ok(worker.includes(key),key);
ok(!/setInterval|cron\.schedule|Deno\.cron|schedule\(/i.test(worker));
ok(!worker.includes("contact_email"));
ok(!worker.includes("contact_phone"));
ok(!worker.includes("notifyBusiness("));
const ownerRoute=read("supabase/functions/busy-mini-apps/index.ts");
ok(ownerRoute.includes('ownerGuestAlertEvidenceV3227({'));
ok(ownerRoute.includes('countGuestIntents("manual_review")'));
ok(ownerRoute.includes('countGuestIntents("claimed")'));
ok(ownerRoute.includes('if(!["owner","admin"].includes(member.role))'));
const screen=read("src/screens/miniApps.js");
ok(screen.includes('Alerts awaiting provider confirmation'));
ok(screen.includes("guestAlerts.manualReview>0"));
ok(screen.includes("s.ownerQueueSummary.guestAlerts.needsProviderReview"));
const assembly=read("scripts/prepare-disposable-dispatch-v3227.mjs");
ok(assembly.includes("/tmp/bdi-v3226-disposable-outbox/outbox-rollback.sql"));
ok(assembly.includes("V3.227_EPHEMERAL_DISPATCH_ROLLBACK_PASS"));
ok(assembly.includes("sqlExecutedByThisScript:false"));
console.log("V3.227 dispatcher/owner and security contracts: "+n+
 " assertions passed; no provider sends, hosted SQL or signed builds.");
