/**
 * V3.236 TWO genuinely different, explainable design review directions for
 * one original website/app draft. NOT screenshot output or executable edits.
 * Reuses universal capability evidence and the existing original editors;
 * owner-locks and manual overrides are never overridden here.
 */
import {reviewUniversalBuilderNextStepV3236}
 from "./sharedBuilderNextStepV3236.mjs";
const limitedList=value=>Array.isArray(value)&&value.length<=70?value:[];
const clean=value=>typeof value==="string"?value.trim():"";
function reviewSharedBuilderDesignDirectionsV3236({
 plan=null,businessId="",website=null,app=null,surface="app"
}={}){
 const baseline=reviewUniversalBuilderNextStepV3236({
  plan,businessId,website,app,surface
 });
 if(!baseline.ok)return baseline;
 const draft=surface==="website"?website:app?.draft_config;
 if(!draft||typeof draft!=="object")
  return {ok:true,kind:"shared_builder_design_options_v3236",
   businessId,surface,source:{...plan.source},
   directions:[],reason:"Open a private draft to compare design directions.",
   privateReviewOnly:true,mayApply:false,noLivePreview:true};
 const requested=limitedList(plan.detectedGoals);
 const task=requested.find(x=>["booking_request","enquiry","contact",
  "services","gallery","catalogue"].includes(x))||"identity";
 // A visual suggestion must not silently activate a module, link to a
 // provider, or override locked/manual choices or site-specific overrides.
 const locked=surface==="website"?
  limitedList(website?.theme?.lockedSections):
  limitedList(app?.draft_config?.presentation?.ownerLockedElements);
 const uniqueLocks=locked.filter(x=>typeof x==="string"&&x.length<80).slice(0,30);
 const layout=surface==="website"?"page sections":"native app screens";
 const firstTarget=task==="booking_request"?"booking-request action":
  task==="enquiry"?"enquiry action":
  task==="gallery"?"approved photo examples":
  task==="services"?"owner-written services":
  task==="catalogue"?"verified product information":
  task==="contact"?"business contact details":"business introduction";
 const base={
  evidence:"private_draft_design_review_only",
  screens:["phone","tablet","desktop"],
  mustPreserveLockedElements:true,mustPreserveBusinessFacts:true,
  respectPlatformNativeLayouts:true,
  noApprovedMediaInvented:true,noBookingsOrPaymentsEnabled:true,
  noVisualScreenshotsCaptured:true,notPerformanceMeasured:true,
  noPublishedChange:true,ownerApprovalBeforeAnyEdit:true
 };
 const directions=[
  {...base,id:"calm_clarity",title:"Make the business clearer",
   reason:"Prioritise trust, readable information and a coherent visual identity.",
   focus:"Clear business introduction, real service details and accessible content.",
   proposals:[
    "Review type hierarchy and readable text contrast",
    "Coordinate whitespace and heading rhythm across "+layout,
    "Keep the approved brand colour and owner-chosen media"
   ],
   decisionTradeoff:"A quieter layout may put the main customer action slightly lower."},
  {...base,id:"task_first",title:"Make the customer task easier",
   reason:"Put the chosen customer goal at the centre without pretending a missing feature works.",
   focus:"Make the "+firstTarget+" easier to discover within existing supported sections.",
   proposals:[
    "Review the first useful action on phone screens",
    "Coordinate navigation order and call-to-action prominence",
    "Preserve actual service availability and the existing customer handoff"
   ],
   decisionTradeoff:"More prominent actions may need tighter supporting content and device checks."}
 ];
 return {ok:true,kind:"shared_builder_design_options_v3236",
  businessId,surface,source:{...plan.source},
  targetTask:task,directions,optionCount:2,
  ownerLocksObserved:uniqueLocks.length,
  ownerLockNamesNotReturned:true,
  chosenByActualScreenshot:false,
  recommendedDirection:null,
  reason:"Compare these two ways of arranging the EXISTING private design; real screenshots and owner approval are still required.",
  noRenderedPreview:true,noOwnerEditsMade:true,
  noLiveCustomerOutcomeVerified:true,mayApply:false,
  mayPublish:false,maySpend:false,maySend:false,
  actualVisualQualityUnknown:true,privateReviewOnly:true};
}
export {reviewSharedBuilderDesignDirectionsV3236};
