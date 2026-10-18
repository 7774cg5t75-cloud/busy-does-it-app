import {photographicCount} from './designPlanner.mjs';
import {websiteLayoutLockReason,protectWebsiteOwnerLocks} from "./websiteOwnerLocks.mjs";
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
 typography:["confident","refined","compact","editorial","friendly"],
 cardLayout:["cards","outlines","rows"],
 navStyle:["quiet","underline","pill"],
 ornament:["ripple","arch","glow","stripes"],
 spacing:["comfortable","generous","compact"],
 ctaEmphasis:["normal","strong"],
 heroSize:["medium","large","extra-large"],
 heroLayout:["type-left","type-center","type-right","type-poster","image-right","image-left","image-frame","image-feature"],
 photoFocus:["center","top","bottom"],
};
function applyWebsiteLayoutOperationUnchecked(draft,operation={}){
 if(!draft?.id||!Array.isArray(draft.sections))return fail(draft,"Build a website draft before changing its layout.");
 if(!operation||typeof operation!=="object"||Array.isArray(operation))return fail(draft,"Choose a website layout action.");
 const lockReason=websiteLayoutLockReason(draft,operation);
 if(lockReason)return fail(draft,lockReason);
 const {action,sectionId}=operation;
 const sections=draft.sections.map(s=>({...s,...(Array.isArray(s.items)?{items:s.items.map(i=>({...i}))}:{})}));
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
 // V3.211: ONE atomic, reversible private reordering from an owner-reviewed
 // universal-builder plan. Caller must pass the exact observed draft revision
 // and exact before-order. No untrusted CSS, content, new sections or services.
 if(action==="apply-reviewed-composition"){
  const allowedFields=["kind","action","websiteId","expectedGeneration",
   "expectedBusinessId","before","proposed"];
  if(Object.keys(operation).some(key=>!allowedFields.includes(key))||
    typeof operation.websiteId!=="string"||operation.websiteId!==draft.id||
    typeof operation.expectedBusinessId!=="string"||
    !operation.expectedBusinessId||operation.expectedBusinessId.length>128||
    !Number.isSafeInteger(operation.expectedGeneration)||
    operation.expectedGeneration!==draft.generation||
    (typeof draft.businessId==="string"&&draft.businessId&&
      operation.expectedBusinessId!==draft.businessId))
   return fail(draft,"The reviewed website version or business changed. Review the latest draft first.");
  const activeIds=active();
  // The visible design order is the actual before-preview seen by the owner;
  // the raw section array may be stored in a different order.
  const rendered=list(draft.designPlan?.sectionOrder).filter(id=>activeIds.includes(id));
  const before=[...new Set([...rendered,...activeIds])];
  const proposed=operation.proposed;
  if(Array.isArray(theme.sectionOrder)&&
     JSON.stringify(theme.sectionOrder)===JSON.stringify(proposed))
   return fail(draft,"This owner-reviewed order is already selected.");
  if(!Array.isArray(operation.before)||!Array.isArray(proposed)||
    before.length<2||proposed.length!==before.length||
    JSON.stringify(operation.before)!==JSON.stringify(before)||
    proposed[0]!=="hero"||before[0]!=="hero"||
    new Set(proposed).size!==before.length||
    proposed.some(id=>typeof id!=="string"||!before.includes(id))||
    proposed.every((id,i)=>id===before[i]))
   return fail(draft,"The reviewed sections are no longer a different exact ordering of visible sections.");
  theme.sectionOrder=[...proposed];
  return ready("Applied the owner-reviewed customer-first section order");
 }
 // V3.214: owner-approved handoff to an EXISTING public Business App.
 // A link is not a website form, customer request or confirmed booking.
 // The AppController must independently recompute current live-version proof.
 if(action==="connect-app-request"||action==="disconnect-app-request"){
  const fields=["kind","action","websiteId","expectedGeneration",
    "expectedBusinessId","intent","url","appId","liveVersionId","slug"];
  if(Object.keys(operation).some(key=>!fields.includes(key))||
     operation.websiteId!==draft.id||
     !Number.isSafeInteger(operation.expectedGeneration)||
     operation.expectedGeneration!==draft.generation||
     typeof operation.expectedBusinessId!=="string"||
     !operation.expectedBusinessId||
     (draft.businessId&&operation.expectedBusinessId!==draft.businessId)||
     !["enquiry","booking_request"].includes(operation.intent))
   return fail(draft,"The approved website, business or action changed. Review the current handoff.");
  const activeContact=sections.find(s=>s.id==="contact"&&s.type==="contact"&&
    s.enabled!==false&&(text(s.phone)||text(s.email)));
  if(!activeContact)return fail(draft,
    "Keep visible, owner-approved contact details before connecting an external customer request.");
  const existing={...(theme.appRequestLinks||{})};
  if(action==="disconnect-app-request"){
   if(Object.keys(operation).some(k=>!["kind","action","websiteId",
       "expectedGeneration","expectedBusinessId","intent"].includes(k))||
      !existing[operation.intent])
    return fail(draft,"There is no matching active handoff in this private website.");
   delete existing[operation.intent];
   if(Object.keys(existing).length)theme.appRequestLinks=existing;
   else delete theme.appRequestLinks;
   return ready("Removed the reviewed Business App customer-request link");
  }
  const slug=operation.slug,url=operation.url;
  if(typeof slug!=="string"||
     !/^[a-z0-9](?:[a-z0-9-]{0,78}[a-z0-9])?$/.test(slug)||
     typeof url!=="string"||url.length>420||
     typeof operation.appId!=="string"||
     !/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(operation.appId)||
     typeof operation.liveVersionId!=="string"||
     !/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(operation.liveVersionId))
   return fail(draft,"The public Business App link is incomplete.");
  let parsed;
  try{parsed=new URL(url);}catch{return fail(draft,"Invalid public Business App link.");}
  const expected="/functions/v1/busy-mini-app-link";
  if(parsed.protocol!=="https:"||parsed.username||parsed.password||parsed.port||
     !/^[a-z0-9-]{6,80}\.supabase\.co$/.test(parsed.hostname)||
     parsed.pathname!==expected||parsed.hash||
     [...parsed.searchParams.keys()].length!==5||
     url!==parsed.origin+expected+"?slug="+encodeURIComponent(slug)+
       "&source=web&intent="+encodeURIComponent(operation.intent)+
       "&appId="+encodeURIComponent(operation.appId)+
       "&versionId="+encodeURIComponent(operation.liveVersionId)||
     parsed.searchParams.get("slug")!==slug||
     parsed.searchParams.get("source")!=="web"||
     parsed.searchParams.get("intent")!==operation.intent||
     parsed.searchParams.get("appId")!==operation.appId||
     parsed.searchParams.get("versionId")!==operation.liveVersionId||
     [...parsed.searchParams.keys()].some(k=>
       !["slug","source","intent","appId","versionId"].includes(k)))
   return fail(draft,"Only BUSY's verified HTTPS customer-request handoff is allowed.");
  const link={
   intent:operation.intent,url,slug,appId:operation.appId,
   liveVersionId:operation.liveVersionId,ownerApproved:true
  };
  if(JSON.stringify(existing[operation.intent])===JSON.stringify(link))
   return fail(draft,"That public Business App link is already connected.");
  existing[operation.intent]=link;
  theme.appRequestLinks=existing;
  return ready("Connected the owner-approved public Business App request handoff");
 }
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
 if(action==="brand-colour"){
  const colour=operation.value;
  if(typeof colour!=="string"||!/^#[0-9a-fA-F]{6}$/.test(colour)||
    Object.keys(operation).some(k=>!["action","value","kind"].includes(k)))
   return fail(draft,"Only a validated, reviewed six-digit brand colour can be used.");
  const hex=colour.toUpperCase();
  if(text(theme.primary).toUpperCase()===hex)
   return fail(draft,"This website already uses that brand colour.");
  // The central website design factory enforces white-button-text contrast;
  // this action changes a private theme token, never injects CSS.
  theme.primary=hex;
  return ready("Updated the website's brand colour");
 }
 if(action==="style"){
  const {field,value}=operation;
  if(!Object.prototype.hasOwnProperty.call(allow,field)||!allow[field].includes(value))
   return fail(draft,"Choose a supported appearance setting. Arbitrary CSS or remote fonts are not allowed.");
  if(field==='heroLayout'){
   const hero=sections.find(section=>section.type==='hero'&&section.enabled!==false),hasImage=photographicCount(hero?[hero]:[])>0;
   if(!hero||value.startsWith('image-')!==hasImage)return fail(draft,hasImage?'Keep the approved hero photo and choose an image layout.':'Choose a typographic layout or select an approved hero photo first.');
  }
  if(field==="photoFocus"&&!sections.some(s=>s.type==="hero"&&s.asset?.approved!==false&&text(s.asset?.storagePath)))
   return fail(draft,"Add an approved customer hero photo before changing photo crop.");
  if(field==="ctaEmphasis"&&value==="strong"&&!sections.some(s=>s.type==="hero"&&text(s.cta)&&text(s.ctaHref)))
   return fail(draft,"Add a button with a verified destination before emphasising it.");
  if(theme[field]===value)return fail(draft,"That appearance setting is already active.");
  theme[field]=value;
  return ready("Changed the website "+field+" to "+value+".");
 }
 // V3.141: a photo tapped within a gallery is ONE image, not the
 // entire gallery. Its focal point has its own reversible safe token.
 if(action==="image-style"){
  const gallery=sections.find(x=>x?.id===sectionId&&x.type==="gallery"&&x.enabled!==false);
  const n=operation.photoIndex;
  const allowed={photoCrop:["top","center","bottom"],photoFit:["cover","contain"]};
  if(!gallery||sectionId!=="gallery"||!Number.isSafeInteger(n)||
     n<0||n>=list(gallery.items).length||gallery.items[n]?.approved===false||
     !Object.prototype.hasOwnProperty.call(allowed,operation.field)||
     !allowed[operation.field].includes(operation.value))
   return fail(draft,"Select an approved photo and a supported picture framing choice.");
  const photo=gallery.items[n];
  const defaults={photoCrop:"center",photoFit:"cover"};
  const before=photo?.appearance&&typeof photo.appearance==="object"?photo.appearance:{};
  const current=before[operation.field]||defaults[operation.field];
  if(current===operation.value)return fail(draft,"That picture already uses this framing.");
  const nextAppearance={};
  for(const name of Object.keys(allowed))
   if(allowed[name].includes(before[name])&&before[name]!==defaults[name])
    nextAppearance[name]=before[name];
  if(operation.value===defaults[operation.field])delete nextAppearance[operation.field];
  else nextAppearance[operation.field]=operation.value;
  gallery.items[n]={...photo,...(Object.keys(nextAppearance).length
   ?{appearance:nextAppearance}:{appearance:undefined})};
  return ready("Adjusted only the selected gallery photograph.");
 }
 // V3.140: individual item headings are not section headings. Keep their
 // appearance separate, or "make THIS heading bigger" affects every card.
 if(action==="item-style"){
  const itemId=operation.itemId;
  const section=sections.find(x=>x?.id===sectionId&&x.enabled!==false);
  if(!section||!["services","faq","testimonials"].includes(section.type)||
     operation.field!=="headingScale"||
     !["compact","normal","large"].includes(operation.value))
   return fail(draft,"Select an existing service, question or testimonial heading.");
  const matches=list(section.items).filter(item=>item?.id===itemId);
  if(typeof itemId!=="string"||!itemId||matches.length!==1)
   return fail(draft,"That exact heading no longer exists.");
  const at=list(section.items).findIndex(item=>item.id===itemId);
  const item=section.items[at],present=text(item?.appearance?.headingScale)||"normal";
  if(present===operation.value)return fail(draft,"That heading already uses this size.");
  const nextItem={...item};
  if(operation.value==="normal")delete nextItem.appearance;
  else nextItem.appearance={headingScale:operation.value};
  section.items[at]=nextItem;
  return ready("Resized only the selected card heading.");
 }
 // V3.139 independent section styles. Never accept CSS, URLs or HTML.
 // The same enumerated tokens are emitted by the concept and hosted renderers.
 if(action==="section-style"||action==="reset-section-style"){
  const matched=sections.filter(x=>x?.id===sectionId&&x?.enabled!==false);
  if(matched.length!==1)
   return fail(draft,"Choose one visible section of your website.");
  const target=matched[0];
  const fields={
   bodyScale:['normal','large'],mobileBodyScale:['normal','large'],desktopBodyScale:['normal','large'],
   headingScale:["compact","normal","large"],
   textAlign:["left","center"],
   sectionSpacing:["compact","normal","generous"],
   mobileSectionSpacing:["compact","normal","generous"],desktopSectionSpacing:["compact","normal","generous"],
   photoCrop:["top","center","bottom"],
   photoSide:["left","right"],
   gallerySize:["comfortable","compact","large"],
   mobileHeadingScale:["normal","compact","large"],desktopHeadingScale:["normal","compact","large"],
   mobileGallerySize:["comfortable","compact","large"],desktopGallerySize:["comfortable","compact","large"]
  };
  const bodyTypes=['hero','services','about','text','photo-feature','faq','testimonials','contact'];
  const supports={
   bodyScale:bodyTypes,mobileBodyScale:bodyTypes,desktopBodyScale:bodyTypes,
   headingScale:["hero","services","about","text","photo-feature","gallery","faq","testimonials","contact"],
   textAlign:["hero","services","about","text","photo-feature","gallery","faq","testimonials","contact"],
   sectionSpacing:["hero","services","about","text","photo-feature","gallery","faq","testimonials","contact"],
   mobileSectionSpacing:["hero","services","about","text","photo-feature","gallery","faq","testimonials","contact","products","events"],
   desktopSectionSpacing:["hero","services","about","text","photo-feature","gallery","faq","testimonials","contact","products","events"],
   photoCrop:["hero","photo-feature","gallery"],
   photoSide:["photo-feature"],
   gallerySize:["gallery"],
   mobileHeadingScale:["hero","services","about","text","photo-feature","gallery","faq","testimonials","contact"],
   desktopHeadingScale:["hero","services","about","text","photo-feature","gallery","faq","testimonials","contact"],
   mobileGallerySize:["gallery"],desktopGallerySize:["gallery"]
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
  const defaults={bodyScale:'normal',mobileBodyScale:'normal',desktopBodyScale:'normal',headingScale:"normal",textAlign:"left",sectionSpacing:"normal",mobileSectionSpacing:"normal",desktopSectionSpacing:"normal",
    photoCrop:"center",photoSide:"left",gallerySize:"comfortable",
    mobileHeadingScale:"normal",desktopHeadingScale:"normal",mobileGallerySize:"comfortable",desktopGallerySize:"comfortable"};
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
 if(action==="move-relative"){
  if(Object.keys(operation).some(k=>!['action','kind','sectionId','targetSectionId','position','pageId'].includes(k))||
    !['before','after'].includes(operation.position)||sectionId==='hero'||
    sectionId===operation.targetSectionId||chosen.enabled===false)
   return fail(draft,'Choose two different visible sections and keep the main hero first.');
  const page=list(draft.pages).filter(p=>p.id===operation.pageId&&p.enabled!==false);
  if(page.length!==1||![sectionId,operation.targetSectionId].every(id=>list(page[0].sectionIds).includes(id)))
   return fail(draft,'Both sections must be on the selected current page.');
  const rendered=list(draft.designPlan?.sectionOrder).filter(id=>active().includes(id));
  const ids=list(theme.sectionOrder).length?order():[...new Set([...rendered,...active()])];
  if(!ids.includes(operation.targetSectionId)||operation.targetSectionId==='hero'&&operation.position==='before')
   return fail(draft,'Keep the main hero first and choose a visible destination.');
  const next=ids.filter(id=>id!==sectionId),at=next.indexOf(operation.targetSectionId);
  next.splice(at+(operation.position==='after'?1:0),0,sectionId);
  if(JSON.stringify(ids)===JSON.stringify(next))return fail(draft,'These sections are already in that order.');
  theme.sectionOrder=next;
  return ready('Moved '+text(chosen.title||sectionId)+' '+operation.position+' '+operation.targetSectionId+'.');
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
function applyWebsiteLayoutOperation(draft,operation){
 if(['page-reading','page-spacing'].includes(operation?.action)){
  const spacing=operation.action==='page-spacing',value=spacing?operation.value:'large';
  if(Object.keys(operation).some(k=>!(spacing?['action','kind','pageId','device','value']:['action','kind','pageId','device']).includes(k))||
   !(spacing?['mobile','desktop']:['mobile','desktop','all']).includes(operation.device)||spacing&&!['compact','generous'].includes(value))return fail(draft,'Choose the page and supported reading size.');
  const pages=list(draft?.pages).filter(p=>p.id===operation.pageId&&p.enabled!==false);
  if(pages.length!==1)return fail(draft,'Choose one current page.');
  const field=spacing?operation.device+'SectionSpacing':operation.device==='all'?'bodyScale':operation.device+'BodyScale';
  const sections=list(draft.sections).filter(s=>s.enabled!==false&&list(pages[0].sectionIds).includes(s.id)&&
   ['hero','services','about','text','photo-feature','faq','testimonials','contact',...(spacing?['gallery','products','events']:[])].includes(s.type));
  if(!sections.length||sections.length>30)return fail(draft,'Review the current page sections first.');
  let next=draft,changed=false;
  for(const section of sections){
   if(section.appearance?.[field]===value)continue;
   const result=applyWebsiteLayoutOperation(next,{action:'section-style',sectionId:section.id,field,value});
   if(!result.applied)return fail(draft,result.reason);next=result.draft;changed=true;
  }
  return changed?protectWebsiteOwnerLocks(draft,{applied:true,draft:next,reason:(spacing?'Prepared section spacing on ':'Prepared larger body text and reading space on ')+operation.device+' layouts. Wording and other widths stay unchanged.'}):fail(draft,'This page already uses the requested reading size.');
 }
 if(operation?.action==='style-group'){
  const ops=operation.operations;
  if(!Array.isArray(ops)||!ops.length||ops.length>4||Object.keys(operation).some(k=>!['action','operations','kind'].includes(k))||
   ops.some(op=>!op||!['style','section-style','apply-reviewed-composition'].includes(op.action)||
    Object.keys(op).some(k=>!(op.action==='apply-reviewed-composition'?['action','websiteId','expectedGeneration','expectedBusinessId','before','proposed']:['action','sectionId','field','value']).includes(k))))
   return fail(draft,'Choose up to four supported appearance changes.');
  let next=draft;
  for(const op of ops){const result=applyWebsiteLayoutOperation(next,op);if(!result.applied)return fail(draft,result.reason);next=result.draft;}
  return protectWebsiteOwnerLocks(draft,{applied:true,draft:next,reason:'Prepared coordinated appearance changes. All business content and brand colours remain unchanged.'});
 }
 return protectWebsiteOwnerLocks(draft,applyWebsiteLayoutOperationUnchecked(draft,operation));
}
export {applyWebsiteLayoutOperation,websiteLayoutLockReason,allow as websiteAppearanceOptions};
