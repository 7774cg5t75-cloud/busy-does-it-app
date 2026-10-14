/**
 * V3.222: fresh read-only staging drift, version/receipt priority and
 * shared-harness security invariants. Zero SQL writes, provider actions,
 * customer data, website publication or signed builds.
 */
import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";
import {inspectFirstStagingPhaseV3222}
 from "../src/core/stagingFirstPhaseEvidenceV3222.mjs";
import {chooseOwnerNextActionV3222}
 from "../src/core/businessNextActionEvidenceV3222.mjs";
import {canonicalWebsiteHandoffUrl}
 from "../src/core/websiteAppHandoffV3214.mjs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
let n=0;
const ok=(x,m)=>{assert.ok(x,m);n++};
const eq=(a,b,m)=>{assert.deepEqual(a,b,m);n++};
const BASE="staging/ISOLATED_ONLY_business_core_v3180.sql";
const snapshot=JSON.parse(read("staging/recorded-readonly-observation-v3220.json"));
const base=()=>({projectRef:snapshot.projectRef,projectName:snapshot.projectName,
 catalogueSource:"connector_read_only_pg_catalog",
 observedAt:"2026-10-14",
 publicTables:[...snapshot.publicTables],
 migrationLedger:[...snapshot.appliedMigrations],baselineSql:read(BASE)});
const first=inspectFirstStagingPhaseV3222(base());
ok(first.ok,first.reason);
eq(first.canaryIntact,true);
eq(first.phaseStatus,"review_uninstalled_baseline");
eq(first.sourceBaselineLooksCompatible,true);
eq(first.sourceMissingPatterns.length,0);
eq(first.unexpectedTables.length,0);
eq(first.unexpectedLedger.length,0);
eq(first.reviewStages.length,6);
eq(first.baseBusinessTablePresent,false);
eq(first.baseMembershipTablePresent,false);
eq(first.applyAllowed,false);
eq(first.stagingInstalled,false);
eq(first.tenantRlsProven,undefined);
eq(first.actualTenantMembershipVerified,false);
eq(first.fullSchemaCompatibilityProven,false);
eq(first.rollbackRehearsed,false);
eq(first.nativeWebsiteIntakeEnabled,false);
eq(first.productionTouched,false);
eq(first.catalogueSourceCannotBeAuthenticatedByThisFunction,true);
const known=["20261010224121","20261010224205"];
for(const changed of [
 {publicTables:["busy_staging_rls_canary","unreviewed_client_table"]},
 {publicTables:["busy_staging_rls_canary","busy_businesses"]},
 {migrationLedger:[...known,"20261014121212"]},
 {migrationLedger:[]},
 {publicTables:[]}
]){
 const x=inspectFirstStagingPhaseV3222({...base(),...changed});
 ok(x.ok);
 eq(x.phaseStatus,"halt_unexpected_remote_state");
 eq(x.applyAllowed,false);
 eq(x.stagingInstalled,false);
}
for(const changed of [
 {projectRef:"production-project"},
 {projectName:"Some other business"},
 {catalogueSource:"browser_claim"},
 {publicTables:["not a valid table name"]},
 {migrationLedger:["not a timestamp"]},
 {baselineSql:""},
]){
 const x=inspectFirstStagingPhaseV3222({...base(),...changed});
 if(changed.baselineSql===""){ok(x.ok);eq(x.sourceBaselineLooksCompatible,false);}
 else {eq(x.ok,false);}
 eq(x.applyAllowed,false);
}
const both=inspectFirstStagingPhaseV3222({...base(),
 publicTables:["busy_staging_rls_canary","busy_businesses","busy_business_memberships"]});
ok(both.ok);
eq(both.phaseStatus,"inspect_existing_baseline_compatibility");
eq(both.applyAllowed,false);
const BID="11111111-1111-4111-8111-111111111111";
const OTHER="99999999-9999-4999-8999-999999999999";
const APP="22222222-2222-4222-8222-222222222222";
const VER="33333333-3333-4333-8333-333333333333";
const ENDPOINT="https://abcdefghijklmnopqrst.supabase.co/functions/v1/busy-mini-app-link";
const app=()=>({id:APP,business_id:BID,current_live_version_id:VER,
 status:"live",public_slug:"example-cafe"});
