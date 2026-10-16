import {validPublicBusinessContent} from './businessContentRecords.mjs';
import {protectWebsiteOwnerLocks} from "./websiteOwnerLocks.mjs";
/**
 * Owner-directed structured website copy edits (V3.133).
 * No AI call, public publish, remote URL, invented facts or media mutation.
 * Only edits existing private draft fields by stable section/item IDs.
 *
 * The caller must rebuild the draft to regenerate HTML, SEO and the visual
 * review, then offer undo/redo and explicit owner-controlled publishing.
 */
const clean=value=>typeof value==="string"?value.replace(/\r\n?/g,"\n").trim():"";
const list=value=>Array.isArray(value)?value:[];
const fieldChoices={
 hero:["title","body","cta","ctaHref"],
 services:["title"],
 faq:["title"],
 testimonials:["title"],
 gallery:["title"],
 contact:["title","body","phone","email","openingHours"],
 text:["title","body"],
 "photo-feature":["title","body"],
};
const itemSections=new Set(["services","faq","testimonials"]);
const bounds={title:140,body:2500,cta:120,ctaHref:120,phone:40,email:254,openingHours:250};
const fail=(reason,draft)=>({applied:false,reason,draft});
const collectionKinds=new Set(["services","faq","testimonials"]);
const publicWord=(s,max,required=false)=>typeof s==="string"&&s.length<=max&&
 !/[<>\u0000-\u001f\u007f]/.test(s)&&(!required||!!s.trim());
function editWebsiteDraftCollectionUnchecked(draft,change={}){
 const permitted=new Set(["kind","action","sectionId","title","body","itemId","expectedTitle","direction"]);
 if(!change||typeof change!=="object"||Array.isArray(change)||
   Object.keys(change).some(k=>!permitted.has(k))||
   !["add-item","remove-item","move-item","create-collection"].includes(change.action)||
   typeof change.sectionId!=="string")
  return fail("Choose a supported FAQ or service entry.",draft);
 if(change.action==="create-collection"){
  if(!collectionKinds.has(change.sectionId)||
    draft.sections.some(s=>s?.id===change.sectionId)||
    typeof change.title!=="string"||!publicWord(change.title,140,true)||
    typeof change.body!=="string"||!publicWord(change.body,1200,true)||
    change.direction!==undefined||change.itemId!==undefined||
    change.expectedTitle!==undefined)return fail(
      "Choose a missing FAQ or Services section and give its first entry owner-written wording.",draft);
  const title=clean(change.title),body=clean(change.body);
  const id="owner-"+title.toLowerCase().replace(/[^a-z0-9]+/g,"-")
    .replace(/^-+|-+$/g,"").slice(0,55);
  if(id==="owner-")return fail("Use a name or question with letters or numbers.",draft);
  const section={id:change.sectionId,type:change.sectionId,enabled:true,
    title:change.sectionId==="faq"?"Frequently asked questions":change.sectionId==="testimonials"?"What customers say":"What we do",
    body:"",items:[{id,title,body}],ownerEditedItems:true};
  return {applied:true,draft:{...draft,sections:[...draft.sections,section]},
    reason:"Created a new PRIVATE "+change.sectionId+" section with an owner-written entry. Nothing was published.",
    privateOnly:true};
 }
 const matches=draft.sections.filter(s=>s?.id===change.sectionId);
 if(matches.length!==1||!collectionKinds.has(matches[0]?.type)||
   matches[0].enabled===false)return fail("Choose an active Services or FAQ section.",draft);
 const section=matches[0];
 const items=list(section.items);
 if(items.length>30||items.some(i=>!i||typeof i.id!=="string"||!i.id))
  return fail("The existing entries need reviewing before editing.",draft);
 let next;
 if(change.action==="add-item"){
  const title=clean(change.title),body=clean(change.body);
  if(!publicWord(change.title,140,true)||!publicWord(change.body,1200,true)||
    change.itemId!==undefined||change.expectedTitle!==undefined||
    items.length>=30||
    items.some(x=>clean(x.title).toLocaleLowerCase("en")===title.toLocaleLowerCase("en")))
   return fail("Enter a unique name or question and its wording, up to 30 entries.",draft);
  const base="owner-"+title.toLowerCase().replace(/[^a-z0-9]+/g,"-")
    .replace(/^-+|-+$/g,"").slice(0,55);
  if(base==="owner-")return fail("Use an entry name with letters or numbers.",draft);
  let id=base,n=2;
  while(items.some(x=>x.id===id)){id=base+"-"+n++;if(n>32)return fail("Too many matching entries.",draft);}
  next=[...items,{id,title,body}];
 }else if(change.action==="move-item"){
  if(typeof change.itemId!=="string"||!change.itemId||
    typeof change.expectedTitle!=="string"||
    !["up","down"].includes(change.direction)||
    change.title!==undefined||change.body!==undefined)
   return fail("Choose an exact FAQ or service and a direction.",draft);
  const index=items.findIndex(i=>i.id===change.itemId&&i.title===change.expectedTitle);
  if(index<0||items.filter(i=>i.id===change.itemId).length!==1)
   return fail("That entry has changed. Select it again.",draft);
  const to=index+(change.direction==="up"?-1:1);
  if(to<0||to>=items.length)return fail("That entry is already at the end of the list.",draft);
  next=[...items];const [moved]=next.splice(index,1);next.splice(to,0,moved);
 }else{
  if(typeof change.itemId!=="string"||!change.itemId||
    typeof change.expectedTitle!=="string"||
    change.title!==undefined||change.body!==undefined||change.direction!==undefined)
   return fail("Choose an exact existing entry to remove.",draft);
  const matching=items.filter(i=>i.id===change.itemId);
  if(matching.length!==1||matching[0].title!==change.expectedTitle)
   return fail("That entry has changed. Select it again before removing.",draft);
  next=items.filter(i=>i.id!==change.itemId);
 }
 const sections=draft.sections.map(x=>x!==section?x:{...x,items:next,ownerEditedItems:true});
 return {applied:true,draft:{...draft,sections},
  reason:(change.action==="add-item"?"Added":change.action==="move-item"?"Moved":"Removed")+
    " an entry in the PRIVATE "+section.type+" section. Nothing was published.",
  privateOnly:true};
}

