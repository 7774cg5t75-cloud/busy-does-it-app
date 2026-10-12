/**
 * V3.186: reconcile saved Business App message intent with the Expo gateway
 * *submission ticket* already stored in busy_push_deliveries.
 *
 * A ticket with status 'ok' means Expo accepted the submission for routing.
 * It does NOT mean Apple/Google delivered it, or the user saw it.
 * No network, no automatic resend, no user IDs/tokens/text returned.
 */
const ID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function reviewPushGatewayReceipts({
 businessId="",appId="",outboxRows=[],deliveryRows=[],
 outboxTruncated=false,deliveryTruncated=false
}={}){
 if(!ID.test(businessId)||!ID.test(appId)||!Array.isArray(outboxRows)||
    outboxRows.length>100||!Array.isArray(deliveryRows)||deliveryRows.length>400||
    outboxRows.some(x=>x?.business_id!==businessId||
      x?.mini_app_id!==appId||!ID.test(x?.id||"")||
      !ID.test(x?.request_id||"")||!ID.test(x?.message_id||""))||
    deliveryRows.some(x=>x?.business_id!==businessId||
      typeof x.notification_key!=="string"))
  return {ok:false,reason:"Owner's scoped push gateway evidence was not available."};
 const slots=new Map();
 for(const row of outboxRows){
  if(slots.has(row.message_id))
   return {ok:false,reason:"Duplicate message notification evidence needs review."};
  slots.set(row.message_id,{key:`miniapp:${row.request_id}:message:${row.message_id}`,
    intent:row,tickets:[],matches:0});
 }
 const keys=new Map([...slots.values()].map(x=>[x.key,x]));
 let ignored=0;
 for(const row of deliveryRows){
  const slot=keys.get(row.notification_key);
  if(!slot){ignored++;continue;}
  slot.matches++;
  const tickets=Array.isArray(row.provider_receipts)?row.provider_receipts:[];
  for(const ticket of tickets.slice(0,8)){
   const status=ticket?.status;
   slot.tickets.push(status==="ok"?"accepted":
     status==="error"?"rejected":"unknown");
  }
 }
 const counts={
  messagesReviewed:slots.size,
  awaitingAttempt:0,noSubmissionRecorded:0,
  submittedNoSavedGatewayTicket:0,
  gatewayAcceptedMessages:0,gatewayRejectedMessages:0,
  mixedOrUnknownGatewayTickets:0,
  noGatewayDeliveryEvidence:0
 };
 for(const slot of slots.values()){
  const row=slot.intent;
  if(row.state==="pending")counts.awaitingAttempt++;
  if(row.state==="no_submission_evidence")counts.noSubmissionRecorded++;
  if(row.state!=="submitted_unverified"){
   counts.noGatewayDeliveryEvidence++;
   continue;
  }
  if(!slot.matches||!slot.tickets.length){
   counts.submittedNoSavedGatewayTicket++;
   counts.noGatewayDeliveryEvidence++;
  }else if(slot.tickets.every(t=>t==="accepted")){
   counts.gatewayAcceptedMessages++;
  }else if(slot.tickets.every(t=>t==="rejected")){
   counts.gatewayRejectedMessages++;
  }else counts.mixedOrUnknownGatewayTickets++;
 }
 const next=counts.awaitingAttempt?
  "Review messages awaiting a push submission attempt. Do not resend automatically.":
  counts.gatewayRejectedMessages?
  "Review rejected push submissions; the replies are still saved in BUSY.":
  counts.submittedNoSavedGatewayTicket?
  "Check submissions with no saved Expo gateway ticket.":
  "Only gateway submission is measurable here. Confirm customer receipt separately.";
 return {
  ok:true,kind:"saved_expo_gateway_submission_evidence_v3186",
  counts,unexpectedOrOldDeliveryRowsIgnored:ignored,
  coveragePartial:outboxTruncated===true||deliveryTruncated===true||
    outboxRows.length>=100||deliveryRows.length>=400,
  nextOwnerReview:next,
  source:"authenticated_business_scoped_saved_push_gateway_tickets",
  providerSubmissionMeasured:true,
  independentlyVerifiedDeviceDelivery:false,
  customerNotificationRead:false,
  automaticRetryEnabled:false,
  customerIdentitiesReturned:false,
  rawTicketsReturned:false,
  paymentOrBookingOutcomeMeasured:false
 };
}
export {reviewPushGatewayReceipts};
