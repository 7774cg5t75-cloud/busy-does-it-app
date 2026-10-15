import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {SAMPLE_WIDTHS,responsiveAppLayout,evaluateResponsiveApp,recommendResponsiveDesign}
 from "../src/core/appResponsiveDesign.mjs";
import {evaluateAppAcrossScreens,compareAppScreenQuality}
 from "../src/core/appResponsiveQuality.mjs";
import {proposeCoordinatedAppChanges} from "../src/core/appCoordinatedStudio.mjs";
import {compareBusinessAppDesign} from "../src/core/appUsabilityAudit.mjs";
const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const makeApp=({sectionCount=6,largePhotos=true,density="compact",
 galleryLayout="grid"}={})=>{
 const keys=["business_profile","services","gallery","booking_request",
  "enquiry","contact","loyalty","offers"].slice(0,sectionCount);
 return {modules:keys.map(key=>({key,enabled:true})),
  navigation:keys,
  display:{name:"Example owner-operated business"},
  publicProfile:{businessName:"Example business",
   services:[{name:"Consultation",description:"Ask about availability"},
    {name:"Follow up",description:"Plan next steps"}],
   assets:{gallery:[1,2,3,4].map(n=>({
    uri:"https://example.test/img"+n+".jpg",alt:"Approved public photo "+n,
    approved:true}))}},
  presentation:{headerStyle:"refined",layoutDensity:density,
   navigationStyle:"tabs",galleryLayout,
   imageScale:largePhotos?"large":"regular",imageCorners:"rounded"},
  payments:{enabled:false},
  privateCustomerRecords:[{email:"alice@private.test"}],
  secretProviderTokens:["SHOULD_NOT_LEAK"]};
};
const app=makeApp(),frozen=JSON.stringify(app);
assert.deepEqual(SAMPLE_WIDTHS.map(x=>x.width),[320,390,820]);
const small=responsiveAppLayout(app,320),phone=responsiveAppLayout(app,390),
 tablet=responsiveAppLayout(app,820);
assert.equal(small.ok,true);
assert.equal(small.tier,"compact_phone");
assert.equal(small.navigation,"list");
assert.equal(small.galleryColumns,1);
assert.equal(small.serviceColumns,1);
assert.equal(phone.tier,"phone");
assert.equal(phone.navigation,"list");
assert.equal(phone.galleryColumns,1);
assert.equal(tablet.tier,"tablet");
assert.equal(tablet.navigation,"tabs");
assert.equal(tablet.galleryColumns,3);
assert.equal(tablet.serviceColumns,2);
assert.equal(tablet.heroHeight>small.heroHeight,true);
assert.equal(tablet.approximateGalleryWidth>0,true);
assert.equal(phone.automaticRuntimeAdaptations.galleryColumns,true);
assert.equal(phone.automaticRuntimeAdaptations.navigation,true);
assert.equal(responsiveAppLayout(app,249).ok,false);
assert.equal(responsiveAppLayout(app,3001).ok,false);
assert.equal(responsiveAppLayout({modules:null},390).ok,false);
const stacked=makeApp({sectionCount:3,largePhotos:false,
 density:"comfortable",galleryLayout:"stack"});
assert.deepEqual([320,390,820].map(w=>responsiveAppLayout(stacked,w).galleryColumns),
 [1,1,1],"explicit owner-approved stacked photos persist on every device");
assert.equal(responsiveAppLayout(stacked,390).navigation,"tabs");
assert.equal(responsiveAppLayout(stacked,820).serviceColumns,2);
const tabs=makeApp({sectionCount:8,largePhotos:false});
assert.equal(responsiveAppLayout(tabs,820).navigation,"list");
const profiles=evaluateResponsiveApp(app);
assert.equal(profiles.ok,true);
assert.equal(profiles.profiles.length,3);
assert.equal(profiles.staticPreviewOnly,true);
assert.equal(profiles.actualScreenshotsCaptured,false);
assert.equal(profiles.accessibilityCertified,false);
const explanation=recommendResponsiveDesign(app);
assert.equal(explanation.ok,true);
assert.equal(explanation.recommendationCount,3);
assert.deepEqual(explanation.suggestions.map(x=>x.field),
 ["navigationStyle","galleryLayout","layoutDensity"]);
assert.ok(explanation.suggestions.every(x=>x.reason&&x.tradeoff&&
 x.ownerApprovalRequired===true&&x.notVisualProof===true));
