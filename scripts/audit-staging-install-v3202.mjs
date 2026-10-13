/**
 * V3.202: build an operator-readable, OFFLINE staging install sequence.
 * Dated observation is evidence from the read-only inspection previously
 * performed. This script NEVER refreshes it or contacts Supabase.
 */
import {readFileSync,readdirSync,writeFileSync,mkdirSync} from "node:fs";
import {join} from "node:path";
import {fileURLToPath} from "node:url";
import {verifyStagingPackage} from "./verify-staging-install-v3186.mjs";
import {prepareStagingInstallSequence}
 from "../src/core/stagingInstallSequenceV3202.mjs";
const ROOT=fileURLToPath(new URL("../",import.meta.url));
const DEST="/tmp/bdi-isolated-staging-v3180";
const observation=JSON.parse(readFileSync(join(ROOT,
 "staging/recorded-readonly-observation-v3202.json"),"utf8"));
const packageCheck=verifyStagingPackage(DEST);
if(!packageCheck.ok)throw Error("The offline migration package differs from source. Stop.");
const migrations=readdirSync(join(ROOT,"supabase/migrations"))
 .filter(n=>n.endsWith(".sql")).sort()
 .map(name=>({name,sql:readFileSync(join(ROOT,"supabase/migrations",name),"utf8")}));
const baselineSql=readFileSync(join(ROOT,"staging/ISOLATED_ONLY_business_core_v3180.sql"),"utf8");
const report=prepareStagingInstallSequence({
 ...observation,migrations,baselineSql,packageVerified:packageCheck.ok
});
if(!report.ok)throw Error("Staging installation dependency report blocked: "+report.reason);
mkdirSync(DEST,{recursive:true});
writeFileSync(join(DEST,"v3202-operator-sequence.json"),
 JSON.stringify({...report,
  observationFromRecordedFile:true,requiresFreshReadOnlyInspection:true,
  realInstallationNotAttempted:true},null,2)+"\n");
console.log(JSON.stringify({
 kind:report.kind,status:"OFFLINE_PLAN_ONLY",
 target:report.projectRef,recordedAt:report.observedAt,
 packageFiles:report.expectedFileCount,phases:report.phases.map(p=>({
 id:p.id,files:p.sourceFileCount,riskyFiles:p.riskyFiles.length
 })),missingExtensions:report.missingExtensions,
 blockingItems:report.blockers.length,installAuthorised:false,
 stagedSqlApplied:0,customerRequestsSent:0,productionTouched:false
}));
