import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {reconcileWorkBookingLedger} from "../src/core/workBookingReconciliationV3181.mjs";
let checks=0;
function eq(a,b){assert.deepEqual(a,b);checks++;}
function ok(x){assert.ok(x);checks++;}
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const business="11111111-1111-4111-8111-111111111111";
const wrong="22222222-2222-4222-8222-222222222222";
const app="33333333-3333-4333-8333-333333333333";
const id1="44444444-4444-4444-8444-444444444444";
const id2="55555555-5555-4555-8555-555555555555";
const id3="66666666-6666-4666-8666-666666666666";
const row=(request_id,calendar_date="2026-11-12",state="confirmed")=>({
 id:request_id,business_id:business,mini_app_id:app,request_id,
 customer_record_id:"customer-"+request_id.slice(0,4),
 action_record_id:"action-"+request_id.slice(0,4),
 calendar_date,calendar_time:"14:30:00",state,
 secret:"PRIVATE_DATA_DO_NOT_RETURN"
});
const local=[
 {sourceMiniAppRequestId:id1,date:"2026-11-11",time:"10:00",
  value:45,customerName:"Local Customer A",service:"Haircut",customerId:"local-1"},
 {sourceMiniAppRequestId:id2,date:"2026-11-10",time:"10:00",
  customerName:"Should be cancelled",service:"Service"},
 {customerId:"regular-work",customerName:"Other appointment",
  date:"2026-11-15",time:"16:30",service:"Cleaning"}
];
const result=reconcileWorkBookingLedger({
 businessId:business,appId:app,localBookings:local,
 ledger:{rows:[row(id1),row(id2,"2026-11-10","cancelled"),row(id3)],truncated:false}
});
ok(result.ok);eq(result.counts.serverConfirmed,2);
eq(result.counts.matchedDevice,1);eq(result.counts.serverOnly,1);
eq(result.counts.cancelled,1);eq(result.counts.disagreements,1);
eq(result.counts.localOnly,1);eq(result.bookings.length,3);
ok(!result.bookings.some(r=>r.sourceMiniAppRequestId===id2));
eq(result.bookings.find(r=>r.sourceMiniAppRequestId===id1).date,"2026-11-12");
eq(result.bookings.find(r=>r.sourceMiniAppRequestId===id1).value,45);
eq(result.bookings.find(r=>r.sourceMiniAppRequestId===id3).service,"Business App booking");
eq(result.providerDeliveryIndependentlyVerified,false);
ok(!JSON.stringify(result).includes("PRIVATE_DATA_DO_NOT_RETURN"));
ok(!reconcileWorkBookingLedger({businessId:business,appId:app,
 ledger:{rows:[{...row(id1),business_id:wrong}]},localBookings:local}).ok);
ok(!reconcileWorkBookingLedger({businessId:business,appId:app,
 ledger:{rows:[row(id1),row(id1)]},localBookings:[]}).ok);
ok(!reconcileWorkBookingLedger({businessId:business,appId:app,
 ledger:{rows:[{...row(id1),calendar_date:"not-date"}]},localBookings:[]}).ok);
ok(!reconcileWorkBookingLedger({businessId:business,appId:app,localBookings:[]}).ok);
const empty=reconcileWorkBookingLedger({businessId:business,appId:app,
 ledger:{rows:[]},localBookings:local});
ok(empty.ok);eq(empty.counts.localOnly,3);
const sql=read("supabase/migrations/20261012193000_v3_181_durable_work_booking_ledger.sql");
for(const x of ["busy_mini_app_work_bookings","unique references public.busy_mini_app_requests",
 "force row level security","for update","busy_mark_mini_app_request_link_v3180",
 "busy_mark_mini_app_request_link_v3181","calendar_timezone","pg_timezone_names",
 "revoke execute on function public.busy_mark_mini_app_request_link_v3180",
 "to service_role","on conflict (request_id) do nothing","cancelled_at=now()"]){
 ok(sql.toLowerCase().includes(x.toLowerCase()));
}
const ci=read("staging/ci-durable-work-v3181.sql");
for(const x of ["ci_fail_durable_work_v3181",
 "PARTIAL COMMIT","Repeat confirmation duplicated",
 "Cross-tenant actor accepted","V3.181 DISPOSABLE DURABLE WORK LEDGER PASS"]){
 ok(ci.includes(x));
}
const edge=read("supabase/functions/busy-mini-apps/index.ts");
ok(edge.includes('supabase.rpc("busy_mark_mini_app_request_link_v3181"'));
ok(edge.includes('ownerWorkBookingLedger(businessId,app.id)'));
ok(edge.includes('workLedgerDurable:result.workLedgerDurable===true'));
ok(!edge.slice(edge.indexOf("async function markRequestLinked("),
 edge.indexOf("/**\n * V3.159:")).includes(".upsert("));
const controller=read("src/app/AppController.js");
ok(controller.includes("reconcileWorkBookingLedger({"));
ok(controller.includes("workLedgerReview:durableWorkReview"));
ok(controller.includes("workBookingLedger: data?.workBookingLedger?.rows"));
ok(controller.includes("bookings: executiveConfirmedBookings"));
const screen=read("src/screens/work.js");
ok(screen.includes("BUSY Business App bookings saved on server"));
ok(screen.includes("s.workLedgerReview?.ok"));
const domain=read("src/domain/miniApps.js");
ok(domain.includes("workBookingLedger,"));
const guard=read("staging/ISOLATED_ONLY_readiness_v3181.sql");
const meaningful=guard.replace(/--[^\n]*/g,"");
ok(!/\b(create|alter|drop|insert|update|delete|grant|revoke)\s+(?:table|function|role|extension|into)\b/i.test(meaningful));
ok(guard.includes("to_regclass"));
const edgeBlock=edge.slice(edge.indexOf("async function updateRequestStatus("),
  edge.indexOf("async function awardLoyaltyStamp("));
ok(edgeBlock.includes("await markRequestLinked(userId,businessId"));
ok(edgeBlock.includes('if(status==="accepted"&&current.data.status!=="accepted")'));
ok(edge.includes('durableWriteCommitted:true,externalDeliveryVerified:false'));
ok(edge.includes("statusRefreshRequired:true"));
const bookingBlock=controller.slice(controller.indexOf("  const setBookingStatus = async ("),
 controller.indexOf("  const markBookingCompleted ="));
ok(bookingBlock.includes("if(linked.status)applyMiniAppsStatus(linked)"));
ok(bookingBlock.includes("else await refreshMiniAppsStatus({quiet:true})"));
const workScreen=read("src/screens/work.js");
ok(workScreen.includes("s.workLedgerReview.bookings.map"));
ok(workScreen.includes('s.go("miniAppBuilder")'));
console.log("V3.181 "+checks+" focused assertions PASS; real rollback checks run separately in PostgreSQL CI.");
