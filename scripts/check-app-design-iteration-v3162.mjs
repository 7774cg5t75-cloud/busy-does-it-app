import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {proposeGalleryImageDescription} from "../src/core/appGalleryDescription.mjs";
import {proposeCoordinatedAppChanges} from "../src/core/appCoordinatedStudio.mjs";
import {prepareAppDesignIteration,inspectApprovedAppIteration,
 proposeLowRiskDesignHints} from "../src/core/appDesignIteration.mjs";
import {auditBusinessAppUsability} from "../src/core/appUsabilityAudit.mjs";
import {prepareAppVisualBatch} from "../src/core/appVisualComparison.mjs";
const read=x=>readFileSync(new URL("../"+x,import.meta.url),"utf8");
const id="00000000-0000-4000-8000-000000000162";
const config={modules:["business_profile","gallery","services","contact"].map(key=>({key,enabled:true})),
 navigation:["business_profile","gallery","services","contact"],
 display:{name:"Creative Florist"},presentation:{headerStyle:"refined",
  layoutDensity:"comfortable",navigationStyle:"tabs",
  galleryLayout:"grid",imageScale:"large"},
 publicProfile:{businessName:"Creative Florist",services:[{name:"Bouquet",description:"Seasonal"}],
  assets:{gallery:[{uri:"https://example.test/1.jpg",approved:true,
    marketingOk:true},{uri:"https://example.test/2.jpg",approved:true,
    alt:"Flowers arranged in a vase",caption:"In the shop"}]},
  contact:{email:"owner@example.test"}},
 privateCustomers:[{name:"Confidential"}],payments:{enabled:false}};
const original=JSON.stringify(config);
const before=auditBusinessAppUsability(config);
assert.ok(before.issues.some(x=>x.id==="gallery_density"));
assert.ok(before.issues.some(x=>x.id==="photo_descriptions"));
const hints=proposeLowRiskDesignHints(config);
assert.equal(hints.ok,true);
assert.equal(hints.autoApply,false);
assert.equal(hints.customerInformationUsed,false);
assert.deepEqual(hints.suggestions.map(x=>x.field),["galleryLayout"]);
assert.equal(hints.suggestions[0].value,"stack");
assert.equal(proposeLowRiskDesignHints({...config,modules:null}).ok,false);
const pending=prepareAppDesignIteration({appId:id,revision:12,config,
 operations:[{kind:"appearance",field:"galleryLayout",value:"stack"},
 {kind:"appearance",field:"layoutDensity",value:"airy"}]});
assert.equal(pending.ok,true,pending.reason);
assert.equal(pending.privateOnly,true);
assert.equal(pending.noScreenshotStored,true);
assert.equal(pending.beforeRevision,12);
assert.equal(pending.expectedAfterRevision,13);
assert.ok(!JSON.stringify(pending).includes("Confidential"));
const proposal=proposeCoordinatedAppChanges(config,[
 {kind:"appearance",field:"galleryLayout",value:"stack"},
 {kind:"appearance",field:"layoutDensity",value:"airy"}]);
assert.equal(proposal.ok,true);
assert.equal(inspectApprovedAppIteration(pending,{
 appId:id,revision:12,config:proposal.nextConfig,saveConfirmed:true}).ok,false);
assert.equal(inspectApprovedAppIteration(pending,{
 appId:id,revision:13,config:proposal.nextConfig,saveConfirmed:false}).ok,false);
const recheck=inspectApprovedAppIteration(pending,{
 appId:id,revision:13,config:proposal.nextConfig,saveConfirmed:true});
assert.equal(recheck.ok,true,recheck.reason);
assert.equal(recheck.allSettingsApplied,true);
assert.ok(recheck.resolvedStaticFlags.includes("gallery_density"));
assert.equal(recheck.actualPixelComparisonPerformed,false);
assert.equal(recheck.visionAIRecheckPerformed,false);
assert.equal(recheck.accessibilityCertified,false);
assert.equal(recheck.customerOutcomeVerified,false);
assert.equal(recheck.safeToPublishAutomatically,false);
assert.ok(!JSON.stringify(recheck).includes("Confidential"));
const wrong=inspectApprovedAppIteration(pending,{
 appId:id,revision:13,config,saveConfirmed:true});
