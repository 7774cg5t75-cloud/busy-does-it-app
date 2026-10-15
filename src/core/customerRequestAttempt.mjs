import {enqueuePrivateCheckpoint} from './privateCheckpointQueue.mjs';
import {textChecksum} from './durableMessageRetryV3185.mjs';
import {stableJson} from './stableJson.mjs';
const UUID=/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const KEY=/^[A-Za-z0-9:_-]{8,180}$/;
// Extends the existing encrypted retry-reference pattern, not a request ledger.
// No contact details, message text, credentials or automatic mutation replay.
function createCustomerRequestAttempt(storage,{userId,appId,versionId,requestType}={},newKey){
 const valid=UUID.test(userId)&&UUID.test(appId)&&UUID.test(versionId)&&['enquiry','booking_request'].includes(requestType);
 const slot=valid?`bdi_req_retry_v1_${userId}_${appId}_${requestType}`:'';
 const queue=work=>enqueuePrivateCheckpoint(slot,work);
 async function read(){
  if(!valid||!storage?.getItemAsync||!storage?.setItemAsync||!storage?.deleteItemAsync)throw Error('Secure request recovery is unavailable. Nothing new was sent.');
  const raw=await storage.getItemAsync(slot);if(!raw)return null;
  if(raw.length>1200)throw Error('The earlier request reference needs review. Nothing new was sent.');
  let saved;try{saved=JSON.parse(raw);}catch{throw Error('The earlier request reference is unreadable. Nothing new was sent.');}
  if(!saved||typeof saved!=='object'||Array.isArray(saved)||Object.keys(saved).some(k=>!['v','userId','appId','versionId','requestType','key','checksum'].includes(k))||saved.v!==1||saved.userId!==userId||saved.appId!==appId||saved.requestType!==requestType||
   !UUID.test(saved.versionId)||typeof saved.key!=='string'||!KEY.test(saved.key)||typeof saved.checksum!=='string'||!/^\d{1,5}:[a-f0-9]{16}$/.test(saved.checksum))
   throw Error('The earlier request reference cannot be verified. Nothing new was sent.');
  return saved;
 }
 return {pending:()=>queue(read),prepare:payload=>queue(async()=>{
  const saved=await read();let checksum;
  try{checksum=textChecksum(stableJson(payload),12000);}catch{}
  if(!checksum)throw Error('Review the request details before sending.');
  if(saved)return {key:saved.key,retrying:true,blocked:saved.checksum!==checksum||saved.versionId!==versionId};
  const key=newKey?.();if(typeof key!=='string'||!KEY.test(key))throw Error('A safe request reference could not be prepared.');
  await storage.setItemAsync(slot,JSON.stringify({v:1,userId,appId,versionId,requestType,key,checksum}));
  return {key,retrying:false,blocked:false};
 }),complete:key=>queue(async()=>{const saved=await read();if(!saved)return true;if(saved.key!==key)return false;await storage.deleteItemAsync(slot);return true;})};
}
export {createCustomerRequestAttempt};