const version=()=>({id:VER,mini_app_id:APP,state:"live",
 config:{modules:[{key:"enquiry",enabled:true}],
 publicProfile:{services:[]}}});
const link=()=>({ownerApproved:true,intent:"enquiry",appId:APP,
 liveVersionId:VER,slug:"example-cafe",
 url:canonicalWebsiteHandoffUrl({endpoint:ENDPOINT,slug:"example-cafe",
 kind:"enquiry",appId:APP,liveVersionId:VER})});
const website=()=>({businessId:BID,id:"private-site",generation:4,
 theme:{appRequestLinks:{enquiry:link()}},
 sections:[{id:"contact",type:"contact",enabled:true,email:"owner@example.test"}]});
const catalog=()=>[{module_key:"enquiry",status:"available",
 capabilities:{customer_action:true}}];
const rollup=()=>({business_id:BID,source:"server_authorized_rollup",
 period_start:"2026-10-01",enquiriesReceived:7,waitingForOwner:3,
 acceptedEnquiries:2,bookingRequests:1,
 independentlyConfirmedBookings:0,websiteVisits:70});
const context=()=>({businessId:BID,website:website(),
 app:app(),liveVersion:version(),catalog:catalog(),endpoint:ENDPOINT,
 businessType:"Unfamiliar seasonal business",
 description:"We would like customers to make enquiries",
 authorisedBusinessId:BID});
const normal=chooseOwnerNextActionV3222(context());
ok(normal.ok,normal.reason);
eq(normal.action,"review_existing_capability");
eq(normal.maySend,false);
eq(normal.mayPublish,false);
eq(normal.customerRequestVerified,false);
eq(normal.outcomeTruthIndependentlyVerified,false);
const waiting=chooseOwnerNextActionV3222({...context(),rollup:rollup()});
ok(waiting.ok,waiting.reason);
eq(waiting.action,"review_waiting_enquiries");
eq(waiting.usedOutcomeRollup,true);
eq(waiting.rollupIndependentlyFetchedHere,false);
eq(waiting.mayChargeProvider,false);
eq(waiting.mayCrossBusinessLearn,false);
eq(waiting.bookingConfirmed,false);
eq(waiting.personalCustomerDetailsReturned,false);
const pending=chooseOwnerNextActionV3222({...context(),pendingWrite:"unknown",
 rollup:rollup()});
eq(pending.action,"verify_receipt_first");
eq(pending.usedOutcomeRollup,false);
eq(pending.customerRequestVerified,false);
const stale=chooseOwnerNextActionV3222({...context(),
 website:{...website(),theme:{appRequestLinks:{enquiry:{
 ...link(),liveVersionId:OTHER}}}},rollup:rollup()});
eq(stale.action,"review_version_change");
eq(stale.mayPublish,false);
const cross=chooseOwnerNextActionV3222({...context(),
 website:{...website(),businessId:OTHER},rollup:rollup()});
eq(cross.ok,false);
eq(cross.mayActAutomatically,false);
const otherRollup=chooseOwnerNextActionV3222({...context(),
 authorisedBusinessId:OTHER,rollup:rollup()});
eq(otherRollup.ok,true);
eq(otherRollup.action,"review_existing_capability");
eq(otherRollup.rollupAcceptedAsScopedSourceLabel,false);
const badRollup=chooseOwnerNextActionV3222({...context(),
 rollup:{...rollup(),waitingForOwner:9}});
eq(badRollup.action,"review_existing_capability");
const noModule=chooseOwnerNextActionV3222({...context(),
 app:null,liveVersion:null,catalog:[]});
ok(noModule.ok);
eq(noModule.action,"prepare_supported_module");
eq(noModule.mayActAutomatically,false);
const source=read("src/screens/websiteAppHandoffReview.js");
ok(source.includes("chooseBusinessJourneyDecisionV3221"));
ok(source.includes("BUSY recommends:"));
ok(!existsSync(new URL("../supabase/functions/busy-website-request-intake/index.ts",import.meta.url)));
console.log("V3.222 focused staging and Business Brain contract: "+n+
 " assertions passed; no live database action or false customer receipt.");
