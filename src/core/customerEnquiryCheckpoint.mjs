import {enqueuePrivateCheckpoint} from './privateCheckpointQueue.mjs';
const ID=/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const LIMITS={name:120,email:200,phone:80,service:240,message:3000};
const selectionOK=s=>s===null||!!s&&typeof s==='object'&&!Array.isArray(s)&&Object.keys(s).every(k=>['recordId','revision','variantId'].includes(k))&&typeof s.recordId==='string'&&/^[A-Za-z0-9_-]{1,80}$/.test(s.recordId)&&Number.isSafeInteger(s.revision)&&s.revision>0&&(s.variantId===undefined||typeof s.variantId==='string'&&/^[A-Za-z0-9_-]{1,80}$/.test(s.variantId));
function validCustomerEnquiryDraft(draft){
 return !!draft&&typeof draft==='object'&&!Array.isArray(draft)&&
  Object.keys(draft).every(k=>Object.hasOwn(LIMITS,k)||k==='contentInterest')&&
  Object.entries(LIMITS).every(([k,n])=>typeof draft[k]==='string'&&draft[k].length<=n)&&selectionOK(draft.contentInterest);
}
/** Explicit opt-in only. Existing encrypted native storage and shared write
 * queue; no AsyncStorage/web fallback, cloud sync or automatic submission.
 */
function createCustomerEnquiryCheckpoint(storage,{userId,appId,versionId}={}, {now=Date.now}={}){
 const valid=[userId,appId,versionId].every(x=>ID.test(x||''));
 const key=valid?`bdi_enquiry_draft_v1_${userId}_${appId}`:'';
 const queue=fn=>enqueuePrivateCheckpoint(key,async()=>{
  if(!key||!storage?.getItemAsync||!storage?.setItemAsync||!storage?.deleteItemAsync)throw Error('Encrypted device draft storage is unavailable. Your form has not been submitted.');
  return fn();
 });
 async function read(){
  const raw=await storage.getItemAsync(key);if(!raw)return null;
  if(typeof raw!=='string'||raw.length>8000)throw Error('The saved enquiry draft needs review.');
  let d;try{d=JSON.parse(raw);}catch{throw Error('The saved enquiry draft could not be read.');}
  if(!d||typeof d!=='object'||Array.isArray(d)||Object.keys(d).some(k=>!['v','userId','appId','versionId','at','draft'].includes(k))||d.v!==1||d.userId!==userId||d.appId!==appId||!ID.test(d.versionId||'')||!Number.isSafeInteger(d.at)||d.at>now()||!validCustomerEnquiryDraft(d.draft))throw Error('The saved enquiry draft does not match this account and app.');
  if(now()-d.at>86400000){await storage.deleteItemAsync(key);return null;}
  if(d.versionId!==versionId)throw Error('This app has changed. Delete the old device draft and review current information before starting again.');
  return d.draft;
 }
 return {
  save:draft=>queue(async()=>{if(!validCustomerEnquiryDraft(draft))throw Error('Review the enquiry fields before saving privately.');
   const raw=JSON.stringify({v:1,userId,appId,versionId,at:now(),draft});
   if(raw.length>8000)throw Error('This draft is too large for safe device recovery.');
   await storage.setItemAsync(key,raw);return true;}),
  load:()=>queue(read),
  remove:()=>queue(()=>storage.deleteItemAsync(key)),
  // Do not erase a newer owner/customer edit after an earlier request succeeds.
  clearIfSame:draft=>queue(async()=>{const saved=await read();if(saved&&JSON.stringify(saved)!==JSON.stringify(draft))return false;await storage.deleteItemAsync(key);return true;})
 };
}
export {createCustomerEnquiryCheckpoint,validCustomerEnquiryDraft};
