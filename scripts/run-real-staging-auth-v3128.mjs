/**
 * V3.128 — Explicit, read-only, user-approved, real Supabase staging audit.
 * Never put this script in mobile code or in an automatic push workflow.
 * Credentials must be provided through protected GitHub environment secrets,
 * never URLs, CLI arguments, committed files or workflow output.
 */
import {probeStagingSupabaseAuth}
 from "./lib/stagingSupabaseAuthV3128.mjs";
const e=process.env;
const p={
 stagingRef:e.BUSY_STAGING_PROJECT_REF||"",
 productionRef:e.BUSY_PRODUCTION_PROJECT_REF||"",
 otherProtectedRef:e.BUSY_SLOWROAST_PROJECT_REF||"",
 publishableKey:e.BUSY_STAGING_PUBLISHABLE_KEY||"",
 ownerA:e.BUSY_STAGING_OWNER_A_ID||"",
 ownerB:e.BUSY_STAGING_OWNER_B_ID||"",
 rowA:e.BUSY_STAGING_ROW_A_ID||"",
 rowB:e.BUSY_STAGING_ROW_B_ID||"",
 tokenA:e.BUSY_STAGING_OWNER_A_JWT||"",
 tokenB:e.BUSY_STAGING_OWNER_B_JWT||"",
 rejectedToken:e.BUSY_STAGING_REJECTED_JWT||"",
 approval:e.BUSY_STAGING_AUTH_APPROVAL||"",
 sourceSha:e.BUSY_STAGING_SOURCE_SHA||""
};
const result=await probeStagingSupabaseAuth(p);
console.log(JSON.stringify(result,null,2));
if(result.status!=="real-staging-observations-need-independent-review")
 process.exitCode=2;
