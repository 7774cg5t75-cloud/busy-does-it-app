import {enqueuePrivateCheckpoint} from './privateCheckpointQueue.mjs';
import {stableJson} from './stableJson.mjs';
const uuid=x=>typeof x==='string'&&/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(x),only=(o,keys)=>o&&Object.keys(o).sort().join(',')===keys.sort().join(',');
export function validFormRecovery(r,{accountId,appId},now=Date.now()){
 return only(r,['version','accountId','identity','proof','requestKey','reviewDigest','expiresAt','savedAt'])&&r.version===1&&r.accountId===accountId&&uuid(accountId)&&only(r.identity,['id','expectedAppId','expectedVersionId'])&&Object.values(r.identity).every(uuid)&&r.identity.expectedAppId===appId&&only(r.proof,['challengeId','token','solution'])&&uuid(r.proof.challengeId)&&typeof r.proof.token==='string'&&/^[A-Za-z0-9_-]{20,100}$/.test(r.proof.token)&&Number.isInteger(r.proof.solution)&&r.proof.solution>=0&&r.proof.solution<=2000000&&uuid(r.requestKey)&&/^[a-f0-9]{64}$/.test(r.reviewDigest)&&Number.isSafeInteger(r.savedAt)&&r.savedAt<=now&&Number.isSafeInteger(r.expiresAt)&&r.expiresAt>r.savedAt&&r.expiresAt-r.savedAt<=90*86400000;
}
// This constructor is for an already trusted encrypted native-storage boundary only.
// Browser/localStorage and arbitrary storage objects do not become secure by setting a flag.
export function createCustomerFormRecovery(storage,scope,{now=Date.now,isCurrent=()=>true}={}){
 scope=Object.freeze({...scope});
 const key=uuid(scope.accountId)&&uuid(scope.appId)?'bdi_form_receipt_v1_'+scope.accountId+'_'+scope.appId:null;
 const ready=async()=>{if(!key||!isCurrent()||!await storage?.isAvailableAsync?.()||!storage.getItemAsync||!storage.setItemAsync||!storage.deleteItemAsync)throw Error('Protected receipt storage is unavailable');};
 const read=async()=>{await ready();const text=await storage.getItemAsync(key);if(!isCurrent())throw Error('Account changed');if(!text)return null;if(typeof text!=='string'||text.length>1800)throw Error('Invalid protected receipt');const r=JSON.parse(text);if(!validFormRecovery(r,scope,now()))throw Error('Foreign or invalid receipt capability');if(r.expiresAt<=now()){await storage.deleteItemAsync(key);return null;}return r;};
 return {scope:{...scope},load:()=>enqueuePrivateCheckpoint(key,read),
 save:record=>enqueuePrivateCheckpoint(key,async()=>{await ready();const r={version:1,accountId:scope.accountId,...record};if(!validFormRecovery(r,scope,now())||r.expiresAt<=now())throw Error('Invalid recovery scope');const old=await read();if(old&&stableJson(old)!==stableJson(r))throw Error('Inspect or explicitly clear the existing enquiry first');const text=stableJson(r);if(text.length>1800)throw Error('Recovery capability exceeds protected limit');if(!isCurrent())throw Error('Account changed');await storage.setItemAsync(key,text);const observed=await read();if(!isCurrent()||stableJson(observed)!==text)throw Error('Protected write could not be independently read back');return true;}),
 clear:requestKey=>enqueuePrivateCheckpoint(key,async()=>{const old=await read();if(old&&old.requestKey!==requestKey)throw Error('A newer recovery capability is protected');if(!isCurrent())throw Error('Account changed');await storage.deleteItemAsync(key);return true;})};
}
