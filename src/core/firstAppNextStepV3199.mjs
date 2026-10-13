/**
 * V3.199: small, explainable next step after private first-app creation.
 * A deterministic Business Brain recommendation, not proof of functional
 * booking, conversion or readiness to publish. Never mutates the app.
 */
import {suggestAppCustomerJourney} from "./industryAppJourneyV3198.mjs";
function suggestFirstAppNextStep({app,website,businessId}={}){
 if(!app||typeof businessId!=="string"||!businessId||
   app.business_id!==businessId||!Number.isSafeInteger(app.draft_revision)||
   app.draft_revision<1||!app.draft_config||typeof app.draft_config!=="object")
   return {show:false,reason:"No verified matching private app draft."};
 const config=app.draft_config;
 const type=app.category||config.display?.category||website?.businessType||"";
 const journey=suggestAppCustomerJourney({businessType:type,appConfig:config});
 const hasWebsite=!!website?.id&&Number.isSafeInteger(website.generation)&&
  website.generation>0&&
  (!website.businessId||website.businessId===businessId)&&
  (!website.business_id||website.business_id===businessId);
 const brandingUnset=!config.presentation||
  typeof config.presentation!=="object"||
  !Object.keys(config.presentation).length;
 const next=hasWebsite&&brandingUnset?
  {stage:"review_brand",title:"Finish adapting your website's design",
   why:"Your new app has business details, but its mobile appearance is not yet confirmed against your website.",
   action:"Review the website-to-app design controls below."}:
  journey.availableInDraft?
  {stage:"test_customer_action",title:"Check your app's main customer action",
   why:journey.explanation+" "+journey.cautions.join(" "),
   action:"Review the enabled modules, test a customer request and inspect the private preview."}:
  {stage:"configure_action",title:"Choose a useful customer action",
   why:journey.customerNeed+" No supported customer action is confirmed as enabled.",
   action:"Enable only a tested, supported module through the existing owner-controlled editor."};
 return {show:true,kind:"first_app_next_step_v3199",businessId,appId:app.id,
  appRevision:app.draft_revision,industry:journey.industry,
  ...next,
  ownerActionRequired:true,privateOnly:true,
  neverPublishes:true,doesNotActivateModules:true,
  noLiveCustomerOutcomeVerified:true};
}
export {suggestFirstAppNextStep};
