/**
 * V3.178 — authenticated, staging-only READ-ONLY installation audit.
 *
 * Must be called AFTER owner/admin membership(user.id, businessId, true)
 * and isolatedStagingGuard(server-owned environment) both succeed.
 * It checks schema reachability, not RLS enforcement, actual data delivery,
 * tenant isolation, native builds or customer journey completion.
 *
 * Never returns row values, schema names containing customer details, secrets,
 * tenant identifiers or data counts; service_role is strictly server-side.
 */
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const REQUIRED=Object.freeze([
 Object.freeze({id:"apps",table:"busy_mini_apps"}),
 Object.freeze({id:"website_deployments",table:"busy_website_deployments"}),
 Object.freeze({id:"app_owner_history",table:"busy_brain_owner_decisions"}),
 Object.freeze({id:"website_owner_history",table:"busy_website_brain_decisions"}),
 Object.freeze({id:"synthetic_qa",table:"busy_staging_qa_runs"})
]);
async function auditIsolatedStagingInstall(
 supabase,appForBusiness,businessId,body
){
 const app=await appForBusiness(businessId);
 if(!app||!UUID.test(app.id)||app.id!==body?.appId||
   !Number.isSafeInteger(body?.expectedRevision)||
   body.expectedRevision<1||
   Number(app.draft_revision)!==body.expectedRevision)
   throw Error("Choose the current private Business App before auditing staging.");
 const checks=[];
 for(const spec of REQUIRED){
  // Test schema existence with a bounded read; NEVER return the data.
  // This uses service_role, which can bypass RLS: NO RLS claim.
  try{
   const result=await supabase.from(spec.table).select("id").limit(1);
   checks.push({id:spec.id,status:result.error?"unavailable":"reachable"});
  }catch{
   checks.push({id:spec.id,status:"unavailable"});
  }
 }
 const missing=checks.filter(x=>x.status!=="reachable").map(x=>x.id);
 return {
  kind:"isolated_staging_install_audit_v3178",appId:app.id,
  draftRevision:Number(app.draft_revision),
  source:"authenticated_staging_server_schema_read_only",
  checks,missing,requiredCount:checks.length,reachableCount:checks.length-missing.length,
  installationReadyForSyntheticTesting:missing.length===0,
  liveSubmissionCount:0,noRowsOrSecretsReturned:true,
  tablesContainLiveCustomersNotQueried:true,
  sourceRowsReturned:false,readOnly:true,
  serverAuthGateMustRunBeforeThisHelper:true,
  rlsTenantIsolationVerified:false,
  customerJourneyVerified:false,
  emailDeliveryVerified:false,bookingConfirmationVerified:false,
  standaloneDistributionVerified:false,
  deviceAccessibilityVerified:false,
  releaseApproved:false
 };
}
export {REQUIRED,auditIsolatedStagingInstall};
