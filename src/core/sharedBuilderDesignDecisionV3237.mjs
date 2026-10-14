/**
 * V3.237: grounded, private cross-builder design decision support.
 * Compares goals using the ORIGINAL universal planner and the V3.236
 * options. It does not render, score aesthetics, mutate drafts or approve.
 */
import {reviewUniversalBuilderNextStepV3236} from "./sharedBuilderNextStepV3236.mjs";
import {reviewSharedBuilderDesignDirectionsV3236} from "./sharedBuilderDesignDirectionsV3236.mjs";

const safeStatus=new Set([
 "present_in_private_draft","supported_section_not_present",
 "available_module_needs_owner_setup","runtime_module_not_verified_available",
 "requires_service_verification","requires_new_implementation",
 "unknown_not_verified"
]);
const taskIds=new Set(["enquiry","booking_request","contact","services",
 "gallery","catalogue","faq","testimonials","offers"]);
const blocked=new Set(["runtime_module_not_verified_available",
 "requires_service_verification","requires_new_implementation",
 "unknown_not_verified"]);
const clean=x=>typeof x==="string"?x.trim():"";
const validHex=x=>/^#[0-9a-fA-F]{6}$/.test(clean(x))?clean(x).toLowerCase():null;
const statusPhrase={
 present_in_private_draft:"is in a private draft, not customer-verified",
 supported_section_not_present:"can use an existing website section after owner setup",
 available_module_needs_owner_setup:"has an app module that still needs owner setup",
 runtime_module_not_verified_available:"is not verified in the current app catalogue",
 requires_service_verification:"requires separate service verification and consent",
 requires_new_implementation:"needs controlled development before it can work",
 unknown_not_verified:"has no verified capability evidence"
};
function reviewSharedBuilderDesignDecisionV3237({
 plan=null,businessId="",website=null,app=null,surface="app"
}={}){
 const base=reviewUniversalBuilderNextStepV3236({
  plan,businessId,website,app,surface
 });
 const design=reviewSharedBuilderDesignDirectionsV3236({
  plan,businessId,website,app,surface
 });
 if(!base.ok||!design.ok)return {
  ok:false,reason:base.reason||design.reason||"Review the current private draft.",
  mayApply:false,mayPublish:false,mayCharge:false,customerOutcomeVerified:false
 };
 const active=surface==="website"?website:app?.draft_config;
 if(!active||design.optionCount!==2)return {
  ok:true,kind:"shared_builder_evidence_decision_v3237",
  businessId,surface,source:{...plan.source},options:[],
  recommendedDirection:null,reason:"Open a private draft before comparing design priorities.",
  ownerApprovalRequired:true,mayApply:false,mayPublish:false,
  noScreenshotEvidence:true,customerOutcomeVerified:false
 };
 const requested=plan.capabilities.filter(c=>c.explicitlyRequested);
 // The original planner validates the business/workspace and caps requests.
 // Repeat the status check before using any potentially transformed evidence.
 if(requested.length>18||requested.some(c=>!c||!safeStatus.has(c.website?.status)||
    !safeStatus.has(c.app?.status)||typeof c.title!=="string"||
    c.title.length>120))
  return {ok:false,reason:"Refresh the current capability evidence.",
   mayApply:false,mayPublish:false,mayCharge:false};
 const critical=requested.filter(c=>taskIds.has(c.id));
 const activeKey=surface;
 const guarded=requested.filter(c=>blocked.has(c[activeKey].status));
 const existing=critical.filter(c=>c[activeKey].status==="present_in_private_draft");
 const incomplete=critical.filter(c=>c[activeKey].status!=="present_in_private_draft");
 const first=critical[0]||requested[0]||null;
 const other=surface==="website"?"app":"website";
 const alignment=[];
 for(const c of requested){
  const here=c[surface].status,there=c[other].status;
  if(here===there)continue;
  alignment.push({
   capabilityId:c.id,feature:c.title,
   websiteStatus:c.website.status,appStatus:c.app.status,
   note:c.title+": website "+statusPhrase[c.website.status]+
    "; Business App "+statusPhrase[c.app.status]+".",
   noCustomerOutcomeClaim:true
  });
 }
 // Only compare two explicit custom hexadecimal tokens. Platform-specific
 // palettes may be intentionally adapted: a difference is not a defect.
 const webAccent=validHex(website?.theme?.primary);
 const appAccent=app?.draft_config?.presentation?.brandPalette==="custom"?
  validHex(app?.draft_config?.presentation?.brandAccent):null;
 const brandEvidence=webAccent&&appAccent?
  {state:webAccent===appAccent?"same_explicit_accent":"distinct_explicit_accents",
   note:webAccent===appAccent?
    "Both drafts explicitly use the same custom brand accent.":
    "The two drafts use different custom accents. Check whether this is an approved native adaptation.",
   valuesOmitted:true}:
  {state:"insufficient_comparable_tokens",
   note:"A matched pair of explicitly chosen colour tokens is not available; visual brand consistency is unverified.",
   valuesOmitted:true};
 const hasReadyTask=existing.length>0;
 const canFeatureTask=hasReadyTask&&guarded.length===0;
 const preferred=canFeatureTask?"task_first":"calm_clarity";
 const options=design.directions.map(d=>{
  const task=d.id==="task_first";
  const reasons=task?[
   canFeatureTask?
    "A requested customer-facing feature is present in the current private draft; its live behaviour still needs a real test.":
    "Do not make an unconfigured, unavailable or unproven customer action look like it already works.",
   "Check the first usable action, navigation and meaningful supporting copy on actual screens."
  ]:[
   "The existing brand information and approved content can be reviewed without activating missing features.",
   "Check heading hierarchy, readability, accessible contrast and the relationship between related sections."
  ];
  return {
   id:d.id,title:d.title,focus:d.focus,tradeoff:d.decisionTradeoff,
   planningPriority:d.id===preferred?"review_first":"alternative",
   why:reasons,
   coordinatedChecks:task?
    ["first-action visibility","navigation order","supporting content","owner permission","cross-device layout"]:
    ["typography hierarchy","spacing consistency","brand continuity","accessible content","cross-device layout"],
   blockers:task?incomplete.slice(0,4).map(c=>c.title+": "+
     statusPhrase[c[surface].status]):[],
   safeToApply:false,scoreNotMeasured:true,requiresScreenshots:true,
   ownerMustApprove:true
  };
 });
 return {
  ok:true,kind:"shared_builder_evidence_decision_v3237",businessId,surface,
  source:{...plan.source},targetTask:first?.id||null,
  recommendedDirection:preferred,
  recommendationIsPlanningPriorityOnly:true,
  reason:canFeatureTask?
   "Review the task-first approach first because the requested action exists in the private draft. Its real outcome remains unverified.":
   "Review the clarity approach first. Customer actions need more setup, provider approval or capability evidence before promotion.",
  options,requestedCount:requested.length,
  privateTaskCandidates:existing.length,unreadyTaskCount:incomplete.length,
  blockedCapabilities:guarded.length,alignment:alignment.slice(0,5),
  alignmentAdditionalCount:Math.max(0,alignment.length-5),
  brandEvidence,ownerLocksObserved:design.ownerLocksObserved,
  lockNamesOmitted:true,ownerOverridesUntouched:true,
  evidenceNeeded:surface==="website"?
   ["Real same-revision phone, tablet and desktop previews",
    "Original versus candidate layout measurements and screenshot review",
    "Owner approval and a separate real customer-task verification"]:
   ["Real same-revision phone and tablet app previews",
    "Native accessibility and task-completion review",
    "Owner approval and a separate real customer-task verification"],
  noScreenshotEvidence:true,noRenderedCandidate:true,
  noVisualWinnerClaim:true,noCustomerOutcomeVerified:true,
  customerOutcomeVerified:false,ownerApprovalRequired:true,
  mayApply:false,mayPublish:false,mayCharge:false,mayContactCustomer:false,
  noCrossBusinessSharing:true
 };
}
export {reviewSharedBuilderDesignDecisionV3237};