// One volatile navigation guard, never a draft store or save authority.
export function createOwnerEditNavigation({getScope,confirm}){
 let active=null,epoch=0,prompt=0,permit=null;
 const current=()=>{if(active?.scope!==getScope())active=null;return active;};
 const guard={
  report({token,identity,scope,dirty,onDiscard}){
   if(scope!==getScope()||!token||!identity||typeof identity!=='object')return false;
   if(dirty){active={token,identity,scope,onDiscard,epoch:++epoch};return true;}
   if(active?.token===token&&active.identity.source===identity.source&&active.identity.projectId===identity.projectId&&active.identity.revision===identity.revision){active=null;epoch++;}return true;
  },
  release(token){if(active?.token===token){active=null;epoch++;prompt++;}},
  // Synchronous original owner-save only. This is UI draft coordination, not authority.
  withCommit(token,identity,transition){
   const item=current();
   if(item&&(item.token!==token||item.identity.source!==identity.source||item.identity.projectId!==identity.projectId||item.identity.revision!==identity.revision||item.identity.ownerId!==identity.ownerId||item.identity.businessId!==identity.businessId))return false;
   const previous=permit;permit=item;
   try{return transition();}finally{permit=previous;}
  },
  hasDirtySource(source){const item=current();return !!item&&(item.identity.source===source||item.identity.projectId===source?.id);},
  sourceChange(source,transition){
   const item=current();
   if(!item||permit===item&&item.identity.source===source)return transition();
   return guard.request(transition,{reason:'source-change'});
  },
  request(transition,{reason='navigation'}={}){
   if(active?.scope!==getScope())active=null;
   if(!active){transition();return true;}
   const captured=active,sequence=++prompt;
   confirm({reason,keep:()=>{if(sequence===prompt)prompt++;},discard:()=>{
    if(sequence!==prompt||active!==captured||captured.scope!==getScope()||captured.epoch!==epoch)return false;
    if(captured.onDiscard?.()===false)return false;active=null;epoch++;prompt++;transition();return true;
   }});return false;
  }
 };
 return guard;
}
