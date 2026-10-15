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
 const parsed=appOwnerLocks(config);
 if(!parsed.ok)return parsed.reason;
 const targets=op?.kind==="appearance"?["appearance",op.field,
  ...(["brandAccent","brandPalette"].includes(op.field)?["branding","colours"]:[])]:
  ["move","first","navigation"].includes(op?.kind)?["navigation",op.moduleKey]:
  op?.kind==="text"?["copy",op.field]:op?.kind==="services"?["services"]:
  ["photo","photo_description"].includes(op?.kind)?["gallery","photos"]:[];
 return parsed.locks.some(x=>x==="all"||targets.includes(x))?
  "This change affects an owner-locked element. Keep it unchanged or review the lock separately.":null;
}
export {appOwnerLocks,appEditLockReason};
