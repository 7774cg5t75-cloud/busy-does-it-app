/**
 * V3.135 open, owner-directed website content transfer.
 * Not a live-site export: images, domains, DNS, interactive forms and
 * customer records are deliberately NOT included or represented as portable.
 * JSON is designed to be human-readable and transferable without credentials.
 */
import {websiteCreativeDocumentSection,websiteCreativeDocumentPageModel} from '../../supabase/functions/busy-website-worker/websiteCreativeDocument.mjs';
const clean=v=>typeof v==="string"?v.trim():"";
const list=v=>Array.isArray(v)?v:[];
const scalar=(v,n)=>clean(v).slice(0,n);
const fields=(obj,keys)=>Object.fromEntries(keys.map(([key,n])=>[key,scalar(obj?.[key],n)]));
function publicSection(section={},draft){
 if(section.type==='creative-document'){
  const composition=websiteCreativeDocumentSection(draft,section);
  // Validation precedes traversal; only bounded trusted node fields leave the
  // owner export. Private source records and storage identities stay private.
  if(!composition)return null;
  const media=[];
  const nodeSource=node=>{
   const result={...node};
   for(const key of ['copyId','altCopyId','itemCopyIds'])delete result[key];
   for(const key of ['copy','alt'])if(result[key])result[key]={text:result[key].text,classification:result[key].classification};
   if(result.items)result.items=result.items.map(copy=>({text:copy.text,classification:copy.classification}));
   if(result.asset){
    const inventory={label:scalar(node.alt?.text||'Owner-approved website photograph',140),originalFileRequired:true};
    media.push(inventory);result.asset={...inventory};
   }
   if(result.children)result.children=result.children.map(nodeSource);
   return result;
  };
  return {id:scalar(section.id,100),type:'creative-document',enabled:section.enabled!==false,
   layout:composition.layout,nodes:composition.nodes.map(nodeSource),media};
 }
 const type=["hero","services","faq","testimonials","gallery","contact","text","photo-feature"].includes(section.type)?section.type:"text";
 const base={id:scalar(section.id,80),type,enabled:section.enabled!==false,
  ...fields(section,[["title",140],["body",2500]])};
 if(type==="hero")Object.assign(base,fields(section,[["cta",120],["ctaHref",120]]));
 if(type==="contact")Object.assign(base,fields(section,[["phone",40],["email",254],["openingHours",250]]));
 if(["services","faq","testimonials"].includes(type)){
  base.items=list(section.items).slice(0,80).map(item=>({
    id:scalar(item?.id,80),...fields(item,[["title",140],["body",2500]])}));
 }
 if(["hero","photo-feature"].includes(type)&&section.asset||type==="gallery"&&list(section.items).length){
  // Export inventories rather than private storage paths, signed URLs or
  // server-specific credentials. Photos must be supplied by their owner.
  const assets=["hero","photo-feature"].includes(type)?[section.asset]:list(section.items);
  base.media=assets.filter(Boolean).slice(0,80).map((asset,i)=>({
   label:scalar(asset?.alt||asset?.name||"Customer photograph "+(i+1),140),
   originalFileRequired:true
  }));
 }
 return base;
}
function buildPortableWebsiteSource(draft={}){
 if(!draft?.id||!Array.isArray(draft.sections))return {ok:false,reason:"Build a website draft before exporting its content."};
 const creativeModel=draft.creativeDocumentPageModel?websiteCreativeDocumentPageModel(draft):null;
 if(draft.creativeDocumentPageModel&&!creativeModel)return {ok:false,reason:'Review the current creative design and approved sources before exporting.'};
 if(draft.sections.length>150||draft.sections.some(section=>
  ["services","faq","testimonials"].includes(section?.type)&&list(section.items).length>80||
  section?.type==="gallery"&&list(section.items).length>80))
  return {ok:false,reason:"Your website has too much content for this early text export. A complete file archive exporter is still needed."};
 const pages=list(draft.pages).filter(p=>p?.enabled!==false).map(p=>({
  id:scalar(p.id,80),title:scalar(p.title,80),
  path:scalar(p.path,100),outputPath:scalar(p.outputPath,140),
  sectionIds:list(p.sectionIds).filter(x=>typeof x==="string").slice(0,30)
 }));
 const sections=draft.sections.slice(0,150).map(section=>publicSection(section,draft));
 if(sections.some(section=>!section))return {ok:false,reason:'A creative composition or its approved source changed. Review it before exporting.'};
 const payload={
  format:"busy-does-it-portable-website-source",
  schemaVersion:1,
  scope:"Customer-approved public website content and design choices only",
  business:fields(draft,[["businessName",140],["businessType",120],["serviceArea",160],["description",1200],["brandLabel",140]]),
  pages,sections,
  theme:Object.fromEntries(["mood","primary","secondary","spacing","heroSize",
   "designFamily","heroLayout","cardLayout","navStyle","ornament",
   "typography","ctaEmphasis","photoFocus"].filter(key=>
    typeof draft.theme?.[key]==="string"&&draft.theme[key].length<=100)
   .map(key=>[key,draft.theme[key]])),
  sectionOrder:list(draft.designPlan?.sectionOrder)
   .filter(id=>typeof id==="string").slice(0,150),
  seo:{pages:Object.fromEntries(pages.map(page=>[page.id,{
   title:scalar(draft.seo?.pages?.[page.id]?.title,70),
   description:scalar(draft.seo?.pages?.[page.id]?.description,160)
  }]))},
  limitations:[
   "This is an editable website CONTENT AND DESIGN SOURCE export, not a turnkey live website.",
   "Photographs and other media files are not embedded; supply the original files separately.",
   "Cloud hosting, domains, DNS, server-based forms, booking integrations, payments, customer records and authentication are not exported.",
   "No subscriptions, API credentials, tenant storage paths, private URLs or secrets are included.",
   "Review public phone numbers, email addresses and supplied text before sharing this file."
  ]
 };
 if(creativeModel)payload.creativeDesign={version:creativeModel.version,brand:creativeModel.brand,
  navigation:creativeModel.navigation,navigationPresentation:creativeModel.navigationPresentation,
  copyAuthority:'Reviewed presentation wording; not a canonical business-fact record',
  fontAvailability:'Platform fonts and compatible fallbacks; exact installed font availability varies by device'};
 const json=JSON.stringify(payload,null,2);
 if(json.length>85000)return {ok:false,
  reason:"This website is too large for a reliable phone text share. A file-based archive export is still needed.",bytes:json.length};
 return {ok:true,json,bytes:json.length,
  fileName:(scalar(draft.businessName,80).toLowerCase().replace(/[^a-z0-9]+/g,"-")||"website")+"-content.json",
  pages:pages.length,missingMedia:sections.reduce((total,s)=>total+(s.media?.length||0),0),
  limitations:payload.limitations};
}
export {buildPortableWebsiteSource};
