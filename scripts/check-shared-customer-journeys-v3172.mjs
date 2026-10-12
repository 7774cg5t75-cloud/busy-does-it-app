import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {GOALS,reviewSharedCustomerGoal}
 from "../src/core/sharedCustomerExperience.mjs";
import {appDesignEvidenceComparison,websiteEvidenceSummary,
 appAndWebsiteEvidenceBoundary}
 from "../src/core/crossBuilderEvidence.mjs";
import {CONTRACT,stagingJourneyTestPlan,evaluateStagingEvidence}
 from "../src/core/stagingJourneyContract.mjs";
import {proposeTaskFirstNavigation}
 from "../src/core/appCustomerTaskDesign.mjs";
import {proposeCoordinatedAppChanges}
 from "../src/core/appCoordinatedStudio.mjs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const keys=["business_profile","services","gallery","contact","enquiry",
 "booking_request","offers","loyalty"];
const app=(enabled=keys)=>({
 modules:keys.map(key=>({key,enabled:enabled.includes(key)})),
 navigation:keys.filter(key=>enabled.includes(key)),
 presentation:{headerStyle:"quiet",navigationStyle:"tabs",
  galleryLayout:"grid",layoutDensity:"comfortable",imageScale:"regular",
  imageCorners:"rounded"},
 publicProfile:{businessName:"Fictional owner",
  services:[{name:"Consultation",description:"Consultation description"}],
  assets:{gallery:[{approved:true,alt:"Approved gallery",uri:"https://invalid.test/a.png"}]}},
 privateCustomerData:{email:"not-for-display@example.invalid"},
 payments:{billingToken:"no-token-in-advice"}
});
const web={
 id:"owner-private-site",generation:8,businessName:"Fictional Site",
 businessType:"service",pages:[{id:"home",enabled:true,sectionIds:["hero","services","contact"]}],
 sections:[{id:"hero",enabled:true},{id:"services",enabled:true},
  {id:"contact",enabled:true}],theme:{designFamily:"minimal"},
 customers:[{email:"site-private@example.invalid"}],
 secrets:{websiteToken:"website-private-token"}
};
const brand={websiteBrief:{
 businessName:"Fictional Site",description:"Accurate owner description",
 services:[{name:"Consultation"}],tagline:"",
 photos:[],visualStyle:"",differentiators:"",heroAsset:null},
 completeness:{coreMissing:[]},privateCustomers:[{name:"not-output"}]};
