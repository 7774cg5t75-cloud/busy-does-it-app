/**
 * V3.231 OFFLINE regression: owner-approved snapshot freshness, tenant
 * denial, stale Work-action guard and preserved owner/customer UI contracts.
 * Not real hosted JWT/RLS, no payment, notifications or SQL installation.
 */
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {verifyOwnerRequestFreshnessV3231 as verify}
 from "../supabase/functions/busy-mini-apps/ownerRequestFreshnessV3231.mjs";
const id="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const business="bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const app="cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const t="2026-10-14T21:00:00.123456+00:00";
const current={id,business_id:business,mini_app_id:app,status:"received",
 updated_at:t};
const req={businessId:business,requestId:id,stored:current,
 expectedStatus:"received",expectedUpdatedAt:t};
let checks=0;const eq=(a,b)=>{assert.deepEqual(a,b);checks++;};
const ok=(v,m)=>{assert.ok(v,m);checks++;};
const pass=verify(req);
eq(pass.ok,true);eq(pass.mayWrite,true);
eq(pass.expectedStatus,"received");eq(pass.expectedUpdatedAt,t);
eq(pass.customerNotified,false);eq(pass.bookingConfirmed,false);
const denied=[
 {...req,businessId:app},
 {...req,requestId:business},
 {...req,stored:{...current,business_id:app}},
 {...req,stored:{...current,mini_app_id:"invalid"}},
 {...req,stored:null},
 {...req,stored:{...current,status:"reviewing"}},
 {...req,stored:{...current,updated_at:"2026-10-14T21:00:01+00:00"}},
 {...req,expectedStatus:"reviewing"},
 {...req,expectedStatus:"not_valid"},
 {...req,expectedUpdatedAt:""},
 {...req,expectedUpdatedAt:"2026-10-14"},
 {...req,expectedUpdatedAt:"14/10/2026"},
 {...req,expectedUpdatedAt:"2026-99-99T21:00:00Z"},
 {...req,expectedUpdatedAt:t.repeat(2)}
];
for(const item of denied){
 const x=verify(item);eq(x.ok,false);eq(x.mayWrite,false);
 eq(x.customerNotified,false);eq(x.bookingConfirmed,false);
}
const code=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const server=code("supabase/functions/busy-mini-apps/index.ts");
ok(server.includes("verifyOwnerRequestFreshnessV3231"));
ok(server.includes('expectedStatus:clean(body?.expectedStatus,40)'));
ok(server.includes('expectedUpdatedAt:clean(body?.expectedUpdatedAt,45)'));
ok(server.includes('if(!freshness.ok)throw Error(freshness.reason)'));
ok(server.includes('.eq("status",freshness.expectedStatus)'));
ok(server.includes('.eq("updated_at",freshness.expectedUpdatedAt)'));
const position=server.indexOf('if(!freshness.ok)throw Error(freshness.reason)');
ok(position>0&&position<server.indexOf('const linkedState=await',position));
const ctl=code("src/app/AppController.js");
ok(ctl.includes("const updateMiniAppRequestStatus = async (requestId, status, expectedRequest)"));
ok(ctl.includes("expectedStatus:expectedRequest.status"));
ok(ctl.includes("expectedUpdatedAt:expectedRequest.updated_at"));
ok(ctl.includes('Open the latest customer request before changing its status.'));
const screen=code("src/screens/miniApps.js");
ok(screen.includes('s.updateMiniAppRequestStatus(request.id, "reviewing", request)'));
ok(screen.includes('s.updateMiniAppRequestStatus(request.id, "declined", request)'));
ok(screen.includes('!link && request.status === "received" ? ('));
ok(screen.includes('!link && ["received","reviewing"].includes(request.status) ? ('));
ok(screen.includes('ownerView && !link && request.status === "received" ? ('));
const sql=code("staging/CI_ONLY_v3231_owner_status_cas.sql");
ok(sql.includes("V3.231_EPHEMERAL_OWNER_CAS_AND_TENANT_SCOPE_PASS"));
ok(sql.includes("business_id=v_other.business_id"));
ok(sql.includes("updated_at=v_first.updated_at-interval"));
ok(sql.includes("status=v_first.status and updated_at=v_first.updated_at"));
ok(!sql.includes("cron.schedule"));ok(!sql.includes("net.http_post"));
console.log("V3.231: "+checks+" scoped owner freshness, UI and source contract checks passed.");
