/**
 * V3.205 — strictly scoped, read-only reply recovery contract.
 * Only a signed-in server can supply the persisted message/outbox rows.
 * The client receives zero message body, idempotency key, phone, email,
 * customer identity or private request details.
 */
const ID=/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i;
const KEY=/^[A-Za-z0-9:_-]{8,180}$/;
const STATES=new Set(["pending","submitted_unverified","no_submission_evidence"]);
const denied=reason=>({ok:/** @type {const} */ (false),reason,
 messageSavedVerified:false,notificationDeliveredVerified:false,
 appointmentConfirmed:false});
function validateMessageReceiptContext({
 actorUserId="",businessId="",requestId="",role="",
 key="",body=""
}={}){
 if(!ID.test(actorUserId)||!ID.test(requestId)||
   (businessId&&!ID.test(businessId))||
   !["business","customer"].includes(role)||
   (role==="business"&&!ID.test(businessId))||
   !KEY.test(key)||typeof body!=="string"||!body.trim()||
   body!==body.trim()||body.length>3000)
  return denied("A signed-in owner or customer must check the exact original reply.");
 return {ok:/** @type {const} */ (true),role,actorUserId,businessId,requestId,
  readOnly:true,mayResend:false,mayReadOtherCustomers:false};
}
function classifyMessageReceipt({
 actorUserId="",businessId="",requestId="",role="",
 key="",body="",message=/** @type {{id:string,business_id:string,mini_app_id:string,request_id:string,sender_user_id:string,sender_role:string,idempotency_key:string,body:string}|null} */ (null),outbox=/** @type {{id:string,business_id:string,mini_app_id:string,request_id:string,message_id:string,recipient_role:string,state:string,provider_delivery_verified:boolean}|null} */ (null)
}={}){
 const check=validateMessageReceiptContext({
  actorUserId,businessId,requestId,role,key,body});
 if(!check.ok)return check;
 if(!message)return {ok:/** @type {const} */ (true),found:/** @type {const} */ (false),messageSavedVerified:false,
   deliveryIntentRecorded:false,notificationDeliveredVerified:false,
   providerSubmissionVerified:false,canRetrySameText:true,
   noCustomerDataReturned:true,readOnly:true};
 if(!ID.test(message.id)||message.request_id!==requestId||
    message.sender_user_id!==actorUserId||
    message.sender_role!==role||message.idempotency_key!==key||
    message.body!==body||!ID.test(message.business_id)||
    (businessId&&message.business_id!==businessId)||
    !ID.test(message.mini_app_id))
  return denied("A stored reply exists but does not match this customer, business or original text.");
 if(outbox&&(outbox.message_id!==message.id||
  outbox.request_id!==requestId||
  outbox.business_id!==message.business_id||
  outbox.mini_app_id!==message.mini_app_id||
  outbox.recipient_role!==(role==="business"?"customer":"business")||
  !STATES.has(outbox.state)||
  outbox.provider_delivery_verified!==false))
  return denied("The saved reply delivery-intent record needs investigation.");
 return {ok:/** @type {const} */ (true),found:/** @type {const} */ (true),
  messageId:message.id,requestId,
  messageSavedVerified:true,deliveryIntentRecorded:!!outbox,
  deliveryIntentState:outbox?.state||"not_verified",
  notificationSubmissionAttemptRecorded:
   outbox?.state==="submitted_unverified"||outbox?.state==="no_submission_evidence",
  providerSubmissionVerified:false,
  notificationDeliveredVerified:false,customerDeviceReceiptVerified:false,
  appointmentConfirmed:false,ownerResponseCompleted:role==="business",
  messageBodyOmitted:true,customerDataReturned:false,readOnly:true,
  retryWillNotBeAutoSent:true,allowedBusinessScopeOnly:true};
}
export {validateMessageReceiptContext,classifyMessageReceipt};
