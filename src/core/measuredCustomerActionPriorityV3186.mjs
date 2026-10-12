/**
 * V3.186 — prioritise owner action using independently stored journey
 * checkpoints, Work ledger, and gateway ticket evidence.
 *
 * Only compare quantities WITHIN their own sample. The three sampled query
 * windows differ, so do not invent a "conversion rate" by dividing across
 * them. This does not mean Busy trained itself or proved a customer's intent.
 */
function recommendMeasuredOwnerActions({
 journey=null,work=null,gateway=null,notification=null
}={}){
 const valid=x=>x?.ok===true&&x.counts&&typeof x.counts==="object"&&
  Object.values(x.counts).every(v=>Number.isSafeInteger(v)&&v>=0);
 if(!valid(journey)||!valid(work))
  return {ok:false,reason:"Booking and request evidence is incomplete; no recommendation may be asserted."};
 // Delivery evidence can be temporarily offline without blocking an owner
 // from seeing an independently proven booking conflict or waiting customer.
 const hasGateway=valid(gateway),hasNotification=valid(notification);
 const checks=[
  {
   id:"work_booking_conflict",severity:"critical",
   count:Math.max(journey.counts.closedRequestsWithActiveWork||0,
      work.counts.cancelledButStillActive||0),
   recommendation:"Check closed requests still marked as active bookings.",
   why:"Two saved booking states disagree. Do not assume the customer is booked or cancelled."
  },
  {
   id:"accepted_request_missing_work",severity:"high",
   count:Math.max(journey.counts.acceptedBookingsMissingWork||0,
      work.counts.acceptedMissingWork||0),
   recommendation:"Review accepted booking requests without a durable Work entry.",
   why:"An accepted request alone is not sufficient evidence of a usable calendar booking."
  },
  {
   id:"owner_replies_waiting",severity:"medium",
   count:journey.counts.requestsAwaitingOwnerReply||0,
   recommendation:"Reply to the customers waiting in the owner inbox.",
   why:"BUSY has stored their requests but has no saved owner reply for these recent rows."
  },
  {
   id:"unconfirmed_push_submission",severity:"medium",
   count:hasGateway&&hasNotification?
     (gateway.counts.gatewayRejectedMessages||0)+
       (notification.counts.pendingOver60Minutes||0):0,
   recommendation:"Review the saved conversations with rejected or pending push submissions.",
   why:"The reply may exist in BUSY even when a phone notification did not leave the system."
  }
 ].filter(x=>x.count>0);
 const rank={critical:0,high:1,medium:2,low:3};
 checks.sort((a,b)=>rank[a.severity]-rank[b.severity]||b.count-a.count);
 const partial=!!(journey.coveragePartial||work.evidencePartial||
   !hasGateway||!hasNotification||
   gateway.coveragePartial||notification.coveragePartial);
 return {
  ok:true,kind:"measured_customer_action_priority_v3186",
  nextActions:checks.slice(0,4),
  highestPriority:checks[0]||{
   id:"review_external_delivery",severity:"low",count:0,
   recommendation:"Review external delivery and actual customer outcomes separately.",
   why:"Saved system states are not evidence a customer's request was fully completed."
  },
  source:"business_scoped_stored_journey_and_gateway_snapshot",
  samplesMayHaveDifferentWindows:true,
  gatewayEvidenceUnavailable:!hasGateway,
  notificationEvidenceUnavailable:!hasNotification,
  coveragePartial:partial,zeroIssuesDoesNotGuaranteeSuccess:true,
  customerOutcomeConversionRate:null,
  saleRevenueMeasured:false,customerReadReceiptsMeasured:false,
  externalDiaryDeliveryMeasured:false,
  independentDeviceDeliveryMeasured:false,
  ownerApprovalNeededBeforeChanges:true,
  noAutomaticCustomerContact:true,
  noCrossBusinessLearning:true
 };
}
export {recommendMeasuredOwnerActions};
