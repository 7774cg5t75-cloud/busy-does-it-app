// One volatile navigation guard, never a draft store or save authority.
export function createOwnerEditNavigation({getScope,confirm}){
 let active=null,epoch=0,prompt=0;
 return {
  report({token,identity,scope,dirty,onDiscard}){
   if(scope!==getScope()||!token||!identity||typeof identity!=='object')return false;
   if(dirty){active={token,identity,scope,onDiscard,epoch:++epoch};return true;}
   if(active?.token===token&&active.identity.source===identity.source&&active.identity.projectId===identity.projectId&&active.identity.revision===identity.revision){active=null;epoch++;}return true;
  },
  release(token){if(active?.token===token){active=null;epoch++;prompt++;}},
  request(transition){
   if(active?.scope!==getScope())active=null;
   if(!active){transition();return true;}
   const captured=active,sequence=++prompt;
   confirm({keep:()=>{if(sequence===prompt)prompt++;},discard:()=>{
    if(sequence!==prompt||active!==captured||captured.scope!==getScope()||captured.epoch!==epoch)return false;
    if(captured.onDiscard?.()===false)return false;active=null;epoch++;prompt++;transition();return true;
   }});return false;
  }
 };
}
