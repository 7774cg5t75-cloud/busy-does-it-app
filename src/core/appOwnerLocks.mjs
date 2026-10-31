import {componentLockTargets} from './appComponentAppearance.mjs';
// Owner locks are editing constraints, not permissions or evidence of quality.
function appOwnerLocks(config){
 const locks=config?.presentation?.ownerLockedElements;
 if(locks===undefined)return {ok:/** @type {const} */ (true),locks:[]};
 if(!Array.isArray(locks)||locks.length>30||new Set(locks).size!==locks.length||
    locks.some(x=>typeof x!=="string"||!x.trim()||x.length>80))
  return {ok:/** @type {const} */ (false),locks:[],reason:"Review the existing owner-locked elements before editing."};
 return {ok:/** @type {const} */ (true),locks};
}
function appEditLockReason(config,op){
 if(op?.kind==="restore_photo_description")op={...op,kind:"photo_description"};
 if(op?.kind==="restore_public_field")op={...op,kind:['faqs','testimonials'].includes(op.field)?'public_collection':op.field==="services"?"services":op.field==="contact"?"contact":"text"};
 const parsed=appOwnerLocks(config);
 if(!parsed.ok)return parsed.reason;
 const groups={headerStyle:["header"],typeStyle:["header","copy","typography"],
  layoutDensity:["spacing"],navigationStyle:["navigation"],
  imageScale:["gallery","photos"],imageCorners:["gallery","photos"],
  galleryLayout:["gallery","photos"],serviceStyle:["services"],
  brandAccent:["branding","colours","colors"],brandPalette:["branding","colours","colors"]};
 const targets=[];
 if(['service_presentation','reset_service_presentation'].includes(op?.kind)){targets.push('services','appearance','servicePresentation',String(op.field||''));const fields=op.kind==='reset_service_presentation'?Object.keys(config.presentation?.servicePresentation?.[op.field]||{}).filter(k=>op.value==='card'?!k.startsWith('enquiry')&&!k.startsWith('booking'):k.startsWith(String(op.value))):Object.keys(op.value||config.presentation?.servicePresentation?.[op.field]||{});if(fields.some(k=>k.endsWith('Label')))targets.push('copy');if(fields.some(k=>k.startsWith('enquiry')))targets.push('enquiry','buttons');if(fields.some(k=>k.startsWith('booking')))targets.push('booking_request','buttons');}
 if(op?.kind==='navigation_label')targets.push('navigation','copy',op.moduleKey);
 if(op?.kind==='image_appearance')targets.push('appearance','gallery','photos','imageStyles');
 if(op?.kind==='component_appearance')targets.push(...componentLockTargets(String(op.field||'')));
 if(['content_layout','restore_content_layout'].includes(op?.kind))targets.push('business_profile','copy','navigation','products','events');
 if(op?.kind==="appearance")targets.push("appearance",op.field,...(groups[op.field]||[]));
 else if(op?.kind==="restore_appearance"){
  const before=config?.presentation||{},after=op.value||{};
  if(JSON.stringify(before.servicePresentation||{})!==JSON.stringify(after.servicePresentation||{})){targets.push('services');for(const key of new Set([...Object.keys(before.servicePresentation||{}),...Object.keys(after.servicePresentation||{})]))for(const field of new Set([...Object.keys(before.servicePresentation?.[key]||{}),...Object.keys(after.servicePresentation?.[key]||{})]))if(before.servicePresentation?.[key]?.[field]!==after.servicePresentation?.[key]?.[field]){targets.push(key);if(field.endsWith('Label'))targets.push('copy');if(field.startsWith('enquiry'))targets.push('enquiry','buttons');if(field.startsWith('booking'))targets.push('booking_request','buttons');}}
  if(JSON.stringify(before.imageStyles||{})!==JSON.stringify(after.imageStyles||{}))targets.push('gallery','photos');
  for(const field of new Set([...Object.keys(before),...Object.keys(after)]))
   if(JSON.stringify(before[field])!==JSON.stringify(after[field]))targets.push("appearance",field,...(groups[field]||[]));
  for(const key of new Set([...Object.keys(before.componentStyles||{}),...Object.keys(after.componentStyles||{})]))if(JSON.stringify(before.componentStyles?.[key])!==JSON.stringify(after.componentStyles?.[key]))targets.push(...componentLockTargets(key));
 }else if(["move","first","navigation"].includes(op?.kind)){
  targets.push("navigation",op.moduleKey);
  const before=config?.navigation||[];let after=[...before];
  if(op.kind==="navigation"&&Array.isArray(op.value))after=op.value;
  else if(op.kind==="first")after=[op.moduleKey,...before.filter(x=>x!==op.moduleKey)];
  else if(op.kind==="move"){
   const from=before.indexOf(op.moduleKey),to=from+(op.direction==="up"?-1:1);
   if(from>=0&&to>=0&&to<after.length)[after[from],after[to]]=[after[to],after[from]];
  }
  for(const key of before)if(before.indexOf(key)!==after.indexOf(key))targets.push(key);
 }else if(op?.kind==="text")targets.push("copy","business_profile",op.field,...(op.field==="tagline"?["header"]:[]));
 else if(op?.kind==='public_collection')targets.push('copy','business_profile',op.field,...(op.field==='faqs'?['faq']:[]));
 else if(op?.kind==="contact")targets.push("contact","copy","business_profile",op.field);
 else if(op?.kind==="services")targets.push("services","copy");
 else if(["photo","photo_description"].includes(op?.kind))targets.push("gallery","photos",...(op.kind==="photo_description"?["copy"]:[]));
 return parsed.locks.some(x=>x==="all"||targets.includes(x))?
  "This change affects an owner-locked element. Keep it unchanged or review the lock separately.":null;
}
export {appOwnerLocks,appEditLockReason};
