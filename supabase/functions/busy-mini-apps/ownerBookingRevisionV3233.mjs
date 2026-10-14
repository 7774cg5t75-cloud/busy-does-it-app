/**
 * V3.233. One READ-ONLY, owner/admin-scoped booking revision from the
 * original Business App request + link + durable BUSY Work ledger.
 * Caller must already authenticate, resolve membership and fetch all rows
 * filtered by the SAME business/app/request. No owner contact data.
 */
const UUID=/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const deny=reason=>({ok:false,reason,mayClose:false,readOnly:true,
 calendarDelivered:false,customerNotified:false,mayRetryAutomatically:false});
function classifyBookingRevisionV3233({
 businessId="",appId="",requestId="",request=null,link=null,work=null
}={}){
 if(!UUID.test(businessId)||!UUID.test(appId)||!UUID.test(requestId)||
    !request||request.id!==requestId||request.business_id!==businessId||
    request.mini_app_id!==appId||request.request_type!=="booking_request"||
    !["reviewing","accepted","closed"].includes(request.status)||
    typeof request.updated_at!=="string"||
    !Number.isFinite(Date.parse(request.updated_at))||
    !link||link.business_id!==businessId||link.request_id!==requestId)
  return deny("Open the current booking in this business before changing it.");
 if(work&&(work.request_id!==requestId||work.business_id!==businessId||
   !["confirmed","cancelled"].includes(work.state)))
  return deny("BUSY cannot match the original Work booking to this request.");
 const draft=request.status==="reviewing"&&
    link.bridge_state==="booking_draft"&&!work;
 const confirmed=request.status==="accepted"&&
    link.bridge_state==="booking_confirmed"&&work?.state==="confirmed";
 const closed=request.status==="closed"&&link.bridge_state==="closed"&&
    (!work||work.state==="cancelled");
 if(!draft&&!confirmed&&!closed)
  return deny("Booking records disagree. Review the request and Work calendar.");
 return {ok:true,kind:"owner_booking_revision_v3233",
  businessId,appId,requestId,status:request.status,
  updatedAt:request.updated_at,bridgeState:link.bridge_state,
  workLedgerState:work?.state||"not_applicable",
  mayClose:draft||confirmed,alreadyClosed:closed,
  ownerApprovalRequired:true,readOnly:true,
  calendarDelivered:false,customerNotified:false,
  mayRetryAutomatically:false,customerDetailsIncluded:false};
}
export {classifyBookingRevisionV3233};
