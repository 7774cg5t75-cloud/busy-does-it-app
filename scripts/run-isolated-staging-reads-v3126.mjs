/**
 * Manually invoked only after a dedicated nonproduction project exists.
 * Prints only redacted result categories, never URLs/keys/JWTs/user IDs.
 * Does not create tables, users, migration entries, uploads or charges.
 */
import {stagingCanaryReadEvidence} from "../src/core/stagingCanaryReadEvidence.mjs";
const e=process.env;
const result=await stagingCanaryReadEvidence({
 stagingRef:e.BUSY_STAGING_PROJECT_REF||"",
 productionRef:e.BUSY_PRODUCTION_PROJECT_REF||"",
 ownerA:e.BUSY_STAGING_OWNER_A_ID||"",ownerB:e.BUSY_STAGING_OWNER_B_ID||"",
 rowA:e.BUSY_STAGING_ROW_A_ID||"",rowB:e.BUSY_STAGING_ROW_B_ID||"",
 publishableKey:e.BUSY_STAGING_PUBLISHABLE_KEY||"",
 tokenA:e.BUSY_STAGING_OWNER_A_JWT||"",tokenB:e.BUSY_STAGING_OWNER_B_JWT||"",
 expiredToken:e.BUSY_STAGING_EXPIRED_JWT||"",
 manualApproval:e.BUSY_STAGING_READ_APPROVAL||""
});
console.log(JSON.stringify(result,null,2));
if(result.status!=="observations-await-independent-review")process.exitCode=2;