assert.equal(explanation.costFree,true);
assert.equal(explanation.autoApply,false);
assert.equal(explanation.noPrivateCustomerInfoUsed,true);
assert.ok(!JSON.stringify(explanation).includes("alice@private.test"));
assert.ok(!JSON.stringify(explanation).includes("SHOULD_NOT_LEAK"));
const supportedOps=explanation.suggestions.map(s=>({
 kind:"appearance",field:s.field,value:s.value
}));
const planned=proposeCoordinatedAppChanges(app,supportedOps);
assert.equal(planned.ok,true,planned.reason);
assert.equal(planned.changes.length,3);
assert.equal(planned.publishes,false);
assert.equal(planned.chargesCustomers,false);
assert.deepEqual(planned.nextConfig.privateCustomerRecords,app.privateCustomerRecords);
assert.deepEqual(planned.nextConfig.payments,app.payments);
assert.equal(JSON.stringify(app),frozen,"all recommendations are read-only");
assert.equal(proposeCoordinatedAppChanges(planned.nextConfig,planned.undoOperations).ok,true);
const checked=evaluateAppAcrossScreens(app);
assert.equal(checked.ok,true);
assert.equal(checked.assessments.length,3);
assert.equal(checked.kind,"public_app_multiscreen_quality_v3163");
assert.equal(checked.actualDeviceFramesRendered,false);
assert.equal(checked.wcagCertified,false);
assert.equal(checked.privateCustomerRecordsUsed,false);
assert.equal(checked.summary.screenProfiles,3);
assert.ok(checked.summary.needsDeviceReview>=3);
assert.ok(checked.assessments.every(x=>x.checks.some(i=>i.id==="navigation_fit")&&
 x.checks.some(i=>i.id==="gallery_legibility")&&
 x.checks.some(i=>i.id==="service_width")&&
 x.checks.some(i=>i.id==="layout_reflows")));
assert.ok(checked.manualAcceptance.some(x=>x.includes("real")));
assert.ok(!JSON.stringify(checked).includes("SHOULD_NOT_LEAK"));
const difference=compareAppScreenQuality(app,planned.nextConfig);
assert.equal(difference.ok,true,difference.reason);
assert.equal(difference.designOnly,true);
assert.equal(difference.widths.length,3);
assert.ok(difference.changedWidthCount>=1);
assert.equal(difference.doesNotGuaranteeImprovement,true);
assert.equal(difference.independentImageComparisonPerformed,false);
assert.equal(difference.ownerMustApproveBeforeSaving,true);
assert.equal(compareAppScreenQuality(app,{...app,payments:{enabled:true}}).ok,false);
assert.equal(compareBusinessAppDesign(app,planned.nextConfig).designOnly,true);
assert.equal(recommendResponsiveDesign({...stacked,presentation:{
 ...stacked.presentation,navigationStyle:"list"}}).recommendationCount,0);
assert.equal(read("src/core/appResponsiveDesign.mjs"),
 read("standalone/template/appResponsiveDesign.mjs"),
 "App Builder and standalone must share exactly the same mobile/tablet engine");
const pkg=read("scripts/prepare-standalone-prototype-v3154.mjs");
assert.ok(pkg.includes('"appResponsiveDesign.mjs"'),
 "Standalone prototype packager must copy the responsive policy");
const template=read("standalone/template/App.js");
for(const marker of ['useWindowDimensions','responsiveAppLayout(',
 'layout?.serviceColumns===2','layout?.galleryColumns===3',
 'layout?.ok?layout.heroHeight',
 'responsive.ok&&responsive.navigation==="list"',
 'layout={responsive}', 'import {responsiveAppLayout} from "./appResponsiveDesign.mjs"'])
 assert.ok(template.includes(marker),"Standalone layout must adapt: "+marker);
const builder=read("src/screens/miniApps.js");
assert.ok(builder.includes("<AppStudioComparison"));
const screen=builder+read("src/screens/appStudioComparison.js");
for(const marker of ["useWindowDimensions","onLayout={({nativeEvent})=>",
 "responsiveAppLayout(config,availableWidth)",
 "responsive.ok?responsive.heroHeight",
 "responsive.serviceColumns===2",
 "responsive.galleryColumns===3","recommendResponsiveDesign",
 "evaluateAppAcrossScreens","compareAppScreenQuality",
 "BUSY's explained alternatives","Trade-off: ",
 "Preview all suggested layout changes together",
 "Cross-screen quality checks","Rules compare the proposed configurations"])
 assert.ok(screen.includes(marker),"Responsive preview/owner explanation missing: "+marker);
const edge=read("supabase/functions/busy-mini-apps/index.ts");
assert.ok(edge.includes('action === "apply_coordinated_edits"'));
assert.ok(edge.includes('ownerApproved!==true'));
assert.ok(edge.includes('.eq("draft_revision",expected)'));
console.log("V3.163 PASS: physical-size-adaptive customer preview and native shell, honest multi-width diagnostics, trade-off explanations, reversible private proposals, responsive parity and tenant isolation.");
