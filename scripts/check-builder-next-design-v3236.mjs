/**
 * V3.236: actual existing universal builder capability parser -> ONE
 * trusted business-scoped customer-next-step + two distinct safe design
 * directions. No generated code, provider sends, remote SQL or paid builds.
 */
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {planUniversalBuilderRequest}
 from "../src/core/universalBuilderPlanV3210.mjs";
import {reviewUniversalBuilderNextStepV3236 as next}
 from "../src/core/sharedBuilderNextStepV3236.mjs";
import {reviewSharedBuilderDesignDirectionsV3236 as visual}
 from "../src/core/sharedBuilderDesignDirectionsV3236.mjs";
const B="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const OTHER="bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const website={
 id:"site-private-1",businessId:B,generation:8,
 businessType:"Independent business",sections:[
  {id:"hero",type:"hero",enabled:true,title:"Hello"},
  {id:"services",type:"services",enabled:true,items:[{title:"Example service",body:"Example"}]},
  {id:"contact",type:"contact",enabled:true,email:"hello@example.test"}
 ],theme:{lockedSections:["hero","owner-photo-section"]}};
const app={id:"app-private-1",business_id:B,draft_revision:12,
 draft_config:{modules:[
  {key:"business_profile",enabled:true},
  {key:"services",enabled:true},
  {key:"enquiry",enabled:true},
  {key:"booking_request",enabled:true}
 ],navigation:["business_profile","services","enquiry","booking_request"],
 presentation:{ownerLockedElements:["approved-logo"]},
 publicProfile:{businessName:"Example Business",services:[{name:"Example service"}]}}};
const catalog=[
 {module_key:"business_profile",status:"available",capabilities:{}},
 {module_key:"services",status:"available",capabilities:{}},
 {module_key:"enquiry",status:"available",capabilities:{customer_action:true}},
 {module_key:"booking_request",status:"available",
  capabilities:{confirmation_required_by_business:true}}
];
let count=0;
const eq=(a,b,desc)=>{assert.deepEqual(a,b,desc);count++};
const ok=(x,desc)=>{assert.ok(x,desc);count++};
const make=(request,more={})=>planUniversalBuilderRequest({
 request,businessId:B,businessType:"Independent business",
 website,app,catalog,...more});
function check(request,surface="app"){
 const plan=make(request);
 ok(plan.ok,plan.reason);
 const a=next({plan,businessId:B,website,app,surface});
 ok(a.ok,a.reason);
 const d=visual({plan,businessId:B,website,app,surface});
 ok(d.ok,d.reason);
 eq(a.kind,"shared_builder_next_step_v3236");
 eq(d.kind,"shared_builder_design_options_v3236");
 eq(a.oneRecommendedStepOnly,true);
 eq(a.liveVerified,false);
 eq(a.mayExecute,false);
 eq(a.mayPublish,false);
 eq(a.mayCharge,false);
 eq(a.mayContactCustomer,false);
 eq(a.mayConfirmBooking,false);
 eq(a.noCustomerTaskVerified,true);
 eq(d.optionCount,2);
 eq(d.directions.length,2);
 eq(d.directions[0].id,"calm_clarity");
 eq(d.directions[1].id,"task_first");
 ok(d.directions[0].focus!==d.directions[1].focus);
 ok(d.directions[0].decisionTradeoff!==d.directions[1].decisionTradeoff);
 eq(d.chosenByActualScreenshot,false);
 eq(d.actualVisualQualityUnknown,true);
 eq(d.noRenderedPreview,true);
 eq(d.mayApply,false);
 eq(d.mayPublish,false);
 eq(d.maySpend,false);
 eq(d.maySend,false);
 eq(d.privateReviewOnly,true);
 eq(d.ownerLocksObserved,surface==="website"?2:1);
 for(const option of d.directions){
  eq(option.noVisualScreenshotsCaptured,true);
  eq(option.noBookingsOrPaymentsEnabled,true);
  eq(option.mustPreserveLockedElements,true);
  eq(option.ownerApprovalBeforeAnyEdit,true);
  eq(option.noApprovedMediaInvented,true);
  eq(option.screens,["phone","tablet","desktop"]);
 }
 eq(JSON.stringify(plan.source),JSON.stringify(a.source));
 eq(JSON.stringify(plan.source),JSON.stringify(d.source));
 return {plan,a,d};
}
const available=check("Customers can enquire");
eq(available.a.recommended.action,"check_customer_task");
eq(available.a.recommended.capabilityId,"enquiry");
eq(available.a.recommended.requiresRealCustomerReceipt,true);
eq(available.a.capabilitiesToVerify,1);
const booking=check("Customers book appointments");
eq(booking.a.recommended.capabilityId,"booking_request");
eq(booking.a.recommended.action,"check_customer_task");
eq(booking.d.targetTask,"booking_request");
ok(booking.d.directions[1].focus.includes("booking-request action"));
const missingWeb=check("Customers book appointments","website");
eq(missingWeb.a.recommended.action,"plan_missing_capability");
const provider=check("Customers pay deposits and receive SMS confirmations");
ok(provider.a.capabilitiesNeedingDevelopment>=1);
eq(provider.a.recommended.action,"plan_missing_capability");
const service=check("Show our services");
eq(service.a.recommended.action,"check_customer_task");
const siteService=check("Show our services","website");
eq(siteService.a.recommended.action,"check_customer_task");
const absent=make("Show customer testimonials");
eq(next({plan:absent,businessId:B,website,app,surface:"website"}).recommended.action,
 "review_existing_section");
