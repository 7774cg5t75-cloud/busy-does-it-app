import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {METRICS,digestAutomaticTelemetry,usageReview} from "../supabase/functions/busy-founder-ops/autoTelemetry.mjs";
import {buildServiceInventory} from "../supabase/functions/busy-founder-ops/serviceRegister.mjs";
import {readConfiguredProviders,parseGitHubActionsUsage,parseCloudflareSample,
  readGitHubUsage,readCloudflareTraffic}
 from "../supabase/functions/busy-founder-ops/providerReaders.mjs";
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
assert.equal(readConfiguredProviders({}).github,false);
assert.equal(readConfiguredProviders({}).cloudflare,false);
assert.equal(readConfiguredProviders({
 GITHUB_BILLING_READ_TOKEN:"abc",GITHUB_BILLING_ACCOUNT:"bad/owner"
}).github,false);
assert.equal(readConfiguredProviders({
 GITHUB_BILLING_READ_TOKEN:"token",GITHUB_BILLING_ACCOUNT:"7774cg5t75-cloud",
 CLOUDFLARE_ANALYTICS_READ_TOKEN:"token",CLOUDFLARE_ACCOUNT_TAG:"a".repeat(32),
 CLOUDFLARE_WORKER_SCRIPT:"busy-worker"
}).github,true);
assert.equal(readConfiguredProviders({
 CLOUDFLARE_ANALYTICS_READ_TOKEN:"token",CLOUDFLARE_ACCOUNT_TAG:"a".repeat(32),
 CLOUDFLARE_WORKER_SCRIPT:"my-worker"
}).cloudflare,true);
assert.equal(parseGitHubActionsUsage({usageItems:[
 {product:"Actions",unitType:"minutes",grossQuantity:10},
 {product:"Actions",unitType:"minutes",grossQuantity:15},
 {product:"Packages",unitType:"GB",grossQuantity:100}
]}),25);
assert.equal(parseGitHubActionsUsage({usageItems:[{
 product:"Actions",unitType:"minutes",grossQuantity:"100"
}]}),null);
assert.equal(parseGitHubActionsUsage({usageItems:"untrusted"}),null);
assert.equal(parseCloudflareSample({data:{viewer:{accounts:[{
 workersInvocationsAdaptive:[{sum:{requests:4}},{sum:{requests:6}}]
}]}}}),10);
assert.equal(parseCloudflareSample({errors:[{message:"bad"}],
 data:{viewer:{accounts:[{workersInvocationsAdaptive:[]}]}}}),null);
