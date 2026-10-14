/**
 * V3.235 outcome evidence for ONE current owner-authorised customer request.
 * Read-only. Persisted request/message evidence is not customer satisfaction,
 * external notification receipt, appointment fulfilment or conversion.
 */
const ID=/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
function classifyOwnerOutcomeEvidenceV3235({
 businessId="",appId="",requestId="",request=null,decision=null
}={}){
 const deny=reason=>({ok:false,reason,outcomeConfirmed:false,
  maySend:false,paidResultVerified:false});
 if(![businessId,appId,requestId].every(v=>ID.test(v))||
  !request||request.id!==requestId||request.business_id!==businessId||
  request.mini_app_id!==appId||
  !["enquiry","booking_request"].includes(request.request_type)||
  !["received","reviewing","accepted","declined","closed"].includes(request.status)||
  !decision||decision.ok!==true||decision.businessId!==businessId||
  decision.appId!==appId||decision.requestId!==requestId||
  typeof decision.sourceStamp!=="string"||
  decision.sourceStamp.length<40||decision.sourceStamp.length>600||
  !["needsReply","waiting","manual","closed","unknown"].includes(decision.category))
  return deny("BUSY cannot verify the original request and conversation.");
 let stage="saved_request",summary="The enquiry is saved. No customer outcome has been verified.";
 let followupNeeded=true;
 if(request.status==="closed"||request.status==="declined"){
  stage="request_marked_finished";
  summary="The request is marked finished in BUSY. A successful customer outcome has not been independently verified.";
  followupNeeded=false;
 }else if(request.request_type==="booking_request"&&request.status==="accepted"){
  stage="request_accepted_only";
  summary="The request is marked accepted. The Work booking and customer notification have not been checked here.";
 }else if(decision.category==="waiting"){
  stage="business_reply_recorded";
  summary="Your reply is saved. Delivery, customer reading and a successful outcome have not been verified.";
  followupNeeded=false;
 }else if(decision.category==="needsReply"){
  stage="reply_needs_review";
  summary="BUSY found no newer saved business reply. Review a response before sending.";
 }else if(decision.category==="manual"){
  stage="manual_contact_review";
  summary="BUSY cannot confirm an appropriate direct reply route for this request.";
 }else if(decision.category==="unknown"){
  stage="evidence_incomplete";
  summary="The saved conversation is not clear enough to confirm the next customer action.";
 }
 return {ok:true,kind:"owner_outcome_evidence_v3235",businessId,appId,
  requestId,sourceStamp:decision.sourceStamp,stage,summary,followupNeeded,
  observedStatus:request.status,observedReplyCategory:decision.category,
  evidenceSource:"original_scoped_request_and_recent_messages",
  isReadOnly:true,ownerApprovalRequired:true,
  outcomeConfirmed:false,bookingFulfilled:false,
  customerReadVerified:false,customerNotified:false,
  calendarProviderSynced:false,paymentVerified:false,
  maySend:false,mayCharge:false,customerDataIncluded:false};
}
export {classifyOwnerOutcomeEvidenceV3235};
