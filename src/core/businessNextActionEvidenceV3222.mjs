/**
 * V3.222 — prioritise ONE small-business owner action.
 * Combines V3.221's website/app evidence with V3.218's bounded business
 * outcome rollup. Does not fetch/authenticate server data or send messages.
 * Untrusted rollups never become verified claims of customer outcomes.
 */
import {chooseBusinessJourneyDecisionV3221}
 from "./businessJourneyDecisionV3221.mjs";
import {reviewBusinessOutcomesV3218}
 from "./businessOutcomeIntelligenceV3218.mjs";
const blocked=reason=>({ok:false,reason,mayActAutomatically:false,
 customerRequestVerified:false,ownerNotificationSent:false});
function chooseOwnerNextActionV3222({
 businessId="",website=null,app=null,liveVersion=null,
 catalog=[],endpoint="",businessType="",description="",
 pendingWrite="none",rollup=null,authorisedBusinessId=""
}={}){
 const journey=chooseBusinessJourneyDecisionV3221({
  businessId,website,app,liveVersion,catalog,endpoint,
  businessType,description,pendingWrite
 });
 if(!journey.ok||journey.businessId!==businessId)
  return blocked(journey.reason||"Business scope not established.");
 const outcomes=rollup?reviewBusinessOutcomesV3218({
  businessId,authorisedBusinessId,rollup
 }):null;
 const hasSameBusinessLabel=outcomes?.ok===true;
 const riskFirst=["verify_receipt_first","review_version_change"].includes(journey.action);
 const ownerWaiting=hasSameBusinessLabel&&
   outcomes.recommendations.some(x=>x.id==="review_waiting");
 const reason=riskFirst?"Check an interrupted request or stale published app before other work.":
  ownerWaiting?"A same-business, source-labelled report suggests some enquiries await owner review.":
  journey.why;
 const action=riskFirst?journey.action:
  ownerWaiting?"review_waiting_enquiries":journey.action;
 const title=ownerWaiting&&!riskFirst?"Review customer enquiries waiting for you":journey.title;
 return {ok:true,kind:"business_next_action_evidence_v3222",businessId,
  action,title,reason,
  secondaryAdvice:journey.optionalDetail,
  usedOutcomeRollup:!riskFirst&&ownerWaiting,
  rollupAcceptedAsScopedSourceLabel:hasSameBusinessLabel,
  rollupIndependentlyFetchedHere:false,
  outcomeTruthIndependentlyVerified:false,
  ownerApprovalRequired:true,
  mayActAutomatically:false,mayPublish:false,maySend:false,
  mayChargeProvider:false,mayCrossBusinessLearn:false,
  customerRequestVerified:false,bookingConfirmed:false,
  ownerNotificationSent:false,
  personalCustomerDetailsReturned:false};
}
export {chooseOwnerNextActionV3222};
