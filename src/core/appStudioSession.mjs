import {bindPrivateAppProposal,currentPrivateAppProposal,privateAppEditSource} from './privateAppEditSession.mjs';
import {proposeCoordinatedAppChanges} from './appCoordinatedStudio.mjs';

// Ephemeral editor lifecycle over the original planner/save service. No storage,
// provider, publication, billing or new data ledger. Receipt evidence stays exact.
function createAppStudioSession(){
 let context={},owner='',epoch=0,listener=null,pending=false;
 let preview=null,undo=null,notice='',uncertain=false;
 const notify=()=>listener?.();
 const principal=c=>[c.ownerId,c.businessId,c.app?.id].join(':');
 const valid=p=>!!context.ownerId&&currentPrivateAppProposal(p,context);
 function setContext(next){
  if(principal(next)!==owner){owner=principal(next);epoch++;preview=null;undo=null;notice='';uncertain=false;}
  context=next;
 }
 function snapshot(){
  const proposed=valid(preview)?preview:null,inverse=valid(undo)?undo:null;
  return {preview:proposed,undo:inverse,notice,pending,uncertain,
   canApprove:!!proposed&&!pending&&!uncertain,canUndo:!!inverse&&!pending&&!uncertain};
 }
 function prepare(proposal){
  if(pending)return false;
  preview=proposal?bindPrivateAppProposal(proposal,context):null;
  uncertain=false;notify();return !!preview;
 }
 function setNotice(value){notice=String(value||'').slice(0,500);notify();}
 async function submit(kind,save){
  const state=snapshot(),proposal=kind==='undo'?state.undo:state.preview;
  if(!proposal||pending||uncertain||typeof save!=='function')return {ok:false};
  const startEpoch=epoch,source=proposal.source;
  const expectedPlan=proposeCoordinatedAppChanges(context.app.draft_config,proposal.operations);
  if(!expectedPlan.ok)return {ok:false,reason:expectedPlan.reason};
  pending=true;notify();
  try{
   const result=await save({appId:source.appId,expectedRevision:source.revision,
    source,operations:proposal.operations});
   if(epoch!==startEpoch)return {ok:false,reason:'The editor workspace changed.'};
   const live=privateAppEditSource(context);
   const returned=result?.status?.app;
   const savedContext={...context,app:returned,config:proposal.nextConfig};
   const savedSource=privateAppEditSource(savedContext);
   const inverse=returned?bindPrivateAppProposal(
    proposeCoordinatedAppChanges(returned.draft_config,expectedPlan.undoOperations),savedContext):null;
   const sameCommands=JSON.stringify(result?.undoOperations)===JSON.stringify(expectedPlan.undoOperations);
   const stillRelated=live&&(live.revision===source.revision&&live.configStamp===source.configStamp||
    live.revision===source.revision+1&&live.configStamp===savedSource?.configStamp);
   if(result?.ok===true&&savedSource?.appId===source.appId&&
      savedSource.businessId===source.businessId&&savedSource.revision===source.revision+1&&
      result.newRevision===savedSource.revision&&sameCommands&&stillRelated&&inverse){
    preview=null;undo=kind==='undo'?null:inverse;uncertain=false;
    notice=kind==='undo'?'Batch reversed in one new private revision. No public changes.':
     'Saved as one PRIVATE revision. Your live app is unchanged.';
    return result;
   }
   uncertain=true;
   notice=result?.reason||'Save confirmation is uncertain. Check the current private draft before another approval.';
   return {...result,ok:false};
  }catch{
   if(epoch!==startEpoch)return {ok:false};
   uncertain=true;notice='Save confirmation was interrupted. Check the current private draft before another approval.';
   return {ok:false};
  }finally{pending=false;notify();}
 }
 function removeChange(index){
  if(pending||uncertain||!valid(preview)||!Number.isInteger(index)||
     index<0||index>=preview.operations.length)return false;
  const remaining=preview.operations.filter((_,i)=>i!==index);
  if(!remaining.length){preview=null;notice='All proposed changes were removed. Nothing was saved.';notify();return true;}
  const result=proposeCoordinatedAppChanges(context.app.draft_config,remaining);
  if(!result.ok){setNotice(result.reason);return false;}
  return prepare(result);
 }
 return {setContext,snapshot,prepare,setNotice,removeChange,
  approve:save=>submit('approve',save),undo:save=>submit('undo',save),
  discard:()=>{if(pending)return false;preview=null;notice='No further changes saved.';notify();return true;},
  attach:callback=>{listener=callback;},detach:()=>{listener=null;epoch++;}};
}
export {createAppStudioSession};
