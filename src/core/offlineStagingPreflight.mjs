/**
 * V3.174 — executable OFFLINE fixture checks that precede isolated staging.
 *
 * This module does actually execute the existing fixed booking/enquiry state
 * fixtures, not real network requests. A green result means the local state
 * machine behaved as expected; it is not proof of delivery, authentication,
 * availability, diary linkage or app-store readiness.
 *
 * The future staging runner requires a separate trusted server component,
 * authenticated owner permission, an isolated allowlisted environment and
 * explicit payment/notification side-effect controls. None are supplied here.
 */
import {prepareStagingJourneyRun,planStagingCoverage} from "./stagingJourneyPreparation.mjs";
import {simulateCustomerJourney,SCENARIOS} from "./appCustomerJourneyPractice.mjs";
import {taskReadiness} from "./appCustomerTaskDesign.mjs";
const kindByTask=Object.freeze({book:"booking_request",enquire:"enquiry"});
const CHANNELS=Object.freeze(["busy_marketplace","standalone","guest_web"]);
const TEST_KINDS=Object.freeze(["booking_request","enquiry"]);

function executeOfflineJourneyPreflight({appConfig=null,kind="booking_request",
 channel="busy_marketplace",businessId="",draftRevision=0}={}){
 const plan=prepareStagingJourneyRun({
  kind,channel,businessId,draftRevision,environment:"dry_run"});
 if(!plan.ok)return plan;
 if(!appConfig||!Array.isArray(appConfig.modules))return {
  ok:false,reason:"A valid private app draft is required for offline checks."};
 const task=kind==="booking_request"?"book":"enquire";
 const readiness=taskReadiness(appConfig,task);
 if(!readiness.ok)return readiness;
 // Contact-only is deliberately NOT a substitute for tracked Enquiries.
 const available=readiness.available&&readiness.targetModule===readiness.primaryModule;
 const supported=SCENARIOS.filter(s=>s.task===task);
 const outcomes=supported.map(s=>{
  const result=simulateCustomerJourney(appConfig,s.id);
  return {scenarioId:s.id,label:s.label,
   status:result.ran===false?"blocked":
     result.passed===true?"passed":"failed",
   verifiedLive:false,codeOnly:true};
 });
 const failed=outcomes.filter(x=>x.status==="failed").length;
 const passed=outcomes.filter(x=>x.status==="passed").length;
 const blocked=outcomes.filter(x=>x.status==="blocked").length;
 return {ok:true,kind:"offline_staging_preflight_v3174",
  requestKind:kind,channel,goal:task,
  plannedCases:plan.caseCount,
  executedFixtureCases:outcomes.length,passedFixtureCases:passed,
  failedFixtureCases:failed,blockedFixtureCases:blocked,
  outcomes,
  offlineGuardResult:!available?"feature_setup_required":
   failed?"fixture_rule_failure":"fixture_rules_passed_not_live_verified",
  customerPathPresent:available,
  nextStep:!available?
   "Enable and verify the real tracked customer request module before staging.":
   failed?"Fix the request lifecycle rules before attempting isolated staging.":
   "Request separate owner approval and configure a trusted isolated staging runner. No live test ran.",
  liveSubmissionCount:0,liveDeliveryVerified:false,
  ownerInboxDeliveryVerified:false,diaryConfirmationVerified:false,
  tenantAuthorizationVerified:false,networkTransportPresent:false,
  canRunProduction:false,canRunStaging:false,
  noCustomersContacted:true,noBookingCreated:true,noCharges:true,
  noPrivateRecordsIncluded:true,noPublicChanges:true};
}

function prepareStagingExecutionManifest({appConfig=null,businessId="",
 draftRevision=0,ownerApproved=false}={}){
 if(!appConfig||!Array.isArray(appConfig.modules))return {ok:false,
  reason:"A valid private Business App draft is required."};
 const routes=planStagingCoverage({businessId,draftRevision});
 if(!routes.ok)return routes;
 const entries=[];
 for(const channel of CHANNELS)for(const kind of TEST_KINDS){
  const run=executeOfflineJourneyPreflight({
   appConfig,kind,channel,businessId,draftRevision});
  if(!run.ok)return {ok:false,reason:run.reason};
  entries.push({channel,kind,offlineResult:run.offlineGuardResult,
   passedFixtures:run.passedFixtureCases,blockedFixtures:run.blockedFixtureCases,
   casesPrepared:routes.plans.find(x=>x.kind===kind&&x.channel===channel)?.caseCount||0,
   trustedServerExecutionRequired:true,verifiedNetworkDelivery:false});
 }
 const blockers=[
  "A verified staging-only endpoint and runner must be connected by the owner.",
  "A server-side authentication and tenant-isolation check is mandatory.",
  "Notification side effects, costs and test identities require separate approval.",
  "Evidence must be checked against authoritative backend receipts, not the UI."
 ];
 return {ok:true,kind:"staging_execution_manifest_v3174",
  routes:entries,routeCount:entries.length,
  fixtureFailures:entries.reduce((sum,x)=>sum+
   Number(x.offlineResult==="fixture_rule_failure"),0),
  missingFeatures:entries.filter(x=>x.offlineResult==="feature_setup_required")
   .map(x=>({channel:x.channel,kind:x.kind})),
  ownerExpressedIntent:ownerApproved===true,
  blockers,canExecute:false,allTrafficDisabled:true,
  authenticatedRunnerConnected:false,
  liveEndpointCallsMade:0,fixtureChecksOnly:true,
  realDeliveryEstablished:false,approvalToPublish:false,
  noCustomerDataIncluded:true,noSecretsIncluded:true};
}
export {executeOfflineJourneyPreflight,prepareStagingExecutionManifest};
