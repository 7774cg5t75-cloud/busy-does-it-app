/**
 * V3.216 — private, industry-neutral website intake plan.
 * Builds on V3.215 source evidence. No visitor form, request save, AI charge,
 * owner approval mutation, or public publish action is executed here.
 */
import {websiteEnquiryReadinessV3215} from "./websiteEnquiryReadinessV3215.mjs";
const TYPE=["enquiry","booking_request"];
const FIELDS=Object.freeze([
 {key:"name",label:"Customer name",required:true},
 {key:"email",label:"Email (or phone)",required:false},
 {key:"phone",label:"Phone (or email)",required:false},
 {key:"message",label:"Enquiry message",required:true},
 {key:"service",label:"Service for a booking request",required:true},
 {key:"preferredDate",label:"Preferred date (not availability)",required:false}
]);
const TASKS=Object.freeze([
 {id:"live_deployment",name:"Check exact published website and business ownership"},
 {id:"owner_form_approval",name:"Review the fields and privacy notice"},
 {id:"challenge",name:"Verify each visitor and enforce rate limits"},
 {id:"atomic_request",name:"Reuse existing tenant-scoped request saving and unique receipts"},
 {id:"owner_inbox",name:"Read the saved request in BUSY Inbox"},
 {id:"notification",name:"Check provider notifications separately"},
 {id:"browser_staging",name:"Test an actual customer browser on isolated staging"}
]);
function planWebsiteIntakeV3216({businessId="",website=null,
 app=null,liveVersion=null,catalog=[],endpoint="",publishing=null,
 deliveryProof=null,kind="enquiry"}={}){
 const before=websiteEnquiryReadinessV3215({businessId,website,
   app,liveVersion,catalog,endpoint,publishing,deliveryProof,kind});
 if(!TYPE.includes(kind))return {ok:false,reason:"Choose enquiries or booking requests.",
   publicFormEnabled:false,customerRequestSaved:false,readOnly:true};
 const owner=before.ok===true;
 const fields=FIELDS.filter(f=>kind==="booking_request"?
   f.key!=="message":f.key!=="service"&&f.key!=="preferredDate");
 const currentDeployment=owner&&before.currentWebsiteLiveVersionVerified===true;
 const activeApp=owner&&before.existingBusinessAppHandoffSupported===true;
 const stages=TASKS.map((task,index)=>({
   ...task,ready:index===0?currentDeployment:false,
   evidence:index===0&&currentDeployment?
    "Current deployment has owner-workspace source evidence; browser access is not proven.":
    "Needs separate server implementation or isolated staging proof."
 }));
 return {ok:owner,kind:"website_intake_preparation_v3216",
  reason:owner?"":"Choose a website owned by this business.",
  requestKind:kind,websiteId:owner?website.id:null,
  websiteGeneration:owner?website.generation:null,
  proposedFields:fields,contactMethodRule:"Either email or phone must be provided",
  ownerPrivacyNoticeRequired:true,visitorConsentRequired:true,
  arbitraryFieldsSupported:false,customFieldsNeedSeparateGuard:true,
  interimPublishedAppHandoffPossible:activeApp,
  suggestedCustomerAction:activeApp?
    "Link the existing live Business App while the native form is verified.":
    "Prepare a published Business App enquiry action or show approved contact details.",
  stages,completedSourceChecks:stages.filter(t=>t.ready).length,
  completedStagingChecks:0,
  requiresPublishedOriginServerRead:true,requiresOneTimeServerChallenge:true,
  requiresAtomicReceipt:true,requiresExistingInboxAdapter:true,
  requiresIsolatedStaging:true,publicFormEnabled:false,
  customerRequestSaved:false,bookingConfirmed:false,
  providerDeliveryVerified:false,privacyTextStored:false,
  noVisitorDataRead:true,readOnly:true,noNewEndpoint:true,
  mobileGuidance:"Keep labels visible, allow full-width controls on small screens and use a 48px tap target.",
  advice:"BUSY can prepare the fields and safeguards for any business, but will not call an untested form a working customer enquiry system."
 };
}
export {planWebsiteIntakeV3216};