const originalApp=app(),appSnapshot=JSON.stringify(originalApp);
const webSnapshot=JSON.stringify(web),brandSnapshot=JSON.stringify(brand);
const sameWorkspace={
 authorizedBusinessId:"owner-business-scoped",
 websiteBusinessId:"owner-business-scoped",
 appBusinessId:"owner-business-scoped"
};
assert.equal(reviewSharedCustomerGoal({
 goal:"book",websiteDraft:web,appConfig:originalApp
}).ok,false,"Missing tenant context must fail closed");
assert.equal(reviewSharedCustomerGoal({
 goal:"book",websiteDraft:web,appConfig:originalApp,
 scope:{...sameWorkspace,appBusinessId:"another-business"}
}).ok,false,"Cross-business drafts must never merge");
assert.deepEqual(GOALS,["book","enquire","services","photos","offers","rewards"]);
assert.equal(reviewSharedCustomerGoal({goal:"invented",websiteDraft:web}).ok,false);
assert.equal(reviewSharedCustomerGoal({goal:"book"}).ok,false);
for(const goal of GOALS){
 const result=reviewSharedCustomerGoal({goal,websiteDraft:web,
  brandBrain:brand,appConfig:originalApp,
  websiteJourney:{nextAction:"review",isVerified:false},
  websitePublishing:{previewDeployment:{id:"preview"},draftChangedSinceHosted:false},
  websiteProof:{verified:false},scope:sameWorkspace});
 assert.equal(result.ok,true,goal);
 assert.equal(result.goal,goal);
 assert.equal(result.websitePresent,true);
 assert.equal(result.appPresent,true);
 assert.equal(result.websiteDeliveryVerified,false);
 assert.ok(result.findings.length>0);
 assert.ok(result.findings.every(x=>x.automaticChange===false));
 assert.equal(result.noCrossBusinessJoin,true);
 assert.equal(result.noCustomerDataIncluded,true);
 assert.equal(result.noPublishing,true);
 assert.equal(result.noCharges,true);
 assert.equal(result.notConversionEvidence,true);
 assert.equal(result.websiteAction.verified,false);
 assert.ok(result.totalFindings>=result.findings.length);
 assert.equal(JSON.stringify(result).includes("not-for-display@example.invalid"),false);
 assert.equal(JSON.stringify(result).includes("site-private@example.invalid"),false);
 assert.equal(JSON.stringify(result).includes("no-token-in-advice"),false);
 assert.equal(JSON.stringify(result).includes("website-private-token"),false);
 const w=reviewSharedCustomerGoal({goal,websiteDraft:web,brandBrain:brand});
 assert.equal(w.ok,true);
 assert.equal(w.appPresent,false);
 assert.equal(w.websitePresent,true);
 assert.equal(w.appTaskStatus,"not_assessed");
 assert.ok(w.findings.every(x=>x.surface==="website"));
 const a=reviewSharedCustomerGoal({goal,appConfig:originalApp});
 assert.equal(a.ok,true);
 assert.equal(a.websitePresent,false);
 assert.equal(a.appPresent,true);
 assert.equal(a.websitePublicationState,"not_assessed");
 assert.ok(a.findings.every(x=>x.surface==="app"));
}
const absentApp=app(keys.filter(x=>x!=="booking_request"));
const blocked=reviewSharedCustomerGoal({goal:"book",appConfig:absentApp});
assert.equal(blocked.appTaskStatus,"setup_needed");
assert.equal(blocked.appHasReversibleLayoutIdea,false);
assert.ok(blocked.findings.some(x=>x.id==="app_enable_real_module"));
const before=app(),next=proposeTaskFirstNavigation(before,"book");
assert.ok(next.preview?.ok);
const comparison=appDesignEvidenceComparison({
 before,after:next.preview.nextConfig,goal:"book"
});
assert.equal(comparison.ok,true);
assert.equal(comparison.beforePosition,6);
assert.equal(comparison.afterPosition,2);
assert.equal(comparison.earlierInNavigation,true);
assert.equal(comparison.capabilityUnchanged,true);
assert.equal(comparison.onlyPredictedLayouts,true);
assert.equal(comparison.provenCustomerImprovement,false);
assert.equal(comparison.verifiedConversionLift,null);
assert.equal(comparison.profiles.length,3);
assert.equal(comparison.allWidthsPresent,true);
assert.ok(comparison.profiles.every(x=>x.derivedFromStaticRulesOnly));
assert.equal(appDesignEvidenceComparison({}).ok,false);
assert.equal(appDesignEvidenceComparison({before,after:next.preview.nextConfig,
 goal:"unknown"}).ok,false);
const undo=proposeCoordinatedAppChanges(next.preview.nextConfig,
 next.preview.undoOperations);
assert.equal(undo.ok,true);
assert.deepEqual(undo.nextConfig.navigation,before.navigation);
const evidenceKey=[web.id,web.generation,"home"].join(":");
const viewportState={key:evidenceKey,checks:{
 phone:{checked:true,width:390,commonIssues:[],noCommonWarnings:true},
 tablet:{checked:true,width:820,commonIssues:["small_targets"],noCommonWarnings:false},
 wide:{checked:true,width:1200,commonIssues:[],noCommonWarnings:true}
}};
const webEvidence=websiteEvidenceSummary({
 viewportState,draftId:web.id,generation:web.generation,pageId:"home"
});
assert.equal(webEvidence.ok,true);
assert.equal(webEvidence.allThreeWidthsChecked,true);
assert.deepEqual(webEvidence.checked,["phone","tablet","wide"]);
assert.equal(webEvidence.flagged.includes("tablet"),true);
assert.equal(webEvidence.realCustomerConversionProven,false);
assert.equal(webEvidence.notAnAutomaticReleaseApproval,true);
const stale=websiteEvidenceSummary({viewportState,draftId:web.id,
 generation:web.generation+1,pageId:"home"});
assert.equal(stale.ok,true);
assert.equal(stale.allThreeWidthsChecked,false);
assert.equal(stale.missing.length,3);
assert.equal(websiteEvidenceSummary({draftId:"",pageId:"home"}).ok,false);
const sharedEvidence=appAndWebsiteEvidenceBoundary(comparison,webEvidence);
assert.equal(sharedEvidence.bothEvidencePathsPresent,true);
assert.equal(sharedEvidence.evidenceNotEquivalent,true);
assert.equal(sharedEvidence.actualUserSuccessTested,false);
assert.equal(sharedEvidence.actualConversionGainVerified,false);
assert.equal(appAndWebsiteEvidenceBoundary(comparison,stale)
 .bothEvidencePathsPresent,false);
