/**
 * V3.134 — exact structural and appearance operations on a PRIVATE website draft.
 * Bounded operations; no network, remote images, fabricated reviews, AI costs,
 * deployment, HTML injection, or other business' storage reads.
 */
const text=v=>typeof v==="string"?v.trim():"";
const list=x=>Array.isArray(x)?x:[];
const slug=s=>text(s).toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-+$/g,"").slice(0,52);
const fail=(draft,reason)=>({applied:false,draft,reason});
const allow={
 typography:["confident","refined","compact"],
 cardLayout:["cards","outlines","rows"],
 navStyle:["quiet","underline","pill"],
 ornament:["ripple","arch","glow","stripes"],
 spacing:["comfortable","generous","compact"],
 ctaEmphasis:["normal","strong"],
 heroSize:["medium","large","extra-large"],
 photoFocus:["center","top","bottom"],
};
function applyWebsiteLayoutOperation(draft,operation={}){
 if(!draft?.id||!Array.isArray(draft.sections))return fail(draft,"Build a website draft before changing its layout.");
 if(!operation||typeof operation!=="object"||Array.isArray(operation))return fail(draft,"Choose a website layout action.");
 const {action,sectionId}=operation;
 const sections=draft.sections.map(s=>({...s,items:list(s.items).map(i=>({...i}))}));
 const theme={...(draft.theme||{})};
 const index=sections.findIndex(s=>s.id===sectionId);
 const ready=(reason)=>({applied:true,draft:{...draft,sections,theme},reason:reason+" Only the private website draft was changed."});
 const uniqueId=(base)=>{
   let id=base,n=2;
   while(sections.some(s=>s.id===id))id=base+"-"+n++;
   return id;
 };
 const active=()=>sections.filter(s=>s.enabled!==false).map(s=>s.id);
 const order=()=>[...new Set([...list(theme.sectionOrder),...active()])]
   .filter(id=>sections.some(s=>s.id===id&&s.enabled!==false));
 if(action==="add-text"){
  const title=text(operation.title),body=text(operation.body);
  if(!title||!body||title.length>100||body.length>2500||!slug(title))
   return fail(draft,"Supply a short section heading and your own wording (up to 2,500 characters).");
  if(sections.filter(s=>s.id.startsWith("custom-")).length>=18||sections.length>=30)
   return fail(draft,"This website has reached its current extra-section limit.");
  const id=uniqueId("custom-"+slug(title));
  sections.push({id,type:"text",enabled:true,title,body});
  const ids=order().filter(x=>x!==id);
  const contact=ids.indexOf("contact");
  ids.splice(contact<0?ids.length:contact,0,id);
  theme.sectionOrder=ids;
  return ready("Added "+title+" as a new owner-written section.");
 }
 if(action==="style"){
  const {field,value}=operation;
  if(!Object.prototype.hasOwnProperty.call(allow,field)||!allow[field].includes(value))
   return fail(draft,"Choose a supported appearance setting. Arbitrary CSS or remote fonts are not allowed.");
  if(field==="photoFocus"&&!sections.some(s=>s.type==="hero"&&s.asset?.approved!==false&&text(s.asset?.storagePath)))
   return fail(draft,"Add an approved customer hero photo before changing photo crop.");
  if(field==="ctaEmphasis"&&value==="strong"&&!sections.some(s=>s.type==="hero"&&text(s.cta)&&text(s.ctaHref)))
   return fail(draft,"Add a button with a verified destination before emphasising it.");
  if(theme[field]===value)return fail(draft,"That appearance setting is already active.");
  theme[field]=value;
  return ready("Changed the website "+field+" to "+value+".");
 }
 // V3.139 independent section styles. Never accept CSS, URLs or HTML.
 // The same enumerated tokens are emitted by the concept and hosted renderers.
 if(action==="section-style"||action==="reset-section-style"){
  const matched=sections.filter(x=>x?.id===sectionId&&x?.enabled!==false);
  if(matched.length!==1)
   return fail(draft,"Choose one visible section of your website.");
  const target=matched[0];
  const fields={
   headingScale:["compact","normal","large"],
   textAlign:["left","center"],
   sectionSpacing:["compact","normal","generous"],
   photoCrop:["top","center","bottom"],
   photoSide:["left","right"],
   gallerySize:["comfortable","compact","large"]
  };
  const supports={
   headingScale:["hero","services","about","text","photo-feature","gallery","faq","testimonials","contact"],
   textAlign:["hero","services","about","text","photo-feature","gallery","faq","testimonials","contact"],
   sectionSpacing:["hero","services","about","text","photo-feature","gallery","faq","testimonials","contact"],
   photoCrop:["hero","photo-feature","gallery"],
   photoSide:["photo-feature"],
   gallerySize:["gallery"]
  };
  const existing=target.appearance&&typeof target.appearance==="object"&&!Array.isArray(target.appearance)
   ?target.appearance:{};
  if(action==="reset-section-style"){
   if(!Object.keys(existing).length)return fail(draft,"This section is already using its original design.");
   delete target.appearance;
   return ready("Restored the original look of this section.");
  }
  const field=operation.field,value=operation.value;
  if(!Object.prototype.hasOwnProperty.call(fields,field)||
     !fields[field].includes(value)||!supports[field].includes(target.type))
   return fail(draft,"Choose an available design control for this exact section.");
  if(field==="photoCrop"&&target.type!=="gallery"&&!text(target.asset?.storagePath))
   return fail(draft,"Add an approved original photo before changing its crop.");
  const before=Object.prototype.hasOwnProperty.call(existing,field)?existing[field]:"";
  if(before===value)return fail(draft,"This section already uses that setting.");
  // Discard unknown legacy metadata; never let appearance inject raw CSS.
  const next={};
  for(const name of Object.keys(fields))
   if(fields[name].includes(existing[name])&&supports[name].includes(target.type))
    next[name]=existing[name];
  const defaults={headingScale:"normal",textAlign:"left",sectionSpacing:"normal",
    photoCrop:"center",photoSide:"left",gallerySize:"comfortable"};
  if(value===defaults[field])delete next[field];else next[field]=value;
  if(Object.keys(next).length)target.appearance=next;else delete target.appearance;
  return ready("Changed just this section's "+field+".");
 }
 if(action==="choose-hero-photo"){
  const gallery=sections.find(s=>s.id==="gallery");
  const item=list(gallery?.items).find(x=>x?.storagePath===operation.storagePath&&x.approved!==false);
  if(!item||!text(operation.storagePath))
   return fail(draft,"Choose an approved photograph already saved in this website's own gallery.");
  const hero=sections.find(s=>s.id==="hero");
  if(!hero)return fail(draft,"A website hero is required to change its image.");
  hero.asset={...item};
  return ready("Selected your existing approved gallery photograph for the hero.");
 }
 // V3.138: only previously approved gallery originals can be selected.
 if(action==="choose-feature-photo"){
  const feature=sections.find(x=>x.id===sectionId&&x.type==="photo-feature");
  const gallery=sections.find(x=>x.id==="gallery");
  const item=list(gallery?.items).find(x=>text(x?.storagePath)===operation.storagePath&&
    text(x?.storagePath)&&x.approved!==false);
  if(!feature||!item)return fail(draft,"Select a photo block and a photo already approved for this business.");
  if(text(feature.asset?.storagePath)===operation.storagePath)
   return fail(draft,"This photo is already used in that block.");
  feature.asset={...item};
  return ready("Replaced the selected photo block using your approved business photo.");
 }
 if(action==="move-gallery-photo"||action==="remove-gallery-photo"){
  const gallery=sections.find(x=>x.id==="gallery"&&x.enabled!==false);
  if(sectionId!=="gallery"||!gallery)
   return fail(draft,"Select a visible gallery photo before arranging it.");
  const at=operation.photoIndex;
  if(!Number.isSafeInteger(at)||at<0||at>=list(gallery.items).length||
     gallery.items[at]?.approved===false)
   return fail(draft,"Select an approved photograph that is still in the gallery.");
  if(action==="remove-gallery-photo"){
   gallery.items.splice(at,1);
   return ready("Removed that photograph from your private website gallery. Undo is available.");
  }
  const step=operation.direction==="up"?-1:operation.direction==="down"?1:0;
  if(!step||at+step<0||at+step>=gallery.items.length)
   return fail(draft,"That photograph is already at the edge of the gallery.");
  [gallery.items[at],gallery.items[at+step]]=[gallery.items[at+step],gallery.items[at]];
  return ready("Rearranged the private gallery photographs.");
 }
 if(index<0||typeof sectionId!=="string"||!sectionId)
  return fail(draft,"Select an existing website section before changing its position or visibility.");
 const chosen=sections[index];
 if(action==="hide"||action==="show"){
  if(sectionId==="hero"||sectionId==="contact")
   return fail(draft,"Keep the main heading and customer contact section available. You can edit their details.");
  const enabled=action==="show";
  if((chosen.enabled!==false)===enabled)return fail(draft,"That section already has the chosen visibility.");
  chosen.enabled=enabled;
  if(!enabled)theme.sectionOrder=list(theme.sectionOrder).filter(id=>id!==sectionId);
  else theme.sectionOrder=[...order().filter(id=>id!==sectionId),sectionId];
  return ready((enabled?"Restored ":"Hid ")+text(chosen.title||sectionId)+".");
 }
 if(action==="duplicate"){
  if(chosen.type!=="text"||!text(chosen.body))
   return fail(draft,"Duplicate an existing text section with your own wording; other block types need dedicated controls.");
  if(sections.length>=30||sections.filter(s=>s.id.startsWith("custom-")).length>=18)
   return fail(draft,"This website has reached its extra-section limit.");
  const id=uniqueId("custom-"+slug(chosen.title||"section"));
  sections.splice(index+1,0,{id,type:"text",enabled:true,
   title:text(chosen.title).slice(0,100)+" (copy)",body:chosen.body});
  const ids=order().filter(x=>x!==id);
  ids.splice(ids.indexOf(sectionId)+1,0,id);
  theme.sectionOrder=ids;
  return ready("Duplicated "+text(chosen.title||"text")+" as editable owner content.");
 }
 if(action==="delete"){
  if(!chosen.id.startsWith("custom-")||chosen.type!=="text")
   return fail(draft,"Only additional owner-created text sections can be deleted. Hide the original website sections instead.");
  sections.splice(index,1);
  theme.sectionOrder=list(theme.sectionOrder).filter(id=>id!==sectionId);
  return ready("Deleted the extra "+text(chosen.title)+" section.");
 }
 if(action==="move"){
  if(chosen.enabled===false||sectionId==="hero")
   return fail(draft,"Show the section before moving it. The main hero must remain first.");
  const step=operation.direction==="up"?-1:operation.direction==="down"?1:0;
  if(!step)return fail(draft,"Choose Move up or Move down.");
  const ids=order().filter(id=>id!=="hero");
  const at=ids.indexOf(sectionId);
  if(at<0||at+step<0||at+step>=ids.length)
   return fail(draft,"That section is already at the end of the available positions.");
  [ids[at],ids[at+step]]=[ids[at+step],ids[at]];
  theme.sectionOrder=["hero",...ids];
  return ready("Moved "+text(chosen.title||sectionId)+" "+operation.direction+".");
 }
 return fail(draft,"Unsupported layout change. No website content was modified.");
}
export {applyWebsiteLayoutOperation,allow as websiteAppearanceOptions};
