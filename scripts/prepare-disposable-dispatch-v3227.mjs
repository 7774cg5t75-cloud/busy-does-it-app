/**
 * CI-only assembly from V3.226 real guest-RPC+outbox transaction,
 * plus original V3.227 migration and lease assertions. No network.
 * This does NOT run SQL and must never be deployed as a migration.
 */
import {readFileSync,mkdirSync,writeFileSync} from "node:fs";
import {createHash} from "node:crypto";
const read=p=>readFileSync(p,"utf8");
const src="/tmp/bdi-v3226-disposable-outbox/outbox-rollback.sql";
const migrationPath="supabase/migrations/20261014170000_v3_227_guest_alert_dispatch_leases.sql";
const migration=read(migrationPath);
const input=read(src);
const checks=read("staging/CI_ONLY_v3227_assert_leases.sql");
const anchor="\nrollback;\ndo $$";
if(input.split(anchor).length!==2||!migration.includes("for update of i skip locked")||
 !migration.includes("busy_guest_alert_quarantine_expired_v3227")||
 !checks.includes("V3.227_DISPATCH_LEASES_AND_NO_DUPLICATE_SEND_PASS"))
 throw Error("Dispatch CI SQL changed; review original transaction boundaries.");
const merged=input.replace(anchor,()=>"\n"+migration+"\n"+checks+anchor)
 .replace("V3.226_EPHEMERAL_ATOMIC_OUTBOX_ROLLBACK_PASS",
 "V3.227_EPHEMERAL_DISPATCH_ROLLBACK_PASS");
if(/(?:cron\s*\.\s*schedule|net\s*\.\s*http_post)\s*\(/i.test(merged))
 throw Error("CI dispatch SQL unexpectedly schedules or calls provider work.");
const dest="/tmp/bdi-v3227-dispatch";
mkdirSync(dest,{recursive:true});
writeFileSync(dest+"/dispatch-rollback.sql",merged);
writeFileSync(dest+"/sha256.json",JSON.stringify({
 kind:"v3227_disposable_only",
 source:migrationPath,sha256:createHash("sha256").update(migration).digest("hex"),
 sqlExecutedByThisScript:false,providerCallMade:false,
 actualStagingUsed:false,rollbackExpected:true
},null,2)+"\n");
console.log("V3.227 real dispatch-leases SQL assembled for ephemeral database; no hosted calls.");
