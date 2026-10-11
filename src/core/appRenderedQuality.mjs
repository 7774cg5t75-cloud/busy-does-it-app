/**
 * V3.164: privacy-bounded in-session measurements from actual React Native
 * rendered customer-facing app components. This is NOT screenshot OCR,
 * a pixel-to-pixel comparison, proof of accessible text or device certification.
 * Never accept/emit URLs, public copy, customer names, tokens or image bytes.
 */
const UUID=/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;
const KEYS=/^(nav|gallery|service)-(?:0|[1-9][0-9]?)$|^hero$/;
const KINDS=new Set(["navigation_label","gallery_image","hero_image","service_card"]);
const allowed=new Set(["key","kind","width","height","lineCount","sourceWidth","sourceHeight"]);
const sized=x=>typeof x==="number"&&Number.isFinite(x)&&x>=1&&x<=6000;
function sanitizeRenderedObservation(raw){
 if(!raw||typeof raw!=="object"||Array.isArray(raw)||
    Object.keys(raw).some(k=>!allowed.has(k))||
    !KEYS.test(raw.key||"")||!KINDS.has(raw.kind)||
    !sized(raw.width)||!sized(raw.height))return null;
 const [prefix]=raw.key.split("-");
 if(raw.kind==="navigation_label"&&prefix!=="nav"||
    raw.kind==="gallery_image"&&prefix!=="gallery"||
    raw.kind==="service_card"&&prefix!=="service"||
    raw.kind==="hero_image"&&raw.key!=="hero")return null;
 if(raw.lineCount!==undefined&&(
    raw.kind!=="navigation_label"||
    !Number.isInteger(raw.lineCount)||raw.lineCount<1||raw.lineCount>20))
   return null;
 if(raw.sourceWidth!==undefined||raw.sourceHeight!==undefined){
  if(!raw.kind.endsWith("_image")||!sized(raw.sourceWidth)||
     !sized(raw.sourceHeight))return null;
 }
 return {key:raw.key,kind:raw.kind,
  width:Math.round(raw.width),height:Math.round(raw.height),
  ...(raw.lineCount===undefined?{}:{lineCount:raw.lineCount}),
  ...(raw.sourceWidth===undefined?{}:{
    sourceWidth:Math.round(raw.sourceWidth),
    sourceHeight:Math.round(raw.sourceHeight)
  })};
}
function mergeRenderedObservations(current,next){
 const valid=sanitizeRenderedObservation(next);
 if(!valid)return {ok:false,reason:"Only finite numeric measurements of public app elements are allowed."};
 const list=Array.isArray(current)?current.map(sanitizeRenderedObservation)
   .filter(Boolean).slice(0,64):[];
 const at=list.findIndex(x=>x.key===valid.key);
 if(at>=0){
  const previous=list[at];
  // A second layout callback must not erase previously measured image metadata,
  // or a previous layout measurement if only a text event is emitted.
  const merged={...previous,...valid};
  if(JSON.stringify(previous)===JSON.stringify(merged))
   return {ok:true,observations:list,changed:false};
  list[at]=merged;
 }else if(list.length<64)list.push(valid);
 else return {ok:false,reason:"The local inspection has reached its 64-element limit."};
 return {ok:true,observations:list,changed:true};
}
function measuredImageCrop(o){
 if(!o.kind.endsWith("_image")||!sized(o.sourceWidth)||!sized(o.sourceHeight))
  return null;
 const source=o.sourceWidth/o.sourceHeight,box=o.width/o.height;
 const retained=Math.min(source/box,box/source);
 return Math.max(0,Math.min(1,retained));
}
function evaluateRenderedQuality({appId,revision,observations,viewportWidth}={}){
 if(!UUID.test(appId||"")||!Number.isSafeInteger(revision)||revision<1||
    !sized(viewportWidth)||!Array.isArray(observations))
  return {ok:false,reason:"Current private app identity and a measured layout are required."};
 const sanitized=[],seen=new Set();
 for(const entry of observations.slice(0,64)){
  const v=sanitizeRenderedObservation(entry);
  if(!v||seen.has(v.key))continue;
  seen.add(v.key);sanitized.push(v);
 }
 const issues=[];
 for(const o of sanitized){
  if(o.kind==="navigation_label"){
   if(o.width<100)issues.push({id:o.key+":narrow_nav",kind:"navigation_space",
    severity:"review",message:"This rendered navigation item may be cramped: "+
       o.width+" layout points wide.",measured:true});
   if(o.lineCount>1)issues.push({id:o.key+":wrapped_text",kind:"wrapped_label",
    severity:"review",message:"This navigation label used "+o.lineCount+
    " rendered text lines. Check it at larger system text sizes.",measured:true});
  }
  if(o.kind==="service_card"&&o.width<190)
   issues.push({id:o.key+":narrow_service",kind:"service_space",
    severity:"review",message:"This rendered service card is "+o.width+
    " layout points wide. Check long service descriptions.",measured:true});
  const visibleFraction=measuredImageCrop(o);
  if(visibleFraction!==null&&visibleFraction<0.70)
   issues.push({id:o.key+":cover_crop",kind:"potential_cover_crop",
    severity:"review",message:"The image's cover fit may show about "+
    Math.round(visibleFraction*100)+"% of its source area. Inspect important edges.",
    measured:true});
 }
 return {ok:true,kind:"local_rendered_app_inspection_v3164",appId,revision,
  viewportWidth:Math.round(viewportWidth),
  measuredComponents:sanitized.length,
  measuredKeys:sanitized.map(x=>x.key).sort(),
  imageKeysWithSourceDimensions:sanitized.filter(x=>x.kind.endsWith("_image")&&
    measuredImageCrop(x)!==null).map(x=>x.key).sort(),
  measuredKinds:[...new Set(sanitized.map(x=>x.kind))],
  issues,issueCount:issues.length,
  unmeasuredImageCount:sanitized.filter(x=>x.kind.endsWith("_image")&&
   measuredImageCrop(x)===null).length,
  actualNativeLayoutEvents:true,sourceImageDimensionsWhenAvailable:true,
  actualTextTruncationProven:false,allTextLinesVerified:false,
  imagePixelsInspected:false,screenshotCompared:false,
  accessibilityCertified:false,customerDataCaptured:false,
  uploaded:false,privateOnly:true,autoPublished:false};
}
function compatibleMeasurements(before,after){
 return Array.isArray(before?.measuredKeys)&&Array.isArray(after?.measuredKeys)&&
  before.measuredKeys.length>0&&
  JSON.stringify(before.measuredKeys)===JSON.stringify(after.measuredKeys)&&
  JSON.stringify(before.imageKeysWithSourceDimensions)===
   JSON.stringify(after.imageKeysWithSourceDimensions);
}
function compareRenderedQuality(before,after){
 if(before?.ok!==true||after?.ok!==true||
   before.kind!=="local_rendered_app_inspection_v3164"||
   after.kind!=="local_rendered_app_inspection_v3164"||
   before.appId!==after.appId||before.revision!==after.revision||
   before.viewportWidth!==after.viewportWidth||
   !compatibleMeasurements(before,after)||
   before.measuredComponents<1||after.measuredComponents<1)
  return {ok:false,reason:"Compare two measured private renderings of the same app revision and content width."};
 const old=new Set(before.issues.map(x=>x.id));
 const now=new Set(after.issues.map(x=>x.id));
 const disappearing=before.issues.filter(x=>!now.has(x.id)).map(x=>x.id);
 const appearing=after.issues.filter(x=>!old.has(x.id)).map(x=>x.id);
 return {ok:true,kind:"private_rendered_before_after_v3164",
  beforeIssueCount:before.issueCount,afterIssueCount:after.issueCount,
  noLongerFlagged:disappearing,newlyFlagged:appearing,
  beforeMeasuredElements:before.measuredComponents,
  afterMeasuredElements:after.measuredComponents,
  sameWidthAndRevision:true,allIssuesResolved:after.issueCount===0,
  actualTextTruncationProven:false,photoContentVerified:false,
  automatedImagePixelDiff:false,realDeviceCoverageUnproven:true,
  noChangesSaved:true,ownerApprovalNeeded:true};
}
/**
 * Compare only a server-confirmed private revision increment at the same
 * measured content width. Both reports are locally collected, not telemetry.
 * Warnings disappearing is not proof of photo or UI quality improvement.
 */
