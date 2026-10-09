import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {METRICS,digestAutomaticTelemetry,usageReview} from "../supabase/functions/busy-founder-ops/autoTelemetry.mjs";
import {buildServiceInventory} from "../supabase/functions/busy-founder-ops/serviceRegister.mjs";
const now="2026-10-09T11:00:00.000Z";
assert.equal(METRICS.length,6);
assert.equal(new Set(METRICS.map(m=>m.key)).size,6);
assert.equal(digestAutomaticTelemetry([],{checkedAt:now}).metrics.length,6);
for(const m of digestAutomaticTelemetry([],{checkedAt:now}).metrics){
 assert.equal(m.status,"not_measured");assert.equal(m.value,null);
 assert.equal(m.notProviderBilling,true);
}
const sample=METRICS.map((m,i)=>({
 metric_key:m.key,source:"busy_internal_database",
 value:String(i),observed_at:"2026-10-09T10:30:00Z"
}));
const report=digestAutomaticTelemetry(sample,{checkedAt:now});
assert.equal(report.scope,"founder_auto_telemetry");
assert.equal(report.registeredBillingIntegrations,0);
assert.equal(report.scheduledInterval,"hourly");
assert.equal(report.metrics[0].value,0);
assert.equal(report.metrics[5].value,5);
assert.equal(report.metrics[5].status,"recent");
assert.equal(report.metrics[4].name,"Business workspaces");
const prior=digestAutomaticTelemetry(sample.map(r=>({
 ...r,observed_at:"2026-10-07T10:30:00Z"})),{checkedAt:now});
assert.equal(prior.metrics[0].status,"stale");
const invalid=digestAutomaticTelemetry([
 {...sample[0],value:null},
 {...sample[1],source:"attacker_claims_official_billing"},
 {...sample[2],value:-5},
 {...sample[3],observed_at:"bad-date"},
],{checkedAt:now});
for(let i=0;i<4;i++)assert.equal(invalid.metrics[i].value,null);
assert.equal(usageReview(50,{fresh:false,source:"official_provider_api"}),null);
assert.equal(usageReview(90,{fresh:true,source:"founder_entered"}),null);
assert.equal(usageReview(49,{fresh:true,source:"official_provider_api"}),null);
assert.equal(usageReview(50,{fresh:true,source:"official_provider_api"}),"notice");
assert.equal(usageReview(75,{fresh:true,source:"official_provider_api"}),"high");
assert.equal(usageReview(90,{fresh:true,source:"official_provider_api"}),"critical");
const observation={service_key:"supabase",source:"verified_log_sample",
 plan_name:"Free",billing_status:"free",billing_cadence:"monthly",
 usage_value:14493,allowance_value:500000,usage_unit:"Edge Function invocations",
 observed_at:"2026-10-09T09:20:00.000Z",renewal_on:null};
for(const [fraction,level] of [[0.49,null],[0.50,"50"],[0.75,"75"],[0.90,"90"]]){
 const d=buildServiceInventory([{...observation,usage_value:Math.round(500000*fraction)}],{checkedAt:now});
 const service=d.services.find(s=>s.key==="supabase");
 assert.equal(service.usageReviewLevel,level);
 if(level)assert.equal(service.alertProvenance,"historical_review_only");
}
const renewal=buildServiceInventory([{...observation,renewal_on:"2026-10-20"}],{checkedAt:now});
assert.equal(renewal.services.find(s=>s.key==="supabase").renewalReview,"review_within_30_days");
assert.equal(renewal.services.find(s=>s.key==="supabase").alertProvenance,"historical_review_only");
assert.equal(renewal.billsVerified,false);
assert.equal(renewal.totalCostGbp,null);
const migration=readFileSync(new URL("../supabase/migrations/20261009123000_v382_internal_telemetry.sql",import.meta.url),"utf8");
const backend=readFileSync(new URL("../supabase/functions/busy-founder-ops/index.ts",import.meta.url),"utf8");
const screen=readFileSync(new URL("../src/screens/founderServiceCosts.js",import.meta.url),"utf8");
const ci=readFileSync(new URL("../.github/workflows/production-check.yml",import.meta.url),"utf8");
assert.ok(migration.includes("enable row level security"));
assert.ok(migration.includes("revoke all on public.busy_founder_auto_telemetry from public,anon,authenticated"));
assert.ok(migration.includes("security invoker"));
assert.ok(migration.includes("revoke all on function busy_platform_internal.capture_founder_telemetry() from public,anon,authenticated"));
assert.ok(migration.includes("busy-v382-founder-telemetry-hourly"));
assert.ok(migration.includes("'37 * * * *'"));
assert.ok(migration.includes("busy-v382-founder-telemetry-retention"));
assert.ok(migration.includes("busy_conversation_ai_usage_daily"));
assert.ok(migration.includes("busy_website_usage_daily"));
assert.ok(!migration.includes("Supabase billed invocations"));
assert.ok(backend.includes('safely(()=>privilegedRows("busy_founder_auto_telemetry"'));
assert.ok(backend.includes("automaticUsage:digestAutomaticTelemetry"));
assert.ok(backend.includes('action==="service_catalog"'));
assert.ok(backend.indexOf("authenticatedUser(req)")<backend.indexOf('action==="service_catalog"'));
assert.ok(backend.includes('billing_not_connected'));
assert.ok(screen.includes("V3.82 • Automatic monitoring"));
assert.ok(screen.includes("updated by a server schedule"));
assert.ok(screen.includes("They are NOT official Supabase Edge Function usage"));
assert.ok(screen.includes("Provider billing not connected"));
assert.ok(screen.includes("Automatic purchases, upgrades or renewals"));
assert.ok(ci.includes("node scripts/check-financial-autopilot-v382.mjs"));
console.log("V3.82 PASS: hourly confidential first-party usage; no fake billing; 50/75/90 review tiers and renewal checks; source and permission safeguards.");
