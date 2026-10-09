import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {buildAutopilotDigest,SIGNALS} from "../supabase/functions/busy-founder-ops/incidentReport.mjs";
import {buildFounderReport,isFounderUser} from "../supabase/functions/busy-founder-ops/report.mjs";
const at="2026-10-09T00:15:00Z";
const sourceCoverage=Object.fromEntries(Object.keys(SIGNALS).map(k=>[k,"checked"]));
const run={checked_at:"2026-10-09T00:10:00Z",status:"complete",coverage:sourceCoverage};
const incidents=[
  {incident_key:"website_stalled",title:"private customer detail must not leak",
    customer_email:"secret@example.org",business_id:"not-for-client",affected_count:2,
    first_detected_at:"2026-10-09T00:00:00Z",last_observed_at:at,status:"open",
    transition_count:3},
  {incident_key:"social_failed",title:"sensitive raw post content",affected_count:0,
    first_detected_at:"2026-10-08T20:00:00Z",last_observed_at:at,status:"resolved",
    resolved_at:at,transition_count:2},
  {incident_key:"unapproved_key",title:"external records leak",affected_count:2,status:"open"},
];
assert.equal(buildAutopilotDigest({run,incidents,verifiedRole:false,nowISO:at}),null);
const digest=buildAutopilotDigest({run,incidents,verifiedRole:true,nowISO:at});
assert.equal(digest.status,"monitoring");
assert.equal(digest.enabled,true);
assert.equal(digest.cadenceMinutes,15);
assert.equal(digest.sourcesChecked,4);
assert.equal(digest.totalSources,4);
assert.equal(digest.openIncidents,1);
assert.equal(digest.highPriorityIncidents,1);
assert.equal(digest.incidents.length,2);
assert.equal(digest.incidents[0].title,"Website processing lease stalled");
assert.equal(digest.incidents[0].count,2);
assert.equal(digest.incidents[1].status,"resolved");
assert.equal(digest.incidents[1].count,0);
assert.equal(digest.alerts.configured,false);
assert.equal(digest.alerts.delivery,"not_enabled");
assert.equal(digest.recovery.status,"observe_only");
assert.ok(!JSON.stringify(digest).includes("secret@example.org"));
assert.ok(!JSON.stringify(digest).includes("private customer"));
assert.ok(!JSON.stringify(digest).includes("business_id"));
assert.ok(!JSON.stringify(digest).includes("unapproved_key"));
const last=buildAutopilotDigest({
  run:{...run,checked_at:"2026-10-08T22:00:00Z"},
  incidents,verifiedRole:true,nowISO:at});
assert.equal(last.status,"stale");
assert.equal(last.sourcesChecked,null);
const partial=buildAutopilotDigest({
  run:{...run,status:"partial",coverage:{social_failed:"unavailable",website_failed:"checked"}},
  incidents:null,verifiedRole:true,nowISO:at});
assert.equal(partial.status,"partial");
assert.equal(partial.sourcesChecked,1);
assert.equal(partial.openIncidents,null);
assert.equal(partial.highPriorityIncidents,null);
assert.equal(partial.sourceCoverage.social_failed,"unavailable");
assert.equal(partial.sourceCoverage.app_failed,"unavailable");
const noRun=buildAutopilotDigest({verifiedRole:true,nowISO:at});
assert.equal(noRun.status,"not_started");
assert.equal(noRun.checkedAt,null);
assert.equal(noRun.openIncidents,null);
assert.equal(noRun.enabled,false);
assert.equal(buildAutopilotDigest({verifiedRole:true,incidents:[],run:{...run,checked_at:"bad"},nowISO:at}).status,"not_started");
assert.equal(buildAutopilotDigest({verifiedRole:true,run,incidents:[
  {...incidents[0],affected_count:-7}
],nowISO:at}).incidents[0].count,null);
const report=buildFounderReport({verifiedRole:true,checkedAt:at,
  monitorRun:run,monitorIncidents:incidents});
assert.equal(report.scope,"platform_aggregate");
assert.equal(report.autopilot.status,"monitoring");
assert.equal(report.autopilot.highPriorityIncidents,1);
assert.equal(report.automation.enabled,true);
assert.equal(report.automation.alertDeliveryConfigured,false);
assert.equal(report.commercial.grossMrrGbp,null);
assert.equal(buildFounderReport({verifiedRole:false,monitorRun:run,monitorIncidents:incidents}),null);
assert.equal(isFounderUser({id:"11111111-1111-4111-8111-111111111111",
 aud:"authenticated",user_metadata:{busy_platform_role:"founder"},app_metadata:{}}),false);

const sql=readFileSync(new URL("../supabase/migrations/20261009010000_v3_70_platform_autopilot.sql",import.meta.url),"utf8");
const edge=readFileSync(new URL("../supabase/functions/busy-founder-ops/index.ts",import.meta.url),"utf8");
const screen=readFileSync(new URL("../src/screens/founderOperations.js",import.meta.url),"utf8");
const cronChecks=[
 ["grouped and durable incidents",sql.includes("create table if not exists public.busy_platform_incidents")],
 ["recorded scans with coverage",sql.includes("create table if not exists public.busy_platform_monitor_runs")],
 ["RLS for incidents",sql.includes("alter table public.busy_platform_incidents enable row level security")],
 ["RLS for scans",sql.includes("alter table public.busy_platform_monitor_runs enable row level security")],
 ["no direct customer read",sql.includes("revoke all on public.busy_platform_incidents from public, anon, authenticated")],
 ["no direct customer scan read",sql.includes("revoke all on public.busy_platform_monitor_runs from public, anon, authenticated")],
 ["server-side scheduled",sql.includes("cron.schedule('busy-v370-platform-incidents','*/15 * * * *'")],
 ["dedup by incident class",sql.includes("on conflict (incident_key) do update")],
 ["two successful clear scans",sql.includes("clear_checks>=1 then 'resolved'")],
 ["partial check cannot resolve unknown sources",sql.includes("exception when others then")&&sql.includes("'unavailable'")],
 ["stalled lease requires expiry",sql.includes("lease_expires_at < v_now - interval '5 minutes'")],
 ["bounded history retention",sql.includes("interval '30 days'")&&sql.includes("interval '90 days'")],
 ["no open SQL execution privilege",sql.includes("revoke all on function busy_platform_internal.run_monitor()")],
 ["server-only founder Auth",edge.includes("isFounderUser(user)?user:null")],
 ["auth before privileged incident query",edge.indexOf("if(!founder)return send(403")<edge.indexOf("aggregates(),incidentData()")],
 ["incident limit 12",edge.includes('"last_observed_at.desc",12')],
 ["scan limit 1",edge.includes('"checked_at.desc",1')],
 ["aggregate scope output only",edge.includes("buildFounderReport({counts,usage,monitorRun,monitorIncidents")],
 ["founder dashboard",screen.includes("Background incident checks running")&&screen.includes("Open grouped incidents")],
];
for(const [label,ok] of cronChecks) assert.ok(ok,label);
assert.ok(!sql.includes("http_post("),"No outbound webhook or secret required");
assert.ok(!sql.includes("publish_now"),"No public publishing actions");
assert.ok(!sql.includes("grant select on public.busy_platform_incidents to authenticated"));
assert.ok(!screen.includes("SUPABASE_SERVICE_ROLE_KEY"));
console.log("V3.70 PASS "+cronChecks.length+" schema, cron, founder-access and UI gates; outage uncertainty, dedup, privacy and alert safeguards");
