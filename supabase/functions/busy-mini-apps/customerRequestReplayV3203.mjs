/**
 * V3.203: accept idempotent CUSTOMER REQUEST replays only when the original
 * scoped request matches all submitted, server-sanitized customer fields.
 * Never creates records or contacts providers. A different request using
 * the same idempotency key must be rejected rather than silently reused.
 */
const SAFE_STR=v=>typeof v==="string"?v:"";
const FIELDS=Object.freeze({
 booking_request:["name","email","phone","service","preferredDate","note"],
 enquiry:["name","email","phone","service","message"]
});
function checkCustomerRequestReplay({
 existing=null,businessId="",appId="",consumerUserId="",
 requestType="",moduleKey="",payload=null
}={}){
 const no=reason=>({ok:false,reason,mayInsertAnotherRequest:false,
  reused:false,neverContactProvider:true});
 const keys=FIELDS[requestType];
 if(!keys||!existing||typeof existing!=="object"||
    typeof payload!=="object"||payload===null||Array.isArray(payload)||
    !businessId||!appId||!consumerUserId||
    existing.business_id!==businessId||
    existing.mini_app_id!==appId||
    existing.consumer_user_id!==consumerUserId||
    existing.request_type!==requestType||
    existing.module_key!==moduleKey)
   return no("The original customer request does not match this signed-in business and action.");
 const stored=existing.payload;
 if(!stored||typeof stored!=="object"||Array.isArray(stored)||
   Object.keys(stored).length!==keys.length||
   Object.keys(payload).length!==keys.length||
   keys.some(k=>!Object.prototype.hasOwnProperty.call(stored,k)||
    !Object.prototype.hasOwnProperty.call(payload,k)||
    SAFE_STR(stored[k])!==SAFE_STR(payload[k])))
   return no("These details differ from the previously saved request. Choose a new request rather than reusing its key.");
 return {ok:true,reused:true,existingRequestId:existing.id,
  serverScoped:true,matchingSanitizedPayload:true,
  notificationNotRetried:true,neverContactProvider:true};
}
export {FIELDS,checkCustomerRequestReplay};
