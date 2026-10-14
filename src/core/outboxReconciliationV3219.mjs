/**
 * V3.219 — source-scoped delivery reconciliation. No network calls,
 * notification provider send, or untrusted success claims. An outbox row
 * is not an independent delivery receipt, even when state='delivered'.
 */
const UUID=/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const STATES=new Set(["pending","claimed","attempted","accepted_by_provider","delivered","failed","dead_letter"]);
const fail=reason=>({ok:false,reason,deliveryVerified:false,
 mayResend:false,customerReplyDelivered:false});
function reviewNotificationOutboxV3219({
 businessId="",requestId="",eventKey="",row=null,
 readbackAuthorized=false,providerProof=null
}={}){
 if(!UUID.test(businessId)||!UUID.test(requestId)||
   typeof eventKey!=="string"||eventKey.length<8||eventKey.length>160||
   !/^[a-z0-9:_-]+$/i.test(eventKey))
  return fail("An exact business/request notification key is required.");
 if(!readbackAuthorized||!row||row.business_id!==businessId||
   row.request_id!==requestId||row.event_key!==eventKey||
   !STATES.has(row.state))
  return { ...fail("Independent same-business outbox readback is required."),
   action:"verify_outbox_before_retry"};
 const proofMatches=providerProof&&providerProof.business_id===businessId&&
   providerProof.request_id===requestId&&providerProof.event_key===eventKey&&
   providerProof.notification_id===row.id&&
   providerProof.signatureVerifiedByServer===true&&
   providerProof.providerDeliveryState==="delivered"&&
   providerProof.deliveryReferencePresent===true&&
   row.state==="delivered";
 // The pure function cannot independently verify a signature; an actual
 // server adapter must cryptographically verify it against provider evidence.
 const attempted=["attempted","accepted_by_provider","delivered","failed","dead_letter"]
   .includes(row.state);
 const action=proofMatches?"review_delivered_receipt":
   ["pending","claimed","attempted","accepted_by_provider"].includes(row.state)?
     "reconcile_in_flight_delivery":
   row.state==="failed"?"owner_review_retry_policy":
   row.state==="dead_letter"?"owner_review_dead_letter":
   "verify_provider_receipt";
 return {ok:true,kind:"outbox_reconciliation_v3219",
  businessId,requestId,eventKey,outboxState:row.state,
  action,notificationAttempted:attempted,
  providerClaimPresent:!!proofMatches,
  // Even passing a signedClaim boolean to a pure function is not proof.
  independentProviderVerificationByThisModule:false,
  deliveryVerified:false,customerReplyDelivered:false,
  bookingConfirmed:false,mayResend:false,
  retryRequiresUniqueEventAndWorkerLock:true,
  providerReceiptNeedsServerVerification:true,
  ownerReviewRequired:action.includes("owner_"),
  customerDataIncluded:false,
  explanation:proofMatches?
   "The caller supplied a matching provider proof assertion. BUSY must independently verify the signed receipt before reporting delivery.":
   "A saved or attempted notification is not proof that a customer actually received it."};
}
export {reviewNotificationOutboxV3219};
