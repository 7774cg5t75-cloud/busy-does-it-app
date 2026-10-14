/**
 * V3.219 source-only regression: measured staging gaps, immutable
 * website/app link recovery, scoped notification outbox and Business Brain.
 * No DB writes, website publish, provider sends, or paid builds.
 */
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {auditStagingSchemaV3219}
 from "../src/core/stagingSchemaGateV3219.mjs";
import {reviewWebsiteAppVersionDriftV3219}
 from "../src/core/publishedVersionRecoveryV3219.mjs";
import {reviewNotificationOutboxV3219}
 from "../src/core/outboxReconciliationV3219.mjs";
import {adviseVerifiedCustomerJourneyV3219}
 from "../src/core/customerJourneyActionV3219.mjs";
import {canonicalWebsiteHandoffUrl}
 from "../src/core/websiteAppHandoffV3214.mjs";
const source=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
let checks=0;
const ok=(v,m)=>{assert.ok(v,m);checks++;};
const eq=(a,b,m)=>{assert.deepEqual(a,b,m);checks++;};
const BID="11111111-1111-4111-8111-111111111111";
const OTHER="99999999-9999-4999-8999-999999999999";
const APP="22222222-2222-4222-8222-222222222222";
const LIVE="33333333-3333-4333-8333-333333333333";
const PREVIOUS="44444444-4444-4444-8444-444444444444";
const REQUEST="55555555-5555-4555-8555-555555555555";
const EVENT="miniapp:guest-request:received";
const ENDPOINT="https://abcdefghijklmnopqrst.supabase.co/functions/v1/busy-mini-app-link";
const SLUG="example-business";
const catalog=()=>[
 {module_key:"enquiry",status:"available",
 capabilities:{customer_action:true}},
 {module_key:"booking_request",status:"available",
 capabilities:{confirmation_required_by_business:true}}
];
const liveApp=()=>({id:APP,business_id:BID,status:"live",public_slug:SLUG,
 current_live_version_id:LIVE});
const version=()=>({id:LIVE,mini_app_id:APP,state:"live",
 config:{modules:[{key:"enquiry",enabled:true},
  {key:"booking_request",enabled:true}],
 publicProfile:{services:[{name:"Catering"}]}}});
const link=kind=>({ownerApproved:true,intent:kind,appId:APP,
 liveVersionId:LIVE,slug:SLUG,
 url:canonicalWebsiteHandoffUrl({endpoint:ENDPOINT,slug:SLUG,kind,
 appId:APP,liveVersionId:LIVE})});
const site=()=>({id:"owner-site",businessId:BID,generation:42,
 theme:{appRequestLinks:{enquiry:link("enquiry")}},
 sections:[{id:"contact",type:"contact",enabled:true,
 email:"owner@example.test"}]});
const metadata=()=>({source:"read_only_pg_catalog",
 environment:"isolated_staging",observedAt:"2026-10-14",
 tables:["busy_staging_rls_canary"],columns:{},
 functions:[],rlsTables:["busy_staging_rls_canary"],
 policies:[{table:"busy_staging_rls_canary",name:"canary_policy"}],
 migrationHistoryReviewed:false});
const measured=auditStagingSchemaV3219(metadata());
ok(measured.ok);
eq(measured.stagingReady,false);
eq(measured.websiteIntakeDeployAllowed,false);
eq(measured.actualMigrationPerformed,false);
eq(measured.missingTables.length,5);
ok(measured.missingTables.includes("busy_mini_app_requests"));
ok(measured.missingTables.includes("busy_business_memberships"));
eq(measured.missingGuestRpc,true);
eq(measured.sourceCompatibilityChecksPassed,0);
eq(measured.liveEndpointEnabled,false);
eq(measured.tenantIsolationProven,false);
eq(measured.rollbackTested,false);
eq(measured.requiresOwnerApproval,true);
const allNames=[
 "busy_business_memberships","busy_mini_apps","busy_mini_app_versions",
 "busy_mini_app_requests","busy_mini_app_guest_challenges"];