assert.equal(CONTRACT.length,9);
const booking=stagingJourneyTestPlan();
const enquiry=stagingJourneyTestPlan({kind:"enquiry",channel:"guest_web"});
assert.equal(booking.ok,true);
assert.equal(booking.requiredCount,9);
assert.equal(booking.verifiedCount,0);
assert.equal(booking.hasRunLiveRequests,false);
assert.equal(booking.ownerApprovesAnyRealRun,true);
assert.equal(enquiry.requiredCount,8);
assert.ok(!enquiry.steps.some(x=>x.id==="diary"));
assert.equal(enquiry.channel,"guest_web");
assert.equal(stagingJourneyTestPlan({channel:"mystery"}).ok,false);
assert.equal(stagingJourneyTestPlan({kind:"not-real"}).ok,false);
const tenant="11111111-1111-4111-8111-111111111111";
const other="22222222-2222-4222-8222-222222222222";
const attestation="33333333-3333-4333-8333-333333333333";
const receipt=(id,changes={})=>({id,source:"isolated_staging_authoritative",
 businessId:tenant,requestRevision:8,status:"passed",
 attestationId:attestation,...changes});
assert.equal(evaluateStagingEvidence({}).ok,false);
const rejected=evaluateStagingEvidence({businessId:tenant,requestRevision:8,
 receipts:[receipt("auth",{businessId:other}),receipt("submitted",{requestRevision:7}),
 receipt("owner_inbox",{source:"owner_reported"}),receipt("status",{synthetic:true}),
 receipt("reply_delivery",{liveCustomerData:true}),receipt("diary",{status:"failed"})]});
assert.equal(rejected.ok,true);
assert.equal(rejected.formatAccepted,0);
assert.equal(rejected.allMetadataPresent,false);
assert.equal(rejected.rejectedEvidenceIds.length,6);
const allReceipts=booking.steps.map(step=>receipt(step.id));
const all=evaluateStagingEvidence({businessId:tenant,requestRevision:8,
 receipts:allReceipts});
assert.equal(all.ok,true);
assert.equal(all.formatAccepted,9);
assert.equal(all.allMetadataPresent,true);
assert.equal(all.independentlyAuthenticated,false);
assert.equal(all.allLiveChecksVerified,false);
assert.equal(all.mustVerifyServerSignaturesAndLogs,true);
assert.equal(all.doNotTreatAsReleaseApproval,true);
assert.equal(JSON.stringify(all).includes(attestation),false);
const duplicate=evaluateStagingEvidence({businessId:tenant,requestRevision:8,
 receipts:[receipt("auth"),receipt("auth")]});
assert.equal(duplicate.formatAccepted,1);
assert.equal(duplicate.rejectedEvidenceIds.length,1);
assert.equal(JSON.stringify(originalApp),appSnapshot);
assert.equal(JSON.stringify(web),webSnapshot);
assert.equal(JSON.stringify(brand),brandSnapshot);
const ui=read("src/screens/websiteBuilder.js");
const appUi=read("src/screens/miniApps.js");
for(const x of ["reviewSharedCustomerGoal","websiteDraft:draft",
 "What should my website help customers do?","websiteEvidenceSummary",
 "evidenceSummary.nextAction"]){
 assert.ok(ui.includes(x),"Missing website integration: "+x);
}
for(const x of ["reviewSharedCustomerGoal","appConfig:view.draftConfig",
 "appDesignEvidenceComparison","stagingJourneyTestPlan",
 "Predicted navigation","Staging readiness"]){
 assert.ok(appUi.includes(x),"Missing app integration: "+x);
}
const ci=read(".github/workflows/shared-customer-journeys-v3172.yml");
for(const x of ["node scripts/check-shared-customer-journeys-v3172.mjs",
 "node scripts/check-app-customer-experience-v3171.mjs",
 "node scripts/check-app-customer-journeys-v3170.mjs",
 "expo export --platform ios","expo export --platform android",
 "prepare-standalone-prototype-v3154.mjs"]){
 assert.ok(ci.includes(x),"Missing CI verification: "+x);
}
console.log("V3.172 PASS: cross-builder goals, isolated app/website contexts, consistent layout evidence boundaries, staging proof fail-closed, private Undo and UI integration.");
