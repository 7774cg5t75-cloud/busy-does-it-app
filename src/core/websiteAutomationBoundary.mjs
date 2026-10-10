/**
 * V3.122: explicit read-only automation vs write-action guardrail. This
 * function is advisory only and NEVER invokes an external service.
 * An account-level authenticated status API may be retried at most once
 * on a transient network/status error; website publishes, DNS, money,
 * rollback, posting, AI generation and user data writes NEVER auto retry.
 */
const READS=new Set(["website_health_read","provider_status_read",
  "founder_aggregate_read","business_activity_status_read"]);
const WRITES=new Set(["website_publish","website_rollback","domain_dns_edit",
  "domain_purchase","social_post","business_data_write","provider_plan_change",
  "paid_ai_generate","customer_notification","booking_create"]);
const TRANSIENT=new Set([408,502,503,504]);
function websiteAutomationBoundary({action="",attempt=0,httpStatus=null,
 tenantAuthorized=false,customerApproval=false,production=false,
 verifiedNetworkFailure=false}={}){
 const valid=typeof action==="string"&&
   Number.isSafeInteger(attempt)&&attempt>=0&&attempt<10;
 const kind=READS.has(action)?"read":WRITES.has(action)?"write":"unknown";
 const transient=TRANSIENT.has(Number(httpStatus))||
  (httpStatus===0&&verifiedNetworkFailure===true);
 const canAutoRetryStatusRead=valid&&kind==="read"&&
   tenantAuthorized===true&&attempt===1&&transient;
 const reason=kind==="write"?
   "This action changes customer or provider state. It requires a separate authorised workflow.":
   kind==="unknown"?"Unknown operation is not approved for automatic retry.":
   !tenantAuthorized?"Business or founder access was not verified.":
   canAutoRetryStatusRead?
   "One bounded, read-only status retry may be attempted after a transient failure.":
   "Read result is final or needs manual refresh; no repeated automatic polling.";
 return {kind,status:canAutoRetryStatusRead?"bounded-read-retry":"blocked",
   reason,mayAutoRetryRead:canAutoRetryStatusRead,maxTotalReadAttempts:2,
   actionExecuted:false,customerApprovalProvided:customerApproval===true,
   productionWriteAllowed:false,paidCallAllowed:false,
   canPublish:false,canChangeDns:false,canPost:false,
   canCharge:false,canRepairWebsite:false,
   noCrossBusinessLearning:true};
}
export {websiteAutomationBoundary};
