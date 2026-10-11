/**
 * V3.165: controlled, owner-only virtual-width visual inspection.
 *
 * All widths are simulated React Native layout points on the current device;
 * they are not independent real phones/tablets. Real device testing remains
 * mandatory. Images live as temporary on-device files until explicit consent.
 */
import {prepareAppVisualBatch} from "./appVisualComparison.mjs";
import {compareRenderedQuality} from "./appRenderedQuality.mjs";
import {OPTIONS,DEFAULTS} from "./appAppearanceEditing.mjs";

const VIEWPORTS=Object.freeze([
 Object.freeze({id:"small",label:"Small-phone layout",width:320}),
 Object.freeze({id:"regular",label:"Standard-phone layout",width:390}),
 Object.freeze({id:"wide",label:"Tablet-width layout",width:820})
]);
const SAFE_URI=/^(?:file:\/\/|\/(?:data|private|var)\/|content:\/\/)[^\s]+$/i;
const UUID=/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;
const getViewport=id=>VIEWPORTS.find(x=>x.id===id)||null;
const plain=v=>typeof v==="string"?v.trim().slice(0,180)
 .replace(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi,"[email withheld]")
 .replace(/\+?\d[\d ()-]{7,}\d/g,"[phone withheld]"):"";

function validateViewportPair({appId,revision,viewportId,before,after,operations}={}){
 const profile=getViewport(viewportId);
 if(!UUID.test(appId||"")||!Number.isSafeInteger(revision)||revision<1||
    !profile||!Array.isArray(operations)||!operations.length||
    operations.length>3||!before||!after)
  return {ok:false,reason:"Use a current private draft, a supported preview width and approved design suggestions."};
 // Screenshot paths must point to local temporary captures, not remote URLs.
 for(const image of [before,after]){
  if(!image||!SAFE_URI.test(image.uri||"")||
     !Number.isInteger(image.layoutWidth)||image.layoutWidth!==profile.width||
     !Number.isInteger(image.pixelWidth)||
     !Number.isInteger(image.pixelHeight)||image.pixelHeight<64||
     image.pixelWidth<profile.width||image.pixelWidth>profile.width*5||
     image.pixelHeight>20000||!Number.isInteger(image.sizeBytes)||
     image.sizeBytes<512||image.sizeBytes>590000||
     image.scope!=="public_app_only"||
     image.appId!==appId||image.revision!==revision)
   return {ok:false,reason:"The two local customer-only JPEG captures do not match this layout width and private revision."};
 }
 if(before.uri===after.uri)return {ok:false,reason:"Capture both designs separately."};
 const seen=new Set();
 for(const op of operations){
  if(!op||op.kind!=="appearance"||
     !Object.prototype.hasOwnProperty.call(OPTIONS,op.field)||
     !OPTIONS[op.field].includes(op.value)||seen.has(op.field))
    return {ok:false,reason:"Only unique, supported appearance changes can be reviewed."};
  seen.add(op.field);
 }
 return {ok:true,kind:"private_virtual_width_pair_v3165",
  appId,revision,viewportId,width:profile.width,
  beforeUri:before.uri,afterUri:after.uri,
  operations:operations.map(x=>({kind:x.kind,field:x.field,value:x.value})),
  pixelSizeChecked:true,localOnly:true,
  userApprovalNeededForUpload:true,noScreenshotUploaded:true,
  realIndependentDeviceTest:false,fullPageScreenshotProven:false};
}

function compareViewportSet({appId,revision,results}={}){
 if(!UUID.test(appId||"")||!Number.isSafeInteger(revision)||revision<1||
    !Array.isArray(results)||results.length<1||results.length>3)
  return {ok:false,reason:"Compare one to three matching private-layout observations."};
 const observed=new Set(),comparisons=[];
 for(const entry of results){
  const profile=getViewport(entry?.viewportId);
  if(!profile||observed.has(profile.id)||
     entry.before?.appId!==appId||entry.after?.appId!==appId||
     entry.before?.revision!==revision||entry.after?.revision!==revision||
     entry.before?.viewportWidth!==profile.width||
     entry.after?.viewportWidth!==profile.width)
   return {ok:false,reason:"Layout observations do not match the current app, revision and widths."};
  observed.add(profile.id);
  const result=compareRenderedQuality(entry.before,entry.after);
  if(!result.ok)return {ok:false,reason:"One viewport lacks matching measured components or loaded image dimensions."};
  comparisons.push({viewportId:profile.id,width:profile.width,
   beforeFlags:result.beforeIssueCount,afterFlags:result.afterIssueCount,
   noLongerFlagged:result.noLongerFlagged,
   newlyFlagged:result.newlyFlagged,
   comparableRenderedComponents:true});
 }
 const improvements=comparisons.reduce((n,x)=>n+x.noLongerFlagged.length,0);
 const regressions=comparisons.reduce((n,x)=>n+x.newlyFlagged.length,0);
 return {ok:true,kind:"private_virtual_multiscreen_comparison_v3165",
  appId,revision,comparisons,inspectedWidthCount:comparisons.length,
  warningsNoLongerFlagged:improvements,newWarnings:regressions,
  balancedAssessment:regressions>0?"new_warnings":
    improvements>0?"fewer_flags":"no_flag_difference",
  noAutomaticApproval:true,noPixelsCompared:true,
  onlyMeasuredElementsCompared:true,realDevicesNotTested:true,
  ownerMustApproveChanges:true,customerDataIncluded:false};
}

/** Prioritize actual local measurements, then consented AI suggestions,
 * then zero-cost width heuristics. Never translate model prose to code.
 */
function coordinateVisualEvidence(config,{measured=[],ai=[],responsive=[]}={}){
 if(!Array.isArray(config?.modules))return {ok:false,reason:"Open the current Business App draft."};
 const chosen=[],explanations=[],seen=new Set(),discarded=[];
 for(const [source,items] of [["measured",measured],["ai",ai],["responsive",responsive]]){
  if(!Array.isArray(items)||items.length>12)return {ok:false,reason:"Too many suggestions for a safe preview."};
  for(const item of items){
   const field=item?.field,value=item?.value;
   if(typeof field!=="string"||!Object.prototype.hasOwnProperty.call(OPTIONS,field)||
       !OPTIONS[field].includes(value))continue;
   if(seen.has(field)){discarded.push(field);continue;}
   seen.add(field);
   if((config.presentation?.[field]||DEFAULTS[field])===value)continue;
   if(chosen.length>=3){discarded.push(field);continue;}
   chosen.push({kind:"appearance",field,value});
   explanations.push({field,value,source,
    why:plain(item.why||item.reason||"Compare the alternative against the current private app."),
    tradeoff:plain(item.tradeoff||"Check real phones and tablets before publishing.")});
  }
 }
 if(!chosen.length)return {ok:false,reason:"No supported unapplied design changes were found."};
 const preview=prepareAppVisualBatch(config,chosen);
 if(!preview.ok)return preview;
 return {...preview,kind:"owner_reviewed_multi_evidence_v3165",
  explanations,discarded:discarded.slice(0,12),
  evidenceTypes:[...new Set(explanations.map(x=>x.source))],
  autoApplied:false,autoPublished:false,ownerApprovalRequired:true,
  comparisonsNeedNewCaptures:true,noAIChargesCreated:true};
}
export {VIEWPORTS,getViewport,validateViewportPair,compareViewportSet,
 coordinateVisualEvidence};
