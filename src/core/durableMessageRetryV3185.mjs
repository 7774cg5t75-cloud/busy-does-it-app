import {enqueuePrivateCheckpoint} from './privateCheckpointQueue.mjs';
/**
 * V3.185 — private, durable request key for uncertain mobile message delivery.
 *
 * Store ONLY the opaque request key + a local message checksum in SecureStore.
 * No conversation content, tokens, email addresses, or business data are saved.
 * The checksum is an equality hint, NOT a cryptographic security assertion:
 * Postgres independently rejects replay keys with different actual message text.
 *
 * Unknown transport results preserve the key even across an app restart.
 * A changed draft must first be reconciled; never silently issue a new key
 * while a previous message might already have committed.
 */
const ID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const KEY=/^[A-Za-z0-9:_-]{8,180}$/;
function stableMessageSlot({actorUserId="",businessId="",role="",requestId=""}={}){
 if(!ID.test(actorUserId)||!ID.test(requestId)||
    (businessId&&!ID.test(businessId))||!["business","customer"].includes(role)||
    (role==="business"&&!businessId))return "";
 return "bdi_msg_retry_v3185_"+role+"_"+actorUserId+"_"+(businessId||"customer")+"_"+requestId;
}
function textChecksum(value,max=3000){
 if(typeof value!=="string"||!value.trim()||value.length>max||!Number.isInteger(max)||max<1||max>12000)return "";
 // Two independent 32-bit accumulators; used only for local draft comparison.
 // Database uses exact body equality so checksum collisions cannot rewrite text.
 let a=2166136261,b=0x9e3779b9;
 for(let i=0;i<value.length;i++){
  const c=value.charCodeAt(i);
  a=Math.imul(a^c,16777619)>>>0;
  b=Math.imul(b+(c^i),2246822519)>>>0;
 }
 return value.length+":"+a.toString(16).padStart(8,"0")+b.toString(16).padStart(8,"0");
}
async function prepareDurableMessageAttempt(storage,fields={},makeKey){
 const slot=stableMessageSlot(fields);
 const checksum=textChecksum(fields.message);
 if(!slot||!checksum||typeof makeKey!=="function")
  return {ok:false,reason:"Open your signed-in BUSY conversation and enter a valid reply."};
 if(!storage||typeof storage.getItemAsync!=="function"||
  typeof storage.setItemAsync!=="function"||
  typeof storage.deleteItemAsync!=="function")
  return {ok:false,reason:"Encrypted retry storage is unavailable; no reply was sent."};
 return enqueuePrivateCheckpoint(slot,async()=>{try {
  const raw=await storage.getItemAsync(slot);
  if(raw){
   const saved=JSON.parse(raw);
   if(!saved||saved.v!==1||typeof saved.key!=="string"||!KEY.test(saved.key)||typeof saved.checksum!=="string")
    return {ok:false,reason:"An earlier reply needs checking before sending another."};
   if(saved.checksum!==checksum)
    return {ok:false,reason:"Your previous reply might have been saved. Retry the original text or check the conversation before changing it."};
   return {ok:true,slot,key:saved.key,retrying:true};
  }
  const key=makeKey();
  if(typeof key!=="string"||!KEY.test(key))
   return {ok:false,reason:"Could not safely generate a unique reply reference."};
  await storage.setItemAsync(slot,JSON.stringify({v:1,key,checksum}));
  return {ok:true,slot,key,retrying:false};
 }catch(error){
  return {ok:false,reason:"Could not access secure reply-retry storage. No new message was submitted."};
 }});
}
async function clearDurableMessageAttempt(storage,attempt){
 if(!attempt?.ok||!attempt.slot)return false;
 return enqueuePrivateCheckpoint(attempt.slot,async()=>{
  try{const raw=await storage.getItemAsync(attempt.slot);if(raw){const saved=JSON.parse(raw);if(saved.v!==1||saved.key!==attempt.key)return false;}await storage.deleteItemAsync(attempt.slot);return true;}
  catch{return false;}
 });
}
export {stableMessageSlot,textChecksum,prepareDurableMessageAttempt,clearDurableMessageAttempt};
