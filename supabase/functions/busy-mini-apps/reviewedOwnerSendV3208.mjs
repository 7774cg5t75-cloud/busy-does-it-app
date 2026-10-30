/**
 * V3.208 — non-atomic, last-moment server precondition for OWNER-REVIEWED
 * suggested replies. The owner must still explicitly press Send.
 *
 * This is a safety check immediately BEFORE the existing idempotent
 * message transaction. Concurrent customer writes after this check remain
 * possible, so it must not claim a serialisable compare-and-send.
 */
const UUID=/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const blocked=reason=>({ok:/** @type {const} */ (false),reason,
 maySend:false,checkedCurrentServerState:false,
 atomicCompareAndSend:false,customerDeliveryVerified:false});
function guardReviewedOwnerSend({
 businessId="",appId="",requestId="",expectedSourceStamp="",
 fresh=/** @type {ReturnType<import('./freshOwnerFollowupV3207.mjs').decideFreshOwnerFollowup>|null} */ (null)
}={}){
 if(![businessId,appId,requestId].every(x=>UUID.test(x))||
   typeof expectedSourceStamp!=="string"||
   expectedSourceStamp.length<40||expectedSourceStamp.length>600)
   return blocked("Open the latest customer conversation before sending Busy's suggested reply.");
 if(fresh?.ok!==true||fresh.kind!=="fresh_owner_followup_v3207"||
   fresh.businessId!==businessId||fresh.appId!==appId||
   fresh.requestId!==requestId||
   fresh.sourceStamp!==expectedSourceStamp||
   fresh.category!=="needsReply"||
   fresh.canOfferDraft!==true||
   fresh.ownerApprovalRequired!==true||fresh.canAutoSend!==false||
   fresh.independentProviderDeliveryVerified!==false||
   fresh.customerOutcomeConfirmed!==false)
  return {...blocked("The customer's conversation changed or the reply is no longer appropriate. Review it again."),
   staleOrUnsupported:true};
 return {ok:/** @type {const} */ (true),kind:"reviewed_reply_pre_send_check_v3208",
  businessId,appId,requestId,maySend:true,
  ownerApprovalStillRequired:true,
  checkedCurrentServerState:true,
  sourceStampMatches:true,transactionalWriteHasNotHappened:true,
  atomicCompareAndSend:false,anotherMessageMayRace:true,
  noAutomaticSending:true,customerDeliveryVerified:false,
  diaryBookingConfirmed:false};
}
function validateOwnerReplyAfterSave({
 businessId="",appId="",requestId="",sent=/** @type {{databaseMessageSaved:boolean,message:{id:string}}|null} */ (null),
 current=/** @type {ReturnType<import('./freshOwnerFollowupV3207.mjs').decideFreshOwnerFollowup>|null} */ (null)
}={}){
 if(![businessId,appId,requestId].every(x=>UUID.test(x))||
   sent?.databaseMessageSaved!==true||
   !UUID.test(sent?.message?.id||""))
  return {ok:/** @type {const} */ (false),reason:"BUSY cannot verify the saved reply."};
 const matching=current?.ok===true&&
  current.kind==="fresh_owner_followup_v3207"&&
  current.businessId===businessId&&current.appId===appId&&
  current.requestId===requestId;
 const waiting=matching&&current.category==="waiting";
 return {ok:/** @type {const} */ (true),kind:"reviewed_owner_reply_outcome_v3208",
  businessId,appId,requestId,
  savedReplyId:sent.message.id,
  databaseReplySaved:true,
  freshRequestReadbackVerified:matching,
  lastRecordedMessageIsBusiness:waiting,
  noFurtherReplySuggested:waiting,
  incompleteOrChangedEvidence:!waiting,
  externalNotificationDelivered:false,customerReadReply:false,
  bookingConfirmed:false,jobFinished:false,convertedToSale:false,
  businessBrainEvidenceLevel:waiting?
   "saved_reply_and_fresh_request_readback":"saved_reply_only",
  ownerShouldCheckConversation:!waiting,
  noAutomationDispatched:true,noCustomerPIIReturned:true};
}
export {guardReviewedOwnerSend,validateOwnerReplyAfterSave};
