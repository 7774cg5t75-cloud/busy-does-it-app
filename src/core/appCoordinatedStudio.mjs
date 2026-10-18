import {validContentLayout} from './businessContentRecords.mjs';
import {validPublicCollection} from './appPublicCollections.mjs';
import {splitBuilderInstructionClauses} from './builderInstructionClauses.mjs';
import {validAppContactEdit} from './appContactPolicy.mjs';
import {editAppOwnerLocks} from "./appOwnerLockEditing.mjs";
import {PROFILE_TEXT_LIMITS,captureAppProfileField,restoreAppProfileField} from "./appProfileFieldUndo.mjs";
import {appEditLockReason} from "./appOwnerLocks.mjs";
/**
 * V3.157 — finite, reversible, atomic private Business App editing plan.
 * This module is shared byte-for-byte between the client and the trusted edge.
 * It cannot enable modules, confirm requests, charge, publish or submit apps.
 */
import {enabledAppKeys,proposeAppSectionMove} from "./appSectionOrder.mjs";
import {previewPrivateAppAppearance,publicAppAppearance} from "./appAppearanceEditing.mjs";
import {reviewPrivateAppServices} from "./appServiceCollection.mjs";
import {proposeGalleryImageDescription,restoreGalleryDescription} from "./appGalleryDescription.mjs";
const MAX_CHANGES=8;
const TEXT_FIELDS=PROFILE_TEXT_LIMITS;
const clean=v=>typeof v==="string"?v.trim():"";
const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
function proposeCoordinatedAppChanges(config,operations){
 if(!config||typeof config!=="object"||!Array.isArray(config.modules)||
    !Array.isArray(operations)||!operations.length||operations.length>MAX_CHANGES)
  return {ok:false,reason:"Select 1 to 8 supported private app changes."};
 if(operations.some(op=>op?.kind==="owner_locks")&&operations.length!==1)return {ok:false,reason:"Review owner locks separately from content edits."};
 const valid=enabledAppKeys(config);
 if(!valid.ok)return valid;
 let next=config;
 const changes=[],inverse=[];
 for(const op of operations){
  if(!op||typeof op!=="object"||Array.isArray(op)||
     Object.keys(op).some(k=>!["kind","field","value","moduleKey","direction","index","from","to","expectedUri"].includes(k)))
   return {ok:false,reason:"Unknown edit data was rejected."};
  const locked=op.kind==="owner_locks"?null:appEditLockReason(next,op);
  if(locked)return {ok:false,reason:locked};
  let undo=null,after=null,description="";
  if(op.kind==="owner_locks"){
   const edit=editAppOwnerLocks(next,op);if(!edit.ok)return edit;
   after=edit.nextConfig;undo=edit.undo;description="Editing protection: "+(after.presentation?.ownerLockedElements?.length?after.presentation.ownerLockedElements.join(", "):"no locks")+". Customer content is unchanged.";
  }else if(op.kind==="appearance"){
   const edit=previewPrivateAppAppearance(next,{field:op.field,value:op.value});
   if(!edit.ok)return edit;
   after=edit.nextConfig;
   undo={kind:"restore_appearance",value:own(next,"presentation")?
    JSON.parse(JSON.stringify(next.presentation)):null};
   description=op.field+": "+edit.previous+" → "+edit.value;
  }else if(op.kind==="restore_appearance"){
   if(op.value!==null&&!publicAppAppearance(op.value).ok||
      !publicAppAppearance(next.presentation||{}).ok||
      JSON.stringify(next.presentation?.ownerLockedElements||[])!==
       JSON.stringify(op.value?.ownerLockedElements||[]))
    return {ok:false,reason:"Only a validated appearance snapshot with unchanged owner locks can be restored."};
   if(JSON.stringify(next.presentation??null)===JSON.stringify(op.value))
    return {ok:false,reason:"This appearance is already restored."};
   undo={kind:"restore_appearance",value:own(next,"presentation")?
    JSON.parse(JSON.stringify(next.presentation)):null};
   after={...next};
   if(op.value===null)delete after.presentation;
   else after.presentation=JSON.parse(JSON.stringify(op.value));
   description="Restored the reviewed private appearance";
  }else if(op.kind==="move"){
   const edit=proposeAppSectionMove(next,{moduleKey:op.moduleKey,direction:op.direction});
   if(!edit.ok)return edit;
   after=edit.nextConfig;
   undo={kind:"move",moduleKey:op.moduleKey,direction:op.direction==="up"?"down":"up"};
   description="Moved "+op.moduleKey+" "+op.direction;
  }else if(op.kind==="first"){
   const order=enabledAppKeys(next);
   if(!order.ok)return order;
   const pos=order.keys.indexOf(op.moduleKey);
   if(pos<0||pos===0)return {ok:false,reason:"Choose an enabled section that is not already first."};
   const reordered=[op.moduleKey,...order.keys.filter(x=>x!==op.moduleKey)];
   after={...next,navigation:reordered};
   undo={kind:"navigation",value:order.keys};
   description="Moved "+op.moduleKey+" to the first app section";
  }else if(op.kind==="navigation"){
   const order=enabledAppKeys(next);
   if(!order.ok||!Array.isArray(op.value)||
       op.value.length!==order.keys.length||
       new Set(op.value).size!==order.keys.length||
       op.value.some(x=>!order.keys.includes(x))||
       op.value.every((x,i)=>x===order.keys[i]))
    return {ok:false,reason:"Navigation must be a different exact ordering of enabled sections."};
   after={...next,navigation:[...op.value]};
   undo={kind:"navigation",value:order.keys};
   description="Changed section order";
  }else if(op.kind==="restore_public_field"){
   const restored=restoreAppProfileField(next,op);
   if(!restored.ok)return restored;
   after=restored.nextConfig;undo={kind:"restore_public_field",field:op.field,value:restored.previous};
   description="Restored the reviewed public "+op.field;
  }else if(op.kind==="text"){
   const snapshot=captureAppProfileField(next,op.field);
   if(!snapshot)return {ok:false,reason:"Review the existing public field before editing it."};
   const limit=TEXT_FIELDS[op.field];
   if(!own(TEXT_FIELDS,op.field)||typeof op.value!=="string"||
      op.value.length>limit||
      /[<>\u0000-\u001f]/.test(op.value))
    return {ok:false,reason:"Only safe, owner-written public copy can be changed."};
   const prev=typeof next.publicProfile?.[op.field]==="string"?next.publicProfile[op.field]:"";
   if(prev===op.value)return {ok:false,reason:"This wording is already in the app."};
   after={...next,publicProfile:{...next.publicProfile,[op.field]:op.value}};
   if(op.field==="tagline")after.display={...next.display,tagline:op.value};
   undo={kind:"restore_public_field",field:op.field,value:snapshot};
   description="Updated public "+op.field;
  }else if(op.kind==="contact"){
   const snapshot=captureAppProfileField(next,'contact');
   if(!snapshot||!validAppContactEdit(op.field,op.value))return {ok:false,reason:'Review the supported owner-written contact field and existing contact details.'};
   const value=op.value.trim();
   if(next.publicProfile?.contact?.[op.field]===value)return {ok:false,reason:'This contact detail is already saved.'};
   after={...next,publicProfile:{...next.publicProfile,contact:{...next.publicProfile?.contact,[op.field]:value}}};
   undo={kind:'restore_public_field',field:'contact',value:snapshot};description='Updated public '+op.field;
  }else if(['content_layout','restore_content_layout'].includes(op.kind)){
   const present=Object.hasOwn(next,'contentLayout'),before=present?next.contentLayout:undefined;
   if(present&&!validContentLayout(before))return {ok:false,reason:'Review the existing content layout.'};
   const restore=op.kind==='restore_content_layout',value=restore?op.value?.value:op.value;
   if(restore?(!op.value||typeof op.value.present!=='boolean'||Object.keys(op.value).some(k=>!['present','value'].includes(k))||op.value.present!==Object.hasOwn(op.value,'value')||op.value.present&&!validContentLayout(value)):!validContentLayout(value))return {ok:false,reason:'Choose supported product/event blocks and layouts.'};
   after={...next};if(restore&&!op.value.present)delete after.contentLayout;else after.contentLayout=JSON.parse(JSON.stringify(value));
   if(JSON.stringify(after.contentLayout)===JSON.stringify(before))return {ok:false,reason:'This composition is already saved.'};
   undo={kind:'restore_content_layout',value:{present,...present?{value:JSON.parse(JSON.stringify(before))}:{}}};description='Updated reusable product/event composition';
  }else if(op.kind==='public_collection'){
   if(!['faqs','testimonials'].includes(op.field)||!validPublicCollection(op.field,op.value))return {ok:false,reason:'Use up to 20 complete owner-approved entries with safe public wording.'};
   const snapshot=captureAppProfileField(next,op.field);
   if(!snapshot||JSON.stringify(next.publicProfile?.[op.field])===JSON.stringify(op.value))return {ok:false,reason:'Review the existing public entries before editing.'};
   after={...next,publicProfile:{...next.publicProfile,[op.field]:JSON.parse(JSON.stringify(op.value))}};
   undo={kind:'restore_public_field',field:op.field,value:snapshot};description='Updated public '+op.field;
  }else if(op.kind==="services"){
   const snapshot=captureAppProfileField(next,"services");
   if(!snapshot)return {ok:false,reason:"Review the existing public services before editing them."};
   const edit=reviewPrivateAppServices(next,op.value);
   if(!edit.ok)return edit;
   after=edit.nextConfig;
   undo={kind:"restore_public_field",field:"services",value:snapshot};
   description=edit.description;
  }else if(["photo_description","restore_photo_description"].includes(op.kind)){
   const edit=(op.kind==="restore_photo_description"?restoreGalleryDescription:proposeGalleryImageDescription)(next,{
     index:op.index,expectedUri:op.expectedUri,value:op.value
   });
   if(!edit.ok)return edit;
   after=edit.nextConfig;
   undo={kind:"restore_photo_description",index:op.index,
    expectedUri:op.expectedUri,value:edit.previousSnapshot};
   description=edit.description;
  }else if(op.kind==="photo"){
   const arr=next.publicProfile?.assets?.gallery;
   if(!Array.isArray(arr)||arr.length<2||arr.length>40||
     !Number.isInteger(op.from)||!Number.isInteger(op.to)||
     op.from<0||op.to<0||op.from>=arr.length||op.to>=arr.length||
     op.from===op.to)
    return {ok:false,reason:"Choose two valid existing photo positions."};
   const reordered=[...arr];
   const [moved]=reordered.splice(op.from,1);reordered.splice(op.to,0,moved);
   after={...next,publicProfile:{...next.publicProfile,
    assets:{...next.publicProfile.assets,gallery:reordered}}};
   undo={kind:"photo",from:op.to,to:op.from};
   description="Reordered approved gallery photos";
  }else return {ok:false,reason:"This app edit is not supported yet."};
  if(!after||!undo)return {ok:false,reason:"No safe change was prepared."};
  next=after;inverse.unshift(undo);changes.push(description);
 }
 return {ok:true,changes,operations:operations.map(x=>({...x})),undoOperations:inverse,
   nextConfig:next,privateOnly:true,requiresOwnerApproval:true,
   changesBookings:false,chargesCustomers:false,publishes:false,
   sameSharedConfigForStandalone:true,proofType:"static_config_preview"};
}
/** Small exact-intent parser: anything unclear is surfaced instead of guessed. */
function planAppVoiceInstructions(config,instruction){
 const phrase=clean(instruction);
 if(!phrase||phrase.length>400)return {ok:false,reason:"Describe up to 400 characters of app changes."};
 const pieces=splitBuilderInstructionClauses(phrase,{max:MAX_CHANGES});
 if(!pieces)return {ok:false,needsClarification:true,reason:"Use balanced quotes and up to eight complete changes."};
 if(pieces.length>MAX_CHANGES)return {ok:false,reason:"Describe up to eight changes at once."};
 const operations=[],unresolved=[],preserved=[];let contentBlocks=validContentLayout(config.contentLayout)?config.contentLayout.map(x=>({...x})):[],contentChanged=false;
 let faqWorking=config.publicProfile?.faqs===undefined?[]:Array.isArray(config.publicProfile.faqs)?config.publicProfile.faqs.map(row=>({...row})):null;
 let faqChanged=false;const contentWrites=new Set();
 let serviceWorking=Array.isArray(config.publicProfile?.services)?config.publicProfile.services.map(row=>({...row})):[];
 let servicesChanged=false;
 const serviceKeys=serviceWorking.map((_,index)=>index),serviceWrites=new Set();let nextServiceKey=serviceKeys.length;
 for(let p of pieces){
  const photoDescription=/^describe gallery photo ([1-9][0-9]?) as "([^"<>]{1,160})" caption "([^"<>]{0,240})"$/i.exec(p);
  if(photoDescription){
   const index=Number(photoDescription[1])-1,image=config.publicProfile?.assets?.gallery?.[index];
   operations.push({kind:'photo_description',index,expectedUri:image?.uri,value:{alt:photoDescription[2],caption:photoDescription[3]}});continue;
  }
  const blockTitle=/^rename (products|events) section to "([^"<>]{1,80})"$/i.exec(p);
  const blockLayout=/^(?:show|display) (products|events) as (cards|rows)$/i.exec(p);
  const blockRemove=/^hide (products|events) section$/i.exec(p);
  if(blockTitle||blockLayout||blockRemove){
   const command=blockTitle||blockLayout||blockRemove,kind=command[1].toLowerCase()==='products'?'product':'event',at=contentBlocks.findIndex(block=>block.kind===kind);
   const target=kind+':'+(blockRemove?'all':blockTitle?'title':'layout');
   if(at<0||contentWrites.has(target)||contentWrites.has(kind+':all')||blockRemove&&[...contentWrites].some(key=>key.startsWith(kind+':'))){unresolved.push(p);continue;}contentWrites.add(target);
   if(blockRemove)contentBlocks=contentBlocks.filter(block=>block.kind!==kind);
   else contentBlocks=contentBlocks.map((block,index)=>index===at?{...block,...blockTitle?{title:command[2]}:{layout:command[2].toLowerCase()}}:block);
   contentChanged=true;continue;
  }
  const block=/^(?:add|show|include)(?: my| our| the)? (products|events|upcoming events)(?: (?:section|screen))?(?: as (cards|rows))?$/i.exec(p);
  if(block){const kind=block[1].toLowerCase()==='products'?'product':'event',value={kind,title:kind==='product'?'Products':'Upcoming events',layout:(block[2]||'cards').toLowerCase()};const i=contentBlocks.findIndex(x=>x.kind===kind);if(i>=0)contentBlocks[i]={...contentBlocks[i],layout:value.layout};else contentBlocks.push(value);contentChanged=true;continue;}
  const faq=/^add (?:a )?(?:customer )?question "([^"<>]{1,160})" (?:with )?answer "([^"<>]{1,1200})"$/i.exec(p);
  if(faq){if(!faqWorking){unresolved.push(p);continue;}faqWorking=[...faqWorking,{question:faq[1],answer:faq[2]}];faqChanged=true;continue;}
  const serviceAdd=/^add service "([^"<>]{1,120})" (?:with )?description "([^"<>]{1,600})"$/i.exec(p);
  const serviceEdit=/^(?:change|update) service "([^"<>]{1,120})" (description|category|price label|duration label) (?:to|with) "([^"<>]{1,600})"$/i.exec(p);
  const serviceRename=/^rename service "([^"<>]{1,120})" to "([^"<>]{1,120})"$/i.exec(p);
  const serviceRemove=/^remove service "([^"<>]{1,120})"$/i.exec(p);
  const serviceMove=/^move service "([^"<>]{1,120})" (before|after) service "([^"<>]{1,120})"$/i.exec(p);
  if(serviceRename||serviceRemove||serviceMove){
   const command=serviceRename||serviceRemove||serviceMove;
   const indices=name=>serviceWorking.map((row,index)=>row.name?.trim().normalize('NFKC').toLocaleLowerCase('en')===name.trim().normalize('NFKC').toLocaleLowerCase('en')?index:-1).filter(index=>index>=0);
   const from=indices(command[1]);if(from.length!==1){unresolved.push(p);continue;}
   const at=from[0],write=serviceKeys[at]+':'+(serviceRename?'name':serviceRemove?'remove':'order');
   if(serviceWrites.has(write)){unresolved.push(p);continue;}serviceWrites.add(write);
   if(serviceRename){
    if(indices(command[2]).length){unresolved.push(p);continue;}
    serviceWorking=serviceWorking.map((row,index)=>index===at?{...row,name:command[2].trim()}:row);
   }else if(serviceRemove){serviceWorking.splice(at,1);serviceKeys.splice(at,1);}
   else{
    const target=indices(command[3]);if(target.length!==1||target[0]===at){unresolved.push(p);continue;}
    const [row]=serviceWorking.splice(at,1),[key]=serviceKeys.splice(at,1),to=target[0]-(at<target[0]?1:0)+(command[2].toLowerCase()==='after'?1:0);
    serviceWorking.splice(to,0,row);serviceKeys.splice(to,0,key);
   }
   servicesChanged=true;continue;
  }
  if(serviceAdd||serviceEdit){
   const name=(serviceAdd||serviceEdit)[1].trim().toLocaleLowerCase('en');
   const positions=serviceWorking.map((row,index)=>row.name?.trim().toLocaleLowerCase('en')===name?index:-1).filter(index=>index>=0);
   if(serviceAdd){if(positions.length){unresolved.push(p);continue;}
    serviceWorking.push({name:serviceAdd[1].trim(),description:serviceAdd[2]});serviceKeys.push(nextServiceKey++);
   }else{
    if(positions.length!==1){unresolved.push(p);continue;}
    const field={'price label':'priceLabel','duration label':'durationLabel'}[serviceEdit[2].toLowerCase()]||serviceEdit[2].toLowerCase();
    const write=serviceKeys[positions[0]]+':'+field;if(serviceWrites.has(write)){unresolved.push(p);continue;}serviceWrites.add(write);
    serviceWorking=serviceWorking.map((row,index)=>index===positions[0]?{...row,[field]:serviceEdit[3]}:row);
   }
   servicesChanged=true;continue;
  }
  const relative=/^move (services|gallery|contact|about|enquiries|booking requests) (above|below|before|after) (services|gallery|contact|about|enquiries|booking requests)$/i.exec(p);
  if(relative){
   const keys={services:'services',gallery:'gallery',contact:'contact',about:'business_profile',enquiries:'enquiry','booking requests':'booking_request'};
   const section=keys[relative[1].toLowerCase()],target=keys[relative[3].toLowerCase()],order=enabledAppKeys(config);
   if(!order.ok||section===target||![section,target].every(key=>order.keys.includes(key))){unresolved.push(p);continue;}
   const value=order.keys.filter(key=>key!==section),at=value.indexOf(target);
   value.splice(at+(/below|after/i.test(relative[2])?1:0),0,section);
   operations.push({kind:'navigation',value});continue;
  }
  const faqEdit=/^(?:change|update) (?:the )?answer to question "([^"<>]{1,160})" (?:to|with) "([^"<>]{1,1200})"$/i.exec(p);
  const faqRemove=/^remove (?:the )?question "([^"<>]{1,160})"$/i.exec(p);
  if(faqEdit||faqRemove){
   const name=(faqEdit||faqRemove)[1].trim().toLocaleLowerCase('en');
   const positions=(faqWorking||[]).map((row,index)=>row.question?.trim().toLocaleLowerCase('en')===name?index:-1).filter(index=>index>=0);
   if(!faqWorking||positions.length!==1){unresolved.push(p);continue;}
   faqWorking=faqRemove?faqWorking.filter((_,index)=>index!==positions[0]):faqWorking.map((row,index)=>index===positions[0]?{...row,answer:faqEdit[2]}:{...row});
   faqChanged=true;continue;
  }
  // Literal copy is data. Commands outside its exact quoted value still fail.
  const literal=/^(?:set|change|update)(?: my| our| the)? (tagline|about|description|phone|email|opening hours) (?:to|as) ["“'‘]([\s\S]*)["”'’]$/i.exec(p);
  if(literal){
   const field=literal[1].toLowerCase(),value=literal[2];
   if(/["“”]/.test(value)||/(?:^|[^a-z0-9])['‘’]|['‘’](?:[^a-z0-9]|$)/i.test(value)){unresolved.push(p);continue;}
   operations.push(['phone','email','opening hours'].includes(field)?
    {kind:'contact',field:field==='opening hours'?'openingHours':field,value}:
    {kind:'text',field,value});continue;
  }
  if(/^keep (my |the |our )?(existing |current )?(colou?rs?|branding|logo|other things)/i.test(p)){
   preserved.push(p);continue;
  }
  if(/\b(not|never|avoid|without|don't|don’t|publish|delete|remove|send|purchase|pay|charge)\b/i.test(p)){
   unresolved.push(p);continue;
  }
  if(/\b(bookings?|appointments?)\b.*\b(first|top|home screen)\b|\b(first|top)\b.*\b(bookings?|appointments?)\b/i.test(p)){
   operations.push({kind:"first",moduleKey:"booking_request"});continue;
  }
  if(/\b(services?|gallery|photos?|contact|about|offers?)\b.*\b(first|top|home screen)\b|\b(first|top)\b.*\b(services?|gallery|photos?|contact|about|offers?)\b/i.test(p)){
   const found=/\b(services?|gallery|photos?|contact|about|offers?)\b/i.exec(p)?.[0]?.toLowerCase();
   const key=/service/.test(found)?"services":/photo|gallery/.test(found)?"gallery":
     found==="about"?"business_profile":/offer/.test(found)?"offers":"contact";
   operations.push({kind:"first",moduleKey:key});continue;
  }
  if(/\b(enquir(?:y|ies)|inquir(?:y|ies))\b.*\b(first|top)\b/i.test(p)){
   operations.push({kind:"first",moduleKey:"enquiry"});continue;
  }
  if(/\b(photo|image|gallery|picture)s?\b.*\b(bigger|larger|large)\b/i.test(p)){
   operations.push({kind:"appearance",field:"imageScale",value:"large"});continue;
  }
  if(/\b(photo|image|gallery|picture)s?\b.*\b(smaller|normal|regular)\b/i.test(p)){
   operations.push({kind:"appearance",field:"imageScale",value:"regular"});continue;
  }
  if(/\b(grid|two columns?|side.by.side)\b.*\b(photos?|gallery|images?|pictures?)\b|\b(photos?|gallery|images?|pictures?)\b.*\b(grid|two columns?)\b/i.test(p)){
   operations.push({kind:"appearance",field:"galleryLayout",value:"grid"});continue;
  }
  if(/\b(stack|one column|full.width)\b.*\b(photos?|gallery|images?|pictures?)\b|\b(photos?|gallery|images?|pictures?)\b.*\b(stack|one column|full.width)\b/i.test(p)){
   operations.push({kind:"appearance",field:"galleryLayout",value:"stack"});continue;
  }
  if(/\b(square|sharp)\b.*\b(corners?|photos?|images?)\b|\b(corners?|photos?|images?)\b.*\b(square|sharp)\b/i.test(p)){
   operations.push({kind:"appearance",field:"imageCorners",value:"square"});continue;
  }
  if(/\b(rounded|soft)\b.*\b(corners?|photos?|images?)\b|\b(corners?|photos?|images?)\b.*\b(rounded|soft)\b/i.test(p)){
   operations.push({kind:"appearance",field:"imageCorners",value:"rounded"});continue;
  }
  if(/\b(airy|spacious|roomier|more space)\b/i.test(p)){
   operations.push({kind:"appearance",field:"layoutDensity",value:"airy"});continue;
  }
  if(/\b(compact|less space|tighter)\b/i.test(p)){
   operations.push({kind:"appearance",field:"layoutDensity",value:"compact"});continue;
  }
  if(/\b(bold|stronger)\b.*\b(header|heading)\b|\b(header|heading)\b.*\b(bold|stronger)\b/i.test(p)){
   operations.push({kind:"appearance",field:"headerStyle",value:"bold"});continue;
  }
  if(/\b(tabs?|tabbed)\b.*\b(navigation|menu)\b/i.test(p)){
   operations.push({kind:"appearance",field:"navigationStyle",value:"tabs"});continue;
  }
  if(/\b(list|vertical)\b.*\b(navigation|menu)\b/i.test(p)){
   operations.push({kind:"appearance",field:"navigationStyle",value:"list"});continue;
  }
  unresolved.push(p);
 }
 if(contentChanged)operations.push({kind:'content_layout',value:contentBlocks});
 if(faqChanged)operations.push({kind:'public_collection',field:'faqs',value:faqWorking});
 if(servicesChanged)operations.push({kind:'services',value:serviceWorking});
 if(unresolved.length)return {ok:false,needsClarification:true,unresolved,preserved,
  supportedOperations:operations,reason:"BUSY needs clarification before combining these changes: "+unresolved.join("; ")};
 if(!operations.length)return {ok:false,reason:"Nothing needs changing; your existing design stays as it is."};
 const targets=operations.map(op=>['appearance','text','contact','public_collection'].includes(op.kind)?op.kind+':'+op.field:op.kind==='content_layout'?'content_layout':op.kind==='services'?'services':op.kind==='photo_description'?'photo_description:'+op.index:'navigation');
 if(new Set(targets).size!==targets.length)return {ok:false,needsClarification:true,reason:'Choose one instruction for each app setting before preparing the changes.'};
 const result=proposeCoordinatedAppChanges(config,operations);
 return {...result,instruction:phrase,preserved};
}
export {MAX_CHANGES,TEXT_FIELDS,proposeCoordinatedAppChanges,planAppVoiceInstructions};
