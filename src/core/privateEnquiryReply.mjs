import {privateReplyCatalogueProvenance} from './privateReplySourceEvidence.mjs';
import {stableJson} from './stableJson.mjs';
import {quoteEnquiryReference,resolveQuoteEnquiryReference} from './quoteEnquiryReference.mjs';
import {encodeBusinessCache,confirmBusinessCacheWrite,confirmBusinessCacheRead} from './businessCache.mjs';
// One reviewed private field on the original customer in the existing scoped snapshot.
export const enquiryReplyCustomerSource=customer=>customer?Object.fromEntries(['id','businessId','business_id','name','service','phone','email','address','contactOk','sourceMiniAppRequestId'].filter(key=>Object.hasOwn(customer,key)).map(key=>[key,customer[key]])):null;
const replySourceStamp=(customer,item)=>stableJson([enquiryReplyCustomerSource(customer),item]);
function savedSourceStamp(record){try{const source=JSON.parse(record.sourceStamp);return Array.isArray(source)&&source.length===2?replySourceStamp(source[0],source[1]):null;}catch{return null;}}
export function preparePrivateEnquiryReply({ownerId,businessId,customer,item,revision,text,purpose,provenance}){
 const reference=quoteEnquiryReference({businessId,customerId:customer?.id,item,revision});
 if(!ownerId||!reference||customer?.contactOk===false||typeof text!=='string'||!text.trim()||text.length>10000||[customer?.businessId,customer?.business_id,item?.businessId,item?.business_id].some(id=>id&&id!==businessId))return null;
 const evidence=privateReplyCatalogueProvenance({businessId,item,prepared:provenance});
 return {version:2,ownerId,businessId,customerId:customer.id,reference,sourceStamp:replySourceStamp(customer,item),text,purpose,...evidence?{provenance:evidence}:{},privateOnly:true};
}
export function inspectPrivateEnquiryReply({ownerId,businessId,customer,inboxItems,revision}){
 const record=customer?.privateEnquiryReply,reference=record?.reference;
 if(!ownerId||!businessId||![1,2].includes(record?.version)||record.ownerId!==ownerId||record.businessId!==businessId||record.customerId!==customer.id||[customer.businessId,customer.business_id].some(id=>id&&id!==businessId)||record.privateOnly!==true||typeof record.text!=='string'||!record.text.trim()||record.text.length>10000||reference?.version!==1||reference.businessId!==businessId||reference.customerId!==customer.id||!reference.inboxId||!Number.isSafeInteger(reference.snapshotRevision)||reference.snapshotRevision<1||!Number.isSafeInteger(revision)||revision<reference.snapshotRevision)return null;
 const item=resolveQuoteEnquiryReference(reference,{businessId,customerId:customer.id,inboxItems,revision});
 const current=!!item&&![item.businessId,item.business_id].some(id=>id&&id!==businessId)&&customer.contactOk!==false&&replySourceStamp(customer,item)===savedSourceStamp(record);
 return {record,item:current?item:null,current};
}
export function resolvePrivateEnquiryReply(input){const saved=inspectPrivateEnquiryReply(input);return saved?.current?{record:saved.record,item:saved.item}:null;}
// Original snapshot queue and cache envelope; no cloud write or mutation replay.
export async function writePrivateEnquiryReplyCopy({ownerId,businessId,revision,customer,record,payload,isCurrent,write,read}){
 let encoded;
 // Only explicit null removes a private reply. Omission or an incompatible
 // record cannot silently erase it through JSON serialization.
 try{
  if(!Array.isArray(payload?.customers)||payload.customers.filter(row=>row?.id===customer?.id).length!==1||!payload.customers.includes(customer)||[customer?.businessId,customer?.business_id].some(id=>id&&id!==businessId))return {status:'failed'};
  if(record!==null&&customer.privateEnquiryReply&&[customer.privateEnquiryReply.ownerId,customer.privateEnquiryReply.businessId,customer.privateEnquiryReply.customerId].some((id,index)=>id!==[ownerId,businessId,customer.id][index]))return {status:'failed'};
  if(record?.purpose==='quote-preparation'&&customer.privateEnquiryReply&&customer.privateEnquiryReply.reference?.inboxId!==record.reference?.inboxId)return {status:'failed'};
  if(record===null){const old=customer.privateEnquiryReply;if(old&&(old.ownerId!==ownerId||old.businessId!==businessId||old.customerId!==customer.id))return {status:'failed'};}
  else if(!record||typeof record!=='object'||!resolvePrivateEnquiryReply({ownerId,businessId,customer:{...customer,privateEnquiryReply:record},inboxItems:payload.inboxItems,revision}))return {status:'failed'};
  if(record!==null&&customer.privateEnquiryReply){
   const known=['version','ownerId','businessId','customerId','reference','sourceStamp','text','purpose','provenance','privateOnly'];
   if(Object.keys(customer.privateEnquiryReply).some(key=>!known.includes(key)&&(!Object.hasOwn(record,key)||stableJson(record[key])!==stableJson(customer.privateEnquiryReply[key]))))return {status:'failed',reason:'This saved reply contains information this version cannot replace safely. Your wording and saved copy are kept. Use a compatible version, or deliberately discard the whole saved reply.'};
  }
 }catch{return {status:'failed'};}
 const updated={...customer};if(record===null)delete updated.privateEnquiryReply;else updated.privateEnquiryReply=record;
 try{if(!isCurrent()||!payload.customers?.includes(customer))return {status:'failed'};encoded=encodeBusinessCache({ownerId,businessId,revision,payload:{...payload,customers:payload.customers.map(row=>row===customer?updated:row)}});}catch{return {status:'failed'};}
 if(!isCurrent())return {status:'failed'};
 const result=await confirmBusinessCacheWrite({ownerId,businessId,encoded,write,read});
 return {...result,customer:updated,encoded};
}
export {confirmBusinessCacheRead as readPrivateEnquiryReplyCopy};

