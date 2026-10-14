/**
 * V3.219 — one short, safe next action for the Business Brain.
 * Honest provenance: staging schema, public link and provider delivery
 * cannot be vouched for by a client-only recommendation.
 */
import {planBusinessJourneyNextStepV3217} from "./businessJourneyCoachV3217.mjs";
import {reviewWebsiteAppVersionDriftV3219} from "./publishedVersionRecoveryV3219.mjs";
function adviseVerifiedCustomerJourneyV3219({
 businessId="",website=null,app=null,liveVersion=null,catalog=[],
 businessType="",description="",pendingWrite="none"
}={}){
 const coach=planBusinessJourneyNextStepV3217({
  businessId,website,app,liveVersion,catalog,businessType,description});
 const linkedKinds=["enquiry","booking_request"].filter(kind=>
   website?.theme?.appRequestLinks?.[kind]?.ownerApproved===true);
 const drift=linkedKinds.map(kind=>reviewWebsiteAppVersionDriftV3219({
  businessId,website,app,liveVersion,kind,pendingWrite}));
 const stale=drift.find(x=>x.ok&&(x.requiresSeparateWebsiteRepublish===true));
 const uncertain=["unknown","committed"].includes(pendingWrite);
 const action=uncertain?"check_existing_receipt":
  stale?"review_stale_website_link":coach.action;
 const title=uncertain?"Check whether the previous request was saved":
  stale?"Refresh the website's link to your published app":coach.title;
 return {ok:coach.ok,kind:"customer_journey_action_v3219",
  action,title,prioritisedSource:uncertain?"uncertain_write":
    stale?"published_app_version_drift":"current_business_goal",
  reason:uncertain?"Do not repeat a request until the original server receipt is checked.":
    stale?"The old link may target an unavailable app version. Owner reapproval and separate website publication are necessary.":
    coach.reason,
  recommendedCapability:coach.capability,
  businessId:coach.ok?businessId:null,
  ownerApprovalRequired:true,readOnly:true,sendAllowed:false,
  providerSpendAllowed:false,publicFormActive:false,
  independentlyVerifiedCustomerOutcome:false,bookingConfirmed:false,
  providerDeliveryVerified:false,customerDataIncluded:false};
}
export {adviseVerifiedCustomerJourneyV3219};
