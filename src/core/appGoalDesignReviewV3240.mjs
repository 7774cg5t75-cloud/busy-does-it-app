/**
 * V3.240 — evidence-labelled, cross-builder Business App design decisions.
 * Reuses the original public-only responsive planner, task readiness, private
 * finite Studio and Business Brand DNA. NO screenshot inference or execution.
 */
import {evaluateResponsiveApp,recommendResponsiveDesign}
 from "./appResponsiveDesign.mjs";
import {taskReadiness} from "./appCustomerTaskDesign.mjs";
import {prepareAppVisualBatch} from "./appVisualComparison.mjs";
import {buildBusinessBrandDnaSnapshot} from "./businessBrandDnaV3195.mjs";
import {enabledAppKeys} from "./appSectionOrder.mjs";
const UUID=/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const GOALS=new Set(["book","enquire","services","photos","offers","rewards"]);
const fail=reason=>({ok:false,reason,maySave:false,mayPublish:false,
 realDeviceVerified:false,actualCustomerOutcome:false});
function reviewAppGoalDesignV3240({
 businessId="",app=null,website=null,goal="services"
}={}){
 if(!UUID.test(businessId)||!UUID.test(app?.id||"")||
  app?.business_id!==businessId||
  !Number.isSafeInteger(app.draft_revision)||app.draft_revision<1||
  !GOALS.has(goal)||!app.draft_config||
  !enabledAppKeys(app.draft_config).ok)
  return fail("Open the current private Business App in this business workspace.");
 const config=app.draft_config;
 const task=taskReadiness(config,goal);
 const guidance=recommendResponsiveDesign(config);
 const before=evaluateResponsiveApp(config);
 if(!task.ok||!guidance.ok||!before.ok)
  return fail("Current customer action or responsive design is not ready for review.");
 const suggested=guidance.suggestions.slice(0,3).map(x=>({
  kind:"appearance",field:x.field,value:x.value}));
 let batch=null,after=null;
 if(suggested.length){
  batch=prepareAppVisualBatch(config,suggested);
  if(!batch.ok)return fail("Supported design alternatives need review.");
  after=evaluateResponsiveApp(batch.nextConfig);
  if(!after.ok)return fail("The proposed design could not be checked across screen sizes.");
 }
 const original=before.profiles.map((p,i)=>{
  const alternative=after?.profiles[i]||null;
  const oldFlags=p.warnings.map(w=>w.key);
  const newFlags=alternative?.warnings.map(w=>w.key)||[];
  return {id:p.id,logicalWidth:p.assumedContentWidth,
   beforeNavigation:p.layout.navigation,
   afterNavigation:alternative?.layout.navigation||p.layout.navigation,
   beforeGalleryColumns:p.layout.galleryColumns,
   afterGalleryColumns:alternative?.layout.galleryColumns??p.layout.galleryColumns,
   newStaticAdvisories:newFlags.filter(k=>!oldFlags.includes(k)),
   resolvedStaticAdvisories:oldFlags.filter(k=>!newFlags.includes(k)),
   realScreenshotMeasured:false};
 });
 const hasNewAdvisories=original.some(x=>x.newStaticAdvisories.length>0);
 // The existing brand snapshot is valid ONLY if the two private drafts are
 // scoped to this same tenant. Never return actual company copy, colours,
 // media links or private owner feedback in this explainability report.
 const snapshot=website?buildBusinessBrandDnaSnapshot({
  businessId,website,app}):null;
 const brand=snapshot?.ok?{
  status:snapshot.conflicts.length?"owner_review_needed":"shared_identity_available",
  conflictCount:snapshot.conflicts.length,
  websiteRevision:website.generation,
  note:snapshot.conflicts.length?
   "The website and app have brand choices worth comparing. Do not replace either without the owner's decision.":
   "The current private builders provide a shared Brand DNA reference; this does not prove visual consistency on devices."}:
  {status:website?"pair_not_verified":"website_draft_not_supplied",
   conflictCount:null,websiteRevision:null,
   note:website?"The website and app could not be verified as a current same-business pair.":
    "A current website draft can help BUSY preserve the same brand across both builders."};
 const blocked=task.status==="setup_needed"||
  task.status==="limited_fallback_unverified";
 const operations=batch?.operations||[];
 const recommendation=blocked?
  "Make the requested customer action genuinely available and testable before making it prominent.":
  hasNewAdvisories?
   "Compare the proposed design carefully: a static screen-width advisory was introduced.":
  operations.length?
   "Review the coordinated layout alternative. It is a static prediction, not a demonstrated visual improvement.":
   "The existing responsive rules found no supported design change worth proposing.";
 return {ok:true,kind:"private_app_goal_design_review_v3240",
  businessId,source:{appId:app.id,revision:app.draft_revision,
   websiteId:snapshot?.ok?website.id:null,
   websiteRevision:snapshot?.ok?website.generation:null},
  goal,task:{status:task.status,module:task.targetModule||null,
   position:task.sectionPosition,cautionCount:task.cautions.length,
   actionVerified:false,needsSetup:blocked},
  brand,comparison:original,
  operations:operations.map(x=>({...x})),
  proposedChangeCount:operations.length,
  potentialNewStaticAdvisories:hasNewAdvisories,
  onlyExistingSupportedFields:true,
  protectedCustomerContent:true,
  visualTradeoffs:guidance.suggestions.slice(0,3).map(x=>({
   field:x.field,why:x.reason,tradeoff:x.tradeoff})),
  recommendation,ownerApprovalRequired:true,
  planningOnly:true,noNativeScreenshots:true,noWebsiteScreenshots:true,
  simulatedLogicalWidths:true,realDeviceVerified:false,
  actualCustomerOutcome:false,customerBookingConfirmed:false,
  brandChoicesNotApplied:true,noCustomerDataRead:true,
  maySave:false,mayPublish:false,mayCharge:false,
  noCrossBusinessLearning:true};
}
export {reviewAppGoalDesignV3240};
