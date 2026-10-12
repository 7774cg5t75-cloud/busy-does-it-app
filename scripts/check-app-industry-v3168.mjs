import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {INDUSTRY_PROFILES,suggestionsForIndustry,appCustomerJourneyChecks,
 compareWidthRules,prepareIndustryAwareAppReview}
 from "../src/core/appIndustryOrchestrator.mjs";
import {prepareOwnerAwareDesignExperiments} from "../src/core/appDesignPatterns.mjs";
import {proposeCoordinatedAppChanges} from "../src/core/appCoordinatedStudio.mjs";

const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const keys=["business_profile","services","gallery","contact","enquiry",
 "booking_request","offers","loyalty"];
const makeConfig=(choices={})=>({
 modules:keys.map(key=>({key,enabled:true})),navigation:[...keys],
 presentation:{headerStyle:"quiet",navigationStyle:"tabs",
  galleryLayout:"grid",layoutDensity:"compact",imageScale:"regular",
  imageCorners:"rounded",...choices},
 publicProfile:{businessName:"Fictional test company",
  services:[{name:"Example service"}],assets:{gallery:[]}},
 privateCustomerRecords:[{email:"never-log@example.invalid"}],
 payments:{enabled:false},distribution:{mode:"not_published"}
});
const base=makeConfig(),original=JSON.stringify(base);
assert.deepEqual(INDUSTRY_PROFILES.map(x=>x.id),
 ["general","appointments","trades","food_events","retail"]);
assert.equal(prepareIndustryAwareAppReview(base,{industry:"unknown"}).ok,false);
assert.equal(prepareIndustryAwareAppReview(base,{industry:"general",
 history:Array(81).fill({})}).ok,false);
assert.equal(prepareIndustryAwareAppReview({...base,navigation:["bad"]}).ok,false);

const industries=new Map();
for(const industry of ["appointments","trades","food_events","retail"]){
 const review=prepareIndustryAwareAppReview(base,{industry});
 assert.equal(review.ok,true,review.reason);
 assert.equal(review.explicitBusinessType,industry);
 assert.equal(review.profile.id,industry);
 assert.equal(review.noAutoPublish,true);
 assert.equal(review.noAutoBooking,true);
 assert.equal(review.oneBusinessFeedbackOnly,true);
 assert.equal(review.noIndustryInferredFromPrivateData,true);
 assert.equal(review.noCommercialOutcomeProof,true);
 assert.equal(review.customerJourney.marketplaceAndStandaloneShareDraft,true);
 assert.ok(review.preview?.ok,industry+" must produce a safe candidate");
 assert.ok(review.proposed.length<=3&&review.proposed.length>=1);
 assert.equal(review.preview.requiresOwnerApproval,true);
 assert.equal(review.widthReview.ok,true);
 assert.deepEqual(review.widthReview.widths,[320,390,820]);
 assert.equal(review.widthReview.actualScreenCapturesCompared,false);
 assert.equal(review.widthReview.needsManualReview,true);
 assert.deepEqual(review.preview.nextConfig.privateCustomerRecords,
  base.privateCustomerRecords);
 assert.deepEqual(review.preview.nextConfig.payments,base.payments);
 assert.deepEqual(review.preview.nextConfig.modules,base.modules);
 assert.deepEqual(review.preview.nextConfig.navigation,base.navigation);
 assert.deepEqual(review.preview.nextConfig.distribution,base.distribution);
 assert.equal(JSON.stringify({
  profile:review.profile,reasoning:review.reasoning,
  widthReview:review.widthReview,customerJourney:review.customerJourney,
  releaseIssues:review.releaseIssues
 }).includes("never-log@example.invalid"),false,
  "Public-facing explanations must never expose private customer identifiers; the owner-only preview preserves the unchanged private draft.");
 const undo=proposeCoordinatedAppChanges(review.preview.nextConfig,
  review.preview.undoOperations);
 assert.equal(undo.ok,true,undo.reason);
 assert.deepEqual(undo.nextConfig.presentation,base.presentation);
 industries.set(industry,review);
}
const fields=industry=>industries.get(industry).proposed.map(x=>x.field);
assert.ok(fields("appointments").includes("navigationStyle"));
assert.ok(fields("trades").includes("galleryLayout"));
assert.ok(fields("food_events").includes("headerStyle"));
assert.ok(fields("retail").includes("layoutDensity"));
assert.notDeepEqual(fields("food_events"),fields("trades"),
 "Different industries must not receive an identical generic choice list");
