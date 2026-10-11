import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {VIEWPORTS,getViewport,validateViewportPair,compareViewportSet,
 coordinateVisualEvidence} from "../src/core/appVisualMultiViewport.mjs";
import {evaluateRenderedQuality} from "../src/core/appRenderedQuality.mjs";
import {proposeCoordinatedAppChanges} from "../src/core/appCoordinatedStudio.mjs";
const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const appId="00000000-0000-4000-8000-000000000165",revision=9;
const config={
 modules:["business_profile","services","gallery","booking_request","contact"].map(
   key=>({key,enabled:true})),
 navigation:["business_profile","services","gallery","booking_request","contact"],
 presentation:{headerStyle:"refined",navigationStyle:"tabs",
  galleryLayout:"grid",layoutDensity:"compact"},
 publicProfile:{businessName:"Public Studio",
  services:[{name:"Public appointment",description:"Owner-approved service"}],
  assets:{gallery:[{uri:"https://example.test/owner-approved.jpg",approved:true}]}},
 privateCustomers:[{name:"SECRET CUSTOMER"}],
 payments:{enabled:false}
};
assert.deepEqual(VIEWPORTS.map(x=>x.width),[320,390,820]);
assert.equal(getViewport("wide").width,820);
assert.equal(getViewport("__proto__"),null);
const operations=[{kind:"appearance",field:"navigationStyle",value:"list"}];
const makePair=(viewportId)=>{
 const w=getViewport(viewportId).width;
 return {appId,revision,viewportId,operations,
  before:{uri:"file:///var/tmp/before-"+viewportId+".jpg",appId,revision,
   scope:"public_app_only",layoutWidth:w,pixelWidth:w*3,
   pixelHeight:1250,sizeBytes:11000},
  after:{uri:"file:///var/tmp/after-"+viewportId+".jpg",appId,revision,
   scope:"public_app_only",layoutWidth:w,pixelWidth:w*3,
   pixelHeight:1280,sizeBytes:12000}};
};
for(const item of VIEWPORTS){
 const request=makePair(item.id);
 const pass=validateViewportPair(request);
 assert.equal(pass.ok,true,pass.reason);
 assert.equal(pass.realIndependentDeviceTest,false);
 assert.equal(pass.noScreenshotUploaded,true);
 assert.equal(pass.userApprovalNeededForUpload,true);
 assert.equal(pass.width,item.width);
 assert.equal(pass.operations.length,1);
 for(const bad of [
  {...request,appId:"wrong"},
  {...request,revision:0},
  {...request,before:{...request.before,layoutWidth:390===item.width?320:390}},
  {...request,before:{...request.before,sizeBytes:undefined}},
  {...request,before:{...request.before,sizeBytes:590001}},
  {...request,before:{...request.before,pixelWidth:1}},
  {...request,before:{...request.before,uri:"https://not-local.test/photo.jpg"}},
  {...request,after:{...request.after,scope:"full_device"}},
  {...request,after:{...request.after,appId:"another-app"}},
  {...request,after:{...request.after,revision:revision+1}},
  {...request,after:{...request.after,uri:request.before.uri}},
  {...request,operations:operations.concat(operations)},
  {...request,operations:[{kind:"data",field:"payments",value:"on"}]}
 ])assert.equal(validateViewportPair(bad).ok,false,"Invalid capture should fail");
}
const quality=(width,isAfter)=>{
 const observations=[
  {key:"nav-0",kind:"navigation_label",width:isAfter?240:82,
   height:50,lineCount:isAfter?1:2},
  {key:"gallery-0",kind:"gallery_image",
   width:isAfter?240:120,height:isAfter?120:190,
   sourceWidth:1200,sourceHeight:600}
 ];
 return evaluateRenderedQuality({appId,revision,viewportWidth:width,
  observations});
};
const entries=VIEWPORTS.map(v=>({
 viewportId:v.id,before:quality(v.width,false),after:quality(v.width,true)
}));
const multi=compareViewportSet({appId,revision,results:entries});
assert.equal(multi.ok,true,multi.reason);
assert.equal(multi.inspectedWidthCount,3);
assert.equal(multi.realDevicesNotTested,true);
assert.equal(multi.noPixelsCompared,true);
assert.equal(multi.ownerMustApproveChanges,true);
assert.equal(multi.customerDataIncluded,false);
assert.equal(multi.newWarnings,0);
assert.ok(multi.warningsNoLongerFlagged>0);
assert.deepEqual(multi.comparisons.map(x=>x.width),[320,390,820]);
assert.equal(compareViewportSet({appId,revision,results:[]}).ok,false);
assert.equal(compareViewportSet({appId,revision,results:[entries[0],entries[0]]}).ok,false);
assert.equal(compareViewportSet({appId,revision,results:[{
 ...entries[0],before:{...entries[0].before,viewportWidth:390}
}]}).ok,false);
assert.equal(compareViewportSet({appId,revision,results:[{
 ...entries[0],after:{...entries[0].after,measuredKeys:["nav-0"]}
}]}).ok,false);
const proposal=coordinateVisualEvidence(config,{
 measured:[
  {field:"navigationStyle",value:"list",why:"Narrow, wrapped navigation"},
  {field:"galleryLayout",value:"stack",why:"Cropping likely"}
 ],
 ai:[
  {field:"layoutDensity",value:"airy",reason:"Roomy design"},
  {field:"galleryLayout",value:"grid",reason:"Conflict is ignored"}
 ],
 responsive:[
  {field:"imageCorners",value:"square",reason:"Alternative; max three"},
  {field:"navigationStyle",value:"list",reason:"Duplicate"}
 ]
});
assert.equal(proposal.ok,true,proposal.reason);
assert.equal(proposal.kind,"owner_reviewed_multi_evidence_v3165");
assert.deepEqual(proposal.operations,[
 {kind:"appearance",field:"navigationStyle",value:"list"},
 {kind:"appearance",field:"galleryLayout",value:"stack"},
 {kind:"appearance",field:"layoutDensity",value:"airy"}
]);
assert.deepEqual(proposal.evidenceTypes,["measured","ai"]);
assert.equal(proposal.explanations.length,3);
assert.ok(proposal.explanations.every(x=>x.why&&x.tradeoff));
assert.ok(proposal.discarded.includes("imageCorners"));
assert.equal(proposal.autoApplied,false);
assert.equal(proposal.ownerApprovalRequired,true);
assert.equal(proposal.autoPublished,false);
assert.equal(proposal.noAIChargesCreated,true);
assert.equal(proposal.nextConfig.payments,config.payments);
assert.deepEqual(proposal.nextConfig.privateCustomers,config.privateCustomers);
const reverted=proposeCoordinatedAppChanges(proposal.nextConfig,proposal.undoOperations);
assert.equal(reverted.ok,true,reverted.reason);
assert.equal(reverted.nextConfig.presentation.galleryLayout,config.presentation.galleryLayout);
assert.equal(coordinateVisualEvidence(config,{measured:[],ai:[],responsive:[]}).ok,false);
assert.equal(coordinateVisualEvidence(config,{measured:Array(13).fill({
 field:"navigationStyle",value:"list"})}).ok,false);
