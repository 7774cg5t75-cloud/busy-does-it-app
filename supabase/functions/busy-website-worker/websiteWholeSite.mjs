import {validPublicBusinessContent} from './businessContentRecords.mjs';
import {websiteServicePhoto} from './websiteServicePhotos.mjs';
import {websiteOwnerLocks} from './websiteOwnerLocks.mjs';
// A bounded presentation projection of the ORIGINAL website, never a fact store.
const list=x=>Array.isArray(x)?x:[],text=x=>typeof x==='string'?x.trim():'';
export const servicePageSlug=s=>text(s).normalize('NFKD').toLowerCase().replace(/[\u0300-\u036f]/g,'').replace(/&/g,'-and-').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,55).replace(/-+$/,'');
export function wholeSiteServices(draft){
 const sections=list(draft?.sections).filter(s=>s.id==='services'&&s.type==='services'&&s.enabled!==false);
 if(sections.length!==1)return [];
 const items=list(sections[0].items);
 return items.filter(s=>s&&typeof s.id==='string'&&/^[-a-zA-Z0-9_]{1,128}$/.test(s.id)&&items.filter(i=>i.id===s.id).length===1&&text(s.title)&&text(s.title).length<=80&&text(s.body).length>=40&&text(s.body).length<=2500&&servicePageSlug(s.title).length>=2);
}
export function wholeSitePageSpecs(draft,ids){
 if(!Array.isArray(ids)||ids.length>5||new Set(ids).size!==ids.length||ids.some(x=>typeof x!=='string'))return {ok:false,reason:'Choose up to five distinct, current services with approved descriptions.'};
 const services=wholeSiteServices(draft),existing=list(draft.customPages),specs=[];
 for(const id of ids){
  const service=services.find(s=>s.id===id);if(!service)return {ok:false,reason:'A selected service changed or needs a useful approved description.'};
  if(existing.some(p=>p.sourceServiceId===id))continue;
  const slug=servicePageSlug(service.title);
  if(existing.some(p=>p.slug===slug)||specs.some(p=>p.slug===slug))return {ok:false,reason:'A page already uses this service name. Review it in the original page editor.'};
  if(service.photoBinding&&!websiteServicePhoto(draft,service))return {ok:false,reason:'A service photograph changed or was withdrawn. Review it before composing pages.'};
  const paragraphs=text(service.body).split(/\n\s*\n/).filter(Boolean);
  // Exact existing words, not invented benefits or claims. A short source stays short.
  const opening=paragraphs[0],detail=paragraphs.slice(1).join('\n\n');
  specs.push({serviceId:id,slug,title:text(service.title),opening,detail,sourceServiceSnapshot:{title:text(service.title),body:text(service.body)},photo:websiteServicePhoto(draft,service),purpose:'Understand '+text(service.title)+' and choose an appropriate next conversation.'});
 }
 return specs.length||!ids.length&&draft.siteComposition!=='connected-pages-v1'?{ok:true,specs}:{ok:false,reason:'Those services already have pages. Your words and existing addresses were kept.'};
}

export function wholeSiteBasePageIds(draft){
 return ['home',...['services','products','events','about','gallery','faq','contact'].filter(id=>{const s=list(draft?.sections).find(s=>s.id===id&&s.enabled!==false);return !!s&&!(['gallery','faq','services'].includes(id)&&!list(s.items).length)&&!(id==='about'&&!text(s.body));})];
}

// Reviewable presentation decisions over original sources, not new facts.
export function wholeSiteMenuMove(draft,{explicit=false}={}){
 const locks=websiteOwnerLocks(draft);if(!locks.ok||locks.locks.length)return null;
 if(!wholeSiteContentCurrent(draft)||!explicit&&(draft?.theme?.pageDirection!=='menu-house'||Array.isArray(draft?.theme?.sectionOrder)))return null;
 const menus=list(draft?.sections).filter(s=>s.id==='products'&&s.type==='products'&&s.enabled!==false);
 const home=list(draft?.pages).find(p=>p.id==='home'&&p.enabled!==false);
 if(menus.length!==1||!home||!list(home.sectionIds).includes('products')||!list(home.sectionIds).includes('hero')||home.sectionIds.indexOf('products')===home.sectionIds.indexOf('hero')+1)return null;
 return {kind:'layout',action:'move-relative',sectionId:'products',targetSectionId:'hero',position:'after',pageId:'home'};
}

export function wholeSiteOperationCount(draft,ids){
 const p=wholeSitePageSpecs(draft,ids);
 const locks=websiteOwnerLocks(draft),purposeful=draft?.sitePresentation==='purposeful-v1'||locks.ok&&!locks.locks.length;
 return p.ok?p.specs.reduce((n,s)=>n+1+(!purposeful&&s.detail?1:0),0)+(wholeSiteMenuMove(draft)?1:0):Infinity;
}

// Small derived provenance over the existing approved service. It never
// replaces owner page wording or silently refreshes it after a fact change.
export function wholeSiteDerivedSourcesCurrent(draft){
 const services=wholeSiteServices(draft);
 return list(draft?.customPages).filter(p=>p?.sourceServiceId).every(page=>{
  const matches=services.filter(s=>s.id===page.sourceServiceId),snapshot=page.sourceServiceSnapshot;
  return matches.length===1&&snapshot&&typeof snapshot==='object'&&!Array.isArray(snapshot)&&Object.keys(snapshot).sort().join(',')==='body,title'&&snapshot.title===text(matches[0].title)&&snapshot.body===text(matches[0].body);
 });
}

// Generated service pages retain the original service/gallery relationship.
// A copied presentation asset cannot outlive that exact current authority.
// Owner-authored legacy pages without a sourceServiceId keep their own path.
export function wholeSiteSectionPhotoCurrent(draft,section){
 if(section?.type!=='photo-feature')return true;
 const pages=list(draft?.customPages).filter(p=>p?.sourceServiceId&&list(p.sectionIds).includes(section.id));
 if(!pages.length)return true;
 if(pages.length!==1)return false;
 const services=wholeSiteServices(draft).filter(s=>s.id===pages[0].sourceServiceId);
 if(services.length!==1)return false;
 const current=websiteServicePhoto(draft,services[0]),asset=section.asset;
 return !!current&&!!asset&&asset.approved===true&&current.storagePath===asset.storagePath&&current.sha256===asset.sha256&&current.revision===asset.revision&&current.businessId===asset.businessId&&current.uri===asset.uri&&current.width===asset.width&&current.height===asset.height;
}

// The original product/event reader remains the factual authority. A complete
// site cannot claim a menu page from an invalid, foreign or withdrawn feed.
export function wholeSiteContentCurrent(draft){
 return list(draft?.sections).filter(s=>['products','events'].includes(s.type)&&s.enabled!==false).every(section=>{
  const feed=section.previewFeed,kind=section.type==='products'?'product':'event';
  return section.contentSource==='business_records_v1'&&validPublicBusinessContent(feed)&&feed.businessId===draft.businessId&&new Set(feed.records.map(r=>r.id)).size===feed.records.length&&feed.records.some(r=>r.kind===kind&&(kind==='product'?r.data.status==='active':r.data.status==='scheduled'&&Date.parse(r.data.endsAt)>Date.now()));
 });
}
