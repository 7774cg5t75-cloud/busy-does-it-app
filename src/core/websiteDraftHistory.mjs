// The existing eight-entry private undo/redo stacks, scoped to one active editor.
function createWebsiteDraftHistory(){
 let key='',undo=[],redo=[],point=null;
 function setScope(scope){
  const next=JSON.stringify([scope.ownerId||'',scope.businessId||'',scope.websiteId||'']);
  if(next!==key){key=next;undo=[];redo=[];point=null;}
  return key;
 }
 const update=(field,value,expected)=>{
  if(expected!==key)return false;
  if(field==='point')point=value;
  else if(field==='undo')undo=(typeof value==='function'?value(undo):value).slice(-8);
  else redo=(typeof value==='function'?value(redo):value).slice(-8);
  return true;
 };
 return {setScope,update,isCurrent:expected=>expected===key,snapshot:()=>({undo,redo,point})};
}
export {createWebsiteDraftHistory};
