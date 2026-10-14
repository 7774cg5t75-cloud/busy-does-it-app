/**
 * V3.225: privacy-minimal Business App owner queue summary.
 * The authorised Edge handler must query the actual business/app from
 * Supabase; caller-supplied counts and role flags are not trusted there.
 * Pure classifier does not authenticate records or independently query DB.
 */
const UUID=/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const STATUSES=new Set(["received","reviewing","accepted","declined","closed"]);
const fail=reason=>({ok:false,reason,readOnly:true,
  independentlyVerifiedByThisFunction:false,ownerMessageSent:false,
  bookingConfirmed:false,providerDelivered:false});
function classifyOwnerRequestQueueV3225({
 businessId="",appId="",received=null,reviewing=null,latest=null
}={}){
 if(!UUID.test(businessId)||!UUID.test(appId)||
  !Number.isSafeInteger(received)||received<0||received>100000000||
  !Number.isSafeInteger(reviewing)||reviewing<0||reviewing>100000000)
  return fail("Exact scoped business/app and server-read queue counts are required.");
 const total=received+reviewing;
 if(!Number.isSafeInteger(total))return fail("Queue count is out of range.");
 if(latest!==null&&(!latest||typeof latest!=="object"||
   !UUID.test(latest.id)||latest.business_id!==businessId||
   latest.mini_app_id!==appId||!STATUSES.has(latest.status)||
   !["enquiry","booking_request"].includes(latest.request_type)))
  return fail("The latest request must be scoped to the same business and app.");
 if(total>0&&latest===null)return fail("Cannot explain an active queue without a scoped request readback.");
 const next=received>0?"review_new_requests":
  reviewing>0?"continue_reviewing_requests":"no_pending_requests";
 return {ok:true,kind:"owner_request_queue_v3225",
  businessId,appId,received,reviewing,pendingTotal:total,
  nextAction:next,
  title:received>0?"Review new customer requests":
   reviewing>0?"Continue reviewing customer requests":"You're up to date with new requests",
  explanation:received>0?
   "BUSY found new requests in your Business App inbox. Review them before confirming appointments or replying.":
   reviewing>0?"Some requests are being reviewed. Check their details before taking further action.":
   "The current Business App inbox has no requests marked received or reviewing.",
  latestRequestId:latest?.id||null,
  countsSourcedByCaller:true,independentlyVerifiedByThisFunction:false,
  // The authenticated Edge action, not this pure module, verifies role
  // and obtains real exact-count query results from Supabase.
  ownerApprovalRequiredForReply:true,
  customerDetailsIncluded:false,requestPayloadIncluded:false,
  customerContactIncluded:false,readOnly:true,
  automaticallyReplied:false,bookingConfirmed:false,
  providerDelivered:false,ownerMessageSent:false};
}
export {classifyOwnerRequestQueueV3225};
