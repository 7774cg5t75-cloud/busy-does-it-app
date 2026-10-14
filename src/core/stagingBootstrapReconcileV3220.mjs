/**
 * V3.220 — independently scoped STAGING BOOTSTRAP RECONCILIATION.
 * The upstream read-only Supabase catalogue/ledger must be obtained by an
 * authenticated operator; pure analysis cannot verify supplied provenance.
 * Source inventories are read from checked-in repo files by offline tools.
 * No database operation, SQL execution, migrations or live form activation.
 */
import {analyseStagingMigrations} from "./stagingMigrationPlan.mjs";
import {compileMigrationRiskLedger} from "./stagingSqlRiskLedgerV3203.mjs";
import {auditStagingSchemaV3219} from "./stagingSchemaGateV3219.mjs";
const STAGING="pnjdlogwegnqbsfpcofw";
const BASELINE="staging/ISOLATED_ONLY_business_core_v3180.sql";
const CANARY="busy_staging_rls_canary";
const CANARY_LEDGER=["20261010224121","20261010224205"];
const EXTENSIONS=["pgcrypto","pgmq","pg_cron","pg_net"];
const FILE=/^20\d{12}_[a-z0-9_]+\.sql$/;
const deny=reason=>({ok:false,reason,approvedToApply:false,
 mayExecuteSql:false,stagingInstalled:false,productionTouched:false,
 realCustomerRequestVerified:false,websiteFormEnabled:false});
