/**
 * V3.228 offline, source-hashed ISOLATED STAGING review.
 * No SQL execution, network calls, schema installation or owner approval.
 */
import {readFileSync,readdirSync,mkdirSync,writeFileSync} from "node:fs";
import {createHash} from "node:crypto";
const read=p=>readFileSync(p,"utf8");
const sha=s=>createHash("sha256").update(s).digest("hex");
const old=JSON.parse(read("staging/recorded-readonly-observation-v3220.json"));
if(old.projectRef!=="pnjdlogwegnqbsfpcofw"||
 old.projectName!=="Busy Does It Staging"||
 old.publicTables.join(",")!=="busy_staging_rls_canary"||
 old.appliedMigrations.join(",")!=="20261010224121,20261010224205")
 throw Error("Historic canary evidence drifted. STOP.");
const names=readdirSync("supabase/migrations").filter(n=>n.endsWith(".sql")).sort();
if(names.length!==67||
 !names.includes("20261014151000_v3_226_guest_notification_intent.sql")||
 !names.includes("20261014170000_v3_227_guest_alert_dispatch_leases.sql"))
 throw Error("Migration dependency inventory drifted. STOP.");
const risk=[
 ["scheduler",/cron\.schedule\s*\(/i],
 ["network",/(?:net\.http_post|http\.post)\s*\(/i],
 ["destructive",/\b(?:drop|truncate|security\s+definer)\b/i],
 ["extensions",/create\s+extension/i],
 ["permission_review",/\b(?:grant|revoke|create\s+policy)\b/i]
];
const entry=path=>{
 const source=read(path);
 const withoutComments=source.replace(/--[^\n]*/g,"");
 return {path,sha256:sha(source),bytes:Buffer.byteLength(source),
  heuristicRisks:risk.filter(([,regex])=>regex.test(withoutComments))
   .map(([name])=>name)};
};
const migrations=names.map(n=>entry("supabase/migrations/"+n));
const critical=[
 "staging/ISOLATED_ONLY_business_core_v3180.sql",
 "supabase/functions/busy-mini-app-guest/index.ts",
 "supabase/functions/busy-mini-apps/index.ts",
 "supabase/functions/busy-mini-app-guest-alert-dispatch/index.ts",
 "supabase/functions/busy-mini-app-guest-alert-dispatch/dispatchReceiptV3227.mjs",
 "supabase/functions/busy-mini-apps/ownerNextStepV3228.mjs",
 "src/screens/miniApps.js"
].map(entry);
const packet={
 kind:"v3228_source_review_only",projectExpected:old.projectRef,
 historicalObservedAt:old.observedAt,historicalOnly:true,
 completeMigrationCount:migrations.length,migrations,critical,
 gates:{
  freshProjectIdentitySchemaAndLedger:false,
  allDependenciesExtensionsCronPrivilegesReviewed:false,
  exactMigrationHashesAndPhaseScopeApproved:false,
  realBackupAndRestoreVerified:false,
  twoRealTenantJwtRlsVerified:false,
  guestBrowserToOwnerInboxVerified:false,
  specificOwnerInstallApproval:false,
  providerReceiptsVerified:false
 },
 sourceOnly:true,canInstall:false,approvalGranted:false,
 actualSqlExecuted:false,hostedProjectModified:false,
 dispatcherEnabled:false,providerContacted:false,
 paidBuildRequested:false,productionTouched:false,
 noExecutableRollbackGenerated:true
};
const output="/tmp/bdi-v3228-staging-review";
mkdirSync(output,{recursive:true});
writeFileSync(output+"/source-manifest.json",JSON.stringify(packet,null,2)+"\n");
console.log("V3.228: hashed all 67 migrations plus seven critical files; no hosted side effects.");
