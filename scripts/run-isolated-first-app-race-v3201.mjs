/**
 * V3.201 manual-only first-create collision exercise.
 *   node scripts/run-isolated-first-app-race-v3201.mjs
 * does NO network work. The --run-against-staging mode additionally requires:
 *   BDI_STAGING_TEST_BUSINESS_ID
 *   BDI_STAGING_OWNER_JWT
 *   BDI_STAGING_PUBLISHABLE_KEY
 *   BDI_STAGING_RACE_APPROVAL="I APPROVE SYNTHETIC STAGING FIRST APP TEST"
 * Only the fixed Supabase STAGING host is used, no redirects.
 * The designated business must ALREADY exist with the exact synthetic name,
 * belong to the signed-in owner and have NO existing Business App.
 * Does not clean up/delete test evidence or perform customer submissions.
 */
import {randomUUID} from "node:crypto";
import {pathToFileURL} from "node:url";
import {
 STAGING_PROJECT,BASE_URL,SYNTHETIC_NAME,
 preflightIsolatedFirstAppRace,evaluateIsolatedFirstAppRace
} from "../src/core/stagingFirstAppRaceV3201.mjs";
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const APPROVAL="I APPROVE SYNTHETIC STAGING FIRST APP TEST";
const SAFE_ENDPOINT=BASE_URL+"/functions/v1/busy-mini-apps";
const profile={businessName:SYNTHETIC_NAME,businessType:"synthetic service",
 tagline:"Staging fixtures only, never for public customers"};
const fail=(m)=>{throw Error(m);};
async function runIsolatedRace({
 argv=process.argv.slice(2),env=process.env,
 fetchImpl=fetch,uid=randomUUID
}={}){
 if(!Array.isArray(argv)||argv.length>1||
  (argv.length===1&&argv[0]!=="--run-against-staging"))
  return {ok:false,reason:"Only the no-op default or explicit --run-against-staging mode is accepted.",networkRequests:0};
 if(argv.length===0)return {ok:true,kind:"staging_race_not_run_v3201",
  networkRequests:0,syntheticRecordsCreated:0,
  requiredProject:STAGING_PROJECT,
  approvalStillRequired:true,
  databaseMigrationInstalled:false,executionPermitted:false};
 const businessId=env.BDI_STAGING_TEST_BUSINESS_ID||"";
 const token=env.BDI_STAGING_OWNER_JWT||"";
 const key=env.BDI_STAGING_PUBLISHABLE_KEY||"";
 if(env.BDI_STAGING_RACE_APPROVAL!==APPROVAL||
   !UUID.test(businessId)||
   !/^[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+$/.test(token)||
   typeof key!=="string"||key.length<20)
  fail("Explicit synthetic staging business, owner JWT, publishable key and manual approval are required.");
 if(typeof fetchImpl!=="function")fail("Trusted staging transport is unavailable.");
 let calls=0;
 async function api(action,payload={}){
  ++calls;
  // Fixed destination prevents environment-controlled host and token leakage.
  const response=await fetchImpl(SAFE_ENDPOINT,{
   method:"POST",redirect:"error",signal:AbortSignal.timeout(15000),
   headers:{"Content-Type":"application/json","Authorization":"Bearer "+token,
     "apikey":key,"x-busy-request-id":"v3201-"+uid()},
   body:JSON.stringify({action,businessId,...payload})
  });
  if(!response||typeof response.ok!=="boolean")fail("Invalid staging response.");
  let body;
  try{body=await response.json();}catch{body={};}
  return response.ok?body:{ok:false,httpStatus:response.status};
 }
 // No write can be issued unless the authenticated owner_status has already
 // returned an empty first app, the expected synthetic name and owner role.
 const before=await api("owner_status");
 const preflight=preflightIsolatedFirstAppRace({
  projectRef:STAGING_PROJECT,baseUrl:BASE_URL+"/",businessId,
  ownerApproved:true,verifiedSyntheticBusiness:true,ownerStatus:before
 });
 if(!preflight.ok)fail(preflight.reason);
 const replies=await Promise.allSettled([
  api("build_draft",{expectedNoExistingApp:true,profileDraft:profile}),
  api("build_draft",{expectedNoExistingApp:true,profileDraft:profile})
 ]);
 const responses=replies.map(r=>r.status==="fulfilled"?r.value:
  {ok:false,networkResponseUncertain:true});
 const after=await api("owner_status");
 const verdict=evaluateIsolatedFirstAppRace({
  businessId,before,responses,after
 });
 return {...verdict,kind:"manual_isolated_staging_first_app_race_v3201",
  networkRequests:calls,firstAppCreationAttempted:true,
  noCustomerRequestsSent:true,
  noSecretsLogged:true,noProductionConnections:true,
  externalSystemsUnaffected:true};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 runIsolatedRace().then(result=>{
  console.log(JSON.stringify(result,null,2));
  if(!result.ok)process.exitCode=1;
 }).catch(error=>{
  // Never print request payloads, JWTs, credentials, response bodies or PII.
  console.error("Isolated staging exercise STOPPED: "+String(error?.message||"Unknown safety failure").slice(0,170));
  process.exitCode=1;
 });
}
export {runIsolatedRace,SAFE_ENDPOINT,APPROVAL};
