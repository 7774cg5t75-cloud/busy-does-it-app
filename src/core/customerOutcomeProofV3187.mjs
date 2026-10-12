/**
 * V3.187 — prove only what the owner-scoped stored rows actually establish.
 * Never mark a booking attended, job completed, invoice paid or reply seen
 * based on a status flag, gateway ticket or a customer's mere submission.
 * All details stay in memory; return counts and review actions, never PII.
 */
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const STATUSES=new Set(["received","reviewing","accepted","declined","closed"]);
function reviewCustomerOutcomeProof({
 businessId="",appId="",requests=[],messages=[],work=[],links=[],
 requestsTruncated=false,messagesTruncated=false,workTruncated=false
}={}){
 if(!UUID.test(businessId)||!UUID.test(appId)||
    !Array.isArray(requests)||requests.length>2000||
    !Array.isArray(messages)||messages.length>150||
    !Array.isArray(work)||work.length>200||
    !Array.isArray(links)||links.length>2000)
  return {ok:false,reason:"An authenticated bounded owner snapshot is required."};
 const owned=row=>row?.business_id===businessId&&
   (row.mini_app_id===undefined||row.mini_app_id===appId);
 if([...requests,...messages,...work,...links].some(x=>!owned(x)))
  return {ok:false,reason:"Customer evidence cannot cross businesses or apps."};
 const saved=new Map();
 for(const r of requests){
  if(!UUID.test(r?.id||"")||!["enquiry","booking_request"].includes(r.request_type)||
     !STATUSES.has(r.status)||saved.has(r.id))
   return {ok:false,reason:"Duplicate or invalid customer request evidence."};
  saved.set(r.id,r);
 }
 const messagesByRequest=new Map();
 for(const m of messages){
  if(!saved.has(m.request_id)||
     !["business","customer"].includes(m.sender_role))continue;
  const prior=messagesByRequest.get(m.request_id)||{owner:false,customer:false};
  if(m.sender_role==="business")prior.owner=true;else prior.customer=true;
  messagesByRequest.set(m.request_id,prior);
 }
 const bookings=new Map(),linkStates=new Map();
 for(const item of work){
  if(!saved.has(item.request_id))continue;
  if(bookings.has(item.request_id)||
    !["confirmed","cancelled"].includes(item.state))
   return {ok:false,reason:"BUSY Work evidence requires a unique valid ledger row."};
  bookings.set(item.request_id,item.state);
 }
 for(const item of links){
  if(!saved.has(item.request_id))continue;
  if(linkStates.has(item.request_id))return {ok:false,
   reason:"The request has competing customer handoff links."};
  linkStates.set(item.request_id,item.bridge_state);
 }
 const counts={requests:0,enquiries:0,bookingRequests:0,
  savedOwnerReplies:0,savedCustomerReplies:0,
  acceptedBookingsWithWork:0,cancelledWorkBookings:0,
  acceptedWithoutConfirmedWork:0,closedButWorkActive:0,
  requestsWithoutStoredOwnerReply:0};
 for(const [id,r] of saved){
  counts.requests++;
  if(r.request_type==="enquiry")counts.enquiries++;
  else counts.bookingRequests++;
  const chat=messagesByRequest.get(id);
  if(chat?.owner)counts.savedOwnerReplies++;
  if(chat?.customer)counts.savedCustomerReplies++;
  if(!chat?.owner&&["received","reviewing"].includes(r.status))
   counts.requestsWithoutStoredOwnerReply++;
  const ledger=bookings.get(id);
  if(r.request_type==="booking_request"){
   if(ledger==="cancelled")counts.cancelledWorkBookings++;
   if(r.status==="accepted"){
    if(ledger==="confirmed"&&linkStates.get(id)==="booking_confirmed")
     counts.acceptedBookingsWithWork++;
    else counts.acceptedWithoutConfirmedWork++;
   }
   if(["closed","declined"].includes(r.status)&&ledger==="confirmed")
    counts.closedButWorkActive++;
  }
 }
 const priorities=[];
 if(counts.closedButWorkActive)priorities.push({
  id:"closed_booking_active",priority:"critical",
  why:"A closed request still has an active BUSY Work appointment.",
  next:"Review and reconcile the customer booking before promising a date."});
 if(counts.acceptedWithoutConfirmedWork)priorities.push({
  id:"accepted_missing_work",priority:"high",
  why:"Some accepted requests lack a matching confirmed BUSY Work ledger entry.",
  next:"Check the saved booking record before telling the customer it is confirmed."});
 if(counts.requestsWithoutStoredOwnerReply)priorities.push({
  id:"reply_not_observed",priority:"review",
  why:"Some recent requests have no saved business reply in the sampled messages.",
  next:"Review the conversation and reply only when necessary."});
 const partial=requestsTruncated||messagesTruncated||workTruncated||
    requests.length>=30||messages.length>=150||work.length>=200;
 return {ok:true,kind:"customer_outcome_proof_ladder_v3187",
  counts,priorities:priorities.slice(0,3),coveragePartial:!!partial,
  supportsIndividuallyAttributedOutcomeClaims:false,
  observationLevel:"tenant_scoped_stored_database_records",
  evidence:{
   requestSubmitted:"stored_request_row",
   ownerResponse:"stored_conversation_row_not_delivery",
   bookingConfirmed:"accepted_request_plus_link_plus_confirmed_work_ledger",
   cancellation:"cancelled_work_ledger",
   notificationDisplayed:"unverified",customerReadReply:"unverified",
   servicePerformed:"unverified",paymentReceived:"unverified"
  },
  actualCustomerSatisfactionMeasured:false,
  overallTaskCompletionRate:null,modelAutomaticallyRetrained:false,
  noAutomaticCustomerContact:true,noCrossTenantSharing:true,
  customerDetailsReturned:false};
}
export {reviewCustomerOutcomeProof};
