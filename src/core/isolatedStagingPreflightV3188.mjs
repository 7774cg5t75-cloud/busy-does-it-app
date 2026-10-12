/**
 * V3.188 — read-only operator handover for ONE isolated staging project.
 * This is a review of observations, not permission to install anything.
 * An externally supplied boolean never replaces owner approval, backup
 * verification, signed-JWT access tests or an actual Supabase inspection.
 */
const TARGET="pnjdlogwegnqbsfpcofw";
const EXT=["pgcrypto","pgmq","pg_cron","pg_net"];
const CANARY="public.busy_staging_rls_canary";
const LEDGER=[
 "20261010224121","20261010224205"
];
function assessIsolatedStagingSnapshot({
 projectRef="",health="",publicTables=[],migrationVersions=[],
 edgeFunctionNames=[],extensions={},manifestIntegrity=false,
 sqlRiskReview=null
}={}){
 if(!Array.isArray(publicTables)||publicTables.length>100||
   publicTables.some(x=>typeof x!=="string")||
   !Array.isArray(migrationVersions)||migrationVersions.length>200||
   migrationVersions.some(x=>typeof x!=="string")||
   !Array.isArray(edgeFunctionNames)||edgeFunctionNames.length>100||
   edgeFunctionNames.some(x=>typeof x!=="string")||
   typeof extensions!=="object"||!extensions||Array.isArray(extensions))
  return {ok:false,reason:"Require bounded public-table, migration and extension observations."};
 const targetConfirmed=projectRef===TARGET;
 const projectHealthy=health==="ACTIVE_HEALTHY";
 const tablesKnown=publicTables.length===1&&publicTables[0]===CANARY;
 const ledgerKnown=LEDGER.every(x=>migrationVersions.includes(x))&&
   migrationVersions.length===LEDGER.length;
 const edgeNone=edgeFunctionNames.length===0;
 const extensionsMissing=EXT.filter(x=>extensions[x]!==true);
 const riskFiles=sqlRiskReview?.ok===true&&Number.isSafeInteger(sqlRiskReview.filesWithReviewSignals)?
  sqlRiskReview.filesWithReviewSignals:null;
 const blockers=[];
 if(!targetConfirmed)blockers.push("wrong_or_unverified_project");
 if(!projectHealthy)blockers.push("project_health_unverified");
 if(!tablesKnown)blockers.push("schema_diff_requires_reconciliation");
 if(!ledgerKnown)blockers.push("migration_ledger_diff_requires_reconciliation");
 if(!edgeNone)blockers.push("existing_functions_require_review");
 if(extensionsMissing.length)blockers.push("extension_install_and_permission_review");
 if(manifestIntegrity!==true)blockers.push("offline_manifest_integrity");
 if(riskFiles===null)blockers.push("migration_risk_triage_missing");
 // These cannot be inferred from the SQL file count, presence of a canary,
 // or reported UI data. They require actual human verification.
 blockers.push("verified_backup_and_restore_test");
 blockers.push("auth_membership_rls_and_staging_secrets_review");
 blockers.push("explicit_separate_install_approval");
 const steps=[
  {id:"validate_exact_project",safeToRunNow:true,
   description:"Independently verify the isolated project ID and current state without mutation."},
  {id:"check_sql_manifest",safeToRunNow:true,
   description:"Run offline SHA-256 and migration side-effect review; inspect every risky SQL file."},
  {id:"backup_restore_rehearsal",safeToRunNow:false,
   description:"Agree and independently test a recoverable isolated-staging backup without deleting its canary."},
  {id:"approve_extension_install",safeToRunNow:false,
   description:"Review pgmq, pg_cron and pg_net permissions, jobs, secrets and billing before enabling."},
  {id:"review_auth_and_ledger",safeToRunNow:false,
   description:"Reconcile existing migration ledger and all owner/staff/Auth/RLS permissions."},
  {id:"request_separate_approval",safeToRunNow:false,
   description:"Obtain explicit approval for this staging-only migration and Edge deployment."},
  {id:"install_one_reviewed_step_at_a_time",safeToRunNow:false,
   description:"Execute reviewed staging migrations with recorded checkpoints and a recovery path."},
  {id:"prove_real_signed_customer_journey",safeToRunNow:false,
   description:"Use separate signed customer/owner accounts to test booking, replies, retries and isolation."}
 ];
 return {
  ok:true,kind:"isolated_staging_review_snapshot_v3188",
  targetProjectRef:TARGET,projectMatches:targetConfirmed,
  projectHealthy,onlyKnownCanaryPresent:tablesKnown,
  expectedCanaryMigrationsPresent:ledgerKnown,
  appFunctionsAbsent:edgeNone,extensionsMissing,
  riskFilesFlaggedForHumanReview:riskFiles,steps,blockers,
  isApplicationInstalled:false,
  offlinePackageReviewed:manifestIntegrity===true,
  actualOwnerApprovalProven:false,
  backupRestorationProven:false,
  installExecuted:false,canApplySql:false,canDeployEdge:false,
  productionTargetAllowed:false,hostedAuthJWTIsolationProven:false
 };
}
export {assessIsolatedStagingSnapshot};