assert.equal(coordinateVisualEvidence(config,{measured:[{
 field:"payments",value:"true"}]}).ok,false);
const pii=coordinateVisualEvidence(config,{
 measured:[{field:"navigationStyle",value:"list",
  why:"Contact me at name@example.test or +44 7700 900123"}]
});
assert.equal(pii.ok,true);
assert.equal(JSON.stringify(pii.explanations).includes("name@example.test"),false);
assert.equal(JSON.stringify(pii.explanations).includes("7700"),false);
const screen=read("src/screens/miniApps.js");
for(const marker of [
 "getViewport(virtualWidthId)","coordinateVisualEvidence(config",
 "validateViewportPair({appId,revision","compareViewportSet({appId,revision",
 "Image.getSize(uri,","new ExpoFile(uri)","PixelRatio.get()",
 "virtualBeforeRef","virtualAfterRef","ScrollView horizontal",
 "Capture original and proposed at ","Ask AI to compare these two screenshots",
 "one credit","owner-approved","s.comparePrivateAppScreenshots?.({",
 "s.checkPrivateAppVisualReview?.()","Approve "," PRIVATE design change(s)",
 "Why BUSY prepared these coordinated changes","s.saveCoordinatedAppChanges?.({"
])assert.ok(screen.includes(marker),"Expected client workflow: "+marker);
assert.ok(screen.includes('onQualityObservation={collectVirtualBefore}'));
assert.ok(screen.includes('onQualityObservation={collectVirtualAfter}'));
assert.ok(!read("src/core/appVisualMultiViewport.mjs").includes("fetch("));
const backend=read("supabase/functions/busy-mini-apps/index.ts");
assert.ok(backend.includes('action==="review_app_screenshot"||action==="compare_app_screenshots"'));
assert.ok(backend.includes('"busy_reserve_app_visual_ai_call"'));
assert.ok(backend.includes('screenshotStored:false'));
assert.ok(backend.includes('ownerConsent'));
assert.ok(backend.includes('mode==="comparison"'));
console.log("V3.165 PASS: three-width local customer captures, fail-closed receipt validation, comparable layout geometry, one-credit owner-consented AI routing, finite coordinated private designs and Undo.");
