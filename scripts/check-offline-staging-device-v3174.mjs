import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {executeOfflineJourneyPreflight,prepareStagingExecutionManifest}
 from "../src/core/offlineStagingPreflight.mjs";
import {SLOT,prepareDeviceReview,summarizeDeviceReview}
 from "../src/core/deviceReviewEvidence.mjs";
import {prepareOwnerImprovementPlan}
 from "../src/core/ownerImprovementPlan.mjs";
import {proposeCoordinatedAppChanges}
 from "../src/core/appCoordinatedStudio.mjs";
import {proposeTaskFirstNavigation}
 from "../src/core/appCustomerTaskDesign.mjs";

const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const tenant="11111111-1111-4111-8111-111111111111";
const other="22222222-2222-4222-8222-222222222222";
const keys=["business_profile","services","gallery","contact","enquiry",
 "booking_request","offers","loyalty"];
const mkApp=(active=keys)=>({
 modules:keys.map(key=>({key,enabled:active.includes(key)})),
 navigation:keys.filter(key=>active.includes(key)),
 presentation:{headerStyle:"refined",navigationStyle:"tabs",
 galleryLayout:"grid",layoutDensity:"comfortable",imageScale:"regular",
 imageCorners:"rounded"},
 publicProfile:{businessName:"Fictional Business",
 services:[{name:"Consultation",description:""}],
 assets:{gallery:[]}},
 privateCustomerRecords:[{email:"do-not-log@example.invalid"}],
 tokens:{ownerToken:"private-token"},published:{live:true}
});
const mkWebsite=()=>({
 id:"private-website",generation:7,businessName:"Fictional Business",
 sections:[{id:"hero",enabled:true},{id:"services",enabled:true}],
 pages:[{id:"home",enabled:true,sectionIds:["hero","services"]}],
 customerRecords:[{email:"website-private@example.invalid"}]
});
const brand={websiteBrief:{businessName:"Fictional Business",
 services:[{name:"Consultation",description:""}],
 description:"A genuine business description"},
 privateNotes:"do not echo this note"};
const base=mkApp(),originalApp=JSON.stringify(base);
const website=mkWebsite(),originalWeb=JSON.stringify(website);
assert.equal(executeOfflineJourneyPreflight({}).ok,false);
assert.equal(executeOfflineJourneyPreflight({appConfig:base,
 businessId:"not-a-uuid",draftRevision:1}).ok,false);
assert.equal(executeOfflineJourneyPreflight({appConfig:base,
 businessId:tenant,draftRevision:1,channel:"production"}).ok,false);
const booking=executeOfflineJourneyPreflight({appConfig:base,
 businessId:tenant,draftRevision:1,kind:"booking_request"});
assert.equal(booking.ok,true);
assert.equal(booking.executedFixtureCases,5);
assert.equal(booking.passedFixtureCases,5);
assert.equal(booking.failedFixtureCases,0);
assert.equal(booking.blockedFixtureCases,0);
assert.equal(booking.offlineGuardResult,"fixture_rules_passed_not_live_verified");
assert.equal(booking.liveSubmissionCount,0);
assert.equal(booking.canRunStaging,false);
assert.equal(booking.canRunProduction,false);
assert.equal(booking.diaryConfirmationVerified,false);
assert.equal(booking.tenantAuthorizationVerified,false);
assert.equal(booking.noCustomersContacted,true);
assert.equal(booking.noCharges,true);
assert.equal(JSON.stringify(booking).includes("do-not-log@example.invalid"),false);
assert.ok(booking.outcomes.every(x=>x.codeOnly===true&&x.verifiedLive===false));
const enquiry=executeOfflineJourneyPreflight({appConfig:base,
 businessId:tenant,draftRevision:1,kind:"enquiry",channel:"guest_web"});
assert.equal(enquiry.executedFixtureCases,4);
assert.equal(enquiry.passedFixtureCases,4);
assert.equal(enquiry.channel,"guest_web");
const withoutBooking=mkApp(keys.filter(x=>x!=="booking_request"));
const blockedBooking=executeOfflineJourneyPreflight({
 appConfig:withoutBooking,businessId:tenant,draftRevision:1});
assert.equal(blockedBooking.offlineGuardResult,"feature_setup_required");
assert.equal(blockedBooking.passedFixtureCases,0);
assert.equal(blockedBooking.blockedFixtureCases,5);
const withoutEnquiries=mkApp(keys.filter(x=>x!=="enquiry"));
const contactOnly=executeOfflineJourneyPreflight({
 appConfig:withoutEnquiries,businessId:tenant,draftRevision:1,kind:"enquiry"});
