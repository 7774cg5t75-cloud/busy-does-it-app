import React from 'react';
import * as SecureStore from 'expo-secure-store';
import {createWebsiteHistoryCheckpoint,websiteHistoryCheckpointKey} from '../core/websiteHistoryCheckpoint.mjs';
import {createWebsiteDraftHistory} from '../core/websiteDraftHistory.mjs';
import {websiteDraftHasScope} from '../core/websiteDraftScope.mjs';
function useWebsiteDraftHistory(scope){
 const history=React.useRef(null),[,redraw]=React.useState(0);
 const [recovery,setRecovery]=React.useState({key:'',ready:false,notice:''});
 const live=React.useRef(scope);live.current=scope;
 if(!history.current)history.current=createWebsiteDraftHistory();
 const editor=history.current,key=editor.setScope(scope);
 const set=field=>value=>{if(editor.update(field,value,key))redraw(n=>n+1);};
 const state=editor.snapshot();
 const storageKey=websiteDraftHasScope(scope.draft,scope.businessId)?websiteHistoryCheckpointKey(scope):'';
 React.useEffect(()=>{
  let active=true;const source=scope.draft,historyRevision=editor.revision();
  setRecovery({key,ready:false,notice:''});
  if(!storageKey||!source){setRecovery({key,ready:false,notice:'Encrypted recovery needs a website verified in this business workspace. Open its current cloud draft first.'});return;}
  const store=createWebsiteHistoryCheckpoint(SecureStore,scope);
  store.load(source).then(saved=>{
   if(!active||!editor.isCurrent(key))return;
   if(live.current.draft!==source){setRecovery({key,ready:true,notice:'The draft changed during recovery. Saved history was not applied.'});return;}
   if(saved&&editor.revision()!==historyRevision){setRecovery({key,ready:true,notice:'Editing continued while device history was checked. Earlier history was not applied.'});return;}
   if(saved&&editor.snapshot().undo.length===0&&editor.snapshot().redo.length===0&&!editor.snapshot().point){
    for(const field of ['undo','redo','point'])editor.update(field,saved[field],key);
    redraw(n=>n+1);
   }
   setRecovery({key,ready:true,notice:saved?.interrupted?'An interrupted private edit is available under Restore saved design. Review it before publishing.':saved?'Restored encrypted history for this exact private draft.':''});
  }).catch(error=>{if(active&&editor.isCurrent(key))setRecovery({key,ready:true,blockedDraft:live.current.draft,blockedState:editor.snapshot(),notice:String(error.message)});});
  return ()=>{active=false;};
 },[key,storageKey]);
 React.useEffect(()=>{
  if(recovery.key!==key||!recovery.ready||!storageKey||!scope.draft)return;
  if(recovery.blockedDraft===scope.draft&&recovery.blockedState?.undo===state.undo&&recovery.blockedState?.redo===state.redo&&recovery.blockedState?.point===state.point)return;
  let active=true;
  createWebsiteHistoryCheckpoint(SecureStore,scope).save(scope.draft,state).then(count=>{
   if(active&&editor.isCurrent(key))setRecovery(old=>({...old,notice:`Encrypted device recovery saved (${count.undo} Undo, ${count.redo} Redo). Live websites are unchanged.`}));
  }).catch(error=>{if(active&&editor.isCurrent(key))setRecovery(old=>({...old,notice:'Device recovery unavailable: '+String(error.message)}));});
  return ()=>{active=false;};
 },[key,storageKey,recovery.ready,scope.draft,state.undo,state.redo,state.point]);
 return {websiteRecoveryNotice:recovery.key===key?recovery.notice:'',websiteUndo:state.undo,websiteRedo:state.redo,websiteRecoveryPoint:state.point,
  websiteHistoryIsCurrent:()=>editor.isCurrent(key)&&(!scope.businessId||websiteDraftHasScope(live.current.draft,scope.businessId)),setWebsiteUndo:set('undo'),setWebsiteRedo:set('redo'),setWebsiteRecoveryPoint:set('point')};
}
export {useWebsiteDraftHistory};
