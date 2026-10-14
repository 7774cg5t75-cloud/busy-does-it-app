/**
 * V3.219 — strictly read-only staging schema compatibility assessment.
 * Input MUST be assembled from authorised pg_catalog/information_schema
 * reads in the named isolated staging project. This pure function does not
 * query a database and cannot attest that supplied metadata was authentic.
 * Never infer deployment readiness from a caller's 'passed' or 'verified' flag.
 */
const REQUIRED=Object.freeze([
 {name:"busy_business_memberships",why:"Owner business membership and tenant scope"},
 {name:"busy_mini_apps",why:"Canonical Business App to owner/business scope"},
 {name:"busy_mini_app_versions",why:"Immutable published Business App versions"},
 {name:"busy_mini_app_requests",why:"Existing shared customer requests and inbox"},
 {name:"busy_mini_app_guest_challenges",why:"Existing guest abuse/challenge protections"}
]);
const REQUEST_COLUMNS=Object.freeze(["id","business_id","mini_app_id","request_type","status","request_origin"]);
const VERSION_COLUMNS=Object.freeze(["id","mini_app_id","state"]);
const no=reason=>({ok:false,reason,stagingReady:false,
 websiteIntakeDeployAllowed:false,actualMigrationPerformed:false,
 customerRequestCreated:false,providerDelivered:false});
const names=x=>Array.isArray(x)&&x.length<=250&&x.every(t=>
 typeof t==="string"&&/^[a-z][a-z0-9_]{0,100}$/.test(t));
function auditStagingSchemaV3219({
 source="",environment="",observedAt="",tables=[],columns={},
 functions=[],rlsTables=[],policies=[],migrationHistoryReviewed=false
}={}){
 if(source!=="read_only_pg_catalog"||environment!=="isolated_staging"||
   !/^\d{4}-\d{2}-\d{2}$/.test(observedAt)||
   !names(tables)||!names(functions)||!names(rlsTables)||
   !Array.isArray(policies)||policies.length>200||
   !policies.every(p=>p&&typeof p==="object"&&
     typeof p.table==="string"&&typeof p.name==="string"))
  return no("A bounded, explicitly sourced staging catalogue snapshot is required.");
 if(!columns||typeof columns!=="object"||Array.isArray(columns)||
    Object.keys(columns).length>250||
    Object.values(columns).some(x=>!names(x)))
  return no("Staging column metadata is incomplete or malformed.");
 const existing=new Set(tables);
 const missing=REQUIRED.filter(x=>!existing.has(x.name)).map(x=>x.name);
 const absentColumns={
  busy_mini_app_requests:existing.has("busy_mini_app_requests")?
   REQUEST_COLUMNS.filter(x=>!(columns.busy_mini_app_requests||[]).includes(x)):
   [...REQUEST_COLUMNS],
  busy_mini_app_versions:existing.has("busy_mini_app_versions")?
   VERSION_COLUMNS.filter(x=>!(columns.busy_mini_app_versions||[]).includes(x)):
   [...VERSION_COLUMNS]
 };
 const missingRpc=!functions.includes("busy_mini_app_create_guest_request");
 const notRls=REQUIRED.filter(x=>existing.has(x.name)&&
   !rlsTables.includes(x.name)).map(x=>x.name);
 // Mere existence of a policy is not proof it is safe; owner authorization
 // and RLS still need independent tests against two separate staging tenants.
 const checks=[
  {id:"shared_tables",ready:missing.length===0,
   note:missing.length?"Shared request prerequisites are missing.":"Required source table names exist (not runtime proof)."},
  {id:"request_columns",ready:absentColumns.busy_mini_app_requests.length===0,
   note:"Reconcile actual request origin, indexes, foreign keys and NOT NULL constraints."},
  {id:"version_columns",ready:absentColumns.busy_mini_app_versions.length===0,
   note:"Verify immutable live version and publication semantics."},
  {id:"guest_rpc",ready:!missingRpc,
   note:"Inspect function signatures, privileges, transactional semantics and challenge scope."},
  {id:"rls_flags",ready:notRls.length===0&&missing.length===0,
   note:"RLS enabled flag is not proof of cross-business isolation."},
  {id:"migration_history",ready:migrationHistoryReviewed===true,
   note:"Match actual remote migration history to versioned source before any rollout."}
 ];
 const sourceComplete=checks.every(x=>x.ready);
 return {ok:true,kind:"staging_schema_gate_v3219",
  environment,observedAt,source,
  missingTables:missing,missingRequestColumns:absentColumns.busy_mini_app_requests,
  missingVersionColumns:absentColumns.busy_mini_app_versions,
  missingGuestRpc:missingRpc,missingRlsEnabled:notRls,
  reportedPolicyCount:policies.length,
  checks,sourceCompatibilityChecksPassed:checks.filter(x=>x.ready).length,
  sourceCompatibilityChecksTotal:checks.length,
  sourceMetadataLooksCompatible:sourceComplete,
  // Even a complete catalogue is NOT authorization or a successful migration.
  stagingReady:false,websiteIntakeDeployAllowed:false,
  actualMigrationPerformed:false,customerRequestCreated:false,
  liveEndpointEnabled:false,providerDelivered:false,
  securityAuditCompleted:false,tenantIsolationProven:false,
  rollbackTested:false,requiresOwnerApproval:true,
  recommendedAction:missing.length?
   "Establish and verify the shared Business App schema in isolated staging before website-native intake.":
   "Review actual function privileges, tenant RLS policies, migration order and rollback in isolated staging before enabling anything."};
}
export {REQUIRED,REQUEST_COLUMNS,auditStagingSchemaV3219};
