/**
 * Private owner queue explanation for unsent notification intents.
 * This is an operational hint only, NEVER delivery or device proof.
 */
function ownerGuestAlertEvidenceV3226({
 businessId="",appId="",pending=null,retryWait=null
}={}){
 const valid=/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
 if(!valid.test(businessId)||!valid.test(appId)||
  ![pending,retryWait].every(v=>Number.isSafeInteger(v)&&v>=0&&v<=100000000))
   return {ok:false,reason:"A same-business server count is required.",
    providerDelivered:false,readOnly:true};
 return {ok:true,businessId,appId,pending,retryWait,
  totalAwaitingDelivery:pending+retryWait,
  explanation:pending+retryWait>0?
   "These customer alerts are saved but not yet confirmed delivered. Check your Business App inbox directly.":
   "No guest alert intents are currently marked pending or waiting to retry.",
  providerDelivered:false,actualDeviceDeliveryConfirmed:false,
  ownerApprovalRequiredForActions:true,readOnly:true,
  privateCustomerDataIncluded:false};
}
export {ownerGuestAlertEvidenceV3226};
