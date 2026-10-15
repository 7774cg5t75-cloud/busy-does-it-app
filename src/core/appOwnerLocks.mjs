// Owner locks are editing constraints, not permissions or evidence of quality.
function appOwnerLocks(config){
 const locks=config?.presentation?.ownerLockedElements;
 if(locks===undefined)return {ok:true,locks:[]};
 if(!Array.isArray(locks)||locks.length>30||new Set(locks).size!==locks.length||
    locks.some(x=>typeof x!=="string"||!x.trim()||x.length>80))
  return {ok:false,locks:[],reason:"Review the existing owner-locked elements before editing."};
 return {ok:true,locks};
}
function appEditLockReason(config,op){
 if(op?.kind==="restore_photo_description")op={...op,kind:"photo_description"};
 if(op?.kind==="restore_public_field")op={...op,kind:op.field==="services"?"services":op.field==="contact"?"contact":"text"};
 const parsed=appOwnerLocks(config);
 if(!parsed.ok)return parsed.reason;
 const groups={headerStyle:["header"],typeStyle:["header","copy","typography"],
  layoutDensity:["spacing"],navigationStyle:["navigation"],
  imageScale:["gallery","photos"],imageCorners:["gallery","photos"],
  galleryLayout:["gallery","photos"],serviceStyle:["services"],
  brandAccent:["branding","colours","colors"],brandPalette:["branding","colours","colors"]};
 const targets=[];
 if(op?.kind==="appearance")targets.push("appearance",op.field,...(groups[op.field]||[]));
 else if(op?.kind==="restore_appearance"){
  const before=config?.presentation||{},after=op.value||{};
  for(const field of new Set([...Object.keys(before),...Object.keys(after)]))
   if(JSON.stringify(before[field])!==JSON.stringify(after[field]))targets.push("appearance",field,...(groups[field]||[]));
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
 else if(op?.kind==="contact")targets.push("contact","copy","business_profile",op.field);
 else if(op?.kind==="services")targets.push("services","copy");
 else if(["photo","photo_description"].includes(op?.kind))targets.push("gallery","photos",...(op.kind==="photo_description"?["copy"]:[]));
 return parsed.locks.some(x=>x==="all"||targets.includes(x))?
  "This change affects an owner-locked element. Keep it unchanged or review the lock separately.":null;
}
export {appOwnerLocks,appEditLockReason};
