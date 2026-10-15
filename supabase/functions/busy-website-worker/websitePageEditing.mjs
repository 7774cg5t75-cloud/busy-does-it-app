import {protectWebsiteOwnerLocks} from "./websiteOwnerLocks.mjs";
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
  const by=action.direction==="up"?-1:action.direction==="down"?1:0;
  if(!by||at<0||at+by<0||at+by>=page.sectionIds.length)
   return fail(draft,"Choose a page section that can move up or down.");
  [page.sectionIds[at],page.sectionIds[at+by]]=[page.sectionIds[at+by],page.sectionIds[at]];
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
