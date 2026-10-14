/**
 * V3.223 — source-conscious and fresh bounded rollup advice, still just one
 * clear owner-facing decision. Builds ON the existing V3.222 Business Brain;
 * no parallel CRM, learning loop, booking engine or request database.
 */
import {chooseOwnerNextActionV3222}
 from "./businessNextActionEvidenceV3222.mjs";
import {inspectBusinessEvidenceFreshnessV3223}
 from "./businessEvidenceFreshnessV3223.mjs";
function chooseOwnerNextActionV3223(input={}){
 const hasRollup=!!input.rollup;
 const freshness=hasRollup?inspectBusinessEvidenceFreshnessV3223({
  businessId:input.businessId,
  authorisedBusinessId:input.authorisedBusinessId,
  rollup:input.rollup,periodEnd:input.rollupPeriodEnd,
  serverAsOf:input.serverAsOf
 }):null;
 const admitted=hasRollup&&freshness?.ok===true&&
  freshness.rollupUsableForAdvice===true;
 const chosen=chooseOwnerNextActionV3222({
  ...input,
  rollup:admitted?input.rollup:null
 });
 if(!chosen.ok)return {
  ...chosen,kind:"owner_next_action_v3223",
  evidenceStatus:"business_scope_failed",
  sourceVerificationByThisFunction:false};
 const isReportRelevant=admitted&&chosen.usedOutcomeRollup===true;
 return {...chosen,kind:"owner_next_action_v3223",
  evidenceStatus:!hasRollup?"no_outcome_rollup":
   !admitted?"invalid_or_stale_rollup":
   isReportRelevant?"fresh_labelled_business_rollup":"fresh_rollup_no_priority",
  // Even serverAsOf and a matching source label are caller-supplied values,
  // NOT independently authenticated real server facts.
  sourceVerificationByThisFunction:false,
  outcomeReportWasLocallyDateChecked:admitted,
  staleReportIgnored:hasRollup&&!admitted,
  ownerReapprovalRequired:true,
  mayActAutomatically:false,maySend:false,mayPublish:false,
  mayChargeProvider:false,calendarBookingConfirmed:false,
  providerDeliveryConfirmed:false,
  explanationOptional:chosen.secondaryAdvice,
  oneRecommendedActionOnly:true};
}
export {chooseOwnerNextActionV3223};
