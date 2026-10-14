/**
 * Prepare a precise, READ-ONLY approval review packet for isolated staging.
 * This script never connects to Supabase or executes any SQL. Historical
 * catalog snapshot is NOT an authorisation or current remote verification.
 */
import {readFileSync,readdirSync,mkdirSync,writeFileSync} from "node:fs";
import {createHash} from "node:crypto";
const read=p=>readFileSync(p,"utf8");
const snapshot=JSON.parse(read("staging/recorded-readonly-observation-v3220.json"));
if(snapshot.projectRef!=="pnjdlogwegnqbsfpcofw"||
 snapshot.projectName!=="Busy Does It Staging"||
 snapshot.publicTables.join(",")!=="busy_staging_rls_canary"||
 snapshot.appliedMigrations.join(",")!==
 "20261010224121,20261010224205")
 throw Error("Historical snapshot changed; STOP and independently reconcile staging.");
const sqlFiles=readdirSync("supabase/migrations").filter(x=>x.endsWith(".sql")).sort();
if(sqlFiles.length!==68||
 !sqlFiles.includes("20261014151000_v3_226_guest_notification_intent.sql")||
 !sqlFiles.includes("20261014170000_v3_227_guest_alert_dispatch_leases.sql"))
 throw Error("Staging migration inventory changed; inspect all dependencies.");
const digest=s=>createHash("sha256").update(s).digest("hex");
const paths=[
 "staging/ISOLATED_ONLY_business_core_v3180.sql",
 "supabase/migrations/20261007082234_v3_39_busy_apps_marketplace_foundation.sql",
 "supabase/migrations/20261007161000_v3_45_guest_mini_app_requests.sql",
 "supabase/migrations/20261014151000_v3_226_guest_notification_intent.sql",
 "supabase/migrations/20261014170000_v3_227_guest_alert_dispatch_leases.sql"
];
const packet={
 kind:"isolated_staging_approval_review_v3227",
 actualProjectRef:snapshot.projectRef,
 observedAt:snapshot.observedAt,
 latestReadOnlyObservationNotAuthenticatedByThisScript:true,
 sourceInventory:{migrationFileCount:sqlFiles.length,
  pinnedReferences:paths.map(p=>({path:p,sha256:digest(read(p))}))},
 dependencies:["Existing staging-only business and membership baseline",
   "BUSY mini-app versioned core, customer request/event/inbox schema",
   "Guest challenge and original transactional guest request RPC",
   "V3.226 pending intent trigger",
   "V3.227 service-role-only atomic claim/complete/review functions"],
 beforeAnyInstallation:[
  "Independently verify exact staging project ref, schema/catalogue and current ledger using approved credentials",
  "Review ALL dependent migrations, functions, grants, RLS, triggers, extensions and external/cron side effects",
  "Prove source SHA parity and prepare reviewed exact phase-scoped migration plan",
  "Obtain real non-production backup, test disposable restore and safe recoverability",
  "Test real signed-in owner A, owner B, staff and revoked-tenant JWT permissions",
  "Obtain owner's separate explicit approval for precisely this isolated staging installation",
  "Keep dispatcher disabled and unscheduled until separately authorised provider tests"],
 afterApprovedInstall:[
  "Test actual guest challenge -> original stored request -> audit event -> one pending intent",
  "Verify replay/changed submission does not duplicate request, events or intent",
  "Verify owner-only inbox scopes and private RLS with real tokens",
  "Test single-worker claim and recorded definitive/uncertain outcomes with provider tests disabled",
  "Re-read saved row and receipt; never claim notification delivered from push acceptance"],
 sourceOnly:true,ownerApprovalRecorded:false,canExecute:false,
 actualStagingMigrationApplied:false,backupRestoreVerified:false,
 realTenantJwtTested:false,dispatcherEnabled:false,providerCallsMade:false,
 rollbackSqlGenerated:false,customerRowsRead:false
};
const target="/tmp/bdi-v3227-staging-gates";
mkdirSync(target,{recursive:true});
writeFileSync(target+"/approval-review.json",JSON.stringify(packet,null,2)+"\n");
console.log("V3.227 isolated staging review prepared: 68 migration SHA gates, NO SQL execution, no approval.");
