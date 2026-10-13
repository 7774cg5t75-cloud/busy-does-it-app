/**
 * V3.197 — reviewed website → FIRST private Business App.
 * No pre-existing app is required. Preparation is PURE and NEVER publishes,
 * charges, copies contacts, imports media or implies a store-installable app.
 * The controller calls the existing authenticated server build_draft endpoint
 * and then optionally saves a bounded, separate appearance revision.
 */
import {safeHex} from "./nativePalette.mjs";
import {websiteOwnerServices,MODES} from "./websiteToAppBrandTransferV3196.mjs";
const safe=(value,limit)=>typeof value==="string"&&value.length<=limit&&
 !/[<>\u0000-\u001f\u007f]/.test(value)?value.trim():"";
function validWebsiteSource(website,businessId){
 return typeof businessId==="string"&&businessId.length>0&&businessId.length<=128&&
  website&&typeof website==="object"&&!Array.isArray(website)&&
  typeof website.id==="string"&&website.id.length>0&&
  Number.isSafeInteger(website.generation)&&website.generation>=1&&
  Array.isArray(website.sections)&&
  (!website.business_id||website.business_id===businessId)&&
  (!website.businessId||website.businessId===businessId);
}
function prepareFirstAppFromWebsite({website,app,businessId,mode="adapt"}={}){
 if(!MODES.includes(mode))return {ok:false,reason:"Choose a supported design approach."};
 if(!validWebsiteSource(website,businessId))
  return {ok:false,reason:"Open a current private website from this business."};
 if(app!==null&&app!==undefined)
  return {ok:false,reason:"An app already exists. Use the existing website-to-app editor instead."};
 if(mode==="new")
  return {ok:true,kind:"first_app_from_website_v3197",businessId,
   websiteId:website.id,websiteGeneration:website.generation,
   mode,startFresh:true,requiresOwnerApproval:false,
   changes:[],privateOnly:true,autoPublishes:false};
 const name=safe(website.businessName,140);
 if(!name)return {ok:false,reason:"Confirm the trading name on the website first."};
 const businessType=safe(website.businessType,140);
 const hero=website.sections.find(s=>s?.type==="hero"&&s.enabled!==false);
 const about=website.sections.find(s=>s?.type==="about"&&s.enabled!==false);
 const tagline=safe(hero?.body,220);
 const description=safe(about?.body,900);
 // Website sections and URLs are not automatically approved as app image
 // assets: native image contracts and publication permissions differ.
 const services=websiteOwnerServices(website).map((row,i)=>({
  id:"website-service-"+String(i+1),
  name:row.name,description:row.description
 }));
 const theme=website.theme&&typeof website.theme==="object"&&!Array.isArray(website.theme)?
  website.theme:{};
 const brandColour=safeHex(theme.primary);
 const websiteType=safe(theme.typography,40);
 const websiteCard=safe(theme.cardLayout,40);
 const profileDraft={businessName:name,businessType,tagline,
  description,about:description,services};
 const changes=["Create an unpublished Business App draft for "+name];
 if(services.length)changes.push("Reuse "+services.length+" reviewed website service(s)");
 if(brandColour)changes.push("Adapt brand colour "+brandColour+" for mobile contrast");
 if(websiteType)changes.push("Review compatible app heading styles");
 if(websiteCard)changes.push("Review service presentation for a phone");
 const source=JSON.stringify({name,businessType,tagline,description,services,
  brandColour,websiteType,websiteCard,mode});
 return {ok:true,kind:"first_app_from_website_v3197",
  businessId,websiteId:website.id,websiteGeneration:website.generation,
  mode,source,profileDraft,brandColour,websiteType,websiteCard,
  serviceCount:services.length,changes,
  privateOnly:true,requiresOwnerApproval:true,autoPublishes:false,
  offersStoreApp:false,requiresVerifiedEntitlementForStandalone:true,
  separateAppearanceSave:true,
  note:"Create the private app first; compatible appearance is a second checked edit, so a failed edit may leave a valid draft to finish."};
}
function confirmFirstAppFromWebsite({website,app,businessId,evidence}={}){
 if(!evidence||typeof evidence!=="object"||Array.isArray(evidence))
  return {ok:false,reason:"Review the first app design before approval."};
 const plan=prepareFirstAppFromWebsite({website,app,businessId,mode:evidence.mode});
 if(!plan.ok||plan.mode==="new"||plan.source!==evidence.source||
    plan.businessId!==evidence.businessId||
    plan.websiteId!==evidence.websiteId||
    plan.websiteGeneration!==evidence.websiteGeneration||
    JSON.stringify(plan.profileDraft)!==JSON.stringify(evidence.profileDraft))
  return {ok:false,reason:"The website changed since the app preview. Review it again."};
 return plan;
}
export {validWebsiteSource,prepareFirstAppFromWebsite,confirmFirstAppFromWebsite};
