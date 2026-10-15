/**
 * V3.218 — reusable cross-surface CUSTOMER journey composer.
 * Existing website + immutable published Business App capability evidence
 * is shared, never duplicated as a fake website-native endpoint. Any
 * legitimate/unknown industry has a safe plan and owner-control route.
 */
import {adviseCustomerCapabilityV3216} from "./customerCapabilityAdviceV3216.mjs";
import {planWebsiteAppRequestHandoff} from "./websiteAppHandoffV3214.mjs";
import {planWebsiteIntakeV3216} from "./websiteIntakePlanningV3216.mjs";
function planUniversalCustomerJourneyV3218({
 businessId="",website=null,app=null,liveVersion=null,
 catalog=[],endpoint="",businessType="",description="",
 publishing=null,deliveryProof=null
}={}){
 if(!businessId||website?.businessId!==businessId||
    (app&&app.business_id!==businessId))
  return {ok:false,reason:"Open the same business's current private website and app workspace.",
   publicFormActive:false,ownerApprovalRequired:true};
 const advice=adviseCustomerCapabilityV3216({businessType,description,
  businessId,app,liveVersion,catalog,
  publishedModules:liveVersion?.config?.modules});
 if(advice.needsClarification||advice.capability==='catalogue')return {
  ok:true,kind:'universal_customer_journey_v3218',businessId,
  anyLegitimateIndustryEligible:true,requestedBusinessGoal:advice.goal,
  recommendedCapability:advice.capability,suggestionBasedOn:advice.suggestionEvidenceSource,
  industryHintNotRequirement:true,actualPublishedAppModuleIndicated:false,
  ownerApprovedHandoffInPrivateDraft:false,handoffNeedsOwnerReview:true,
  handoffCanBePrepared:false,publicHandoffClickVerified:false,websiteNativeIntakePlanned:false,
  nativeWebsiteFormActive:false,publicFormActive:false,bookingConfirmed:false,
  providerDeliveryVerified:false,noCustomerRequestCreated:true,noCustomerDataIncluded:true,
  noExternalCalls:true,ownerApprovalRequired:true,
  steps:[{id:'customer_goal',title:advice.needsClarification?'Clarify the customer action':'Review catalogue capability separately',
   readiness:'owner_review_required',reason:advice.needsClarification?
    'BUSY will not substitute an action you declined.':'An enquiry link is not a product catalogue or checkout.'}],
  summary:advice.needsClarification?'Choose the action you want before preparing a connected journey.':
   'Catalogue setup needs its own supported capability; BUSY will not substitute an enquiry form.'};
 const intent=advice.capability==="booking_request"?"booking_request":"enquiry";
 const handoff=planWebsiteAppRequestHandoff({businessId,website,app,
   liveVersion,catalog,endpoint,kind:intent});
 const native=planWebsiteIntakeV3216({businessId,website,app,
   liveVersion,catalog,endpoint,publishing,deliveryProof,kind:intent});
 const linked=website?.theme?.appRequestLinks?.[intent];
 const ownerApprovedCurrent=handoff.ok&&linked?.ownerApproved===true&&
   linked?.url===handoff.url&&linked?.appId===handoff.appId&&
   linked?.liveVersionId===handoff.appLiveVersionId;
 const existingModule=advice.verifiedAvailableInCurrentBusinessApp===true;
 const steps=[
  {id:"business_info",title:"Check your real business details",
   readiness:"private_owner_review",
   reason:"Customer information and consent must always come from this business."},
  {id:"app_capability",title:existingModule?
   "Review the published Business App action":"Prepare the needed Business App action",
   readiness:existingModule?"published_app_source_evidence":"owner_setup_or_new_capability",
   reason:existingModule?"Check the exact published module before any live action.":
    "Unknown industries and unsupported features receive a reviewed plan, not a false enabled module."},
  {id:"website_handoff",title:ownerApprovedCurrent?
   "Review the current approved website link":"Prepare an owner-approved website-to-app link",
   readiness:ownerApprovedCurrent?
    "current_private_draft_only":"review_required",
   reason:handoff.ok?"The Business App must independently verify its current live version on click.":
     handoff.reason},
  {id:"native_site_form",title:"Prepare a native website enquiry form",
   readiness:"not_implemented",
   reason:"Only a future versioned server challenge, atomic save, real browser verification and owner approval can enable it."}
 ];
 return {ok:true,kind:"universal_customer_journey_v3218",businessId,
  anyLegitimateIndustryEligible:true,
  requestedBusinessGoal:advice.goal,
  recommendedCapability:advice.capability,
  suggestionBasedOn:advice.suggestionEvidenceSource,
  industryHintNotRequirement:true,
  actualPublishedAppModuleIndicated:existingModule,
  ownerApprovedHandoffInPrivateDraft:!!ownerApprovedCurrent,
  handoffNeedsOwnerReview:!ownerApprovedCurrent,
  handoffCanBePrepared:handoff.ok===true,
  publicHandoffClickVerified:false,
  websiteNativeIntakePlanned:native.ok===true,
  nativeWebsiteFormActive:false,publicFormActive:false,
  bookingConfirmed:false,providerDeliveryVerified:false,
  noCustomerRequestCreated:true,noCustomerDataIncluded:true,
  noExternalCalls:true,ownerApprovalRequired:true,
  steps,summary:ownerApprovedCurrent?
   "BUSY has prepared an approved link in your private draft; public publication and real request delivery remain separate.":
   "BUSY can guide you toward a connected customer journey without inventing missing capabilities."};
}
export {planUniversalCustomerJourneyV3218};
