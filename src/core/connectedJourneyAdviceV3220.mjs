/**
 * V3.220 — one owner-facing explanation from shared website/app evidence.
 * Reuse the validated canonical handoff, current published app/version and
 * owner-stated goal. Never claim a link was clicked, a form went live, an
 * enquiry was stored, or a booking/calendar operation completed.
 */
import {planUniversalCustomerJourneyV3218}
 from "./universalCustomerJourneyV3218.mjs";
import {adviseVerifiedCustomerJourneyV3219}
 from "./customerJourneyActionV3219.mjs";
function adviseConnectedCustomerJourneyV3220({
 businessId="",website=null,app=null,liveVersion=null,
 catalog=[],endpoint="",businessType="",description="",
 publishing=null,deliveryProof=null,pendingWrite="none"
}={}){
 const plan=planUniversalCustomerJourneyV3218({
  businessId,website,app,liveVersion,catalog,endpoint,
  businessType,description,publishing,deliveryProof
 });
 const action=adviseVerifiedCustomerJourneyV3219({
  businessId,website,app,liveVersion,catalog,endpoint,
  businessType,description,pendingWrite
 });
 if(!plan.ok||!action.ok)return {ok:false,reason:plan.reason||action.reason,
  publicCustomerRequestFormActive:false,
  sendAllowed:false,ownerReviewRequired:true};
 const stale=action.action==="review_stale_website_link";
 const uncertain=action.action==="check_existing_receipt";
 return {ok:true,kind:"connected_customer_journey_advice_v3220",
  businessId,headline:action.title,detail:action.reason,
  ownerGoal:plan.requestedBusinessGoal,
  capability:plan.recommendedCapability,
  highlightedIssue:uncertain?"possible_saved_request":
   stale?"stale_website_app_version":"current_owner_goal",
  currentDraftHandoffIndicated:plan.ownerApprovedHandoffInPrivateDraft,
  currentPublishedAppCapabilityIndicated:plan.actualPublishedAppModuleIndicated,
  requiresExplicitOwnerReview:true,
  plannedSteps:plan.steps.map(x=>({id:x.id,title:x.title,
    readiness:x.readiness})),
  noAppIndustryExclusions:true,readOnly:true,
  mayAutoReconnect:false,mayAutoRepublish:false,
  publicCustomerRequestFormActive:false,publicLinkClickedVerified:false,
  realRequestSaved:false,bookingConfirmed:false,
  notificationDelivered:false,paymentCharged:false,
  noCustomerIdentityIncluded:true,noProviderCall:true};
}
export {adviseConnectedCustomerJourneyV3220};