assert.equal(contactOnly.offlineGuardResult,"feature_setup_required");
assert.equal(contactOnly.blockedFixtureCases,4);
const manifest=prepareStagingExecutionManifest({
 appConfig:base,businessId:tenant,draftRevision:1});
assert.equal(manifest.ok,true);
assert.equal(manifest.routeCount,6);
assert.equal(manifest.routes.length,6);
assert.equal(manifest.missingFeatures.length,0);
assert.equal(manifest.fixtureFailures,0);
assert.equal(manifest.liveEndpointCallsMade,0);
assert.equal(manifest.canExecute,false);
assert.equal(manifest.authenticatedRunnerConnected,false);
assert.equal(manifest.approvalToPublish,false);
assert.equal(manifest.noCustomerDataIncluded,true);
assert.ok(manifest.routes.every(x=>x.verifiedNetworkDelivery===false));
const ownerIntent=prepareStagingExecutionManifest({
 appConfig:base,businessId:tenant,draftRevision:1,ownerApproved:true});
assert.equal(ownerIntent.ownerExpressedIntent,true);
assert.equal(ownerIntent.canExecute,false);
const absent=prepareStagingExecutionManifest({
 appConfig:withoutEnquiries,businessId:tenant,draftRevision:1});
assert.equal(absent.missingFeatures.length,3);
assert.equal(JSON.stringify(manifest).includes("private-token"),false);
assert.equal(JSON.stringify(base),originalApp);

assert.equal(SLOT.length,5);
assert.equal(prepareDeviceReview({}).ok,false);
const devicePlan=prepareDeviceReview({
 businessId:tenant,surface:"business_app",draftId:"app-draft",revision:4});
assert.equal(devicePlan.ok,true);
assert.equal(devicePlan.checks.length,5);
assert.ok(devicePlan.checks.every(x=>x.outcome==="not_tested"));
assert.equal(devicePlan.noCapturesPerformed,true);
assert.equal(devicePlan.noDeviceCertification,true);
assert.equal(summarizeDeviceReview({businessId:tenant,
 surface:"business_app",draftId:"app-draft",revision:4}).remaining.length,5);
const observation=(slot,device,mode="normal",change={})=>({
 slot,device,mode,result:"no_visible_issue",
 businessId:tenant,surface:"business_app",draftId:"app-draft",
 revision:4,source:"owner_explicit_device_review",
 realDeviceObserved:true,logicalWidth:390,...change
});
const observations=[
 observation("ios_phone","ios_phone"),
 observation("android_phone","android_phone"),
 observation("tablet","tablet","normal",{logicalWidth:820}),
 observation("large_text","ios_phone","large_text"),
 observation("screen_reader","ios_phone","screen_reader")];
const deviceDone=summarizeDeviceReview({
 businessId:tenant,surface:"business_app",draftId:"app-draft",
 revision:4,observations});
assert.equal(deviceDone.ok,true);
assert.equal(deviceDone.accepted,5);
assert.equal(deviceDone.allOwnerReported,true);
assert.equal(deviceDone.accessibilityCertified,false);
assert.equal(deviceDone.deviceAttestationIndependentlyVerified,false);
assert.equal(deviceDone.screenshotsActuallyCaptured,false);
assert.equal(deviceDone.notProductionReleaseProof,true);
const mixed=summarizeDeviceReview({
 businessId:tenant,surface:"business_app",draftId:"app-draft",
 revision:4,observations:[
 observation("ios_phone","ios_phone",{},{businessId:other}),
 observation("ios_phone","ios_phone","normal",{businessId:other}),
 observation("android_phone","android_phone","normal",{revision:3}),
 observation("tablet","tablet","normal",{screenshot:"https://example.invalid/a.png"}),
 observation("large_text","ios_phone","large_text",{result:"issue_found"}),
 observation("screen_reader","ios_phone","screen_reader",{notes:"private customer name"})
 ]});
assert.equal(mixed.accepted,1);
assert.equal(mixed.rejectedCount,5);
assert.ok(mixed.flagged.includes("large_text"));
assert.equal(mixed.remaining.length,4);
assert.equal(JSON.stringify(mixed).includes("private customer name"),false);
assert.equal(summarizeDeviceReview({
 businessId:tenant,surface:"business_app",draftId:"app-draft",
 revision:5,observations}).accepted,0);
assert.equal(summarizeDeviceReview({
 businessId:tenant,surface:"website",draftId:"app-draft",
 revision:4,observations}).accepted,0);
assert.equal(summarizeDeviceReview({
 businessId:tenant,surface:"business_app",draftId:"app-draft",
 revision:4,observations:Array(25).fill(observation("ios_phone","ios_phone"))}).ok,false);

const appOnly=prepareOwnerImprovementPlan({
 goal:"book",appConfig:base,appRevision:5});
