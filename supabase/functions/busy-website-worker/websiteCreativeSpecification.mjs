import {wholeSiteDerivedSourcesCurrent,wholeSiteContentCurrent,wholeSiteSectionPhotoCurrent} from './websiteWholeSite.mjs';
import {websiteAssetAvailable} from './websitePhotoPresentation.mjs';
import {websiteServicePhoto} from './websiteServicePhotos.mjs';
import {websiteSectionPhoto,websiteRecordPhoto} from './websiteContentPhotos.mjs';
import {websiteOwnerLocks} from './websiteOwnerLocks.mjs';

// Composable presentation measures over ORIGINAL pages and source sections.
// This is neither a fact store nor a layout/template/HTML execution language.
export const WEBSITE_CREATIVE_SPECIFICATION_VERSION='busy.website-creative-specification.v1';
export const WEBSITE_CREATIVE_MEASURES=Object.freeze({
 opening:['display','compact','split'],measure:['focused','wide'],
 alignment:['start','offset'],rhythm:['compact','balanced','generous'],
 emphasis:['quiet','contrast']
});
const list=value=>Array.isArray(value)?value:[];
const object=value=>!!value&&typeof value==='object'&&!Array.isArray(value);
const exact=(value,keys)=>object(value)&&Object.keys(value).sort().join(',')===[...keys].sort().join(',');
const identity=value=>typeof value==='string'&&/^[-a-zA-Z0-9_]{1,128}$/.test(value);
const canonical=value=>Array.isArray(value)?value.map(canonical):object(value)?Object.fromEntries(Object.keys(value).sort().map(key=>[key,canonical(value[key])])):value;
const same=(a,b)=>JSON.stringify(canonical(a))===JSON.stringify(canonical(b));
const comparable=specification=>specification?{version:specification.version,pages:[...list(specification.pages)].sort((a,b)=>String(a.pageId).localeCompare(String(b.pageId)))}:null;
export const websiteCreativeSpecificationsEqual=(a,b)=>same(comparable(a),comparable(b));
const fail=reason=>({ok:false,reason});

export function websiteCreativeSourcesCurrent(draft){
 const businessId=draft?.businessId;
 const foreign=value=>[value?.businessId,value?.business_id].some(id=>id&&id!==businessId);
 if(!businessId||foreign(draft)||Object.hasOwn(draft,'siteComposition')&&draft.siteComposition!=='connected-pages-v1'||Object.hasOwn(draft,'sitePresentation')&&draft.sitePresentation!=='purposeful-v1'||!wholeSiteDerivedSourcesCurrent(draft)||!wholeSiteContentCurrent(draft))return false;
 if(list(draft.pages).some(foreign))return false;
 return list(draft.sections).filter(section=>section.enabled!==false).every(section=>{
  if(foreign(section)||!wholeSiteSectionPhotoCurrent(draft,section))return false;
  const assets=section.type==='gallery'?list(section.items):['hero','photo-feature'].includes(section.type)?[section.asset].filter(Boolean):[];
  if(assets.some(asset=>!websiteAssetAvailable(asset,businessId,draft,section)))return false;
  if(section.type==='services'&&list(section.items).some(item=>item.photoBinding&&!websiteServicePhoto(draft,item)))return false;
  if(section.storyPhoto&&!websiteSectionPhoto(draft,section))return false;
  if(list(section.contentPhotos).some(ref=>!websiteRecordPhoto(draft,section,list(section.previewFeed?.records).find(record=>record.id===ref.recordId))))return false;
  return true;
 });
}

