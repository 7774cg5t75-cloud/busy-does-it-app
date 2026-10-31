/**
 * V3.205: classify an authenticated OWNER lookup for one saved customer
 * request. A 30-row inbox page is never used as negative existence proof.
 * No recipient details, contact info or payload leaves this summary.
 */
const ID=/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i;
const TYPES=new Set(["enquiry","booking_request"]);
const STATES=new Set(["received","reviewing","accepted","declined","closed"]);
function classifyOwnerInboxReceipt({
 businessId="",appId="",requestId="",membershipRole="",row=/** @type {{id:string,business_id:string,mini_app_id:string,request_type:string,status:string,updated_at?:string,created_at?:string,request_origin?:string,consumer_user_id?:string|null}|null} */ (null)
}={}){
 const denied={ok:/** @type {const} */ (false),reason:"Owner-scoped app request identity must be verified.",
  reachedCorrectBusinessVerified:false,notificationDeliveredVerified:false};
 if(!ID.test(businessId)||!ID.test(appId)||!ID.test(requestId)||
   !["owner","admin"].includes(membershipRole))return denied;
 if(!row)return {ok:/** @type {const} */ (true),found:false,
  reachedCorrectBusinessVerified:false,ownerActionVerified:false,
  notificationDeliveredVerified:false,
  cannotInferMissingFromThirtyRowPage:true,readOnly:true};
 if(row.id!==requestId||row.business_id!==businessId||
    row.mini_app_id!==appId||!TYPES.has(row.request_type)||
    !STATES.has(row.status))
  return denied;
 return {ok:/** @type {const} */ (true),found:true,requestId,requestType:row.request_type,
  requestStatus:row.status,reachedCorrectBusinessVerified:true,
  ownerReadbackVerified:true,notificationDeliveredVerified:false,
  ownerActuallyNotified:false,customerReplyVerified:false,
  appointmentConfirmed:false,ownerActionVerified:false,
  customerContactDataIncluded:false,readOnly:true};
}
export {classifyOwnerInboxReceipt};
