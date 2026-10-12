/**
 * V3.168 — industry-aware, owner-controlled Business App design review.
 *
 * Selected business type is an EXPLICIT, local preview choice, never inferred
 * from a person's data and never persisted or sent to public app customers.
 * Only supported appearance changes can be proposed. Booking/enquiry features
 * are described as existing capability boundaries, NOT activated by this file.
 *
 * Simulated widths are layout-rule checks (not screenshots, physical-device QA,
 * pixel comparisons, accessibility certification or conversion testing).
 */
import {OPTIONS,DEFAULTS} from "./appAppearanceEditing.mjs";
import {enabledAppKeys} from "./appSectionOrder.mjs";
import {prepareOwnerAwareDesignExperiments} from "./appDesignPatterns.mjs";
import {evaluateResponsiveApp} from "./appResponsiveDesign.mjs";
import {auditBusinessAppUsability} from "./appUsabilityAudit.mjs";

const INDUSTRY_PROFILES=Object.freeze([
  Object.freeze({id:"general",label:"Let Busy review",description:"Use measured findings, review suggestions and your own preferences."}),
  Object.freeze({id:"appointments",label:"Appointments",description:"Make services and booking requests easier to find."}),
  Object.freeze({id:"trades",label:"Trades & services",description:"Keep service information and enquiries straightforward."}),
  Object.freeze({id:"food_events",label:"Food & events",description:"Give images and concise customer information space."}),
  Object.freeze({id:"retail",label:"Retail",description:"Balance product images with clear ways to enquire."})
]);
const PROFILE_BY_ID=new Map(INDUSTRY_PROFILES.map(p=>[p.id,p]));
const has=(obj,key)=>Object.prototype.hasOwnProperty.call(obj,key);
const valid=(field,value)=>has(OPTIONS,field)&&OPTIONS[field].includes(value);
const finiteList=(x,max)=>Array.isArray(x)&&x.length<=max;
const selectedKeys=config=>new Set(config.modules.filter(m=>m?.enabled===true).map(m=>m.key));

function appCustomerJourneyChecks(config){
 const keys=selectedKeys(config);
 const hasBookings=keys.has("booking_request"),hasEnquiries=keys.has("enquiry"),
  hasContact=keys.has("contact"),hasServices=keys.has("services");
 const services=Array.isArray(config.publicProfile?.services)?
  config.publicProfile.services:[];
 const steps=[];
 if(hasBookings)steps.push({id:"booking",label:"Booking request",status:"owner_confirmation_required",
  detail:"Customers can request an appointment; the owner must confirm the actual diary booking."});
 else steps.push({id:"booking",label:"Booking request",status:"not_enabled",
  detail:"Booking requests are not enabled in this draft."});
 if(hasEnquiries)steps.push({id:"enquiry",label:"Enquiries",status:"needs_end_to_end_test",
  detail:"Test real submission, business follow-up and customer status before release."});
 else if(hasContact)steps.push({id:"contact",label:"Contact",status:"needs_end_to_end_test",
  detail:"A contact route is present; confirm it reaches the business on real devices."});
 else steps.push({id:"contact",label:"Customer contact",status:"missing",
  detail:"Enable and test a supported customer contact or booking route before release."});
 if(hasServices)steps.push({id:"services",label:"Services",status:services.length?
   "content_present_unverified":"content_missing",detail:services.length?
    "Check the owner-approved service details shown in the customer preview.":
    "Add accurate, owner-approved services in the private editor."});
 return {steps,enabledModules:[...keys].filter(k=>[
  "services","gallery","contact","enquiry","booking_request","offers","loyalty"].includes(k)),
  marketplaceAndStandaloneShareDraft:true,
  doesNotConfirmBookings:true,doesNotSendEnquiries:true,
  integrationTestsStillNeeded:true,doesNotEnableModules:true,
  doesNotPromiseAppStoreAcceptance:true};
}
function suggestionsForIndustry(config,industry){
 const enabled=selectedKeys(config),p={...DEFAULTS,...config.presentation};
 const n=enabled.size,choices=[];
 const add=(field,value,reason,tradeoff)=>{
  if(valid(field,value)&&p[field]!==value&&
     !choices.some(item=>item.field===field))
    choices.push({field,value,reason,tradeoff,kind:"industry_hypothesis"});
 };
 if(industry==="appointments"){
  if(n>=4)add("navigationStyle","list",
   "Help customers scan several booking-related sections.",
   "A list takes more room than tabs.");
  if(enabled.has("services"))add("layoutDensity","comfortable",
   "Give service choices sufficient separation.",
   "Comfortable cards mean more scrolling.");
  add("headerStyle","refined","Give the booking journey a restrained heading.",
   "A quieter heading can feel less promotional.");
 }else if(industry==="trades"){
  if(n>=4)add("navigationStyle","list",
   "Make service and contact sections easy to locate.",
   "List navigation uses vertical space.");
  if(enabled.has("gallery"))add("galleryLayout","stack",
   "Allow customers to inspect examples of previous work one at a time.",
   "Single-column photos mean longer scrolling.");
  add("headerStyle","refined","Keep the first screen focused on services.",
   "A restrained heading may be less visually dramatic.");
 }else if(industry==="food_events"){
  add("headerStyle","bold","Give the food or event identity stronger prominence.",
   "Bold headings may compete with photographs.");
  if(enabled.has("gallery"))add("imageScale","large",
   "Give approved product and event photos more prominence.",
   "Large images occupy more space on small phones.");
  if(enabled.has("gallery"))add("galleryLayout","grid",
   "Compare a compact overview of food and event photographs.",
   "Grids may show less detail in each image.");
 }else if(industry==="retail"){
  if(enabled.has("gallery"))add("galleryLayout","grid",
   "Help visitors scan several approved product photos.",
   "Smaller thumbnails can make detail harder to inspect.");
  add("layoutDensity","airy","Compare extra spacing around information.",
   "Airy layouts mean more scrolling.");
  add("headerStyle","bold","Try a clearer visual introduction.",
   "A strong heading uses more visual attention.");
 }
 return choices.slice(0,3);
}
const flagKeys=report=>report.ok?report.profiles.flatMap(p=>
 p.warnings.map(w=>p.id+":"+w.key)):[];
