/**
 * V3.125: local-only, read-only setup preflight. Does not log secret values or
 * connect to any cloud. Inputs are supplied as nonsecret deployment metadata.
 * Run deliberately, not during a production build or mobile app start.
 */
import {stagingEnvironmentGuard} from "../src/core/stagingEnvironmentGuard.mjs";
const isFalse=name=>process.env[name]==="false"?false:null;
const assessment=stagingEnvironmentGuard({
 stagingSupabaseUrl:process.env.BUSY_STAGING_SUPABASE_URL||"",
 productionSupabaseUrl:process.env.BUSY_PRODUCTION_SUPABASE_URL||"",
 stagingHostingUrl:process.env.BUSY_STAGING_HOSTING_URL||"",
 expectedHostingHost:process.env.BUSY_STAGING_EXPECTED_HOST||"",
 buildProfile:process.env.BUSY_BUILD_PROFILE||"",
 sourceCommit:process.env.BUSY_STAGING_SOURCE_SHA||"",
 publicKeyKind:process.env.BUSY_STAGING_PUBLIC_KEY_KIND||"",
 productionCredentialsPresent:isFalse("BUSY_PRODUCTION_CREDENTIALS_PRESENT"),
 customerDataPresent:isFalse("BUSY_REAL_CUSTOMER_DATA_PRESENT"),
 productionWritesAllowed:isFalse("BUSY_PRODUCTION_WRITES_ALLOWED"),
 paidProvidersEnabled:isFalse("BUSY_PAID_PROVIDERS_ENABLED")
});
console.log(JSON.stringify({
 status:assessment.status,passed:assessment.passed,total:assessment.total,
 missing:assessment.checks.filter(c=>!c.passed).map(c=>c.label),
 next:assessment.next,realCloudVerified:assessment.actualCloudVerified,
 founderApprovalStillRequired:assessment.founderApprovalStillRequired
},null,2));
if(assessment.status!=="configuration-review-only")process.exitCode=2;
