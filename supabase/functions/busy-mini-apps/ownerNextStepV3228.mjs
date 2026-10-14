/**
 * V3.228: ONE conservative next step based only on existing same-business
 * owner/admin server readbacks. Does not authenticate or modify records.
 */
function chooseOwnerRequestNextStepV3228({queue=null,alerts=null}={}){
 const deny=reason=>({ok:false,reason,readOnly:true,maySend:false,
  mayConfirmBooking:false,deviceDelivered:false});
 const uuid=/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
 if(!queue||queue.ok!==true||!alerts||alerts.ok!==true||
  !uuid.test(queue.businessId)||!uuid.test(queue.appId)||
  queue.businessId!==alerts.businessId||queue.appId!==alerts.appId)
  return deny("Authenticated same-business request and alert scope required.");
 if(![queue.received,queue.reviewing,queue.pendingTotal,
   alerts.manualReview,alerts.needsProviderReview].every(n=>
   Number.isSafeInteger(n)&&n>=0&&n<=100000000)||
   queue.pendingTotal!==queue.received+queue.reviewing||
   alerts.manualReview>alerts.needsProviderReview)
  return deny("The request and alert state counts conflict.");
 if(queue.received>0&&!uuid.test(queue.latestRequestId))
  return deny("The latest request needs its original receipt.");
 const action=queue.received>0?"review_new_enquiry":
  alerts.manualReview>0?"check_uncertain_alerts":
  queue.reviewing>0?"continue_reviewing":
  alerts.needsProviderReview>0?"check_pending_alerts":"up_to_date";
 const copy={
  review_new_enquiry:["Review your new enquiry",
   "A customer request is waiting. Read its details before replying or confirming a booking."],
  check_uncertain_alerts:["Check uncertain customer alerts",
   "Some alerts may have reached a device. Open the original requests; BUSY will not automatically resend uncertain alerts."],
  continue_reviewing:["Continue reviewing enquiries",
   "An enquiry is still under review. Check its details before taking action."],
  check_pending_alerts:["Check pending customer alerts",
   "Some alerts are awaiting provider confirmation; saved requests remain in your inbox."],
  up_to_date:["No immediate enquiry action",
   "No enquiries are marked new or under review. Earlier phone notifications are not proven delivered."]
 };
 return {ok:true,kind:"owner_request_next_step_v3228",businessId:queue.businessId,
  appId:queue.appId,action,title:copy[action][0],
  explanation:copy[action][1],
  latestRequestId:queue.received>0?queue.latestRequestId:null,
  evidenceFromAuthenticatedEndpoint:true,readOnly:true,
  ownerApprovalRequired:true,maySend:false,mayPublish:false,
  mayConfirmBooking:false,deviceDelivered:false,
  customerContactIncluded:false,automaticallyReplied:false};
}
export {chooseOwnerRequestNextStepV3228};
