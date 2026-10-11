import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {sanitizeRenderedObservation,mergeRenderedObservations,measuredImageCrop,
 evaluateRenderedQuality,compareRenderedQuality,compareApprovedRevisionMeasurements,
 suggestMeasuredAppearance} from "../src/core/appRenderedQuality.mjs";
import {prepareAppVisualBatch} from "../src/core/appVisualComparison.mjs";
import {proposeCoordinatedAppChanges} from "../src/core/appCoordinatedStudio.mjs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const appId="00000000-0000-4000-8000-000000000164";
const config={modules:["business_profile","gallery","services","contact"].map(key=>({
 key,enabled:true})),navigation:["business_profile","gallery","services","contact"],
 presentation:{navigationStyle:"tabs",galleryLayout:"grid",layoutDensity:"compact"},
 publicProfile:{businessName:"Public business",assets:{gallery:[
  {uri:"https://example.test/flower.jpg",alt:"Approved public flower",approved:true}]}},
 privateCustomer:{name:"CONFIDENTIAL"},apiKey:"DO_NOT_SHARE"};
const original=JSON.stringify(config);
const nav={key:"nav-0",kind:"navigation_label",width:85,height:48,lineCount:2};
const photo={key:"gallery-0",kind:"gallery_image",width:150,height:150,
 sourceWidth:800,sourceHeight:400};
const hero={key:"hero",kind:"hero_image",width:200,height:130,
 sourceWidth:1600,sourceHeight:400};
const service={key:"service-0",kind:"service_card",width:180,height:170};
assert.deepEqual(sanitizeRenderedObservation(nav),nav);
assert.equal(sanitizeRenderedObservation({...nav,label:"John Doe"}),null);
assert.equal(sanitizeRenderedObservation({...photo,uri:"https://x"}),null);
assert.equal(sanitizeRenderedObservation({...nav,content:"secret"}),null);
assert.equal(sanitizeRenderedObservation({...nav,customerName:"Jane"}),null);
assert.equal(sanitizeRenderedObservation({...nav,lineCount:21}),null);
assert.equal(sanitizeRenderedObservation({...photo,sourceHeight:0}),null);
assert.equal(sanitizeRenderedObservation({...photo,sourceWidth:undefined}),null);
assert.equal(sanitizeRenderedObservation({...nav,kind:"hero_image"}),null);
assert.equal(sanitizeRenderedObservation({...photo,width:Infinity}),null);
assert.equal(sanitizeRenderedObservation({...photo,width:-12}),null);
assert.equal(sanitizeRenderedObservation({...photo,key:"gallery-100"}),null);
assert.equal(sanitizeRenderedObservation({...photo,key:"../private"}),null);
let list=[];
for(const x of [nav,photo,hero,service]){
 const m=mergeRenderedObservations(list,x);
 assert.equal(m.ok,true,m.reason);assert.equal(m.changed,true);
 list=m.observations;
}
assert.equal(list.length,4);
assert.equal(mergeRenderedObservations(list,nav).changed,false);
const upgraded=mergeRenderedObservations(list,{
 key:"gallery-0",kind:"gallery_image",width:148,height:145});
assert.equal(upgraded.ok,true);
assert.equal(upgraded.observations[1].sourceWidth,800);
assert.equal(upgraded.observations[1].sourceHeight,400);
assert.equal(mergeRenderedObservations(list,{...nav,email:"private@test.invalid"}).ok,false);
assert.equal(measuredImageCrop(photo),0.5);
assert.equal(measuredImageCrop(nav),null);
assert.equal(measuredImageCrop({key:"hero",kind:"hero_image",
 width:150,height:150}),null);
const before=evaluateRenderedQuality({appId,revision:4,observations:list,
 viewportWidth:390});
assert.equal(before.ok,true,before.reason);
assert.equal(before.actualNativeLayoutEvents,true);
assert.equal(before.imagePixelsInspected,false);
assert.equal(before.customerDataCaptured,false);
assert.equal(before.uploaded,false);
assert.equal(before.privateOnly,true);
assert.equal(before.issueCount,5);
assert.deepEqual(before.issues.map(x=>x.kind),[
 "navigation_space","wrapped_label","potential_cover_crop",
 "potential_cover_crop","service_space"]);
assert.equal(JSON.stringify(before).includes("CONFIDENTIAL"),false);
assert.equal(JSON.stringify(before).includes("example.test"),false);
assert.equal(evaluateRenderedQuality({appId,revision:0,
 observations:list,viewportWidth:390}).ok,false);
