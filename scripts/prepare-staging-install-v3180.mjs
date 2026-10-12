/**
 * Offline, deterministic installation package for the ONE approved isolated
 * staging project. NO CLI deployment / Supabase SDK / network / credentials.
 * Manual DBA approval and live project identity verification are still required.
 */
import {readdirSync,readFileSync,mkdirSync,writeFileSync,copyFileSync} from "node:fs";
import {join,resolve} from "node:path";
import {createHash} from "node:crypto";
import {fileURLToPath} from "node:url";
import {analyseStagingMigrations} from "../src/core/stagingMigrationPlan.mjs";
import {reviewMigrationSideEffects} from "../src/core/stagingMigrationRiskV3184.mjs";
const root=fileURLToPath(new URL("../",import.meta.url));
const source=join(root,"supabase/migrations");
const dest=resolve(process.argv[2]||"/tmp/bdi-isolated-staging-v3180");
if(process.argv.length>3||process.argv.some(x=>/^--/.test(x)))
 throw Error("Offline package only. Flags, applying migrations and project switching are not supported.");
const baseline="staging/ISOLATED_ONLY_business_core_v3180.sql";
const names=readdirSync(source).filter(n=>n.endsWith(".sql")).sort();
const migrations=names.map(name=>({name,sql:readFileSync(join(source,name),"utf8")}));
const report=analyseStagingMigrations(migrations,{existingTables:["busy_businesses","busy_business_memberships"]});
if(!report.ok||report.violations.length||names.length<59)
 throw Error("Migration prerequisites unresolved. Stop, do not deploy.");
const safety=reviewMigrationSideEffects(migrations);
if(!safety.ok)throw Error(safety.reason);
const sha=s=>createHash("sha256").update(s).digest("hex");
const entries=[baseline,...names.map(n=>"supabase/migrations/"+n)].map((path,i)=>{
 const content=readFileSync(join(root,path),"utf8");
 return {order:i+1,path,sha256:sha(content),bytes:Buffer.byteLength(content)};
});
mkdirSync(dest,{recursive:true});
const ordered=join(dest,"sql");
mkdirSync(ordered,{recursive:true});
for(const item of entries){
 const number=String(item.order).padStart(3,"0");
 const name=number+"_"+item.path.split("/").at(-1);
 copyFileSync(join(root,item.path),join(ordered,name));
}
const manifest={
 kind:"isolated_staging_package_v3180",projectRef:"pnjdlogwegnqbsfpcofw",
 immutableProjectRef:true,productionProjectExcluded:true,
 includesBaseline:true,migrationCount:names.length,files:entries,
 reviewSignals:safety.filesWithReviewSignals,
 reviewCategories:safety.byCategory,
 fullMigrationReviewStillRequired:true,
 completeCleanStagingInstallNotYetRehearsed:true,
 installMustBeManuallyApproved:true,automaticSqlExecution:false,
 edgeDeploymentsIncluded:false,realPostgresRlsAuditOutstanding:true,
 noSecretsInPackage:true,sourceVerifiedAgainstGitWorkingTreeOnly:true
};
writeFileSync(join(dest,"manifest.json"),JSON.stringify(manifest,null,2)+"\n");
writeFileSync(join(dest,"review-signals.json"),JSON.stringify(safety,null,2)+"\n");
writeFileSync(join(dest,"README.txt"),[
 "BUSY DOES IT — ISOLATED STAGING PACKAGE V3.180",
 "Target only after independent verification: pnjdlogwegnqbsfpcofw",
 "Never apply to production. Requires explicit approval before ANY SQL.",
 "Read docs/V3_180_STAGING_AND_ATOMIC_BOOKINGS.md before applying.",
 "Files in sql/ are ordered deterministically, beginning with the missing business core.",
 "Each content SHA256 is recorded in manifest.json; verify the target's existing",
 "migration ledger, extensions/roles, backup plan, RLS, functions and auth first.",
 "This generator neither connects to nor changes Supabase. It does not deploy Edge.",
 "DO NOT blindly execute all files. Schedule/version differences require review.",
 "V3.184 review-signals.json lists migrations that may touch privileges,",
 "scheduled workers, network IO, credentials or destructive operations.",
 "The presence or absence of flags is NOT a complete SQL/security review."
].join("\n")+"\n");
console.log(JSON.stringify({status:"PREPARED_NOT_APPLIED",
 projectRef:manifest.projectRef,migrations:names.length,totalFiles:entries.length,
 missingDependencies:report.missingBaseline,packageDirectory:dest,
 applied:false,deployed:false,productionTouched:false}));
