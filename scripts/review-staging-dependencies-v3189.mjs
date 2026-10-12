/**
 * V3.189 offline staging dependency review.
 * No database, cloud credentials, SQL execution, Edge deployment or changes.
 * Review signals indicate work for a human; not confirmed vulnerabilities.
 */
import {readFileSync} from "node:fs";
import {verifyStagingPackage} from "./verify-staging-install-v3186.mjs";
const folder="/tmp/bdi-isolated-staging-v3180";
const integrity=verifyStagingPackage(folder);
if(!integrity.ok)throw Error("Offline package differs from repository; stop.");
const signals=JSON.parse(readFileSync(folder+"/review-signals.json","utf8"));
const categories=["extension_setup","scheduled_work","network_io",
 "secret_or_key_access","privileged_routines","privileges_or_policies",
 "data_or_schema_destructiveness"];
if(signals.ok!==true||signals.migrationCount!==integrity.migrationCount||
 categories.some(key=>!Number.isSafeInteger(signals.byCategory?.[key])))
 throw Error("Migration dependency report incomplete; stop.");
const reviewed=signals.findings.filter(f=>f.needsHumanReview);
if(reviewed.length!==signals.filesWithReviewSignals)
 throw Error("Human-review file count differs; stop.");
const report={kind:"v3189_isolated_staging_dependency_handover",
 expectedProjectRef:"pnjdlogwegnqbsfpcofw",
 packageIntegrityVerified:true,sqlFilesInPackage:integrity.packageFiles,
 migrationCount:integrity.migrationCount,
 reviewSignalFiles:reviewed.length,reviewCategories:signals.byCategory,
 requiredExtensions:["pgcrypto","pgmq","pg_cron","pg_net"],
 lastObservedInstalledExtensions:["pgcrypto"],
 observationDate:"2026-10-12",freshHostedInspectionPerformed:false,
 reviewRequiredBeforeApply:[
  "Recheck project identity and migration ledger at the time of installation",
  "Read every flagged SQL file, including grants, scheduled jobs and external requests",
  "Confirm pgmq/pg_cron/pg_net permissions and scheduling side effects",
  "Verify isolated-only environment variables, provider callbacks and account access",
  "Prove a recoverable backup and restore without damaging the existing canary",
  "Test authenticated two-tenant Auth/JWT routing after explicit staging installation approval"
 ],manualApprovalObtained:false,installAuthorised:false,
 installAttempted:false,sqlExecuted:false,edgeDeployed:false,
 productionChanged:false,independentJwtTestPassed:false};
console.log(JSON.stringify(report,null,2));
export {report};
