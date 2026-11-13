/**
 * V3.227 — account for every alert state still lacking gateway acceptance.
 * A provider-accepted push ticket remains NOT device-delivered.
 */
function ownerGuestAlertEvidenceV3227({
 businessId="",appId="",pending=/** @type {number|null} */ (null),retryWait=/** @type {number|null} */ (null),
 claimed=/** @type {number|null} */ (null),manualReview=/** @type {number|null} */ (null),gatewayAccepted=0
}={}){
 const valid=/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
 if(!valid.test(businessId)||!valid.test(appId)||
  ![pending,retryWait,claimed,manualReview,gatewayAccepted].every(v=>
   Number.isSafeInteger(v)&&v>=0&&v<=100000000))
  return {ok:/** @type {const} */ (false),readOnly:true,
   reason:"Actual same-business alert-state readbacks are required.",
   providerAccepted:false,deviceDelivered:false};
 const needsProviderReview=pending+retryWait+claimed+manualReview;
 return {ok:/** @type {const} */ (true),kind:"owner_guest_alert_states_v3227",businessId,appId,
  pending,retryWait,claimed,manualReview,needsProviderReview,
  gatewayAcceptedCount:gatewayAccepted,
  gatewayAcceptedIsNotDeviceDelivery:true,
  headline:manualReview>0?"Some owner alerts need manual attention":
   needsProviderReview>0?"Guest alert delivery is still being checked":
   "No guest alerts are currently awaiting provider confirmation",
  explanation:manualReview>0?
   "The provider result for some alerts is uncertain. Review the original customer requests in your Business App; Busy will not resend them automatically.":
   needsProviderReview>0?
   "Your customer requests are saved. Some owner alerts are pending or being checked by the notification service.":
   "No guest alerts are currently awaiting provider acceptance. This is not proof that devices displayed earlier notifications.",
  providerAcceptedByThisModule:false,deviceDelivered:false,
  pushServiceReceiptVerifiedByThisModule:false,
  bookingConfirmed:false,mayAutoResend:false,
  privateCustomerDataIncluded:false,readOnly:true};
}
export {ownerGuestAlertEvidenceV3227};
