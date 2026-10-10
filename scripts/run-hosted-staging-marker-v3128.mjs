/**
 * Manually invoked ONLY through a protected GitHub isolated-staging
 * environment, after separate cloud resources and test users exist.
 * No JWT is sent to the website host. No SQL or API mutation is made.
 */
import {checkHostedStagingMarker}
 from "./lib/stagingHostedVerificationV3128.mjs";
const e=process.env;
const result=await checkHostedStagingMarker({
 baseUrl:e.BUSY_STAGING_HOST_ORIGIN||"",
 expectedHost:e.BUSY_STAGING_EXPECTED_HOST||"",
 sourceSha:e.BUSY_STAGING_SOURCE_SHA||"",
 stagingRef:e.BUSY_STAGING_PROJECT_REF||"",
 productionRef:e.BUSY_PRODUCTION_PROJECT_REF||"",
 approval:e.BUSY_STAGING_AUTH_APPROVAL||""
});
console.log(JSON.stringify(result,null,2));
if(result.status!=="host-marker-observed")process.exitCode=2;
