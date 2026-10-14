/**
 * V3.222 — review ONLY of direct read-only staging catalogue metadata.
 * Never executes migrations or trusts a caller-supplied "approved" flag.
 * A pure module cannot authenticate metadata; the caller must be an
 * independently authorised staging-only connector/operator.
 */
import {reviewStagingBusinessBaselineV3221}
 from "./stagingFirstPhaseSafetyV3221.mjs";
const EXPECTED_PROJECT="pnjdlogwegnqbsfpcofw";
const CANARY="busy_staging_rls_canary";
const EXPECTED_LEDGER=["20261010224121","20261010224205"];
const BASE_TABLES=["busy_businesses","busy_business_memberships"];
const fail=reason=>({ok:false,reason,applyAllowed:false,
 stagingInstalled:false,tenantRlsProven:false,productionTouched:false});
function inspectFirstStagingPhaseV3222({
 projectRef="",projectName="",catalogueSource="",
 observedAt="",publicTables=[],migrationLedger=[],baselineSql=""
}={}){
 if(projectRef!==EXPECTED_PROJECT||projectName!=="Busy Does It Staging"||
  catalogueSource!=="connector_read_only_pg_catalog"||
  !/^\d{4}-\d{2}-\d{2}$/.test(observedAt)||
  !Array.isArray(publicTables)||publicTables.length>150||
  publicTables.some(x=>typeof x!=="string"||!/^[a-z][a-z0-9_]*$/.test(x))||
  !Array.isArray(migrationLedger)||migrationLedger.length>200||
  migrationLedger.some(x=>typeof x!=="string"||!/^\d{14}$/.test(x)))
  return fail("A bounded snapshot of the exact isolated staging project is required.");
 const tableNames=new Set(publicTables),versions=new Set(migrationLedger);
 const unexpectedTables=publicTables.filter(x=>x!==CANARY&&!BASE_TABLES.includes(x));
 const unexpectedLedger=migrationLedger.filter(x=>!EXPECTED_LEDGER.includes(x));
 const canaryIntact=tableNames.has(CANARY)&&
  EXPECTED_LEDGER.every(v=>versions.has(v))&&!unexpectedLedger.length;
 const basePresent=BASE_TABLES.filter(x=>tableNames.has(x));
 const partialBase=basePresent.length>0&&basePresent.length<BASE_TABLES.length;
 const unexpectedSchema=unexpectedTables.length>0||partialBase||
   (basePresent.length>0&&!canaryIntact);
 const sourceReview=reviewStagingBusinessBaselineV3221({
  filePath:"staging/ISOLATED_ONLY_business_core_v3180.sql",
  stagingProjectRef:EXPECTED_PROJECT,sql:baselineSql
 });
 const reviewStages=[
  {id:"verify_target_and_ledger",needsIndependentCheck:true,
   note:"Re-read staging identity, canary and exact migration ledger at installation time."},
  {id:"compare_existing_schema",needsIndependentCheck:true,
   note:"Confirm FK/role/column parity; source checks are not a real SQL parser."},
  {id:"check_external_effects",needsIndependentCheck:true,
   note:"Review cron, HTTP, secret access, permissions and scheduler calls."},
  {id:"backup_and_restore",needsIndependentCheck:true,
   note:"Prove backup and disposable restore before touching staging."},
  {id:"two_tenant_auth_rls",needsIndependentCheck:true,
   note:"Verify real authenticated owner, staff, foreign tenant and revoked memberships."},
  {id:"owner_phase_approval",needsIndependentCheck:true,
   note:"Obtain separate exact-phase approval after source fingerprint verification."}
 ];
 return {ok:true,kind:"staging_first_phase_evidence_v3222",
  projectRef,observedAt,canaryIntact,
  unexpectedTables,unexpectedLedger,partialBase,
  baseBusinessTablePresent:tableNames.has("busy_businesses"),
  baseMembershipTablePresent:tableNames.has("busy_business_memberships"),
  sourceBaselineLooksCompatible:sourceReview.ok&&sourceReview.sourceAppearsCompatible,
  sourceMissingPatterns:sourceReview.ok?sourceReview.missing:[],
  phaseStatus:unexpectedSchema||!canaryIntact?
    "halt_unexpected_remote_state":
    basePresent.length===0?"review_uninstalled_baseline":
    "inspect_existing_baseline_compatibility",
  reviewStages,
  // Never grant execution from client flags or a matching static snapshot.
  sourceOnlyReview:true,catalogueSourceCannotBeAuthenticatedByThisFunction:true,
  fullSchemaCompatibilityProven:false,actualTenantMembershipVerified:false,
  actualMigrationHistoryReconciled:false,rollbackRehearsed:false,
  ownerApprovalConfirmed:false,applyAllowed:false,stagingInstalled:false,
  nativeWebsiteIntakeEnabled:false,realCustomerRequestVerified:false,
  productionTouched:false,
  nextAction:unexpectedSchema||!canaryIntact?
   "HALT: unexpected tables, partial baseline or migration history changed. Review independently.":
   basePresent.length===0?
   "Review the existing V3.180 staging-only baseline with database/security owners; do not apply automatically.":
   "Independently inspect existing business memberships and RLS before deciding any next migration."};
}
export {EXPECTED_PROJECT,CANARY,EXPECTED_LEDGER,inspectFirstStagingPhaseV3222};
