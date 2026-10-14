/**
 * V3.218 focused offline checks: dry-run DB contract, idempotency/recovery,
 * scoped Business Brain, universal website+app composition, UI/SQL safety.
 * No database, customer PII, HTTP, provider charges or live publication.
 */
import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";
import {reviewWebsiteIntakeMigrationV3218}
 from "../supabase/functions/busy-website-request-intake/schemaReviewV3218.mjs";
import {rehearseWebsiteRequestIdempotencyV3218}
 from "../supabase/functions/busy-website-request-intake/idempotencyRehearsalV3218.mjs";
import {reviewRequestRecoveryV3218}
 from "../src/core/requestRecoveryStateV3218.mjs";
import {reviewBusinessOutcomesV3218}
 from "../src/core/businessOutcomeIntelligenceV3218.mjs";
import {planUniversalCustomerJourneyV3218}
 from "../src/core/universalCustomerJourneyV3218.mjs";
const source=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
let assertions=0;
const ok=(v,m)=>{assert.ok(v,m);assertions++;};
const eq=(a,b,m)=>{assert.deepEqual(a,b,m);assertions++;};
const BID="11111111-1111-4111-8111-111111111111";
const BAD="99999999-9999-4999-8999-999999999999";
const SITE="22222222-2222-4222-8222-222222222222";
const DEP="33333333-3333-4333-8333-333333333333";
const APP="44444444-4444-4444-8444-444444444444";
const APPVER="55555555-5555-4555-8555-555555555555";
const APPROVAL="66666666-6666-4666-8666-666666666666";
const REQUEST="77777777-7777-4777-8777-777777777777";
const KEY="a".repeat(64),PAYLOAD="b".repeat(64);
const NOW="2026-10-14T12:00:00Z";
const schema=reviewWebsiteIntakeMigrationV3218();
ok(schema.ok);
eq(schema.version,"website-intake-draft-v1");
eq(schema.sourceChecksPassed,0);
eq(schema.tables.length,4);
eq(schema.rpcOutline.length,6);
eq(schema.publicEndpointEnabled,false);
eq(schema.deployReady,false);
eq(schema.migrationExecuted,false);
eq(schema.newSqlMigrationCommitted,false);
eq(schema.noRawIdempotencyKeyStored,true);
eq(schema.noVisitorPIIInDedupLedger,true);
ok(schema.missingSharedColumns.includes("business_id"));
const schemaReview=reviewWebsiteIntakeMigrationV3218({
 existingRequestColumns:["id","business_id","mini_app_id","request_type","status","request_origin"],
 knownOrigins:["guest_web","signed_in"],
 requestOriginConstraintReviewed:true,ownerAccessPolicyReviewed:true,
 providerAuditReviewed:true,realDatabaseSchemaInspected:true,
 stagingMigrationApplied:true});
eq(schemaReview.sourceChecksPassed,5);
eq(schemaReview.deployReady,false);
eq(schemaReview.migrationExecuted,false);
eq(schemaReview.externalStagingClaimReported,true);
eq(schemaReview.publicEndpointEnabled,false);
const miss=reviewWebsiteIntakeMigrationV3218({
 existingRequestColumns:["id","business_id"],
 knownOrigins:["website_native"]});
ok(miss.missingSharedColumns.includes("mini_app_id"));
ok(miss.checks.some(x=>x.id==="origin_enum"&&!x.passed));
ok(schema.tables.every(t=>t.purpose.length>15&&t.constraints.length>=3));
const scope=()=>({businessId:BID,websiteId:SITE,deploymentId:DEP,
 appId:APP,appVersionId:APPVER,approvalId:APPROVAL,requestType:"enquiry"});
const challenge=()=>({...scope(),keyDigest:KEY,
 state:"verified",consumed:false,abuseLimitsPassed:true,
 expiresAt:"2026-10-14T12:05:00Z"});
const write=()=>({scope:scope(),challenge:challenge(),
 keyDigest:KEY,payloadDigest:PAYLOAD,now:NOW});
const first=rehearseWebsiteRequestIdempotencyV3218(write());
ok(first.ok,first.reason);
eq(first.disposition,"requires_atomic_rpc");
eq(first.mayInsert,false);
eq(first.atomicInsertNeeded,true);
eq(first.independentServerReadbackRequired,true);
eq(first.verifiedSaved,false);
eq(first.publicEndpointEnabled,false);
eq(first.bookingConfirmed,false);
const ledger=(state="committed")=>({...scope(),keyDigest:KEY,
 payloadDigest:PAYLOAD,requestId:REQUEST,state});
