import {editWebsiteDraftField} from './websiteStructuredEditing.mjs';
import {wholeSitePageSpecs,wholeSiteBasePageIds,wholeSiteDerivedSourcesCurrent,wholeSiteContentCurrent,wholeSiteOperationCount,wholeSiteMenuMove} from './websiteWholeSite.mjs';
import {protectWebsiteOwnerLocks,websiteOwnerLocks} from "./websiteOwnerLocks.mjs";
/**
 * V3.135 owner-managed custom website pages.
 * Pure, deterministic, private draft only. Uses paths under /pages/
 * to avoid collisions with core routes and never accepts raw URL paths.
 */
const clean=v=>typeof v==="string"?v.trim():"";
const list=v=>Array.isArray(v)?v:[];
const slug=v=>clean(v).normalize("NFKD").toLowerCase().replace(/[\u0300-\u036f]/g,"")
 .replace(/&/g,"-and-").replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"").slice(0,55).replace(/-+$/,"");
const fail=(draft,reason)=>({applied:false,draft,reason});
function editWebsitePagesUnchecked(draft={},action={}){
 if(!draft?.id||!Array.isArray(draft.sections))return fail(draft,"Build a private website draft first.");
 if(!action||typeof action!=="object"||Array.isArray(action))return fail(draft,"Choose a page action.");
 if(['compose-service-pages','refine-site-pages','update-site-contact'].includes(action.action)){
  const allowed=['kind','action','expectedWebsiteId','expectedGeneration','expectedBusinessId','expectedProfileRevision',...(action.action==='compose-service-pages'?['serviceIds']:action.action==='update-site-contact'?['field','value']:['direction'])];
  if(Object.keys(action).some(k=>!allowed.includes(k))||action.expectedWebsiteId!==draft.id||action.expectedGeneration!==draft.generation||!draft.businessId||action.expectedBusinessId!==draft.businessId||action.expectedProfileRevision!=null&&(!Number.isSafeInteger(action.expectedProfileRevision)||action.expectedProfileRevision<1)||draft.business_id&&draft.business_id!==draft.businessId)
   return fail(draft,'The owner business or website changed. Prepare a fresh whole-site review.');
  if(!wholeSiteContentCurrent(draft))return fail(draft,'Review current approved menu/product/event information before a complete-site change.');
  if(!wholeSiteDerivedSourcesCurrent(draft))return fail(draft,'A service changed or was removed. Review its related pages in the original Studio; your wording was kept.');
  if(Object.hasOwn(draft,'sitePresentation')&&draft.sitePresentation!=='purposeful-v1')return fail(draft,'This website uses a newer presentation. Its approved design was kept; use a compatible original editor.');
  if(action.action==='update-site-contact'){
   if(!['email','phone'].includes(action.field)||typeof action.value!=='string'||!action.value.trim())return fail(draft,'Choose one exact contact email address or phone number.');
   return editWebsiteDraftField(draft,{sectionId:'contact',field:action.field,value:action.value});
  }
  if(action.action==='refine-site-pages'){
   if(['purposeful','menu-first'].includes(action.direction)){
    const locks=websiteOwnerLocks(draft);if(!locks.ok||locks.locks.length)return fail(draft,'Review the website section locks before changing the whole-site presentation. Your current design was kept.');
    if(action.direction==='purposeful'&&draft.sitePresentation==='purposeful-v1'||action.direction==='menu-first'&&!wholeSiteMenuMove(draft,{explicit:true}))return fail(draft,'This supported presentation is already present, or there is no current approved menu on Home. Nothing changed.');
    return {applied:true,draft:{...draft,sitePresentation:'purposeful-v1'},reason:action.direction==='menu-first'?'Prepared the exact approved menu as the first supporting section.':'Prepared clearer page purposes, source-grounded service gateways, story and navigation. Your words, fonts, colours and photographs were kept.'};
   }
   if(!['premium','services','mobile'].includes(action.direction))return fail(draft,'Choose a supported inner-page refinement.');
   const targets=new Set(list(draft.customPages).filter(p=>p.sourceServiceId).flatMap(p=>p.sectionIds||[]));
   if(!targets.size||targets.size>10)return fail(draft,'Prepare current service pages before refining them.');
   let changed=0;
   const sections=draft.sections.map((s,index)=>{
    if(!targets.has(s.id))return s;
    const field=action.direction==='mobile'?'mobileBodyScale':s.type==='photo-feature'?'desktopPhotoSide':'readingLayout';
    const value=action.direction==='mobile'?'large':s.type==='photo-feature'?(s.appearance?.desktopPhotoSide==='left'?'right':'left'):action.direction==='premium'?'editorial':index%2?'feature-chapters':'chapters';
    if(s.appearance?.[field]===value)return s;changed++;return {...s,appearance:{...s.appearance,[field]:value}};
   });
   return changed?{applied:true,draft:{...draft,sections},reason:'Prepared a bounded inner-page design change; original words, brand and customer destinations are preserved.'}:fail(draft,'These supported settings are already present. Nothing changed.');
  }
  const proposed=wholeSitePageSpecs(draft,action.serviceIds);if(!proposed.ok)return fail(draft,proposed.reason);
  const locks=websiteOwnerLocks(draft),adoptPresentation=locks.ok&&!locks.locks.length;
  const purposeful=draft.sitePresentation==='purposeful-v1'||adoptPresentation;
  if(adoptPresentation&&wholeSiteOperationCount(draft,action.serviceIds)>10)return fail(draft,'Prepare fewer service pages in this one review. No source or existing page was removed.');
  if(wholeSiteBasePageIds(draft).length+list(draft.customPages).length+proposed.specs.length>10||list(draft.customPages).length+proposed.specs.length>8||draft.sections.length+proposed.specs.reduce((n,p)=>n+1+(!purposeful&&p.detail?1:0),0)>30)
   return fail(draft,'This site needs a smaller supported scope. No pages or wording were removed.');
  let working={...draft,siteComposition:'connected-pages-v1',...(adoptPresentation?{sitePresentation:'purposeful-v1'}:{})};
  for(const spec of proposed.specs){
   const purposeful=working.sitePresentation==='purposeful-v1';
   const created=editWebsitePagesUnchecked(working,{action:'create-page',title:spec.title,body:purposeful?spec.sourceServiceSnapshot.body:spec.opening});if(!created.applied)return fail(draft,created.reason);working=created.draft;
   const p=working.customPages.at(-1);p.sourceServiceId=spec.serviceId;p.sourceServiceSnapshot={...spec.sourceServiceSnapshot};
   const section=working.sections.find(s=>s.id===p.sectionIds[0]);
   if(spec.photo){section.type='photo-feature';section.asset={...spec.photo};section.appearance={...spec.photo.appearance,desktopPhotoSide:proposed.specs.indexOf(spec)%2?'right':'left'};}
   else section.appearance={readingLayout:'editorial'};
   if(spec.detail&&!purposeful){const extra=editWebsitePagesUnchecked(working,{action:'add-page-section',pageId:p.id,title:'A closer look',body:spec.detail});if(!extra.applied)return fail(draft,extra.reason);working=extra.draft;working.sections.find(s=>s.id===working.customPages.find(x=>x.id===p.id).sectionIds.at(-1)).appearance={readingLayout:'feature-chapters'};}
  }
  // Five page creations plus five optional details is the original ten-change bound.
  return {applied:true,draft:working,reason:'Prepared source-grounded service pages as one private Studio revision. Existing owner pages and copy were kept.'};
 }
 if(['edit-page-metadata','reset-page-metadata'].includes(action.action)){
  if(action.expectedWebsiteId!==draft.id||action.expectedGeneration!==draft.generation)return fail(draft,'The website changed. Select the page again before editing its search details.');
  if(typeof action.pageId!=='string'||!/^(?:home|services|about|gallery|faq|contact|products|events|page-[a-z0-9][a-z0-9-]{1,68})$/.test(action.pageId))return fail(draft,'Choose a supported page identifier.');
  const target=list(draft.pages).find(p=>p.id===action.pageId&&p.enabled!==false);
  if(!target)return fail(draft,'Choose a current website page.');
  const locks=websiteOwnerLocks(draft);
  if(!locks.ok||locks.locks.includes('all')||list(target.sectionIds).some(id=>locks.locks.includes(id)))return fail(draft,'Review the page section locks before changing its search details.');
  const old=draft.seo?.ownerPages;
  if(old!==undefined&&(!old||typeof old!=='object'||Array.isArray(old)||Object.keys(old).length>14))return fail(draft,'Review the existing page search details first.');
  const ownerPages={...old};
  if(action.action==='reset-page-metadata'){
   if(!Object.prototype.hasOwnProperty.call(ownerPages,action.pageId))return fail(draft,'This page already uses automatic search details.');
   delete ownerPages[action.pageId];
  }else{
   const safe=(v,max)=>typeof v==='string'&&!!v.trim()&&v.length<=max&&!/[<>\u0000-\u001f\u007f]/.test(v);
   if(!safe(action.title,70)||!safe(action.description,160))return fail(draft,'Use an accurate title up to 70 characters and description up to 160 characters.');
   ownerPages[action.pageId]={title:action.title.trim(),description:action.description.trim()};
  }
  return {applied:true,draft:{...draft,seo:{...draft.seo,ownerPages}},reason:'Updated owner-written search details in the private draft. Public search results are not verified.'};
 }
 const pages=list(draft.customPages).map(p=>({...p,sectionIds:[...list(p.sectionIds)]}));
 const sections=draft.sections.map(s=>({...s}));
 const sectionBy=id=>sections.find(s=>s.id===id);
 const change=(reason)=>({applied:true,reason:reason+" Only the private website draft changed.",
  draft:{...draft,customPages:pages,sections}});
 const page=pages.find(p=>p.id===action.pageId);
 if(action.action==="create-page"){
  const title=clean(action.title),body=clean(action.body);
  if(!title||title.length>80||!body||body.length>2500)
   return fail(draft,"Provide a page title (up to 80 characters) and your exact introductory wording (up to 2,500 characters).");
  if(pages.length>=8)return fail(draft,"This website currently supports up to eight customer-created pages.");
  const root=slug(title);
  if(!root||root.length<2)return fail(draft,"Choose a descriptive page title using letters or numbers.");
  let safe=root,n=2;
  while(pages.some(p=>p.slug===safe)||sections.some(s=>s.id==="custom-page-"+safe)){
   safe=root+"-"+n++;
   if(n>100)return fail(draft,"Please choose a different title.");
  }
  const id="page-"+safe,sectionId="custom-page-"+safe;
  const section={id:sectionId,type:"text",enabled:true,pageOnly:true,title,body};
  sections.push(section);
  pages.push({id,slug:safe,title,sectionIds:[sectionId]});
  return change("Created an editable page at /pages/"+safe+" with owner-written content.");
 }
 if(!page)return fail(draft,"Choose an existing customer-created page.");
 if(action.action==="rename-page"){
  const title=clean(action.title);
  if(!title||title.length>80)return fail(draft,"Give the page a title of 1–80 characters.");
  if(title===page.title)return fail(draft,"That page title is already saved.");
  // Keep the public URL stable to preserve backlinks and cached versions.
  page.title=title;
  return change("Renamed the page without changing its URL.");
 }
 if(action.action==="add-page-section"){
  const title=clean(action.title),body=clean(action.body);
  if(!title||!body||title.length>100||body.length>2500)
   return fail(draft,"Add your own section heading and copy within the size limits.");
  if(sections.length>=40||page.sectionIds.length>=12)
   return fail(draft,"This page has reached its current section limit.");
  const root="custom-page-"+page.slug+"-"+slug(title);
  if(!slug(title))return fail(draft,"Use a descriptive section heading.");
  let id=root,n=2;
  while(sections.some(s=>s.id===id))id=root+"-"+n++;
  sections.push({id,type:"text",enabled:true,pageOnly:true,title,body});
  page.sectionIds.push(id);
  return change("Added owner-written content to "+page.title+".");
 }
 if(action.action==="add-photo-feature"){
  const title=clean(action.title),body=clean(action.body),photo=clean(action.storagePath);
  const gallery=sections.find(x=>x.type==="gallery"&&x.enabled!==false);
  const asset=list(gallery?.items).find(a=>a?.approved!==false&&
    clean(a.storagePath)===photo&&photo);
  if(!title||title.length>100||body.length>2500||!body)
    return fail(draft,"Add a photo feature heading and your own short description.");
  if(!asset)return fail(draft,"Choose an already approved photograph from this website's own gallery.");
  if(sections.length>=40||page.sectionIds.length>=12)
    return fail(draft,"This page has reached its current section limit.");
  const root="custom-page-"+page.slug+"-"+slug(title);
  if(!slug(title))return fail(draft,"Use a descriptive feature heading.");
  let id=root,n=2;
  while(sections.some(s=>s.id===id))id=root+"-"+n++;
  sections.push({id,type:"photo-feature",enabled:true,pageOnly:true,
    title,body,asset:{...asset}});
  page.sectionIds.push(id);
  return change("Added an approved photo-and-copy feature to "+page.title+".");
 }
 if(action.action==="assign-section"){
  const id=action.sectionId,section=sectionBy(id);
  if(!section||section.enabled===false||!section.id.startsWith("custom-")||section.type!=="text")
   return fail(draft,"Only enabled owner-created text sections can be assigned. Original business blocks stay protected.");
  if(page.sectionIds.includes(id))return fail(draft,"That section is already on this page.");
  if(page.sectionIds.length>=12)return fail(draft,"This page has reached its section limit.");
  // Explicitly move, not duplicate: owner can always restore from another page.
  const previousPages=pages.filter(p=>p.sectionIds.includes(id));
  if(previousPages.some(p=>p.sectionIds.length<=1))
   return fail(draft,"That section is the only content on another page. Add a replacement section there first.");
  previousPages.forEach(p=>p.sectionIds=p.sectionIds.filter(x=>x!==id));
  page.sectionIds.push(id);
  section.pageOnly=true;
  return change("Moved "+section.title+" into "+page.title+".");
 }
 if(action.action==="remove-page-section"){
  const id=action.sectionId;
  if(!page.sectionIds.includes(id))return fail(draft,"That section is not on this page.");
  if(page.sectionIds.length<=1)return fail(draft,"Keep at least one section on a page.");
  const section=sectionBy(id);
  if(!section||!["text","photo-feature"].includes(section.type))return fail(draft,"Only your own text and photo feature sections can be moved home.");
  page.sectionIds=page.sectionIds.filter(x=>x!==id);
  section.pageOnly=false; // Keep the customer's content on the home page.
  return change("Moved the section back to the home page without deleting it.");
 }
 if(action.action==="move-page-section"){
  const id=action.sectionId,at=page.sectionIds.indexOf(id);
  if(action.expectedWebsiteId!==undefined&&(action.expectedWebsiteId!==draft.id||action.expectedGeneration!==draft.generation))
   return fail(draft,"The website changed. Review the current section order first.");
  if(page.sectionIds.filter(x=>x===id).length!==1||!sectionBy(id))return fail(draft,"Choose one unambiguous current page section.");
  const target=action.direction==="up"?at-1:action.direction==="down"?at+1:action.direction==="first"?0:action.direction==="last"?page.sectionIds.length-1:-1;
  if(at<0||target<0||target>=page.sectionIds.length||target===at)
   return fail(draft,"Choose a page section that can move to another position.");
  page.sectionIds.splice(at,1);page.sectionIds.splice(target,0,id);
  return change("Changed the order of sections on "+page.title+".");
 }
 if(action.action==="delete-page"){
  pages.splice(pages.indexOf(page),1);
  for(const id of page.sectionIds){
   const section=sectionBy(id);
   if(section&&!pages.some(p=>p.sectionIds.includes(id)))section.pageOnly=false;
  }
  return change("Removed the page. Its wording was preserved as private home-page sections.");
 }
 return fail(draft,"Unsupported page operation. Nothing was changed.");
}
export {editWebsitePages};

function editWebsitePages(draft,change){return protectWebsiteOwnerLocks(draft,editWebsitePagesUnchecked(draft,change));}
