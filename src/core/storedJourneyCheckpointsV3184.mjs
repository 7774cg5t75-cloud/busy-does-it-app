/**
 * V3.184 business-scoped stored customer journey checkpoint evaluation.
 * A saved message is not a push receipt; a confirmed Work row is not a
 * completed appointment, independent diary or payment. Never infer either.
 */
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function summarizeJourneyCheckpoints({
 businessId="",appId="",requests=[],links=[],work=[],messages=[],
 messagesTruncated=false
}={}){
 if(!UUID.test(businessId)||!UUID.test(appId)||
    !Array.isArray(requests)||requests.length>2000||
    !Array.isArray(links)||links.length>2000||
    !Array.isArray(work)||work.length>200||
    !Array.isArray(messages)||messages.length>150)
  return {ok:false,reason:"Current bounded private Business App evidence required."};
 const scope=x=>x?.business_id===businessId&&x?.mini_app_id===appId;
 if(work.some(x=>!scope(x))||messages.some(x=>!scope(x)))
  return {ok:false,reason:"A customer journey record belongs to a different business."};
 const chosen=new Map(requests.filter(r=>scope(r)&&UUID.test(r?.id||"")&&
   ["enquiry","booking_request"].includes(r.request_type)).map(r=>[r.id,r]));
 const linked=new Map(links.filter(l=>l?.business_id===businessId&&
    chosen.has(l?.request_id)).map(l=>[l.request_id,l]));
 const booked=new Map(work.filter(l=>chosen.has(l?.request_id))
   .map(l=>[l.request_id,l]));
 const touched=new Map();
 for(const row of messages){
  if(!chosen.has(row.request_id)||!["business","customer"].includes(row.sender_role))continue;
  const entry=touched.get(row.request_id)||{business:0,customer:0};
  entry[row.sender_role]++;touched.set(row.request_id,entry);
 }
 const counts={savedRequests:chosen.size,ownerRepliesSaved:0,
   customerRepliesSaved:0,requestsAwaitingOwnerReply:0,
   guestRequestsRequiringExternalContact:0,ownerConfirmedAndWorkSaved:0,
   acceptedBookingsMissingWork:0,closedRequestsWithActiveWork:0};
 for(const [id,r] of chosen){
  const msg=touched.get(id);
  if(msg?.business)counts.ownerRepliesSaved++;
  if(msg?.customer)counts.customerRepliesSaved++;
  if(["received","reviewing"].includes(r.status)&&!msg?.business)
   counts.requestsAwaitingOwnerReply++;
  if(r.request_origin==="guest_web"&&["received","reviewing"].includes(r.status))
   counts.guestRequestsRequiringExternalContact++;
  if(r.request_type==="booking_request"){
   const ledger=booked.get(id);
   if(r.status==="accepted"&&ledger?.state==="confirmed"&&
     linked.get(id)?.bridge_state==="booking_confirmed")
    counts.ownerConfirmedAndWorkSaved++;
   if(r.status==="accepted"&&ledger?.state!=="confirmed")
    counts.acceptedBookingsMissingWork++;
   if(["closed","declined"].includes(r.status)&&ledger?.state==="confirmed")
    counts.closedRequestsWithActiveWork++;
  }
 }
 const next=counts.closedRequestsWithActiveWork?
  "Review bookings that remain active after closure.":
  counts.acceptedBookingsMissingWork?
  "Review accepted bookings missing a saved Work entry.":
  counts.requestsAwaitingOwnerReply?
  "Reply to customer requests still awaiting an owner response.":
  "Check delivery receipts before describing requests as completed.";
 return {ok:true,kind:"stored_customer_journey_checkpoints_v3184",counts,
  nextOwnerReview:next,coveragePartial:messagesTruncated===true||
   requests.length>=30||work.length>=200||messages.length>=150,
  source:"authenticated_business_database_snapshot",
  messagesStoredNotPushDelivered:true,
  recordedOwnerApprovalNotCustomerAcceptance:true,
  completedJobsMeasured:false,actualRevenueMeasured:false,
  realEndToEndStagingTested:false,providerReceiptsVerified:false,
  customerContentReturned:false,automaticCustomerContact:false,
  tenantIsolationRequiresRealJWTVerification:true};
}
export {summarizeJourneyCheckpoints};
