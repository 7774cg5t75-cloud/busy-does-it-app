import {appEditLockReason} from "./appOwnerLocks.mjs";
/** V3.156: one-position, reviewable section reorder for BOTH Business App routes.
 * Navigation must be an exact permutation of enabled, known module keys. */
function enabledAppKeys(config){
 if(!config||!Array.isArray(config.modules))return {ok:false,reason:"No app modules."};
 const keys=config.modules.filter(x=>x?.enabled===true).map(x=>x.key);
 if(!keys.length||!keys.includes("business_profile")||
    keys.some(x=>typeof x!=="string"||!/^[a-z_]{1,40}$/.test(x))||
    new Set(keys).size!==keys.length)
  return {ok:false,reason:"Invalid enabled module list."};
 const nav=config.navigation;
 if(!Array.isArray(nav)||nav.length!==keys.length||
    new Set(nav).size!==keys.length||nav.some(k=>!keys.includes(k)))
  return {ok:false,reason:"The app navigation must match its enabled sections."};
 return {ok:true,keys:[...nav]};
}
function proposeAppSectionMove(config,{moduleKey,direction}={}){
 const locked=appEditLockReason(config,{kind:"move",moduleKey,direction});
 if(locked)return {ok:false,reason:locked};
 const valid=enabledAppKeys(config);if(!valid.ok)return valid;
 if(typeof moduleKey!=="string"||!["up","down"].includes(direction))
  return {ok:false,reason:"Choose a section and move it one position."};
 const from=valid.keys.indexOf(moduleKey),to=from+(direction==="up"?-1:1);
 if(from<0||to<0||to>=valid.keys.length)
  return {ok:false,reason:"This section cannot be moved in that direction."};
 const navigation=[...valid.keys];[navigation[from],navigation[to]]=[navigation[to],navigation[from]];
 return {ok:true,moduleKey,direction,before:valid.keys,after:navigation,
  nextConfig:{...config,navigation},requiresOwnerApproval:true,
  changesCustomerData:false,changesBookings:false,changesPayments:false,
  publishes:false};
}
function orderedAppModules(config){
 const enabled=config?.modules?.filter(x=>x?.enabled===true)||[];
 const keys=enabledAppKeys(config);
 return keys.ok?keys.keys.map(k=>enabled.find(m=>m.key===k)):enabled;
}
export {enabledAppKeys,proposeAppSectionMove,orderedAppModules};
