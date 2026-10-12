/**
 * V3.174 — owner-controlled, cross-builder improvement preparation.
 *
 * Uses finite, prewritten owner tasks and existing private review engines.
 * Does NOT propose automatic business-copy rewrites, infer preferences from
 * customers, save a draft, publish, access other tenants or spend credits.
 * A group can be acted on only through the existing editor with current-
 * revision guards and explicit owner approval.
 */
import {reviewBusinessInformation} from "./businessInfoClarity.mjs";
import {reviewSharedCustomerGoal} from "./sharedCustomerExperience.mjs";
import {compareAppGoalCandidate} from "./designEvidencePriorities.mjs";
import {proposeTaskFirstNavigation} from "./appCustomerTaskDesign.mjs";
const GOALS=["book","enquire","services","photos","offers","rewards"];
function prepareOwnerImprovementPlan({
 goal="enquire",websiteDraft=null,brandBrain={},appConfig=null,
 scope=null,appRevision=0,websiteRevision=0
}={}){
 if(!GOALS.includes(goal))return {ok:false,reason:"Choose one customer goal."};
 const website=websiteDraft&&Array.isArray(websiteDraft.sections);
 const app=appConfig&&Array.isArray(appConfig.modules);
 if(!website&&!app)return {ok:false,reason:"A current private draft is required."};
 if(website&&(!Number.isSafeInteger(websiteRevision)||websiteRevision<1||
   websiteRevision!==websiteDraft.generation))
  return {ok:false,reason:"The website draft changed. Review the newest private revision."};
 if(app&&(!Number.isSafeInteger(appRevision)||appRevision<1))
  return {ok:false,reason:"The current app draft revision is required."};
 const shared=reviewSharedCustomerGoal({
  goal,websiteDraft,brandBrain,appConfig,scope});
 if(!shared.ok)return shared;
 const clarity=reviewBusinessInformation({websiteDraft,brandBrain,appConfig,scope});
 if(!clarity.ok)return clarity;
 const options=[],seen=new Set();
 function add(id,surface,priority,title,reason,nextAction,proof){
  if(seen.has(id))return;
  seen.add(id);
  options.push({id,surface,priority,title,reason,nextAction,
   evidence:proof,requiresOwnerReview:true,automaticallyApplied:false,
   costOrPublishingAuthorized:false});
 }
 if(clarity.importantCount){
  add("fix_approved_facts",website&&app?"both":website?"website":"app",
   0,"Make business details clear",
   "The current private draft has missing essential business or service details.",
   "Review the flagged fields in your existing private service/identity editors.",
   "deterministic_content_audit");
 }
 const operational=shared.findings.filter(f=>f.priority==="important"&&
  f.kind==="unverified_customer_action");
 if(operational.length||["book","enquire"].includes(goal)){
  add("verify_customer_path",website&&app?"both":website?"website":"app",
   1,"Check that customers can actually complete this task",
   "A visible button and offline scenario test are not proof of delivery.",
   "Use isolated staging with separate permission and authoritative receipts.",
   "operational_workflow_unverified");
 }
 if(app){
  const proposed=proposeTaskFirstNavigation(appConfig,goal);
  if(proposed.preview?.ok){
   const compared=compareAppGoalCandidate({before:appConfig,
    after:proposed.preview.nextConfig,goal});
   if(compared.ok){
    add("review_navigation_layout","app",2,"Compare a clearer route through the app",
     "BUSY predicts the requested section may be easier to find in navigation.",
     "Compare original and proposed versions, then use existing owner approval/Undo.",
     "static_three_width_preflight_not_real_device");
   }
  }
 }
 for(const finding of clarity.issues.filter(f=>f.priority==="review").slice(0,2)){
  const identifier=finding.id==="missing_service_description"?
   "clarify_service_descriptions":
   ["different_service_counts","different_service_sets",
    "different_business_names"].includes(finding.id)?
   "check_surface_consistency":"review_business_content";
  add(identifier,finding.surface,3,
   "Review the wording and presentation",
   "Some existing information could benefit from an owner clarity check.",
   "Edit approved content in the appropriate private builder.",
   "finite_content_rules");
 }
 if(website){
  add("inspect_real_widths","website",4,
   "Check phone, tablet and desktop previews",
   "An attractive design at one width may not work as well at another.",
   "Measure the current revision and inspect the hosted preview on real devices.",
   "requires_current_revision_dom_and_device");
 }
 const sorted=options.sort((a,b)=>a.priority-b.priority||
  a.id.localeCompare(b.id));
 const coordinated=sorted.slice(0,3);
 return {ok:true,kind:"coordinated_owner_improvement_plan_v3174",
  goal,websitePresent:!!website,appPresent:!!app,
  actions:coordinated,deferredCount:Math.max(0,sorted.length-coordinated.length),
  priorityCount:sorted.length,maxActions:3,
  revisionBound:true,ownerMustApprove:true,
  preserveCurrentOriginal:true,undoViaExistingEditor:true,
  stepsHaveIndependentReasons:true,
  noBusinessCopyInvented:true,noCustomerPrivateDataReturned:true,
  noCrossBusinessLearning:true,
  noAutomaticSave:true,noAutomaticPublishing:true,
  noAutomaticSpending:true,noMessagesSent:true,
  commercialBenefitNotProven:true};
}
export {prepareOwnerImprovementPlan};
