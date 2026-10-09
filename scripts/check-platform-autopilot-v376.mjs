import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {snapshotPayload,buildEvidenceHistory} from "../supabase/functions/busy-founder-ops/evidenceHistory.mjs";
import {buildFounderReport} from "../supabase/functions/busy-founder-ops/report.mjs";

const now="2026-10-09T09:00:00Z";
const website={sampled:3,outcomes:{deployment_responding:1,
  unreachable:2,mismatch:0,unverified:0},customerName:"should never persist"};
const social={sampledPosts:1,channels:{providerAccepted:2,failed:0,unverified:1},
  token:"sensitive-secret-do-not-store"};
const apps={sampled:1,outcomes:{deployment_recorded:1,
  version_mismatch:0,not_deployed:0,not_verified:0,unverified:0}};
const clean=snapshotPayload({website,social,apps,checkedAt:now});
assert.equal(clean.status,"complete");
assert.equal(clean.website_sampled,3);
assert.equal(clean.social_provider_accepted,2);
assert.equal(clean.app_deployment_recorded,1);
assert.equal(clean.completed_at,now.replace(".000",""));
assert.ok(!JSON.stringify(clean).includes("should never persist"));
assert.ok(!JSON.stringify(clean).includes("sensitive-secret"));
assert.equal(Object.keys(clean).length,15);
const missing=snapshotPayload({website:{status:"unavailable"},social,apps,checkedAt:now});
assert.equal(missing.status,"partial");
assert.equal(missing.website_sampled,null);
assert.equal(missing.social_sampled,1);
const malformed=snapshotPayload({website:{sampled:2,outcomes:{
  deployment_responding:4,unreachable:0,mismatch:0,unverified:0
}},social,apps,checkedAt:now});
assert.equal(malformed.website_sampled,null);
assert.equal(malformed.status,"partial");

const rows=[
 {window_start:now,...clean},
 {window_start:"2026-10-09T08:30:00Z",...clean},
 {window_start:"2026-10-09T08:00:00Z",...clean},
 {window_start:"2026-10-06T08:00:00Z",...clean},
 {window_start:"2026-09-01T08:00:00Z",...clean},
 {window_start:"2026-10-09T08:45:00Z",...clean,status:"running"}
];
const aggregate=buildEvidenceHistory({rows,nowISO:now});
assert.equal(aggregate.status,"available");
assert.equal(aggregate.snapshots7d,4);
assert.equal(aggregate.trend,"insufficient_history");
assert.equal(aggregate.diagnoses[0].kind,"possible_shared_website_symptom");
assert.ok(aggregate.diagnoses.some(d=>d.kind==="repeated_website_observations"));
assert.ok(aggregate.diagnoses.some(d=>d.kind==="repeated_social_receipt_issues"));
assert.equal(aggregate.unattendedExternalChecksEnabled,false);
assert.equal(aggregate.budget.minimumMinutesBetweenChecks,30);
assert.equal(aggregate.budget.maxChecksPerDay,48);
assert.equal(aggregate.retainedDays,30);
assert.equal(buildEvidenceHistory({rows:null,nowISO:now}).status,"unavailable");
assert.equal(buildEvidenceHistory({rows:[],nowISO:now}).snapshots7d,0);
assert.equal(buildEvidenceHistory({rows,nowISO:"not-a-date"}).trend,"unverified");
const founder=buildFounderReport({verifiedRole:true,checkedAt:now,evidenceRows:rows});
assert.equal(founder.evidenceHistory.snapshots7d,4);
assert.equal(buildFounderReport({verifiedRole:false,checkedAt:now,evidenceRows:rows}),null);
assert.ok(!JSON.stringify(founder).includes("sensitive-secret"));

const migration=readFileSync(new URL("../supabase/migrations/20261009090000_v3_76_evidence_snapshots.sql",import.meta.url),"utf8");
const retention=readFileSync(new URL("../supabase/migrations/20261009093000_v3_76_evidence_retention.sql",import.meta.url),"utf8");
const edge=readFileSync(new URL("../supabase/functions/busy-founder-ops/index.ts",import.meta.url),"utf8");
const ui=readFileSync(new URL("../src/screens/founderOperations.js",import.meta.url),"utf8");
const workflow=readFileSync(new URL("../.github/workflows/production-check.yml",import.meta.url),"utf8");
assert.ok(migration.includes("create table if not exists public.busy_platform_evidence_snapshots"));
assert.ok(migration.includes("alter table public.busy_platform_evidence_snapshots enable row level security"));
assert.ok(migration.includes("revoke all on public.busy_platform_evidence_snapshots from public,anon,authenticated"));
assert.ok(migration.includes("grant execute on function public.busy_claim_evidence_window() to service_role"));
assert.ok(migration.includes("on conflict (window_start) do nothing"));
assert.ok(migration.includes("pg_catalog.date_part('epoch', v_now) / 1800"));
assert.ok(retention.includes("busy-v376-evidence-retention"));
assert.ok(retention.includes("interval '30 days'"));
assert.ok(edge.indexOf("if(!founder)return send(403")>0);
assert.ok(edge.indexOf("if(!founder)return send(403")<
  edge.indexOf('if(action==="verify_external"'));
assert.ok(edge.includes("await claimEvidenceWindow()"));
assert.ok(edge.includes('rpc/busy_claim_evidence_window'));
assert.ok(edge.includes('historyPersisted'));
assert.ok(edge.includes("evidenceRows:history"));
assert.ok(edge.includes('window_start:"eq."+slot,status:"eq.running"'));
assert.ok(ui.includes("V3.76 • Evidence & Intelligence"));
assert.ok(ui.includes("rate_limited"));
assert.ok(ui.includes("Unattended external checks"));
assert.ok(workflow.includes("node scripts/check-platform-autopilot-v376.mjs"));
console.log("V3.76 PASS: bounded aggregate history, trends, possible cross-site symptoms, rate limit and 30-day retention source gates");
