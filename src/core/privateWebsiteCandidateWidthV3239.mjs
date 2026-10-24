/**
 * V3.239 — one private Website Builder candidate, compared across viewports.
 *
 * This is a LOCAL WebView DOM evidence notebook. No screenshots, provenance
 * attestation, model training, upload, edit or publish. The actual owner
 * approval remains in the original Website Builder controller.
 */
import {PREVIEW_WIDTHS} from "./websiteResponsivePreview.mjs";
import {compareWebsiteVisualReports} from "./websiteMeasuredDesignCoach.mjs";
import {planUniversalBuilderRequest} from "./universalBuilderPlanV3210.mjs";
import {reviewSharedBuilderMultiwidthEvidenceV3237}
 from "./sharedBuilderMultiwidthEvidenceV3237.mjs";

const UUID=/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const MODES=["phone","tablet","desktop"];
const METRICS=["viewport","width","overflow","images","missingAlt",
 "unloadedImages","smallTargets","badAnchors","clippedHeadings","headings",
 "sections","lowContrast","contrastUnknown","contrastChecked","smallBodyText"];
const ISSUES=new Set(["overflow","photos","descriptions","targets","links",
 "contrast","readability","contrast-unchecked","headings","empty"]);
const reject=reason=>({ok:false,reason,mayApply:false,mayPublish:false});

function context({businessId="",website=null,pageId="",candidateId="",
 baseGeneration=null}={}){
 if(!UUID.test(businessId)||!website||!website.id||
   (website.businessId&&website.businessId!==businessId)||
   (website.business_id&&website.business_id!==businessId)||
   !Number.isSafeInteger(website.generation)||website.generation<1||
   baseGeneration!==website.generation||
   !Array.isArray(website.pages)||
   !website.pages.some(p=>p?.id===pageId&&p.enabled!==false)||
   !/^[a-z0-9-]{1,64}$/.test(candidateId))
   return null;
 return {businessId,websiteId:website.id,generation:website.generation,
  pageId,candidateId};
}
function same(a,b){
 return !!a&&!!b&&a.businessId===b.businessId&&
  a.websiteId===b.websiteId&&a.generation===b.generation&&
  a.pageId===b.pageId&&a.candidateId===b.candidateId;
}
function boundedReport(report,mode){
 const target=PREVIEW_WIDTHS[mode];
 if(!target||!report||!Array.isArray(report.issues)||
   report.issues.length>15||!report.counts||
   !Number.isSafeInteger(report.counts.viewport)||
   Math.abs(report.counts.viewport-target)>Math.max(20,target*.06))
   return null;
 const counts={};
 for(const field of METRICS){
  const number=report.counts[field];
  if(!Number.isSafeInteger(number)||number<0||number>100000)return null;
  counts[field]=number;
 }
 if(report.counts.textBlocks!==undefined){
  const n=report.counts.textBlocks;if(!Number.isSafeInteger(n)||n<0||n>10000)return null;
  counts.textBlocks=n;
 }
 if(counts.viewport<250||counts.viewport>3000||
   counts.width>100000)return null;
 const issues=[];
 const ids=new Set();
 for(const item of report.issues){
  if(!item||!ISSUES.has(item.id)||ids.has(item.id))return null;
  ids.add(item.id);issues.push({id:item.id});
 }
 return {counts,issues};
}
function recordPrivateWebsiteCandidateWidthV3239(previous,{businessId,website,
 pageId,candidateId,baseGeneration,mode,variant,report}={}){
 const stamp=context({businessId,website,pageId,candidateId,baseGeneration});
 if(!stamp)return reject("The owner, private draft or version changed. Review again.");
 if(!MODES.includes(mode)||!["original","candidate"].includes(variant))
  return reject("Choose phone, tablet or desktop and a current design.");
 const metric=boundedReport(report,mode);
 if(!metric)return reject("The WebView did not measure the requested screen width reliably.");
 if(previous&&!same(previous,stamp))
  return reject("This comparison belongs to a different private design. Start again.");
 const current=previous?.records?.[mode]||{};
 const records={...(previous?.records||{}),
  [mode]:{...current,[variant]:metric}};
 return {ok:true,kind:"private_design_width_portfolio_v3239",
  state:{...stamp,records},recordedWidth:metric.counts.viewport,
  captureSource:"local_first_party_webview_dom",
  noScreenshotEvidence:true,mayApply:false,mayPublish:false};
}
function reviewPrivateWebsiteCandidateWidthsV3239(state,{businessId,website,
 pageId,candidateId,baseGeneration}={}){
 const stamp=context({businessId,website,pageId,candidateId,baseGeneration});
 if(!stamp||!same(state,stamp))return reject("Open a current private candidate for this business.");
 const entries=state.records||{};
 const checked=[],incomplete=[],reports=[];
 for(const mode of MODES){
  const {original,candidate}=entries[mode]||{};
  if(!original||!candidate){
   incomplete.push(mode);continue;
  }
  if(!boundedReport(original,mode)||!boundedReport(candidate,mode))
   return reject("Stored layout measurements are incomplete or no longer match their width.");
  const compared=compareWebsiteVisualReports(original,candidate);
  if(!compared.valid)return reject("The original and alternative need comparable measurements.");
  // Layout-only improvements cannot earn approval by hiding existing content.
  for(const field of ["sections","headings","images"]){
   if(candidate.counts[field]<original.counts[field]){
    compared.regressions.push("Existing "+field+" disappeared from the measured page");
    compared.noNewMeasuredProblems=false;compared.improved=false;
   }
  }
  checked.push({device:mode,originalWarnings:compared.originalProblemCount,
   candidateWarnings:compared.candidateProblemCount,
   newMeasuredProblems:[...compared.regressions].slice(0,15),
   improved:compared.improved});
  reports.push({device:mode,width:original.counts.viewport,
   businessId,websiteId:website.id,generation:website.generation,
   pageId,original,candidate});
 }
 const hasRegressions=checked.some(x=>x.newMeasuredProblems.length>0);
 let allWidthReview=null;
 if(!incomplete.length){
  const plan=planUniversalBuilderRequest({request:"Show our services",
   businessId,businessType:website.businessType||"",
   website,app:null,catalog:[]});
  allWidthReview=reviewSharedBuilderMultiwidthEvidenceV3237({
   businessId,website,plan,pageId,deviceReports:reports});
  if(!allWidthReview.ok)return reject(allWidthReview.reason);
 }
 return {ok:true,kind:"private_design_width_review_v3239",
  businessId,websiteId:website.id,revision:website.generation,pageId,
  candidateId,checked,incomplete,
  complete:incomplete.length===0,hasRegressions,
  eligibleForOwnerReview:!hasRegressions&&allWidthReview?.eligibleForOwnerReview===true,
  allWidthReview,
  summary:hasRegressions?
   "At least one checked screen became worse. Keep your original design.":
   incomplete.length?
    "Compared "+checked.length+" of 3 screen sizes. Check "+
     incomplete.join(", ")+" before claiming a full responsive improvement.":
   allWidthReview?.eligibleForOwnerReview?
    "Measured warnings improved without detected regressions on phone, tablet and desktop. Review the appearance yourself.":
    "No new measured problems at these sizes, but an improvement is not established.",
  ownerMustApprove:true,
  noScreenshotsCaptured:true,measurementsFromLocalWebViewOnly:true,
  mayApply:false,mayPublish:false,mayCharge:false,
  customerJourneyVerified:false,realDeviceAccessibilityVerified:false};
}
export {recordPrivateWebsiteCandidateWidthV3239,
 reviewPrivateWebsiteCandidateWidthsV3239};
