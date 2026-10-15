import {validateDesignFeedback} from './appDesignLearning.mjs';
import {privateAppEditSource} from './privateAppEditSession.mjs';
import {createPrivateFeedbackAttempt} from './privateFeedbackAttempt.mjs';
// Original feedback endpoint/ledger, with live-scope transport guards and stable
// per-attempt request identity. No retry queue, new learning history or training.
function feedbackBody(payload){
 const {appId,expectedRevision,field,value,verdict,context='preview',source='manual',baselineWarnings=null,proposedWarnings=null}=payload;
 return {appId,expectedRevision,field,value,verdict,context,source,baselineWarnings,proposedWarnings,ownerApproved:true};
}
function createAppDesignFeedbackActions(getScope,{storage,newKey}={}){
 let pending=false;
 async function run(kind,payload,send,reviewed){
  const scope=getScope(),base=privateAppEditSource({businessId:scope?.businessId,app:scope?.app});
  const fail=reason=>({ok:false,reason,mayRetry:false});
  if(pending)return fail('A private design-feedback action is already being checked.');
  const current=()=>{
   const live=getScope();return !!scope?.userId&&live?.userId===scope.userId&&live.businessId===scope.businessId&&
    JSON.stringify(privateAppEditSource({businessId:live.businessId,app:live.app}))===JSON.stringify(base);
  };
  if(!base||!current()||payload?.appId!==base.appId||reviewed&&
    (reviewed.ownerId!==scope.userId||reviewed.businessId!==scope.businessId))return fail('Open the current signed-in private app before changing feedback.');
  const body=kind==='record'?feedbackBody(payload):
   {appId:base.appId,ownerApproved:true};
  if(kind==='record'){
   const valid=validateDesignFeedback(body);if(!valid.ok||body.expectedRevision!==base.revision)return fail(valid.reason||'The app revision changed.');
  }
  pending=true;
  try{
   const attempt=createPrivateFeedbackAttempt(storage,scope,{newKey});
   let requestKey,cleanupUnavailable=false;
   if(kind==='record')requestKey=await attempt.prepare(body);
   else{try{requestKey=await attempt.capture();}catch{cleanupUnavailable=true;}}
   if(!current())return fail('The owner or private app changed before feedback was sent.');
   const action=kind==='record'?'record_design_feedback':'clear_design_feedback';
   const response=await send(action,body,{isCurrent:current,...kind==='record'?{requestKey}:{}});
   if(!current()||response?.ok!==true||response.businessId!==base.businessId||response.appId!==base.appId||
    (kind==='record'?(response.feedbackRecorded!==true||response.draftRevision!==base.revision||
     response.feedbackContext!==body.context||response.publishedAppUnchanged!==true):
     response.cleared!==true||response.publicAppUnchanged!==true))return fail('The feedback result could not be verified. Check the current private history before another action.');
   let recoveryPending=cleanupUnavailable;
   try{await attempt.complete(requestKey);}catch{recoveryPending=true;}
   if(!current())return fail('The owner or private app changed while confirming feedback. No result was applied.');
   return kind==='record'?{ok:true,saved:true,recoveryPending}:{ok:true,cleared:true,recoveryPending};
  }catch(error){return fail(String(error?.message||'Feedback confirmation is unavailable. Check private history before repeating; no action was replayed.').slice(0,300));}
  finally{pending=false;}
 }
 return {record:(payload,send,reviewed)=>run('record',payload,send,reviewed),clear:(payload,send,reviewed)=>run('clear',payload,send,reviewed)};
}
export {createAppDesignFeedbackActions};
