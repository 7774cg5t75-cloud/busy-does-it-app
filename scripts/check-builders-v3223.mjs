/**
 * V3.223 real worktree source checks + staging rollback simulation +
 * bounded Business Brain rollup freshness. NO DATABASE OPERATIONS.
 */
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {inspectStagingBusinessParityV3223}
 from "../src/core/stagingBusinessParityV3223.mjs";
import {assessPhaseOneRecoveryV3223}
 from "../src/core/stagingPhaseOneRecoveryV3223.mjs";
import {inspectBusinessEvidenceFreshnessV3223}
 from "../src/core/businessEvidenceFreshnessV3223.mjs";
import {chooseOwnerNextActionV3223}
 from "../src/core/businessNextActionV3223.mjs";
import {canonicalWebsiteHandoffUrl}
 from "../src/core/websiteAppHandoffV3214.mjs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
let checks=0;
const eq=(x,y,msg)=>{assert.deepEqual(x,y,msg);checks++};
const ok=(x,msg)=>{assert.ok(x,msg);checks++};
const BASE=read("staging/ISOLATED_ONLY_business_core_v3180.sql");
const BRIDGE=read("supabase/schema/v3_25_production_bridge.sql");
const snapshot=JSON.parse(read("staging/recorded-readonly-observation-v3220.json"));
const parityArgs=()=>({baselineSql:BASE,bridgeSql:BRIDGE});
const parity=inspectStagingBusinessParityV3223(parityArgs());
ok(parity.ok,parity.reason);
eq(parity.sourceCompatible,true);
eq(parity.missingBaselineColumns,[]);
eq(parity.missingBridgeReferences,[]);
ok(parity.bridgeForeignKeyReferences.length>=4);
ok(parity.bridgeAuthUserReferenceCount>=2);
eq(parity.baselineColumns.busy_businesses.length,5);
eq(parity.baselineColumns.busy_business_memberships.length,4);
ok(parity.sensitiveFieldsFoundInBridge.includes("access_token"));
ok(parity.sensitiveFieldsFoundInBridge.includes("refresh_token"));
ok(parity.sensitiveFieldsFoundInBridge.includes("expo_push_token"));
eq(parity.bridgeContainsServerOnlyOrCredentialRelatedObjects,true);
eq(parity.authoritativeProductionSchemaCompared,false);
eq(parity.sourceRegexNotSqlParser,true);
eq(parity.tenantAuthorizationVerified,false);
eq(parity.mayApply,false);
eq(parity.stagingChanged,false);
for(const altered of [
 {projectRef:"production"},
 {baselinePath:"supabase/migrations/production.sql"},
 {bridgePath:"staging/just-copy-the-prod-schema.sql"},
 {baselineSql:""},
 {bridgeSql:""},
]){
 const value=inspectStagingBusinessParityV3223({...parityArgs(),...altered});
 eq(value.ok,false);
 eq(value.mayApply,false);
}
const missing=inspectStagingBusinessParityV3223({
 ...parityArgs(),baselineSql:BASE.replace(" name text not null"," company_title text not null")});
ok(missing.ok);
ok(missing.missingBaselineColumns.includes("busy_businesses.name"));
eq(missing.sourceCompatible,false);
eq(missing.mayApply,false);
const brokenRef=inspectStagingBusinessParityV3223({
 ...parityArgs(),bridgeSql:BRIDGE.replace(
  "references public.busy_businesses(id)","references public.busy_businesses(missing_key)")});
ok(brokenRef.ok);
eq(brokenRef.sourceCompatible,false);
ok(brokenRef.missingBridgeReferences.some(x=>x.column==="missing_key"));
const before=()=>({
 projectRef:snapshot.projectRef,projectName:snapshot.projectName,
 catalogueSource:"connector_read_only_pg_catalog",observedAt:"2026-10-14",
 publicTables:[...snapshot.publicTables],
 migrationLedger:[...snapshot.appliedMigrations]
});
const recovery=(extra={})=>assessPhaseOneRecoveryV3223({
 before:before(),after:before(),baselineSql:BASE,...extra});
const unchanged=recovery();
ok(unchanged.ok);
eq(unchanged.status,"no_observed_schema_change");
eq(unchanged.automaticRollbackAllowed,false);
eq(unchanged.restoreVerified,false);
eq(unchanged.anyDatabaseTouched,false);
const two=recovery({after:{...before(),
 publicTables:[...before().publicTables,"busy_businesses","busy_business_memberships"]}});
