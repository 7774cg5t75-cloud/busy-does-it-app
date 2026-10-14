/**
 * V3.223 — offline recovery MATRIX, not automatic rollback SQL.
 * Neither DROP TABLE ... CASCADE nor a partial-install cleanup is safe
 * without genuine backup, reviewed dependencies, owner approval and
 * independently authenticated staging state.
 */
import {inspectFirstStagingPhaseV3222}
 from "./stagingFirstPhaseEvidenceV3222.mjs";
const TABLES=["busy_businesses","busy_business_memberships"];
const deny=reason=>({ok:false,reason,automaticRollbackAllowed:false,
 mayApply:false,mayDropTables:false,restoreVerified:false,
 anyDatabaseTouched:false});
function assessPhaseOneRecoveryV3223({
 before=null,after=null,baselineSql="",backupRestored=false,
 ownerReviewed=false,operatorConfirmed=false
}={}){
 if(!before||!after||typeof before!=="object"||typeof after!=="object")
  return deny("Read-only before/after catalogues are needed to plan any phase-one recovery.");
 const a=inspectFirstStagingPhaseV3222({...before,baselineSql});
 const b=inspectFirstStagingPhaseV3222({...after,baselineSql});
 if(!a.ok||!b.ok||a.projectRef!==b.projectRef||
    a.projectRef!=="pnjdlogwegnqbsfpcofw")
  return deny("Source metadata is missing, ambiguous or not the same isolated staging project.");
 const tableSet=new Set(after.publicTables);
 const installed=TABLES.filter(x=>tableSet.has(x));
 const introduced=installed.filter(x=>!before.publicTables.includes(x));
 const vanished=TABLES.filter(x=>before.publicTables.includes(x)&&!tableSet.has(x));
 const ledgerChanged=JSON.stringify([...before.migrationLedger].sort())!==
   JSON.stringify([...after.migrationLedger].sort());
 const unchanged=JSON.stringify([...before.publicTables].sort())===
    JSON.stringify([...after.publicTables].sort())&&!ledgerChanged;
 const uncertain=!a.canaryIntact||!b.canaryIntact||
   a.partialBase||b.partialBase||b.unexpectedTables.length>0||
   b.unexpectedLedger.length>0||vanished.length>0;
 const status=uncertain?"halt_and_preserve_evidence":
   unchanged?"no_observed_schema_change":
   installed.length===2&&introduced.length===2?
     "candidate_phase_one_schema_needs_db_validation":"manual_investigation_required";
 return {ok:true,kind:"staging_phase_one_recovery_v3223",
  projectRef:a.projectRef,status,
  observedIntroducedTables:introduced,observedMissingTables:vanished,
  migrationLedgerChanged:ledgerChanged,
  sourceCanaryIntact:a.canaryIntact&&b.canaryIntact,
  rollbackShouldBeHumanReviewed:status!=="no_observed_schema_change",
  requestedRestoreClaimReported:backupRestored===true,
  ownerReviewClaimReported:ownerReviewed===true,
  operatorClaimReported:operatorConfirmed===true,
  // Even a caller claiming a restore does not verify real backup integrity.
  backupRestoredByThisFunction:false,
  independentlyQueriedStaging:false,
  SQLExecuted:false,restoreVerified:false,
  automaticRollbackAllowed:false,mayApply:false,
  mayDropTables:false,mayRunDropCascade:false,
  actualRlsProven:false,ownerApprovalVerified:false,
  customerRecordsRead:false,anyDatabaseTouched:false,
  nextAction:uncertain?
   "STOP: preserve logs and known-good backup; independently investigate partial schema, canary, ledger and tenant isolation.":
   unchanged?
   "No schema change appears in the supplied snapshots; independently confirm target state.":
   "Review all FK dependencies, owner/tenant access, backup restore and staged request tests before considering rollback or another phase."};
}
export {assessPhaseOneRecoveryV3223};
