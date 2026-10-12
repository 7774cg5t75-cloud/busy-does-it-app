import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {reviewCustomerOutcomeProof} from "../src/core/customerOutcomeProofV3187.mjs";
import {createStagingExecutionGate} from "../src/core/isolatedStagingRunbookV3187.mjs";
import {coordinateCustomerJourneyReview} from "../src/core/connectedCustomerJourneyV3187.mjs";
import {verifyStagingPackage} from "./verify-staging-install-v3186.mjs";
import {report as tracked} from "./track-intelligence-v3183.mjs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
let n=0;
function ok(x){assert.ok(x);n++}
function eq(a,b){assert.deepEqual(a,b);n++}
const b="11111111-1111-4111-8111-111111111111";
const other="22222222-2222-4222-8222-222222222222";
const app="33333333-3333-4333-8333-333333333333";
const r1="44444444-4444-4444-8444-444444444444";
const r2="55555555-5555-4555-8555-555555555555";
const r3="66666666-6666-4666-8666-666666666666";
const request=(id,request_type,status)=>({
 id,business_id:b,mini_app_id:app,request_type,status,
 customer_name:"PRIVATE_NAME_DO_NOT_OUTPUT",details:{phone:"PRIVATE_PHONE"}});
const message=(request_id,sender_role)=>({
 business_id:b,mini_app_id:app,request_id,sender_role,
 body:"PRIVATE_MESSAGE_DO_NOT_OUTPUT"});
const work=(request_id,state)=>({business_id:b,mini_app_id:app,
 request_id,state,customer_record_id:"PRIVATE_RECORD"});
const result=reviewCustomerOutcomeProof({
 businessId:b,appId:app,requests:[request(r1,"enquiry","reviewing"),
  request(r2,"booking_request","accepted"),
  request(r3,"booking_request","closed")],
 messages:[message(r1,"business"),message(r2,"customer")],
 links:[{business_id:b,request_id:r2,bridge_state:"booking_confirmed"}],
 work:[work(r2,"confirmed"),work(r3,"cancelled")]
});
ok(result.ok);eq(result.counts.requests,3);
eq(result.counts.savedOwnerReplies,1);
eq(result.counts.savedCustomerReplies,1);
eq(result.counts.acceptedBookingsWithWork,1);
eq(result.counts.cancelledWorkBookings,1);
eq(result.counts.acceptedWithoutConfirmedWork,0);
eq(result.counts.closedButWorkActive,0);
eq(result.counts.requestsWithoutStoredOwnerReply,0);
eq(result.overallTaskCompletionRate,null);
eq(result.evidence.customerReadReply,"unverified");
eq(result.evidence.servicePerformed,"unverified");
eq(result.evidence.paymentReceived,"unverified");
eq(result.actualCustomerSatisfactionMeasured,false);
ok(!JSON.stringify(result).includes("PRIVATE"));
const broken=reviewCustomerOutcomeProof({
 businessId:b,appId:app,requests:[request(r2,"booking_request","accepted"),
 request(r3,"booking_request","closed")],
 messages:[],links:[],work:[work(r3,"confirmed")]});
ok(broken.ok);eq(broken.counts.acceptedWithoutConfirmedWork,1);
eq(broken.counts.closedButWorkActive,1);
eq(broken.priorities[0].id,"closed_booking_active");
eq(broken.priorities[1].id,"accepted_missing_work");
ok(!reviewCustomerOutcomeProof({businessId:b,appId:app,
 requests:[{...request(r1,"enquiry","received"),business_id:other}]}).ok);
ok(!reviewCustomerOutcomeProof({businessId:b,appId:app,
 requests:[request(r1,"enquiry","received"),request(r1,"enquiry","received")]}).ok);
ok(!reviewCustomerOutcomeProof({businessId:b,appId:app,
 requests:[request(r2,"booking_request","accepted")],
 work:[work(r2,"confirmed"),work(r2,"confirmed")]}).ok);
ok(reviewCustomerOutcomeProof({businessId:b,appId:app,
 requestsTruncated:true}).coveragePartial);
