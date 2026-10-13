/**
 * V3.201: classify three AUTHENTICATED, SCOPED staging readbacks supplied by
 * a future isolated request test runner. This is NOT a credential verifier.
 * Calling it with fabricated objects proves NOTHING about real endpoints.
 *
 * A saved request is not a sent reply or delivered notification.
 * An accepted booking status is never proof of a confirmed diary entry.
 */
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const bad=(reason)=>({ok:false,reason,realDeliveryProven:false,
 evidenceCanTriggerAutomaticMessages:false});
function assessStagingRequestReadbacks({
 businessId="",appId="",kind="",first=null,replay=null,
 ownerSnapshot=null,customerDetail=null
}={}){
 if(!UUID.test(businessId)||!UUID.test(appId)||
    !["enquiry","booking_request"].includes(kind))
  return bad("Only a single isolated, fully scoped enquiry or booking request can be assessed.");
 const a=first?.request,b=replay?.request,c=customerDetail?.detail?.request;
 if(first?.ok!==true||replay?.ok!==true||
    first.reused===true||replay.reused!==true||
    !a||!b||!c||!UUID.test(a.id)||b.id!==a.id||c.id!==a.id||
    [a,b,c].some(r=>r.business_id!==businessId||
      r.mini_app_id!==appId||r.request_type!==kind))
  return bad("Original, idempotent retry and customer readback do not match one staging request.");
 const owner=ownerSnapshot;
 if(owner?.ok!==true||owner.businessId!==businessId||
    owner.app?.id!==appId||owner.app?.business_id!==businessId||
    !["owner","admin"].includes(owner.role)||
    !Array.isArray(owner.requests)||owner.requests.length>30||
    !owner.requests.some(r=>r?.id===a.id&&r.business_id===businessId&&
      r.mini_app_id===appId&&r.request_type===kind))
  return bad("The authenticated owner inbox did not show that exact request.");
 if(customerDetail?.ok!==true)
  return bad("The authenticated customer has not read back the request.");
 const blockers=[
  "No independent notification delivery receipt was verified.",
  "No human reply or customer receipt was verified.",
  ...(kind==="booking_request"?
    ["No independently confirmed diary booking was verified."]:[])
 ];
 return {ok:true,kind:"isolated_staging_request_readback_v3201",
  businessId,appId,requestId:a.id,requestKind:kind,
  sameStoredRequestAcrossReadbacks:true,ownerInboxReadbackObserved:true,
  idempotentRetryObserved:true,customerReadbackObserved:true,
  sourceMustBeAuthenticatedRunner:true,serverIdentityIndependentlyVerified:false,
  verifiedExternalNotificationDelivery:false,
  verifiedOwnerReplyDelivery:false,confirmedDiaryBooking:false,
  endToEndCustomerOutcomeVerified:false,
  noContentOrPIIReturned:true,automaticFollowUpAllowed:false,
  blockers};
}
export {assessStagingRequestReadbacks};
