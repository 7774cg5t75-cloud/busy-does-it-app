/**
 * V3.231 build disposable-only source fixture by appending exact owner
 * status compare-and-swap tests to the ORIGINAL V3.230 guest SQL lifecycle.
 * No database/network access, production writes or migration installation.
 */
import {readFileSync,mkdirSync,writeFileSync} from "node:fs";
import {createHash} from "node:crypto";
const old=readFileSync("/tmp/bdi-v3230-receipt-test/all-rollback.sql","utf8");
const path="staging/CI_ONLY_v3231_owner_status_cas.sql";
const fixtures=readFileSync(path,"utf8");
const marker="\nrollback;\ndo $$";
if(old.split(marker).length!==2||
 !old.includes("V3.230_PUSH_SERVICE_RECEIPTS_MONOTONE_AND_PRIVATE_PASS")||
 !fixtures.includes("V3.231_EPHEMERAL_OWNER_CAS_AND_TENANT_SCOPE_PASS"))
 throw Error("Inherited original guest transaction changed; STOP.");
const all=old.replace(marker,()=> "\n"+fixtures+"\n"+marker)
 .replace("V3.230_EPHEMERAL_RECEIPT_ROLLBACK_PASS",
          "V3.231_EPHEMERAL_OWNER_FRESHNESS_ROLLBACK_PASS");
if(/(?:cron\s*\.\s*schedule|net\s*\.\s*http_post)\s*\(/i.test(all))
 throw Error("Unexpected external/scheduled SQL in disposable fixture.");
const dir="/tmp/bdi-v3231-owner-cas";
mkdirSync(dir,{recursive:true});
writeFileSync(dir+"/rollback.sql",all);
writeFileSync(dir+"/manifest.json",JSON.stringify({
 kind:"disposable_postgres_owner_cas_v3231",
 source:path,sha256:createHash("sha256").update(fixtures).digest("hex"),
 actualStagingContacted:false,productionContacted:false,
 externalProviderContacted:false,SQLExecutedByThisScript:false,
 explicitOwnerStagingApproval:false
},null,2)+"\n");
console.log("V3.231: original guest/receipt PostgreSQL fixture assembled for full ROLLBACK only.");
