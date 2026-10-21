import {quoteEnquiryReference,resolveQuoteEnquiryReference} from './quoteEnquiryReference.mjs';
import {encodeBusinessCache,confirmBusinessCacheWrite,confirmBusinessCacheRead} from './businessCache.mjs';
// One reviewed private field on the original customer in the existing scoped snapshot.
export const enquiryReplyCustomerSource=customer=>{if(!customer)return null;const {privateEnquiryReply,...source}=customer;return source;};
export function preparePrivateEnquiryReply({ownerId,businessId,customer,item,revision,text,purpose}){
 const reference=quoteEnquiryReference({businessId,customerId:customer?.id,item,revision});
 if(!ownerId||!reference||customer?.contactOk===false||typeof text!=='string'||!text.trim()||text.length>10000||[customer?.businessId,customer?.business_id].some(id=>id&&id!==businessId))return null;
 return {version:1,ownerId,businessId,customerId:customer.id,reference,sourceStamp:JSON.stringify([enquiryReplyCustomerSource(customer),item]),text,purpose,privateOnly:true};
}
export function inspectPrivateEnquiryReply({ownerId,businessId,customer,inboxItems,revision}){
 const record=customer?.privateEnquiryReply,reference=record?.reference;
 if(!ownerId||!businessId||record?.version!==1||record.ownerId!==ownerId||record.businessId!==businessId||record.customerId!==customer.id||[customer.businessId,customer.business_id].some(id=>id&&id!==businessId)||record.privateOnly!==true||typeof record.text!=='string'||!record.text.trim()||record.text.length>10000||reference?.version!==1||reference.businessId!==businessId||reference.customerId!==customer.id||!reference.inboxId||!Number.isSafeInteger(reference.snapshotRevision)||reference.snapshotRevision<1||!Number.isSafeInteger(revision)||revision<reference.snapshotRevision)return null;
 const item=resolveQuoteEnquiryReference(reference,{businessId,customerId:customer.id,inboxItems,revision});
 const current=!!item&&customer.contactOk!==false&&JSON.stringify([enquiryReplyCustomerSource(customer),item])===record.sourceStamp;
 return {record,item:current?item:null,current};
}
export function resolvePrivateEnquiryReply(input){const saved=inspectPrivateEnquiryReply(input);return saved?.current?{record:saved.record,item:saved.item}:null;}
// Original snapshot queue and cache envelope; no cloud write or mutation replay.
export async function writePrivateEnquiryReplyCopy({ownerId,businessId,revision,customer,record,payload,isCurrent,write,read}){
 let encoded;const updated={...customer,privateEnquiryReply:record};
 try{if(!isCurrent()||!payload.customers?.includes(customer))return {status:'failed'};encoded=encodeBusinessCache({ownerId,businessId,revision,payload:{...payload,customers:payload.customers.map(row=>row===customer?updated:row)}});}catch{return {status:'failed'};}
 if(!isCurrent())return {status:'failed'};
 const result=await confirmBusinessCacheWrite({ownerId,businessId,encoded,write,read});
 return {...result,customer:updated,encoded};
}
export {confirmBusinessCacheRead as readPrivateEnquiryReplyCopy};
