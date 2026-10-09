/**
 * V3.74 safe recovery-assessment reporting.
 * Every item is a category-level observation. It is NOT a remote publishing
 * receipt or proof that a customer-facing operation completed successfully.
 */
const KEYS=new Set(["website_failed","website_stalled","social_failed","app_failed"]);
const ASSESSMENTS=new Set(["requires_review","confirming_clear","signal_cleared","unverified"]);
const safeCount=v=>Number.isSafeInteger(v)&&v>=0?v:null;
const safeTransition=v=>Number.isSafeInteger(v)&&v>=1?v:null;
const safeDate=v=>typeof v==="string"&&Number.isFinite(Date.parse(v))?
  new Date(v).toISOString():null;
function buildRecoveryReport({rows=null,verifiedRole=false}={}){
  if(!verifiedRole)return null;
  if(!Array.isArray(rows))return {
    status:"unavailable",items:null,reviewCount:null,
    signalClearedCount:null,confirmingCount:null,unknownCount:null,
    externalMutationEnabled:false,
    note:"Recovery evidence could not be read. No recovery is assumed."
  };
  const items=rows.filter(row=>KEYS.has(row?.incident_key))
    .slice(0,12).map(row=>({
      key:row.incident_key,
      transition:safeTransition(row.source_transition_count),
      assessment:ASSESSMENTS.has(row.assessment)?row.assessment:"unverified",
      monitoringVerified:row.monitoring_verified===true,
      count:safeCount(row.affected_count),
      cleanChecks:safeCount(row.clear_checks),
      assessedAt:safeDate(row.last_assessed_at),
      evidenceChecks:safeCount(row.assessment_runs),
      externalMutationAllowed:false
    })).map(item=>item.monitoringVerified?item:{...item,assessment:"unverified"});
  const count=assessment=>items.filter(x=>x.assessment===assessment).length;
  return {
    status:"available",
    items,
    reviewCount:count("requires_review"),
    signalClearedCount:count("signal_cleared"),
    confirmingCount:count("confirming_clear"),
    unknownCount:count("unverified"),
    externalMutationEnabled:false,
    automaticActions:["aggregate_monitor_recheck","record_signal_lifecycle"],
    note:"A cleared signal means two clean monitored database observations; it is not an external provider receipt or proof a website/post is live. Publishing retries require separate approval."
  };
}
function assessExternalReplay({kind="",sourceVerified=false,providerReceipt="unknown",approved=false}={}){
  const validKind=["website_publish","social_publish","app_release"].includes(kind);
  if(!validKind||!sourceVerified)return {
    result:"blocked_unknown",canRetry:false,needsReview:true
  };
  if(providerReceipt==="accepted"||providerReceipt==="delivered")
    return {result:"do_not_duplicate",canRetry:false,needsReview:false};
  if(providerReceipt==="confirmed_failed")
    return {result:approved?"requires_idempotency_and_provider_validation":"founder_approval_required",
      canRetry:false,needsReview:true};
  return {result:"provider_status_uncertain",canRetry:false,needsReview:true};
}
export {buildRecoveryReport,assessExternalReplay};
