/**
 * V3.172 - evidence-aware before/after evaluation for owner-only drafts.
 *
 * Predictive and observed layout data must never be conflated. In particular,
 * a deterministic website style or app navigation change is not proof of
 * improved task completion or revenue. No screenshots or customer data enter.
 */
import {evaluateResponsiveApp} from "./appResponsiveDesign.mjs";
import {compareStaticJourney} from "./appCustomerTaskDesign.mjs";
import {reviewWebsiteViewportPortfolio} from "./websiteViewportEvidence.mjs";
const WIDTH_IDS=["small_phone","phone","tablet"];
function appDesignEvidenceComparison({before,after,goal="enquire"}={}){
 if(!before||!after||!Array.isArray(before.modules)||!Array.isArray(after.modules))
  return {ok:false,reason:"Two private configurations are required."};
 const old=evaluateResponsiveApp(before),fresh=evaluateResponsiveApp(after);
 const navigation=compareStaticJourney(before,after,goal);
 if(!old.ok||!fresh.ok||!navigation.ok)return {
  ok:false,reason:"Configurations and customer goal must be supported."};
 const profiles=old.profiles.map((p,i)=>{
  const next=fresh.profiles[i];
  return {id:p.id,logicalWidth:p.assumedContentWidth,
   beforeWarnings:p.warnings.length,afterWarnings:next.warnings.length,
   predictedNavigationBefore:p.layout.navigation,
   predictedNavigationAfter:next.layout.navigation,
   derivedFromStaticRulesOnly:true};
 });
 return {ok:true,kind:"app_design_evidence_comparison_v3172",
  goal,beforePosition:navigation.beforePosition,
  afterPosition:navigation.afterPosition,
  earlierInNavigation:navigation.earlierInNavigation,
  capabilityUnchanged:navigation.capabilityUnchanged,
  profiles,allWidthsPresent:profiles.length===WIDTH_IDS.length,
  additionalWarnings:profiles.reduce((n,p)=>n+Math.max(0,p.afterWarnings-p.beforeWarnings),0),
  onlyPredictedLayouts:true,measuredRealScreenshots:false,
  provenCustomerImprovement:false,verifiedConversionLift:null,
  ownerApprovalRequired:true,noAutomaticChanges:true};
}
function websiteEvidenceSummary({
 viewportState=null,draftId="",generation=0,pageId=""
}={}){
 if(!draftId||!Number.isSafeInteger(generation)||generation<0||!pageId)
  return {ok:false,reason:"A current private website page and revision are required."};
 const review=reviewWebsiteViewportPortfolio(viewportState,{
  draftId,generation,pageId});
 return {ok:true,kind:"current_website_evidence_summary_v3172",
  checked:review.checked,missing:review.missing,flagged:review.flagged,
  nextAction:review.missing.length?
   "Check phone, tablet and desktop previews for this exact private revision.":
   review.flagged.length?
   "Inspect measured layout warnings and compare alternative layouts.":
   "Inspect the real hosted preview and physical devices before publishing.",
  allThreeWidthsChecked:review.missing.length===0,
  realCustomerConversionProven:false,
  noCustomerDataIncluded:true,ownerApprovalRequired:true,
  notAnAutomaticReleaseApproval:true};
}
function appAndWebsiteEvidenceBoundary(appComparison,websiteSummary){
 const appOk=appComparison?.ok===true&&
  appComparison.allWidthsPresent===true;
 const websiteOk=websiteSummary?.ok===true&&
  websiteSummary.allThreeWidthsChecked===true;
 return {kind:"cross_builder_evidence_boundary_v3172",
  appStaticWidthsCovered:appOk,
  websiteMeasuredWidthsCovered:websiteOk,
  bothEvidencePathsPresent:appOk&&websiteOk,
  evidenceNotEquivalent:true,
  actualUserSuccessTested:false,
  actualConversionGainVerified:false,
  explicitOwnerReleaseRequired:true,
  warning: "App width rules predict layout. Website width checks record in-preview measurements. Neither proves task success, sales or real-device accessibility."};
}
export {appDesignEvidenceComparison,websiteEvidenceSummary,appAndWebsiteEvidenceBoundary};
