import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {TASKS,taskReadiness,compareStaticJourney,
 proposeTaskFirstNavigation,buildCustomerTaskDesignReport}
 from "../src/core/appCustomerTaskDesign.mjs";
import {proposeCoordinatedAppChanges}
 from "../src/core/appCoordinatedStudio.mjs";

const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const keys=["business_profile","services","gallery","contact","enquiry",
 "booking_request","offers","loyalty"];
const makeConfig=(active=keys)=>({
 modules:keys.map(key=>({key,enabled:active.includes(key)})),
 navigation:keys.filter(key=>active.includes(key)),
 presentation:{headerStyle:"refined",layoutDensity:"comfortable",
  navigationStyle:"tabs",galleryLayout:"grid",imageScale:"regular",
  imageCorners:"rounded"},
 publicProfile:{businessName:"Fictional test workshop",
  services:[{name:"Example service"}],
  assets:{gallery:[{uri:"https://example.invalid/example.jpg",
    approved:true,alt:"Example product"}]}},
 unrelatedSecrets:{customerEmail:"private@example.invalid"},
 billing:{enabled:false},distribution:{public:false}
});
const base=makeConfig();
const original=JSON.stringify(base);
assert.equal(TASKS.length,6);
assert.deepEqual(TASKS.map(t=>t.id),
 ["book","enquire","services","photos","offers","rewards"]);
assert.equal(taskReadiness(base,"not_a_task").ok,false);
assert.equal(taskReadiness({...base,navigation:["bogus"]},"book").ok,false);
assert.equal(taskReadiness(base,"book").targetModule,"booking_request");
assert.equal(taskReadiness(base,"book").status,"available_not_end_to_end_verified");
assert.match(taskReadiness(base,"book").cautions.join(" "),/does not confirm/);
const report=buildCustomerTaskDesignReport(base);
assert.equal(report.ok,true);
assert.equal(report.tasks.length,6);
assert.equal(report.noUserBehaviorTracked,true);
assert.equal(report.noAutomaticChanges,true);
assert.equal(report.sharedMarketplaceStandaloneDraft,true);
for(const entry of report.tasks)assert.equal(entry.available,true);