ok(two.ok);
eq(two.status,"candidate_phase_one_schema_needs_db_validation");
eq(two.observedIntroducedTables.length,2);
eq(two.mayApply,false);
eq(two.mayDropTables,false);
eq(two.mayRunDropCascade,false);
eq(two.SQLExecuted,false);
const half=recovery({after:{...before(),publicTables:[
 "busy_staging_rls_canary","busy_businesses"]}});
eq(half.status,"halt_and_preserve_evidence");
eq(half.automaticRollbackAllowed,false);
const unknown=recovery({after:{...before(),publicTables:[
 ...before().publicTables,"busy_rogue_table"]}});
eq(unknown.status,"halt_and_preserve_evidence");
const rollback=recovery({after:{...before(),migrationLedger:[
 ...before().migrationLedger,"20261014999999"]}});
eq(rollback.status,"halt_and_preserve_evidence");
eq(rollback.migrationLedgerChanged,true);
const missingCanary=recovery({after:{...before(),publicTables:[]}});
eq(missingCanary.status,"halt_and_preserve_evidence");
const pretendRestore=recovery({backupRestored:true,
 ownerReviewed:true,operatorConfirmed:true});
eq(pretendRestore.requestedRestoreClaimReported,true);
eq(pretendRestore.restoreVerified,false);
eq(pretendRestore.ownerApprovalVerified,false);
eq(pretendRestore.mayDropTables,false);
eq(assessPhaseOneRecoveryV3223({before:before(),after:{
 ...before(),projectRef:"prod"},baselineSql:BASE}).ok,false);
eq(assessPhaseOneRecoveryV3223({before:null,after:before(),baselineSql:BASE}).ok,false);
const BID="11111111-1111-4111-8111-111111111111";
const OTHER="99999999-9999-4999-8999-999999999999";
const APP="22222222-2222-4222-8222-222222222222";
const VER="33333333-3333-4333-8333-333333333333";
const ENDPOINT="https://abcdefghijklmnopqrst.supabase.co/functions/v1/busy-mini-app-link";
const app=()=>({id:APP,business_id:BID,status:"live",public_slug:"cafe",
 current_live_version_id:VER});
const ver=()=>({id:VER,mini_app_id:APP,state:"live",
 config:{modules:[{key:"enquiry",enabled:true}],publicProfile:{services:[]}}});
const linked=()=>({ownerApproved:true,intent:"enquiry",appId:APP,
 liveVersionId:VER,slug:"cafe",
 url:canonicalWebsiteHandoffUrl({endpoint:ENDPOINT,slug:"cafe",
 kind:"enquiry",appId:APP,liveVersionId:VER})});
const website=()=>({id:"private-site",businessId:BID,generation:9,
 theme:{appRequestLinks:{enquiry:linked()}},
 sections:[{id:"contact",type:"contact",enabled:true,email:"team@example.test"}]});
const rollup=()=>({business_id:BID,source:"server_authorized_rollup",
 period_start:"2026-10-01",enquiriesReceived:7,waitingForOwner:3,
 acceptedEnquiries:2,bookingRequests:2,
 independentlyConfirmedBookings:1,websiteVisits:99});
const evidence=()=>({businessId:BID,authorisedBusinessId:BID,
 rollup:rollup(),periodEnd:"2026-10-13",serverAsOf:"2026-10-14"});
const freshness=inspectBusinessEvidenceFreshnessV3223(evidence());
ok(freshness.ok,freshness.reason);
eq(freshness.daysSincePeriodEnd,1);
eq(freshness.rollupUsableForAdvice,true);
eq(freshness.sourceIndependentlyVerified,false);
eq(freshness.customerOutcomeVerified,false);
eq(freshness.mayNotify,false);
eq(freshness.noCrossBusinessLearning,true);
eq(freshness.anyCustomerPersonalDataIncluded,false);
for(const patch of [
 {authorisedBusinessId:OTHER},
 {rollup:{...rollup(),business_id:OTHER}},
 {rollup:{...rollup(),waitingForOwner:11}},
 {periodEnd:"2026-09-29"},
 {periodEnd:"2026-10-20"},
 {serverAsOf:"2026-10-24"},
 {periodEnd:"2026-02-30"},
 {serverAsOf:"not-a-date"}
]){
 const x=inspectBusinessEvidenceFreshnessV3223({...evidence(),...patch});
 eq(x.ok,false);
 eq(x.rollupUsableForAdvice,false);
 eq(x.mayNotify,false);
}
const owner=()=>({businessId:BID,website:website(),app:app(),
 liveVersion:ver(),endpoint:ENDPOINT,
 catalog:[{module_key:"enquiry",status:"available",capabilities:{customer_action:true}}],
 businessType:"Unknown crafts cooperative",
 description:"Please take enquiries",authorisedBusinessId:BID});
