import {appOwnerLocks} from './appOwnerLocks.mjs';
const APP_LOCK_CHOICES=Object.freeze([
 ['all','Everything'],['copy','Public wording'],['business_profile','Business introduction'],
 ['services','Services'],['gallery','Photos and captions'],['navigation','Navigation'],
 ['branding','Brand colours'],['appearance','All appearance'],['header','Header'],['spacing','Spacing']
].map(([id,label])=>Object.freeze({id,label})));
const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
function editAppOwnerLocks(config,{value,field}={}){
 const prior=appOwnerLocks(config);if(!prior.ok)return prior;
 const parent=!own(config,'presentation')?'absent':config.presentation===null?'null':'object';
 if(config.presentation!==undefined&&config.presentation!==null&&(typeof config.presentation!=='object'||Array.isArray(config.presentation)))return {ok:/** @type {const} */ (false),reason:'Review the app appearance before changing locks.'};
 // Retain the original bounded lock-ID schema so legacy saved IDs can be
 // removed and restored by exact undo. The UI offers known targets only.
 if(value!==null&&!appOwnerLocks({presentation:{ownerLockedElements:value}}).ok||
  field!==undefined&&!['absent','null','object'].includes(field))return {ok:/** @type {const} */ (false),reason:'Choose bounded owner lock identifiers only.'};
 const before=config.presentation?.ownerLockedElements;
 if(JSON.stringify(before??null)===JSON.stringify(value))return {ok:/** @type {const} */ (false),reason:'Those owner locks are already selected.'};
 const presentation={...config.presentation};
 if(value===null)delete presentation.ownerLockedElements;else presentation.ownerLockedElements=[...value];
 if(field&&field!=='object'&&Object.keys(presentation).length)return {ok:/** @type {const} */ (false),reason:'Restoring locks cannot remove appearance settings.'};
 const nextConfig={...config,presentation};
 if(field==='absent')delete nextConfig.presentation;else if(field==='null')nextConfig.presentation=null;
 return {ok:/** @type {const} */ (true),nextConfig,undo:{kind:'owner_locks',value:before===undefined?null:[...before],field:parent}};
}
export {APP_LOCK_CHOICES,editAppOwnerLocks};
