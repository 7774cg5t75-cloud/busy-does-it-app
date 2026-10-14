/**
 * V3.233. One lightweight presentation policy for BOTH Business App
 * request list and detail. Does not grant permission to update anything;
 * current server role/revision/Work approval must always be rechecked.
 */
function ownerRequestActionsV3233({request=null,link=null}={}){
 const base={canReview:false,canDecline:false,
  showDraftBooking:false,showConfirmedBooking:false,
  needsOriginalRequestRefresh:true};
 if(!request||typeof request!=="object"||
  !["received","reviewing","accepted","declined","closed"].includes(request.status)||
  !["enquiry","booking_request"].includes(request.request_type))
  return base;
 const linked=!!link;
 const state=link?.bridge_state||"";
 if(linked&&!["linked","enquiry_linked","booking_draft","booking_confirmed","closed"].includes(state))
  return base;
 return {canReview:!linked&&request.status==="received",
  canDecline:!linked&&["received","reviewing"].includes(request.status),
  showDraftBooking:linked&&state==="booking_draft",
  showConfirmedBooking:linked&&state==="booking_confirmed",
  needsOriginalRequestRefresh:false,
  approvalRequiredForConsequentialAction:true,
  externalCalendarDelivered:false,customerNotified:false};
}
export {ownerRequestActionsV3233};
