import {appEditLockReason,appOwnerLocks} from './appOwnerLocks.mjs';
import {enabledAppKeys} from './appSectionOrder.mjs';
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
function appConfigLockReason(before,after){
 const locks=appOwnerLocks(before);if(!locks.ok)return locks.reason;
 if(!same(before?.presentation?.ownerLockedElements,after?.presentation?.ownerLockedElements))return 'Owner locks cannot be replaced by a rebuild.';
 if(!locks.locks.length)return '';
 if(locks.locks.includes('all')&&!same(before,after))return 'Unlock the app before rebuilding it.';
 const operations=[];
 if(!same(before.contentLayout,after.contentLayout))operations.push({kind:'content_layout'});
 for(const field of ['faqs','testimonials'])if(!same(before.publicProfile?.[field],after.publicProfile?.[field]))operations.push({kind:'public_collection',field});
 if(!same(before.navigation,after.navigation))operations.push({kind:'navigation',value:after.navigation});
 for(const field of new Set([...Object.keys(before.presentation||{}),...Object.keys(after.presentation||{})]))
  if(!same(before.presentation?.[field],after.presentation?.[field]))operations.push({kind:'appearance',field});
 for(const field of ['tagline','about','description'])if(!same(before.publicProfile?.[field],after.publicProfile?.[field]))operations.push({kind:'text',field});
 if(!same(before.publicProfile?.services,after.publicProfile?.services))operations.push({kind:'services'});
 if(!same(before.publicProfile?.assets?.gallery,after.publicProfile?.assets?.gallery))operations.push({kind:'photo'});
 if(locks.locks.includes('business_profile')&&(!same(before.publicProfile,after.publicProfile)||!same(before.display,after.display)))return 'The business profile is owner-locked.';
 for(const module of before.modules||[])if(locks.locks.includes(module.key)&&!same(module,(after.modules||[]).find(x=>x.key===module.key)))return 'This rebuild changes an owner-locked module.';
 return operations.map(op=>appEditLockReason(before,op)).find(Boolean)||'';
}
function retainAppDraftDesign(previous,rebuilt){
 if(!previous)return {ok:/** @type {const} */ (true),nextConfig:rebuilt};
 const next={...rebuilt};
 // Keep the established Studio, plan and distribution settings when refreshing
 // approved business facts. Applying a new plan explicitly replaces its fields.
 for(const key of ['schemaVersion','surface','presentation','builderPlan','offers','loyalty','contentLayout'])
  if(Object.prototype.hasOwnProperty.call(previous,key))next[key]=previous[key];
 // Owner-authored information survives business-fact rebuilds; edit it explicitly.
 if(previous.publicProfile)for(const field of ['faqs','testimonials'])if(Object.hasOwn(previous.publicProfile,field))next.publicProfile={...next.publicProfile,[field]:previous.publicProfile[field]};
 const enabled=(next.modules||[]).filter(x=>x.enabled===true).map(x=>x.key);
 next.navigation=[...new Set([...(previous.navigation||[]).filter(k=>enabled.includes(k)),...enabled])];
 const reason=appConfigLockReason(previous,next);
 return reason?{ok:/** @type {const} */ (false),reason}:{ok:/** @type {const} */ (true),nextConfig:next};
}
function proposeAppModuleToggle(config,{moduleKey,enabled}={}){
 const valid=enabledAppKeys(config);if(!valid.ok)return valid;
 const found=config.modules.filter(x=>x.key===moduleKey);
 if(found.length!==1||typeof enabled!=='boolean'||found[0].enabled===enabled||
  moduleKey==='business_profile'&&!enabled||enabled&&found[0].status!=='available')
  return {ok:/** @type {const} */ (false),reason:'Choose one supported module and a new enabled setting.'};
 const modules=config.modules.map(x=>x.key===moduleKey?{...x,enabled}:x);
 const keys=modules.filter(x=>x.enabled===true).map(x=>x.key);
 const navigation=[...config.navigation.filter(k=>keys.includes(k)),...keys.filter(k=>!config.navigation.includes(k))];
 const nextConfig={...config,modules,navigation};
 const reason=appConfigLockReason(config,nextConfig);
 return reason?{ok:/** @type {const} */ (false),reason}:{ok:/** @type {const} */ (true),nextConfig};
}
export {appConfigLockReason,retainAppDraftDesign,proposeAppModuleToggle};