const unfamiliar=check("Build holographic virtual pine tree stock trading");
eq(unfamiliar.plan.unfamiliarRequirement,true);
eq(unfamiliar.a.recommended.action,"plan_missing_capability");
const noApp=make("Customers enquire",{app:null});
const withoutApp=next({plan:noApp,businessId:B,website,app:null,surface:"app"});
ok(withoutApp.ok);
eq(withoutApp.recommended.action,"configure_supported_module");
// Incorrect current revisions, tenant, role proxies or fabricated live
// evidence cannot grant even a recommendation as if it were current.
for(const change of [
 {businessId:OTHER,website,app,plan:booking.plan},
 {businessId:B,website:{...website,generation:9},app,plan:booking.plan},
 {businessId:B,website,app:{...app,draft_revision:13},plan:booking.plan},
 {businessId:B,website,app:{...app,business_id:OTHER},plan:booking.plan},
 {businessId:B,website:{...website,businessId:OTHER},app,plan:booking.plan},
 {businessId:B,website,app,plan:{...booking.plan,allLiveOutcomesUnverified:false}},
 {businessId:B,website,app,plan:{...booking.plan,noChargeMade:false}},
 {businessId:B,website,app,plan:{...booking.plan,capabilities:[{
    ...booking.plan.capabilities[0],app:{status:"invented"}
  }]}},
 {businessId:B,website,app,plan:{...booking.plan,capabilities:[{
    ...booking.plan.capabilities[0],ownerApprovalRequired:false
  }]}}
]){
 const v=next({surface:"app",...change});
 eq(v.ok,false);eq(v.mayExecute,false);eq(v.liveVerified,false);
 eq(visual({surface:"app",...change}).ok,false);
}
eq(next({plan:booking.plan,businessId:B,website,app,surface:"untrusted"}).ok,false);
eq(next({plan:null,businessId:B,website,app}).ok,false);
const file=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const ui=file("src/screens/universalBuilderPlanReview.js");
ok(ui.includes("reviewUniversalBuilderNextStepV3236({"));
ok(ui.includes("reviewSharedBuilderDesignDirectionsV3236({"));
ok(ui.includes("BUSY's suggested next step"));
ok(ui.includes("Compare two design approaches"));
ok(ui.includes("These are planning ideas, not rendered designs"));
ok(ui.includes("private website section order"));
ok(ui.includes('onSaveAppChanges?.({'));
ok(ui.includes('confirmUniversalAppNavigation({'));
ok(ui.includes("setShowDesignDirections(false)"));
const site=file("src/screens/websiteBuilder.js");
const mini=file("src/screens/miniApps.js");
ok(site.includes("UniversalBuilderPlanReview"));
ok(mini.includes("UniversalBuilderPlanReview"));
const legacy=file("src/core/universalBuilderPlanV3210.mjs");
ok(legacy.includes("allLiveOutcomesUnverified:true"));
ok(legacy.includes("ownerApprovalRequired:true"));
ok(!file("src/core/sharedBuilderNextStepV3236.mjs").includes("fetch("));
ok(!file("src/core/sharedBuilderDesignDirectionsV3236.mjs").includes("fetch("));
await import("./prepare-builder-staging-v3236.mjs");
const packet=JSON.parse(readFileSync("/tmp/bdi-v3236-builder-review/packet.json","utf8"));
eq(packet.scenarioCount,52);
eq(packet.additionalBuilderScenarios.length,10);
eq(packet.versionedMigrations,69);
ok(packet.additionalBuilderScenarios.every(s=>s.status==="not_verified"));
ok(packet.sourceHashes.every(s=>/^[0-9a-f]{64}$/.test(s.sha256)));
for(const key of ["ownerApproved","hostedSqlExecuted","actualJwtTested",
 "screenshotsCaptured","realCustomerJourneyVerified","nativeDevicesTested",
 "backupRestoreVerified","providerContacted","paidBuildUsed","editsApplied",
 "websitePublished","appPublished","productionTouched","canExecute"])
 eq(packet[key],false);
console.log("V3.236: "+count+" shared builder action, visual option, tenant and staging assertions passed.");
