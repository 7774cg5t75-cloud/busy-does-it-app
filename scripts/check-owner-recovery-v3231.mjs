/**
 * V3.231 offline: stale owner clicks, uncertain-write reconciliation, real
 * source wiring and two-business disposable Postgres fixture.
 * Live JWT and hosted staging remain explicitly UNVERIFIED.
 */
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {verifyOwnerRequestFreshnessV3231 as fresh}
 from "../supabase/functions/busy-mini-apps/ownerRequestFreshnessV3231.mjs";
import {interpretOwnerStatusAfterErrorV3231 as recover}
 from "../src/core/ownerStatusRecoveryV3231.mjs";
let count=0;
const eq=(a,b)=>{assert.deepEqual(a,b);count++};
const ok=(v,m)=>{assert.ok(v,m);count++};
const B="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const OTHER="bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const R="cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const APP="dddddddd-dddd-4ddd-8ddd-dddddddddddd";
const time="2026-10-14T21:21:00.123456+00:00";
const record={id:R,business_id:B,mini_app_id:APP,status:"received",updated_at:time};
const input={businessId:B,requestId:R,stored:record,
 expectedStatus:"received",expectedUpdatedAt:time};
const good=fresh(input);
eq(good.ok,true);eq(good.mayWrite,true);
eq(good.expectedUpdatedAt,time);eq(good.customerNotified,false);
const blocked=[
 {...input,businessId:OTHER},
 {...input,requestId:OTHER},
 {...input,stored:{...record,business_id:OTHER}},
 {...input,stored:{...record,mini_app_id:"wrong"}},
 {...input,stored:{...record,status:"reviewing"}},
 {...input,stored:{...record,updated_at:"2026-10-14T21:22:00.123456+00:00"}},
 {...input,expectedStatus:"reviewing"},
 {...input,expectedStatus:"invalid"},
 {...input,expectedUpdatedAt:""},
 {...input,expectedUpdatedAt:"2026-10-14"},
 {...input,expectedUpdatedAt:time.repeat(2)},
 {...input,stored:null}
];
for(const x of blocked){
 const verdict=fresh(x);eq(verdict.ok,false);
 eq(verdict.mayWrite,false);eq(verdict.customerNotified,false);
}
const receipt={ok:true,found:true,requestId:R,requestType:"enquiry",
 requestStatus:"reviewing",ownerReadbackVerified:true,
 reachedCorrectBusinessVerified:true,notificationDeliveredVerified:false};
const rargs={businessId:B,requestId:R,desiredStatus:"reviewing",receipt};
const reconciled=recover(rargs);
eq(reconciled.kind,"current_target_observed");
eq(reconciled.writeProven,false);eq(reconciled.mayRetryAutomatically,false);
eq(reconciled.customerNotified,false);
eq(reconciled.bookingConfirmed,false);
ok(reconciled.ownerText.includes("cannot verify which action"));
const diff=recover({...rargs,desiredStatus:"closed"});
eq(diff.kind,"different_current_status");
eq(diff.writeProven,false);
for(const bad of [
 {...rargs,receipt:null},
 {...rargs,receipt:{...receipt,ok:false}},
 {...rargs,receipt:{...receipt,requestId:OTHER}},
 {...rargs,receipt:{...receipt,reachedCorrectBusinessVerified:false}},
 {...rargs,receipt:{...receipt,ownerReadbackVerified:false}},
 {...rargs,receipt:{...receipt,requestStatus:"untrusted"}},
 {...rargs,businessId:"malformed"}
]){
 const verdict=recover(bad);eq(verdict.kind,"unverified");
 eq(verdict.mayRetryAutomatically,false);eq(verdict.writeProven,false);
}
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const server=read("supabase/functions/busy-mini-apps/index.ts");
ok(server.includes("verifyOwnerRequestFreshnessV3231"));
ok(server.includes(".eq(\"updated_at\",freshness.expectedUpdatedAt)"));
ok(server.includes(".eq(\"status\",freshness.expectedStatus)"));
const current=server.indexOf("async function updateRequestStatus(");
ok(current>0);
const guarded=server.indexOf("if(!freshness.ok)throw Error(freshness.reason)",current);
const linked=server.indexOf("const linkedState=await",current);
ok(guarded>current&&linked>guarded,"Stale must reject before linked-work operations");
const native=read("src/app/AppController.js");
ok(native.includes("expectedStatus:expectedRequest.status"));
ok(native.includes("expectedUpdatedAt:expectedRequest.updated_at"));
ok(native.includes("interpretOwnerStatusAfterErrorV3231"));
ok(native.includes('miniAppsRequest("owner_inbox_receipt",{requestId})'));
ok(!native.includes("autoRetryOwnerStatusV3231"));
const ui=read("src/screens/miniApps.js");
ok(ui.includes('s.updateMiniAppRequestStatus(request.id, "reviewing", request)'));
ok(ui.includes('s.updateMiniAppRequestStatus(request.id, "declined", request)'));
ok(ui.includes('actions.canReview ? ('));
const fixture=read("staging/CI_ONLY_v3231_owner_status_cas.sql");
ok(fixture.includes("V3.231_EPHEMERAL_OWNER_CAS_AND_TENANT_SCOPE_PASS"));
ok(fixture.includes("v_first.business_id"));
ok(fixture.includes("v_other.business_id"));
ok(fixture.includes("updated_at=v_first.updated_at"));
const assembler=read("scripts/prepare-disposable-owner-cas-v3231.mjs");
ok(assembler.includes("V3.231_EPHEMERAL_OWNER_FRESHNESS_ROLLBACK_PASS"));
ok(assembler.includes("actualStagingContacted:false"));
await import("./prepare-two-business-auth-v3231.mjs");
const packet=JSON.parse(readFileSync("/tmp/bdi-v3231-real-auth-review/two-business-plan.json","utf8"));
eq(packet.versionedMigrationCount,69);
eq(packet.scenarios.length,11);
ok(packet.scenarios.every(x=>x.status==="not_verified"&&x.requiresRealAuthJwt));
ok(packet.sourceFiles.every(x=>/^[a-f0-9]{64}$/.test(x.sha256)));
eq(packet.approvedForInstall,false);
eq(packet.approvedForLiveAuthTest,false);
eq(packet.realJwtTested,false);
eq(packet.sqlExecuted,false);
eq(packet.maySend,false);
console.log("V3.231: "+count+" offline stale-click, readback and tenant-contract assertions passed.");
