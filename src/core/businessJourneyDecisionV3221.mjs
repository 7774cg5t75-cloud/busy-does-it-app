/**
 * V3.221 — conservative, small owner-facing recommendation with one
 * evidence reason and an optional explanation. Absolutely no autonomous
 * customer actions, publication or consented cross-business learning.
 */
import {adviseConnectedCustomerJourneyV3220}
 from "./connectedJourneyAdviceV3220.mjs";
function chooseBusinessJourneyDecisionV3221(input={}){
 const base=adviseConnectedCustomerJourneyV3220(input);
 if(!base.ok||!base.businessId||base.businessId!==input.businessId)
  return {ok:false,reason:base.reason||"Business scope not proven.",
   publicationAllowed:false,providerActionAllowed:false};
 const issue=base.highlightedIssue;
 const action=issue==="possible_saved_request"?"verify_receipt_first":
  issue==="stale_website_app_version"?"review_version_change":
  base.currentPublishedAppCapabilityIndicated?"review_existing_capability":
  "prepare_supported_module";
 const why=issue==="possible_saved_request"?
  "An interrupted request might already be saved. Check the same receipt before retrying.":
  issue==="stale_website_app_version"?
  "The website link must match the latest owner-approved live Business App version.":
  base.currentPublishedAppCapabilityIndicated?
  "A matching published Business App module is indicated by the supplied app evidence.":
  "No matching live module has been established for this business.";
 return {ok:true,kind:"business_journey_decision_v3221",
  businessId:base.businessId,
  action,title:base.headline,why,
  optionalDetail:base.detail,
  availableCapabilityOnlyWhenVerified:base.currentPublishedAppCapabilityIndicated,
  industryNeutral:true,
  manualOwnerApprovalRequired:true,
  publicationAllowed:false,providerActionAllowed:false,
  savedRequestVerified:false,calendarBookingConfirmed:false,
  pushDeliveryProven:false,crossBusinessLearningPerformed:false,
  noCustomerInfoReturned:true,readOnly:true};
}
export {chooseBusinessJourneyDecisionV3221};
