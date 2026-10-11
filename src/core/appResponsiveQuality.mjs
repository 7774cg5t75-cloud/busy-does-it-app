/**
 * V3.163 multi-screen DESIGN-ONLY evidence ledger. All checks are finite
 * logical-layout approximations or public module/configuration checks.
 *
 * Do not translate these findings into claims of accessibility compliance,
 * actual touch-target geometry, visual screenshot review, real bookings,
 * responsive behaviour of external browser content, or customer outcomes.
 */
import {evaluateResponsiveApp} from "./appResponsiveDesign.mjs";
import {auditBusinessAppUsability,compareBusinessAppDesign}
 from "./appUsabilityAudit.mjs";
function evaluateAppAcrossScreens(config){
 const responsive=evaluateResponsiveApp(config);
 const audit=auditBusinessAppUsability(config);
 if(!responsive.ok||!audit.ok)
  return {ok:false,reason:responsive.reason||
   "BUSY needs a complete current private Business App draft."};
 const enabled=new Set(config.modules.filter(x=>x.enabled===true).map(x=>x.key));
 const assessments=responsive.profiles.map(profile=>{
  const l=profile.layout;
  const checks=[
   {id:"navigation_fit",result:l.navigation==="list"&&l.enabledSectionCount>4?
     "adapted":"predicted_fit",
    detail:l.navigation==="list"?"A readable list replaces or respects navigation preferences at this width.":
     "The configured navigation remains in tabs; text wrapping and actual tap targets are not measured."},
   {id:"gallery_legibility",result:!enabled.has("gallery")||l.galleryCount===0?"not_applicable":
     l.approximateGalleryWidth>=160?"predicted_fit":"needs_device_review",
    detail:"Estimated photo cell width: "+l.approximateGalleryWidth+
      " layout points. Image cropping and fine detail require a real screenshot."},
   {id:"service_width",result:!enabled.has("services")||l.serviceCount<1?
      "not_applicable":l.serviceColumns===2&&l.width/2<280?
      "needs_device_review":"predicted_fit",
    detail:"Services use "+l.serviceColumns+" column(s). Actual content wrapping is not measured."},
   {id:"layout_reflows",result:"needs_device_review",
    detail:"Rotate the real device and test enlarged text, VoiceOver/TalkBack and input keyboard layouts."}
  ];
  return {id:profile.id,label:profile.label,assumedContentWidth:profile.assumedContentWidth,
   navigation:l.navigation,galleryColumns:l.galleryColumns,
   serviceColumns:l.serviceColumns,
   checks,reviewCount:checks.filter(x=>x.result==="needs_device_review").length,
   autoAdaptationCount:Object.values(l.automaticRuntimeAdaptations).filter(Boolean).length,
   simulatedOnly:true};
 });
 const configConcerns=audit.issues.filter(x=>x.severity==="important").map(x=>x.id);
 const summary={screenProfiles:assessments.length,
  needsDeviceReview:assessments.reduce((n,x)=>n+x.reviewCount,0),
  supportedConfigurationConcerns:configConcerns.length,
  responsiveAdaptations:assessments.reduce((n,x)=>n+x.autoAdaptationCount,0)};
 return {ok:true,kind:"public_app_multiscreen_quality_v3163",
  assessments,configurationConcerns:configConcerns,summary,
  actualDeviceFramesRendered:false,realImagesInspected:false,
  wcagCertified:false,websiteBrowserTested:false,
  realCustomerJourneyTested:false,autoPublished:false,
  privateCustomerRecordsUsed:false,
  manualAcceptance:[
   "Check the app on an actual small phone, large phone and tablet",
   "Inspect buttons, text wrapping and image cropping with large text enabled",
   "Complete real booking-request and enquiry journeys before release"
  ]};
}
function compareAppScreenQuality(base,candidate){
 const configComparison=compareBusinessAppDesign(base,candidate);
 if(!configComparison.ok||!configComparison.designOnly)
  return {ok:false,reason:"Only changes to public design settings can be compared safely."};
 const before=evaluateAppAcrossScreens(base),after=evaluateAppAcrossScreens(candidate);
 if(!before.ok||!after.ok)return {ok:false,reason:"Both private app layouts must be valid."};
 const widths=before.assessments.map((b,i)=>{
  const a=after.assessments[i];
  const distinctions=[];
  for(const key of ["navigation","galleryColumns","serviceColumns"])
   if(b[key]!==a[key])distinctions.push({
     feature:key,before:b[key],after:a[key]});
  return {id:b.id,assumedContentWidth:b.assumedContentWidth,
   differences:distinctions,simulatedOnly:true,
   additionalDeviceChecksRequired:true};
 });
 return {ok:true,kind:"multi_width_before_after_review_v3163",
  widths,changedWidthCount:widths.filter(x=>x.differences.length).length,
  overallConfigurationWarningsBefore:before.summary.supportedConfigurationConcerns,
  overallConfigurationWarningsAfter:after.summary.supportedConfigurationConcerns,
  designOnly:true,doesNotGuaranteeImprovement:true,
  independentImageComparisonPerformed:false,
  ownerMustApproveBeforeSaving:true,noCustomerDataIncluded:true};
}
export {evaluateAppAcrossScreens,compareAppScreenQuality};
