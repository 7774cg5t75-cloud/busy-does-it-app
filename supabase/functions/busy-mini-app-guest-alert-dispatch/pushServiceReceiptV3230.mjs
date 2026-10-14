/**
 * V3.230. Classify a REAL Expo push receipt only when its original ticket
 * ID was already saved in the private V3.229 notification ledger.
 * Expo status ok confirms processing by Apple/Google push service, NOT
 * arrival on a phone or that the owner saw the alert.
 * No provider call, customer details, raw token or automatic push retry.
 */
const ID=/^[A-Za-z0-9_-]{5,120}$/;
const ERRORS=new Set(["DeviceNotRegistered","MessageTooBig",
 "MessageRateExceeded","MismatchSenderId","InvalidCredentials"]);
const none={kind:"receipt_unverified",persist:false,
 pushServiceAccepted:false,deviceDelivered:false,ownerRead:false,
 mayResendPush:false};
function classifyPushServiceReceiptV3230({ticketId="",responseOk=false,
 receipts=null}={}){
 if(!ID.test(ticketId)||responseOk!==true||!receipts||
  typeof receipts!=="object"||Array.isArray(receipts)||
  !Object.prototype.hasOwnProperty.call(receipts,ticketId))
  return {...none};
 const r=receipts[ticketId];
 if(!r||typeof r!=="object"||Array.isArray(r))
  return {...none};
 if(r.status==="ok")
  return {kind:"push_service_accepted",persist:true,
   errorCode:null,pushServiceAccepted:true,deviceDelivered:false,
   ownerRead:false,mayResendPush:false};
 if(r.status==="error"&&r.details&&
   typeof r.details==="object"&&!Array.isArray(r.details)&&
   typeof r.details.error==="string"&&r.details.error.trim()){
  return {kind:"push_service_rejected",persist:true,
   errorCode:ERRORS.has(r.details.error)?r.details.error:"OtherProviderError",
   pushServiceAccepted:false,deviceDelivered:false,
   ownerRead:false,mayResendPush:false};
 }
 return {...none};
}
export {classifyPushServiceReceiptV3230};
