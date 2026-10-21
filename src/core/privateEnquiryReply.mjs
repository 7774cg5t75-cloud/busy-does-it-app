import {parseEnquiryListingReference} from './ownerConversationPreparation.mjs';
import {stableJson} from './stableJson.mjs';
import {quoteEnquiryReference,resolveQuoteEnquiryReference} from './quoteEnquiryReference.mjs';
import {encodeBusinessCache,confirmBusinessCacheWrite,confirmBusinessCacheRead} from './businessCache.mjs';
// One reviewed private field on the original customer in the existing scoped snapshot.
export const enquiryReplyCustomerSource=customer=>customer?Object.fromEntries(['id','businessId','business_id','name','service','phone','email','address','contactOk','sourceMiniAppRequestId'].filter(key=>Object.hasOwn(customer,key)).map(key=>[key,customer[key]])):null;
const replySourceStamp=(customer,item)=>stableJson([enquiryReplyCustomerSource(customer),item]);
function savedSourceStamp(record){try{const source=JSON.parse(record.sourceStamp);return Array.isArray(source)&&source.length===2?replySourceStamp(source[0],source[1]):null;}catch{return null;}}
export function preparePrivateEnquiryReply({ownerId,businessId,customer,item,revision,text,purpose,provenance}){
 const reference=quoteEnquiryReference({businessId,customerId:customer?.id,item,revision});
 if(!ownerId||!reference||customer?.contactOk===false||typeof text!=='string'||!text.trim()||text.length>10000||[customer?.businessId,customer?.business_id].some(id=>id&&id!==businessId))return null;
 const evidence=privateReplyCatalogueProvenance({businessId,item,prepared:provenance});
 return {version:2,ownerId,businessId,customerId:customer.id,reference,sourceStamp:replySourceStamp(customer,item),text,purpose,...evidence?{provenance:evidence}:{},privateOnly:true};
}
export function inspectPrivateEnquiryReply({ownerId,businessId,customer,inboxItems,revision}){
 const record=customer?.privateEnquiryReply,reference=record?.reference;
 if(!ownerId||!businessId||![1,2].includes(record?.version)||record.ownerId!==ownerId||record.businessId!==businessId||record.customerId!==customer.id||[customer.businessId,customer.business_id].some(id=>id&&id!==businessId)||record.privateOnly!==true||typeof record.text!=='string'||!record.text.trim()||record.text.length>10000||reference?.version!==1||reference.businessId!==businessId||reference.customerId!==customer.id||!reference.inboxId||!Number.isSafeInteger(reference.snapshotRevision)||reference.snapshotRevision<1||!Number.isSafeInteger(revision)||revision<reference.snapshotRevision)return null;
 const item=resolveQuoteEnquiryReference(reference,{businessId,customerId:customer.id,inboxItems,revision});
 const current=!!item&&customer.contactOk!==false&&replySourceStamp(customer,item)===savedSourceStamp(record);
 return {record,item:current?item:null,current};
}
export function resolvePrivateEnquiryReply(input){const saved=inspectPrivateEnquiryReply(input);return saved?.current?{record:saved.record,item:saved.item}:null;}
// Original snapshot queue and cache envelope; no cloud write or mutation replay.
export async function writePrivateEnquiryReplyCopy({ownerId,businessId,revision,customer,record,payload,isCurrent,write,read}){
 let encoded;const updated={...customer};if(record===null)delete updated.privateEnquiryReply;else updated.privateEnquiryReply=record;
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

// Private preparation evidence in the original reply record, not current-source authority.
export function privateReplyCatalogueProvenance({businessId,item,prepared}={}){
 try{
  const original=parseEnquiryListingReference(item?.rawText),selected=prepared?.selection;
  if(!businessId||prepared?.businessId&&prepared.businessId!==businessId||!original||!selected||selected.recordId!==original.recordId||(selected.variantId||'')!==(original.variantId||'')||!Number.isSafeInteger(selected.revision)||selected.revision<original.revision||typeof prepared.recordStamp!=='string'||prepared.recordStamp.length>20000)return null;
  const row=JSON.parse(prepared.recordStamp);
  if(row.id!==selected.recordId||row.revision!==selected.revision||!['product','event'].includes(row.kind)||typeof row.data?.name!=='string'||!row.data.name.trim()||selected.variantId&&row.data.variants?.filter(x=>x.id===selected.variantId).length!==1)return null;
  return {version:1,kind:'owner-reviewed-catalogue-preparation',businessId,originalSelection:original,selection:{recordId:selected.recordId,revision:selected.revision,...selected.variantId?{variantId:selected.variantId}:{}},recordStamp:stableJson(row),currentApproval:false,wordingIndependentlyVerified:false};
 }catch{return null;}
}
export function privateReplySourceReview({businessId,item,provenance}={}){
 const checked=privateReplyCatalogueProvenance({businessId,item,prepared:provenance});
 if(!checked)return provenance?'Saved source evidence could not be matched. Keep your wording and review the original enquiry and current item.':'This is private owner wording. No retained catalogue preparation evidence is available; check current item information before reusing facts.';
 const row=JSON.parse(checked.recordStamp),variant=checked.selection.variantId?row.data.variants?.find(x=>x.id===checked.selection.variantId)?.label:'';
 return [row.data.name,variant,'This reply retains an earlier owner-reviewed preparation. Customer requirements remain customer-supplied; saved wording remains owner wording. Current item facts have not been rechecked.'].filter(Boolean).join(' · ');
}
