import {bindPrivateAppProposal,currentPrivateAppProposal,privateAppEditSource} from './privateAppEditSession.mjs';
import {proposeCoordinatedAppChanges} from './appCoordinatedStudio.mjs';

// Original planner/save lifecycle with optional encrypted-device checkpoints.
// No provider, publication, billing or new backend ledger. Receipts stay exact.
function createAppStudioSession({checkpoint=null}={}){
 let context={},owner='',epoch=0,listener=null,pending=false;
 let preview=null,undo=null,notice='',uncertain=false,recoveryReady=!checkpoint,recoveryError='';
 let recoveryPhase='review',interrupted=false,uncertainSource=null;
 const checkpointState=()=>preview||undo||interrupted?{
  phase:recoveryPhase,...(interrupted&&!preview&&uncertainSource?{pendingSource:uncertainSource}:{}),preview:preview?{source:preview.source,operations:preview.operations}:null,
  undo:undo?{source:undo.source,operations:undo.operations}:null}:null;
 const persist=async()=>{
  if(!checkpoint||!recoveryReady)return;
  try{await checkpoint.save(checkpointState());recoveryError='';}
  catch(error){recoveryError=String(error?.message||'Encrypted Studio recovery is unavailable.');throw error;}
 };
 const notify=()=>listener?.();
 const changed=()=>{notify();persist().then(notify,notify);};
 const principal=c=>[c.ownerId,c.businessId,c.app?.id].join(':');
 const valid=p=>!!context.ownerId&&currentPrivateAppProposal(p,context);
 function setContext(next){
  if(principal(next)!==owner){owner=principal(next);epoch++;preview=null;undo=null;notice='';uncertain=false;interrupted=false;uncertainSource=null;}
  context=next;
 }
 function snapshot(){
  const proposed=valid(preview)?preview:null,inverse=valid(undo)?undo:null;
  return {preview:proposed,undo:inverse,notice,pending,uncertain,recoveryReady,recoveryError,interrupted,
   canApprove:!!proposed&&!pending&&!uncertain&&recoveryReady,canUndo:!!inverse&&!pending&&!uncertain&&recoveryReady};
 }
 function prepare(proposal){
  if(pending||!recoveryReady)return false;
  if(uncertain){setNotice('Check the current private draft before replacing an uncertain save. Nothing was replayed.');return false;}
  preview=proposal?bindPrivateAppProposal(proposal,context):null;
  uncertain=false;interrupted=false;recoveryPhase='review';changed();return !!preview;
 }
 function setNotice(value){notice=String(value||'').slice(0,500);notify();}
 async function submit(kind,save){
  const state=snapshot(),proposal=kind==='undo'?state.undo:state.preview;
  if(!proposal||pending||uncertain||!recoveryReady||typeof save!=='function')return {ok:false};
  const startEpoch=epoch,source=proposal.source;let dispatched=false;
  const expectedPlan=proposeCoordinatedAppChanges(context.app.draft_config,proposal.operations);
  if(!expectedPlan.ok)return {ok:false,reason:expectedPlan.reason};
  pending=true;recoveryPhase='submitting';notify();
  try{
   // Durable intent precedes the only mutation. Storage failure sends nothing.
   await persist();
   if(epoch!==startEpoch||!currentPrivateAppProposal(proposal,context))return {ok:false,reason:'The editor workspace changed.'};
   dispatched=true;
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
    preview=null;undo=kind==='undo'?null:inverse;uncertain=false;interrupted=false;recoveryPhase='confirmed';
    notice=kind==='undo'?'Batch reversed in one new private revision. No public changes.':
     'Saved as one PRIVATE revision. Your live app is unchanged.';
    return result;
   }
   undo=null;uncertain=true;interrupted=true;uncertainSource=source;
   notice=result?.reason||'Save confirmation is uncertain. Check the current private draft before another approval.';
   return {...result,ok:false};
  }catch{
   if(epoch!==startEpoch)return {ok:false};
   undo=null;uncertain=dispatched;interrupted=dispatched;uncertainSource=dispatched?source:null;if(!dispatched)recoveryPhase='review';notice=recoveryError||'Save confirmation was interrupted. Check the current private draft before another approval.';
   return {ok:false};
  }finally{pending=false;if(epoch===startEpoch)changed();else notify();}
 }
 function removeChange(index){
  if(pending||uncertain||!valid(preview)||!Number.isInteger(index)||
     index<0||index>=preview.operations.length)return false;
  const remaining=preview.operations.filter((_,i)=>i!==index);
  if(!remaining.length){preview=null;notice='All proposed changes were removed. Nothing was saved.';changed();return true;}
  const result=proposeCoordinatedAppChanges(context.app.draft_config,remaining);
  if(!result.ok){setNotice(result.reason);return false;}
  return prepare(result);
 }
 async function restore(){
  if(!checkpoint)return;
  const started=epoch;
  try{
   const saved=await checkpoint.load();if(epoch!==started)return;
   const recover=item=>{
    if(!item||!currentPrivateAppProposal(item,context))return null;
    const plan=proposeCoordinatedAppChanges(context.app.draft_config,item.operations);
    return plan.ok?bindPrivateAppProposal(plan,context):null;
   };
   if(saved){
    if(!['review','confirmed','submitting'].includes(saved.phase))throw Error('Unsupported Studio checkpoint.');
    preview=recover(saved.preview);undo=saved.phase!=='submitting'?recover(saved.undo):null;
    if(saved.phase==='submitting'){
     interrupted=true;uncertain=true;recoveryPhase='submitting';
     const pendingSource=saved.preview?.source||saved.pendingSource||saved.undo?.source;
     uncertainSource=pendingSource?.businessId===context.businessId&&pendingSource?.appId===context.app?.id&&Number.isSafeInteger(pendingSource.revision)&&pendingSource.revision>0?pendingSource:null;
     notice='An earlier save or undo may have finished. Refresh the private app and prepare a fresh preview; no operation was replayed.';
    }else{
     recoveryPhase=saved.phase;
     notice=preview?'Your private proposal was restored. Review it before approval.':undo?
      'Your last confirmed undo is available for this exact private revision.':
      'The private app changed. The old checkpoint cannot be applied; prepare a fresh preview.';
    }
   }
  }catch(error){if(epoch===started)recoveryError=String(error?.message||'Private recovery could not be loaded.');}
  finally{if(epoch===started){recoveryReady=true;notify();}}
 }
 async function reconcile(read){
  if(!uncertain||pending||typeof read!=='function'||!uncertainSource)return {ok:false};
  const started=epoch,base=uncertainSource,actor=principal(context),ownerId=context.ownerId;
  pending=true;notify();
  try{
   const result=await read({appId:base.appId});
   if(epoch!==started||principal(context)!==actor)return {ok:false};
   const observed=result?.app,source=privateAppEditSource({businessId:base.businessId,app:observed});
   if(result?.ok!==true||result.readOnly!==true||result.ownerId!==ownerId||result.businessId!==base.businessId||!source||source.appId!==base.appId||source.revision<=base.revision){
    notice='The earlier save is still unconfirmed. The original or an unverified draft was observed; do not repeat it yet.';return {ok:false};
   }
   context={...context,app:observed,config:observed.draft_config};
   preview=null;undo=null;uncertain=false;interrupted=false;uncertainSource=null;recoveryPhase='review';
   notice='A newer private draft was read. Review it and prepare a fresh proposal. The earlier save is not attributed and no Undo was inferred.';
   return {ok:true,readOnly:true,observedRevision:source.revision,previousSaveConfirmed:false};
  }catch{if(epoch===started)notice='Current draft readback was unavailable. The pending save remains protected; nothing was replayed.';return {ok:false};}
  finally{pending=false;if(epoch===started)changed();else notify();}
 }
 return {setContext,snapshot,prepare,setNotice,removeChange,restore,reconcile,
  approve:save=>submit('approve',save),undo:save=>submit('undo',save),
  discard:()=>{if(pending||!recoveryReady)return false;if(uncertain){setNotice('The earlier save may have finished. Read the current private draft before discarding this recovery state.');return false;}preview=null;undo=null;interrupted=false;uncertain=false;recoveryPhase='review';notice='No further changes saved.';changed();return true;},
  attach:callback=>{listener=callback;},detach:()=>{listener=null;epoch++;}};
}
export {createAppStudioSession};
