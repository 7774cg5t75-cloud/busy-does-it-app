/**
 * V3.233. One READ-ONLY, owner/admin-scoped booking revision from the
 * original Business App request + link + durable BUSY Work ledger.
 * Caller must already authenticate, resolve membership and fetch all rows
 * filtered by the SAME business/app/request. No owner contact data.
 */
const UUID=/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const deny=reason=>({ok:/** @type {const} */ (false),reason,mayClose:false,readOnly:true,
 calendarDelivered:false,customerNotified:false,mayRetryAutomatically:false});
function classifyBookingRevisionV3233({
 businessId="",appId="",requestId="",request=/** @type {{id:string,business_id:string,mini_app_id:string,request_type:string,status:string,updated_at?:string,created_at?:string,request_origin?:string,consumer_user_id?:string|null}|null} */ (null),link=/** @type {{request_id:string,business_id:string,bridge_state:string,customer_record_id?:string,action_record_id?:string,updated_at?:string}|null} */ (null),work=/** @type {{request_id:string,business_id:string,state:string,id?:string,mini_app_id?:string,customer_record_id?:string,action_record_id?:string,calendar_date?:string,calendar_time?:string,calendar_timezone?:string,source?:string,updated_at?:string}|null} */ (null)
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
 return {ok:/** @type {const} */ (true),kind:"owner_booking_revision_v3233",
  businessId,appId,requestId,status:request.status,
  updatedAt:request.updated_at,bridgeState:link.bridge_state,
  workLedgerState:work?.state||"not_applicable",
  mayClose:draft||confirmed,alreadyClosed:closed,
  ownerApprovalRequired:true,readOnly:true,
  calendarDelivered:false,customerNotified:false,
  mayRetryAutomatically:false,customerDetailsIncluded:false};
}
export {classifyBookingRevisionV3233};

// Internal persisted references only: no snapshot, names, messages or caller metadata.
export function classifyBookingAssociationV3233(input={}){
 const base=classifyBookingRevisionV3233(input),{link,work,appId}=input;
 const id=v=>typeof v==='string'&&/^[A-Za-z0-9][A-Za-z0-9:_-]{0,159}$/.test(v);
 const time=v=>typeof v==='string'&&Number.isFinite(Date.parse(v));
 if(!base.ok||!id(link?.customer_record_id)||!id(link?.action_record_id)||!time(link?.updated_at))return deny('The original customer association is unavailable.');
 let diary=null;
 if(work){
  const day=work.calendar_date,at=work.calendar_time,parsed=new Date(String(day)+'T12:00:00Z');
  if(!UUID.test(work.id||'')||work.mini_app_id!==appId||work.customer_record_id!==link.customer_record_id||work.action_record_id!==link.action_record_id||work.source!=='business_app_request_v3181'||!time(work.updated_at)||typeof day!=='string'||!/^20\d{2}-\d{2}-\d{2}$/.test(day)||!Number.isFinite(parsed.getTime())||parsed.toISOString().slice(0,10)!==day||typeof at!=='string'||!/^([01]\d|2[0-3]):[0-5]\d:00$/.test(at)||typeof work.calendar_timezone!=='string'||!/^[A-Za-z_]+(?:\/[A-Za-z0-9_+\-]+)*$/.test(work.calendar_timezone)||work.calendar_timezone.length>64)return deny('The original customer and Work diary records disagree.');
  diary={id:work.id,date:day,time:at.slice(0,5),timeZone:work.calendar_timezone,state:work.state,revision:work.updated_at};
 }
 return {...base,association:{kind:'persisted_booking_association_v3233',customerId:link.customer_record_id,actionId:link.action_record_id,linkRevision:link.updated_at,diary},notOwnReceipt:true};
}