const review=chooseOwnerNextActionV3223({...owner(),rollup:rollup(),
 rollupPeriodEnd:"2026-10-13",serverAsOf:"2026-10-14"});
ok(review.ok,review.reason);
eq(review.action,"review_waiting_enquiries");
eq(review.oneRecommendedActionOnly,true);
eq(review.outcomeReportWasLocallyDateChecked,true);
eq(review.sourceVerificationByThisFunction,false);
eq(review.maySend,false);
eq(review.mayPublish,false);
eq(review.mayChargeProvider,false);
eq(review.providerDeliveryConfirmed,false);
const staleEvidence=chooseOwnerNextActionV3223({...owner(),rollup:rollup(),
 rollupPeriodEnd:"2026-10-02",serverAsOf:"2026-10-14"});
eq(staleEvidence.staleReportIgnored,true);
eq(staleEvidence.action,"review_existing_capability");
eq(staleEvidence.mayActAutomatically,false);
const unknownCommit=chooseOwnerNextActionV3223({...owner(),rollup:rollup(),
 rollupPeriodEnd:"2026-10-13",serverAsOf:"2026-10-14",
 pendingWrite:"unknown"});
eq(unknownCommit.action,"verify_receipt_first");
eq(unknownCommit.usedOutcomeRollup,false);
const changedVersion=chooseOwnerNextActionV3223({...owner(),
 website:{...website(),theme:{appRequestLinks:{enquiry:{
 ...linked(),liveVersionId:OTHER}}}},
 rollup:rollup(),rollupPeriodEnd:"2026-10-13",serverAsOf:"2026-10-14"});
eq(changedVersion.action,"review_version_change");
eq(changedVersion.mayPublish,false);
const cross=chooseOwnerNextActionV3223({...owner(),app:{
 ...app(),business_id:OTHER},rollup:rollup(),rollupPeriodEnd:"2026-10-13",
 serverAsOf:"2026-10-14"});
eq(cross.ok,false);
eq(cross.mayActAutomatically,false);
const noModule=chooseOwnerNextActionV3223({...owner(),app:null,
 liveVersion:null,catalog:[],rollup:null});
ok(noModule.ok);
eq(noModule.action,"prepare_supported_module");
eq(noModule.evidenceStatus,"no_outcome_rollup");
const view=read("src/screens/websiteAppHandoffReview.js");
ok(view.includes("chooseOwnerNextActionV3223"));
ok(view.includes("BUSY recommends: "));
ok(view.includes("showConnectedPlan&&connectedPlan.ok"));
const script=read("scripts/prepare-phase-one-review-v3223.mjs");
ok(script.includes("sqlExecuted:false"));
ok(script.includes("ephemeralDatabaseCreated:false"));
ok(!script.includes("tools.mcp__Supabase__"));
const sql=read("staging/ISOLATED_ONLY_business_core_v3180.sql");
ok(!sql.includes("drop table cascade"));
const catalogQuery=read("staging/READ_ONLY_v3223_phase_one_schema_contract.sql");
const noComments=catalogQuery.replace(/--[^\n]*/g,"").trim();
ok(!/\b(?:create|alter|drop|truncate|insert|update|delete|grant|revoke|execute|call|do)\s+(?:table|function|schema|role|extension|policy|from|into)?/i
 .test(noComments),"Metadata query must remain read-only.");
ok(noComments.toLowerCase().startsWith("select "));
ok(catalogQuery.includes("relforcerowsecurity"));
ok(catalogQuery.includes("supabase_migrations.schema_migrations"));
ok(catalogQuery.includes("busy_business_memberships"));

console.log("V3.223 staging-source parity, no-SQL recovery and evidence freshness: "+
 checks+" focused assertions passed; no remote database mutations.");