assert.equal(appOnly.ok,true);
assert.equal(appOnly.appPresent,true);
assert.equal(appOnly.websitePresent,false);
assert.equal(appOnly.actions.length,3);
assert.equal(appOnly.maxActions,3);
assert.equal(appOnly.actions[0].id,"verify_customer_path");
assert.equal(appOnly.ownerMustApprove,true);
assert.equal(appOnly.noAutomaticSave,true);
assert.equal(appOnly.noAutomaticPublishing,true);
assert.ok(appOnly.actions.every(x=>x.requiresOwnerReview&&
 x.automaticallyApplied===false));
assert.equal(JSON.stringify(appOnly).includes("do-not-log@example.invalid"),false);
assert.equal(JSON.stringify(appOnly).includes("Consultation"),false);
assert.equal(JSON.stringify(appOnly).includes("private-token"),false);
const webOnly=prepareOwnerImprovementPlan({
 goal:"services",websiteDraft:website,websiteRevision:7,brandBrain:brand});
assert.equal(webOnly.ok,true);
assert.equal(webOnly.websitePresent,true);
assert.ok(webOnly.actions.length<=3);
assert.equal(webOnly.noAutomaticSpending,true);
assert.equal(prepareOwnerImprovementPlan({
 goal:"services",websiteDraft:website,websiteRevision:6,brandBrain:brand}).ok,false);
assert.equal(prepareOwnerImprovementPlan({appConfig:base,appRevision:0}).ok,false);
assert.equal(prepareOwnerImprovementPlan({goal:"wrong",appConfig:base,appRevision:4}).ok,false);
const workspace={authorizedBusinessId:tenant,
 websiteBusinessId:tenant,appBusinessId:tenant};
assert.equal(prepareOwnerImprovementPlan({
 goal:"book",websiteDraft:website,websiteRevision:7,
 appConfig:base,appRevision:5,brandBrain:brand}).ok,false);
assert.equal(prepareOwnerImprovementPlan({
 goal:"book",websiteDraft:website,websiteRevision:7,
 appConfig:base,appRevision:5,brandBrain:brand,
 scope:{...workspace,websiteBusinessId:other}}).ok,false);
const together=prepareOwnerImprovementPlan({
 goal:"book",websiteDraft:website,websiteRevision:7,
 appConfig:base,appRevision:5,brandBrain:brand,scope:workspace});
assert.equal(together.ok,true);
assert.equal(together.appPresent,true);
assert.equal(together.websitePresent,true);
assert.equal(together.actions.length,3);
assert.equal(JSON.stringify(together).includes("website-private@example.invalid"),false);
const best=proposeTaskFirstNavigation(base,"book");
assert.equal(best.preview.ok,true);
const restored=proposeCoordinatedAppChanges(
 best.preview.nextConfig,best.preview.undoOperations);
assert.equal(restored.ok,true);
assert.deepEqual(restored.nextConfig.navigation,base.navigation);
assert.equal(JSON.stringify(base),originalApp);
assert.equal(JSON.stringify(website),originalWeb);
assert.equal(brand.privateNotes,"do not echo this note");

const ui=read("src/screens/miniApps.js");
for(const token of ["offlineStagingPreflight.mjs",
 "executeOfflineJourneyPreflight({","deviceReviewEvidence.mjs",
 "prepareDeviceReview({","ownerImprovementPlan.mjs",
 "prepareOwnerImprovementPlan({","Busy's next improvements",
 "Live submissions: zero","Device review prepared"]){
 assert.ok(ui.includes(token),"App Studio missing V3.174 integration: "+token);
}
const websiteUi=read("src/screens/websiteBuilder.js");
for(const token of ["deviceReviewEvidence.mjs",
 "ownerImprovementPlan.mjs","prepareOwnerImprovementPlan({",
 "websiteDevicePlan.checks.length","Busy's top improvements"]){
 assert.ok(websiteUi.includes(token),"Website Builder missing V3.174 integration: "+token);
}
const workflow=read(".github/workflows/offline-staging-and-device-review-v3174.yml");
for(const token of ["node scripts/check-offline-staging-device-v3174.mjs",
 "node scripts/check-multi-feature-intelligence-v3173.mjs",
 "node scripts/check-shared-customer-journeys-v3172.mjs",
 "expo export --platform ios","expo export --platform android",
 "prepare-standalone-prototype-v3154.mjs"]){
 assert.ok(workflow.includes(token),"Workflow missing: "+token);
}
console.log("V3.174 PASS: offline execution of fixed request transitions across six routes; missing-module honesty; device review metadata/isolation; owner-control ranking/Undo; native builder and CI wiring.");
