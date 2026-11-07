/**
 * V3.213 — one minimal, conservative RECEIPT EVIDENCE CONTRACT, byte-identical
 * across signed-in Business App and public guest Edge functions.
 *
 * This is ONLY a pure post-read validator. The two existing server routes
 * must authenticate/authorize and query the exact record BEFORE calling it.
 * Never trusts a client-supplied bridge status, membership, or payment state.
 * No payload, customer contact details, raw tokens or actor identifiers leak.
 */
const UUID=/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const TYPE=new Set(["booking_request","enquiry"]);
const STATUS=new Set(["received","reviewing","accepted","declined","closed"]);
const CONTEXT=new Set(["signed_in_submission","signed_in_receipt","guest_submission","guest_status","owner_update"]);
const fail=(reason)=>({ok:false,reason,verifiedSaved:false,
 independentDiaryVerification:false,externalDeliveryVerified:false,
 shouldRetryCreate:false});
function evaluateStoredRequestProof({request=/** @type {{id:string,business_id:string,mini_app_id:string,request_type:string,status:string,request_origin:string,consumer_user_id?:string|null}|null} */ (null),link=/** @type {{request_id:string,business_id:string,bridge_state:string}|null} */ (null),businessId="",
 appId="",requestId="",context=""}={}){
 if(!CONTEXT.has(context)||!UUID.test(businessId)||!UUID.test(appId)||
   !UUID.test(requestId)||!request||typeof request!=="object"||
   request.id!==requestId||request.business_id!==businessId||
   request.mini_app_id!==appId||!TYPE.has(request.request_type)||
   !STATUS.has(request.status))
  return fail("The stored request identity, workspace, type or status could not be verified.");
 const guest=request.request_origin==="guest_web";
 if(context.startsWith("guest_")&&!guest)
  return fail("Only an exact guest browser request receipt can be used here.");
 if(context.startsWith("signed_in_")&&request.request_origin!=="signed_in")
  return fail("This signed-in receipt belongs to a different request channel.");
 if(!["guest_web","signed_in"].includes(request.request_origin))
  return fail("This request does not have a verified channel of origin.");
 if(link!==null&&link!==undefined&&(
    typeof link!=="object"||
    link.request_id!==requestId||
    link.business_id!==businessId))
  return fail("The request linkage did not match this business and request.");
 const isBooking=request.request_type==="booking_request";
 const consistentInternalConfirmation=isBooking&&request.status==="accepted"&&
   link?.bridge_state==="booking_confirmed";
 const conflictedBooking=isBooking&&(
   (request.status==="accepted"&&!consistentInternalConfirmation)||
   (link?.bridge_state==="booking_confirmed"&&request.status!=="accepted"));
 const statusLabel=request.status==="received"?"Request received":
   request.status==="reviewing"?"Business reviewing":
   request.status==="declined"?"Request declined":
   request.status==="closed"?"Request closed":
   isBooking?(consistentInternalConfirmation?
    "Business booking confirmation recorded":"Booking confirmation needs review"):
   "Enquiry accepted by business";
 return {ok:true,kind:"server_readback_request_proof_v3213",
  requestId,requestType:request.request_type,status:request.status,
  savedRequestConfirmed:true,verifiedSaved:true,sourceChannel:guest?"guest_web":"signed_in",
  statusLabel,
  bookingStateConsistent:!conflictedBooking,
  bookingMarkedConfirmedInBusy:!!consistentInternalConfirmation,
  independentDiaryVerification:false,
  externalCalendarDelivered:false,externalDeliveryVerified:false,
  notificationDelivered:false,customerReadReceipt:false,
  acceptedEnquiryIsNotSentReply:!isBooking&&request.status==="accepted",
  bookingRequestIsNotDiaryConfirmation:isBooking&&!consistentInternalConfirmation,
  shouldRetryCreate:false,
  ownerActionMayBeNeeded:["received","reviewing"].includes(request.status),
  customerPayloadIncluded:false,contactDetailsIncluded:false,
  actorIdentityIncluded:false,guestAccessTokenIncluded:false,
  noChargeCreated:true,noNewRequestCreated:true,
  proofScope:"saved_internal_request_only"};
}
export {evaluateStoredRequestProof};
