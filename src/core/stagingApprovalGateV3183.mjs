/**
 * V3.183 isolated staging readiness decision.
 * Pure function: never connects to a database, enables extensions, writes a
 * customer record, or deploys services. User-provided observations are NOT
 * real authenticated evidence until independently verified outside this file.
 */
const EXPECTED="pnjdlogwegnqbsfpcofw";
const EXT=["pgcrypto","pgmq","pg_cron","pg_net"];
function assessStagingInstallationReadiness({
 projectRef="",projectHealthy=false,canaryPreserved=false,
 backupVerified=false,migrationReviewComplete=false,
 authRolesReviewed=false,extensions={},ownerApprovedInstall=false,
 coreTablesAlreadyInstalled=false,edgeFunctionsInstalled=false
}={}){
 if(typeof extensions!=="object"||!extensions||Array.isArray(extensions))
  return {ok:false,reason:"Pass a bounded extensions observation object."};
 const flags={
  targetIsolatedProject:projectRef===EXPECTED,
  projectHealthy:projectHealthy===true,
  canaryPreserved:canaryPreserved===true,
  backupVerified:backupVerified===true,
  migrationReviewComplete:migrationReviewComplete===true,
  authRolesReviewed:authRolesReviewed===true,
  explicitOwnerApproval:ownerApprovedInstall===true,
  requiredExtensions:EXT.every(x=>extensions[x]===true)
 };
 const blockers=Object.entries(flags).filter(([,ok])=>!ok).map(([name])=>name);
 const missingExtensions=EXT.filter(name=>extensions[name]!==true);
 const authorisedForInstallation=blockers.length===0;
 return {ok:true,kind:"isolated_staging_install_gate_v3183",
  intendedProjectRef:EXPECTED,observedProjectRef:projectRef,
  blockers,missingExtensions,
  installedApplicationTablesObserved:coreTablesAlreadyInstalled===true,
  installedEdgeFunctionsObserved:edgeFunctionsInstalled===true,
  reviewedPrerequisites:authorisedForInstallation,
  // A boolean supplied here is not an independently audited grant of access.
  installationExecuted:false,realStagingAuthVerified:false,
  externalProviderReceiptsVerified:false,
  noAutomaticInstallation:true,noAutomaticDestructiveRollback:true,
  productionProjectMayBeUsed:false,
  requiresIndependentlyConfirmedProjectIdentity:true,
  requiresHumanExecutionAfterSeparateApproval:true};
}
export {assessStagingInstallationReadiness};
