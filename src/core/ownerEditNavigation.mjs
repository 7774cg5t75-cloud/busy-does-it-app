// One volatile navigation guard, never a draft store or save authority.
export function createOwnerEditNavigation({getScope,confirm}){
 const active=new Map();let epoch=0,prompt=0,permit=null;
 const current=()=>{for(const [token,item] of active)if(item.scope!==getScope())active.delete(token);return [...active.values()];};
 const same=(a,b)=>a.source===b.source&&a.projectId===b.projectId&&a.revision===b.revision&&a.ownerId===b.ownerId&&a.businessId===b.businessId;
 const guard={
  report({token,identity,scope,dirty,onDiscard}){
   if(scope!==getScope()||!token||!identity||typeof identity!=='object')return false;
   current();
   if(dirty){active.set(token,{token,identity,scope,onDiscard,epoch:++epoch});return true;}
   const item=active.get(token);
   if(item&&same(item.identity,identity)){active.delete(token);epoch++;}return true;
  },
  release(token){if(active.delete(token)){epoch++;prompt++;}},
  // Only the sole current editor may acknowledge its own synchronous save.
  withCommit(token,identity,transition){
   const items=current(),item=items[0];
   if(items.length>1||item&&(item.token!==token||!same(item.identity,identity)))return false;
   const previous=permit;permit=item;
   try{return transition();}finally{permit=previous;}
  },
  hasDirtySource(source){return current().some(item=>item.identity.source===source||item.identity.projectId===source?.id);},
  sourceChange(source,transition){
   const items=current();
   if(!items.length||items.length===1&&permit===items[0]&&permit.identity.source===source)return transition();
   return guard.request(transition,{reason:'source-change'});
  },
  request(transition,{reason='navigation'}={}){
   const captured=current();
   if(!captured.length){transition();return true;}
   const capturedEpoch=epoch,sequence=++prompt;
   confirm({reason,keep:()=>{if(sequence===prompt)prompt++;},discard:()=>{
    const fresh=current();
    if(sequence!==prompt||capturedEpoch!==epoch||fresh.length!==captured.length||captured.some(item=>active.get(item.token)!==item))return false;
    for(const item of captured){if(item.onDiscard?.()===false)return false;}
    // Reentrant callbacks cannot clear newly registered typing.
    if(capturedEpoch!==epoch||sequence!==prompt)return false;
    for(const item of captured)active.delete(item.token);
    epoch++;prompt++;transition();return true;
   }});return false;
  }
 };
 return guard;
}