const metaComplete={...metadata(),tables:allNames,
 columns:{busy_mini_app_requests:["id","business_id","mini_app_id",
 "request_type","status","request_origin"],
 busy_mini_app_versions:["id","mini_app_id","state"]},
 functions:["busy_mini_app_create_guest_request"],
 rlsTables:allNames,policies:[],migrationHistoryReviewed:true};
const full=auditStagingSchemaV3219(metaComplete);
eq(full.sourceCompatibilityChecksPassed,6);
eq(full.sourceMetadataLooksCompatible,true);
eq(full.stagingReady,false);
eq(full.websiteIntakeDeployAllowed,false);
eq(full.tenantIsolationProven,false);
eq(full.securityAuditCompleted,false);
eq(auditStagingSchemaV3219({...metadata(),source:"website_user_claim"}).ok,false);
eq(auditStagingSchemaV3219({...metadata(),environment:"production"}).ok,false);
eq(auditStagingSchemaV3219({...metadata(),columns:{foo:["bad field name"]}}).ok,false);
eq(auditStagingSchemaV3219({...metadata(),tables:["inject;sql"]}).ok,false);
eq(auditStagingSchemaV3219({...metaComplete(),
 columns:{...metaComplete.columns,busy_mini_app_requests:["id"]}})
 .sourceMetadataLooksCompatible,false);
eq(auditStagingSchemaV3219({...metaComplete,functions:[]})
 .sourceCompatibilityChecksPassed,5);
eq(auditStagingSchemaV3219({...metaComplete,rlsTables:[]})
 .sourceCompatibilityChecksPassed,5);
eq(auditStagingSchemaV3219({...metaComplete,migrationHistoryReviewed:false})
 .sourceCompatibilityChecksPassed,5);
const driftArgs=()=>({businessId:BID,website:site(),
 app:liveApp(),liveVersion:version(),kind:"enquiry",endpoint:ENDPOINT});
const good=reviewWebsiteAppVersionDriftV3219(driftArgs());
ok(good.ok);
eq(good.currentLinkValid,true);
eq(good.canonicalLinkMatched,true);
eq(good.publicClickVerified,false);
eq(good.canAutoReconnect,false);
eq(good.canRepublishWithoutOwner,false);
eq(good.customerRequestCreated,false);
eq(good.bookingConfirmed,false);
eq(good.requiresSeparateWebsiteRepublish,false);
const stale=fn=>{
 const a=driftArgs();fn(a);
 return reviewWebsiteAppVersionDriftV3219(a);
};
eq(stale(a=>a.app.current_live_version_id=PREVIOUS).currentLinkValid,false);
eq(stale(a=>a.liveVersion.id=PREVIOUS).requiresSeparateWebsiteRepublish,true);
eq(stale(a=>a.liveVersion.state="draft").requiresOwnerReapproval,true);
eq(stale(a=>a.app.status="disabled").canAutoReconnect,false);
eq(stale(a=>a.liveVersion.config.modules=[]).requiresSeparateWebsiteRepublish,true);
eq(stale(a=>a.website.theme.appRequestLinks.enquiry.url+="&next=https://evil.test").canonicalLinkMatched,false);
eq(stale(a=>a.website.theme.appRequestLinks.enquiry.slug="recycled").currentLinkValid,false);
eq(stale(a=>a.endpoint="https://evil.test/functions/v1/busy-mini-app-link").currentLinkValid,false);
eq(stale(a=>a.endpoint="").requiresOwnerReapproval,true);
eq(stale(a=>a.app.business_id=OTHER).ok,false);
eq(stale(a=>a.website.businessId=OTHER).ok,false);
eq(stale(a=>a.website.theme.appRequestLinks={}).action,"review_new_handoff");
eq(stale(a=>a.pendingWrite="unknown").action,
 "reconcile_existing_receipt_before_any_retry");
eq(stale(a=>a.pendingWrite="unknown").recommendNewSubmission,false);
eq(stale(a=>a.pendingWrite="committed").pendingRequestNeedsReadback,true);
eq(stale(a=>a.kind="payment").ok,false);
const outbox=()=>({id:PREVIOUS,business_id:BID,request_id:REQUEST,
 event_key:EVENT,state:"pending"});
