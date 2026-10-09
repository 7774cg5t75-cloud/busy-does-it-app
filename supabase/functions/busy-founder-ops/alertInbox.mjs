/**
 * V3.71 founder in-app alert inbox. Strict aggregate-only allowlist.
 * Acknowledgement is not recovery or notification delivery.
 */
import {classifyEscalation} from "./escalation.mjs";
const REVIEW_GUIDANCE=Object.freeze({
  website_failed:"Inspect website publishing result and provider status before an authorised retry.",
  website_stalled:"Check for an expired processing lease; do not blindly run the job again.",
  social_failed:"Review channel-specific publish receipts; only retry confirmed failed destinations with approval.",
  app_failed:"Inspect Business App release evidence; do not relaunch without owner authorisation."
});
const VALID_KEYS=new Set(["website_failed","website_stalled","social_failed","app_failed"]);
const positive=n=>Number.isSafeInteger(n)&&n>=1?n:null;
const safeCount=n=>Number.isSafeInteger(n)&&n>=0?n:null;
const date=v=>typeof v==="string"&&Number.isFinite(Date.parse(v))?new Date(v).toISOString():null;
function buildFounderAlertInbox({rows=null,verifiedRole=false,run=null,nowISO=""}={}){
  if(!verifiedRole)return null;
  if(!Array.isArray(rows))return {status:"unavailable",unread:null,items:null,
    destination:"in_app_only",externalDeliveryConfigured:false};
  const items=rows.filter(r=>VALID_KEYS.has(r?.incident_key))
    .slice(0,12).map(r=>({
      escalation:classifyEscalation({
        incident:{key:r.incident_key,status:r.status,openedAt:r.opened_at,lastSeenAt:r.last_seen_at},
        run,nowISO
      }),
      key:r.incident_key,
      reviewGuidance:REVIEW_GUIDANCE[r.incident_key],
      automatedRecoveryAllowed:false,
      priority:r.priority==="attention"?"attention":"watch",
      status:r.status==="open"?"open":"resolved",
      count:safeCount(r.affected_count),
      transition:positive(r.source_transition_count),
      openedAt:date(r.opened_at),
      lastSeenAt:date(r.last_seen_at),
      resolvedAt:date(r.resolved_at),
      acknowledgedAt:date(r.acknowledged_at)
    }));
  return {status:"available",unread:items.filter(r=>r.status==="open"&&!r.acknowledgedAt).length,
    escalated:items.filter(r=>r.status==="open"&&["urgent","persistent"].includes(r.escalation.level)).length,
    items,destination:"in_app_only",externalDeliveryConfigured:false};
}
export {buildFounderAlertInbox,VALID_KEYS};
