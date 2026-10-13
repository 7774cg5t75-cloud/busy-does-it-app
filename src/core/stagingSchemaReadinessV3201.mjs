/**
 * V3.201 — schema-first, READ-ONLY isolated staging decision.
 *
 * Input is a bounded inventory from a direct authorised Supabase inspection,
 * NOT a user-supplied permission token. Even fully green observations only
 * allow planning a separate, explicitly approved staged installation.
 *
 * Never decides that real JWTs, data delivery or concurrent writes succeeded.
 */
const STAGING_REF="pnjdlogwegnqbsfpcofw";
const BASE=Object.freeze([
 "busy_businesses","busy_business_memberships",
 "busy_public_business_profiles","busy_mini_app_module_catalog","busy_mini_apps",
 "busy_mini_app_versions","busy_mini_app_requests"
]);
const JOURNEY=Object.freeze([
 "busy_mini_app_request_events","busy_mini_app_request_links",
 "busy_mini_app_work_bookings","busy_staging_qa_runs"
]);
const EXT=Object.freeze(["pgcrypto","pgmq","pg_cron","pg_net"]);
const REQUIRED_MIGRATIONS=Object.freeze([
 "v3_39_busy_apps_marketplace_foundation",
 "v3_180_atomic_business_app_handoff",
 "v3199_atomic_first_private_app"
]);
const allowed=(v,max)=>Array.isArray(v)&&v.length<=max&&v.every(
 x=>typeof x==="string"&&/^[A-Za-z0-9_]{1,120}$/.test(x));
const error=reason=>({ok:false,reason,mayInstallAutomatically:false,
 mayTestCustomers:false,noProductionWrites:true});
function assessStagingSchemaReadiness({
 projectRef="",source="",observedAt="",publicTables=[],
 migrations=[],extensions=[],functions=[],uniqueConstraints=[],
 canaryPreserved=false,backupVerified=false,
 fullMigrationReviewComplete=false,authRolesReviewed=false,
 isolatedEdgeDeployed=false,syntheticFixtureVerified=false,
 ownerApprovedInstall=false
}={},now=Date.now()){
 if(projectRef!==STAGING_REF||source!=="direct_supabase_staging_read_only")
  return error("An independently inspected, allowlisted staging project is required.");
 if(![publicTables,migrations,extensions,functions,uniqueConstraints]
    .every(x=>allowed(x,2000))||!Number.isFinite(now)||
    typeof observedAt!=="string")
  return error("A bounded authorised schema inventory is required.");
 const at=Date.parse(observedAt);
 if(!Number.isFinite(at)||at>now+60000||now-at>86400000)
  return error("The staging schema inventory is stale or incorrectly dated.");
 const t=new Set(publicTables),m=new Set(migrations),e=new Set(extensions);
 const fn=new Set(functions),u=new Set(uniqueConstraints);
 const missingBase=BASE.filter(x=>!t.has(x));
 const missingJourney=JOURNEY.filter(x=>!t.has(x));
 const missingExtensions=EXT.filter(x=>!e.has(x));
 const missingMigrations=REQUIRED_MIGRATIONS.filter(x=>!m.has(x));
 const atomicRpcPresent=fn.has("busy_create_first_mini_app_draft_v3199");
 const uniqueFirstAppKeyPresent=u.has("busy_mini_apps_business_id_app_key_key");
 const prerequisites={
  canaryPreserved:canaryPreserved===true,
  backupVerified:backupVerified===true,
  schemaSourceCurrent:true,
  fullMigrationReviewComplete:fullMigrationReviewComplete===true,
  authRolesReviewed:authRolesReviewed===true,
  explicitOwnerInstallApproval:ownerApprovedInstall===true
 };
 const allPreconditions=Object.values(prerequisites).every(Boolean);
 const schemaComplete=!missingBase.length&&!missingJourney.length&&
  !missingMigrations.length&&!missingExtensions.length&&
  atomicRpcPresent&&uniqueFirstAppKeyPresent;
 // This is not permission to apply SQL. A live admin must still separately
 // review the migration plan, backups, destination and action.
 const mayRequestHumanInstallationReview=allPreconditions&&schemaComplete;
 const issues=[
  ...missingBase.map(x=>"missing_base_table:"+x),
  ...missingJourney.map(x=>"missing_journey_table:"+x),
  ...missingMigrations.map(x=>"missing_migration:"+x),
  ...missingExtensions.map(x=>"missing_extension:"+x),
  ...(!atomicRpcPresent?["missing_first_app_rpc"]:[]),
  ...(!uniqueFirstAppKeyPresent?["missing_main_app_uniqueness"]:[]),
  ...Object.entries(prerequisites).filter(([,v])=>!v).map(([k])=>"approval_needed:"+k),
  ...(isolatedEdgeDeployed!==true?["isolated_edge_not_verified"]:[]),
  ...(syntheticFixtureVerified!==true?["synthetic_business_not_verified"]:[])
 ];
 return {ok:true,kind:"observed_staging_schema_readiness_v3201",
  expectedProjectRef:STAGING_REF,
  source,observedAt,
  missingBase,missingJourney,missingMigrations,missingExtensions,
  atomicRpcPresent,uniqueFirstAppKeyPresent,
  prerequisiteFlags:prerequisites,
  schemaComplete,mayRequestHumanInstallationReview,
  isolatedEdgeDeployed:isolatedEdgeDeployed===true,
  syntheticFixtureVerified:syntheticFixtureVerified===true,
  canRunFirstAppConcurrencyTest:mayRequestHumanInstallationReview&&
   isolatedEdgeDeployed===true&&syntheticFixtureVerified===true,
  canRunRealCustomerJourney:false, // requires separately authorised JWT and endpoints
  blockers:issues,blockerCount:issues.length,
  noSchemaChanged:true,noDataRead:true,
  noApplicationQueries:true,noProductionWrites:true,
  realJwtAuthorizationVerified:false,realAppCreated:false,
  realCustomerSubmissionVerified:false,
  noAutomaticMigrationExecution:true,noProviderCalls:true};
}
export {STAGING_REF,BASE,JOURNEY,EXT,REQUIRED_MIGRATIONS,
 assessStagingSchemaReadiness};
