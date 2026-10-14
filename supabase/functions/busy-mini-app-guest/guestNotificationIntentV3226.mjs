/**
 * Narrow readback for the transactionally enqueued guest owner alert.
 * A pending intent is NOT push delivered, an accepted appointment, nor
 * proof any user has actually seen the request.
 */
const UUID=/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
function verifyGuestNotificationIntentV3226({
 intent=null,requestId="",businessId="",appId=""
}={}){
 const valid=[requestId,businessId,appId].every(v=>UUID.test(v))&&
  intent&&typeof intent==="object"&&!Array.isArray(intent)&&
  UUID.test(intent.id)&&intent.request_id===requestId&&
  intent.business_id===businessId&&intent.mini_app_id===appId&&
  intent.event_kind==="guest_received"&&
  ["pending","claimed","provider_accepted","retry_wait","manual_review","cancelled"].includes(intent.state)&&
  Number.isSafeInteger(intent.attempt_count)&&
  intent.attempt_count>=0&&intent.attempt_count<=100;
 if(!valid)return {ok:false,reason:"The saved request's notification intent could not be independently confirmed. Check the original request receipt; do not submit another.",
  mayDispatch:false,notificationDelivered:false,retryRequest:false,
  contactDetailsIncluded:false};
 return {ok:true,kind:"guest_notification_intent_readback_v3226",
  requestId,businessId,appId,
  queueState:intent.state,storedIntentId:intent.id,
  intentDurableAsReadBack:true,
  dispatchImplementedHere:false,
  mayDispatch:false,
  notificationDelivered:false,
  notificationProviderAccepted: false,
  actualDeviceDeliveryProven:false,
  bookingConfirmed:false,
  retryRequest:false,
  contactDetailsIncluded:false};
}
export {verifyGuestNotificationIntentV3226};
