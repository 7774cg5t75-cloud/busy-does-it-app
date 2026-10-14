/**
 * V3.229: first-phase isolated staging review packet, not an installer.
 * Only inspects pinned SOURCE and the historical read-only canary record.
 * The connected project must be freshly rechecked by a separate approved
 * operator before any phase-specific installation request.
 */
import {readFileSync,readdirSync,mkdirSync,writeFileSync} from "node:fs";
import {createHash} from "node:crypto";
const read=p=>readFileSync(p,"utf8");
const hash=s=>createHash("sha256").update(s).digest("hex");
const obs=JSON.parse(read("staging/recorded-readonly-observation-v3220.json"));
if(obs.projectRef!=="pnjdlogwegnqbsfpcofw"||
 obs.projectName!=="Busy Does It Staging"||
 obs.publicTables.join(",")!=="busy_staging_rls_canary"||
 obs.appliedMigrations.join(",")!=="20261010224121,20261010224205")
 throw Error("Recorded canary changed: stop, no approval implied.");
const files=readdirSync("supabase/migrations").filter(x=>x.endsWith(".sql")).sort();
if(files.length!==69||!files.at(-1).includes("v3_232_scoped_booking_close_revision"))
 throw Error("Phase dependencies drifted: inspect new migrations first.");
const baselinePath="staging/ISOLATED_ONLY_business_core_v3180.sql";
const baseline=read(baselinePath);
for(const required of [
 "create extension if not exists pgcrypto",
 "create table if not exists public.busy_businesses",
 "create table if not exists public.busy_business_memberships",
 "public.busy_businesses force row level security",
 "public.busy_business_memberships force row level security",
 "from public,anon,authenticated",
 "to service_role"
])if(!baseline.toLowerCase().includes(required.toLowerCase()))
 throw Error("Phase-one SQL privilege/RLS contract changed: "+required);
const candidate=baseline.replace(/--[^\n]*/g,"");
if(/(?:cron\.schedule|net\.http_post|http\.post)\s*\(/i.test(candidate))
 throw Error("Staging baseline unexpectedly invokes background/network work.");
const stageOnly={
 kind:"v3229_phase_one_source_review",
 targetRef:obs.projectRef,targetName:obs.projectName,
 source:{path:baselinePath,sha256:hash(baseline),
  bytes:Buffer.byteLength(baseline),
  proposedObjects:["busy_businesses","busy_business_memberships"],
  explicitServiceRoleOnly:true,usesRealAuthUsersReference:true,
  requiresPgcryptoReview:true,hasScheduledJobs:false,
  hasProviderCalls:false,containsProductionUserRows:false},
 fullHistory:{versionedMigrations:files.length,
  manifestSha256:hash(files.map(name=>name+":"+hash(read("supabase/migrations/"+name))).join("\n")),
  versionedMigrationsNotYetInstalled:true},
 recordedBefore:{tables:obs.publicTables,migrations:obs.appliedMigrations,
  observedAt:obs.observedAt,historicalNotCurrent:true},
 approvalBlocks:[
  "Fresh remote project identity and schema/ledger SELECT-only attestation",
  "Separate review of pgcrypto extension and database privileges",
  "Independent backup AND actual disposable restore demonstration",
  "Real signed-in account A/B and revoked-membership Auth/JWT isolation",
  "Exact first-phase source hash match and explicit owner installation consent",
  "Attest after phase one before independently considering app migrations"
 ],
 status:"PREPARED_NOT_AUTHORISED",
 canExecute:false,ownerApproved:false,
 realBackupRestoreTested:false,realJwtRlsTested:false,
 remoteProjectReadByScript:false,sourceOnly:true,
 SQLExecuted:false,hostedDatabaseChanged:false,
 cronScheduled:false,providerContacted:false,
 productionTouched:false,generatedExecutableInstallSql:false
};
const dest="/tmp/bdi-v3229-phase-one-review";
mkdirSync(dest,{recursive:true});
writeFileSync(dest+"/approval-review.json",JSON.stringify(stageOnly,null,2)+"\n");
console.log("V3.229: original two-table staging phase pinned for review, not installation.");
