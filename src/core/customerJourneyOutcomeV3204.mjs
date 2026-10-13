/**
 * V3.204 Business Brain evidence boundary for a saved customer request.
 * A saved record and an authenticated request-key readback are strong local
 * evidence; neither proves a business response, an external notification,
 * an accepted booking or a conversion.
 *
 * No learning model is retrained, no cross-business history is pooled and
 * no private customer content is retained by this pure evaluator.
 */
const UUID=/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const STATUSES=["received","reviewing","accepted","declined","closed"];
const TYPES=["enquiry","booking_request"];
const denied=reason=>({ok:false,reason,canClaimSavedRequest:false,
 canClaimNotificationDelivery:false,canClaimConfirmedAppointment:false,
 canClaimCustomerConverted:false,automaticActionAllowed:false});
function evaluateCustomerRequestOutcome({
 businessAppId="",customerUserId="",requestType="",
 response=null,evidenceSource="submit_response"
}={}){
 if(!UUID.test(businessAppId)||!UUID.test(customerUserId)||
    !TYPES.includes(requestType)||
    !["submit_response","read_only_customer_receipt"].includes(evidenceSource))
  return denied("A current signed-in customer, app and supported request are required.");
 const r=evidenceSource==="read_only_customer_receipt"?response?.receipt:response?.request;
 const sourceValid=response?.ok===true&&
  (evidenceSource==="read_only_customer_receipt"?
    response?.found===true&&response?.verifiedSaved===true&&r?.saved===true:
    response?.reused===true||response?.savedRequestConfirmed===true);
 if(!sourceValid||!UUID.test(r?.id)||!STATUSES.includes(r?.status))
  return denied("BUSY has not verified this exact saved customer request.");
 if(evidenceSource==="submit_response"&&
    (r?.mini_app_id!==businessAppId||
     r?.consumer_user_id!==customerUserId||
     r?.request_type!==requestType))
  return denied("The saved request belongs to another account, app or action.");
 if(evidenceSource==="read_only_customer_receipt"&&
    (r?.appId!==businessAppId||r?.requestType!==requestType))
  return denied("The customer receipt is not for the expected business app or action.");
 const customerStage=r.status==="received"?"request_received":
    r.status==="reviewing"?"business_reviewing":
    r.status==="declined"?"declined":
    r.status==="closed"?"closed":"accepted_not_independent_booking_proof";
 return {ok:true,kind:"customer_request_outcome_v3204",
  requestId:r.id,requestType,businessAppId,stage:customerStage,
  evidenceLevel:evidenceSource==="read_only_customer_receipt"?
    "authenticated_customer_readback":"authenticated_submission_response",
  canClaimSavedRequest:true,canClaimNotificationDelivery:false,
  canClaimConfirmedAppointment:false,canClaimBusinessReply:false,
  canClaimCustomerConverted:false,canClaimSalesLift:false,
  canClaimIndependentProviderReceipt:false,
  scopedToCustomerAndApp:true,ownerStillControlsWorkflow:true,
  syntheticTestEvidence:false,automaticActionAllowed:false,
  crossTenantLearningAllowed:false,noCustomerContactPayloadRetained:true};
}
function customerRequestNotice(e){
 if(!e?.ok)return "BUSY could not yet confirm your request. Check My BUSY Apps.";
 const lookup=e.evidenceLevel==="authenticated_customer_readback"?
  "BUSY found your earlier saved request. ":"BUSY saved your request. ";
 return lookup+(e.requestType==="booking_request"?
  "It is NOT a confirmed appointment. The business must review it.":
  "The business can review your enquiry. A response has not been verified.");
}
export {evaluateCustomerRequestOutcome,customerRequestNotice};
