/**
 * V3.202 — deterministic installation *sequencing*, not an SQL executor.
 * Uses the complete GitHub migration source and a dated direct staging
 * observation to flag missing dependencies and risky DDL/side effects.
 *
 * No source analysis or user-provided approval can authorise installation.
 */
import {analyseStagingMigrations} from "./stagingMigrationPlan.mjs";
import {reviewMigrationSideEffects} from "./stagingMigrationRiskV3184.mjs";
import {STAGING_REF} from "./stagingSchemaReadinessV3201.mjs";

const CANARY=new Set(["busy_staging_rls_canary"]);
const CANARY_LEDGER=new Set([
 "20261010224121","20261010224205"
]);
const SLICE=Object.freeze([
 {id:"business_core",label:"Staging-only business core",min:0,max:0},
 {id:"before_app_marketplace",label:"Earlier website and platform dependencies"},
 {id:"app_and_customer_system",label:"Business Apps, requests and related system"},
 {id:"later_architecture",label:"Later intelligence and transactional foundations"}
]);
const FILE=/^20\d{12}_[a-z0-9_]+\.sql$/;
const bounded=(x,max,rule)=>Array.isArray(x)&&x.length<=max&&x.every(rule);
const safeName=x=>typeof x==="string"&&/^[a-z0-9_]{1,140}$/.test(x);
const cleanSql=s=>s.replace(/--[^\n]*/g,"").replace(/\/\*[\s\S]*?\*\//g,"");
const error=reason=>({ok:false,reason,installationAuthorised:false,
 automaticSqlExecution:false,productionTouched:false});
function prepareStagingInstallSequence({
 projectRef="",source="",observedAt="",tables=[],ledger=[],extensions=[],
 migrations=[],baselineSql="",packageVerified=false,canaryPreserved=false
}={}){
 if(projectRef!==STAGING_REF||source!=="direct_supabase_staging_read_only")
  return error("Verify the exact isolated staging project using authorised read-only observations.");
 if(!Number.isFinite(Date.parse(observedAt))||
  !bounded(tables,500,safeName)||!bounded(ledger,500,safeName)||
  !bounded(extensions,30,safeName)||!bounded(migrations,300,x=>
    x&&FILE.test(x.name)&&typeof x.sql==="string"&&x.sql.length<300000)||
  typeof baselineSql!=="string"||baselineSql.length<50||
  packageVerified!==true||canaryPreserved!==true)
  return error("A dated schema inventory, intact source package and canary observation are required.");
 if(!tables.includes("busy_staging_rls_canary"))
  return error("The isolated staging canary must be present before planning installation.");
 const unknownTables=tables.filter(x=>!CANARY.has(x));
 const unknownMigrations=ledger.filter(x=>!CANARY_LEDGER.has(x));
 // Never plan around an unexplained partial schema or migration history.
 if(unknownTables.length||unknownMigrations.length)
  return { ...error("Staging contains additional tables or migrations: reconcile the live schema before making a plan."),
   unexplainedTables:unknownTables,unexplainedLedgerEntries:unknownMigrations};
 const sorted=[...migrations].sort((a,b)=>a.name.localeCompare(b.name));
 if(new Set(sorted.map(x=>x.name)).size!==sorted.length||
  sorted.length<59||
  !sorted.some(x=>x.name.includes("v3_39_busy_apps_marketplace_foundation"))||
  !sorted.some(x=>x.name.includes("v3_180_atomic_business_app_handoff"))||
  !sorted.some(x=>x.name.includes("v3199_atomic_first_private_app")))
  return error("Full chronological Business App migration sequence is required.");
 const analysis=analyseStagingMigrations(sorted,{
  existingTables:["busy_businesses","busy_business_memberships"]
 });
 const risks=reviewMigrationSideEffects(sorted);
 if(!analysis.ok||analysis.violations.length||!risks.ok)
  return error("Source migrations have unresolved prerequisites or invalid risk assessment.");
 const marketplace=sorted.findIndex(x=>x.name.includes("v3_39_busy_apps_marketplace_foundation"));
 const atomic=sorted.findIndex(x=>x.name.includes("v3_180_atomic_business_app_handoff"));
 if(marketplace<1||atomic<=marketplace)
  return error("Expected platform-to-app dependency ordering is missing.");
 const phase=[
  {id:"01_baseline",label:SLICE[0].label,files:["staging/ISOLATED_ONLY_business_core_v3180.sql"],
   hasPrivilegedDDL:true,manualReviewRequired:true},
  {id:"02_website_foundation",label:SLICE[1].label,files:sorted.slice(0,marketplace).map(x=>"supabase/migrations/"+x.name)},
  {id:"03_business_apps_and_platform",label:SLICE[2].label,files:sorted.slice(marketplace,atomic).map(x=>"supabase/migrations/"+x.name)},
  {id:"04_atomic_and_recent",label:SLICE[3].label,files:sorted.slice(atomic).map(x=>"supabase/migrations/"+x.name)}
 ];
 const categories=new Map(risks.findings.map(x=>[x.name,x.categories]));
 const phases=phase.map((p,i)=>({
  ...p,orderedStep:i+1,sourceFileCount:p.files.length,
  riskyFiles:p.files.filter(path=>path.startsWith("supabase/migrations/")&&categories.has(path.split("/").at(-1)))
    .map(path=>({path,categories:categories.get(path.split("/").at(-1))})),
  reviewRequired:true,requiresPreviousPhaseReview:i>0,
  mayExecuteAutomatically:false,applied:false
 }));
 const requiredExtensions=["pgcrypto","pgmq","pg_cron","pg_net"];
 const missingExtensions=requiredExtensions.filter(x=>!extensions.includes(x));
 const hazards=risks.byCategory;
 const actions=[
  "Confirm backups AND a tested restore path on the isolated project.",
  "Review every flagged migration, routine privilege and service-role grant.",
  "Prevent scheduling, net.http calls and external provider sends during staging setup.",
  "Review pgmq, pg_cron and pg_net extension policy before enabling.",
  "Reconcile live schema, migration ledger and RLS canary before any SQL changes.",
  "Install in separately approved phases, inspect after each phase, then stop on discrepancies.",
  "Deploy Edge only with verified staging-only secrets and real Auth/JWT tests."
 ];
 return {ok:true,kind:"four_stage_staging_install_sequence_v3202",
  projectRef:STAGING_REF,source,observedAt,
  migrationCount:sorted.length,expectedFileCount:sorted.length+1,
  phases,missingExtensions,riskCategoryCounts:hazards,
  blockers:[...missingExtensions.map(x=>"extension_review:"+x),
   "backup_and_restore_not_verified",
   "full_risk_review_not_signed",
   "explicit_separate_owner_install_approval_missing",
   "no_authenticated_customer_evidence"],
  operatorActions:actions,canaryRemainsRequired:true,
  packageVerified,stagingAlreadyInstalled:false,
  safeToApplyWithoutHumanApproval:false,
  automaticSqlExecution:false,installationAuthorised:false,
  migrationsApplied:0,databaseWrites:0,
  permissionToDeployEdge:false,realJwtIsolationProven:false,
  noProviderRequests:true,productionTouched:false};
}
export {CANARY_LEDGER,prepareStagingInstallSequence};
