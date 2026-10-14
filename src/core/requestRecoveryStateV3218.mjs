/**
 * V3.218 — conservative owner/customer recovery advice after an uncertain
 * submission. Readback/outbox status must be independently server sourced;
 * this module itself never reads a DB, executes retries or sends notifications.
 */
const UUID=/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const STATES=new Set(["pending","committed","not_found","unknown"]);
const FAIL=reason=>({ok:false,reason,status:"needs_verification",
  suggestNewSubmission:false,bookingConfirmed:false,
  providerDeliveryVerified:false,customerDataIncluded:false});
function reviewRequestRecoveryV3218({
 scope=null,writeState="unknown",readback=null,readbackAuthorized=false,
 inboxProof=null,outbox=null
}={}){
 if(!scope||!UUID.test(scope.businessId)||!UUID.test(scope.appId)||
    !UUID.test(scope.requestId)||!STATES.has(writeState))return FAIL("Unknown request scope or write state.");
 const matches=readbackAuthorized===true&&readback?.id===scope.requestId&&
  readback?.business_id===scope.businessId&&
  readback?.mini_app_id===scope.appId&&
  ["enquiry","booking_request"].includes(readback?.request_type)&&
  ["guest_web","signed_in"].includes(readback?.request_origin)&&
  ["received","reviewing","accepted","declined","closed"].includes(readback?.status);
 if(!matches) return {ok:true,kind:"recovery_guidance_v3218",
  status:writeState==="not_found"?"not_verified_missing":"commit_uncertain",
  savedRequestIndependentlyVerified:false,action:"check_existing_receipt",
  explanation:"Recheck the same authorised request and idempotency scope before trying to submit again.",
  suggestNewSubmission:false,bookingConfirmed:false,
  providerDeliveryVerified:false,ownerInboxVerified:false,
  customerDataIncluded:false};
 const inboxVerified=inboxProof?.request_id===scope.requestId&&
   inboxProof?.business_id===scope.businessId&&
   inboxProof?.authorizedServerReadback===true;
 const outboxState=outbox?.request_id===scope.requestId&&
   outbox?.business_id===scope.businessId&&
   ["pending","attempted","accepted_by_provider","delivered","failed"].includes(outbox?.state)?
    outbox.state:"unverified";
 // A provider's accepted-send response alone is NOT end-recipient delivery.
 // Only a separately authenticated delivery proof could establish that.
 return {ok:true,kind:"recovery_guidance_v3218",
  status:"saved_in_business_app",savedRequestIndependentlyVerified:true,
  action:inboxVerified?"review_saved_request":"refresh_owner_inbox",
  explanation:inboxVerified?
   "Saved request verified in the business inbox. Customer reply and booking still need separate confirmation.":
   "Saved request verified but the owner inbox needs an independent refresh.",
  suggestNewSubmission:false,bookingConfirmed:false,
  providerDeliveryVerified:false,outboxState,
  ownerInboxVerified:!!inboxVerified,customerDataIncluded:false,
  notificationAttempted:["attempted","accepted_by_provider","delivered"].includes(outboxState),
  customerReplyDelivered:false,
  note:"A saved Business App request is not by itself a website-native form receipt, delivered notification, or confirmed diary booking."};
}
export {reviewRequestRecoveryV3218};
