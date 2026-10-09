import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {buildFounderAlertInbox} from "../supabase/functions/busy-founder-ops/alertInbox.mjs";
import {buildFounderReport} from "../supabase/functions/busy-founder-ops/report.mjs";
import {subscriptionServiceState,assessMeteredUsage} from "../src/domain/subscriptionGuardrails.mjs";
const rows=[{incident_key:"website_stalled",priority:"attention",status:"open",
  affected_count:2,source_transition_count:5,opened_at:"2026-10-09T00:00:00Z",
  last_seen_at:"2026-10-09T00:15:00Z",acknowledged_at:null,
  customer_email:"private@example.org",private_content:"secret message"},
  {incident_key:"social_failed",priority:"watch",status:"resolved",
    affected_count:0,source_transition_count:4,acknowledged_at:null},
  {incident_key:"anything_else",priority:"attention",status:"open",
    affected_count:7,source_transition_count:2}];
assert.equal(buildFounderAlertInbox({rows,verifiedRole:false}),null);
const inbox=buildFounderAlertInbox({rows,verifiedRole:true});
assert.equal(inbox.status,"available");
assert.equal(inbox.unread,1);
assert.equal(inbox.items.length,2);
assert.equal(inbox.items[0].transition,5);
assert.equal(inbox.items[0].automatedRecoveryAllowed,false);
assert.equal(inbox.items[1].status,"resolved");
for(const term of ["private@example.org","private_content","secret message","anything_else"])
  assert.ok(!JSON.stringify(inbox).includes(term),term);
assert.equal(buildFounderAlertInbox({rows:null,verifiedRole:true}).unread,null);
assert.equal(buildFounderAlertInbox({rows:[{...rows[0],acknowledged_at:"2026-10-09T00:30:00Z"}],verifiedRole:true}).unread,0);
const report=buildFounderReport({verifiedRole:true,alertRows:rows});
assert.equal(report.alertInbox.items.length,2);
assert.equal(report.alertInbox.unread,1);
assert.equal(report.autopilot.alerts.delivery,"not_enabled");
assert.equal(report.automation.alertDeliveryConfigured,false);
assert.equal(buildFounderReport({verifiedRole:false,alertRows:rows}),null);
const now="2026-10-09T00:00:00Z";
assert.equal(subscriptionServiceState({billingVerified:false,paidThrough:"2026-10-08T00:00:00Z",nowISO:now}).status,"unverified");
assert.equal(subscriptionServiceState({billingVerified:true,paidThrough:"2026-10-10T00:00:00Z",nowISO:now}).status,"paid");
assert.equal(subscriptionServiceState({billingVerified:true,paidThrough:"2026-10-08T00:00:00Z",nowISO:now}).status,"grace");
assert.equal(subscriptionServiceState({billingVerified:true,paidThrough:"2026-09-01T00:00:00Z",nowISO:now}).status,"past_grace");
assert.equal(subscriptionServiceState({billingVerified:true,paidThrough:"invalid",nowISO:now}).status,"unverified");
assert.equal(subscriptionServiceState({billingVerified:true,paidThrough:"2026-09-01T00:00:00Z",nowISO:now}).automaticSuspensionAllowed,false);
assert.equal(assessMeteredUsage({events:100,softLimit:80,hardLimit:120}).status,"unverified");
assert.equal(assessMeteredUsage({sourceVerified:true,events:60,softLimit:80,hardLimit:120}).status,"within_allowance");
assert.equal(assessMeteredUsage({sourceVerified:true,events:90,softLimit:80,hardLimit:120}).status,"approaching_limit");
assert.equal(assessMeteredUsage({sourceVerified:true,events:120,softLimit:80,hardLimit:120}).status,"hard_limit_review");
assert.equal(assessMeteredUsage({sourceVerified:true,events:120,softLimit:80,hardLimit:120}).automaticHardStopAllowed,false);

const sql=readFileSync(new URL("../supabase/migrations/20261009013000_v3_71_founder_alert_inbox.sql",import.meta.url),"utf8");
const edge=readFileSync(new URL("../supabase/functions/busy-founder-ops/index.ts",import.meta.url),"utf8");
const app=readFileSync(new URL("../src/app/AppController.js",import.meta.url),"utf8");
const ui=readFileSync(new URL("../src/screens/founderOperations.js",import.meta.url),"utf8");
const sqlGates=[
  "alter table public.busy_platform_alert_inbox enable row level security",
  "revoke all on public.busy_platform_alert_inbox from public,anon,authenticated",
  "grant select,update on public.busy_platform_alert_inbox to service_role",
  "perform busy_platform_internal.sync_alert_inbox(v_now)",
  "when public.busy_platform_alert_inbox.source_transition_count <>",
  "else public.busy_platform_alert_inbox.acknowledged_at end",
];
for(const gate of sqlGates)assert.ok(sql.includes(gate),gate);
assert.ok(!sql.includes("grant select on public.busy_platform_alert_inbox to authenticated"));
assert.ok(!sql.includes("http_post"));
assert.ok(edge.includes('if(!founder)return send(403'));
assert.ok(edge.indexOf('if(!founder)return send(403')<edge.indexOf('action==="acknowledge"'));
assert.ok(edge.includes('source_transition_count:"eq."+transition'));
assert.ok(edge.includes('status:"eq.open"'));
assert.ok(edge.includes('acknowledged_at:"is.null"'));
assert.ok(edge.includes('method:"PATCH"'));
assert.ok(!edge.includes("publish_now"));
assert.ok(ui.includes("Acknowledge "));
assert.ok(ui.includes("acknowledging")||ui.includes("Acknowledging"));
assert.ok(app.includes("const acknowledgeFounderAlert"));
assert.ok(app.includes("acknowledgeFounderAlert,"));
assert.ok(!ui.includes("SUPABASE_SERVICE_ROLE_KEY"));
console.log("V3.71 PASS: aggregate alert privacy, founder-gated acknowledgement, recurrence safety, subscription grace and metered-usage unknowns");