for(const task of TASKS){
 const r=proposeTaskFirstNavigation(base,task.id);
 assert.equal(r.ok,true,r.reason);
 assert.equal(r.blocked,false);
 if(r.task.sectionPosition===2){
   assert.equal(r.preview,null,
    task.id+" already follows About and should remain unchanged");
   continue;
 }
 assert.ok(r.preview?.ok,task.id+" should propose a reversible navigation edit");
 assert.equal(r.preview.privateOnly,true);
 assert.equal(r.preview.requiresOwnerApproval,true);
 assert.equal(r.preview.sameSharedConfigForStandalone,true);
 assert.equal(r.comparison.earlierInNavigation,true);
 assert.equal(r.comparison.afterPosition,2);
 assert.equal(r.comparison.capabilityUnchanged,true);
 assert.equal(r.comparison.outcomeImprovementProven,false);
 assert.equal(r.comparison.estimatedNavigationOnly,true);
 assert.equal(r.realDeviceReviewRequired,true);
 assert.equal(r.noAutoBooking,true);
 assert.equal(r.noAutoPublish,true);
 assert.equal(r.noAutoCharges,true);
 assert.equal(r.noNewModules,true);
 assert.equal(r.changedWidthRules.length,3);
 const next=r.preview.nextConfig;
 assert.equal(next.navigation[0],"business_profile",
  "Retain business identity before any task");
 assert.equal(next.navigation[1],r.task.targetModule);
 assert.deepEqual(next.modules,base.modules);
 assert.deepEqual(next.publicProfile,base.publicProfile);
 assert.deepEqual(next.presentation,base.presentation);
 assert.deepEqual(next.unrelatedSecrets,base.unrelatedSecrets);
 assert.deepEqual(next.billing,base.billing);
 assert.deepEqual(next.distribution,base.distribution);
 assert.equal(JSON.stringify(r).includes("private@example.invalid"),false);
 const reversed=proposeCoordinatedAppChanges(next,r.preview.undoOperations);
 assert.equal(reversed.ok,true,reversed.reason);
 assert.deepEqual(reversed.nextConfig.navigation,base.navigation);
}
const one=proposeTaskFirstNavigation(base,"book");
assert.deepEqual(one.preview.operations,[{kind:"navigation",value:one.preview.nextConfig.navigation}]);
assert.deepEqual(one.preview.undoOperations,[{kind:"navigation",value:base.navigation}]);
const moved=one.preview.nextConfig;
const repeated=proposeTaskFirstNavigation(moved,"book");
assert.equal(repeated.preview,null);
assert.match(repeated.reason,/already prominent/);
const notAvailable=makeConfig(keys.filter(x=>x!=="booking_request"));
const noBooking=proposeTaskFirstNavigation(notAvailable,"book");
assert.equal(noBooking.ok,true);
assert.equal(noBooking.preview,null);
assert.equal(noBooking.blocked,true);
assert.equal(noBooking.task.available,false);
assert.equal(noBooking.task.status,"setup_needed");
assert.equal(noBooking.task.needsSeparateFeatureSetup,true);
assert.match(noBooking.task.blockers.join(" "),/not enabled/);
const contactOnly=makeConfig(keys.filter(x=>x!=="enquiry"));
const enquiry=proposeTaskFirstNavigation(contactOnly,"enquire");
assert.equal(enquiry.task.targetModule,"contact");
assert.equal(enquiry.task.fallbackUsed,true);
assert.equal(enquiry.task.status,"limited_fallback_unverified");
assert.match(enquiry.task.cautions.join(" "),/not proof of a tracked enquiry/);
assert.equal(enquiry.task.primaryModule,"enquiry");
const noContact=makeConfig(keys.filter(x=>!["contact","enquiry"].includes(x)));
assert.equal(proposeTaskFirstNavigation(noContact,"enquire").preview,null);
assert.equal(proposeTaskFirstNavigation(noContact,"enquire").task.available,false);
const missingServices=makeConfig();
missingServices.publicProfile.services=[];
assert.match(taskReadiness(missingServices,"services").cautions.join(" "),/missing or unnamed/);
const noPictures=makeConfig();
noPictures.publicProfile.assets.gallery=[{uri:"https://example.invalid/a.jpg",approved:false}];
assert.match(taskReadiness(noPictures,"photos").cautions.join(" "),/No owner-approved/);
const missingAlt=makeConfig();
missingAlt.publicProfile.assets.gallery=[{uri:"https://example.invalid/a.jpg",approved:true}];
assert.match(taskReadiness(missingAlt,"photos").cautions.join(" "),/descriptions/);
const noOffers=makeConfig(keys.filter(x=>x!=="offers"));
assert.equal(proposeTaskFirstNavigation(noOffers,"offers").blocked,true);
const noRewards=makeConfig(keys.filter(x=>x!=="loyalty"));
assert.equal(proposeTaskFirstNavigation(noRewards,"rewards").blocked,true);
const trivial=makeConfig(["business_profile","booking_request","contact"]);
assert.equal(proposeTaskFirstNavigation(trivial,"book").preview,null);
assert.equal(proposeTaskFirstNavigation(trivial,"book").blocked,false);
assert.equal(compareStaticJourney(base,one.preview.nextConfig,"book").earlierInNavigation,true);
assert.equal(compareStaticJourney(base,moved,"bogus").ok,false);
assert.equal(JSON.stringify(base),original,
 "Planning must never mutate the original business app configuration.");

const ui=read("src/screens/miniApps.js");
for(const marker of ["appCustomerTaskDesign.mjs",
 "buildCustomerTaskDesignReport(view.draftConfig)",
 "proposeTaskFirstNavigation(view.draftConfig,selectedCustomerTask)",
 "V3.169 • What should customers be able to do first?",
 "Preview a clearer customer journey",
 "setStudioPreview(fresh.preview?.ok?fresh.preview:null)",
 "Compare the ORIGINAL and PROPOSED real app views",
 "saveCoordinatedAppChanges?.({",
 "Undo my last approved batch"]){
 assert.ok(ui.includes(marker),"Missing task-driven Studio UI integration: "+marker);
}
const workflow=read(".github/workflows/app-customer-tasks-v3169.yml");
for(const marker of ["node scripts/check-app-customer-tasks-v3169.mjs",
 "node scripts/check-app-industry-v3168.mjs",
 "node scripts/check-app-design-patterns-v3167.mjs",
 "expo export --platform ios",
 "expo export --platform android",
 "prepare-standalone-prototype-v3154.mjs"]){
 assert.ok(workflow.includes(marker),"Missing V3.169 verification: "+marker);
}
console.log("V3.169 PASS: six real task paths; missing-module honesty; booking/enquiry boundaries; exact safe navigation and Undo; public-config-only data; marketplace/standalone parity; Studio and CI.");