function editWebsiteDraftFieldUnchecked(draft,change={}){
 if(!draft?.id||!Array.isArray(draft?.sections))
  return fail("Build a private website draft before editing its content.",draft);
 if(!change||typeof change!=="object"||Array.isArray(change))
  return fail("Choose a website field to edit.",draft);
 if(['content-section','remove-content-section'].includes(change.action)){
  if(!['products','events'].includes(change.sectionId)||Object.keys(change).some(k=>!['kind','action','sectionId','title','layout','featuredId','previewFeed'].includes(k)))return fail('Choose a supported shared-content section.',draft);
  const found=draft.sections.filter(s=>s.id===change.sectionId);
  if(found.length>1||found.some(s=>s.contentSource!=='business_records_v1'))return fail('Review the existing section before replacing it.',draft);
  let sections=draft.sections;
  if(change.action==='remove-content-section'&&!found.length)return fail('That shared-content section is not present.',draft);
  if(change.action==='remove-content-section')sections=sections.filter(s=>s.id!==change.sectionId);
  else{
   if(!publicWord(change.title,80,true)||!['cards','rows'].includes(change.layout)||change.featuredId!==undefined&&change.featuredId!==''&&!/^[a-zA-Z0-9_-]{12,80}$/.test(change.featuredId))return fail('Choose the section heading, layout and optional featured record.',draft);
   if(change.previewFeed!==undefined&&(!validPublicBusinessContent(change.previewFeed)||change.previewFeed.businessId!==(draft.businessId||draft.business_id)))return fail('The approved record snapshot belongs to another business.',draft);
   const section={...change.previewFeed?{previewFeed:change.previewFeed}:{},id:change.sectionId,type:change.sectionId,title:change.title,enabled:true,contentSource:'business_records_v1',contentLayout:change.layout,featuredId:change.featuredId||''};
   sections=found.length?sections.map(s=>s.id===section.id?section:s):[...sections,section];
  }
  return {applied:true,draft:{...draft,sections},privateOnly:true,reason:'Updated the private shared-record section. Nothing was published.'};
 }
 if(["add-item","remove-item","move-item","create-collection"].includes(change.action))
  return editWebsiteDraftCollection(draft,change);
 const {sectionId,itemId,field,value}=change;
 if(typeof sectionId!=="string"||!sectionId||typeof field!=="string"||!(field in bounds)||
    typeof value!=="string")
  return fail("Choose an existing field and enter its replacement text.",draft);
 if(value.length>bounds[field])return fail("That field is too long. Shorten it and try again.",draft);
 const sectionMatches=draft.sections.filter(s=>s?.id===sectionId);
 if(sectionMatches.length!==1)return fail("That website section is missing or ambiguous.",draft);
 const section=sectionMatches[0];
 const allowed=fieldChoices[section.type]||[];
 const newValue=clean(value);
 let sections,description;
 if(itemId!==undefined&&itemId!==null){
  if(typeof itemId!=="string"||!itemId||!itemSections.has(section.type)||
     !["title","body"].includes(field))
   return fail("That individual item field cannot be edited here.",draft);
  const matches=list(section.items).filter(item=>item?.id===itemId);
  if(matches.length!==1)return fail("The selected item could not be matched uniquely. Nothing was changed.",draft);
  if(field==="title"&&!newValue&&section.type!=="testimonials")
   return fail("Service names and questions cannot be blank.",draft);
  if(field==="body"&&!newValue&&section.type==="testimonials")
   return fail("Testimonial wording cannot be blank. You may remove it through the dedicated controls.",draft);
  if(newValue===clean(matches[0][field]))return fail("That text is already saved.",draft);
  sections=draft.sections.map(s=>s!==section?s:{
   ...s,...(collectionKinds.has(section.type)?{ownerEditedItems:true}:{}),
   items:list(s.items).map(item=>item.id===itemId?{...item,[field]:newValue}:item)
  });
  description="Updated "+section.type+" item "+field+" in your private website draft.";
 }else{
  if(!allowed.includes(field))return fail("That section does not support editing this field.",draft);
  if(field==="title"&&!newValue)return fail("A section heading cannot be blank.",draft);
  if(field==="email"&&newValue&&!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(newValue))
   return fail("Enter a valid public contact email address or leave it blank.",draft);
  if(field==="phone"&&newValue&&!/^[+()\d .-]{5,40}$/.test(newValue))
   return fail("Enter a phone number using only digits, spaces, +, brackets and hyphens.",draft);
  if(field==="ctaHref"&&newValue){
   if(!/^#[a-z][a-z0-9-]*$/i.test(newValue)||
      (newValue!=="#main"&&!draft.sections.some(s=>s?.id===newValue.slice(1)&&s?.enabled!==false)))
    return fail("Choose an existing page section, e.g. #services or #contact. External links require separate review.",draft);
  }
  if(field==="cta"&&newValue&&!clean(section.ctaHref))
   return fail("Add a valid button destination before giving the button a label.",draft);
  if(newValue===clean(section[field]))return fail("That text is already saved.",draft);
  sections=draft.sections.map(s=>s!==section?s:{...s,[field]:newValue});
  description="Updated "+sectionId+" "+field+" in your private website draft.";
 }
 return {applied:true,reason:description+" Nothing has been published.",draft:{...draft,sections}};
}
export {editWebsiteDraftField,editWebsiteDraftCollection,fieldChoices};

function editWebsiteDraftField(draft,change){return protectWebsiteOwnerLocks(draft,editWebsiteDraftFieldUnchecked(draft,change));}

function editWebsiteDraftCollection(draft,change){return protectWebsiteOwnerLocks(draft,editWebsiteDraftCollectionUnchecked(draft,change));}