const changed=[
 {key:"nav-0",kind:"navigation_label",width:210,height:55,lineCount:1},
 {key:"gallery-0",kind:"gallery_image",width:300,height:150,
  sourceWidth:800,sourceHeight:400},
 {key:"hero",kind:"hero_image",width:300,height:300,
  sourceWidth:1600,sourceHeight:400},
 {key:"service-0",kind:"service_card",width:290,height:200}
];
const after=evaluateRenderedQuality({appId,revision:4,
 observations:changed,viewportWidth:390});
const comparison=compareRenderedQuality(before,after);
assert.equal(comparison.ok,true,comparison.reason);
assert.equal(comparison.beforeIssueCount,5);
assert.equal(comparison.afterIssueCount,1);
assert.equal(comparison.noLongerFlagged.length,4);
assert.equal(comparison.automatedImagePixelDiff,false);
assert.equal(comparison.ownerApprovalNeeded,true);
assert.equal(compareRenderedQuality(before,{...after,viewportWidth:320}).ok,false);
assert.equal(compareRenderedQuality(before,{...after,revision:5}).ok,false);
assert.equal(compareRenderedQuality(before,{...after,appId:"different"}).ok,false);
const afterSaved=evaluateRenderedQuality({appId,revision:5,
 observations:changed,viewportWidth:390});
const revisionCheck=compareApprovedRevisionMeasurements(before,afterSaved,{
 appId,expectedBeforeRevision:4,verifiedSavedRevision:5});
assert.equal(revisionCheck.ok,true,revisionCheck.reason);
assert.equal(revisionCheck.noLongerFlagged.length,4);
assert.equal(revisionCheck.photoSubjectPreservationVerified,false);
assert.equal(revisionCheck.publicChangesMade,false);
for(const request of [
 {appId,expectedBeforeRevision:3,verifiedSavedRevision:5},
 {appId,expectedBeforeRevision:4,verifiedSavedRevision:6},
 {appId:"different",expectedBeforeRevision:4,verifiedSavedRevision:5}
])assert.equal(compareApprovedRevisionMeasurements(before,afterSaved,request).ok,false);
assert.equal(compareApprovedRevisionMeasurements(before,{
 ...afterSaved,viewportWidth:375},{
 appId,expectedBeforeRevision:4,verifiedSavedRevision:5}).ok,false);
const suggestions=suggestMeasuredAppearance(config,before);
assert.equal(suggestions.ok,true);
assert.deepEqual(suggestions.suggestions.map(x=>x.field),
 ["navigationStyle","galleryLayout"]);
assert.equal(suggestions.chargeFree,true);
assert.equal(suggestions.noAutomaticEditing,true);
assert.ok(suggestions.suggestions.every(x=>x.why&&x.tradeoff));
const preview=prepareAppVisualBatch(config,suggestions.suggestions.map(x=>({
 kind:x.kind,field:x.field,value:x.value,reason:x.why
})));
assert.equal(preview.ok,true,preview.reason);
assert.equal(preview.operations.length,2);
assert.equal(preview.publishes,false);
assert.deepEqual(preview.nextConfig.privateCustomer,config.privateCustomer);
const undo=proposeCoordinatedAppChanges(preview.nextConfig,preview.undoOperations);
assert.equal(undo.ok,true);
assert.equal(JSON.stringify(config),original);
const ux=read("src/screens/miniApps.js");
for(const marker of ["MeasuredPublicImage","MeasuredNavLabel",
 "onTextLayout={e=>","onLoad={event=>","onQualityObservation",
 "mergeRenderedObservations","evaluateRenderedQuality",
 "compareRenderedQuality","compareApprovedRevisionMeasurements",
 "suggestMeasuredAppearance","Inspect rendered layout (no AI cost)",
 "Measured layout comparison","Warnings in new private revision",
 "onQualityObservation={qualityEnabled?collectAfter:null}",
 "onMeasuredWidth={qualityEnabled?setCurrentMeasuredWidth:null}",
 'setDesignCheckpoint({...prepared,saveConfirmed:true,']){
 assert.ok(ux.includes(marker),"Unwired local rendered inspection: "+marker);
}
const workflow=read(".github/workflows/app-rendered-quality-v3164.yml");
assert.ok(workflow.includes("node scripts/check-responsive-app-v3163.mjs"));
assert.ok(workflow.includes("npx expo export --platform android"));
assert.ok(workflow.includes("prepare-standalone-prototype-v3154.mjs"));
console.log("V3.164 PASS: privacy-safe numeric on-device observations, actual rendered frame warnings, source-aspect crop estimation, measured before/after geometry, post-approval exact revision rechecks, approved finite suggestions and Undo.");
