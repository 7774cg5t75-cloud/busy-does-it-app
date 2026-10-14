/**
 * V3.233 client-side check of an owner-only, server-scoped READ-ONLY
 * booking revision before explicitly approved cancellation.
 * The server and PostgreSQL still decide; this is never write permission.
 */
const UUID=/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
function assessBookingCancelReadbackV3233({
 businessId="",requestId="",response=null,localBookingStatus=""
}={}){
 const deny=reason=>({ok:false,reason,maySend:false,
  customerNotified:false,calendarDelivered:false,mayRetryAutomatically:false});
 const r=response?.revision;
 if(!UUID.test(businessId)||!UUID.test(requestId)||
   response?.ok!==true||!r||r.ok!==true||
   r.businessId!==businessId||r.requestId!==requestId||
   !UUID.test(r.appId)||r.readOnly!==true||
   r.ownerApprovalRequired!==true||
   r.mayClose!==true||r.alreadyClosed!==false||
   !["reviewing","accepted"].includes(r.status)||
   !["booking_draft","booking_confirmed"].includes(r.bridgeState)||
   (r.status==="reviewing"&&(r.bridgeState!=="booking_draft"||
    r.workLedgerState!=="not_applicable"))||
   (r.status==="accepted"&&(r.bridgeState!=="booking_confirmed"||
    r.workLedgerState!=="confirmed"))||
   (localBookingStatus==="Confirmed"&&r.workLedgerState!=="confirmed")||
   typeof r.updatedAt!=="string"||
   !Number.isFinite(Date.parse(r.updatedAt))||
   r.calendarDelivered!==false||r.customerNotified!==false)
  return deny("This booking has changed or could not be verified. Open the current booking before cancelling.");
 return {ok:true,kind:"owner_booking_cancel_preflight_v3233",
  requestId,businessId,expectedStatus:r.status,
  expectedUpdatedAt:r.updatedAt,
  workLedgerState:r.workLedgerState,
  ownerApprovedCancellationStillRequired:true,
  calendarDelivered:false,customerNotified:false,
  mayRetryAutomatically:false,maySend:false};
}
export {assessBookingCancelReadbackV3233};