const builder={ok:true,websiteRevision:2,appRevision:5,
 unresolvedFactChecks:2};
const joined=coordinateCustomerJourneyReview({
 goal:"book",businessId:b,websiteBusinessId:b,appBusinessId:b,
 websiteRevision:2,appRevision:5,builderReview:builder,outcomeProof:broken});
ok(joined.ok);eq(joined.actions.length,3);
eq(joined.actions[1].id,"confirm_booking_work_path");
eq(joined.noAutomaticPublishing,true);
eq(joined.realEndToEndCompletionVerified,false);
eq(joined.sharedFactsComparedWithoutRawText,true);
ok(!coordinateCustomerJourneyReview({goal:"book",businessId:b,
 websiteBusinessId:b,appBusinessId:other,websiteRevision:2,appRevision:5,
 builderReview:builder}).ok);
ok(!coordinateCustomerJourneyReview({goal:"book",businessId:b,
 websiteBusinessId:b,appBusinessId:b,websiteRevision:2,appRevision:6,
 builderReview:builder}).ok);
const stage=createStagingExecutionGate({
 projectRef:"pnjdlogwegnqbsfpcofw",projectHealthy:true,canaryPresent:true,
 extensions:{pgcrypto:true,pgmq:false,pg_cron:false,pg_net:false},
 checks:{migration_integrity:true}});
ok(stage.ok);ok(stage.blockers.includes("extension_review"));
ok(stage.blockers.includes("rollback_restore_test"));
ok(stage.blockers.includes("owner_authorisation"));
eq(stage.missingExtensions,["pgmq","pg_cron","pg_net"]);
eq(stage.actualOwnerApprovalIndependentlyProven,false);
eq(stage.installationAuthorisedByThisResult,false);
eq(stage.installationExecuted,false);
eq(stage.plannedExercises.length,7);
const ready=createStagingExecutionGate({
 projectRef:"pnjdlogwegnqbsfpcofw",projectHealthy:true,canaryPresent:true,
 extensions:{pgcrypto:true,pgmq:true,pg_cron:true,pg_net:true},
 checks:Object.fromEntries(["migration_integrity","sql_side_effect_review",
  "rollback_restore_test","auth_role_contract","migration_ledger_reconciled",
  "edge_secrets_isolated","owner_authorisation"].map(x=>[x,true]))});
ok(ready.ok);eq(ready.blockers,[]);
eq(ready.installationAuthorisedByThisResult,false);
ok(!createStagingExecutionGate({projectRef:other,
 extensions:{pgcrypto:true},checks:{owner_authorisation:true}}).preparedForIndependentHumanReview);
const manifest=verifyStagingPackage();
ok(manifest.ok);eq(manifest.authorisedForInstall,false);
const sql=read("staging/ci-full-customer-journey-v3187.sql");
for(const term of ["ci-message-delivery-outbox-v3185.sql",
 "busy_send_mini_app_message_v3185",
 "busy_mark_mini_app_request_link_v3181",
 "deliveryIntentDurable","booking_confirmed",
 "Other business closed this booking",
 "Cancellation did not update request",
 "V3.187 FULL FICTIONAL DATABASE JOURNEY PASS"])
 ok(sql.includes(term));
const domain=read("src/domain/miniApps.js");
const screen=read("src/screens/miniApps.js");
ok(domain.includes("reviewCustomerOutcomeProof({"));
ok(screen.includes("coordinateCustomerJourneyReview({"));
ok(screen.includes("V3.187 • One joined-up customer journey"));
ok(screen.includes("V3.187 • What actually happened"));
ok(read("scripts/plan-isolated-staging-v3187.mjs").includes("noNetworkAccess:true"));
ok(tracked.surveyedCapabilities.length>=19);
eq(tracked.surveyedCapabilities.length,tracked.wiredSourceCapabilities);
eq(tracked.surveyedCapabilities.length,tracked.testsPresentForSample);
eq(tracked.realCustomerJourneysProven,false);
eq(tracked.calibratedIQScore,null);
console.log("V3.187 "+n+" focused proof, shared-journey and isolated-staging assertions PASS.");