export function validateWebsiteCreativeSpecification(draft,specification,{forEdit=false}={}){
 if(!exact(specification,['version','pages'])||specification.version!==WEBSITE_CREATIVE_SPECIFICATION_VERSION||!Array.isArray(specification.pages)||!specification.pages.length||specification.pages.length>10)return fail('Review a supported whole-site creative specification.');
 if(JSON.stringify(specification).length>16000||!websiteCreativeSourcesCurrent(draft))return fail('The current business, service, product or photograph source needs review. Your website was kept.');
 const pages=list(draft.pages).filter(page=>page.enabled!==false),sections=list(draft.sections),seen=new Set();
 if(pages.length>10||new Set(pages.map(page=>page.id)).size!==pages.length||new Set(sections.map(section=>section.id)).size!==sections.length)return fail('Review unambiguous current website pages and sections first.');
 const locks=websiteOwnerLocks(draft);if(!locks.ok)return fail(locks.reason);
 for(const proposed of specification.pages){
  if(!exact(proposed,['pageId','sectionOrder',...Object.keys(WEBSITE_CREATIVE_MEASURES)])||!identity(proposed.pageId)||seen.has(proposed.pageId))return fail('Each creative page must identify one distinct original page.');
  seen.add(proposed.pageId);
  const page=pages.find(current=>current.id===proposed.pageId),order=list(page?.sectionIds);
  if(!page||!order.length||new Set(order).size!==order.length||order.some(id=>!identity(id)||!sections.some(section=>section.id===id&&section.enabled!==false)))return fail('A creative page or its original sections changed. Prepare a fresh review.');
  if(!Array.isArray(proposed.sectionOrder)||proposed.sectionOrder.length!==order.length||new Set(proposed.sectionOrder).size!==order.length||proposed.sectionOrder.some(id=>!order.includes(id)))return fail('Keep every current page section exactly once; creative direction cannot delete or duplicate content.');
  const hero=order.find(id=>sections.find(section=>section.id===id)?.type==='hero');
  const contact=order.find(id=>sections.find(section=>section.id===id)?.type==='contact');
  if(hero&&proposed.sectionOrder[0]!==hero||contact&&proposed.sectionOrder.at(-1)!==contact)return fail('Keep the opening and genuine contact conclusion in their supported positions.');
  if(forEdit&&Array.isArray(draft.theme?.sectionOrder)&&draft.theme.sectionOrder.length&&!same(proposed.sectionOrder,order))return fail('Preserve the owner-selected section order. A different order needs its original explicit review.');
  if(Object.entries(WEBSITE_CREATIVE_MEASURES).some(([field,values])=>!values.includes(proposed[field])))return fail('Choose supported responsive composition measures, never executable styles.');
  const prior=list(draft.creativeSpecification?.pages).find(value=>value.pageId===page.id);
  if(forEdit&&!same(prior,proposed)&&(locks.locks.includes('all')||order.some(id=>locks.locks.includes(id))))return fail('An owner-locked page cannot be redesigned. Review its locks first.');
 }
 if(forEdit){
  // Removing a previous measure also changes that page's approved design.
  for(const old of list(draft.creativeSpecification?.pages)){
   const page=pages.find(page=>page.id===old.pageId);
   if(!seen.has(old.pageId)&&(locks.locks.includes('all')||list(page?.sectionIds).some(id=>locks.locks.includes(id))))return fail('Keep the approved design of owner-locked pages.');
  }
  if(websiteCreativeSpecificationsEqual(draft.creativeSpecification,specification))return fail('This exact creative direction is already present. Nothing changed.');
 }
 return {ok:true,specification};
}

export function websiteCreativePage(draft,pageId){
 const specification=draft?.creativeSpecification;
 if(!validateWebsiteCreativeSpecification(draft,specification).ok)return null;
 const proposed=specification.pages.find(page=>page.pageId===pageId);if(!proposed)return null;
 const source=list(draft.creativeSpecificationSourceOrder).filter(page=>page?.pageId===pageId),current=list(draft.pages).find(page=>page.id===pageId);
 // Original owner section movement remains authoritative after a design is
 // kept. A saved creative order cannot fight a later explicit Studio edit.
 return source.length===1&&!same(source[0].sectionOrder,current.sectionIds)?{...proposed,sectionOrder:[...current.sectionIds]}:proposed;
}

export function deterministicWebsiteCreativeSpecification(draft,request){
 if(typeof request!=='string'||request.length>400)return {ok:false,supported:false};
 const goal=request.trim().replace(/[.!?]+$/,'');
 const supported=/^(?:keep (?:all )?my (?:words|wording) but redesign (?:the |my )?(?:whole )?website|make (?:the |my )?(?:whole )?website (?:feel more individual|look more individual|more creative|feel more premium|more impressive without (?:adding )?photographs)|give (?:the |my )?(?:whole )?website (?:a different personality|a more premium creative direction)|show me a more creative approach|try (?:a completely different approach|another full-page design)|make (?:it|the website) look amazing without photos)$/i.test(goal);
 if(!supported)return {ok:false,supported:false};
 if(!websiteCreativeSourcesCurrent(draft))return {ok:false,supported:true,reason:'Review the current approved business, service and photograph sources first.'};
 const pages=list(draft.pages).filter(page=>page.enabled!==false);
 const specification={version:WEBSITE_CREATIVE_SPECIFICATION_VERSION,pages:pages.map(page=>{
  const sections=list(page.sectionIds).map(id=>list(draft.sections).find(section=>section.id===id));
  const photographic=sections.some(section=>section?.asset||section?.storyPhoto||list(section?.contentPhotos).length);
  const words=sections.map(section=>section?.body||'').join('\n\n'),hasStory=words.split(/\n\s*\n/).filter(Boolean).length>1;
  const isDetail=!!page.sourceServiceId,isContact=page.id==='contact',isIndex=['services','products','events','gallery'].includes(page.id);
  const premium=/premium/.test(goal.toLowerCase());
  return {pageId:page.id,sectionOrder:[...list(page.sectionIds)],
   opening:isContact||isIndex?'compact':photographic?'split':'display',
   measure:isIndex||photographic?'wide':'focused',
   alignment:!isContact&&!isIndex&&(hasStory||!photographic)?'offset':'start',
   rhythm:isContact?'compact':premium&&hasStory?'generous':'balanced',
   emphasis:isContact||isDetail||page.id==='about'?'contrast':'quiet'};
 })};
 const checked=validateWebsiteCreativeSpecification(draft,specification,{forEdit:true});
 return checked.ok?{ok:true,supported:true,specification,explanation:'A coordinated direction across your existing pages, with stronger openings, considered reading widths and a clearer contact conclusion. Your words, photographs, brand and customer destinations are unchanged.'}:{...checked,supported:true};
}