function compareApprovedRevisionMeasurements(before,after,{
 appId,expectedBeforeRevision,verifiedSavedRevision
}={}){
 if(before?.ok!==true||after?.ok!==true||
   before.kind!=="local_rendered_app_inspection_v3164"||
   after.kind!=="local_rendered_app_inspection_v3164"||
   before.appId!==appId||after.appId!==appId||
   before.revision!==expectedBeforeRevision||
   after.revision!==verifiedSavedRevision||
   !Number.isSafeInteger(verifiedSavedRevision)||
   verifiedSavedRevision!==expectedBeforeRevision+1||
   before.viewportWidth!==after.viewportWidth||
   !compatibleMeasurements(before,after))
  return {ok:false,reason:"A verified adjacent private revision and the same fully measured component keys and source-image coverage are required."};
 const first=new Set(before.issues.map(x=>x.id));
 const second=new Set(after.issues.map(x=>x.id));
 return {ok:true,kind:"verified_private_revision_geometry_recheck_v3164",
  previousRevision:expectedBeforeRevision,newRevision:verifiedSavedRevision,
  measuredWidth:after.viewportWidth,
  noLongerFlagged:[...first].filter(x=>!second.has(x)),
  newlyFlagged:[...second].filter(x=>!first.has(x)),
  beforeWarnings:before.issueCount,afterWarnings:after.issueCount,
  comparableGeometryOnly:true,verifiedByNativeLayoutEvents:true,
  pixelsCompared:false,photoSubjectPreservationVerified:false,
  textTruncationProven:false,customerOutcomesVerified:false,
  certifiedAccessible:false,publicChangesMade:false};
}
function suggestMeasuredAppearance(config,report){
 if(report?.ok!==true||!Array.isArray(config?.modules))
  return {ok:false,reason:"A current private report and supported app are required."};
 const current=config.presentation||{},items=[];
 const types=new Set(report.issues.map(x=>x.kind));
 if((types.has("navigation_space")||types.has("wrapped_label"))&&
    current.navigationStyle!=="list")
  items.push({kind:"appearance",field:"navigationStyle",value:"list",
    why:"The actual rendered navigation labels appeared narrow or wrapped.",
    tradeoff:"List navigation takes more vertical room.",
    confidence:"measurement_based_hypothesis_not_proven_fix"});
 if(types.has("potential_cover_crop")&&
    report.issues.some(x=>x.id.startsWith("gallery-"))&&
    current.galleryLayout!=="stack")
  items.push({kind:"appearance",field:"galleryLayout",value:"stack",
    why:"The rendered gallery frame and loaded image dimensions suggest cropping.",
    tradeoff:"One-column photos may take more scrolling and can still crop.",
    confidence:"measurement_based_hypothesis_not_proven_fix"});
 return {ok:true,kind:"suggestions_from_local_rendered_frames_v3164",
  suggestions:items.slice(0,2),requiresOwnerApproval:true,
  mustReinspectAfterChange:true,noPhotoContentAccess:true,
  noAutomaticEditing:true,chargeFree:true};
}
export {sanitizeRenderedObservation,mergeRenderedObservations,measuredImageCrop,
 evaluateRenderedQuality,compareRenderedQuality,
 compareApprovedRevisionMeasurements,suggestMeasuredAppearance};
