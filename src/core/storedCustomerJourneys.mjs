/**
 * V3.179 — compact owner evidence from actual request/link rows, never from
 * visitor counts, page previews, fabricated conversions or feedback text.
 * Source must be the authenticated owner service; this client adapter itself
 * cannot certify external delivery or independently confirm a diary slot.
 */
const UUID=/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i;
function summarizeStoredCustomerJourneys({app=null,requests=[],links=[]}={}){
 if(!UUID.test(app?.id||"")||!UUID.test(app?.business_id||"")||
    !Array.isArray(requests)||!Array.isArray(links)||
    requests.length>2000||links.length>2000)
  return {ok:false,reason:"Use a bounded authenticated business request snapshot."};
 const rows=requests.filter(r=>r?.mini_app_id===app.id&&
   r?.business_id===app.business_id&&UUID.test(r?.id||""));
 const requestById=new Map(rows.map(r=>[r.id,r]));
 const linkById=new Map(links.filter(x=>requestById.has(x?.request_id)&&
   x?.business_id===app.business_id).map(x=>[x.request_id,x]));
 const stats={bookingRequests:0,enquiries:0,pending:0,declined:0,
  acceptedEnquiries:0,ownerMarkedConfirmedBookings:0,
  unlinkedRequests:0,inconsistentConfirmedStates:0};
 for(const req of rows){
  const link=linkById.get(req.id);
  if(req.request_type==="booking_request")stats.bookingRequests++;
  else if(req.request_type==="enquiry")stats.enquiries++;
  else continue;
  if(["received","reviewing"].includes(req.status))stats.pending++;
  if(req.status==="declined")stats.declined++;
  if(req.request_type==="enquiry"&&req.status==="accepted")
   stats.acceptedEnquiries++;
  if(!link)stats.unlinkedRequests++;
  if(req.request_type==="booking_request"&&req.status==="accepted"&&
    link?.bridge_state==="booking_confirmed")
   stats.ownerMarkedConfirmedBookings++;
  if(req.request_type==="booking_request"&&
    (req.status==="accepted")!==(link?.bridge_state==="booking_confirmed"))
   stats.inconsistentConfirmedStates++;
 }
 return {ok:true,kind:"stored_customer_journeys_v3179",
  ...stats,scopedRequestCount:stats.bookingRequests+stats.enquiries,
  evidenceLevel:"authenticated_owner_row_snapshot_not_independent_delivery",
  realCustomerDeliveryVerified:false,customerReplyDeliveryVerified:false,
  diaryBookingIndependentlyVerified:false,
  conversionOrRevenueMeasured:false,containsCustomerDetails:false,
  requiresLiveStagingAndProviderChecks:true};
}
export {summarizeStoredCustomerJourneys};
