import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {buildFounderReliability} from "../supabase/functions/busy-founder-ops/reliability.mjs";
import {buildFounderReport} from "../supabase/functions/busy-founder-ops/report.mjs";

const fresh={status:"monitoring",isFresh:true,sourcesChecked:4,totalSources:4};
const stale={...fresh,status:"stale",isFresh:false,sourcesChecked:null};
const partial={...fresh,status:"partial",sourcesChecked:3};
const readyInbox={status:"available",unread:0,items:[]};
const pendingInbox={status:"available",unread:2,items:[]};
const unavailableInbox={status:"unavailable",unread:null,items:null};

for(const [monitor,inbox,expected] of [
  [fresh,readyInbox,"monitoring"],
  [fresh,pendingInbox,"review_needed"],
  [fresh,unavailableInbox,"inbox_unavailable"],
  [stale,readyInbox,"monitor_stale"],
  [partial,readyInbox,"monitor_partial"],
  [null,readyInbox,"unverified"],
  [fresh,null,"inbox_unavailable"],
  [fresh,{status:"available",unread:null},"unverified"],
]){
  const actual=buildFounderReliability({autopilot:monitor,alertInbox:inbox});
  assert.equal(actual.status,expected,JSON.stringify({monitor,inbox}));
  assert.equal(actual.externalAlertDelivery,false);
  assert.equal(actual.automaticExternalRecovery,false);
  assert.equal(actual.needsFounderReview,expected!=="monitoring");
}
const validated=buildFounderReport({verifiedRole:true,checkedAt:"2026-10-09T00:30:00Z",
  monitorRun:{checked_at:"2026-10-09T00:15:00Z",status:"complete",
    coverage:{website_failed:"checked",website_stalled:"checked",
      social_failed:"checked",app_failed:"checked"}},
  monitorIncidents:[],alertRows:[]});
assert.equal(validated.reliability.status,"monitoring");
assert.equal(validated.reliability.alertInboxIsVerified,true);
const missing=buildFounderReport({verifiedRole:true,
  checkedAt:"2026-10-09T00:30:00Z",monitorRun:null,monitorIncidents:null,alertRows:null});
assert.equal(missing.reliability.status,"unverified");
assert.equal(buildFounderReport({verifiedRole:false,monitorIncidents:[],alertRows:[]}),null);

const ui=readFileSync(new URL("../src/screens/founderOperations.js",import.meta.url),"utf8");
const source=readFileSync(new URL("../supabase/functions/busy-founder-ops/index.ts",import.meta.url),"utf8");
const report=readFileSync(new URL("../supabase/functions/busy-founder-ops/report.mjs",import.meta.url),"utf8");
const workflow=readFileSync(new URL("../.github/workflows/production-check.yml",import.meta.url),"utf8");
assert.ok(ui.includes('V3.72 • Operational confidence'));
assert.ok(ui.includes('current.current===requestedOwner'));
assert.ok(ui.includes('Automatic external repairs'));
assert.ok(ui.includes('Automatic push/email alerts'));
assert.ok(report.includes('reliability:buildFounderReliability'));
assert.ok(source.includes('if(!founder)return send(403'));
assert.ok(source.indexOf('if(!founder)return send(403')<source.indexOf('aggregates(),incidentData()'));
assert.ok(workflow.includes('node scripts/check-founder-operations.mjs'));
assert.ok(workflow.includes('node scripts/check-platform-autopilot.mjs'));
assert.ok(workflow.includes('node scripts/check-platform-autopilot-v371.mjs'));
console.log("V3.72 PASS founder monitor reliability, graceful uncertainty, privacy, owner-switch handling and CI hooks");
