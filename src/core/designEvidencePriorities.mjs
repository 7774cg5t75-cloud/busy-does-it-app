/**
 * V3.173 — evidence-weighted, revision-scoped design comparisons.
 * Website measurements come from existing local visual report counters;
 * app layouts remain static rules. No pixel AI, no screenshot forgery,
 * no customer analytics, no evidence-based publishing shortcut.
 */
import {compareWebsiteVisualReports} from "./websiteMeasuredDesignCoach.mjs";
import {appDesignEvidenceComparison} from "./crossBuilderEvidence.mjs";
const WIDTHS=["phone","tablet","wide"];
function compareMeasuredWebsiteCandidates({
 draftId="",generation=0,pageId="",checks=[]
}={}){
 if(typeof draftId!=="string"||!draftId||
  !Number.isSafeInteger(generation)||generation<0||
  typeof pageId!=="string"||!pageId||
  !Array.isArray(checks)||checks.length>3)return {ok:false,
   reason:"A bounded current website page and revision are required."};
 const used=new Set(),widths=[],rejected=[];
 for(const row of checks){
  const key=row?.widthGroup;
  if(!WIDTHS.includes(key)||used.has(key)||row?.draftId!==draftId||
   row?.generation!==generation||row?.pageId!==pageId||
   row?.captureSource!=="current_private_webview_dom"||
   row?.original?.counts?.viewport!==row?.candidate?.counts?.viewport){
   rejected.push(typeof key==="string"&&WIDTHS.includes(key)?key:"unsupported");
   continue;
  }
  used.add(key);
  const compared=compareWebsiteVisualReports(row.original,row.candidate);
  if(!compared.valid){rejected.push(key);continue;}
  widths.push({widthGroup:key,viewport:row.original.counts.viewport,
   noNewMeasuredProblems:compared.noNewMeasuredProblems,
   someWarningsResolved:compared.improved,
   originalWarnings:compared.originalProblemCount,
   candidateWarnings:compared.candidateProblemCount,
   newRegressionCount:compared.regressions.length,
   method:"local_dom_metric_comparison_not_pixel_vision"});
 }
 const missing=WIDTHS.filter(x=>!widths.some(row=>row.widthGroup===x));
 const regressions=widths.filter(x=>!x.noNewMeasuredProblems);
 const provisional=!rejected.length&&!regressions.length&&
  widths.length>=2&&missing.length===1&&missing[0]==="tablet";
 const allThree=!missing.length&&!rejected.length;
 const sufficientlyChecked=widths.some(x=>x.widthGroup==="phone")&&
  widths.some(x=>x.widthGroup==="wide");
 return {ok:true,kind:"measured_website_comparison_v3173",
  checkedWidthGroups:widths,
  rejectedWidthGroups:rejected,missingWidthGroups:missing,
  currentRevisionOnly:true,
  phoneAndDesktopBothChecked:sufficientlyChecked,
  anyMeasuredRegressions:regressions.length>0,
  recommendation:!widths.length?"no_valid_measurements":
   regressions.length?"keep_original_or_investigate_regressions":
   !sufficientlyChecked?"check_remaining_widths":
   allThree?"owner_can_review_nonregressing_candidate":
   provisional?"check_tablet_before_owner_decision":"check_remaining_widths",
  candidateAutoApproved:false,realDeviceTested:false,
  realWorldTaskImprovementVerified:false,commercialLiftVerified:null,
  measurementAuthenticityIndependentlyVerified:false,
  noPublicSiteMutation:true,ownerExplicitApprovalRequired:true};
}
function compareAppGoalCandidate({before=null,after=null,goal="enquire"}={}){
 const result=appDesignEvidenceComparison({before,after,goal});
 if(!result.ok)return result;
 const regressions=result.profiles.filter(x=>
  x.afterWarnings>x.beforeWarnings);
 return {ok:true,kind:"static_app_comparison_v3173",
  goal,positions:{before:result.beforePosition,after:result.afterPosition},
  widths:result.profiles.map(x=>({
   width:x.logicalWidth,id:x.id,
   predictedBeforeWarnings:x.beforeWarnings,
   predictedAfterWarnings:x.afterWarnings
  })),
  extraStaticWarnings:regressions.length,
  recommendation:regressions.length?"inspect_predicted_regressions":
   result.earlierInNavigation?"compare_original_and_candidate":
   "no_demonstrated_navigation_gain",
  status:"static_prediction_only",
  cannotClaimRealImprovement:true,noAutomaticSave:true,
  noCustomerRecordsIncluded:true,ownerApprovalRequired:true};
}
export {compareMeasuredWebsiteCandidates,compareAppGoalCandidate};
