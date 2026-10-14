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
 businessType="",description="",catalog=[],publishedModules=[]
}={}){
 const phrase=clean(businessType)+" "+clean(description);
 const matched=rules.find(r=>r.matches.test(phrase));
 const suggestion=matched||{goal:"Help visitors contact your business easily",
   capability:"enquiry"};
 const status=Array.isArray(catalog)?catalog.find(x=>x?.module_key===
   suggestion.capability&&x?.status==="available"):null;
 const isPublished=Array.isArray(publishedModules)&&publishedModules.some(x=>
   x?.key===suggestion.capability&&x?.enabled===true);
 const actual=status&&isPublished;
 return {ok:true,goal:suggestion.goal,capability:suggestion.capability,
   industryRestrictionsApplied:false,unknownIndustryFallback:!matched,
   verifiedAvailableInCurrentBusinessApp:!!actual,
   recommendationOnly:true,requiresOwnerReview:true,
   shouldSuggestStandaloneApp:false,customerRequestCreated:false,
   providerSpendAuthorised:false,noAiCreditsUsed:true,
   explanation:actual?
    "This action appears enabled in the current Business App evidence. BUSY must still verify a published version and real customer outcome.":
    "BUSY can plan this for your business. A working customer feature depends on the actual supported runtime, owner setup and publication."};
}
export {adviseCustomerCapabilityV3216};
