import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {classifyEscalation} from "../supabase/functions/busy-founder-ops/escalation.mjs";
import {notificationReadiness} from "../supabase/functions/busy-founder-ops/notificationReadiness.mjs";
import {notificationEligibility,inQuietHours} from "../supabase/functions/busy-founder-ops/notificationPolicy.mjs";
import {buildFounderReport} from "../supabase/functions/busy-founder-ops/report.mjs";

const now="2026-10-09T12:00:00Z";
const monitor={checked_at:"2026-10-09T11:45:00Z",status:"complete",
 coverage:{website_failed:"checked",website_stalled:"checked",social_failed:"checked",app_failed:"checked"}};
const incident={key:"website_stalled",status:"open",
 openedAt:"2026-10-09T10:15:00Z",lastSeenAt:"2026-10-09T11:45:00Z"};
const urgent=classifyEscalation({incident,run:monitor,nowISO:now});
assert.equal(urgent.level,"urgent");
assert.equal(urgent.sourceVerified,true);
assert.equal(urgent.ageMinutes,105);
assert.equal(urgent.automaticRecoveryAllowed,false);
assert.equal(classifyEscalation({incident:{...incident,openedAt:"2026-10-09T11:40:00Z"},run:monitor,nowISO:now}).level,"watch");
assert.equal(classifyEscalation({incident:{...incident,openedAt:"2026-10-09T11:20:00Z"},run:monitor,nowISO:now}).level,"persistent");
assert.equal(classifyEscalation({incident:{...incident,openedAt:"2026-10-09T11:10:00Z"},run:monitor,nowISO:now}).level,"persistent");
assert.equal(classifyEscalation({incident:{...incident,key:"social_failed"},run:monitor,nowISO:now}).level,"persistent");
assert.equal(classifyEscalation({incident:{...incident,status:"resolved"},run:monitor,nowISO:now}).level,"resolved");
assert.equal(classifyEscalation({incident,run:{...monitor,coverage:{website_stalled:"unavailable"}},nowISO:now}).level,"unverified");
assert.equal(classifyEscalation({incident,run:{...monitor,checked_at:"2026-10-09T10:00:00Z"},nowISO:now}).level,"unverified");
assert.equal(classifyEscalation({incident,run:{...monitor,status:"partial"},nowISO:now}).level,"unverified");
assert.equal(classifyEscalation({incident,run:monitor,nowISO:"invalid"}).level,"unverified");
assert.equal(classifyEscalation({incident:{...incident,key:"unknown"},run:monitor,nowISO:now}).level,"unverified");

assert.equal(notificationReadiness({devices:null}).status,"unknown");
assert.equal(notificationReadiness({devices:0}).status,"no_registered_device");
assert.equal(notificationReadiness({devices:2}).externalAlertsEnabled,false);
assert.equal(notificationReadiness({devices:1,optedIn:true,verifiedDelivery:true,
 quietHoursConfigured:true,cooldownConfigured:true}).externalAlertsEnabled,false);
assert.equal(notificationReadiness({devices:-1}).registeredFounderDevices,null);
const partialOptions={verifiedFounder:true,explicitOptIn:true,verifiedDestination:true,
 sourceVerified:true,level:"urgent",nowISO:now,quietStart:"21:00",quietEnd:"08:00"};
assert.equal(notificationEligibility(partialOptions).reason,"delivery_disabled");
const base={...partialOptions,deliveryEnabled:true};
assert.equal(notificationEligibility(base).eligible,true);
assert.equal(notificationEligibility({...base,incidentAcknowledged:true}).reason,"already_acknowledged");
assert.equal(notificationEligibility({...base,sourceVerified:false}).reason,"not_escalated");
assert.equal(notificationEligibility({...base,lastDeliveryISO:"2026-10-09T10:00:00Z"}).reason,"cooldown");
assert.equal(notificationEligibility({...base,lastDeliveryISO:"2026-10-08T10:00:00Z"}).eligible,true);
assert.equal(notificationEligibility({...base,lastDeliveryISO:"invalid"}).reason,"receipt_unverified");
assert.equal(notificationEligibility({...base,quietStart:"bad"}).reason,"quiet_hours");
assert.equal(notificationEligibility({...base,nowISO:"2026-10-09T22:00:00Z"}).reason,"quiet_hours");
assert.equal(inQuietHours(new Date("2026-10-09T06:15:00Z"),"21:00","08:00"),true);
assert.equal(inQuietHours(new Date("2026-10-09T12:00:00Z"),"21:00","08:00"),false);
assert.equal(inQuietHours(new Date("2026-12-09T22:15:00Z"),"21:00","08:00"),true);

const report=buildFounderReport({verifiedRole:true,checkedAt:now,founderDeviceCount:0,
 monitorRun:monitor,monitorIncidents:[],alertRows:[{
 incident_key:"website_stalled",priority:"attention",status:"open",
 affected_count:2,source_transition_count:1,opened_at:incident.openedAt,
 last_seen_at:incident.lastSeenAt,acknowledged_at:null,
 customer_email:"secret@example.org"
}]});
assert.equal(report.alertInbox.escalated,1);
assert.equal(report.alertInbox.items[0].escalation.level,"urgent");
assert.equal(report.notificationReadiness.status,"no_registered_device");
assert.equal(report.notificationReadiness.externalAlertsEnabled,false);
assert.equal(report.reliability.status,"review_needed");
assert.ok(!JSON.stringify(report).includes("secret@example.org"));
assert.equal(buildFounderReport({verifiedRole:false,founderDeviceCount:2}),null);
const edge=readFileSync(new URL("../supabase/functions/busy-founder-ops/index.ts",import.meta.url),"utf8");
const screen=readFileSync(new URL("../src/screens/founderOperations.js",import.meta.url),"utf8");
const workflow=readFileSync(new URL("../.github/workflows/production-check.yml",import.meta.url),"utf8");
assert.ok(edge.indexOf("if(!founder)return send(403")<edge.indexOf('queryCount("busy_push_devices"'));
assert.ok(edge.includes('"user_id":"eq."+founder.id'));
assert.ok(edge.includes('"active":"eq.true"'));
assert.ok(!screen.includes("expo_push_token"));
assert.ok(screen.includes('Open production push setup'));
assert.ok(screen.includes("Persistent or urgent recorded incidents"));
assert.ok(workflow.includes("node scripts/check-platform-autopilot-v373.mjs"));
console.log("V3.73 PASS: escalation evidence, quiet-hours and 24h cooldown policy, disabled delivery, founder-only device readiness, no customer leakage");
