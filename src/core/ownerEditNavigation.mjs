// One volatile navigation guard, never a draft store or save authority.
export function createOwnerEditNavigation({getScope,confirm}){
 let active=null,epoch=0,prompt=0;
 return {
  report({token,identity,scope,dirty}){
   if(scope!==getScope())return false;
   if(dirty){active={token,identity,scope,epoch:++epoch};return true;}
   if(active?.token===token&&active.identity===identity){active=null;epoch++;}return true;
  },
  request(transition){
   if(active?.scope!==getScope())active=null;
   if(!active){transition();return true;}
   const captured=active,sequence=++prompt;
   confirm({keep:()=>{if(sequence===prompt)prompt++;},discard:()=>{
    if(sequence!==prompt||active!==captured||captured.scope!==getScope()||captured.epoch!==epoch)return false;
    active=null;epoch++;prompt++;transition();return true;
   }});return false;
  }
 };
}