const existing=rehearseWebsiteRequestIdempotencyV3218({...write(),ledger:ledger()});
eq(existing.disposition,"lookup_existing_receipt");
eq(existing.hasExistingRequestId,true);
eq(existing.existingRequestIdHidden,true);
eq(existing.verifiedSaved,false);
eq(existing.mayInsert,false);
ok(!JSON.stringify(existing).includes(REQUEST),"Request ID must not leak from preflight.");
const pending=rehearseWebsiteRequestIdempotencyV3218({...write(),
 ledger:ledger("claiming")});
eq(pending.disposition,"reconcile_before_retry");
eq(pending.mayInsert,false);
eq(rehearseWebsiteRequestIdempotencyV3218({...write(),
 ledger:ledger("unknown")}).disposition,"reconcile_before_retry");
eq(rehearseWebsiteRequestIdempotencyV3218({...write(),
 ledger:ledger("committed"),challenge:null}).disposition,
 "lookup_existing_receipt","Server receipt reconciliation needn't claim a new challenge.");
const denied=(mutate,label)=>{
 const data=write();mutate(data);
 const x=rehearseWebsiteRequestIdempotencyV3218(data);
 eq(x.ok,false,label);
 eq(x.mayInsert,false,label+" must not insert");
 eq(x.publicEndpointEnabled,false,label+" must not activate");
};
denied(x=>x.scope.businessId=BAD,"cross-business scope");
denied(x=>x.scope.websiteId=BAD,"cross-website scope");
denied(x=>x.scope.appId=BAD,"cross-app scope");
denied(x=>x.scope.appVersionId=BAD,"cross-version scope");
denied(x=>x.scope.approvalId=BAD,"cross-approval scope");
denied(x=>x.scope.requestType="payment","unsupported type");
denied(x=>x.keyDigest="raw-token","unhashed idempotency");
denied(x=>x.payloadDigest="wrong","unhashed payload");
denied(x=>x.challenge.businessId=BAD,"wrong challenge owner");
denied(x=>x.challenge.appId=BAD,"wrong challenge app");
denied(x=>x.challenge.approvalId=BAD,"wrong challenge approval");
denied(x=>x.challenge.state="created","unverified challenge");
denied(x=>x.challenge.consumed=true,"consumed challenge");
denied(x=>x.challenge.abuseLimitsPassed=false,"abuse limit failure");
denied(x=>x.challenge.keyDigest="c".repeat(64),"different challenge key");
denied(x=>x.challenge.expiresAt="2026-10-14T11:59:00Z","expired challenge");
denied(x=>x.challenge.expiresAt="2026-10-14T13:00:00Z","oversized TTL");
denied(x=>x.ledger={...ledger(),businessId:BAD},"replay cross tenant");
denied(x=>x.ledger={...ledger(),appId:BAD},"replay cross app");
denied(x=>x.ledger={...ledger(),appVersionId:BAD},"replay cross version");
denied(x=>x.ledger={...ledger(),approvalId:BAD},"replay after owner reapproval");
denied(x=>x.ledger={...ledger(),keyDigest:"c".repeat(64)},"replay changed key");
denied(x=>x.ledger={...ledger(),payloadDigest:"c".repeat(64)},"replay changed payload");
eq(rehearseWebsiteRequestIdempotencyV3218({...write(),
 ledger:{...ledger(),payloadDigest:"c".repeat(64)}}).disposition,"conflict");
denied(x=>x.ledger={...ledger(),state:"unrecognized"},"unknown ledger state");
const recScope=()=>({businessId:BID,appId:APP,requestId:REQUEST});
const recRow=()=>({id:REQUEST,business_id:BID,mini_app_id:APP,
 request_type:"enquiry",status:"received",request_origin:"guest_web"});
const rec=()=>({scope:recScope(),writeState:"unknown"});
const unknown=reviewRequestRecoveryV3218(rec());
ok(unknown.ok);
eq(unknown.status,"commit_uncertain");
eq(unknown.action,"check_existing_receipt");
eq(unknown.suggestNewSubmission,false);
const saved=reviewRequestRecoveryV3218({...rec(),
 readbackAuthorized:true,readback:recRow()});
