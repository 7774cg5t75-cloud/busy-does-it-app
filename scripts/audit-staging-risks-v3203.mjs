/**
 * Offline V3.203 migration risk register. No network, DB, provider access,
 * credentials, SQL execution, or automatic sanitisation.
 */
import {readFileSync,readdirSync,writeFileSync} from "node:fs";
import {join} from "node:path";
import {fileURLToPath} from "node:url";
import {verifyStagingPackage} from "./verify-staging-install-v3186.mjs";
import {compileMigrationRiskLedger} from "../src/core/stagingSqlRiskLedgerV3203.mjs";
const root=fileURLToPath(new URL("../",import.meta.url));
const target="/tmp/bdi-isolated-staging-v3180";
const verified=verifyStagingPackage(target);
if(!verified.ok)throw Error("Integrity of staging package not proven; stop.");
const names=readdirSync(join(root,"supabase/migrations"))
 .filter(n=>n.endsWith(".sql")).sort();
const items=names.map(name=>({
 name,sql:readFileSync(join(root,"supabase/migrations",name),"utf8")
}));
const ledger=compileMigrationRiskLedger(items);
if(!ledger.ok||ledger.fileCount!==verified.migrationCount)
 throw Error("Complete staging migration risk review failed.");
writeFileSync(join(target,"v3203-sql-risk-register.json"),
 JSON.stringify({...ledger,offlineInspectionOnly:true,
  packageVerified:true,requiresSeparateOperatorApproval:true},null,2)+"\n");
console.log(JSON.stringify({kind:ledger.kind,status:"REVIEW_REQUIRED_NOT_APPLIED",
 reviewedMigrations:ledger.fileCount,flaggedFiles:ledger.filesFlagged,
 sideEffectSensitive:ledger.sideEffectSensitiveFiles,categories:ledger.categories,
 operatorApprovalObtained:false,sqlExecuted:0,productionChanged:false}));
