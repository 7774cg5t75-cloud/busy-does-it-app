/**
 * V3.230 ephemeral SQL assembly; every DDL operation runs only inside the
 * previous original guest+dispatch+device ROLLBACK on PostgreSQL 16.
 * This script does not connect to a hosted database or invoke providers.
 */
import {readFileSync,mkdirSync,writeFileSync} from "node:fs";
import {createHash} from "node:crypto";
const read=p=>readFileSync(p,"utf8");
const original=read("/tmp/bdi-v3229-device-evidence/device-evidence-rollback.sql");
const path="supabase/migrations/20261014211500_v3_230_push_service_receipt_truth.sql";
const migration=read(path);
const checks=read("staging/CI_ONLY_v3230_assert_push_service_receipts.sql");
const boundary="\nrollback;\ndo $$";
if(original.split(boundary).length!==2||
 !original.includes("V3.229_PER_DEVICE_EVIDENCE_TRANSACTION_PASS")||
 !migration.includes("busy_guest_alert_record_push_service_receipt_v3230")||
 !checks.includes("V3.230_PUSH_SERVICE_RECEIPTS_MONOTONE_AND_PRIVATE_PASS"))
 throw Error("V3.230 PostgreSQL fixture dependencies changed; review transaction boundary.");
const joined=original.replace(boundary,()=> "\n"+migration+"\n"+checks+boundary)
 .replace("V3.229_EPHEMERAL_DEVICE_EVIDENCE_ROLLBACK_PASS",
          "V3.230_EPHEMERAL_RECEIPT_ROLLBACK_PASS");
if(/(?:cron\s*\.\s*schedule|net\s*\.\s*http_post)\s*\(/i.test(joined))
 throw Error("Receipt SQL unexpectedly schedules work or calls a provider.");
const dir="/tmp/bdi-v3230-receipt-test";
mkdirSync(dir,{recursive:true});
writeFileSync(dir+"/all-rollback.sql",joined);
writeFileSync(dir+"/manifest.json",JSON.stringify({
 type:"offline_postgres_rollback_only",migration:path,
 sha256:createHash("sha256").update(migration).digest("hex"),
 hostedSqlApplied:false,paidBuild:false,realProviderCalled:false,
 productionTouched:false,explicitStagingApproval:false
},null,2)+"\n");
console.log("V3.230 isolated PostgreSQL receipt fixture assembled; NO SQL executed by script.");
