/**
 * V3.226: no-send transactionally durable guest notification evidence.
 * Only synthetic source fixtures; real SQL exercised in PostgreSQL CI.
 */
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {verifyGuestNotificationIntentV3226}
 from "../supabase/functions/busy-mini-app-guest/guestNotificationIntentV3226.mjs";
import {ownerGuestAlertEvidenceV3226}
 from "../supabase/functions/busy-mini-apps/ownerGuestAlertEvidenceV3226.mjs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
let n=0;
const eq=(a,b,m)=>{assert.deepEqual(a,b,m);n++};
const ok=(x,m)=>{assert.ok(x,m);n++};
const B="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const A="cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const R="10101010-1010-4010-8010-101010101010";
const ID="22222222-2222-4222-8222-222222222222";
const X="bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const valid=()=>({intent:{id:ID,request_id:R,business_id:B,mini_app_id:A,
  state:"pending",event_kind:"guest_received",attempt_count:0},
 requestId:R,businessId:B,appId:A});
const proof=verifyGuestNotificationIntentV3226(valid());
ok(proof.ok);
eq(proof.intentDurableAsReadBack,true);
eq(proof.notificationDelivered,false);
eq(proof.notificationProviderAccepted,false);
eq(proof.bookingConfirmed,false);
eq(proof.dispatchImplementedHere,false);
eq(proof.mayDispatch,false);
eq(proof.retryRequest,false);
eq(proof.contactDetailsIncluded,false);
ok(!JSON.stringify(proof).includes("email"));
for(const state of ["pending","claimed","provider_accepted","retry_wait","manual_review","cancelled"]){
 const x=verifyGuestNotificationIntentV3226({...valid(),
  intent:{...valid().intent,state}});
 ok(x.ok);
 eq(x.notificationDelivered,false);
 eq(x.notificationProviderAccepted,false);
}
for(const bad of [
 {requestId:X},{businessId:X},{appId:X},
 {intent:null},{intent:{...valid().intent,id:"unknown"}},
 {intent:{...valid().intent,request_id:X}},
 {intent:{...valid().intent,business_id:X}},
 {intent:{...valid().intent,mini_app_id:X}},
 {intent:{...valid().intent,event_kind:"owner_mail"}},
 {intent:{...valid().intent,state:"delivered"}},
 {intent:{...valid().intent,attempt_count:-1}},
 {intent:{...valid().intent,attempt_count:101}},
 {intent:{...valid().intent,attempt_count:"0"}}
]){
 const out=verifyGuestNotificationIntentV3226({...valid(),...bad});
 eq(out.ok,false);
 eq(out.notificationDelivered,false);
 eq(out.retryRequest,false);
}
const alert=ownerGuestAlertEvidenceV3226({
 businessId:B,appId:A,pending:3,retryWait:2});
ok(alert.ok);
eq(alert.totalAwaitingDelivery,5);
eq(alert.providerDelivered,false);
eq(alert.actualDeviceDeliveryConfirmed,false);
eq(alert.privateCustomerDataIncluded,false);
eq(alert.readOnly,true);
for(const altered of [
 {businessId:X},{appId:"bad"},{pending:-1},{pending:0.5},
 {pending:"2"},{retryWait:null},{retryWait:100000001}
]){
 const out=ownerGuestAlertEvidenceV3226({
 businessId:B,appId:A,pending:2,retryWait:0,...altered});
 if(altered.businessId===X){ // Another valid business is a valid
   // classifier scope; server owns the readback and its authentication.
   eq(out.ok,true);
 }else{eq(out.ok,false);eq(out.providerDelivered,false);}
}
const migration=read("supabase/migrations/20261014151000_v3_226_guest_notification_intent.sql");
for(const needle of [
 "busy_mini_app_guest_notification_intents",
 "request_id uuid not null unique",
 "references public.busy_mini_app_requests(id)",
 "force row level security",
 "revoke all on public.busy_mini_app_guest_notification_intents",
 "new.request_origin = 'guest_web'",
 "new.guest_challenge_id is null",
 "on conflict (request_id) do nothing",
 "after insert on public.busy_mini_app_requests",
 "security definer",
 "set search_path = ''",
 "provider_accepted_at"
])ok(migration.includes(needle),needle);
ok(!/(?:cron\.schedule|net\.http_post|http\.post)\s*\(/i.test(migration));
const edge=read("supabase/functions/busy-mini-app-guest/index.ts");
for(const needle of [
 'import {verifyGuestNotificationIntentV3226}',
 '.from("busy_mini_app_guest_notification_intents")',
 '.eq("request_id",requestId)',
 '.eq("business_id",app.business_id)',
 '.eq("mini_app_id",app.id)',
 "const intent=verifyGuestNotificationIntentV3226({",
 "if(!intent.ok)",
 "notificationIntentSaved:intent.intentDurableAsReadBack",
 "notificationAttemptedByThisCall:false",
 "notificationDelivered:false"
])ok(edge.includes(needle),needle);
ok(!edge.includes('fetch(EXPO_PUSH_URL'));
ok(!edge.includes("async function notifyBusiness("));
ok(edge.indexOf("const storedMatch=verifyStoredGuestSubmissionV3224(")<
 edge.indexOf("const queued=await supabase"));
const owner=read("supabase/functions/busy-mini-apps/index.ts");
ok(owner.includes("ownerGuestAlertEvidenceV3226"));
ok(owner.includes('.from("busy_mini_app_guest_notification_intents")'));
ok(owner.includes('countGuestIntents("pending")'));
ok(owner.includes('countGuestIntents("retry_wait")'));
ok(owner.includes('if(!["owner","admin"].includes(member.role))'));
const ui=read("src/screens/miniApps.js");
ok(ui.includes('Guest alerts not confirmed delivered'));
ok(ui.includes('guestAlerts?.businessId===app.business_id'));
ok(ui.includes('guestAlerts?.appId===app.id'));
const source=read("scripts/prepare-disposable-outbox-v3226.mjs");
ok(source.includes('guest-rpc-rollback.sql'));
ok(source.includes('outbox-rollback.sql'));
ok(source.includes('sqlExecutedByThisScript:false'));
const ci=read("staging/CI_ONLY_v3226_assert_guest_notification_intents.sql");
ok(ci.includes("Atomic notification intent count"));
ok(ci.includes("relforcerowsecurity"));
ok(ci.includes("has_function_privilege"));
console.log("V3.226 guest outbox source/owner evidence: "+n+
 " assertions passed. No provider send, deployment or paid build.");
