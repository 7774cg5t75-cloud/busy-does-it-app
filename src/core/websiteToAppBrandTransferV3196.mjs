/**
 * V3.196: owner-reviewed website -> private Business App design transfer.
 * Maps existing first-party builder choices into already-supported atomic
 * app edits. No app creation claim before an app draft exists; no new trust
 * boundary, provider call, external image import, module enable or publish.
 */
import {validPrivateBuilderPair,reviewedPairIsCurrent}
 from "./ownerBuilderDraftGuardV3195.mjs";
import {safeHex,PALETTES,nativePalette} from "./nativePalette.mjs";
import {proposeCoordinatedAppChanges} from "./appCoordinatedStudio.mjs";

const MODES=Object.freeze(["match","adapt","new"]);
const W2A_TYPE=Object.freeze({
 editorial:"editorial",friendly:"friendly",confident:"impact",
 refined:"balanced",compact:"balanced"
});
const W2A_SERVICE=Object.freeze({
 rows:"rows",outlines:"cards",cards:"cards"
});
const SAFE_TEXT=s=>typeof s==="string"&&s.length<=600&&
 !/[<>\u0000-\u001f\u007f]/.test(s);
const valueOf=(value,max=600)=>SAFE_TEXT(value)&&value.length<=max?value.trim():"";
function recommendedAppFirstSection(type,config){
 const keys=new Set(config?.modules?.filter(m=>m?.enabled===true).map(m=>m.key)||[]);
 const t=(typeof type==="string"?type:"").toLowerCase();
 const candidates=/hair|salon|barber|beauty|nail|therap|clinic/.test(t)?
   ["booking_request","services","contact"]:
  /food|restaurant|cafe|café|takeaway|bakery|cater|festival|stall/.test(t)?
   ["offers","services","enquiry"]:
  /plumb|electric|repair|mechanic|builder|clean|contractor/.test(t)?
   ["enquiry","services","booking_request"]:
   ["services","contact","enquiry"];
 return candidates.find(k=>keys.has(k))||null;
}
function websiteOwnerServices(website){
 const section=website?.sections?.find(s=>s?.id==="services"&&
  s.type==="services"&&s.enabled!==false);
 if(!section||!Array.isArray(section.items)||section.items.length>30)return [];
 const chosen=[],names=new Set();
 for(const row of section.items){
  const name=valueOf(row?.title,120),description=valueOf(row?.body,600);
  if(!name)return [];
  const key=name.toLocaleLowerCase("en");
  if(names.has(key))return [];
  names.add(key);
  chosen.push({name,description});
 }
 return chosen;
}
function planWebsiteToAppDesign({website,app,businessId,mode="adapt",
 includeServices=false}={}){
 if(!MODES.includes(mode)||typeof includeServices!=="boolean")
  return {ok:false,reason:"Choose a supported transfer approach."};
 if(!validPrivateBuilderPair(website,app,businessId)||
   (website.business_id&&website.business_id!==businessId)||
   (website.businessId&&website.businessId!==businessId))
  return {ok:false,reason:"Open a current website and Business App draft for the same business."};
 const config=app.draft_config;
 if(mode==="new")return {ok:true,kind:"private_website_to_app_design_v3196",
  mode,businessId,sourceWebsiteId:website.id,sourceWebsiteGeneration:website.generation,
  targetAppId:app.id,targetAppRevision:app.draft_revision,
  operations:[],changes:[],requiresOwnerApproval:false,
  privateOnly:true,autoPublishes:false,startFresh:true,
  explanation:"Keep the app design independent. Nothing is changed."};
 const theme=website.theme&&typeof website.theme==="object"?website.theme:{};
 const presentation=config.presentation||{};
 const operations=[],explanations=[],skipped=[];
 const colour=safeHex(theme.primary);
 if(colour){
  const old=presentation.brandPalette==="custom"?safeHex(presentation.brandAccent):
   PALETTES[presentation.brandPalette]?
    nativePalette(presentation.brandPalette).accent:null;
  if(old!==colour){
   operations.push({kind:"appearance",field:"brandAccent",value:colour});
   explanations.push("Use the website's reviewed brand colour; adapt surrounding colours for readable mobile screens.");
  }else skipped.push("Brand colour already matches.");
 }else skipped.push("No supported website brand colour is available.");
 const ownerType=W2A_TYPE[theme.typography];
 if(ownerType){
  const nextType=mode==="adapt"&&ownerType==="impact"?"balanced":ownerType;
  if((presentation.typeStyle||"balanced")!==nextType){
   operations.push({kind:"appearance",field:"typeStyle",value:nextType});
   explanations.push(mode==="match"?
    "Use the closest supported mobile heading identity.":
    "Adapt website heading style to readable native typography.");
  }
 }else skipped.push("Website typography has no approved direct mobile equivalent.");
 const layout=W2A_SERVICE[theme.cardLayout];
 if(layout&&(presentation.serviceStyle||"cards")!==layout){
  operations.push({kind:"appearance",field:"serviceStyle",value:layout});
  explanations.push("Translate the website's service layout into a supported native layout.");
 }
 if(mode==="adapt"){
  const priority=recommendedAppFirstSection(website.businessType,config);
  const nav=Array.isArray(config.navigation)&&config.navigation.length?
   config.navigation:
   config.modules.filter(m=>m.enabled===true).map(m=>m.key);
  if(priority&&nav.includes(priority)&&nav[0]!==priority){
   operations.push({kind:"first",moduleKey:priority});
   explanations.push("Place "+priority.replaceAll("_"," ")+" first for this business type, without enabling new modules.");
  }
 }
 if(includeServices){
  const incoming=websiteOwnerServices(website);
  const moduleOn=config.modules.some(m=>m.key==="services"&&m.enabled===true);
  const existing=Array.isArray(config.publicProfile?.services)?
   config.publicProfile.services:[];
  if(!moduleOn)skipped.push("App Services module is off; no services imported.");
  else if(!incoming.length)skipped.push("No suitable owner-written website services to import.");
  else if(existing.length>30)skipped.push("Current app services must be reviewed first.");
  else {
   const names=new Set(existing.map(x=>valueOf(x?.name,120).toLocaleLowerCase("en")));
   const additions=incoming.filter(x=>!names.has(x.name.toLocaleLowerCase("en")));
   // No destructive replacement: preserve the original list, and fail
   // closed if it contains unsupported values or our bounds would overflow.
   if(existing.some(x=>!x||!valueOf(x.name,120)||!SAFE_TEXT(x.description??"")||
      Object.keys(x).some(k=>!["id","name","description"].includes(k)))||
      existing.length+additions.length>30){
    skipped.push("Existing app service details require manual review; left untouched.");
   }else if(additions.length){
    const next=[...existing.map(x=>({...x})),...additions];
    operations.push({kind:"services",value:next});
    explanations.push("Copy "+additions.length+" missing website service(s), preserving existing app services.");
   }else skipped.push("All named website services are already in the app.");
  }
 }
 if(operations.length>8)return {ok:false,reason:"Too many changes for one safe app draft update."};
 if(!operations.length)return {ok:false,reason:"This private app already matches the supported website settings."};
 const preview=proposeCoordinatedAppChanges(config,operations);
 if(!preview.ok)return preview;
 const reviewed=operations.map(op=>JSON.parse(JSON.stringify(op)));
 return {ok:true,kind:"private_website_to_app_design_v3196",
  mode,businessId,sourceWebsiteId:website.id,
  sourceWebsiteGeneration:website.generation,
  targetAppId:app.id,targetAppRevision:app.draft_revision,
  operations:reviewed,includeServices,changes:[...preview.changes],
  previewConfig:preview.nextConfig,explanations,skipped,
  industryPriority:mode==="adapt"?
    recommendedAppFirstSection(website.businessType,config):null,
  exactPreview:JSON.stringify(reviewed),
  privateOnly:true,requiresOwnerApproval:true,
  autoPublishes:false,changesBookings:false,chargesCustomers:false,
  copiesCustomerRecords:false,promisesExactPixelMatch:false};
}
function confirmWebsiteToAppDesign({website,app,businessId,evidence}={}){
 if(!reviewedPairIsCurrent(website,app,businessId,evidence,{
  appId:"targetAppId",appRevision:"targetAppRevision",
  websiteId:"sourceWebsiteId",websiteRevision:"sourceWebsiteGeneration"}))
  return {ok:false,reason:"The website, app or business changed. Review the latest design first."};
 const current=planWebsiteToAppDesign({website,app,businessId,
  mode:evidence?.mode,
  includeServices:evidence?.includeServices===true});
 if(!current.ok||current.exactPreview!==evidence.exactPreview||
   JSON.stringify(current.operations)!==JSON.stringify(evidence.operations))
  return {ok:false,reason:"The proposed app changes no longer match the reviewed design."};
 return current;
}
export {MODES,W2A_TYPE,W2A_SERVICE,recommendedAppFirstSection,
 websiteOwnerServices,planWebsiteToAppDesign,confirmWebsiteToAppDesign};
