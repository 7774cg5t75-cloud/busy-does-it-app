/**
 * V3.195 Business Brand DNA — local, read-only and versioned FOUNDATION.
 * Extracts an intentionally narrow, explicit allowlist from two CURRENT,
 * PRIVATE drafts of the same business. This is NOT a public API, persistent
 * memory, a model-generated brand, automatic customer sharing or publishing.
 *
 * Consumer channels use this same source so AI/marketing generation can be
 * added later behind explicit user approval and per-tenant protections.
 */
import {validPrivateBuilderPair} from "./ownerBuilderDraftGuardV3195.mjs";
import {PALETTES,safeHex,nativePalette} from "./nativePalette.mjs";
import {appVisualPresentation} from "./appVisualPresentationV3194.mjs";

const CHANNELS=Object.freeze(["website","app","social","advert","poster","video"]);
const cleanText=(text,max)=>{
 if(typeof text!=="string"||text.length>max||/[<>\u0000-\u001f\u007f]/.test(text))return "";
 return text.trim();
};
const normalColour=c=>safeHex(c)||null;
const cleanUrl=u=>{
 if(typeof u!=="string"||u.length>1800||/[\s<>\u0000-\u001f\u007f]/.test(u))
  return "";
 try{const parsed=new URL(u);return parsed.protocol==="https:"&&
  parsed.hostname&&!parsed.username&&!parsed.password&&!parsed.hash?
   u:"";}catch{return "";}
};
function buildBusinessBrandDnaSnapshot({website,app,businessId}={}){
 if(!validPrivateBuilderPair(website,app,businessId))
  return {ok:false,reason:"Choose a current website and Business App draft for the same business."};
 const config=app.draft_config;
 const profile=config.publicProfile&&typeof config.publicProfile==="object"?
  config.publicProfile:{};
 const appearance=config.presentation&&typeof config.presentation==="object"?
  config.presentation:{};
 const webTheme=website.theme&&typeof website.theme==="object"?website.theme:{};
 const name=cleanText(profile.businessName,140)||
  cleanText(config.display?.name,140)||cleanText(website.businessName,140);
 if(!name)return {ok:false,reason:"Add an approved business name before preparing Brand DNA."};
 const appTag=cleanText(profile.tagline,220)||cleanText(config.display?.tagline,220);
 const websiteTag=cleanText(website.sections.find(s=>s?.type==="hero")?.body,220);
 const tagline=appTag||websiteTag;
 const about=cleanText(profile.about,900)||cleanText(profile.description,900)||
  cleanText(website.sections.find(s=>s?.type==="about")?.body,900);
 const possibleColour=appearance.brandPalette==="custom"?
  normalColour(appearance.brandAccent):PALETTES[appearance.brandPalette]?
   nativePalette(appearance.brandPalette).accent:null;
 const appColour=possibleColour;
 const webColour=normalColour(webTheme.primary);
 const selectedColour=appColour||webColour||null;
 const visual=appVisualPresentation(appearance);
 const logo=profile.assets?.logo;
 // Only explicit owner-approved gallery items are reusable. Do not infer
 // approval from a URL or from being present in a private source draft.
 const photos=Array.isArray(profile.assets?.gallery)?
  profile.assets.gallery.filter(x=>x?.approved===true).slice(0,12)
   .map(x=>({uri:cleanUrl(x.uri),alt:cleanText(x.alt,160),
    caption:cleanText(x.caption,240)})).filter(x=>x.uri).slice(0,6):[];
 const approvedLogo=logo?.approved===true?cleanUrl(logo.uri):"";
 const raw=Array.isArray(profile.services)?profile.services:[];
 const names=new Set(),services=[];
 for(const service of raw.slice(0,30)){
  const n=cleanText(service?.name,120);
  const key=n.toLocaleLowerCase("en");
  if(!n||names.has(key))continue;
  names.add(key);
  services.push({name:n,description:cleanText(service?.description,500)});
  if(services.length>=12)break;
 }
 const conflicts=[];
 if(appTag&&websiteTag&&appTag!==websiteTag)
  conflicts.push("Website and App introductions differ; no automatic overwrite.");
 if(appColour&&webColour&&appColour!==webColour)
  conflicts.push("Website and App colours differ; keep both until owner chooses.");
 if(cleanText(website.businessName,140)&&cleanText(website.businessName,140)!==name)
  conflicts.push("Website and App business names differ; owner review required.");
 const websiteServices=website.sections.filter(s=>s?.type==='services'&&s.enabled!==false);
 const normal=v=>typeof v==='string'?v.trim().normalize('NFKC').toLocaleLowerCase('en'):'';
 if(websiteServices.length===1&&Array.isArray(websiteServices[0].items)&&websiteServices[0].items.length<=30){
  const web=websiteServices[0].items;
  const shared=raw.filter(row=>normal(row?.name)&&web.filter(item=>normal(item?.title)===normal(row.name)).length===1);
  const differing=shared.filter(row=>{
   const other=web.find(item=>normal(item?.title)===normal(row.name));
   return normal(row.description)&&normal(other.body)&&normal(row.description)!==normal(other.body);
  });
  if(differing.length)conflicts.push(differing.length+' shared service description(s) differ; preserve each destination until reviewed.');
  const appOnly=raw.filter(row=>normal(row?.name)&&!web.some(item=>normal(item?.title)===normal(row.name))).length;
  const webOnly=web.filter(row=>normal(row?.title)&&!raw.some(item=>normal(item?.name)===normal(row.title))).length;
  if(appOnly||webOnly)conflicts.push('Service coverage differs: '+appOnly+' app-only and '+webOnly+' website-only. Missing-only reuse needs owner review.');
 }
 const ownerVoice=cleanText(profile.brandVoice?.tone,48);
 const voice=ownerVoice&&["warm","professional","playful","direct","premium","calm"]
  .includes(ownerVoice.toLowerCase())?ownerVoice.toLowerCase():null;
 return {ok:true,schema:"private_brand_dna_draft_v1",
  businessId,source:{websiteId:website.id,websiteGeneration:website.generation,
   appId:app.id,appDraftRevision:app.draft_revision},
  identity:{name,tagline,about},
  design:{palette:appearance.brandPalette||null,
   primaryColour:selectedColour,appColour,websiteColour:webColour,
   appTypography:visual.typeStyle,websiteTypography:cleanText(webTheme.typography,40)||null,
   serviceLayout:visual.serviceStyle},
  voice:{ownerChosenTone:voice,status:voice?"owner-specified":"not-yet-specified"},
  assets:{logoUrl:approvedLogo,photos},services,conflicts,
  privateOnly:true,requiresOwnerReview:true,autoPublishes:false,
  savesBrandMemory:false,importsCustomerRecords:false,
  sourceOfTruth:"owner-approved draft fields only"};
}
function planBrandDnaContentBrief(snapshot,{channel,goal=""}={}){
 if(!snapshot?.ok||snapshot.schema!=="private_brand_dna_draft_v1"||
   !CHANNELS.includes(channel)||typeof goal!=="string"||goal.length>240||
   /[<>\u0000-\u001f\u007f]/.test(goal))
  return {ok:false,reason:"Choose a valid private Brand DNA snapshot, channel and short brief."};
 return {ok:true,kind:"brand_dna_content_brief_v1",businessId:snapshot.businessId,
  source:{...snapshot.source},channel,goal:goal.trim(),
  businessName:snapshot.identity.name,tagline:snapshot.identity.tagline,
  about:snapshot.identity.about,services:snapshot.services.map(s=>({...s})),
  brandColour:snapshot.design.primaryColour,
  typography:snapshot.design.appTypography,
  approvedAssets:snapshot.assets.photos.map(x=>({...x})),
  voice:snapshot.voice.ownerChosenTone,
  conflicts:[...snapshot.conflicts],
  previewOnly:true,ownerMustApprove:true,noProviderCalls:true,
  didNotGenerateContent:true,autoPublishes:false,
  guidance:"Adapt to the chosen format. Do not invent prices, customer reviews, event details, availability or approval; ask the owner for missing facts."};
}
export {CHANNELS,buildBusinessBrandDnaSnapshot,planBrandDnaContentBrief};

