/**
 * V3.231: conservative freshness guard for existing owner request updates.
 * Pure decision, not standalone authentication or permission to edit Work.
 */
const UUID=/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const STATES=new Set(["received","reviewing","accepted","declined","closed"]);
function verifyOwnerRequestFreshnessV3231({
 businessId="",requestId="",stored=/** @type {{id:string,business_id:string,mini_app_id:string,request_type:string,status:string,updated_at?:string,created_at?:string,request_origin?:string,consumer_user_id?:string|null}|null} */ (null),
 expectedStatus="",expectedUpdatedAt=""
}={}){
 const fail=reason=>({ok:/** @type {const} */ (false),reason,mayWrite:false,
  customerNotified:false,bookingConfirmed:false});
 if(!UUID.test(businessId)||!UUID.test(requestId)||
  !stored||stored.id!==requestId||stored.business_id!==businessId||
  !UUID.test(stored.mini_app_id)||!STATES.has(stored.status))
  return fail("BUSY cannot match this action to its original business request.");
 if(!STATES.has(expectedStatus)||typeof expectedUpdatedAt!=="string"||
  expectedUpdatedAt.length<20||expectedUpdatedAt.length>45||
  !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{1,6})?(?:Z|[+-]\d\d:\d\d)$/.test(expectedUpdatedAt)||
  !Number.isFinite(Date.parse(expectedUpdatedAt)))
  return fail("Refresh the request before changing its status.");
 if(stored.status!==expectedStatus||stored.updated_at!==expectedUpdatedAt)
  return fail("This customer request changed since you opened it. Refresh before changing its status.");
 return {ok:/** @type {const} */ (true),kind:"owner_request_freshness_v3231",
  businessId,requestId,expectedStatus,expectedUpdatedAt,mayWrite:true,
  customerNotified:false,bookingConfirmed:false};
}
export {verifyOwnerRequestFreshnessV3231};
