import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {isFounderUser,aggregateUsageRows,buildFounderReport} from "../supabase/functions/busy-founder-ops/report.mjs";
const uid="11111111-1111-4111-8111-111111111111";
const trueFounder={id:uid,aud:"authenticated",app_metadata:{busy_platform_role:"founder"},user_metadata:{is_admin:false}};
assert.equal(isFounderUser(trueFounder),true);
for(const candidate of [
 null,{}, {id:uid,aud:"anonymous",app_metadata:{busy_platform_role:"founder"}},
 {id:uid,aud:"authenticated",user_metadata:{busy_platform_role:"founder"}},
 {id:uid,aud:"authenticated",app_metadata:{busy_platform_role:"owner"}},
 {id:"not-a-uuid",aud:"authenticated",app_metadata:{busy_platform_role:"founder"}},
])assert.equal(isFounderUser(candidate),false,JSON.stringify(candidate));
assert.equal(aggregateUsageRows([{request_count:1},{request_count:4}],{exhaustive:true,field:"request_count"}),5);
assert.equal(aggregateUsageRows([],{exhaustive:true,field:"request_count"}),0);
assert.equal(aggregateUsageRows([{request_count:-1}],{exhaustive:true,field:"request_count"}),null);
assert.equal(aggregateUsageRows([{request_count:"unknown"}],{exhaustive:true,field:"request_count"}),null);
assert.equal(aggregateUsageRows([{request_count:5}],{exhaustive:false,field:"request_count"}),null);
assert.equal(aggregateUsageRows([{request_count:3},{request_count:4}],{exhaustive:true,field:"request_count",maxRows:1}),null);
assert.equal(buildFounderReport({counts:{businessWorkspaces:99},verifiedRole:false}),null);
const base={
 verifiedRole:true,checkedAt:"2026-10-08T21:05:00Z",
 counts:{businessWorkspaces:2,businessMemberships:3,activeWorkspaces7d:1,
 pendingWebsiteJobs:1,failedWebsiteJobs:2,failedSocialPosts:1,failedBusinessApps:0},
 usage:{aiRequests30d:13,siteRequests30d:543},
};
const r=buildFounderReport(base);
assert.equal(r.scope,"platform_aggregate");
assert.equal(r.privacy,"aggregate_only");
assert.equal(r.status,"read_only");
assert.equal(r.metrics.businessWorkspaces,2);
assert.equal(r.metrics.failedSocialPosts,1);
assert.equal(r.metrics.pendingWebsiteJobs,1);
assert.equal(r.metrics.activeWorkspaces7d,1);
assert.equal(r.usage.aiRequestEvents30d,13);
assert.equal(r.usage.websiteRequests30d,543);
assert.equal(r.incidents.filter(x=>x.needsInspection).length,3);
assert.equal(r.commercial.targetSubscriptionGbpPerMonth,50);
for(const prop of ["payingSubscribers","grossMrrGbp","netMrrGbp","infrastructureCostGbp","aiCostGbp","marginGbp"])
  assert.equal(r.commercial[prop],null,prop);
assert.equal(r.automation.enabled,true);
assert.equal(r.automation.alertDeliveryConfigured,false);
assert.equal(r.autopilot.status,"not_started");
assert.equal(r.autopilot.alerts.configured,false);
assert.equal(r.autopilot.recovery.status,"observe_only");
assert.equal(r.automation.alertDeliveryConfigured,false);
assert.ok(!JSON.stringify(r).includes(uid));
const partial=buildFounderReport({verifiedRole:true,
  counts:{businessWorkspaces:4},
  usage:{aiRequests30d:null,siteRequests30d:33}});
assert.equal(partial.metrics.failedSocialPosts,null);
assert.equal(partial.usage.aiRequestEvents30d,null);
assert.equal(partial.usage.coverage,"incomplete");
assert.ok(partial.notes.some(s=>s.includes("unavailable")));
const invalid=buildFounderReport({verifiedRole:true,
  counts:{businessWorkspaces:-1,businessMemberships:Infinity},
  usage:{aiRequests30d:-1,siteRequests30d:0}});
assert.equal(invalid.metrics.businessWorkspaces,null);
assert.equal(invalid.metrics.businessMemberships,null);
assert.equal(invalid.usage.aiRequestEvents30d,null);
assert.equal(invalid.usage.websiteRequests30d,0);
const edge=readFileSync(new URL("../supabase/functions/busy-founder-ops/index.ts",import.meta.url),"utf8");
const screen=readFileSync(new URL("../src/screens/founderOperations.js",import.meta.url),"utf8");
const controller=readFileSync(new URL("../src/app/AppController.js",import.meta.url),"utf8");
const registry=readFileSync(new URL("../src/screens/index.js",import.meta.url),"utf8");
const production=readFileSync(new URL("../src/screens/productionBridge.js",import.meta.url),"utf8");
const config=readFileSync(new URL("../supabase/config.toml",import.meta.url),"utf8");
const fullReply=JSON.stringify(r);
for(const banned of ["@gmail.com","@example.org","Bearer ","customer_id","business_name","service_role"])
 assert.ok(!fullReply.includes(banned),banned);
// Role lookup must happen with the auth server before any privileged query.
assert.ok(edge.includes('ROOT+"/auth/v1/user"'));
assert.ok(edge.includes("isFounderUser(user)?user:null"));
const gate=edge.indexOf("if(!founder)return send(403");
const db=edge.indexOf("aggregates(),incidentData()");
assert.ok(gate>0 && db>gate);
assert.ok(edge.includes('if(action!=="summary"||Object.keys(payload).some(k=>k!=="action"))'));
assert.ok(edge.includes('if(action==="acknowledge")'));
assert.ok(edge.includes('status:"eq.open"'));
assert.ok(edge.includes('Object.keys(payload).some(k=>k!=="action")'));
assert.ok(edge.includes("queryCount("));
assert.ok(edge.includes("queryUsageSum("));
assert.ok(!edge.includes("raw_user_meta_data"));
assert.ok(!edge.includes("user_metadata"));
assert.ok(!edge.includes("user_metadata"));
assert.ok(!edge.includes("req.headers.get(\"X-Admin\")"));
assert.ok(!edge.includes("update("));
assert.ok(!edge.includes("insert("));
assert.ok(!edge.includes("delete("));
assert.ok(!edge.includes("publish_now"));
assert.ok(!edge.includes("getAllUsers"));
assert.ok(config.includes("[functions.busy-founder-ops]"));
assert.ok(config.includes("verify_jwt = true"));
assert.ok(controller.includes('BUSY_SUPABASE_URL+"/functions/v1/busy-founder-ops"'));
assert.ok(controller.includes('body:JSON.stringify({action:"summary"})'));
assert.ok(controller.includes("fetchFounderOperations,"));
assert.ok(!screen.includes("SUPABASE_SERVICE_ROLE_KEY"));
assert.ok(screen.includes("nonce.current"));
assert.ok(screen.includes('status:denied?"denied":"unavailable"'));
assert.ok(registry.includes("founderOperations: FounderOperations"));
assert.ok(production.includes('s.go("founderOperations")'));
console.log("V3.69 founder-only role, aggregation, no-billing-fiction, denied access and navigation regressions passed");