const outArgs=()=>({businessId:BID,requestId:REQUEST,
 eventKey:EVENT,row:outbox(),readbackAuthorized:true});
const pending=reviewNotificationOutboxV3219(outArgs());
ok(pending.ok);
eq(pending.action,"reconcile_in_flight_delivery");
eq(pending.deliveryVerified,false);
eq(pending.mayResend,false);
eq(pending.customerReplyDelivered,false);
eq(reviewNotificationOutboxV3219({...outArgs(),readbackAuthorized:false}).ok,false);
eq(reviewNotificationOutboxV3219({...outArgs(),businessId:OTHER}).ok,false);
eq(reviewNotificationOutboxV3219({...outArgs(),row:{...outbox(),request_id:OTHER}}).ok,false);
eq(reviewNotificationOutboxV3219({...outArgs(),row:{...outbox(),state:"unknown"}}).ok,false);
eq(reviewNotificationOutboxV3219({...outArgs(),row:{...outbox(),state:"failed"}}).action,
 "owner_review_retry_policy");
eq(reviewNotificationOutboxV3219({...outArgs(),row:{...outbox(),state:"dead_letter"}}).action,
 "owner_review_dead_letter");
eq(reviewNotificationOutboxV3219({...outArgs(),row:{...outbox(),state:"accepted_by_provider"}}).deliveryVerified,false);
const assertedProof={business_id:BID,request_id:REQUEST,event_key:EVENT,
 notification_id:PREVIOUS,signatureVerifiedByServer:true,
 providerDeliveryState:"delivered",deliveryReferencePresent:true};
const delivery=reviewNotificationOutboxV3219({...outArgs(),
 row:{...outbox(),state:"delivered"},providerProof:assertedProof});
eq(delivery.providerClaimPresent,true);
eq(delivery.deliveryVerified,false);
eq(delivery.independentProviderVerificationByThisModule,false);
eq(delivery.mayResend,false);
eq(reviewNotificationOutboxV3219({...outArgs(),
 row:{...outbox(),state:"delivered"},
 providerProof:{...assertedProof,business_id:OTHER}}).providerClaimPresent,false);
const action=adviseVerifiedCustomerJourneyV3219({...driftArgs(),
 catalog:catalog(),businessType:"Catering",description:"We want enquiries"});
ok(action.ok);
eq(action.action,"review_website_app_handoff");
eq(action.sendAllowed,false);
eq(action.providerSpendAllowed,false);
eq(action.publicFormActive,false);
eq(action.independentlyVerifiedCustomerOutcome,false);
eq(action.customerDataIncluded,false);
eq(adviseVerifiedCustomerJourneyV3219({...driftArgs(),
 catalog:catalog(),businessType:"Catering",description:"We want enquiries",
 pendingWrite:"unknown"}).action,"check_existing_receipt");
const recent=adviseVerifiedCustomerJourneyV3219({...driftArgs(),
 website:{...site(),theme:{appRequestLinks:{
 enquiry:{...link("enquiry"),liveVersionId:PREVIOUS}}}},
 catalog:catalog(),businessType:"Catering",description:"We want enquiries"});
eq(recent.action,"review_stale_website_link");
eq(recent.ownerApprovalRequired,true);
const other=adviseVerifiedCustomerJourneyV3219({...driftArgs(),
 website:{...site(),businessId:OTHER},catalog:catalog()});
eq(other.ok,false);
const screen=source("src/screens/websiteAppHandoffReview.js");
ok(screen.includes("adviseVerifiedCustomerJourneyV3219"));
ok(screen.includes("BUSY's suggested action: "));
ok(screen.includes("planUniversalCustomerJourneyV3218"));
const sql=source("docs/sql-proposals/V3_218_WEBSITE_INTAKE_DRAFT_NOT_DEPLOYABLE.sql");
ok(sql.includes("RAISE EXCEPTION"));
const intro=source("src/core/stagingSchemaGateV3219.mjs");
ok(intro.includes("stagingReady:false"));
ok(intro.includes("websiteIntakeDeployAllowed:false"));
console.log("V3.219 focused offline regression passed: "+checks+
 " assertions; staging remains source-blocked and no real customer transaction created.");