function reconcileStagingBootstrapV3220({
 projectRef="",projectName="",source="",observedAt="",publicTables=[],
 appliedMigrations=[],installedExtensions=[],migrationFiles=[],
 baseSchemaSql="",observedFunctions=[],rlsTables=[]
}={}){
 if(projectRef!==STAGING||projectName!=="Busy Does It Staging"||
  source!=="direct_supabase_staging_read_only"||
  !/^\d{4}-\d{2}-\d{2}(?:T[\d:.+-]+Z?)?$/.test(observedAt)||
  !Array.isArray(publicTables)||publicTables.length>200||
  publicTables.some(x=>typeof x!=="string")||
  !Array.isArray(appliedMigrations)||appliedMigrations.length>300||
  appliedMigrations.some(x=>typeof x!=="string"||!/^\d{14}$/.test(x))||
  !Array.isArray(installedExtensions)||installedExtensions.length>30||
  installedExtensions.some(x=>typeof x!=="string")||
  !Array.isArray(observedFunctions)||!Array.isArray(rlsTables)||
  !Array.isArray(migrationFiles)||migrationFiles.length<59||
  migrationFiles.length>300||migrationFiles.some(x=>!x||!FILE.test(x.name)||
   typeof x.sql!=="string"||x.sql.length>300000)||
  typeof baseSchemaSql!=="string"||baseSchemaSql.length<200||
  !baseSchemaSql.includes("create table if not exists public.busy_businesses")||
  !baseSchemaSql.includes("create table if not exists public.busy_business_memberships"))
  return deny("Verify the exact staging project, complete source migration inventory, and staging-only business baseline.");
 const sorted=[...migrationFiles].sort((a,b)=>a.name.localeCompare(b.name));
 const duplicates=sorted.length!==new Set(sorted.map(x=>x.name)).size;
 if(duplicates)return deny("Duplicate SQL migration filenames; stop before staging.");
 const sourceReport=analyseStagingMigrations(sorted,{
  existingTables:["busy_businesses","busy_business_memberships"]
 });
 const risks=compileMigrationRiskLedger(sorted);
 if(!sourceReport.ok||sourceReport.violations.length||
  !risks.ok||risks.fileCount!==sorted.length)
  return deny("Source migration dependencies or risk ledger could not be reconciled.");
 const market=sorted.findIndex(x=>x.name.includes("v3_39_busy_apps_marketplace_foundation"));
 const guest=sorted.findIndex(x=>x.name.includes("v3_45_guest_mini_app_requests"));
 const atomic=sorted.findIndex(x=>x.name.includes("v3_180_atomic_business_app_handoff"));
 if(market<1||guest<=market||atomic<=guest)
  return deny("The app, guest challenge and atomic handoff dependencies are not in the expected chronological order.");
 const wrongTables=publicTables.filter(x=>x!==CANARY);
 const wrongLedger=appliedMigrations.filter(x=>!CANARY_LEDGER.includes(x));
 const missingCanary=!publicTables.includes(CANARY)||
  CANARY_LEDGER.some(x=>!appliedMigrations.includes(x));
 const canaryCompatible=!missingCanary&&!wrongTables.length&&!wrongLedger.length;
 const missingExt=EXTENSIONS.filter(x=>!installedExtensions.includes(x));
 const phase=(id,title,list)=>({
  id,title,
  paths:list,
  fileCount:list.length,
  flagged:risks.files.filter(x=>list.includes("supabase/migrations/"+x.filename)&&x.needsHumanReview)
   .map(x=>({path:"supabase/migrations/"+x.filename,
    categories:x.signals.map(s=>s.category),
    blocksAutomaticApply:x.externalSideEffectsMightOccur})),
  // Every step, including the baseline, needs review and a tested rollback.
  ownerApprovalRequired:true,canApplyAutomatically:false,applied:false,
  independentlyTested:false
 });
 const phases=[
  phase("01_baseline","Staging-only business and membership baseline",[BASELINE]),
  phase("02_platform","Existing website and platform dependencies",
    sorted.slice(0,market).map(x=>"supabase/migrations/"+x.name)),
  phase("03_business_apps","Business App module and request tables",
    sorted.slice(market,guest).map(x=>"supabase/migrations/"+x.name)),
  phase("04_guest_requests","Guest challenge, request RPC and immediate security hardening",
    sorted.slice(guest,guest+3).map(x=>"supabase/migrations/"+x.name)),
  phase("05_later_features","Later automation, messaging, versioned request and AI features",
    sorted.slice(guest+3).map(x=>"supabase/migrations/"+x.name))
 ];
 const report=auditStagingSchemaV3219({
  source:"read_only_pg_catalog",environment:"isolated_staging",
  observedAt:observedAt.slice(0,10),
  tables:publicTables,columns:{},functions:observedFunctions,
  rlsTables,policies:[],migrationHistoryReviewed:true
 });
 const first=risks.files.filter(x=>x.needsHumanReview);
 return {ok:true,kind:"staging_bootstrap_reconcile_v3220",
  projectRef,sourceObservedAt:observedAt,
  sourceMigrationCount:sorted.length,
  sourceDependencyCount:sourceReport.violations.length,
  canaryCompatible,
  unexpectedPublicTables:wrongTables,
  unexpectedMigrationVersions:wrongLedger,
  baseSchemaFile:BASELINE,
  stagedBaseMissing:!publicTables.includes("busy_businesses"),
  stagingSourceTablesMissing:report.ok?report.missingTables:[],
  missingExtensions:missingExt,
  currentExtensionCount:installedExtensions.length,
  phases,sourceFilesRequiringReview:first.length,
  filesWithPotentialExternalOrPrivilegedSideEffects:risks.sideEffectSensitiveFiles,
  riskCategoryCounts:risks.categories,
  // This is a source-only plan, not a Postgres snapshot, executed migration,
  // full SQL parser, security audit, backup/restore verification or approval.
  liveProjectIntrospectionByThisModule:false,
  rollbackVerified:false,ownerApprovalRecorded:false,
  migrationExecutionPermitted:false,approvedToApply:false,
  mayExecuteSql:false,stagingInstalled:false,
  realCustomerRequestVerified:false,websiteFormEnabled:false,
  productionTouched:false,requiresIndependentPhaseReview:true,
  nextAction:canaryCompatible?
    "Review the staging-only business baseline, per-file risks and backup/restore before seeking explicit staging migration approval.":
    "Stop: reconcile staging canary, unexpected objects and migration history before planning any SQL."};
}
export {STAGING,BASELINE,CANARY_LEDGER,reconcileStagingBootstrapV3220};