assert.ok(industries.get("food_events").reasoning.some(x=>x.industryContext));
const general=prepareIndustryAwareAppReview(base);
const baseline=prepareOwnerAwareDesignExperiments(base);
assert.deepEqual(general.proposed,baseline.proposed,
 "The default profile must preserve the existing V3.167 recommendation model");
assert.equal(general.preview,null,"No evidence, no invented generic redesign");
assert.deepEqual(general.customerJourney.steps.map(x=>x.id),
 ["booking","enquiry","services"]);
assert.equal(general.customerJourney.steps[0].status,"owner_confirmation_required");
assert.equal(general.customerJourney.steps[1].status,"needs_end_to_end_test");
const noBooking=makeConfig();
noBooking.modules=noBooking.modules.filter(x=>!["booking_request","enquiry"].includes(x.key));
noBooking.navigation=noBooking.navigation.filter(x=>!["booking_request","enquiry"].includes(x));
assert.equal(appCustomerJourneyChecks(noBooking).steps[0].status,"not_enabled");
assert.equal(appCustomerJourneyChecks(noBooking).steps[1].id,"contact");
const noContact=makeConfig();
noContact.modules=noContact.modules.filter(x=>!["contact","booking_request","enquiry"].includes(x.key));
noContact.navigation=noContact.navigation.filter(x=>!["contact","booking_request","enquiry"].includes(x));
assert.ok(prepareIndustryAwareAppReview(noContact,{industry:"appointments"})
 .releaseIssues.some(x=>x.id==="contact_path"),
 "Missing public contact must remain visible as a release blocker");
const rejects=[{field:"navigationStyle",value:"list",verdict:"worse",
 context:"preview",draftRevision:12}];
const rejected=prepareIndustryAwareAppReview(base,{industry:"appointments",
 history:rejects});
assert.ok(rejected.suppressed.some(x=>x.field==="navigationStyle"));
assert.ok(!rejected.proposed.some(x=>x.field==="navigationStyle"&&x.value==="list"),
 "Industry context may not override explicit owner dislike");
const preferredCurrent=prepareIndustryAwareAppReview(base,{
 industry:"food_events",history:[{field:"headerStyle",value:"quiet",
  verdict:"better",context:"saved_revision",draftRevision:12}]
});
assert.ok(!preferredCurrent.proposed.some(x=>x.field==="headerStyle"),
 "A stylistic hypothesis must not replace an explicitly liked current setting");
const measuredOverride=prepareIndustryAwareAppReview(base,{
 industry:"food_events",history:[{field:"headerStyle",value:"quiet",
  verdict:"better",context:"saved_revision",draftRevision:12}],
 measured:[{field:"headerStyle",value:"bold"}]
});
assert.ok(measuredOverride.proposed.some(x=>x.field==="headerStyle"),
 "Concrete measured evidence can justify reviewing, but never auto-applying");
assert.equal(measuredOverride.noAutoPublish,true);
const empty=prepareIndustryAwareAppReview(base,{industry:"general",
 responsive:[{field:"galleryLayout",value:"stack"}]});
assert.ok(empty.preview?.ok);
assert.equal(empty.widthReview.visualQualityImprovementProven,false);
assert.equal(compareWidthRules({ok:false},{}).ok,false);
assert.equal(suggestionsForIndustry(base,"general").length,0);
assert.equal(JSON.stringify(base),original,"Planning must not mutate the private draft");

const ui=read("src/screens/miniApps.js");
for(const token of ["appIndustryOrchestrator.mjs","prepareIndustryAwareAppReview(config,",
 "INDUSTRY_PROFILES.map(","Choose business type & review",
 "Compare the proposed design with my original","setDesignIndustry(profile.id)",
 "industryDesignReview.customerJourney","guided?.preview?.ok?"]){
 // The customer-journey is rendered by optional chaining, so match either spelling.
 assert.ok(ui.includes(token)||token==="industryDesignReview.customerJourney"&&
  ui.includes("industryDesignReview?.customerJourney?.steps"),
  "The real customer preview needs integrated industry functionality: "+token);
}
const workflow=read(".github/workflows/app-industry-orchestrator-v3168.yml");
assert.ok(workflow.includes("node scripts/check-app-industry-v3168.mjs"));
assert.ok(workflow.includes("node scripts/check-app-design-patterns-v3167.mjs"));
assert.ok(workflow.includes("expo export --platform ios"));
assert.ok(workflow.includes("prepare-standalone-prototype-v3154.mjs"));
console.log("V3.168 PASS: distinct industry hypotheses; owner feedback priority; booking boundaries; unchanged customer and payment data; three-width preflight; private coordinated preview/Undo; UI and CI wiring.");
