/**
 * V3.175 — strictly non-executing handoff to a FUTURE trusted staging runner.
 *
 * This function is intentionally incapable of submitting requests, creating
 * an endpoint client or granting itself credentials. The identity, auth,
 * endpoint allowlist and signed receipts must all be enforced by a separate
 * server-owned runner. No claimed identity/approval passed here is proof of
 * actual authentication.
 */
import {prepareStagingExecutionManifest} from "./offlineStagingPreflight.mjs";
import {stagingJourneyTestPlan} from "./stagingJourneyContract.mjs";

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ROUTES=["busy_marketplace","standalone","guest_web"];
const KINDS=["booking_request","enquiry"];
const ALLOWED=["auth","submitted","owner_inbox","status","reply_delivery","diary","guest","standalone","device"];
const cleanString=x=>typeof x==="string"&&x.length<=120&&
  /^[a-zA-Z0-9._-]+$/.test(x);

function compileStagingRunnerHandoff({
 appConfig=null,businessId="",draftRevision=0,
 environment="isolated_staging",runLabel="",ownerApproved=false,
 runnerBinding=null
}={}){
 if(environment!=="isolated_staging"||!UUID.test(businessId)||
  !cleanString(runLabel)||!Number.isSafeInteger(draftRevision)||
  draftRevision<1||ownerApproved!==true)
  return {ok:false,reason:"Staging handoff requires a current business, test label, isolated environment and explicit owner intent."};
 const manifest=prepareStagingExecutionManifest({
  appConfig,businessId,draftRevision,ownerApproved});
 if(!manifest.ok)return manifest;
 const routes=manifest.routes.map(entry=>({
   channel:entry.channel,requestKind:entry.kind,
   caseDefinitions:entry.casesPrepared,
   offlineRules:entry.offlineResult,
   mayProceedToServerChecks:entry.offlineResult==="fixture_rules_passed_not_live_verified",
   receiptChecks:stagingJourneyTestPlan({
    kind:entry.kind,channel:entry.channel
   }).steps.map(x=>x.id)
 }));
 const unsupported=manifest.fixtureFailures>0||manifest.missingFeatures.length>0;
 // A locally supplied binding can only describe a future connector. A forged
 // "enabled" flag cannot turn this pure client-side module into a trusted runner.
 const bindingDescribed=runnerBinding?.kind==="trusted_isolated_runner"&&
   runnerBinding?.environment==="isolated_staging";
 return {ok:true,kind:"staging_runner_handoff_v3175",
  environment:"isolated_staging",runLabel,revision:draftRevision,
  routes,routeCount:routes.length,allOfflineRulesPass:!unsupported,
  missingCapabilities:manifest.missingFeatures,
  source:"private_draft_offline_fixture_rules",
  runnerConfigurationDescribed:bindingDescribed,
  runnerIndependentlyAuthenticated:false,
  approvalVerifiedServerSide:false,
  sessionTenantVerifiedServerSide:false,
  productionEndpointAllowed:false,networkEnabled:false,
  canRun:false,canPublish:false,
  transportHandoffReady:false,
  nextStep:unsupported?
   "Enable the missing tracked request modules or fix failing offline guards.":
   "A trusted isolated server runner must independently check owner permissions, business scope, test-account isolation, endpoint allowlist, side effects and signed receipts.",
  noSecretsOrCustomerRecords:true,noRequestsSubmitted:true,
  noExternalMessages:true,noCharges:true};
}

/**
 * Receipt-shaped data is CLIENT METADATA ONLY, not authenticated proof.
 * Reject stale, duplicate, wrong-route, cross-tenant, customer-data-bearing
 * records before producing bounded information suitable for a private UI.
 */
function reviewStagingRunMetadata({
 businessId="",revision=0,runLabel="",route="busy_marketplace",
 kind="booking_request",receipts=[]
}={}){
 if(!UUID.test(businessId)||!Number.isSafeInteger(revision)||revision<1||
   !cleanString(runLabel)||!ROUTES.includes(route)||!KINDS.includes(kind)||
   !Array.isArray(receipts)||receipts.length>24)return {
    ok:false,reason:"Current, bounded staging metadata is required."};
 const plan=stagingJourneyTestPlan({kind,channel:route});
 const steps=new Set(plan.steps.map(x=>x.id)),seen=new Set(),rejected=[];
 const considered=[];
 for(const item of receipts){
  const id=item?.step;
  const accepted=steps.has(id)&&!seen.has(id)&&item?.source==="isolated_staging_server_receipt"&&
   item?.environment==="isolated_staging"&&item?.businessId===businessId&&
   item?.revision===revision&&item?.runLabel===runLabel&&
   item?.channel===route&&item?.requestKind===kind&&
   ["passed","failed"].includes(item?.outcome)&&
   item?.containsLiveCustomerData===false&&
   !("rawPayload" in item)&&!("credentials" in item)&&!("email" in item)&&
   !("screenshot" in item);
  if(!accepted){rejected.push(steps.has(id)?id:"unsupported");continue;}
  seen.add(id);
  considered.push({step:id,formatOutcome:item.outcome,independentlyVerified:false});
 }
 return {ok:true,kind:"staging_untrusted_receipt_preview_v3175",
  channel:route,requestKind:kind,runLabel,
  provided:receipts.length,formatAccepted:considered.length,
  rejected,rejectedCount:rejected.length,
  missing:[...steps].filter(id=>!seen.has(id)),
  statusSummary:considered,
  independentlyVerified:false,
  serverSignatureChecked:false,actualNetworkDeliveryProven:false,
  canUseForRelease:false,cannotAuthoriseBooking:true,
  noCustomerIdentifiersReturned:true,noRawPayloadReturned:true};
}
export {compileStagingRunnerHandoff,reviewStagingRunMetadata};
