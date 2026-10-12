import {appVisibleCaptureReceipt,currentAppVisibleCapture}
  from "./appRenderedEvidence.mjs";
/**
 * V3.174 — private device-review evidence ledger (metadata only).
 * It does NOT capture a screenshot, record a device or certify accessibility.
 * Observations can later come from a trusted device capture flow, but manual
 * owner notes are explicitly marked unverified and cannot certify release.
 * Bound to one authorized business, surface, draft revision and viewport class.
 */
const SURFACES=Object.freeze(["website","business_app","standalone"]);
const DEVICES=Object.freeze(["ios_phone","android_phone","tablet"]);
const MODES=Object.freeze(["normal","large_text","screen_reader"]);
const RESULTS=Object.freeze(["no_visible_issue","issue_found","not_tested"]);
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SLOT=Object.freeze([
 Object.freeze({id:"ios_phone",title:"iPhone view",description:"Check portrait controls and medium display zoom."}),
 Object.freeze({id:"android_phone",title:"Android phone view",description:"Review platform layout and back/navigation behaviour."}),
 Object.freeze({id:"tablet",title:"Tablet view",description:"Check wide content and touch targets."}),
 Object.freeze({id:"large_text",title:"Large text",description:"Check truncation, clipping and button spacing."}),
 Object.freeze({id:"screen_reader",title:"Screen reader",description:"Check actual labels, focus order and request actions."})
]);
function prepareDeviceReview({businessId="",surface="website",draftId="",revision=0}={}){
 if(!UUID.test(businessId)||!SURFACES.includes(surface)||
  typeof draftId!=="string"||!/^[a-z0-9._:-]{1,120}$/i.test(draftId)||
  !Number.isSafeInteger(revision)||revision<1)return {ok:false,
   reason:"A current private business, surface and draft revision are required."};
 return {ok:true,kind:"private_device_review_plan_v3174",
  surface,draftRevision:revision,
  checks:SLOT.map(x=>({id:x.id,title:x.title,description:x.description,
   outcome:"not_tested",realDeviceObserved:false})),
  noCapturesPerformed:true,noScreenshotsIncluded:true,
  noDeviceCertification:true,realWorldEvidenceMissing:true,
  ownerReviewRequired:true,notReleaseApproval:true};
}
function summarizeDeviceReview({businessId="",surface="website",draftId="",
 revision=0,observations=[]}={}){
 const plan=prepareDeviceReview({businessId,surface,draftId,revision});
 if(!plan.ok)return plan;
 if(!Array.isArray(observations)||observations.length>24)return {
  ok:false,reason:"Only a bounded set of private device observations is supported."};
 const observed=new Map(),rejected=[];
 for(const entry of observations){
  const slot=entry?.slot,device=entry?.device,mode=entry?.mode,
   valid=typeof slot==="string"&&SLOT.some(s=>s.id===slot)&&
    DEVICES.includes(device)&&MODES.includes(mode)&&
    RESULTS.includes(entry.result)&&
    entry.businessId===businessId&&entry.surface===surface&&
    entry.draftId===draftId&&entry.revision===revision&&
    entry.source==="owner_explicit_device_review"&&
    entry.realDeviceObserved===true&&
    Number.isSafeInteger(entry.logicalWidth)&&entry.logicalWidth>=250&&
    entry.logicalWidth<=3000&&
    // A screenshot URL, customer content or raw clipboard must never become
    // part of this privacy-safe, display-only metadata ledger.
    !("screenshot" in entry)&&!("image" in entry)&&
    !("customerData" in entry)&&!("notes" in entry)&&
    (slot==="large_text"?mode==="large_text":
      slot==="screen_reader"?mode==="screen_reader":
       mode==="normal"&&slot===device);
  if(!valid||observed.has(slot)){
   rejected.push(typeof slot==="string"&&SLOT.some(s=>s.id===slot)?
     slot:"invalid_observation");
   continue;
  }
  observed.set(slot,{id:slot,outcome:entry.result,
   logicalWidth:entry.logicalWidth,
   // Owner-origin claims are NOT verified captured screenshots.
   provenance:"owner_reported_not_independently_verified"});
 }
 const checks=plan.checks.map(c=>{
  const source=observed.get(c.id);
  return {...c,outcome:source?.outcome||"not_tested",
   ownerReported:!!source,realDeviceObserved:!!source};
 });
 return {ok:true,kind:"private_device_review_summary_v3174",
  surface,revision,
  received:observations.length,accepted:observed.size,
  rejected,rejectedCount:rejected.length,checks,
  remaining:checks.filter(c=>c.outcome==="not_tested").map(c=>c.id),
  flagged:checks.filter(c=>c.outcome==="issue_found").map(c=>c.id),
  allOwnerReported:checks.every(c=>c.ownerReported&&c.outcome==="no_visible_issue"),
  accessibilityCertified:false,screenshotsActuallyCaptured:false,
  deviceAttestationIndependentlyVerified:false,
  supportsDifferentDisplayZoom:true,
  notProductionReleaseProof:true,noRawCustomerOrDeviceData:true,
  noCustomerContact:true,noAutomaticApproval:true};
}
/**
 * Use an existing on-device BUSY App Preview pixel capture, without returning
 * its local URI, timestamps, raw pixels or business identifiers to UI reports.
 * This is actual local capture evidence, but NOT independent server/device
 * authentication, a complete screen or an accessibility review.
 */
function summarizeLocalAppCapture({businessId="",appId="",revision=0,
 capture=null}={}){
 if(!UUID.test(businessId)||!UUID.test(appId)||!Number.isSafeInteger(revision)||
    revision<1||!currentAppVisibleCapture(capture,{appId,revision})||
    capture?.captureScope!=="public_app_only"||
    capture?.realDevicePixelCapture!==true||
    capture?.captureIsLocal!==true||
    capture?.mimeType!=="image/jpeg"){
  return {ok:false,reason:"A current public-app-only local capture is required."};
 }
 const validated=appVisibleCaptureReceipt({
  appId,revision,screenshotUri:capture.uri,
  width:capture.width,height:capture.height,
  platform:capture.platform,capturedAt:capture.capturedAt
 });
 if(!validated.ok)return {ok:false,reason:validated.reason};
 return {ok:true,kind:"local_app_pixel_capture_summary_v3174",
  surface:"business_app",revision,
  platform:validated.platform,logicalWidth:validated.width,
  logicalHeight:validated.height,
  samePrivateRevision:true,
  screenshotActuallyCapturedLocally:true,
  publicAppSurfaceOnly:true,
  fullScrollingAppCaptured:false,
  actualPixelContentAnalysed:false,
  screenshotIndependentlyAuthenticated:false,
  physicalDeviceAccessibilityTested:false,
  independentDeviceModelVerified:false,
  otherDeviceWidthsStillNeedReview:true,
  noRawScreenshotUriReturned:true,noBusinessOrCustomerDataReturned:true,
  noImageUpload:true,noAutomaticPublishing:true,
  notReleaseApproval:true};
}
export {SLOT,prepareDeviceReview,summarizeDeviceReview,summarizeLocalAppCapture};
