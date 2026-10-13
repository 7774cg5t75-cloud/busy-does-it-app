/**
 * V3.200 — one industry-specific first-customer-journey decision built from
 * ACTUAL enabled runtime screens, owner-approved public facts and bounded
 * offline request-state tests. Not a claim of live task success.
 *
 * Only the existing revision-checked coordinated app editor may save a
 * reviewed navigation change; this module has no network or mutation.
 */
import {appRuntimeScreenSchema} from "./appRuntimeScreenSchema.mjs";
import {industryOf} from "./industryAppJourneyV3198.mjs";
import {proposeCoordinatedAppChanges} from "./appCoordinatedStudio.mjs";
import {simulateCustomerJourney} from "./appCustomerJourneyPractice.mjs";

const GOALS=Object.freeze({
 appointment:["booking_request","services","contact"],
 trade:["enquiry","services","contact"],
 food:["services","offers","enquiry","contact"],
 general:["services","enquiry","contact"]
});
const REASONS=Object.freeze({
 booking_request:"Customers looking for an appointment should see booking requests near the top. A request is never a confirmed diary booking.",
 enquiry:"Customers requesting a quote or help need a real tracked enquiry route, not a pretend quote calculator.",
 services:"Customers need to understand the business's approved services or products before taking another action.",
 offers:"Only real owner-approved, currently applicable offer terms should be shown.",
 contact:"An easy-to-find public contact route helps people get in touch, but is not a tracked enquiry inbox."
});
const ACTIONS=Object.freeze({
 booking_request:{label:"Request a booking",test:"booking_waiting"},
 enquiry:{label:"Send an enquiry",test:"enquiry_review"},
 services:{label:"Explore services"},
 offers:{label:"Read approved offers"},
 contact:{label:"Find contact details"}
});
const fail=reason=>({ok:false,reason,ownerApprovedChanges:0,
 noLiveTaskVerified:true,noAutomaticPublishing:true});
function planIndustryFirstExperience({businessId="",app=null,catalog=[]}={}){
 if(typeof businessId!=="string"||!businessId||
    app?.business_id!==businessId||typeof app?.id!=="string"||!app.id||
    !Number.isSafeInteger(app.draft_revision)||app.draft_revision<1||
    !app.draft_config||!Array.isArray(catalog)||catalog.length>50)
  return fail("Open a current private app and its owner-scoped available module catalogue.");
 const config=app.draft_config;
 const runtime=appRuntimeScreenSchema(config,catalog);
 if(!runtime.ok)return fail("The current app cannot be verified as a supported customer runtime: "+runtime.reason);
 const industry=industryOf(app.category||config.display?.category||"");
 const existingKeys=new Set(runtime.screens.map(s=>s.key));
 const approvedServices=Array.isArray(config.publicProfile?.services)?
  config.publicProfile.services.filter(s=>typeof s?.name==="string"&&
   s.name.trim()&&s.name.length<=120):[];
 const approvedOffers=Array.isArray(config.offers)?
  config.offers.filter(o=>o?.approved===true):[];
 const usable=key=>existingKeys.has(key)&&
  (key!=="services"||approvedServices.length>0)&&
  (key!=="offers"||approvedOffers.length>0);
 const candidates=GOALS[industry]||GOALS.general;
 const target=candidates.find(usable)||null;
 const action=target?ACTIONS[target]:null;
 const issues=[];
 if(existingKeys.has("services")&&!approvedServices.length)
  issues.push("The Services screen has no usable approved service names.");
 if(existingKeys.has("offers")&&!approvedOffers.length)
  issues.push("An enabled Offers screen requires approved terms.");
 if(!target)issues.push("No suitable customer-first screen is ready. Review business facts and enabled modules first.");
 let simulation=null;
 if(action?.test){
  simulation=simulateCustomerJourney(config,action.test);
  if(!simulation?.ok||simulation.ran!==true||simulation.passed!==true)
   issues.push("The relevant fictional request-state checks have not passed.");
 }
 let preview=null;
 if(target&&(!simulation||simulation.passed===true)){
  const original=config.navigation;
  const index=original.indexOf(target);
  const slot=original[0]==="business_profile"&&target!=="business_profile"?1:0;
  if(index>slot){
   const next=[...original];next.splice(index,1);next.splice(slot,0,target);
   const edit=proposeCoordinatedAppChanges(config,[{kind:"navigation",value:next}]);
   if(edit.ok)preview={operations:edit.operations,
     changes:edit.changes,after:edit.nextConfig.navigation,
     before:[...original],expectedRevision:app.draft_revision,
     privateOnly:true};
   else issues.push("Navigation improvement was not safe: "+edit.reason);
  }
 }
 const checks=[
  {id:"supported_runtime",label:"Enabled customer screens exist in the supported shared app runtime",
   result:"static_pass",notLiveProof:true},
  {id:"public_facts",label:"A usable priority action has reviewed public business facts",
   result:target?"static_pass":"setup_required",notLiveProof:true},
  {id:"request_lifecycle",label:"Booking or enquiry transitions reject unsafe fictional states",
   result:!simulation?"not_applicable":simulation.passed===true?
    "synthetic_pass":"requires_review",notLiveProof:true},
  {id:"live_delivery",label:"Real request submission, notification and owner response",
   result:"not_tested",notLiveProof:true},
  {id:"device_usability",label:"Physical device screen, accessibility and task completion",
   result:"not_tested",notLiveProof:true}
 ];
 return {ok:true,kind:"industry_first_experience_v3200",
  businessId,appId:app.id,appRevision:app.draft_revision,
  industry,targetModule:target,actionLabel:action?.label||null,
  why:target?REASONS[target]:"Check the missing customer journey setup before suggesting a layout.",
  missingSetup:issues,approvedServiceCount:approvedServices.length,
  checks,staticRuntimeScreenCount:runtime.screens.length,
  preview,reviewNeeded:!!preview,ownerApprovalRequired:true,
  liveSubmissionVerified:false,realDiaryConfirmationVerified:false,
  providerDeliveryVerified:false,realDeviceTested:false,
  syntheticRequestTestsOnly:!!simulation,
  appStoreDistributionNotVerified:true,
  createsRequests:false,enablesModules:false,doesNotInventContent:true,
  noCustomerRecordsAccess:true,neverCharges:true,neverPublishes:true};
}
function confirmIndustryFirstExperience({businessId="",app,catalog=[],evidence}={}){
 if(!evidence||typeof evidence!=="object"||evidence.kind!=="industry_first_experience_v3200")
  return fail("Review Busy’s current industry journey first.");
 const fresh=planIndustryFirstExperience({businessId,app,catalog});
 if(!fresh.ok||!fresh.preview||
    evidence.businessId!==fresh.businessId||
    evidence.appId!==fresh.appId||
    evidence.appRevision!==fresh.appRevision||
    evidence.targetModule!==fresh.targetModule||
    JSON.stringify(evidence.preview?.operations)!==JSON.stringify(fresh.preview.operations)||
    JSON.stringify(evidence.preview?.before)!==JSON.stringify(fresh.preview.before))
  return fail("The app, enabled features or recommendation changed. Review the latest draft first.");
 return fresh;
}
export {GOALS,planIndustryFirstExperience,confirmIndustryFirstExperience};
