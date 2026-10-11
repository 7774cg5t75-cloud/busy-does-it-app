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
};
const itemSections=new Set(["services","faq","testimonials"]);
const bounds={title:140,body:2500,cta:120,ctaHref:120,phone:40,email:254,openingHours:250};
const fail=(reason,draft)=>({applied:false,reason,draft});
function editWebsiteDraftField(draft,change={}){
 if(!draft?.id||!Array.isArray(draft?.sections))
  return fail("Build a private website draft before editing its content.",draft);
 if(!change||typeof change!=="object"||Array.isArray(change))
  return fail("Choose a website field to edit.",draft);
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
   ...s,items:list(s.items).map(item=>item.id===itemId?{...item,[field]:newValue}:item)
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
export {editWebsiteDraftField,fieldChoices};
