/**
 * V3.232 bounded, pure server-side classification of an EXISTING original
 * request/link/Work closure transaction. Never substitutes SQL membership
 * or the locked revision. No provider delivery/phone/calendar claims.
 */
const UUID=/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
function classifyBookingClosureEvidenceV3232({businessId="",requestId="",result=null}={}){
 const deny=reason=>({ok:false,reason,mayConfirmBooking:false,
  customerNotified:false,calendarDelivered:false,mayRetryAutomatically:false});
 if(!UUID.test(businessId)||!UUID.test(requestId)||!result||
  typeof result!=="object"||Array.isArray(result)||
  result.link?.business_id!==businessId||
  result.link?.request_id!==requestId||
  typeof result.changed!=="boolean"||
  result.freshOwnerRevisionVerified!==true||
  result.atomicBookingCloseVerified!==true||
  result.nextStatus!=="closed"||
  !["cancelled","not_applicable"].includes(result.workLedgerState)||
  result.ledgerSource!=="business_app_request_v3181"||
  result.externalCalendarDelivered!==false||
  result.independentDiaryDeliveryVerified!==false)
  return deny("The original request and durable Work closure could not be verified.");
 // 'not_applicable' is a closed draft without confirmed Work appointment.
 // A confirmed Work appointment must be cancelled in the same SQL commit.
 if(result.workLedgerState==="cancelled"&&
    (result.workLedgerDurable!==true||!UUID.test(result.workLedgerId)))
  return deny("The cancelled booking ledger receipt is incomplete.");
 if(result.workLedgerState==="not_applicable"&&result.workLedgerDurable===true)
  return deny("The booking ledger state conflicts with the original request.");
 return {ok:true,kind:"atomic_booking_close_receipt_v3232",
  businessId,requestId,requestClosed:true,
  workLedgerState:result.workLedgerState,
  workLedgerCancellationRecorded:result.workLedgerState==="cancelled",
  originalRevisionVerified:true,sourceTransactionVerified:true,
  mayConfirmBooking:false,calendarDelivered:false,
  customerNotified:false,mayRetryAutomatically:false,
  customerContactIncluded:false};
}
export {classifyBookingClosureEvidenceV3232};