ok(saved.ok);
eq(saved.savedRequestIndependentlyVerified,true);
eq(saved.status,"saved_in_business_app");
eq(saved.action,"refresh_owner_inbox");
eq(saved.ownerInboxVerified,false);
eq(saved.providerDeliveryVerified,false);
eq(saved.bookingConfirmed,false);
eq(saved.suggestNewSubmission,false);
const owner=reviewRequestRecoveryV3218({...rec(),
 readbackAuthorized:true,readback:recRow(),
 inboxProof:{request_id:REQUEST,business_id:BID,authorizedServerReadback:true},
 outbox:{request_id:REQUEST,business_id:BID,state:"accepted_by_provider"}});
eq(owner.action,"review_saved_request");
eq(owner.ownerInboxVerified,true);
eq(owner.notificationAttempted,true);
eq(owner.providerDeliveryVerified,false);
eq(owner.customerReplyDelivered,false);
const delivered=reviewRequestRecoveryV3218({...rec(),
 readbackAuthorized:true,readback:recRow(),
 outbox:{request_id:REQUEST,business_id:BID,state:"delivered"}});
eq(delivered.providerDeliveryVerified,false,
 "Do not trust a state flag as independent external provider proof.");
eq(delivered.outboxState,"delivered");
const misScopedOutbox=reviewRequestRecoveryV3218({...rec(),
 readbackAuthorized:true,readback:recRow(),
 outbox:{request_id:REQUEST,business_id:BAD,state:"delivered"}});
eq(misScopedOutbox.outboxState,"unverified");
eq(reviewRequestRecoveryV3218({...rec(),readbackAuthorized:false,
 readback:recRow()}).savedRequestIndependentlyVerified,false);
eq(reviewRequestRecoveryV3218({...rec(),readbackAuthorized:true,
 readback:{...recRow(),business_id:BAD}}).savedRequestIndependentlyVerified,false);
eq(reviewRequestRecoveryV3218({...rec(),readbackAuthorized:true,
 readback:{...recRow(),request_origin:"website_native"}}).savedRequestIndependentlyVerified,false);
eq(reviewRequestRecoveryV3218({...rec(),scope:{...recScope(),businessId:BAD},
 readbackAuthorized:true,readback:recRow()}).savedRequestIndependentlyVerified,false);
eq(reviewRequestRecoveryV3218({...rec(),writeState:"not_found"}).status,"not_verified_missing");
const rollup=()=>({business_id:BID,source:"server_authorized_rollup",
 period_start:"2026-10-01",enquiriesReceived:10,waitingForOwner:4,
 acceptedEnquiries:2,bookingRequests:3,independentlyConfirmedBookings:1,
 websiteVisits:175});
const roll=()=>reviewBusinessOutcomesV3218({businessId:BID,
 authorisedBusinessId:BID,rollup:rollup()});
const intel=roll();
ok(intel.ok);
eq(intel.priority,"review_waiting");
eq(intel.aggregatedLearningPerformed,false);
eq(intel.retrainingPerformed,false);
eq(intel.noNewCustomerActions,true);
eq(intel.customerDetailsReturned,false);
eq(intel.independentlyFetchedByThisModule,false);
eq(reviewBusinessOutcomesV3218({businessId:BID,
 authorisedBusinessId:BAD,rollup:rollup()}).ok,false);
eq(reviewBusinessOutcomesV3218({businessId:BID,
 authorisedBusinessId:BID,rollup:{...rollup(),business_id:BAD}}).ok,false);
eq(reviewBusinessOutcomesV3218({businessId:BID,
 authorisedBusinessId:BID,rollup:{...rollup(),source:"owner_guess"}}).ok,false);
eq(reviewBusinessOutcomesV3218({businessId:BID,
 authorisedBusinessId:BID,rollup:{...rollup(),enquiriesReceived:-1}}).ok,false);
eq(reviewBusinessOutcomesV3218({businessId:BID,
 authorisedBusinessId:BID,rollup:{...rollup(),enquiriesReceived:1,
 waitingForOwner:2}}).ok,false);
eq(reviewBusinessOutcomesV3218({businessId:BID,
 authorisedBusinessId:BID,rollup:{...rollup(),bookingRequests:0,
 independentlyConfirmedBookings:1}}).ok,false);
