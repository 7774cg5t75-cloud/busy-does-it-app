/**
 * V3.187 offline gate snapshot. This script makes NO network requests and
 * cannot install extensions or apply SQL. Observed hosted project facts are
 * explicitly a point-in-time baseline and must be independently rechecked.
 */
import {verifyStagingPackage} from "./verify-staging-install-v3186.mjs";
import {createStagingExecutionGate} from "../src/core/isolatedStagingRunbookV3187.mjs";
const manifest=verifyStagingPackage();
if(!manifest.ok)throw Error("Staging manifest rejected; stop without installation.");
const gate=createStagingExecutionGate({
 projectRef:"pnjdlogwegnqbsfpcofw",
 projectHealthy:true,canaryPresent:true,
 publicAppTables:0,edgeFunctionCount:0,
 extensions:{pgcrypto:true,pgmq:false,pg_cron:false,pg_net:false},
 checks:{migration_integrity:true,
   sql_side_effect_review:false,rollback_restore_test:false,
   auth_role_contract:false,migration_ledger_reconciled:false,
   edge_secrets_isolated:false,owner_authorisation:false}
});
const snapshot={
 kind:"offline_v3187_hosted_staging_preflight_snapshot",
 observedAsOf:"2026-10-12",
 requiresFreshIndependentConfirmation:true,
 projectName:"Busy Does It Staging",
 manifestFileCount:manifest.packageFiles,
 manifestMigrations:manifest.migrationCount,
 packageIntegrityPassed:manifest.ok,
 review:gate,
 noCredentialsAccessed:true,noNetworkAccess:true,
 stagingSQLApplied:false,edgeDeployed:false,productionTouched:false
};
console.log(JSON.stringify(snapshot,null,2));
if(!gate.ok)process.exitCode=1;
