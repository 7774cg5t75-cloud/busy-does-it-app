/**
 * V3.208 — a bounded client-visible proof that the owner-approved reply
 * was stored. An optional fresh same-request readback can make the next
 * recommendation "wait" instead of asking the owner to chase again.
 *
 * This does not verify JWT signatures on the client, nor push delivery.
 */
const ID=/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
function interpretSavedOwnerReply({
 businessId="",appId="",requestId="",response=null
}={}){
 const deny=reason=>({ok:false,reason,noMessageDeliveryClaim:true});
 if(![businessId,appId,requestId].every(x=>ID.test(x))||
    response?.ok!==true||response?.databaseMessageSaved!==true||
    !ID.test(response?.message?.id||""))
   return deny("The owner reply has not been verified as saved.");
 const readback=response?.postSendEvidence;
 const readbackValid=readback?.ok===true&&
    readback.kind==="reviewed_owner_reply_outcome_v3208"&&
    readback.businessId===businessId&&readback.appId===appId&&
    readback.requestId===requestId&&
    readback.savedReplyId===response.message.id&&
    readback.databaseReplySaved===true&&
    readback.externalNotificationDelivered===false&&
    readback.customerReadReply===false&&
    readback.bookingConfirmed===false&&
    readback.jobFinished===false&&
    readback.convertedToSale===false;
 const waiting=readbackValid&&
    readback.freshRequestReadbackVerified===true&&
    readback.lastRecordedMessageIsBusiness===true&&
    readback.noFurtherReplySuggested===true;
 return {ok:true,kind:"owner_reply_evidence_v3208",
  requestId,appId,businessId,messageId:response.message.id,
  messageSaved:true,
  waitingForCustomerAtReadback:waiting,
  latestConversationCheckVerified:readbackValid&&
    readback.freshRequestReadbackVerified===true,
  nextOwnerAction:waiting?
    "Wait for the customer's response; don't send another chase now.":
    "The reply is saved. Recheck the latest conversation before following up again.",
  summary:waiting?
    "Busy verified the saved reply, then checked that the last recorded in-app message was from this business.":
    "Busy verified that the reply was saved. The latest message order still needs checking.",
  businessBrainEvidenceLevel:waiting?
    "saved_owner_reply_plus_fresh_readback":"saved_owner_reply",
  messageDelivered:false,recipientRead:false,
  diaryBookingConfirmed:false,customerConverted:false,
  automaticChaseScheduled:false,privateContentIncluded:false};
}
export {interpretSavedOwnerReply};
