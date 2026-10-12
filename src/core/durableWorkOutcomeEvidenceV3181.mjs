/**
 * Evidence of stored Business App booking outcomes — only matching rows in
 * the current authenticated owner snapshot. Never proof of external calendar
 * delivery, performed work, conversion or income. Owner review, not auto-repair.
 */
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function assessDurableWorkOutcomes({
 businessId="",appId="",requests=[],ledger=null
}={}){
 if(!UUID.test(businessId)||!UUID.test(appId)||
    !Array.isArray(requests)||requests.length>2000||
    !ledger||!Array.isArray(ledger.rows)||ledger.rows.length>200||
    ledger.rows.some(x=>x?.business_id!==businessId||
      x?.mini_app_id!==appId||!UUID.test(x?.request_id||"")))
  return {ok:false,reason:"Only a current authenticated owner booking snapshot may be reviewed."};
 const recent=new Map(requests.filter(x=>x?.business_id===businessId&&
    x?.mini_app_id===appId&&UUID.test(x?.id||"")&&
    x?.request_type==="booking_request").map(x=>[x.id,x]));
 const work=new Map(ledger.rows.filter(x=>recent.has(x.request_id))
    .map(x=>[x.request_id,x]));
 const counts={recentBookingRequests:recent.size,
   acceptedRecentBookings:0,savedConfirmedWork:0,savedCancelledWork:0,
   acceptedMissingWork:0,cancelledButStillActive:0};
 for(const [id,request] of recent){
  const row=work.get(id);
  if(request.status==="accepted"){
   counts.acceptedRecentBookings++;
   if(!row||row.state!=="confirmed")counts.acceptedMissingWork++;
  }
  if(row?.state==="confirmed"){
   counts.savedConfirmedWork++;
   if(request.status==="closed"||request.status==="declined")
     counts.cancelledButStillActive++;
  }
  if(row?.state==="cancelled")counts.savedCancelledWork++;
 }
 const action=counts.cancelledButStillActive?
  "Review server bookings that remain active after a closed request.":
  counts.acceptedMissingWork?
  "Review accepted requests without a matching saved Work booking.":
  "Stored request and Work statuses agree for the checked recent rows.";
 return {ok:true,kind:"durable_work_outcome_evidence_v3181",counts,
  nextOwnerReview:action,
  source:"authenticated_owner_recent_requests_and_durable_work_rows",
  evidencePartial:ledger.truncated===true||requests.length>=30,
  dataLimitedToCurrentBusiness:true,
  requestIDsReturned:false,customerNamesReturned:false,
  realDiaryProviderDeliveryMeasured:false,
  completedJobsMeasured:false,realSalesMeasured:false,
  automaticReconciliationEnabled:false,
  noCrossTenantLearning:true};
}
export {assessDurableWorkOutcomes};
