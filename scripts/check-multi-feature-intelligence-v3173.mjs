import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {reviewBusinessInformation,inspectServices}
  from "../src/core/businessInfoClarity.mjs";
import {CASES,prepareStagingJourneyRun,planStagingCoverage}
  from "../src/core/stagingJourneyPreparation.mjs";
import {compareMeasuredWebsiteCandidates,compareAppGoalCandidate}
  from "../src/core/designEvidencePriorities.mjs";
import {proposeTaskFirstNavigation}
  from "../src/core/appCustomerTaskDesign.mjs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const keys=["business_profile","services","gallery","contact","enquiry",
 "booking_request","offers","loyalty"];
const mkApp=()=>({
 modules:keys.map(key=>({key,enabled:true})),navigation:[...keys],
 presentation:{headerStyle:"quiet",navigationStyle:"tabs",
 layoutDensity:"comfortable",galleryLayout:"grid",imageScale:"regular",
 imageCorners:"rounded"},
 publicProfile:{businessName:"Owner-approved test name",
 services:[{name:"Consultation",description:"Original description"},
 {name:"consultation",description:""},
 {name:"",description:"No service name"}]},
 privateCustomerRecords:[{email:"do-not-read@example.invalid"}],
 billing:{apiToken:"never-copy-token"},published:{active:true}
});
const mkWeb=()=>({
 id:"private-website-1",generation:3,businessName:"Owner-approved test name",
 sections:[{id:"hero",enabled:true},{id:"services",enabled:true}],
 pages:[{id:"home",enabled:true,sectionIds:["hero","services"]}],
 privateCustomers:[{email:"hidden-website@example.invalid"}]
});
const brand={websiteBrief:{businessName:"Owner-approved test name",
 description:"Original business description",
 services:[{name:"Consultation",description:"A genuine owner description"}]},
 tokens:{unshareable:"do-not-show"}};
const app=mkApp(),web=mkWeb();
const appBefore=JSON.stringify(app),webBefore=JSON.stringify(web),
 brandBefore=JSON.stringify(brand);
const single=reviewBusinessInformation({appConfig:app});
assert.equal(single.ok,true);
assert.equal(single.appPresent,true);
assert.equal(single.websitePresent,false);
assert.equal(single.appServiceCount,3);
assert.equal(single.appCompleteDescriptions,1);
assert.ok(single.issues.some(i=>i.id==="duplicate_service_name"));
assert.ok(single.issues.some(i=>i.id==="unnamed_service"));
assert.ok(single.issues.some(i=>i.id==="missing_service_description"));
assert.equal(single.ownerEditsRequired,true);
assert.equal(single.noPricesInvented,true);
assert.equal(single.noPublishing,true);
assert.equal(single.noGeneratedClaims,true);
assert.equal(JSON.stringify(single).includes("Consultation"),false,
 "Audit must not expose raw service wording");
assert.equal(JSON.stringify(single).includes("do-not-read@example.invalid"),false);
assert.equal(JSON.stringify(single).includes("Original description"),false);
const site=reviewBusinessInformation({websiteDraft:web,brandBrain:brand});
assert.equal(site.ok,true);
assert.equal(site.websiteServiceCount,1);
assert.equal(site.websiteCompleteDescriptions,1);
assert.ok(site.issues.every(i=>i.surface==="website"));
assert.equal(JSON.stringify(site).includes("hidden-website@example.invalid"),false);
const scope={authorizedBusinessId:"same-workspace",
 websiteBusinessId:"same-workspace",appBusinessId:"same-workspace"};
assert.equal(reviewBusinessInformation({websiteDraft:web,appConfig:app,
 brandBrain:brand}).ok,false);
assert.equal(reviewBusinessInformation({websiteDraft:web,appConfig:app,
 brandBrain:brand,scope:{...scope,appBusinessId:"another-workspace"}}).ok,false);
const both=reviewBusinessInformation({websiteDraft:web,appConfig:app,
 brandBrain:brand,scope});
