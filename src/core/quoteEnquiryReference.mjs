import {stableJson} from './stableJson.mjs';
// A reviewed filing reference in original private quote details, not a quote store.
// Snapshot revision and filing receipt are evidence of identity, not authentication
// or proof that every word of a later source is unchanged.
const iso=value=>typeof value==='string'&&Number.isFinite(Date.parse(value))&&new Date(value).toISOString()===value;
export function quoteEnquiryReference({businessId,customerId,item,revision}){
 if(!businessId||!customerId||item?.status!=='Filed'||item.filedCustomerId!==customerId||!item.id||!iso(item.reviewedAt)||!Number.isSafeInteger(revision)||revision<1)return null;
 return {version:1,businessId,customerId,inboxId:item.id,reviewedAt:item.reviewedAt,queuedAt:typeof item.queuedAt==='string'?item.queuedAt:null,snapshotRevision:revision};
}
export function resolveQuoteEnquiryReference(reference,{businessId,customerId,inboxItems,revision}){
 if(reference?.version!==1||reference.businessId!==businessId||reference.customerId!==customerId||!Number.isSafeInteger(reference.snapshotRevision)||reference.snapshotRevision<1||!Number.isSafeInteger(revision)||revision<reference.snapshotRevision)return null;
 const matches=(inboxItems||[]).filter(item=>item.id===reference.inboxId);
 if(matches.length!==1)return null;
 const item=matches[0],current=quoteEnquiryReference({businessId,customerId,item,revision:reference.snapshotRevision});
 return current&&stableJson(current)===stableJson(reference)?item:null;
}

// Pure private-detail preparation. Caller owns workspace/role/approval and writes.
export function prepareQuoteEnquiryDetails({details,existingReference,businessId,customerId,item=null,sourceStamp='',inboxItems=[],revision}){
 if(!details||typeof details!=='object'||Array.isArray(details))return false;
 const {enquiryReference:incomingReference,...fields}=details;
 const prepared=existingReference?{...fields,enquiryReference:existingReference}:fields;
 if(!item)return prepared;
 if(!inboxItems.includes(item)||inboxItems.filter(row=>row.id===item.id).length!==1||JSON.stringify(item)!==sourceStamp||[item.businessId,item.business_id].some(id=>id&&id!==businessId))return false;
 const reference=quoteEnquiryReference({businessId,customerId,item,revision});
 // Legacy items without a filing receipt remain saveable, without a fabricated link.
 return reference?{...prepared,enquiryReference:reference}:prepared;
}

// Read-only presentation of an existing reviewed origin; caller retains role checks.
export function reviewedFiledEnquiry({origin,workspace,customerId,inboxItems=[]}={}){
 const item=origin?.item;
 if(!origin||origin.workspace!==workspace||origin.customerId!==customerId||!item||!Array.isArray(inboxItems)||!inboxItems.includes(item)||inboxItems.filter(row=>row?.id===item.id).length!==1||item.status!=='Filed'||item.filedCustomerId!==customerId||JSON.stringify(item)!==origin.stamp)return null;
 return item;
}

// Original local action entry only. Not account restoration, matching or permission authority.
export function customerQuoteEntry({businessId,customerId,customers=[],inboxItems=[],actions={},originInboxId='',revision}={}){
 const matches=customers.filter(row=>row?.id===customerId);if(!businessId||matches.length!==1||!Number.isSafeInteger(revision)||revision<(originInboxId?1:0))return null;
 const customer=matches[0];if([customer.businessId,customer.business_id].some(id=>id&&id!==businessId))return null;
 const origins=originInboxId?inboxItems.filter(row=>row?.id===originInboxId):[];
 if(originInboxId&&(origins.length!==1||origins[0].status!=='Filed'||origins[0].filedCustomerId!==customerId||[origins[0].businessId,origins[0].business_id].some(id=>id&&id!==businessId)))return null;
 const item=origins[0]||null,previous=actions[customerId];
 if(item&&previous?.details?.enquiryReference&&resolveQuoteEnquiryReference(previous.details.enquiryReference,{businessId,customerId,inboxItems,revision})!==item)return null;
 return {customer,item,previous,reference:item?quoteEnquiryReference({businessId,customerId,item,revision}):null};
}
