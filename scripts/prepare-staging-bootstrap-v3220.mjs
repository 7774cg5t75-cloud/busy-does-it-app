/**
 * V3.220 repeatable zero-network staging bootstrap MANIFEST.
 * Reads ONLY checked-in SQL/source and an explicitly dated metadata snapshot.
 * Writes JSON evidence to a fixed temp path; does NOT copy or execute SQL,
 * call Supabase, deploy Edge, install extensions or expose credentials.
 * Its output is NOT install approval; re-inspect target before any changes.
 */
import {readFileSync,readdirSync,mkdirSync,writeFileSync} from "node:fs";
import {join} from "node:path";
import {fileURLToPath} from "node:url";
import {createHash} from "node:crypto";
import {reconcileStagingBootstrapV3220}
 from "../src/core/stagingBootstrapReconcileV3220.mjs";
import {reviewStagingPhaseV3220}
 from "../src/core/stagingPhaseReadinessV3220.mjs";
const ROOT=fileURLToPath(new URL("../",import.meta.url));
const TARGET="/tmp/bdi-v3220-staging-bootstrap";
if(process.argv.length!==2)throw Error("No command-line parameters, project switching, or apply controls are supported.");
const read=p=>readFileSync(join(ROOT,p),"utf8");
const observation=JSON.parse(read("staging/recorded-readonly-observation-v3220.json"));
const names=readdirSync(join(ROOT,"supabase/migrations"))
 .filter(name=>name.endsWith(".sql")).sort();
if(names.length!==68)throw Error("Source migrations changed. Review new SQL and update explicit test baseline before regenerating.");
const migrations=names.map(name=>({name,sql:read("supabase/migrations/"+name)}));
const baseline=read("staging/ISOLATED_ONLY_business_core_v3180.sql");
const plan=reconcileStagingBootstrapV3220({
 ...observation,migrationFiles:migrations,baseSchemaSql:baseline
});
if(!plan.ok||!plan.canaryCompatible||plan.sourceMigrationCount!==names.length||
 !plan.stagedBaseMissing||plan.stagingInstalled!==false||
 plan.approvedToApply!==false)
 throw Error("Staging source or measured observations are no longer compatible. Stop.");
const sha=s=>createHash("sha256").update(s).digest("hex");
const files=[{path:plan.baseSchemaFile,sha256:sha(baseline),bytes:Buffer.byteLength(baseline)},
 ...migrations.map(m=>({path:"supabase/migrations/"+m.name,
 sha256:sha(m.sql),bytes:Buffer.byteLength(m.sql)}))];
const phaseReviews=plan.phases.map(p=>reviewStagingPhaseV3220({
 plan,phaseId:p.id,proof:{}
}));
if(phaseReviews.some(p=>!p.ok||p.mayApply||p.installationVerified))
 throw Error("A no-execution phase review unexpectedly authorised a change.");
const manifest={
 kind:"v3220_read_only_staging_bootstrap_manifest",
 generatedFrom:"git_worktree_and_stale_recorded_staging_snapshot",
 projectRef:plan.projectRef,observedAt:plan.sourceObservedAt,
 observedStagingContainsOnlyCanary:plan.canaryCompatible,
 stagingProjectIdentityMustBeRechecked:true,
 actualStagingInstallationAttempted:false,
 realBrowserCustomerTestsPerformed:false,
 sourceMigrations:plan.sourceMigrationCount,stagingLedger:observation.appliedMigrations,
 missingExtensions:plan.missingExtensions,
 phases:plan.phases.map(p=>({id:p.id,title:p.title,
  sourceFiles:p.fileCount,flagged:p.flagged,mayApplyAutomatically:false})),
 files,phaseGates:phaseReviews,
 externalProvidersContacted:false,ownerApprovalObtained:false,
 migrationsApplied:0,sqlExecuted:false,edgeDeployed:false,
 productionTouched:false,noSecretsEmbedded:true,
 blockers:[
  "Independently re-read staging identity, migration ledger and RLS canary",
  "Review base business tables vs the actual intended app schema",
  "Review cron, pgmq/pg_net, privileged routines, provider side effects and extension permissions",
  "Review migration-by-migration rollback and test a real backup restore",
  "Obtain separate explicit owner approval for each staging install phase",
  "Run genuine two-tenant Auth/JWT, booking/request, and atomic recovery tests"
 ]
};
mkdirSync(TARGET,{recursive:true});
writeFileSync(join(TARGET,"manifest.json"),JSON.stringify(manifest,null,2)+"\n");
writeFileSync(join(TARGET,"safety-review.json"),JSON.stringify({
 recordedSnapshotNotLive:true,
 canaryCompatible:plan.canaryCompatible,
 sourceRisks:plan.riskCategoryCounts,
 riskySourceFiles:plan.sourceFilesRequiringReview,
 externalSideEffectSourceFiles:plan.filesWithPotentialExternalOrPrivilegedSideEffects,
 stagingSchemaInstalled:false,stagingChangesAuthorised:false,
 action:plan.nextAction
},null,2)+"\n");
console.log(JSON.stringify({status:"PREPARED_NOT_APPLIED",
 projectRef:plan.projectRef,observedAt:plan.sourceObservedAt,
 sourceFiles:files.length,sourceMigrations:names.length,
 phases:plan.phases.map(p=>({id:p.id,count:p.fileCount,flagged:p.flagged.length})),
 missingExtensions:plan.missingExtensions,
 outputPath:TARGET,sqlExecuted:false,remoteCalls:false,ownerApprovalObtained:false}));
