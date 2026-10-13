/**
 * V3.198: explainable industry-aware customer journeys, grounded in real
 * enabled Business App modules. Never enables features or promises a working
 * booking, quote, offer, menu or customer outcome solely from a business type.
 */
const REGIMES=Object.freeze({
 appointment:{pattern:/hair|salon|barber|beauty|nail|therap|clinic|massage|tutor|appointment/,
  priority:["booking_request","services","contact"],
  need:"Make it straightforward for customers to request a suitable appointment."},
 trade:{pattern:/plumb|electric|repair|mechanic|builder|clean|contractor|garden|trade/,
  priority:["enquiry","services","booking_request","contact"],
  need:"Make it easy for customers to describe the work they need."},
 food:{pattern:/food|restaurant|cafe|café|takeaway|bakery|cater|festival|stall|roast/,
  priority:["offers","services","enquiry"],
  need:"Make approved products and ways to contact the business easy to find."},
 general:{priority:["services","contact","enquiry"],
  need:"Help customers find the services and the right way to contact the business."}
});
const FACTS=Object.freeze({
 booking_request:{action:"Request a booking",why:"Booking requests are easier to find when they appear early.",caution:"A request is not an accepted appointment or verified calendar availability."},
 enquiry:{action:"Send an enquiry",why:"An enquiry route lets customers explain what they need.",caution:"Sending and handling enquiries must be verified end to end."},
 services:{action:"Explore services",why:"Owner-approved services give customers a clear starting point.",caution:"Services must be checked for completeness; this is not proof of ordering or a menu."},
 offers:{action:"View offers",why:"Current owner-approved offers can be prominent for returning customers.",caution:"Offer terms, expiry and actual redemption need separate verification."},
 contact:{action:"Get in touch",why:"An accessible contact route reduces hunting through pages.",caution:"A contact section is not proof of a tracked enquiry or response."}
});
function industryOf(type=""){
 const t=typeof type==="string"&&type.length<=140?type.toLowerCase():"";
 return Object.keys(REGIMES).find(k=>k!=="general"&&REGIMES[k].pattern.test(t))||"general";
}
function suggestAppCustomerJourney({businessType="",appConfig=null}={}){
 const industry=industryOf(businessType),regime=REGIMES[industry];
 const valid=appConfig&&typeof appConfig==="object"&&!Array.isArray(appConfig)&&
  Array.isArray(appConfig.modules)&&appConfig.modules.length<=40;
 const enabled=valid?new Set(appConfig.modules.filter(x=>
  x&&typeof x==="object"&&x.enabled===true&&
  typeof x.key==="string").map(x=>x.key)):new Set();
 const primary=regime.priority.find(key=>enabled.has(key))||null;
 const fact=primary?FACTS[primary]:null;
 return {ok:true,kind:"industry_app_journey_v3198",industry,
  customerNeed:regime.need,primaryModule:primary,
  primaryAction:fact?.action||null,
  explanation:fact?.why||"Prepare the app's customer journey after reviewing the enabled modules.",
  cautions:fact?[fact.caution]:["No supported customer-action module has been verified as enabled."],
  availableInDraft:!!fact,requiresFeatureSetup:!fact,
  canReorderExistingNavigation:!!fact,
  ownerApprovalRequired:true,noAutomaticFeatureActivation:true,
  noProofOfRealCustomerOutcome:true,noAutomaticPublish:true};
}
export {industryOf,suggestAppCustomerJourney};
