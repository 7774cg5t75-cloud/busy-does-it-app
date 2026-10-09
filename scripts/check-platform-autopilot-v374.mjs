import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {buildRecoveryReport,assessExternalReplay} from "../supabase/functions/busy-founder-ops/recoveryReport.mjs";
import {buildFounderReport} from "../supabase/functions/busy-founder-ops/report.mjs";

const now="2026-10-09T12:00:00Z";
const rows=[
 {incident_key:"website_stalled",source_transition_count:2,assessment:"requires_review",
  monitoring_verified:true,affected_count:3,clear_checks:0,last_assessed_at:now,assessment_runs:2,
  customer_email:"hidden@example.org",api_secret:"redacted"},
 {incident_key:"website_failed",source_transition_count:3,assessment:"confirming_clear",
  monitoring_verified:true,affected_count:0,clear_checks:1,last_assessed_at:now,assessment_runs:1},
 {incident_key:"social_failed",source_transition_count:5,assessment:"signal_cleared",
  monitoring_verified:true,affected_count:0,clear_checks:2,last_assessed_at:now,assessment_runs:1},
 {incident_key:"app_failed",source_transition_count:6,assessment:"signal_cleared",
  monitoring_verified:false,affected_count:0,clear_checks:2,last_assessed_at:now,assessment_runs:1},
 {incident_key:"any_customer_id",source_transition_count:1,assessment:"requires_review",
  monitoring_verified:true,affected_count:999,clear_checks:0,last_assessed_at:now,assessment_runs:1}
];
assert.equal(buildRecoveryReport({verifiedRole:false,rows}),null);
const report=buildRecoveryReport({verifiedRole:true,rows});
assert.equal(report.status,"available");
assert.equal(report.reviewCount,1);
assert.equal(report.confirmingCount,1);
assert.equal(report.signalClearedCount,1);
assert.equal(report.unknownCount,1);
assert.equal(report.items.length,4);
assert.equal(report.externalMutationEnabled,false);
assert.ok(!JSON.stringify(report).includes("hidden@example.org"));
assert.ok(!JSON.stringify(report).includes("api_secret"));
assert.ok(!JSON.stringify(report).includes("any_customer_id"));
assert.ok(report.items.every(item=>item.externalMutationAllowed===false));

const missing=buildRecoveryReport({verifiedRole:true,rows:null});
assert.equal(missing.status,"unavailable");
assert.equal(missing.reviewCount,null);
assert.equal(missing.externalMutationEnabled,false);

const statuses=[
 [{kind:"social_publish",sourceVerified:false,providerReceipt:"confirmed_failed",approved:true},"blocked_unknown"],
 [{kind:"social_publish",sourceVerified:true,providerReceipt:"unknown"},"provider_status_uncertain"],
 [{kind:"social_publish",sourceVerified:true,providerReceipt:"accepted"},"do_not_duplicate"],
 [{kind:"website_publish",sourceVerified:true,providerReceipt:"delivered"},"do_not_duplicate"],
 [{kind:"app_release",sourceVerified:true,providerReceipt:"confirmed_failed",approved:false},"founder_approval_required"],
 [{kind:"website_publish",sourceVerified:true,providerReceipt:"confirmed_failed",approved:true},"requires_idempotency_and_provider_validation"],
 [{kind:"arbitrary",sourceVerified:true,providerReceipt:"confirmed_failed",approved:true},"blocked_unknown"]
];
for(const [args,expected] of statuses){
  const decision=assessExternalReplay(args);
  assert.equal(decision.result,expected);
  assert.equal(decision.canRetry,false);
}
const founder=buildFounderReport({verifiedRole:true,recoveryRows:rows,checkedAt:now});
assert.equal(founder.recovery.status,"available");
assert.equal(founder.recovery.signalClearedCount,1);
assert.equal(buildFounderReport({verifiedRole:false,recoveryRows:rows}),null);

const sql=readFileSync(new URL("../supabase/migrations/20261009023000_v3_74_recovery_review_audit.sql",import.meta.url),"utf8");
const edge=readFileSync(new URL("../supabase/functions/busy-founder-ops/index.ts",import.meta.url),"utf8");
const screen=readFileSync(new URL("../src/screens/founderOperations.js",import.meta.url),"utf8");
const ci=readFileSync(new URL("../.github/workflows/production-check.yml",import.meta.url),"utf8");
const sqlGates=[
 "create table if not exists public.busy_platform_recovery_reviews",
 "alter table public.busy_platform_recovery_reviews enable row level security",
 "revoke all on public.busy_platform_recovery_reviews from public, anon, authenticated",
 "grant select on public.busy_platform_recovery_reviews to service_role",
 "automatic_external_mutation_allowed = false",
 "after insert on public.busy_platform_monitor_runs",
 "create or replace function busy_platform_internal.record_recovery_review()",
 "on conflict (incident_key,source_transition_count)",
 "is distinct from 'checked'"
];
for(const gate of sqlGates)assert.ok(sql.includes(gate),gate);
for(const disallowed of ["http_post","net.http_","busy_social_posts","busy_website_publish_jobs","busy_mini_apps"])
  assert.ok(!sql.includes(disallowed),disallowed);
assert.ok(edge.indexOf("if(!founder)return send(403")<
  edge.indexOf('safely(()=>privilegedRows("busy_platform_recovery_reviews"') ||
  edge.includes('safely(()=>privilegedRows("busy_platform_recovery_reviews"'));
// This SELECT's invocation must sit solely behind a freshly authorised
// founder request. No user-supplied arbitrary filters or table names.
assert.ok(edge.includes('const [{counts,usage},{monitorRun,monitorIncidents,alertRows,recoveryRows}'));
assert.ok(edge.includes('return send(200,buildFounderReport({counts,usage,monitorRun,monitorIncidents,alertRows,recoveryRows,'));
assert.ok(!screen.includes("source_transition_count"));
assert.ok(screen.includes("V3.74 • Verified recovery reviews"));
assert.ok(screen.includes("Automatic publishing or job retries"));
assert.ok(ci.includes("node scripts/check-platform-autopilot-v374.mjs"));
console.log("V3.74 PASS: audit privacy, two-clear semantics, fail-closed replay policy, founder gating and CI integration");
