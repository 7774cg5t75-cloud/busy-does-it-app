/**
 * V3.240: safely reuse already captured same-candidate WebView metrics
 * after a viewport switch. A current viewport report is NOT interchangeable
 * with an earlier width. No owner edit/save occurs in this helper.
 */
import {PREVIEW_WIDTHS} from "./websiteResponsivePreview.mjs";
import {compareWebsiteVisualReports} from "./websiteMeasuredDesignCoach.mjs";
import {reviewPrivateWebsiteCandidateWidthsV3239}
 from "./privateWebsiteCandidateWidthV3239.mjs";
const no=reason=>({ok:false,reason,safeForPrivateApproval:false,
 screenshotEvidence:false,mayPublish:false});
function inspectCurrentWebsiteCandidateV3240(state,{businessId,website,
 pageId,candidateId,baseGeneration,mode}={}){
 if(website?.business_id&&website.business_id!==businessId)
  return no("This website belongs to another business workspace.");
 if(!Object.hasOwn(PREVIEW_WIDTHS,mode))return no("Choose a measured phone, tablet or desktop layout.");
 const review=reviewPrivateWebsiteCandidateWidthsV3239(state,{
  businessId,website,pageId,candidateId,baseGeneration});
 if(!review.ok)return no(review.reason);
 const original=state.records?.[mode]?.original,
  candidate=state.records?.[mode]?.candidate;
 if(!original||!candidate)return no("Measure both designs at this width first.");
 const size=PREVIEW_WIDTHS[mode];
 if(Math.abs(original.counts?.viewport-size)>Math.max(20,size*.06)||
   Math.abs(candidate.counts?.viewport-size)>Math.max(20,size*.06))
  return no("The local preview did not measure the selected width.");
 const compared=compareWebsiteVisualReports(original,candidate);
 if(!compared.valid)return no("The saved measurements are not comparable.");
 return {ok:true,kind:"private_current_width_review_v3240",
  mode,comparison:compared,portfolio:review,
  safeForPrivateApproval:compared.noNewMeasuredProblems&&
    !review.hasRegressions,
  evidenceIsLocalWebView:true,
  screenshotEvidence:false,realDeviceVerified:false,
  ownerApprovalRequired:true,mayPublish:false,
  noCustomerTasksVerified:true};
}
export {inspectCurrentWebsiteCandidateV3240};
