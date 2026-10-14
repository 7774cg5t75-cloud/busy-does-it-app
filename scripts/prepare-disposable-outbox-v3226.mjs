/**
 * CI-only: extend original V3.225 real-guest-RPC disposable SQL using
 * actual V3.226 additive migration. No credentials, hosted connections,
 * cron, provider sends, external network or deployed schema changes.
 */
import {readFileSync,mkdirSync,writeFileSync} from "node:fs";
import {createHash} from "node:crypto";
const read=p=>readFileSync(p,"utf8");
const previous="/tmp/bdi-v3225-disposable-guest/guest-rpc-rollback.sql";
const fixture=read(previous);
const migrationPath="supabase/migrations/20261014151000_v3_226_guest_notification_intent.sql";
const migration=read(migrationPath);
const assertions=read("staging/CI_ONLY_v3226_assert_guest_notification_intents.sql");
const before="-- Disposable PostgreSQL 16 ONLY, in the transaction opened by generated";
const rollback="\nrollback;\ndo $$";
if(fixture.split(before).length!==2||fixture.split(rollback).length!==2||
 !migration.includes("create trigger busy_mini_app_guest_notification_intent_v3226")||
 !migration.includes("force row level security")||
 !assertions.includes("Atomic notification intent count"))
 throw Error("Immutable V3.225 test assembly changed; review guest outbox SQL ordering.");
const sql=fixture.replace(before,
 ()=>migration+"\n\n"+before)
 .replace(rollback,()=>"\n"+assertions+rollback)
 .replace("select 'V3.225_EPHEMERAL_GUEST_RPC_ROLLBACK_PASS' as disposable_guest_rpc_result;",
 "select 'V3.226_EPHEMERAL_ATOMIC_OUTBOX_ROLLBACK_PASS' as disposable_guest_rpc_result;");
if(sql.includes("cron.schedule(")||sql.includes("cron.unschedule(")||sql.includes("net.http_post("))
 throw Error("CI assembly includes forbidden external/scheduler side effects.");
const dest="/tmp/bdi-v3226-disposable-outbox";
mkdirSync(dest,{recursive:true});
writeFileSync(dest+"/outbox-rollback.sql",sql);
writeFileSync(dest+"/sha256.json",JSON.stringify({
 kind:"disposable_outbox_v3226",
 sourceMigration:migrationPath,
 sourceMigrationHash:createHash("sha256").update(migration).digest("hex"),
 historicalGuestRpc:true,sourceCronDisabled:true,
 realStagingModified:false,sqlExecutedByThisScript:false,
 providerCallMade:false,rollbackExpected:true
},null,2)+"\n");
console.log("V3.226 outbox CI SQL assembled from REAL V3.225 guest RPC and new migration; no hosted work.");
