/**
 * V3.171 — combined, action-oriented review of public Business App journeys.
 * Reuses V3.169 goal readiness and V3.170 fixed fictional request scenarios.
 * This tool is read-only and cannot activate paid, public or unavailable flows.
 * Findings are explicit setup actions or finite owner-approved layout previews,
 * never fabricated copy, bookings, service prices or test results.
 */
import {taskReadiness,proposeTaskFirstNavigation} from "./appCustomerTaskDesign.mjs";
import {runCustomerJourneyPractice} from "./appCustomerJourneyPractice.mjs";
import {enabledAppKeys} from "./appSectionOrder.mjs";
const GOALS=["book","enquire","services","photos","offers","rewards"];
const SENSITIVE=/[<>\u0000-\u001f]/;
function reviewCustomerExperience(config,{goal="book"}={}){
 if(!GOALS.includes(goal))return {ok:false,reason:"Choose a supported customer goal."};
 const enabled=enabledAppKeys(config);if(!enabled.ok)return {ok:false,reason:enabled.reason};
 const route=taskReadiness(config,goal);if(!route.ok)return route;
 const practice=runCustomerJourneyPractice(config);if(!practice.ok)return practice;
 const navigation=proposeTaskFirstNavigation(config,goal);
 const important=[],improvements=[];
 const add=(id,priority,title,ownerAction)=>{
  if(!improvements.some(x=>x.id===id)){
   improvements.push({id,priority,title,ownerAction,
    status:"not_applied",requiresOwnerApproval:true,
    canAutoFix:false,notCustomerOutcomeProof:true});
  }
 };
 if(route.needsSeparateFeatureSetup||route.fallbackUsed){
  add("enable_real_module","important","The selected customer task needs a working section",
   route.fallbackUsed?"Enable and verify the tracked Enquiries section. Contact is not a substitute for the full enquiry workflow.":
    "Enable and configure the corresponding Business App module in the existing module editor, then test it.");
  important.push("missing_or_limited_module");
 }
 if(navigation.preview?.ok){
  add("make_task_easier_to_find","recommended","Bring the chosen task closer to the top",
   "Preview BUSY's suggested navigation order, compare with the original and approve only if preferred.");
 }
 const keys=new Set(enabled.keys);
 const list=Array.isArray(config.publicProfile?.services)?config.publicProfile.services:[];
 if((goal==="book"||goal==="services")&&keys.has("services")){
  if(list.length===0){
   add("missing_services","important","Customers need a real services list",
    "Add accurate names and descriptions in the existing private Services editor.");
   important.push("services_missing");
  }else if(list.some(x=>!x||typeof x.name!=="string"||!x.name.trim()||
     typeof x.description!=="string"||!x.description.trim())){
   add("unclear_services","recommended","Clarify service names and descriptions",
    "Review individual services in the existing private Services editor. BUSY must not invent price, availability or terms.");
  }
 }
 if(goal==="photos"&&keys.has("gallery")){
  const photos=Array.isArray(config.publicProfile?.assets?.gallery)?
   config.publicProfile.assets.gallery:[];
  const approved=photos.filter(p=>p?.approved===true||p?.marketingOk===true);
  if(!approved.length){
   add("no_approved_photos","recommended","Add approved photos before showing a gallery",
    "Use the existing gallery editor to add suitable owner-approved photos.");
  }else if(approved.some(p=>!String(p.alt||p.caption||p.description||"").trim())){
   add("photo_accessibility","recommended","Give approved pictures useful descriptions",
    "Add accurate descriptions in the current photo accessibility editor.");
  }
 }
 if(goal==="book"&&keys.has("booking_request")){
  add("confirm_diary_handoff","important","Test the booking confirmation journey",
   "In isolated staging, verify the request, owner decision, diary link and explicit confirmed appointment.");
  important.push("real_booking_test_outstanding");
 }
 if(goal==="enquire"&&keys.has("enquiry")){
  add("verify_enquiry_reply","important","Check enquiry submission and reply delivery",
   "In isolated staging, verify submission, business notification, reply and customer-visible status.");
  important.push("real_enquiry_test_outstanding");
 }
 if(goal==="offers"&&keys.has("offers")){
  add("validate_offer_terms","recommended","Review offer wording, eligibility and dates",
   "Check existing owner-approved offer details. No promotional conditions are invented.");
 }
 if(goal==="rewards"&&keys.has("loyalty")){
  add("verify_loyalty_workflow","important","Verify earning and redeeming a reward",
   "Test the actual owner-controlled stamp and reward journey on real accounts in isolated staging.");
 }
 const severity={important:0,recommended:1};
 improvements.sort((a,b)=>severity[a.priority]-severity[b.priority]);
 const applicable=practice.results.filter(x=>x.task===goal);
 const fictional=goal==="book"||goal==="enquire";
 return {ok:true,kind:"combined_customer_experience_review_v3171",
  goal,taskLabel:route.label,taskStatus:route.status,
  taskEnabled:route.available,readinessWarnings:[...route.blockers,...route.cautions],
  improvements:improvements.slice(0,6),findingCount:improvements.length,
  importantIssueCodes:important,
  navigationPreview:navigation.preview?.ok?navigation.preview:null,
  hasReversibleNavigationSuggestion:!!navigation.preview?.ok,
  practiceCoverage:fictional?{ran:applicable.filter(x=>x.ran).length,
   unavailable:applicable.filter(x=>!x.ran).length,
   passed:applicable.filter(x=>x.passed).length,
   simulatedOnly:true}:null,
  applicableReleaseTests:practice.releaseChecklist.filter(x=>!x.verified)
   .map(x=>({id:x.id,label:x.label,verified:false})),
  verifiedLiveFlow:false,noRealCustomerDataRead:true,
  noGeneratedPublicCopy:true,noChangesPerformed:true,
  noProviderCalls:true,noBookingConfirmed:true,noEnquirySent:true,
  noPublishing:true,finalOwnerControl:true,
  marketplaceStandaloneSameDraft:true};
}
export {reviewCustomerExperience};
