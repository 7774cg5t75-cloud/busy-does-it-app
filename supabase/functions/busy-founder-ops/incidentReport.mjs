/**
 * V3.70 founder-only platform Autopilot reporting.
 * The DB records only cross-tenant aggregate incident classes.
 * This function refuses arbitrary strings or row identifiers in the response.
 */
const SIGNALS=Object.freeze({
  website_failed:{label:"Website publishing failures recorded",severity:"watch"},
  website_stalled:{label:"Website processing lease stalled",severity:"attention"},
  social_failed:{label:"Social publishing failures recorded",severity:"watch"},
  app_failed:{label:"Business App failures recorded",severity:"watch"},
});
const integer=n=>Number.isSafeInteger(n)&&n>=0?n:null;
const safeDate=v=>typeof v==="string"&&Number.isFinite(Date.parse(v))?
  new Date(v).toISOString():null;
function buildAutopilotDigest({run=null,incidents=null,verifiedRole=false,nowISO=""}={}){
  if(!verifiedRole)return null;
  const observedAt=safeDate(nowISO)||new Date().toISOString();
  const lastScan=safeDate(run?.checked_at);
  const age=lastScan===null?null:Date.parse(observedAt)-Date.parse(lastScan);
  const fresh=age!==null&&age>=0&&age<=45*60*1000;
  const sourceCoverage={};
  for(const key of Object.keys(SIGNALS)){
    sourceCoverage[key]=run?.coverage?.[key]==="checked"?"checked":"unavailable";
  }
  const scanned=Object.values(sourceCoverage).filter(x=>x==="checked").length;
  const history=Array.isArray(incidents)?
    incidents.filter(r=>Object.prototype.hasOwnProperty.call(SIGNALS,r?.incident_key))
      .slice(0,12).map(row=>({
        key:row.incident_key,
        title:SIGNALS[row.incident_key].label,
        severity:SIGNALS[row.incident_key].severity,
        status:row.status==="open"?"open":"resolved",
        count:integer(row.affected_count),
        firstDetectedAt:safeDate(row.first_detected_at),
        lastObservedAt:safeDate(row.last_observed_at),
        resolvedAt:safeDate(row.resolved_at),
        transitions:integer(row.transition_count),
      })) : null;
  const open=history?.filter(r=>r.status==="open")||[];
  return {
    status:!lastScan?"not_started":!fresh?"stale":
      (run?.status==="complete"&&scanned===4)?"monitoring":"partial",
    enabled:lastScan!==null,
    cadenceMinutes:15,
    checkedAt:lastScan,
    isFresh:fresh,
    sourceCoverage,
    sourcesChecked:fresh?scanned:null,
    totalSources:4,
    openIncidents:history?open.length:null,
    highPriorityIncidents:history?open.filter(r=>r.severity==="attention").length:null,
    incidents:history,
    alerts:{
      configured:false,
      delivery:"not_enabled",
      note:"Incident classification and history are automatic. Founder push/email delivery is not enabled until an authenticated destination and rate-limited delivery receipts are verified.",
    },
    recovery:{
      status:"observe_only",
      note:"This watcher never publishes, resends, repairs customer records, clears failed jobs, or runs privileged retries.",
    },
    scope:"platform_aggregate",
    note:"A monitored source can report past failed work without a current platform outage. A failed scan is not recorded as healthy.",
  };
}
export {SIGNALS,buildAutopilotDigest};
