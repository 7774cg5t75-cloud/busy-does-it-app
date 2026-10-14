/**
 * V3.236 shared Builder next-step policy for the EXISTING universal
 * capability plan. One current business and original source revisions.
 * Planning cannot execute, configure, publish, spend or verify a live flow.
 */
const allowedStatuses=new Set(["present_in_private_draft",
 "supported_section_not_present","available_module_needs_owner_setup",
 "runtime_module_not_verified_available","requires_service_verification",
 "requires_new_implementation","unknown_not_verified"]);
const UUID=/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const actionByStatus={
 present_in_private_draft:{
  action:"check_customer_task",title:"Check whether customers can complete this task",
  reason:"The feature is present in a private draft, but no saved customer outcome has been verified.",
  next:"Test the original customer journey using approved isolated staging and genuine evidence."},
 supported_section_not_present:{
  action:"review_existing_section",title:"Review an existing website section",
  reason:"BUSY recognises a suitable website section, but it has not been placed in the private draft.",
  next:"Use the original website editor to preview and approve this section with accurate owner-provided content."},
 available_module_needs_owner_setup:{
  action:"configure_supported_module",title:"Finish setting up the existing Business App feature",
  reason:"The controlled App Builder has a supported module, but the current draft is not yet ready.",
  next:"Review the feature in the existing private app editor; keep its permissions and customer terms explicit."},
 runtime_module_not_verified_available:{
  action:"review_runtime_support",title:"Check what the app can currently support",
  reason:"The current business-scoped module catalogue cannot verify this feature.",
  next:"Review the module and its prerequisites before showing customers a working feature."},
 requires_service_verification:{
  action:"review_external_dependency",title:"Review the external service requirements",
  reason:"This needs separately verified provider permissions or capabilities.",
  next:"Explain required sign-ups and charges, then request explicit owner approval before any provider action."},
 requires_new_implementation:{
  action:"plan_missing_capability",title:"Plan the missing customer capability",
  reason:"This requirement needs additional controlled implementation, not just a change of colours or layout.",
  next:"Specify the expected customer result, data permissions, safe fallback and proof needed before offering it."},
 unknown_not_verified:{
  action:"review_capability_evidence",title:"Check the current feature evidence",
  reason:"The feature cannot be verified from this private draft and capability catalogue.",
  next:"Inspect supported editor controls and current source evidence without inventing functionality."}
};
const priority={
 available_module_needs_owner_setup:0,
 supported_section_not_present:1,
 present_in_private_draft:2,
 runtime_module_not_verified_available:3,
 requires_service_verification:4,
 requires_new_implementation:5,
 unknown_not_verified:6
};
function reviewUniversalBuilderNextStepV3236({
 plan=null,businessId="",website=null,app=null,surface="app"
}={}){
 const fail=reason=>({ok:false,reason,mayExecute:false,liveVerified:false});
 if(!UUID.test(businessId)||!["website","app"].includes(surface)||
  plan?.ok!==true||plan.kind!=="universal_builder_plan_v3210"||
  plan.businessId!==businessId||plan.planningOnly!==true||
  plan.noPublishPerformed!==true||plan.noChargeMade!==true||
  plan.allLiveOutcomesUnverified!==true||
  (website&&(
   website.id!==plan.source?.websiteId||
   website.generation!==plan.source?.websiteRevision||
   (website.businessId&&website.businessId!==businessId)||
   (website.business_id&&website.business_id!==businessId)))||
  (!website&&plan.source?.websiteId!==null)||
  (app&&(app.id!==plan.source?.appId||
   app.draft_revision!==plan.source?.appRevision||
   app.business_id!==businessId))||
  (!app&&plan.source?.appId!==null)||
  !Array.isArray(plan.capabilities)||plan.capabilities.length<1||
  plan.capabilities.length>35)
  return fail("Review current private website and Business App drafts for this business.");
 const all=[];
 for(const cap of plan.capabilities){
  if(!cap||typeof cap.id!=="string"||
   !/^[a-z_]{1,48}$/.test(cap.id)||
   cap.ownerApprovalRequired!==true||cap.noLiveEvidence!==true||
   !cap[surface]||!allowedStatuses.has(cap[surface].status)||
   !Array.isArray(cap.prerequisites))return fail("The capability evidence is incomplete.");
  if(!cap.explicitlyRequested)continue;
  const status=cap[surface].status,policy=actionByStatus[status];
  const needsProof=cap.authoritativeReceiptRequired===true||
   cap.independentDiaryConfirmationRequired===true;
  all.push({capabilityId:cap.id,featureName:cap.title,
   status,priority:priority[status],...policy,
   requiresRealCustomerReceipt:needsProof,
   requiresSeparateProviderApproval:cap.requiresExternalProvider===true,
   mayEnableModule:false,mayConfirmBooking:false});
 }
 const ordered=all.sort((a,b)=>a.priority-b.priority||
   a.capabilityId.localeCompare(b.capabilityId));
 const selected=ordered[0]||null;
 return {ok:true,kind:"shared_builder_next_step_v3236",
  businessId,surface,source:{...plan.source},
  recommended:selected?{
   capabilityId:selected.capabilityId,
   featureName:selected.featureName,action:selected.action,
   title:selected.title,reason:selected.reason,next:selected.next,
   requiresRealCustomerReceipt:selected.requiresRealCustomerReceipt,
   requiresSeparateProviderApproval:selected.requiresSeparateProviderApproval
  }:null,
  remainingRequestedCapabilities:Math.max(0,ordered.length-1),
  capabilitiesToVerify:ordered.filter(x=>x.status==="present_in_private_draft").length,
  capabilitiesNeedingDevelopment:ordered.filter(x=>
   x.status==="requires_new_implementation").length,
  noCustomerTaskVerified:true,noScreenshotEvidence:true,
  liveVerified:false,ownerMustApprove:true,mayExecute:false,
  mayPublish:false,mayCharge:false,mayEnableModule:false,
  mayContactCustomer:false,mayConfirmBooking:false,
  noCrossBusinessData:true,oneRecommendedStepOnly:true};
}
export {reviewUniversalBuilderNextStepV3236};
