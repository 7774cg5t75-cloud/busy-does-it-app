import {stableJson} from './stableJson.mjs';
const uuid=v=>typeof v==='string'&&/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(v);
export function opportunityDraftReference(v,scope={}){
 if(!v||Object.keys(v).sort().join('|')!=='businessId|opportunityId|ownerId|provenance|referenceOnly|revision|sourceAccount|sourceHash|type|version'||v.version!==1||v.type!=='owner_reported_opportunity'||v.provenance!=='owner_reported'||v.referenceOnly!==true||!uuid(v.ownerId)||!uuid(v.businessId)||!uuid(v.opportunityId)||!Number.isSafeInteger(v.revision)||v.revision<1||typeof v.sourceHash!=='string'||!/^[a-f0-9]{64}$/.test(v.sourceHash)||typeof v.sourceAccount!=='string'||!v.sourceAccount.trim()||v.sourceAccount.length>300||scope.ownerId&&scope.ownerId!==v.ownerId||scope.businessId&&scope.businessId!==v.businessId)return null;
 return {...v};
}
export function savedOpportunityDrafts(records,{ownerId,businessId,opportunityId}={}){
 if(!Array.isArray(records)||!uuid(ownerId)||!uuid(businessId)||!uuid(opportunityId))return [];
 return records.filter(r=>r&&typeof r.id==='string'&&r.id&&records.filter(x=>x?.id===r.id).length===1&&r.status==='Draft'&&!r.publishedAt&&[r.ownerId,r.owner_id].every(v=>!v||v===ownerId)&&[r.businessId,r.business_id,r.contentEvidence?.businessId].every(v=>!v||v===businessId)&&r.contentEvidence?.businessId===businessId&&opportunityDraftReference(r.contentEvidence.opportunityReference,{ownerId,businessId})?.opportunityId===opportunityId).map(r=>({draftId:r.id,record:r,reference:opportunityDraftReference(r.contentEvidence.opportunityReference,{ownerId,businessId}),stamp:stableJson(r)}));
}
export function compareOpportunityDraft(reference,current){
 const r=opportunityDraftReference(reference);if(!r||!current||current.businessId!==r.businessId||current.ownerId!==r.ownerId||current.opportunityId!==r.opportunityId)return 'unavailable';
 if(current.state==='retired')return 'retired';if(current.record?.permission!=='permitted')return 'restricted';
 return current.sourceHash!==r.sourceHash?'changed':current.revision!==r.revision?'same_source_later_version':'same_version';
}
