/**
 * V3.232 SOURCE ONLY. Booking handoff proof, tenant scope, stale owner
 * revision, replay, provider nonclaims and strict no-install staging gates.
 * Real atomicity verified separately in disposable PostgreSQL 17.
 */
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {classifyBookingClosureEvidenceV3232 as classify}
 from "../supabase/functions/busy-mini-apps/bookingCloseEvidenceV3232.mjs";
let n=0;
const eq=(a,b)=>{assert.deepEqual(a,b);n++};
const ok=(a,m)=>{assert.ok(a,m);n++};
const b="11111111-1111-4111-8111-111111111111";
const wrong="22222222-2222-4222-8222-222222222222";
const r="44444444-4444-4444-8444-444444444444";
const work="66666666-6666-4666-8666-666666666666";
const base={changed:true,link:{request_id:r,business_id:b},
 freshOwnerRevisionVerified:true,atomicBookingCloseVerified:true,
 nextStatus:"closed",workLedgerState:"cancelled",workLedgerDurable:true,
 workLedgerId:work,ledgerSource:"business_app_request_v3181",
 externalCalendarDelivered:false,independentDiaryDeliveryVerified:false};
const success=classify({businessId:b,requestId:r,result:base});
eq(success.ok,true);eq(success.workLedgerCancellationRecorded,true);
eq(success.requestClosed,true);eq(success.customerNotified,false);
eq(success.calendarDelivered,false);eq(success.mayConfirmBooking,false);
eq(success.mayRetryAutomatically,false);
const draft=classify({businessId:b,requestId:r,
 result:{...base,workLedgerState:"not_applicable",workLedgerDurable:false,
 workLedgerId:null}});
eq(draft.ok,true);eq(draft.workLedgerCancellationRecorded,false);
const bad=[
 {businessId:wrong,requestId:r,result:base},
 {businessId:b,requestId:wrong,result:base},
 {businessId:b,requestId:r,result:null},
 {businessId:b,requestId:r,result:{...base,link:{...base.link,business_id:wrong}}},
 {businessId:b,requestId:r,result:{...base,link:{...base.link,request_id:wrong}}},
 {businessId:b,requestId:r,result:{...base,freshOwnerRevisionVerified:false}},
 {businessId:b,requestId:r,result:{...base,atomicBookingCloseVerified:false}},
 {businessId:b,requestId:r,result:{...base,workLedgerState:"confirmed"}},
 {businessId:b,requestId:r,result:{...base,workLedgerState:"cancelled",workLedgerDurable:false}},
 {businessId:b,requestId:r,result:{...base,workLedgerId:"invalid"}},
 {businessId:b,requestId:r,result:{...base,workLedgerState:"not_applicable"}},
 {businessId:b,requestId:r,result:{...base,nextStatus:"reviewing"}},
 {businessId:b,requestId:r,result:{...base,externalCalendarDelivered:true}},
 {businessId:b,requestId:r,result:{...base,independentDiaryDeliveryVerified:true}},
 {businessId:b,requestId:r,result:{...base,ledgerSource:"untrusted"}},
 {businessId:b,requestId:r,result:{...base,changed:"true"}}
];
for(const input of bad){const verdict=classify(input);
 eq(verdict.ok,false);eq(verdict.mayConfirmBooking,false);
 eq(verdict.calendarDelivered,false);eq(verdict.mayRetryAutomatically,false);
}
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const sql=read("supabase/migrations/20261014225500_v3_232_scoped_booking_close_revision.sql");
for(const word of [
 "busy_close_linked_booking_current_v3232",
 "security definer", "set search_path=''",
 "for update","p_expected_status","p_expected_updated_at",
 "v_req.updated_at is distinct from p_expected_updated_at",
 "busy_business_memberships",
 "busy_mark_mini_app_request_link_v3181",
 "freshOwnerRevisionVerified","atomicBookingCloseVerified",
 "from public,anon,authenticated","to service_role"
])ok(sql.toLowerCase().includes(word.toLowerCase()),word);
ok(!sql.includes("cron.schedule"));ok(!sql.includes("net.http_post"));
const edge=read("supabase/functions/busy-mini-apps/index.ts");
ok(edge.includes('supabase.rpc("busy_close_linked_booking_current_v3232"'));
ok(edge.includes('supabase.rpc("busy_mark_mini_app_request_link_v3181"'));
ok(edge.includes("classifyBookingClosureEvidenceV3232"));
ok(edge.includes("ownerStatusRevisionGuard:true"));
ok(edge.includes("expectedUpdatedAt:freshness.expectedUpdatedAt"));
ok(edge.includes("requestReadbackPending:true"));
const closing=edge.slice(edge.indexOf('if(status==="closed"&&linkedState.data?.customer_record_id)'),edge.indexOf('if(decision.noChange)'));
ok(!closing.includes('const closed=await supabase.from'));
ok(closing.includes("atomicBookingClosureCommitted:true"));
ok(closing.includes('notificationDeliveryVerified:false'));
const script=read("staging/ci-linked-booking-close-v3232.sql");
for(const needle of ["V3.232_ATOMIC_OWNER_BOOKING_CLOSE_AND_FAULT_ROLLBACK_PASS",
 "V3.232_DISPOSABLE_DURABLE_WORK_ROLLBACK_PASS",
 "ci_v3232_fail_work_cancel","PARTIAL COMMIT",
 "Cross-tenant actor closed draft","Stale draft close accepted",
 "Confirmed booking closure was not atomic"])ok(script.includes(needle));
await import("./prepare-two-business-auth-v3231.mjs");
const packet=JSON.parse(readFileSync("/tmp/bdi-v3231-real-auth-review/two-business-plan.json","utf8"));
eq(packet.versionedMigrationCount,69);
eq(packet.realJwtTested,false);eq(packet.sqlExecuted,false);
ok(packet.scenarios.every(x=>x.status==="not_verified"));
console.log("V3.232: "+n+" offline exact booking, rollback wiring and staging contract checks passed.");
