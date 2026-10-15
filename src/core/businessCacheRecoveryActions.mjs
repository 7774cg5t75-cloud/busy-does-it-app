import {businessCacheKey} from './businessCache.mjs';
// Owner-controlled export/discard of an existing scoped recovery copy. No
// restoration, remote write, migration or automatic conflict resolution.
function createBusinessCacheRecoveryActions({getCurrent,ownerKey,share,remove,confirm,onChange,onNotice}){
 let pending=false;
 const capture=()=>{const c=getCurrent(),r=c?.recovery;return r&&r.ownerScope===c.ownerScope&&r.businessId===c.businessId?{...c,recovery:r,stamp:JSON.stringify(c.payload)}:null;};
 const current=s=>{const c=getCurrent();return c?.ownerScope===s.ownerScope&&c.businessId===s.businessId&&c.recovery===s.recovery;};
 async function exportCopy(){
  const source=capture();if(!source||pending)return false;pending=true;
  try{const result=await share(JSON.stringify({kind:'busy-private-device-recovery-export',businessId:source.businessId,baseRevision:source.recovery.revision,data:source.recovery.payload},null,2));
   if(result?.cancelled){if(current(source))onNotice('Export cancelled. The recovery copy remains preserved.');return false;}
   if(current(source))onNotice('Recovery copy shared with your chosen destination. No cloud data changed.');return true;
  }catch{if(current(source))onNotice('Recovery export was not confirmed. The copy is still preserved.');return false;}finally{pending=false;}
 }
 function discardCopy(){
  const source=capture();if(!source||pending)return false;let consumed=false;
  confirm(async()=>{
   if(consumed||pending||!current(source)||JSON.stringify(getCurrent().payload)!==source.stamp)return false;consumed=true;pending=true;
   try{const key=businessCacheKey(ownerKey(source.recovery.ownerId),source.businessId);
    if(!key)throw Error('Invalid recovery scope');
    await remove(key,()=>current(source));
    if(!current(source))return false;
    onChange(null);onNotice('Earlier recovery copy discarded. Your current work stays unchanged.');return true;
   }catch{if(current(source))onNotice('The recovery copy could not be cleared. It remains protected.');return false;}finally{pending=false;}
  });return true;
 }
 return {exportCopy,discardCopy};
}
export {createBusinessCacheRecoveryActions};
