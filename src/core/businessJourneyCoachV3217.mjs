/**
 * V3.217 — evidence-aware, industry-neutral next step for the Business Brain.
 * Read-only reasoning from the already available capability and request state.
 * No PII, no history persistence, no autonomous send or paid provider call.
 */
import {adviseCustomerCapabilityV3216} from "./customerCapabilityAdviceV3216.mjs";
function planBusinessJourneyNextStepV3217({
 businessType="",description="",businessId="",website=null,
 app=null,liveVersion=null,catalog=[],savedReceipt=null
}={}){
 const advice=adviseCustomerCapabilityV3216({businessType,description,
   businessId,app,liveVersion,catalog,
   publishedModules:liveVersion?.config?.modules});
 const currentOwner=!!businessId&&website?.businessId===businessId;
 const hasContact=currentOwner&&Array.isArray(website?.sections)&&
  website.sections.some(x=>x?.id==="contact"&&x.enabled!==false&&
    (typeof x.email==="string"&&!!x.email.trim()||
     typeof x.phone==="string"&&!!x.phone.trim()));
 const verifiedReceipt=!!savedReceipt&&savedReceipt.ok===true&&
   savedReceipt.verifiedSaved===true&&
   savedReceipt.sourceChannel==="guest_web"&&
   savedReceipt.trustedServerReadbackClaimed===true&&
   savedReceipt.businessId===businessId&&
   savedReceipt.appId===app?.id&&
   savedReceipt.publicWebsiteSubmissionVerified===false;
 let action="prepare_business";
 let title="Tell BUSY what customers need to do";
 let reason="Start with the business goal. BUSY should not restrict an unfamiliar industry.";
 if(verifiedReceipt){
   action="review_existing_request";
   title="Review a saved customer request in BUSY";
   reason="An independently read-back Business App guest request exists. Replies and bookings still need separate checks.";
 }else if(advice.needsClarification){
   action="clarify_customer_goal";title="Which customer action should BUSY help with?";
   reason="Your instructions exclude or conflict about the available actions. Nothing has been selected or enabled.";
 }else if(!currentOwner||!hasContact){
   action="check_contact_details";
   title="Check your approved contact details";
   reason="A trustworthy customer journey needs correct business and contact information first.";
 }else if(advice.verifiedAvailableInCurrentBusinessApp){
   action="review_website_app_handoff";
   title="Review a website link to your published Business App";
   reason="An applicable module is in the published app. Owner review, current link checks and separate website publication remain necessary.";
 }else {
   action="review_business_app_setup";
   title="Prepare the customer action in your Business App";
   reason="The requested customer action has not been verified as enabled in an exact published version.";
 }
 return {ok:true,kind:"business_journey_coach_v3217",
  action,title,reason,goal:advice.goal,capability:advice.capability,
  suggestionSource:advice.suggestionEvidenceSource,
  hasOwnerScopedContact:!!hasContact,
  linkedAppPublishedCapability:advice.verifiedAvailableInCurrentBusinessApp,
  verifiedSavedBusinessAppRequest:verifiedReceipt,
  customerDataIncluded:false,noCustomerMessageSent:true,
  websiteNativeFormActive:false,bookingConfirmed:false,
  providerDelivered:false,ownerApprovalRequired:true,
  nextActionIsRecommendationOnly:true,noProviderCreditsUsed:true};
}
export {planBusinessJourneyNextStepV3217};