assert.equal(both.ok,true);
assert.ok(both.issues.some(i=>i.id==="different_service_counts"));
assert.equal(both.websiteServiceCount,1);
assert.equal(both.appServiceCount,3);
assert.equal(JSON.stringify(both).includes("Original business description"),false);
assert.equal(reviewBusinessInformation({}).ok,false);
const disabled=mkApp();
disabled.modules=disabled.modules.map(m=>m.key==="services"?{...m,enabled:false}:m);
const disabledReview=reviewBusinessInformation({appConfig:disabled});
assert.equal(disabledReview.appServicesEnabled,false);
assert.equal(disabledReview.appServiceCount,null);
assert.ok(!disabledReview.issues.some(x=>x.id==="no_services"));
const noServices=inspectServices([],"app");
assert.ok(noServices.issues.some(x=>x.id==="no_services"));
const longServices=inspectServices(Array.from({length:34},(_,i)=>({
 name:"Service "+i,description:"Owner description"})),"website");
assert.ok(longServices.issues.some(x=>x.id==="needs_full_list_review"));
assert.ok(longServices.issues.length<=40);

const tenant="11111111-1111-4111-8111-111111111111";
assert.equal(prepareStagingJourneyRun({businessId:tenant,draftRevision:2,
 environment:"production"}).ok,false);
assert.equal(prepareStagingJourneyRun({businessId:tenant,draftRevision:0}).ok,false);
assert.equal(prepareStagingJourneyRun({businessId:"no",draftRevision:2}).ok,false);
assert.equal(prepareStagingJourneyRun({businessId:tenant,draftRevision:2,
 channel:"unknown"}).ok,false);
const dry=prepareStagingJourneyRun({businessId:tenant,draftRevision:2});
assert.equal(dry.ok,true);
assert.equal(dry.canExecuteLive,false);
assert.equal(dry.ownerRequestedStagingRun,false);
assert.equal(dry.executedCount,0);
assert.equal(dry.hasRealRequests,false);
assert.equal(dry.noMessagesSent,true);
assert.equal(dry.noBookingCreated,true);
assert.equal(dry.requirements.every(x=>x.verified===false),true);
assert.ok(dry.cases.some(x=>x.id==="wrong_tenant_denied"));
assert.ok(dry.cases.some(x=>x.id==="idempotent_retry"));
assert.ok(dry.cases.some(x=>x.id==="confirmed_diary_link"));
assert.equal(JSON.stringify(dry).includes(tenant),false);
const optInPlan=prepareStagingJourneyRun({businessId:tenant,draftRevision:2,
 environment:"isolated_staging",ownerApproved:true});
assert.equal(optInPlan.ownerRequestedStagingRun,true);
assert.equal(optInPlan.canExecuteLive,false);
assert.equal(optInPlan.authorizationVerified,false);
assert.equal(optInPlan.stagingTransportAvailable,false);
const noOptIn=prepareStagingJourneyRun({businessId:tenant,draftRevision:2,
 environment:"isolated_staging",ownerApproved:false});
assert.equal(noOptIn.ownerRequestedStagingRun,false);
assert.equal(noOptIn.canExecuteLive,false);
const enquiry=prepareStagingJourneyRun({businessId:tenant,draftRevision:2,
 kind:"enquiry",channel:"guest_web"});
assert.equal(enquiry.ok,true);
assert.ok(!enquiry.cases.some(x=>x.id==="confirmed_diary_link"));
assert.ok(!enquiry.requirements.some(x=>x.id==="diary"));
assert.equal(CASES.length,11);
const matrix=planStagingCoverage({businessId:tenant,draftRevision:2});
assert.equal(matrix.ok,true);
assert.equal(matrix.routeCount,6);
assert.equal(matrix.plans.length,6);
assert.equal(matrix.validatedDeliveryCount,0);
assert.equal(matrix.ranAgainstRealEndpoints,false);
assert.equal(planStagingCoverage({}).ok,false);

const original=mkApp();
const nav=proposeTaskFirstNavigation(original,"book");
assert.ok(nav.preview?.ok);
const comparison=compareAppGoalCandidate({before:original,
 after:nav.preview.nextConfig,goal:"book"});
assert.equal(comparison.ok,true);
assert.equal(comparison.positions.before,6);
assert.equal(comparison.positions.after,2);
assert.equal(comparison.widths.length,3);
assert.equal(comparison.status,"static_prediction_only");
assert.equal(comparison.noAutomaticSave,true);
assert.equal(comparison.cannotClaimRealImprovement,true);
assert.equal(compareAppGoalCandidate({}).ok,false);