// Reuse the original approved shared profile when a business has not built both surfaces.
// Caller supplies its current authorised projection; this is not authentication or new memory.
function buildContentBrandSnapshot({website,app,businessId,approvedProfile,sourceMode=""}={}){
 if(website?.businessId&&website.businessId!==businessId||website?.business_id&&website.business_id!==businessId||app?.business_id&&app.business_id!==businessId)return {ok:false,reason:'Open approved information for this business.'};
 if(website&&app&&sourceMode!=="approved-profile"){
  const snapshot=buildBusinessBrandDnaSnapshot({website,app,businessId});
  if(!snapshot.ok||!approvedProfile?.businessName)return snapshot;
  const normal=value=>String(value||'').trim().toLocaleLowerCase('en');
  const approvedServices=Array.isArray(approvedProfile.services)?approvedProfile.services:[];
  const differs=normal(snapshot.identity.name)!==normal(approvedProfile.businessName)||approvedServices.some(service=>!snapshot.services.some(row=>normal(row.name)===normal(service.name)))||snapshot.services.some(service=>{
   if(!approvedServices.some(row=>normal(row.name)===normal(service.name)))return true;
   const rows=approvedServices.filter(row=>normal(row.name)===normal(service.name));
   return rows.length===1&&normal(rows[0].description)&&normal(rows[0].description)!==normal(service.description);
  });
  return differs?{ok:false,reason:'Your approved business profile and builder wording differ. Review the source before preparing shared content.'}:snapshot;
 }
 if(!businessId||!approvedProfile||typeof approvedProfile.fingerprint!=='string'||approvedProfile.businessId&&approvedProfile.businessId!==businessId)return {ok:false,reason:'Review your approved business profile before preparing content.'};
 const name=cleanText(approvedProfile.businessName,140);if(!name)return {ok:false,reason:'Add an approved business name before preparing content.'};
 const services=(Array.isArray(approvedProfile.services)?approvedProfile.services:[]).slice(0,30).map(row=>({id:cleanText(row?.id,128),name:cleanText(row?.name,120),description:cleanText(row?.description,500)})).filter(row=>row.name).slice(0,12);
 const identity={name,tagline:cleanText(approvedProfile.tagline,220),about:cleanText(approvedProfile.description||approvedProfile.about,900)};
 const colour=normalColour(approvedProfile.theme?.primary);
 return {ok:true,schema:'private_brand_dna_draft_v1',businessId,source:{approvedProfileSource:JSON.stringify({identity,services,colour})},identity,
  services,design:{primaryColour:colour,appTypography:null},voice:{ownerChosenTone:null},assets:{photos:[]},conflicts:[],privateOnly:true,requiresOwnerReview:true,autoPublishes:false,sourceOfTruth:'current approved shared business profile'};
}
export {buildContentBrandSnapshot};