assert.equal(wrong.ok,true);
assert.equal(wrong.allSettingsApplied,false);
for(const ops of [[],[{kind:"services",value:[]}],
 [{kind:"appearance",field:"payments",value:"enabled"}],
 [{kind:"appearance",field:"galleryLayout",value:"stack"},
  {kind:"appearance",field:"galleryLayout",value:"grid"}],
 Array(4).fill({kind:"appearance",field:"galleryLayout",value:"stack"})]){
 assert.equal(prepareAppDesignIteration({appId:id,revision:12,config,
   operations:ops}).ok,false);
}
const approved=config.publicProfile.assets.gallery[0];
const alt=proposeGalleryImageDescription(config,{index:0,expectedUri:approved.uri,
 value:{alt:"An autumn arrangement in a wooden basket",caption:"Autumn bouquet"}});
assert.equal(alt.ok,true,alt.reason);
assert.equal(alt.nextConfig.publicProfile.assets.gallery[0].uri,approved.uri);
assert.equal(alt.nextConfig.publicProfile.assets.gallery[0].alt,
 "An autumn arrangement in a wooden basket");
assert.equal(alt.nextConfig.privateCustomers,config.privateCustomers);
assert.equal(alt.mediaUnchanged,true);
assert.equal(JSON.stringify(config),original);
const updated=proposeCoordinatedAppChanges(config,[{
 kind:"photo_description",index:0,expectedUri:approved.uri,
 value:{alt:"A red rose arrangement",caption:"Our handmade bouquet"}}]);
assert.equal(updated.ok,true,updated.reason);
assert.equal(updated.changes.length,1);
assert.equal(updated.publishes,false);
assert.equal(updated.nextConfig.publicProfile.assets.gallery[1],
 config.publicProfile.assets.gallery[1]);
const restored=proposeCoordinatedAppChanges(updated.nextConfig,updated.undoOperations);
assert.equal(restored.ok,true,restored.reason);
assert.deepEqual(restored.nextConfig.publicProfile,config.publicProfile);
const finishedAudit=auditBusinessAppUsability(updated.nextConfig);
assert.ok(!finishedAudit.issues.some(x=>x.id==="photo_descriptions"));
assert.ok(finishedAudit.issues.some(x=>x.id==="gallery_density"));
for(const bad of [
 {index:0,expectedUri:"https://attacker.test/other",value:{alt:"Good",caption:""}},
 {index:-1,expectedUri:approved.uri,value:{alt:"Good",caption:""}},
 {index:0,expectedUri:approved.uri,value:{alt:"<script>",caption:""}},
 {index:0,expectedUri:approved.uri,value:{alt:"x".repeat(161),caption:""}},
 {index:0,expectedUri:approved.uri,value:{alt:"Good",caption:"",approved:false}},
 {index:0,expectedUri:approved.uri,value:{alt:"Good",caption:undefined}}
])assert.equal(proposeGalleryImageDescription(config,bad).ok,false);
assert.equal(proposeGalleryImageDescription({
 ...config,publicProfile:{...config.publicProfile,assets:{
 gallery:[{uri:approved.uri,approved:false}]}}
},{index:0,expectedUri:approved.uri,value:{alt:"Test",caption:""}}).ok,false);
const combined=prepareAppVisualBatch(config,[{kind:"appearance",
 field:"galleryLayout",value:"stack",reason:"Visually compare"}]);
assert.equal(combined.ok,true);
assert.equal(prepareAppDesignIteration({appId:id,revision:1,config,
 operations:combined.operations}).ok,true);
assert.equal(read("src/core/appGalleryDescription.mjs"),
 read("supabase/functions/busy-mini-apps/appGalleryDescription.mjs"));
assert.equal(read("src/core/appCoordinatedStudio.mjs"),
 read("supabase/functions/busy-mini-apps/appCoordinatedStudio.mjs"));
const screen=read("src/screens/miniApps.js");
for(const marker of ["prepareAppDesignIteration","inspectApprovedAppIteration",
 "setDesignCheckpoint({...prepared,saveConfirmed:true})",
 "resolvedStaticFlags","Capture visible screen (app only)",
 "Ask AI to inspect this screenshot","Approve one AI review",
 "proposeLowRiskDesignHints","Preview photo description changes",
 "photo_description","expectedUri:item?.uri"]){
 assert.ok(screen.includes(marker),"Missing V3.162 UI: "+marker);
}
const edge=read("supabase/functions/busy-mini-apps/index.ts");
assert.ok(edge.includes("apply_coordinated_edits"));
assert.ok(edge.includes("ownerApproved!==true"));
assert.ok(edge.includes('.eq("draft_revision",expected)'));
console.log("V3.162 PASS: private owner-approved review/recheck, post-revision verification, non-AI design hints, gallery accessibility edits and complete undo without customer data.");
