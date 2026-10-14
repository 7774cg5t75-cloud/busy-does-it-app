/**
 * V3.235 owner-only presentation verifier for the one original request's
 * saved outcome evidence. It is NOT independent confirmation of a
 * successful booking, customer delivery, payment or real-world conversion.
 */
const ID=/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const STAGES=new Set(["saved_request","request_marked_finished",
 "request_accepted_only","business_reply_recorded","reply_needs_review",
 "manual_contact_review","evidence_incomplete"]);
function verifyOwnerOutcomeEvidenceV3235({
 businessId="",appId="",requestId="",followup=null,evidence=null
}={}){
 const deny=reason=>({ok:false,reason,outcomeConfirmed:false,
  maySend:false,customerReadVerified:false});
 if(![businessId,appId,requestId].every(x=>ID.test(x))||
  !followup||followup.ok!==true||!evidence||
  evidence.ok!==true||evidence.kind!=="owner_outcome_evidence_v3235"||
  evidence.businessId!==businessId||evidence.appId!==appId||
  evidence.requestId!==requestId||
  evidence.sourceStamp!==followup.sourceStamp||
  evidence.observedReplyCategory!==followup.category||
  !STAGES.has(evidence.stage)||typeof evidence.summary!=="string"||
  evidence.summary.length<15||evidence.summary.length>340||
  evidence.isReadOnly!==true||evidence.ownerApprovalRequired!==true||
  evidence.outcomeConfirmed!==false||evidence.bookingFulfilled!==false||
  evidence.customerReadVerified!==false||
  evidence.customerNotified!==false||
  evidence.calendarProviderSynced!==false||
  evidence.paymentVerified!==false||evidence.maySend!==false||
  evidence.mayCharge!==false||evidence.customerDataIncluded!==false)
  return deny("BUSY cannot verify the original saved customer outcome.");
 return {ok:true,kind:"owner_outcome_review_v3235",
  stage:evidence.stage,summary:evidence.summary,
  sourceStamp:evidence.sourceStamp,
  outcomeConfirmed:false,bookingFulfilled:false,
  customerReadVerified:false,customerNotified:false,
  maySend:false,mayCharge:false};
}
export {verifyOwnerOutcomeEvidenceV3235};
