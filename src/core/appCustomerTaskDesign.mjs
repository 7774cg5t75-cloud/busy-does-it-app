/**
 * V3.169 — task-first Business App journey design.
 * This planner reads ONLY the already-owner-approved public app configuration,
 * never requests/identifies customers, never enables modules or makes bookings.
 *
 * Navigation positions are static proxies for discoverability, not measured
 * taps, tested task success, confirmed bookings or commercial outcomes.
 * Every suggested edit is composed through the existing private coordinated
 * editor and still requires approval, can be undone, and is not published.
 */
import {enabledAppKeys} from "./appSectionOrder.mjs";
import {proposeCoordinatedAppChanges} from "./appCoordinatedStudio.mjs";
import {auditBusinessAppUsability} from "./appUsabilityAudit.mjs";
import {evaluateResponsiveApp} from "./appResponsiveDesign.mjs";

const TASKS=Object.freeze([
 Object.freeze({id:"book",label:"Request a booking",
   target:"booking_request",alternates:[],
   summary:"Customers request an appointment; only a separately confirmed diary booking is confirmed."}),
 Object.freeze({id:"enquire",label:"Send an enquiry",
   target:"enquiry",alternates:["contact"],
   summary:"A customer enquiry needs actual submission and owner follow-up tests; Contact is not a verified enquiry inbox."}),
 Object.freeze({id:"services",label:"Find my services",
   target:"services",alternates:[],
   summary:"Public service information must be owner-approved, complete and accurate."}),
 Object.freeze({id:"photos",label:"See my work or products",
   target:"gallery",alternates:[],
   summary:"Customers can see only the approved photos already included in their app."}),
 Object.freeze({id:"offers",label:"See offers",
   target:"offers",alternates:[],
   summary:"Offers must have accurate owner-approved terms and dates."}),
 Object.freeze({id:"rewards",label:"View loyalty rewards",
   target:"loyalty",alternates:[],
   summary:"A visible loyalty section does not prove live earning or redemption."})
]);
const taskById=new Map(TASKS.map(x=>[x.id,x]));
const labelOf=Object.freeze({
 business_profile:"About",services:"Services",gallery:"Photos",
 contact:"Contact",enquiry:"Enquiries",booking_request:"Booking requests",
 offers:"Offers",loyalty:"Loyalty"
});
const cleanList=(v,max)=>Array.isArray(v)?v.slice(0,max):[];
function taskReadiness(config,taskId){
 const task=taskById.get(taskId);
 const result=enabledAppKeys(config);
 if(!task||!result.ok)return {ok:false,reason:!task?
  "Choose a supported customer action.":result.reason};
 const enabled=result.keys;
 const module=enabled.includes(task.target)?task.target:
  (task.alternates.find(k=>enabled.includes(k))||null);
 const position=module?enabled.indexOf(module):-1;
 const ownerProfile=config.publicProfile||{},assets=ownerProfile.assets||{};
 const blockers=[],cautions=[];
 if(!module)blockers.push("This customer action is not enabled in the private draft. Enable and configure it separately before it can be used.");
 if(taskId==="book"){
  cautions.push("Submitting a booking request does not confirm a date, availability or a diary appointment.");
  if(!enabled.includes("services"))
   cautions.push("A Services section is not enabled. Confirm customers can understand what they are requesting.");
 }
 if(taskId==="enquire"){
  cautions.push("Submission, owner response and customer status still need live end-to-end verification.");
  if(module==="contact")cautions.push("Only Contact is enabled: this is not proof of a tracked enquiry workflow.");
 }
 if(taskId==="services"||taskId==="book"){
  if(enabled.includes("services")){
   const services=cleanList(ownerProfile.services,40);
   if(!services.length||services.some(s=>typeof s?.name!=="string"||!s.name.trim()))
    cautions.push("Review missing or unnamed service information before publishing.");
  }
 }
 if(taskId==="photos"&&module==="gallery"){
  const images=cleanList(assets.gallery,40);
  const approved=images.filter(i=>i?.approved===true||i?.marketingOk===true);
  if(!approved.length)cautions.push("No owner-approved gallery images were found; add suitable images before release.");
  else if(approved.some(i=>!String(i?.alt||i?.caption||i?.description||"").trim()))
   cautions.push("Some approved images need useful descriptions for accessibility review.");
 }
 if(taskId==="offers"&&module==="offers")
  cautions.push("Review the exact offer details and dates; enablement does not prove a valid promotion.");
 if(taskId==="rewards"&&module==="loyalty")
  cautions.push("Actual loyalty stamps and redemption must be tested using the real connected workflow.");
 const audit=auditBusinessAppUsability(config);
 const important=audit.ok?audit.issues.filter(x=>x.severity==="important")
   .map(x=>x.id):[];
 const labels=enabled.map(k=>labelOf[k]||k.replaceAll("_"," "));
 return {ok:true,kind:"customer_task_readiness_v3169",
  taskId,label:task.label,summary:task.summary,
  targetModule:module,primaryModule:task.target,
  fallbackUsed:module!==null&&module!==task.target,
  available:!!module,needsSeparateFeatureSetup:!module,
  sectionPosition:position<0?null:position+1,
  navigationLabels:labels,
  blockers,cautions,importantReleaseChecks:important,
  status:!module?"setup_needed":module!==task.target?
   "limited_fallback_unverified":"available_not_end_to_end_verified",
  notCustomerTesting:true,noAutomaticBooking:true,noCustomerRecordsRead:true,
  noNewFeatureActivated:true,noProofOfConversion:true};
}
function compareStaticJourney(before,after,taskId){
 const a=taskReadiness(before,taskId),b=taskReadiness(after,taskId);
 if(!a.ok||!b.ok)return {ok:false,reason:"Comparable app journeys are required."};
 const sameCapability=a.targetModule===b.targetModule&&
  a.available===b.available&&a.status===b.status;
 return {ok:true,taskId,section:a.targetModule,
  beforePosition:a.sectionPosition,afterPosition:b.sectionPosition,
  earlierInNavigation:a.sectionPosition!==null&&
   b.sectionPosition!==null&&b.sectionPosition<a.sectionPosition,
  capabilityUnchanged:sameCapability,
  outcomeImprovementProven:false,estimatedNavigationOnly:true,
  screenshotsCompared:false,realUsersTested:false};
}
function proposeTaskFirstNavigation(config,taskId){
 const readiness=taskReadiness(config,taskId);
 if(!readiness.ok)return readiness;
 const order=enabledAppKeys(config).keys;
 if(!readiness.available)return {ok:true,kind:"customer_task_nav_preview_v3169",
  task:readiness,preview:null,blocked:true,
  reason:"No supported section is enabled for this goal. Nothing was changed.",
  ownerApprovalRequired:true,mayPublish:false};
 const target=readiness.targetModule;
 // Keep public business identity first if it already occupies the first slot;
 // owner-selected target is placed directly after it, without hiding anything.
 const slot=order[0]==="business_profile"&&target!=="business_profile"?1:0;
 const old=order.indexOf(target);
 if(old<=slot)return {ok:true,kind:"customer_task_nav_preview_v3169",
   task:readiness,preview:null,blocked:false,
   reason:"This action is already prominent in the current navigation.",
   ownerApprovalRequired:true,mayPublish:false};
 const proposed=[...order];proposed.splice(old,1);proposed.splice(slot,0,target);
 const plan=proposeCoordinatedAppChanges(config,[{kind:"navigation",value:proposed}]);
 if(!plan.ok)return {ok:false,reason:plan.reason};
 const comparison=compareStaticJourney(config,plan.nextConfig,taskId);
 const responsiveBefore=evaluateResponsiveApp(config);
 const responsiveAfter=evaluateResponsiveApp(plan.nextConfig);
 const changedWidthRules=responsiveBefore.ok&&responsiveAfter.ok?
  responsiveBefore.profiles.map((row,i)=>({
   id:row.id,logicalWidth:row.assumedContentWidth,
   navigationBefore:row.layout.navigation,
   navigationAfter:responsiveAfter.profiles[i].layout.navigation,
   noPixelOrTouchTesting:true
  })):[];
 return {ok:true,kind:"customer_task_nav_preview_v3169",
  task:readiness,preview:plan,
  comparison,changedWidthRules,blocked:false,
  reason:"This places "+(labelOf[target]||target)+
   " earlier without removing another app section.",
  ownerApprovalRequired:true,privateOnly:true,
  sameDraftForMarketplaceAndStandalone:true,
  noCustomerDataAccess:true,noAutoPublish:true,noAutoBooking:true,
  noAutoCharges:true,noNewModules:true,
  notProofOfUsability:true,doesNotChangeFeatureAvailability:true,
  realDeviceReviewRequired:true};
}
function buildCustomerTaskDesignReport(config){
 const valid=enabledAppKeys(config);
 if(!valid.ok)return {ok:false,reason:valid.reason};
 const tasks=TASKS.map(item=>{
  const proposed=proposeTaskFirstNavigation(config,item.id);
  return {id:item.id,label:item.label,
   status:proposed.task?.status||"needs_review",
   available:proposed.task?.available===true,
   currentPosition:proposed.task?.sectionPosition??null,
   targetModule:proposed.task?.targetModule??null,
   couldMoveEarlier:proposed.preview?.ok===true,
   blockers:proposed.task?.blockers||[],
   cautions:proposed.task?.cautions||[]};
 });
 return {ok:true,kind:"customer_task_design_report_v3169",tasks,
  selectableTasks:TASKS,noAutomaticChanges:true,
  clientOnlyPublicConfigAnalysis:true,noUserBehaviorTracked:true,
  ownerFinalControl:true,sharedMarketplaceStandaloneDraft:true};
}
export {TASKS,taskReadiness,compareStaticJourney,
 proposeTaskFirstNavigation,buildCustomerTaskDesignReport};
