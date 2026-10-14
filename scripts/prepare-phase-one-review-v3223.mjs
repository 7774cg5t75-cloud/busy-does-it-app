/**
 * V3.223 OFFLINE source/rollback rehearsal packet.
 * Reads immutable repository SQL references and the already-dated staging
 * metadata snapshot. No Supabase connection, SQL execution, CREATE/DROP,
 * storage of secrets, actual restore, tenant login or deployment.
 * This generated JSON is NOT an approval, rollback script or migration.
 */
import {readFileSync,mkdirSync,writeFileSync} from "node:fs";
import {fileURLToPath} from "node:url";
import {join} from "node:path";
import {createHash} from "node:crypto";
import {inspectStagingBusinessParityV3223}
 from "../src/core/stagingBusinessParityV3223.mjs";
import {assessPhaseOneRecoveryV3223}
 from "../src/core/stagingPhaseOneRecoveryV3223.mjs";
const root=fileURLToPath(new URL("../",import.meta.url));
const read=p=>readFileSync(join(root,p),"utf8");
const staging=JSON.parse(read("staging/recorded-readonly-observation-v3220.json"));
const baseline=read("staging/ISOLATED_ONLY_business_core_v3180.sql");
const bridge=read("supabase/schema/v3_25_production_bridge.sql");
const parity=inspectStagingBusinessParityV3223({
 baselineSql:baseline,bridgeSql:bridge
});
if(!parity.ok||!parity.sourceCompatible||parity.mayApply!==false)
 throw Error("Source parity or installation denial failed. Stop.");
const before={
 projectRef:staging.projectRef,projectName:staging.projectName,
 catalogueSource:"connector_read_only_pg_catalog",observedAt:staging.observedAt,
 publicTables:staging.publicTables,
 migrationLedger:staging.appliedMigrations
};
const expectedAfter={
 ...before,
 // SYNTHETIC shape only. Never present it as database evidence.
 publicTables:[...before.publicTables,"busy_businesses","busy_business_memberships"]
};
const outcome=assessPhaseOneRecoveryV3223({
 before,after:expectedAfter,baselineSql:baseline
});
if(!outcome.ok||outcome.mayApply||outcome.mayDropTables||
 outcome.status!=="candidate_phase_one_schema_needs_db_validation")
 throw Error("The modelled two-table before/after recovery contract changed.");
const sha=s=>createHash("sha256").update(s).digest("hex");
const target="/tmp/bdi-v3223-phase-one-review";
const packet={
 kind:"read_only_phase_one_rehearsal_packet_v3223",
 targetProject:staging.projectRef,
 snapshotDate:staging.observedAt,
 snapshotIsStaleUntilIndependentlyRefreshed:true,
 comparedProductionSourceSchema:false,
 projectCredentialsNotUsed:true,productionDataNotCopied:true,
 baseline:{file:parity.baselinePath,sha256:sha(baseline),bytes:Buffer.byteLength(baseline),
  expectedColumns:parity.baselineColumns},
 historicalBridge:{file:parity.bridgePath,sha256:sha(bridge),
  sourceReferenceOnly:true,neverApplyAsStagingBaseline:true,
  sensitiveFieldsListedByNameOnly:parity.sensitiveFieldsFoundInBridge},
 simulatedTargetStateOnly:expectedAfter.publicTables,
 hypotheticalRecoveryStatus:outcome.status,
 testMatrix:[
  "Clean untouched canary-only staging: document and verify exact baseline owner approval",
  "Unexpected or partially created business/member tables: stop and preserve data",
  "Canary ledger mismatch or added migration: stop and reconcile source with staging",
  "Disaster restore rehearsal: use independently isolated disposable database and tested backup",
  "Check real owner and foreign tenant JWTs, membership revocation and row policies",
  "Review all privileged functions, extension needs, side effects, migration ledger and rollback"
 ],
 ephemeralDatabaseCreated:false,
 restoreTested:false,ownerApprovalObtained:false,
 sqlGeneratedForExecution:false,sqlExecuted:false,
 productionTouched:false,phaseOneApplied:false,
 mayApply:false,automaticRollbackAllowed:false,
 noCustomerIdentityIncluded:true
};
mkdirSync(target,{recursive:true});
writeFileSync(join(target,"review-packet.json"),JSON.stringify(packet,null,2)+"\n");
console.log(JSON.stringify({
 status:"SOURCE_ONLY_REHEARSAL_NO_DATABASE",
 projectRef:packet.targetProject,
 sourceCompatible:parity.sourceCompatible,
 hypotheticalRecoveryStatus:outcome.status,
 sourceHash:packet.baseline.sha256,
 packetPath:target,sqlExecuted:false,restoreTested:false,
 phaseOneApplied:false,ownerApprovalObtained:false
}));
