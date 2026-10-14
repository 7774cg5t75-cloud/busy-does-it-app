/**
 * V3.231: non-executable two-real-business Auth/JWT acceptance matrix.
 * This does NOT create users/tokens, connect to Supabase or bypass consent.
 * A future operator must separately approve and execute every live probe.
 */
import {readFileSync,readdirSync,mkdirSync,writeFileSync} from "node:fs";
import {createHash} from "node:crypto";
const read=p=>readFileSync(p,"utf8");
const old=JSON.parse(read("staging/recorded-readonly-observation-v3220.json"));
if(old.projectRef!=="pnjdlogwegnqbsfpcofw"||
 old.projectName!=="Busy Does It Staging"||
 old.publicTables.join(",")!=="busy_staging_rls_canary"||
 old.appliedMigrations.join(",")!=="20261010224121,20261010224205")
 throw Error("Historical staging canary mismatch; stop for live attestation.");
const migrations=readdirSync("supabase/migrations").filter(n=>n.endsWith(".sql")).sort();
if(migrations.length!==69||
 !migrations.at(-1).includes("v3_232_scoped_booking_close_revision"))
 throw Error("Unexpected migration dependencies; stop and reconcile.");
const hash=src=>createHash("sha256").update(src).digest("hex");
const critical=[
 "staging/ISOLATED_ONLY_business_core_v3180.sql",
 "supabase/functions/busy-mini-apps/index.ts",
 "supabase/functions/busy-mini-app-guest/index.ts",
 "supabase/functions/busy-mini-apps/ownerRequestFreshnessV3231.mjs"
].map(path=>({path,sha256:hash(read(path))}));
const scenarios=[
 ["real_owner_a","Signed-in owner A can read their own exact request"],
 ["owner_b_blocked","Owner B JWT cannot see or alter A's request"],
 ["owner_a_blocked","Owner A JWT cannot see or alter B's request"],
 ["staff_permission","Authenticated staff without owner/admin permission cannot perform owner-only writes"],
 ["revoked_member","Previously authorised membership revocation immediately denies access using a real JWT"],
 ["stale_click","Two genuine owner sessions cannot overwrite an updated request with stale timestamp"],
 ["retry_after_timeout","Lost HTTP response is reconciled by owner-only readback; no double write"],
 ["guest_receipt","Original public guest receipt sees only its own request; other browser token denied"],
 ["write_outbox","One original request corresponds to one durable tenant-scoped outbox intent"],
 ["rollback_and_restore","Actual separate backup and disposable restore demonstrated"],
 ["side_effects_disabled","Push, receipt workers, cron/network jobs and paid builds remain disabled"]
].map(([id,description])=>({id,description,
 status:"not_verified",requiresRealAuthJwt:true,sourceOnly:true}));
const packet={kind:"v3231_real_auth_two_tenant_verification_plan",
 expectedProjectRef:old.projectRef,expectedProjectName:old.projectName,
 historicalCanaryOnly:true,remoteProjectRecheckedByThisScript:false,
 versionedMigrationCount:migrations.length,
 sourceFiles:critical,scenarios,
 approvedForInstall:false,approvedForLiveAuthTest:false,
 actualAccountsCreated:false,realJwtTested:false,
 backupRestored:false,sqlExecuted:false,providerContacted:false,
 userDataTouched:false,mayDeploy:false,maySend:false,
 notes:"Scenario statuses may be changed only after separately approved real authenticated testing with dated evidence. SQL role switches or synthetic tenant IDs are insufficient."
};
const dir="/tmp/bdi-v3231-real-auth-review";
mkdirSync(dir,{recursive:true});
writeFileSync(dir+"/two-business-plan.json",JSON.stringify(packet,null,2)+"\n");
console.log("V3.231: "+scenarios.length+" genuine JWT/tenant scenarios prepared, NOT run; hosted staging unchanged.");
