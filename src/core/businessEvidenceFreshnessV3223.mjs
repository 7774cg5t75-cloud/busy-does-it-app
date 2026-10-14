/**
 * V3.223 — conservatively assess whether a labelled same-business rollup
 * is timely enough to generate optional owner review advice.
 * DOES NOT authenticate the supplied source/readback flags. Read-only.
 */
import {reviewBusinessOutcomesV3218}
 from "./businessOutcomeIntelligenceV3218.mjs";
const DATE=/^\d{4}-\d{2}-\d{2}$/;
const blocked=reason=>({ok:false,reason,
 rollupUsableForAdvice:false,sourceIndependentlyVerified:false,
 customerOutcomeVerified:false,mayNotify:false});
function inspectBusinessEvidenceFreshnessV3223({
 businessId="",authorisedBusinessId="",rollup=null,
 periodEnd="",serverAsOf=""
}={}){
 const results=reviewBusinessOutcomesV3218({
  businessId,authorisedBusinessId,rollup
 });
 if(!results.ok)return blocked(results.reason);
 if(!DATE.test(periodEnd)||!DATE.test(serverAsOf))
  return blocked("Evidence needs an explicit bounded period end and server-provided reporting date.");
 const start=Date.parse(rollup.period_start+"T00:00:00Z");
 const end=Date.parse(periodEnd+"T00:00:00Z");
 const asOf=Date.parse(serverAsOf+"T00:00:00Z");
 if(![start,end,asOf].every(Number.isFinite)||
    new Date(start).toISOString().slice(0,10)!==rollup.period_start||
    new Date(end).toISOString().slice(0,10)!==periodEnd||
    new Date(asOf).toISOString().slice(0,10)!==serverAsOf)
  return blocked("Invalid reporting dates or leap-day values.");
 const days=(end-start)/86400000,age=(asOf-end)/86400000;
 if(days<0||days>31||age<0||age>7)
  return blocked("Report periods must be at most 32 calendar days and end within seven days of the stated server date.");
 return {ok:true,kind:"business_evidence_freshness_v3223",
  businessId,periodStart:rollup.period_start,periodEnd,
  serverAsOf,daysSincePeriodEnd:age,reportPeriodDays:days,
  rollupUsableForAdvice:true,
  analysisSource:"caller_labelled_server_rollup_unverified_locally",
  sourceIndependentlyVerified:false,customerOutcomeVerified:false,
  tenantAuthVerifiedByThisFunction:false,
  anyCustomerPersonalDataIncluded:false,
  suggestions:results.recommendations.map(x=>({
   id:x.id,title:x.title,ownerReviewRequired:true})),
  mayNotify:false,mayPublish:false,mayExecute:false,
  noCrossBusinessLearning:true};
}
export {inspectBusinessEvidenceFreshnessV3223};
