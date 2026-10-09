import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {SERVICES,validateServiceSnapshot,formatSnapshot,buildServiceInventory}
  from "../supabase/functions/busy-founder-ops/serviceRegister.mjs";

assert.equal(SERVICES.length,10);
assert.equal(new Set(SERVICES.map(x=>x.key)).size,10);
const base={serviceKey:"supabase",requestKey:"v381_test_0000000000001",
 planName:"Free",billingStatus:"free",billingCadence:"monthly",
 usageValue:14493,allowanceValue:500000,amountGbpPence:null,
 renewalOn:"",note:"Historic project + sibling-project request logs"};
const valid=validateServiceSnapshot(base);
assert.equal(valid.ok,true);
assert.equal(valid.record.service_key,"supabase");
assert.equal(valid.record.source,"founder_entered");
assert.equal(valid.record.usage_unit,"Edge Function invocations");
assert.equal(valid.record.usage_value,14493);
assert.equal(valid.record.allowance_value,500000);
for(const item of [
 {...base,serviceKey:"not_a_known_provider"},
 {...base,requestKey:"too_short"},
 {...base,requestKey:"site:../../pass"},
 {...base,amountGbpPence:-1},
 {...base,amountGbpPence:3.5},
 {...base,usageValue:-3},
 {...base,usageValue:Math.pow(2,53)},
 {...base,usageValue:"14493"},
 {...base,allowanceValue:500000,usageValue:null},
 {...base,billingStatus:"live"},
 {...base,billingCadence:"hourly"},
 {...base,renewalOn:"2026-02-30"},
 {...base,renewalOn:"2026-01-01; DROP TABLE"},
 {...base,planName:"x".repeat(81)},
 {...base,note:"x".repeat(501)},
 {...base,source:"verified_log_sample"},
 {...base,secret:"secret-value"}
])assert.equal(validateServiceSnapshot(item).ok,false,JSON.stringify(item).slice(0,110));
assert.equal(validateServiceSnapshot({...base,usageValue:null,allowanceValue:null,
 amountGbpPence:0}).ok,true);
assert.equal(validateServiceSnapshot({...base,amountGbpPence:1234,
 billingStatus:"paid",billingCadence:"annual",renewalOn:"2027-10-09"}).ok,true);
const observation={service_key:"supabase",source:"verified_log_sample",
 plan_name:"Free confirmed",billing_status:"free",billing_cadence:"monthly",
 usage_value:14493,allowance_value:500000,usage_unit:"Edge Function invocations",
 amount_gbp_pence:null,renewal_on:null,observed_at:"2026-10-09T09:20:00.000Z",
 note:"Source: October 1-9 sampled logs"};
const digest=buildServiceInventory([observation],{checkedAt:"2026-10-09T10:20:00.000Z"});
assert.equal(digest.scope,"founder_service_register");
assert.equal(digest.privacy,"founder_only");
assert.equal(digest.billsVerified,false);
assert.equal(digest.totalCostGbp,null);
assert.equal(digest.services.length,10);
const supabase=digest.services.find(x=>x.key==="supabase");
const cloudflare=digest.services.find(x=>x.key==="cloudflare");
assert.equal(supabase.latest.source,"verified_log_sample");
assert.equal(supabase.latest.measurementType,"One-off verified request logs");
assert.equal(supabase.latest.liveBilling,false);
assert.equal(supabase.latest.invoiceVerified,false);
assert.equal(supabase.latest.percentOfAllowance,2.9);
assert.equal(cloudflare.latest,null);
assert.equal(cloudflare.status,"not_measured");
assert.equal(cloudflare.freshness,"not_measured");
const coming=buildServiceInventory([{...observation,source:"founder_entered",
 renewal_on:"2026-10-25"}],{checkedAt:"2026-10-09T10:20:00.000Z"});
assert.equal(coming.services.find(x=>x.key==="supabase").renewalReview,"review_within_30_days");
const overdue=buildServiceInventory([{...observation,source:"founder_entered",
 renewal_on:"2026-10-01"}],{checkedAt:"2026-10-09T10:20:00.000Z"});
