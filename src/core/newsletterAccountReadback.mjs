import {stableJson} from './stableJson.mjs';

// Inspect original authenticated business-snapshot readback, never a provider queue.
export function inspectNewsletterAccount({result,businessId,record,minimumRevision}){
 if(!businessId||!record?.id||record.contentEvidence?.businessId!==businessId||record.contentEvidence.channel!=='newsletter'||record.status!=='Draft'||record.publishedAt||result?.ok!==true||result.businessId!==businessId||!Number.isSafeInteger(result.revision)||result.revision<1||!Array.isArray(result.payload?.socialDrafts))return {status:'unknown'};
 if(Number.isSafeInteger(minimumRevision)&&result.revision<minimumRevision)return {status:'stale',revision:result.revision};
 const matches=result.payload.socialDrafts.filter(row=>row?.id===record.id);
 if(!matches.length)return {status:'absent',revision:result.revision};
 if(matches.length!==1)return {status:'unknown'};
 try{return {status:stableJson(matches[0])===stableJson(record)?'confirmed':'different',revision:result.revision};}catch{return {status:'unknown'};}
}
