import {inspectCapabilityIntent} from './universalBuilderPlanV3210.mjs';
/**
 * V3.216 — deterministic, industry-neutral Business Brain suggestions.
 * Advisory only; no automatic provider work, new app module, spend or publish.
 * Suggestions never assert a planned runtime is already enabled.
 */
const clean=x=>typeof x==="string"?x.trim().toLowerCase().slice(0,250):"";
const rules=[
 {matches:/restaurant|cafe|café|salon|barber|beauty|hotel|accommodation|therap|coach|appointment/,
  goal:"Help customers request an appointment or table",
  capability:"booking_request"},
 {matches:/plumb|electric|build|roof|landscap|repair|trade|contractor|clean/,
  goal:"Help customers send a job enquiry or quote request",
  capability:"enquiry"},
 {matches:/shop|store|retail|product|commerce|online sale|maker/,
  goal:"Let customers browse a clear product or service catalogue",
  capability:"catalogue"},
 {matches:/event|festival|venue|hire|rental/,
  goal:"Help visitors enquire about dates, availability and services",
  capability:"enquiry"}
];
function adviseCustomerCapabilityV3216({
 businessType="",description="",catalog=[],publishedModules=[],
 businessId="",app=null,liveVersion=null
}={}){
 const goalText=clean(description);
 const industryText=clean(businessType);
 // The owner's stated task takes precedence over an industry stereotype.
 // Negated actions must NOT be offered merely because the industry commonly
 // uses them. These are local, low-cost heuristics, never AI outcome proof.
 const explicit=[
  {goal:"Help customers send an enquiry or ask for a quote",capability:"enquiry"},
  {goal:"Help customers request an appointment or reservation",capability:"booking_request"},
  {goal:"Help customers browse a product or service catalogue",capability:"catalogue"}
 ];
 const intent=inspectCapabilityIntent(goalText);
 const declined=new Set(intent.declined),positive=new Set(intent.requested);
 const bookingRejected=declined.has('booking_request');
 const conflict=intent.conflicts.length>0;
 const requested=explicit.find(x=>positive.has(x.capability)&&!declined.has(x.capability));
 const industry=rules.find(r=>r.matches.test(industryText+" "+goalText)&&!declined.has(r.capability));
 const matched=requested||industry;
 const needsClarification=conflict||!matched&&declined.has('enquiry');
 const suggestion=needsClarification?{goal:"Clarify which customer action you want to support",capability:null}:
  matched||{goal:"Help visitors contact your business easily",capability:"enquiry"};
 const evidenceSource=needsClarification?'owner_clarification_required':requested?"stated_business_goal":
   industry?"industry_hint":"universal_fallback";
 const status=Array.isArray(catalog)?catalog.find(x=>x?.module_key===
   suggestion.capability&&x?.status==="available"):null;
 const isPublished=Array.isArray(liveVersion?.config?.modules)&&liveVersion.config.modules.some(x=>
   x?.key===suggestion.capability&&x?.enabled===true);
 // A catalogue entry or client-side draft is not a live deployment proof.
 // Verify the exact published immutable app/version pair and owner scope.
 const uuid=/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
 const liveBound=uuid.test(businessId)&&uuid.test(app?.id)&&uuid.test(liveVersion?.id)&&
   app.business_id===businessId&&
   ["live","update_pending"].includes(app.status)&&
   app.current_live_version_id===liveVersion.id&&
   liveVersion.mini_app_id===app.id&&liveVersion.state==="live";
 const actual=!needsClarification&&status&&isPublished&&liveBound;
 return {ok:true,goal:suggestion.goal,capability:suggestion.capability,
   industryRestrictionsApplied:false,unknownIndustryFallback:!matched,
   suggestionEvidenceSource:evidenceSource,explicitlyDeclinedBookings:bookingRejected,
   needsClarification,declinedCapabilities:[...declined],multipleGoalsRecognised:positive.size>1,
   verifiedAvailableInCurrentBusinessApp:!!actual,
   recommendationOnly:true,requiresOwnerReview:true,
   shouldSuggestStandaloneApp:false,customerRequestCreated:false,
   providerSpendAuthorised:false,noAiCreditsUsed:true,
   explanation:actual?
    "This action appears enabled in the current Business App evidence. BUSY must still verify a published version and real customer outcome.":
    "BUSY can plan this for your business. A working customer feature depends on the actual supported runtime, owner setup and publication."};
}
export {adviseCustomerCapabilityV3216};
