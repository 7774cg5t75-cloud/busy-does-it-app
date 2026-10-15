import {validateDesignFeedback} from './appDesignLearning.mjs';
import {privateAppEditSource} from './privateAppEditSession.mjs';
// Original feedback endpoint/ledger, with live-scope transport guards and stable
// request identity. No retry queue, new learning store or training operation.
function createAppDesignFeedbackActions(getScope){
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
  const body=kind==='record'?{...payload,context:payload.context||'preview',source:payload.source||'manual',ownerApproved:true}:
   {appId:base.appId,ownerApproved:true};
  if(kind==='record'){
   const valid=validateDesignFeedback(body);if(!valid.ok||body.expectedRevision!==base.revision)return fail(valid.reason||'The app revision changed.');
  }
  const requestKey=kind==='record'?['df1',scope.userId,base.appId,base.revision,body.field,body.value,
   body.context==='preview'?'p':'s',{better:'b',worse:'w',not_quite_right:'n'}[body.verdict],body.source,
   body.baselineWarnings??'none',body.proposedWarnings??'none'].join(':'):'';
  if(kind==='record'&&!/^[a-zA-Z0-9:_-]{8,160}$/.test(requestKey))return fail('A stable private feedback reference could not be prepared.');
  pending=true;
  try{
   const action=kind==='record'?'record_design_feedback':'clear_design_feedback';
   const response=await send(action,body,{isCurrent:current,...requestKey?{requestKey}:{}});
   if(!current()||response?.ok!==true||response.businessId!==base.businessId||response.appId!==base.appId||
    (kind==='record'?(response.feedbackRecorded!==true||response.draftRevision!==base.revision||
     response.feedbackContext!==body.context||response.publishedAppUnchanged!==true):
     response.cleared!==true||response.publicAppUnchanged!==true))return fail('The feedback result could not be verified. Check the current private history before another action.');
   return kind==='record'?{ok:true,saved:true}:{ok:true,cleared:true};
  }catch{return fail('Feedback confirmation is unavailable. Check the current private history before repeating; no action was replayed.');}
  finally{pending=false;}
 }
 return {record:(payload,send,reviewed)=>run('record',payload,send,reviewed),clear:(payload,send,reviewed)=>run('clear',payload,send,reviewed)};
}
export {createAppDesignFeedbackActions};
