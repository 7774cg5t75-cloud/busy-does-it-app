/**
 * V3.204: read-only CUSTOMER receipt validation. No payload, email,
 * message body, phone or identity is returned to the native app.
 * The server must independently scope by signed-in user, app and key.
 */
const KEY=/^[A-Za-z0-9:_-]{8,180}$/;
const UUID=/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const TYPES=new Set(["enquiry","booking_request"]);
const STATES=new Set(["received","reviewing","accepted","declined","closed"]);
function validRequestReceiptKey(key){
 return typeof key==="string"&&KEY.test(key);
}
function prepareCustomerReceipt({
 userId="",appId="",slug="",requestType="",requestKey="",
 row=/** @type {{id:string,business_id:string,mini_app_id:string,consumer_user_id:string|null,idempotency_key:string,request_type:string,status:string,request_origin:string}|null} */ (null)
}={}){
 const bad={ok:false,found:false,verifiedSaved:false,
  independentNotificationReceipt:false,confirmedDiaryBooking:false};
 if(!UUID.test(userId)||!UUID.test(appId)||
  !validRequestReceiptKey(requestKey)||!TYPES.has(requestType)||
  typeof slug!=="string"||!slug||slug.length>100)
  return {...bad,reason:"An authenticated customer and exact request context are required."};
 if(!row)return {ok:true,found:false,verifiedSaved:false,
  requestKind:requestType,independentNotificationReceipt:false,
  confirmedDiaryBooking:false};
 if(!UUID.test(row.id)||row.mini_app_id!==appId||
  row.consumer_user_id!==userId||
  row.idempotency_key!==requestKey||
  row.request_type!==requestType||
  !STATES.has(row.status))
  return {...bad,reason:"The stored request cannot be matched to this customer and action."};
 return {ok:true,found:true,verifiedSaved:true,
  receipt:{id:row.id,appId,requestType,status:row.status,
   saved:true,notificationDelivered:false,diaryConfirmed:false},
  independentNotificationReceipt:false,confirmedDiaryBooking:false,
  ownerReplyVerified:false};
}
export {validRequestReceiptKey,prepareCustomerReceipt};