assert.equal(overdue.services.find(x=>x.key==="supabase").renewalReview,"past_review_date");
assert.equal(cloudflare.renewalReview,"not_recorded");

const changed=buildServiceInventory([{...observation,source:"founder_entered",
  usage_value:480000}],{checkedAt:"2026-10-09T10:20:00.000Z"});
assert.ok(changed.services.find(x=>x.key==="supabase").alert);
assert.equal(formatSnapshot({...observation,source:"founder_entered"}).measurementType,"Founder-entered snapshot");

const source=readFileSync(new URL("../supabase/functions/busy-founder-ops/index.ts",import.meta.url),"utf8");
const policy=readFileSync(new URL("../supabase/migrations/20261009111000_v381_founder_service_snapshots.sql",import.meta.url),"utf8");
const app=readFileSync(new URL("../src/app/AppController.js",import.meta.url),"utf8");
const screen=readFileSync(new URL("../src/screens/founderServiceCosts.js",import.meta.url),"utf8");
const hostScreen=readFileSync(new URL("../src/screens/founderOperations.js",import.meta.url),"utf8");
const workflow=readFileSync(new URL("../.github/workflows/production-check.yml",import.meta.url),"utf8");
assert.ok(policy.includes("enable row level security"));
assert.ok(policy.includes("revoke all on public.busy_founder_service_snapshots from public,anon,authenticated"));
assert.ok(policy.includes("grant select,insert on public.busy_founder_service_snapshots to service_role"));
assert.ok(policy.includes("unique(service_key,request_key)"));
assert.ok(policy.includes("source='founder_entered' and recorded_by is not null"));
assert.ok(policy.includes("14493,500000"));
assert.ok(policy.includes("2026-10-09 09:20:00+00"));
assert.ok(source.includes('authenticatedUser(req)'));
assert.ok(source.indexOf("authenticatedUser(req)")<source.indexOf('if(action==="record_service"'));
assert.ok(source.indexOf("authenticatedUser(req)")<source.indexOf('if(action==="service_catalog"'));
assert.ok(source.indexOf("authenticatedUser(req)")<source.indexOf('if(action==="demo_launch_status"'));
assert.ok(source.includes('validateServiceSnapshot(item.snapshot)'));
assert.ok(source.includes('recorded_by:founderId'));
assert.ok(source.includes('observed_at:new Date().toISOString()'));
assert.ok(source.includes('if(response.status===409)'));
assert.ok(source.includes('scope:"founder_demo_staging"'));
assert.ok(source.includes('verifiedExternalHttps:false'));
assert.ok(source.includes('explicitGoLiveApprovalStillRequired:true'));
assert.ok(source.includes('default_hostname:"eq."+name'));
assert.ok(app.includes('const fetchFounderServices = async ()'));
assert.ok(app.includes('const recordFounderService = async (snapshot)'));
assert.ok(app.includes('const fetchFounderDemoLaunch = async ()'));
assert.ok(app.includes('fetchFounderServices,'));
assert.ok(app.includes('fetchFounderDemoLaunch,'));
assert.ok(app.includes('recordFounderService,'));
assert.ok(hostScreen.includes('<FounderServiceCosts s={s} owner={owner} enabled={!!report}/>'));
assert.ok(screen.includes("No surprise")||screen.includes("no charges"));
assert.ok(screen.includes("Provider invoices automatically verified"));
assert.ok(screen.includes("Founder-entered snapshot saved"));
assert.ok(screen.includes("demo.busydoesit.co.uk"));
assert.ok(screen.includes('Renewal review reminder'));
assert.ok(screen.includes('const serviceLoader=React.useRef(s.fetchFounderServices)'));
assert.ok(screen.includes('const stagingLoader=React.useRef(s.fetchFounderDemoLaunch)'));

assert.ok(screen.includes("External HTTPS proof"));
assert.ok(screen.includes("Open current business Website Management"));
assert.ok(workflow.includes("node scripts/check-founder-operations-v381.mjs"));
console.log("V3.81 PASS: 10-vendor register, real log provenance, valid payment/usage inputs, founder-only server actions, private staging evidence and no false invoices.");