export function inspectPrivateReplyAccount({result,ownerId,businessId,customer,record,item}){
 if(!result?.ok||result.businessId!==businessId||!record)return {status:'unknown'};
 const rows=result.payload?.customers?.filter(row=>row.id===customer.id);
 if(rows?.length!==1)return {status:'different'};
 const remote=rows[0],saved=remote.privateEnquiryReply;
 if(!saved||stableJson(saved)!==stableJson(record)||stableJson(enquiryReplyCustomerSource(remote))!==stableJson(enquiryReplyCustomerSource(customer)))return {status:'different'};
 const checked=resolvePrivateEnquiryReply({ownerId,businessId,customer:remote,inboxItems:result.payload.inboxItems,revision:result.revision});
 return checked&&stableJson(checked.item)===stableJson(item)?{status:'confirmed',savedText:saved.text,revision:result.revision}:{status:'different'};
}

// Read-only observation after device-copy removal. Absence does not prove that
// the local removal synced, that any older client retained it, or erasure.
export function inspectPrivateReplyAccountRemoval({result,ownerId,businessId,customer,removedRecord,item}){
 if(!result?.ok||result.businessId!==businessId||!customer||customer.privateEnquiryReply||!removedRecord||!item)return {status:'unknown'};
 const rows=result.payload?.customers?.filter(row=>row.id===customer.id);
 if(rows?.length!==1)return {status:'different'};
 const remote=rows[0];
 if(stableJson(enquiryReplyCustomerSource(remote))!==stableJson(enquiryReplyCustomerSource(customer)))return {status:'different'};
 const checked=resolvePrivateEnquiryReply({ownerId,businessId,customer:{...remote,privateEnquiryReply:removedRecord},inboxItems:result.payload?.inboxItems,revision:result.revision});
 if(!checked||stableJson(checked.item)!==stableJson(item))return {status:'different'};
 if(remote.privateEnquiryReply==null)return {status:'absent',revision:result.revision};
 return stableJson(remote.privateEnquiryReply)===stableJson(removedRecord)?{status:'present',revision:result.revision}:{status:'different'};
}

// Presentation evidence only. Existing check results outrank an earlier save receipt.
export function privateReplyAccountStatus({state,customer,text,saveState,ownSave}){
 const exact=state&&(state.removed?state.customer===customer&&!customer.privateEnquiryReply&&saveState?.status==='removed'&&saveState.removedRecord===state.removedRecord:!!state.record&&state.record===customer.privateEnquiryReply);
 if(exact)return state.status==='confirmed'&&state.savedText!==text?'newer':state.status;
 if(ownSave?.status==='confirmed')return ownSave.savedText===text?'ownSaved':'ownSavedNewer';
 return null;
}

export {privateReplyCatalogueProvenance,privateReplySourceReview,privateReplySavedSourceSummary,privateReplyCatalogueChanges} from './privateReplySourceEvidence.mjs';

// Exact filing continuity only. A changed message is data to review, never a
// verified reconstruction of the earlier listing or permission to send/save.
export function privateReplyRecoveryCandidate({businessId,ownerId,customers,inboxItems,revision,value}){
 try{
  if(!value||!Array.isArray(customers)||!Array.isArray(inboxItems)||!Number.isSafeInteger(revision)||revision<value.revision)return null;
  const rows=customers.filter(row=>row?.id===value.customer?.id);
  if(rows.length!==1)return null;
  const customer=rows[0],record=customer.privateEnquiryReply;
  if(customer.contactOk===false||[customer.businessId,customer.business_id].some(id=>id&&id!==businessId)||stableJson(record||null)!==stableJson(value.customer.privateEnquiryReply||null))return null;
  if(record&&(record.ownerId!==ownerId||record.businessId!==businessId||record.customerId!==customer.id))return null;
  const reference=value.savedReference||quoteEnquiryReference({businessId,customerId:customer.id,item:value.item,revision:value.revision});
  const item=resolveQuoteEnquiryReference(reference,{businessId,customerId:customer.id,inboxItems,revision});
  if(!item||[item.businessId,item.business_id].some(id=>id&&id!==businessId))return null;
  return {customer,item,revision};
 }catch{return null;}
}