const noActivity=reviewBusinessOutcomesV3218({businessId:BID,
 authorisedBusinessId:BID,ownerSharingConsent:true,
 rollup:{...rollup(),enquiriesReceived:0,waitingForOwner:0,
 acceptedEnquiries:0,bookingRequests:0,
 independentlyConfirmedBookings:0,websiteVisits:0}});
eq(noActivity.priority,"keep_evidence_current");
eq(noActivity.ownerSharingConsentReported,true);
eq(noActivity.aggregatedLearningPerformed,false);
const app=()=>({id:APP,business_id:BID,status:"live",
 current_live_version_id:APPVER,public_slug:"example-business"});
const version=()=>({id:APPVER,mini_app_id:APP,state:"live",
 config:{modules:[{key:"enquiry",enabled:true},{key:"booking_request",enabled:true}],
 publicProfile:{services:[{name:"Catering"}]}}});
const catalog=()=>[{module_key:"enquiry",status:"available",
 capabilities:{customer_action:true}},
 {module_key:"booking_request",status:"available",
 capabilities:{confirmation_required_by_business:true}}];
const website=()=>({id:SITE,businessId:BID,generation:17,
 theme:{},sections:[{id:"contact",type:"contact",enabled:true,
 email:"approved@example.test"}]});
const ENDPOINT="https://abcdefghijklmnopqrst.supabase.co/functions/v1/busy-mini-app-link";
const journey=()=>planUniversalCustomerJourneyV3218({
 businessId:BID,website:website(),app:app(),liveVersion:version(),
 catalog:catalog(),endpoint:ENDPOINT,businessType:"Unusual arts cooperative",
 description:"We take enquiries for commissions"});
const journeyValue=journey();
ok(journeyValue.ok,journeyValue.reason);
eq(journeyValue.anyLegitimateIndustryEligible,true);
eq(journeyValue.recommendedCapability,"enquiry");
eq(journeyValue.handoffCanBePrepared,true);
eq(journeyValue.ownerApprovedHandoffInPrivateDraft,false);
eq(journeyValue.nativeWebsiteFormActive,false);
eq(journeyValue.noCustomerRequestCreated,true);
eq(journeyValue.steps.length,4);
eq(journeyValue.publicHandoffClickVerified,false);
eq(journeyValue.providerDeliveryVerified,false);
eq(planUniversalCustomerJourneyV3218({businessId:BID,
 website:{...website(),businessId:BAD},app:app(),liveVersion:version()}).ok,false);
eq(planUniversalCustomerJourneyV3218({businessId:BID,
 website:website(),app:{...app(),business_id:BAD}}).ok,false);
const noRuntime=planUniversalCustomerJourneyV3218({
 businessId:BID,website:website(),app:app(),
 liveVersion:{...version(),state:"draft"},catalog:catalog(),
 endpoint:ENDPOINT,description:"We take enquiries"});
eq(noRuntime.actualPublishedAppModuleIndicated,false);
eq(noRuntime.publicFormActive,false);
const noApp=planUniversalCustomerJourneyV3218({
 businessId:BID,website:website(),businessType:"Mysterious new trade"});
ok(noApp.ok);
eq(noApp.actualPublishedAppModuleIndicated,false);
eq(noApp.nativeWebsiteFormActive,false);
const ui=source("src/screens/websiteAppHandoffReview.js");
ok(ui.includes("planUniversalCustomerJourneyV3218"));
ok(ui.includes("How would BUSY connect my website and app?"));
ok(ui.includes("Nothing is published or sent"));
const schemaSql=source("docs/sql-proposals/V3_218_WEBSITE_INTAKE_DRAFT_NOT_DEPLOYABLE.sql");
ok(schemaSql.includes("RAISE EXCEPTION"));
ok(schemaSql.includes("BEGIN;"));
ok(schemaSql.includes("REVOKE ALL"));
ok(schemaSql.includes("ENABLE ROW LEVEL SECURITY"));
ok(schemaSql.includes("UNIQUE (business_id, website_id, deployment_id, approval_id"));
ok(!existsSync(new URL("../supabase/functions/busy-website-request-intake/index.ts",import.meta.url)));
const tx=source("supabase/functions/busy-website-request-intake/requestTransactionDesignV3217.mjs");
ok(tx.includes("transactionExecutable:false"));
console.log("V3.218 focused offline regression: "+assertions+
 " assertions passed; zero live DB, provider or paid-build actions.");
