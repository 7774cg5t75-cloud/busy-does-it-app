/**
 * V3.217 — privacy-minimal result display for APP handoff vs native SITE.
 * The only existing authenticated receipt contract is mini-app guest/signed-in.
 * Never infer a website-native receipt from a successful link or request plan.
 */
import {evaluateStoredRequestProof}
 from "../../supabase/functions/busy-mini-app-guest/requestReceiptProofV3213.mjs";
const UUID=/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const no=reason=>({ok:false,reason,verifiedSaved:false,
  status:"not_verified",retryCreateRecommended:false,
  bookingConfirmed:false,notificationDelivered:false});
function reviewSharedCustomerReceiptV3217({
 businessId="",appId="",requestId="",request=null,link=null,
 source="website_handoff",readbackTrusted=false,writeOutcome="unknown"
}={}){
 if(!["website_handoff","business_app","website_native"].includes(source))
  return no("Unknown customer request surface.");
 if(source==="website_native")
  return no("Native website receipt requires a new server-owned origin and transactional save contract.");
 if(readbackTrusted!==true)
  return { ...no("An independently authorised server readback is required."),
    status:writeOutcome==="unknown"?"commit_uncertain":"not_verified",
    shouldCheckExistingReceiptFirst:true};
 if(!UUID.test(businessId)||!UUID.test(appId)||!UUID.test(requestId))
  return no("Invalid request identity.");
 const proof=evaluateStoredRequestProof({
  request,link,businessId,appId,requestId,
  context:"guest_submission"
 });
 if(!proof.ok)return {...no(proof.reason),
   status:writeOutcome==="unknown"?"commit_uncertain":"not_verified",
   shouldCheckExistingReceiptFirst:writeOutcome==="unknown"};
 return {ok:true,kind:"shared_customer_receipt_v3217",
  source,businessId,appId,verifiedSaved:proof.verifiedSaved===true,
  trustedServerReadbackClaimed:true,
  status:"saved_in_business_app",requestId,
  requestType:proof.requestType,
  internalRequestStatus:proof.status,
  statusLabel:proof.statusLabel,
  sourceChannel:proof.sourceChannel,
  publicWebsiteSubmissionVerified:false,
  independentlyVerifiedWebsiteClick:false,
  ownerInboxReadVerified:false,
  independentDiaryVerification:false,
  bookingMarkedConfirmedInBusy:proof.bookingMarkedConfirmedInBusy===true,
  bookingConfirmed:false,notificationDelivered:false,
  customerReplyDelivered:false,providerDelivered:false,
  retryCreateRecommended:false,
  shouldCheckExistingReceiptFirst:writeOutcome==="unknown",
  contactDetailsIncluded:false,customerPayloadIncluded:false,
  note:"This is a verified saved Business App guest request, not proof of a native website form, delivered notification or diary appointment."};
}
export {reviewSharedCustomerReceiptV3217};
