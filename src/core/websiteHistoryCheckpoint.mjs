import {enqueuePrivateCheckpoint} from './privateCheckpointQueue.mjs';
import {websiteDraftHasScope} from './websiteDraftScope.mjs';
const UUID=/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const MAX=60000,AGE=7*24*60*60*1000;
// HTML is derived by the original renderer, never executable recovery authority.
const compact=d=>{if(!d)return null;const {html,...data}=d;return JSON.parse(JSON.stringify(data));};
const identity=s=>[s.ownerId,s.businessId,s.websiteId];
function websiteHistoryCheckpointKey(s={}){
 return UUID.test(s.ownerId||'')&&UUID.test(s.businessId||'')&&/^[a-zA-Z0-9_-]{1,100}$/.test(s.websiteId||'')?
  `busy_website_history_v1_${identity(s).join('_')}`:'';
}
function validDraft(d,s){return d?.id===s.websiteId&&Number.isSafeInteger(d.generation)&&d.generation>=1&&Array.isArray(d.sections)&&
 websiteDraftHasScope(d,s.businessId);}
function createWebsiteHistoryCheckpoint(storage,scope,{now=Date.now}={}){
 const key=websiteHistoryCheckpointKey(scope);
 return {
  save:(draft,state)=>enqueuePrivateCheckpoint(key,async()=>{
   if(!key||!validDraft(draft,scope))throw Error('Encrypted website recovery needs a signed-in, current business draft.');
   const saved={v:1,scope:identity(scope),at:now(),anchor:compact(draft),
    undo:state.undo.map(compact),redo:state.redo.map(compact),point:state.point?{...state.point,snapshot:compact(state.point.snapshot)}:null};
   if([...saved.undo,...saved.redo,...(saved.point?[saved.point.snapshot]:[])].some(d=>!validDraft(d,scope)))throw Error('Website history has an invalid business scope.');
   // Retain the most recent history that fits; never truncate a draft or a point.
   while(JSON.stringify(saved).length>MAX&&(saved.undo.length||saved.redo.length)){
    if(saved.undo.length>=saved.redo.length)saved.undo.shift();else saved.redo.shift();
   }
   const raw=JSON.stringify(saved);if(raw.length>MAX)throw Error('This website is too large for encrypted device recovery. Your current draft remains available; export a content copy.');
   await storage.setItemAsync(key,raw);if(await storage.getItemAsync(key)!==raw)throw Error('Private device recovery could not be read back exactly. Keep your current work; no account save is confirmed.');return {undo:saved.undo.length,redo:saved.redo.length};
  }),
  load:draft=>enqueuePrivateCheckpoint(key,async()=>{
   if(!key||!validDraft(draft,scope))return null;
   const raw=await storage.getItemAsync(key);if(!raw)return null;
   if(raw.length>MAX)throw Error('The encrypted website recovery record is too large.');
   const s=JSON.parse(raw);
   if(s?.v!==1||JSON.stringify(s.scope)!==JSON.stringify(identity(scope))||!Number.isSafeInteger(s.at)||s.at>now()||now()-s.at>AGE)
    throw Error('The saved website history is expired or belongs to another workspace.');
   if(!Array.isArray(s.undo)||!Array.isArray(s.redo)||s.undo.length>8||s.redo.length>8||
    [...s.undo,...s.redo,...(s.point?[s.point.snapshot]:[])].some(d=>!validDraft(d,scope)))throw Error('The saved website history is invalid.');
   if(s.point&&(s.point.ownerId!==scope.ownerId||s.point.businessId!==scope.businessId||s.point.draftId!==scope.websiteId||s.point.privateOnly!==true||s.point.ok!==true))throw Error('The saved recovery point has an invalid scope.');
   if(!validDraft(s.anchor,scope))throw Error('The saved private draft is invalid.');
   if(JSON.stringify(s.anchor)!==JSON.stringify(compact(draft))){
    // The encrypted history may finish before the existing draft cache. Offer,
    // never auto-apply, that head only from its exact immediate predecessor.
    if(JSON.stringify(s.undo.at(-1))!==JSON.stringify(compact(draft))||s.anchor.generation<=draft.generation||s.anchor.publicStatus!==draft.publicStatus)
     throw Error('Saved history does not match this exact website revision. It was not restored.');
    return {undo:[],redo:[],point:{ok:true,draftId:scope.websiteId,generation:s.anchor.generation,
     createdAt:new Date(s.at).toISOString(),snapshot:s.anchor,ownerId:scope.ownerId,businessId:scope.businessId,privateOnly:true},interrupted:true};
   }
   return {undo:s.undo,redo:s.redo,point:s.point};
  })
 };
}
export {websiteHistoryCheckpointKey,createWebsiteHistoryCheckpoint};
