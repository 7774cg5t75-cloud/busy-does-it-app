/**
 * V3.202: manual, read-only, REAL JWT + two-tenant staging RLS probe.
 * Without --verify-read-only: zero network calls. No anonymous signups,
 * Auth password submission, table writes, tokens in output or production URL.
 * Requires pre-existing test users, securely obtained staging access JWTs,
 * staging publishable key, distinct owner IDs and explicit approval.
 *
 * A green result is independently observed Auth/RLS canary behaviour only,
 * NOT yet an app-request end-to-end test or JWT-signature audit.
 */
import {pathToFileURL} from "node:url";
import {stagingAuthConfigCheck,probeStagingSupabaseAuth}
 from "./lib/stagingSupabaseAuthV3128.mjs";
const STAGING="pnjdlogwegnqbsfpcofw";
const PRODUCTION="qgkmuiipicazmcxxmoxv";
const PROTECTED_OTHER="rtqqnqbrqpjondvcyann";
const A_ROW="20f9279e-0dcf-4b1b-aad0-4952c4aab332";
const B_ROW="0aa3150d-8e85-4ca3-bda2-f8f3dd6c9bcf";
const APPROVAL="APPROVE_TWO_USER_READ_ONLY_STAGING_AUTH_V3202";
const rejected=()=>({ok:false,reason:"Authorised read-only staging Auth evidence is not configured.",
 realEndpointContacted:false,noNetworkBeforeApproval:true,
 realBusinessRequestVerified:false,productionTouched:false});
async function runStagingAuthEvidence({
 argv=process.argv.slice(2),env=process.env,fetchImpl=fetch
}={}){
 if(!Array.isArray(argv)||argv.length>1||
   (argv.length===1&&argv[0]!=="--verify-read-only"))
  return {...rejected(),reason:"Only the no-op default or explicit --verify-read-only mode is supported."};
 if(!argv.length)return {ok:true,kind:"staging_auth_not_run_v3202",
  realEndpointContacted:false,networkRequests:0,
  requiresExplicitApproval:true,productionTouched:false,
  authenticatedTenantIsolationVerified:false};
 if(env.BDI_STAGING_TWO_OWNER_READ_APPROVAL!==APPROVAL||
   typeof fetchImpl!=="function")return rejected();
 const p={
  stagingRef:STAGING,productionRef:PRODUCTION,
  otherProtectedRef:PROTECTED_OTHER,
  publishableKey:env.BDI_STAGING_PUBLISHABLE_KEY||"",
  ownerA:env.BDI_STAGING_OWNER_A_ID||"",
  ownerB:env.BDI_STAGING_OWNER_B_ID||"",
  rowA:A_ROW,rowB:B_ROW,
  tokenA:env.BDI_STAGING_OWNER_A_JWT||"",
  tokenB:env.BDI_STAGING_OWNER_B_JWT||"",
  rejectedToken:env.BDI_STAGING_REJECTED_JWT||"",
  sourceSha:env.BDI_STAGING_SOURCE_SHA||"",
  approval:"APPROVE_READ_ONLY_STAGING_AUTH_3128"
 };
 const checked=stagingAuthConfigCheck(p);
 if(checked.status!=="configuration-valid")
  return {...rejected(),missing:checked.missing};
 // The underlying transport permits only GET and blocks redirects. The
 // purpose is Auth /auth/v1/user and own/foreign/anon PostgREST canary reads.
 const evidence=await probeStagingSupabaseAuth(p,fetchImpl);
 const allPassed=evidence.status==="real-staging-observations-need-independent-review"&&
  evidence.phase==="auth-and-read-only-rls"&&
  evidence.passed===10&&evidence.total===10&&
  evidence.actualStagingEndpointContacted===true;
 return {ok:allPassed,kind:"read_only_two_owner_staging_auth_v3202",
  stageProjectExpected:STAGING,
  phase:evidence.phase||"blocked",
  checks:(evidence.checks||[]).map(c=>({
   id:c.id,passed:c.passed===true,httpStatus:c.httpStatus
  })),
  passed:Number(evidence.passed)||0,total:Number(evidence.total)||10,
  realEndpointContacted:evidence.hasIndependentAuthResponse===true,
  ownerJWTIdentityVerified:allPassed,canaryCrossTenantIsolationObserved:allPassed,
  applicationRequestIsolationVerified:false,
  noCustomerRecordsQueried:true,noBusinessMessagesSent:true,
  noRealBookingOrEnquirySubmitted:true,
  actualProviderDeliveryVerified:false,
  independentProductionSecurityAuditPerformed:false,
  productionTouched:false,readOnly:true,approvalDoesNotPermitWrites:true};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 runStagingAuthEvidence().then(r=>{
  console.log(JSON.stringify(r,null,2));
  if(!r.ok)process.exitCode=1;
 }).catch(()=>{
  console.error("Read-only staging Auth probe unavailable. No credentials or responses were printed.");
  process.exitCode=1;
 });
}
export {STAGING,APPROVAL,runStagingAuthEvidence};