const report=(viewport,{warnings=[],overflow=0}={})=>({
 counts:{viewport,width:viewport,
 overflow,unloadedImages:0,missingAlt:0,smallTargets:0,
 badAnchors:0,clippedHeadings:0},
 issues:warnings.map(id=>({id}))
});
const row=(widthGroup,viewport,original,candidate,extra={})=>({
 widthGroup,draftId:"site-one",generation:4,pageId:"home",
 captureSource:"current_private_webview_dom",original,candidate,...extra});
const phone=row("phone",390,report(390,{warnings:["overflow"],overflow:1}),
 report(390));
const wide=row("wide",1200,report(1200),report(1200));
const tablet=row("tablet",820,report(820),report(820));
const pair=compareMeasuredWebsiteCandidates({
 draftId:"site-one",generation:4,pageId:"home",checks:[phone,wide]
});
assert.equal(pair.ok,true);
assert.equal(pair.checkedWidthGroups.length,2);
assert.equal(pair.phoneAndDesktopBothChecked,true);
assert.equal(pair.recommendation,"check_tablet_before_owner_decision");
assert.equal(pair.realWorldTaskImprovementVerified,false);
assert.equal(pair.candidateAutoApproved,false);
assert.equal(pair.measurementAuthenticityIndependentlyVerified,false);
const trio=compareMeasuredWebsiteCandidates({
 draftId:"site-one",generation:4,pageId:"home",checks:[phone,tablet,wide]
});
assert.equal(trio.recommendation,"owner_can_review_nonregressing_candidate");
assert.equal(trio.ownerExplicitApprovalRequired,true);
const stale=compareMeasuredWebsiteCandidates({
 draftId:"site-one",generation:5,pageId:"home",checks:[phone,wide]
});
assert.equal(stale.checkedWidthGroups.length,0);
assert.ok(stale.rejectedWidthGroups.length===2);
const mismatch=compareMeasuredWebsiteCandidates({
 draftId:"site-one",generation:4,pageId:"home",
 checks:[row("phone",390,report(390),report(430))]
});
assert.equal(mismatch.checkedWidthGroups.length,0);
const regressed=compareMeasuredWebsiteCandidates({
 draftId:"site-one",generation:4,pageId:"home",checks:[
 row("phone",390,report(390),report(390,{warnings:["overflow"],overflow:1})),wide]
});
assert.equal(regressed.anyMeasuredRegressions,true);
assert.equal(regressed.recommendation,"keep_original_or_investigate_regressions");
assert.equal(compareMeasuredWebsiteCandidates({}).ok,false);
assert.equal(compareMeasuredWebsiteCandidates({
 draftId:"site-one",generation:4,pageId:"home",checks:[phone,phone]
}).rejectedWidthGroups.length,1);
assert.equal(JSON.stringify(app),appBefore);
assert.equal(JSON.stringify(web),webBefore);
assert.equal(JSON.stringify(brand),brandBefore);
const ui=read("src/screens/miniApps.js");
const webUi=read("src/screens/websiteBuilder.js");
for(const marker of ["reviewBusinessInformation","prepareStagingJourneyRun",
 "compareAppGoalCandidate","Service clarity","practice cases prepared"]){
 assert.ok(ui.includes(marker),"Missing App Builder wiring: "+marker);
}
for(const marker of ["reviewBusinessInformation","compareMeasuredWebsiteCandidates",
 "Service information","measuredPriority.recommendation"]){
 assert.ok(webUi.includes(marker),"Missing Website Builder wiring: "+marker);
}
const ci=read(".github/workflows/multi-feature-intelligence-v3173.yml");
for(const marker of ["node scripts/check-multi-feature-intelligence-v3173.mjs",
 "node scripts/check-shared-customer-journeys-v3172.mjs",
 "node scripts/check-app-customer-experience-v3171.mjs",
 "expo export --platform ios","expo export --platform android",
 "prepare-standalone-prototype-v3154.mjs"]){
 assert.ok(ci.includes(marker),"CI omitted "+marker);
}
console.log("V3.173 PASS: scoped cross-builder facts; service clarity without leaked copy; six-route staged dry-run matrix; refusal of production or auto-execution; current-revision before/after evidence and UI/CI.");