assert.equal(parseCloudflareSample({data:{viewer:{accounts:[{
 workersInvocationsAdaptive:Array.from({length:100},()=>({sum:{requests:1}}))
}]}}}),null);
{
 let outbound=0;
 const none=async()=>{outbound++;throw Error("Should not fetch");};
 const git=await readGitHubUsage({},none,new Date(now));
 const cloud=await readCloudflareTraffic({},none,new Date(now));
 assert.equal(git.status,"not_connected");
 assert.equal(cloud.status,"not_connected");
 assert.equal(outbound,0);
}
{
 const env={GITHUB_BILLING_READ_TOKEN:"read-secret",
  GITHUB_BILLING_ACCOUNT:"7774cg5t75-cloud"};
 let method="",url="";
 const mock=async(u,opt)=>{url=u;method=opt?.method||"GET";return {
  ok:true,json:async()=>({usageItems:[{product:"Actions",unitType:"minutes",grossQuantity:12}]})
 }};
 const got=await readGitHubUsage(env,mock,new Date(now));
 assert.equal(got.status,"read_success");
 assert.equal(got.usageValue,12);
 assert.equal(got.usageUnit,"Actions minutes (month)");
 assert.equal(method,"GET");
 assert.ok(url.startsWith("https://api.github.com/users/7774cg5t75-cloud/settings/billing/usage/summary"));
  assert.ok(url.includes("year=2026&month=10"));
 assert.ok(!JSON.stringify(got).includes("read-secret"));
}
{
 const env={CLOUDFLARE_ANALYTICS_READ_TOKEN:"cloud-secret",
   CLOUDFLARE_ACCOUNT_TAG:"a".repeat(32),
   CLOUDFLARE_WORKER_SCRIPT:"busy-worker"};
 let method="",url="",posted;
 const mock=async(u,opt)=>{url=u;method=opt?.method;posted=JSON.parse(opt.body);
   return {ok:true,json:async()=>({data:{viewer:{accounts:[{
     workersInvocationsAdaptive:[{sum:{requests:9}}]}]}}})};
 };
 const got=await readCloudflareTraffic(env,mock,new Date(now));
 assert.equal(got.status,"read_success");
 assert.equal(got.usageValue,9);
 assert.equal(method,"POST");
 assert.equal(url,"https://api.cloudflare.com/client/v4/graphql");
 assert.equal(posted.variables.scriptName,"busy-worker");
  assert.ok(posted.query.includes("$datetimeStart: string"));
  assert.ok(posted.query.includes("$datetimeEnd: string"));
  assert.ok(posted.query.includes("$accountTag: string"));
 assert.ok(!JSON.stringify(got).includes("cloud-secret"));
 assert.ok(got.note.includes("NOT billable"));
}
{
  const org={GITHUB_BILLING_READ_TOKEN:"scoped-read-only",
    GITHUB_BILLING_ACCOUNT:"7774cg5t75-cloud",
    GITHUB_BILLING_SCOPE:"organization"};
  let visited="";
  const got=await readGitHubUsage(org,async(url)=>{visited=url;
    return {ok:true,json:async()=>({usageItems:[
      {product:"Actions",unitType:"minutes",grossQuantity:14}
    ]})}},new Date(now));
  assert.equal(got.status,"read_success");
  assert.equal(got.usageValue,14);
  assert.ok(visited.startsWith("https://api.github.com/organizations/7774cg5t75-cloud/settings/billing/usage/summary"));
}
const providerMigration=readFileSync(
 new URL("../supabase/migrations/20261009124500_v382_provider_readonly_source.sql",import.meta.url),"utf8");
const limiterMigration=readFileSync(
 new URL("../supabase/migrations/20261009125500_v382_provider_refresh_limits.sql",import.meta.url),"utf8");
assert.ok(providerMigration.includes("provider_api_readonly"));
assert.ok(limiterMigration.includes("security invoker"));
assert.ok(limiterMigration.includes("busy_claim_founder_provider_window"));
assert.ok(limiterMigration.includes("revoke all on public.busy_founder_provider_refresh_slots from public,anon,authenticated"));
const providerDigest=buildServiceInventory([{...observation,
 source:"provider_api_readonly",usage_value:180,allowance_value:null}],{checkedAt:now});
assert.equal(providerDigest.services.find(x=>x.key==="supabase").latest.source,"provider_api_readonly");
assert.equal(providerDigest.services.find(x=>x.key==="supabase").latest.invoiceVerified,false);

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
assert.ok(backend.includes('action==="sync_connected_providers"'));
assert.ok(backend.indexOf("authenticatedUser(req)")<backend.indexOf('action==="sync_connected_providers"'));
assert.ok(backend.includes("busy_claim_founder_provider_window"));
assert.ok(backend.includes('source:"provider_api_readonly"'));
assert.ok(backend.includes('const env=providerEnv()'));
assert.ok(backend.includes('BUSY_GITHUB_BILLING_SCOPE'));
assert.ok(backend.includes('busy_claim_founder_provider_window'));
assert.ok(screen.includes("Verify configured provider feeds now"));
const controller=readFileSync(new URL("../src/app/AppController.js",import.meta.url),"utf8");
assert.ok(controller.includes("const syncFounderConnectedProviders = async"));
assert.ok(controller.includes('action:"sync_connected_providers"'));
assert.ok(controller.includes("syncFounderConnectedProviders,"));

assert.ok(screen.includes("V3.82 • Automatic monitoring"));
assert.ok(screen.includes("updated by a server schedule"));
assert.ok(screen.includes("They are NOT official Supabase Edge Function usage"));
assert.ok(screen.includes("Provider billing not connected"));
assert.ok(screen.includes("Automatic purchases, upgrades or renewals"));
assert.ok(ci.includes("node scripts/check-financial-autopilot-v382.mjs"));
console.log("V3.82 PASS: hourly confidential first-party usage; no fake billing; 50/75/90 review tiers and renewal checks; source and permission safeguards.");
