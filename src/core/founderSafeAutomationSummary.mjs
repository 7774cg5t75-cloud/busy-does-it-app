import {websiteAutomationBoundary} from "./websiteAutomationBoundary.mjs";
/**
 * Founder-only explanations; checks never perform notifications/repairs.
 * Missing or old snapshots block trustworthy automation suggestions.
 */
function founderSafeAutomationSummary({priorities=null}={}){
 const fresh=priorities?.status==="available"&&
   priorities.freshness==="recent"&&
   Number.isSafeInteger(priorities.highPriorityCount);
 const unsafe=websiteAutomationBoundary({
  action:"website_publish",attempt:1,tenantAuthorized:true,httpStatus:503});
 const read=websiteAutomationBoundary({
  action:"founder_aggregate_read",attempt:1,tenantAuthorized:true,httpStatus:503});
 return {status:fresh?"review-only":"refresh-required",
  headline:fresh?"BUSY can help check statuses, not change customer services":
    "Refresh the founder report before relying on these results",
  next:fresh?"Read-only status checks may retry once after a transient error. Publishing, payments and domain changes still need independent authorisation.":
    "Use Refresh platform snapshot; old or missing counts do not prove services are healthy.",
  statusReadRetryLimit:read.maxTotalReadAttempts,
  autoRepairEnabled:unsafe.canRepairWebsite,
  autoPublishingEnabled:unsafe.canPublish,
  automaticBillingEnabled:unsafe.canCharge,
  externalAlertsSent:false,founderApprovalGranted:false,
  countedIncidents:fresh?priorities.highPriorityCount:null};
}
export {founderSafeAutomationSummary};
