import {enqueuePrivateCheckpoint} from './privateCheckpointQueue.mjs';
// A single encrypted pending intent for the EXISTING feedback ledger. No
// automatic retry, secondary history, customer content or server migration.
function createPrivateFeedbackAttempt(storage,scope,{newKey=()=>`df2:${Date.now().toString(36)}:${Math.random().toString(36).slice(2,14)}`}={}){
 const key=`busy_design_feedback_v1_${scope.userId}_${scope.businessId}_${scope.app.id}`;
 const queue=work=>enqueuePrivateCheckpoint(key,work);
 return {
  prepare:body=>queue(async()=>{
   if(!storage?.getItemAsync||!storage?.setItemAsync)throw Error('Encrypted feedback recovery is unavailable. Nothing was sent.');
   const signature=JSON.stringify(body),raw=await storage.getItemAsync(key);
   if(raw&&raw.length>4000)throw Error('The pending feedback reference needs review.');
   const saved=raw?JSON.parse(raw):null;
   if(saved&&(saved.v!==1||!Number.isSafeInteger(saved.revision)||typeof saved.signature!=='string'||typeof saved.requestKey!=='string'))throw Error('The encrypted pending feedback reference is invalid.');
   if(saved&&saved.revision===body.expectedRevision){
    if(saved.signature!==signature)throw Error('A previous feedback confirmation is missing. Retry that original choice or explicitly clear your private feedback before changing it.');
    if(!/^[a-zA-Z0-9:_-]{8,160}$/.test(saved.requestKey))throw Error('The pending feedback reference is invalid.');
    return saved.requestKey;
   }
   const requestKey=newKey();if(!/^[a-zA-Z0-9:_-]{8,160}$/.test(requestKey))throw Error('A private feedback reference could not be prepared.');
   await storage.setItemAsync(key,JSON.stringify({v:1,revision:body.expectedRevision,signature,requestKey}));return requestKey;
  }),
  capture:()=>queue(async()=>{const raw=await storage.getItemAsync(key);return raw?{raw}:null;}),
  complete:requestKey=>queue(async()=>{
   if(!requestKey)return;
   const raw=await storage.getItemAsync(key);if(!raw)return;
   if(typeof requestKey==='object'?requestKey.raw===raw:JSON.parse(raw).requestKey===requestKey)await storage.deleteItemAsync(key);
  })
 };
}
export {createPrivateFeedbackAttempt};
