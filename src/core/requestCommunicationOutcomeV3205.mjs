/**
 * V3.205: one strictly bounded account-level outcome summary.
 * Evidence sources must be actual authenticated service responses. This
 * evaluator is display-only and CANNOT verify transport/JWT independently.
 * Never learns message text or changes business/customer records.
 */
const ID=/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i;
const fail=reason=>({ok:false,reason,requestReceivedByBusiness:false,
 messageSaved:false,messageDelivered:false,appointmentConfirmed:false});
function reviewCommunicationOutcome({
 kind="",businessId="",appId="",requestId="",
 receipt=null
}={}){
 if(!ID.test(requestId)||!["owner_inbox","owner_reply","customer_reply"].includes(kind)||
   (businessId&&!ID.test(businessId))||
   (appId&&!ID.test(appId))||receipt?.ok!==true)
  return fail("Busy needs the authenticated, current request receipt.");
 if(kind==="owner_inbox"){
  if(!ID.test(businessId)||!ID.test(appId)||
     receipt.found!==true||receipt.requestId!==requestId||
     receipt.reachedCorrectBusinessVerified!==true||
     receipt.notificationDeliveredVerified!==false)
   return fail("The request has not been verified in this business's inbox.");
  return {ok:true,kind:"business_request_inbox_evidence_v3205",
   requestId,appId,businessId,requestReceivedByBusiness:true,
   ownerReadbackVerified:true,
   messageSaved:false,ownerActuallyNotified:false,
   messageDelivered:false,appointmentConfirmed:false,
   customerConversionVerified:false,
   summary:"This request is saved in your business inbox. Whether you saw a notification is not verified.",
   nextStep:"Review the customer request and reply from your business inbox.",
   noAutomaticCustomerContact:true,noSensitiveCustomerData:true};
 }
 const isOwner=kind==="owner_reply";
 if(receipt.found!==true||receipt.messageSavedVerified!==true||
    receipt.requestId!==requestId||!ID.test(receipt.messageId)||
    receipt.notificationDeliveredVerified!==false||
    (receipt.deliveryIntentRecorded!==true&&receipt.deliveryIntentRecorded!==false))
  return fail("The exact reply was not independently verified as saved.");
 return {ok:true,kind:"scoped_reply_evidence_v3205",
  requestId,messageId:receipt.messageId,role:isOwner?"business":"customer",
  requestReceivedByBusiness:false,messageSaved:true,
  deliveryIntentRecorded:receipt.deliveryIntentRecorded,
  deliveryIntentState:receipt.deliveryIntentState,
  providerSubmissionAttemptRecorded:receipt.notificationSubmissionAttemptRecorded===true,
  messageDelivered:false,customerSawNotification:false,
  recipientReadVerified:false,appointmentConfirmed:false,
  customerConversionVerified:false,automaticRetryAuthorised:false,
  summary:"Busy verified the saved reply. Notification delivery and recipient reading are still unverified.",
  nextStep:isOwner?"Review the conversation to follow up.":"Check the conversation for a reply from the business.",
  noAutomaticCustomerContact:true,noSensitiveCustomerData:true};
}
export {reviewCommunicationOutcome};
