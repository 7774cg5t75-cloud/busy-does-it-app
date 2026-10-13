/**
 * V3.205: strictly read-only reconciliation after a lost mobile message
 * response. Never retries POSTing the reply, changes read status, or
 * contacts the push provider. The original SecureStore key is preserved
 * unless the server readback proves the EXACT signed-in reply is saved.
 */
import {clearDurableMessageAttempt} from "./durableMessageRetryV3185.mjs";
import {reviewCommunicationOutcome} from "./requestCommunicationOutcomeV3205.mjs";
async function recoverExactSavedReply({
 storage=null,attempt=null,requestId="",body="",role="",
 checkReceipt=null
}={}){
 const unavailable={ok:false,verifiedSaved:false,
  mayResendAutomatically:false,receiptReadOnly:true};
 if(attempt?.ok!==true||typeof attempt.key!=="string"||
    !["business","customer"].includes(role)||!requestId||
    typeof body!=="string"||!body.trim()||
    typeof checkReceipt!=="function")
  return {...unavailable,reason:"A valid original secure reply attempt is required."};
 let data;
 try{data=await checkReceipt({
  requestId,requestKey:attempt.key,message:body
 });}
 catch{return {...unavailable,reason:"The saved-reply lookup is unavailable. Keep the original reply ID."};}
 if(data?.ok!==true||data.found!==true||
    data.messageSavedVerified!==true)
  return {...unavailable,reason:"The reply was not independently found. Check the conversation before retrying unchanged text."};
 const proof=reviewCommunicationOutcome({kind:role==="business"?"owner_reply":"customer_reply",
  requestId,receipt:data});
 if(!proof.ok)
  return {...unavailable,reason:"The saved-reply proof was inconsistent. Do not replace the original reply."};
 const cleared=await clearDurableMessageAttempt(storage,attempt);
 return {ok:true,verifiedSaved:true,
  evidence:proof,secureRetryReferenceCleared:cleared,
  mayResendAutomatically:false,receiptReadOnly:true,
  notificationDeliveredVerified:false,
  messageTextIncluded:false};
}
export {recoverExactSavedReply};