function compareWidthRules(before,after){
 if(!before?.ok||!after?.ok)return {ok:false,reason:"Width review unavailable."};
 const oldKeys=new Set(flagKeys(before)),newKeys=new Set(flagKeys(after));
 return {ok:true,kind:"static_three_width_preflight_v3168",
  widths:[320,390,820],
  beforeWarnings:oldKeys.size,afterWarnings:newKeys.size,
  addedWarnings:[...newKeys].filter(k=>!oldKeys.has(k)),
  removedWarnings:[...oldKeys].filter(k=>!newKeys.has(k)),
  needsManualReview:true,simulatedLayoutRulesOnly:true,
  actualScreenCapturesCompared:false,visualQualityImprovementProven:false,
  realPhoneAndTabletTestingRequired:true,accessibilityCertified:false};
}
function prepareIndustryAwareAppReview(config,{
 industry="general",history=[],measured=[],ai=[],responsive=[]
}={}){
 if(!PROFILE_BY_ID.has(industry)||!config||!finiteList(config.modules,24)||
    !finiteList(history,80)||![measured,ai,responsive].every(x=>finiteList(x,12)))
  return {ok:false,reason:"Choose a supported business type and a bounded private design review."};
 const navigation=enabledAppKeys(config);
 if(!navigation.ok)return {ok:false,reason:navigation.reason};
 const hints=suggestionsForIndustry(config,industry);
 // The existing owner-preference engine suppresses disliked settings and
 // protects styles currently preferred by the owner. Industry is LOW-priority
 // context, never a substitute for direct rendered measurements.
 const mergedResponsive=[...responsive,...hints.map(h=>({
   field:h.field,value:h.value
 }))].filter((row,index,array)=>index===array.findIndex(other=>
   other?.field===row?.field&&other?.value===row?.value)).slice(0,12);
 const experiment=prepareOwnerAwareDesignExperiments(config,{
  history,measured,ai,responsive:mergedResponsive});
 if(!experiment.ok)return experiment;
 const current=evaluateResponsiveApp(config);
 const candidate=experiment.preview?.ok?
  evaluateResponsiveApp(experiment.preview.nextConfig):null;
 const widthReview=candidate?compareWidthRules(current,candidate):null;
 const review=auditBusinessAppUsability(config);
 const explanations=experiment.reasoning.map(r=>{
  const hint=hints.find(h=>h.field===r.field&&h.value===r.value);
  return {...r,industryContext:hint?hint.reason:null,
   industryTradeoff:hint?hint.tradeoff:null,
   scoreIsNotOutcomeProof:true};
 });
 return {...experiment,ok:true,kind:"industry_aware_private_app_review_v3168",
  profile:PROFILE_BY_ID.get(industry),explicitBusinessType:industry,
  industryHintsConsidered:hints.length,
  industryHints:hints,reasoning:explanations,
  widthReview,customerJourney:appCustomerJourneyChecks(config),
  releaseIssues:review.ok?review.issues.filter(x=>x.severity==="important")
   .map(x=>({id:x.id,message:x.message})):[],
  needsOwnerApproval:true,proposedPrivateOnly:true,
  oneBusinessFeedbackOnly:true,noIndustryInferredFromPrivateData:true,
  noAutoBooking:true,noAutoPublish:true,noAutomaticBilling:true,
  noModelRetraining:true,noCommercialOutcomeProof:true,
  noPixelInspection:true,standaloneReleaseNotPerformed:true};
}
export {INDUSTRY_PROFILES,suggestionsForIndustry,
 appCustomerJourneyChecks,compareWidthRules,prepareIndustryAwareAppReview};
