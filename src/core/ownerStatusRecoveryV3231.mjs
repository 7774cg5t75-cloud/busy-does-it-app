/**
 * V3.231: after a lost status-write response, a fresh, authorised,
 * READ-ONLY owner inbox receipt can explain what is currently saved.
 * Matching desired state is NOT proof this exact owner action committed.
 */
const UUID=/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const STATE=new Set(["received","reviewing","accepted","declined","closed"]);
function interpretOwnerStatusAfterErrorV3231({
 businessId="",requestId="",desiredStatus="",receipt=null
}={}){
 const base={mayRetryAutomatically:false,writeProven:false,
  customerNotified:false,bookingConfirmed:false,maySend:false};
 if(!UUID.test(businessId)||!UUID.test(requestId)||
  !STATE.has(desiredStatus)||!receipt||receipt.ok!==true||
  receipt.found!==true||receipt.requestId!==requestId||
  receipt.reachedCorrectBusinessVerified!==true||
  receipt.ownerReadbackVerified!==true||!STATE.has(receipt.requestStatus))
  return {...base,kind:"unverified",
   ownerText:"BUSY cannot verify the current saved request. Refresh your inbox before doing anything else."};
 if(receipt.requestStatus===desiredStatus)
  return {...base,kind:"current_target_observed",
   currentStatus:receipt.requestStatus,
   ownerText:"The latest saved request now shows that status. BUSY cannot verify which action changed it. Do not repeat the update; open the request to check."};
 return {...base,kind:"different_current_status",
  currentStatus:receipt.requestStatus,
  ownerText:"The request's saved status has changed or the update did not complete. Refresh the request before choosing an action."};
}
export {interpretOwnerStatusAfterErrorV3231};
