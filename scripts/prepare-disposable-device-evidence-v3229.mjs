/**
 * V3.229 CI ONLY — splice the real additive device-attempt migration and
 * assertions into the existing ephemeral V3.227 SQL transaction BEFORE
 * ROLLBACK. Never connect to Supabase or execute SQL here.
 */
import {readFileSync,mkdirSync,writeFileSync} from "node:fs";
import {createHash} from "node:crypto";
const read=p=>readFileSync(p,"utf8");
const source="/tmp/bdi-v3227-dispatch/dispatch-rollback.sql";
const migration="supabase/migrations/20261014194500_v3_229_guest_alert_device_evidence.sql";
const check="staging/CI_ONLY_v3229_assert_device_gateway.sql";
const original=read(source),body=read(migration),assert=read(check);
const anchor="\nrollback;\ndo $$";
if(original.split(anchor).length!==2||
 !original.includes("V3.227_DISPATCH_LEASES_AND_NO_DUPLICATE_SEND_PASS")||
 !body.includes("busy_guest_alert_finalize_attempt_v3229")||
 !assert.includes("V3.229_PER_DEVICE_EVIDENCE_TRANSACTION_PASS"))
 throw Error("V3.229 ephemeral fixture dependency changed. Stop.");
const merged=original.replace(anchor,()=> "\n"+body+"\n"+assert+anchor)
 .replace("V3.227_EPHEMERAL_DISPATCH_ROLLBACK_PASS",
          "V3.229_EPHEMERAL_DEVICE_EVIDENCE_ROLLBACK_PASS");
if(/(?:cron\s*\.\s*schedule|net\s*\.\s*http_post)\s*\(/i.test(merged))
 throw Error("Unexpected scheduled or provider SQL in CI-only transaction.");
const dest="/tmp/bdi-v3229-device-evidence";
mkdirSync(dest,{recursive:true});
writeFileSync(dest+"/device-evidence-rollback.sql",merged);
writeFileSync(dest+"/sources.json",JSON.stringify({
 kind:"disposable_postgres_only_v3229",
 migration,sha256:createHash("sha256").update(body).digest("hex"),
 sourceTransaction:source,actualStagingUsed:false,
 sqlExecutedByThisScript:false,providerCalled:false,
 rollbackRequired:true,ownerApprovedHostedInstall:false
},null,2)+"\n");
console.log("V3.229 original migrations composed into ephemeral PostgreSQL ROLLBACK fixture; no hosted execution.");
