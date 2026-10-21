import {stableJson} from './stableJson.mjs';
// Original private record identity, not caption matching or a handoff credential.
export function savedAnnouncementEligible(record,businessId,records){
 return !!businessId&&!!record?.id&&records?.filter(row=>row.id===record.id).length===1&&records.includes(record)&&record.status==='Draft'&&!record.publishedAt&&(!record.businessId||record.businessId===businessId)&&record.contentEvidence?.businessId===businessId&&record.contentEvidence.purpose==='owner-announcement'&&record.contentEvidence.ownerSuppliedNotIndependentlyVerified===true&&typeof record.text==='string'&&!!record.text.trim()&&record.text.length<=3000;
}
export const savedAnnouncementStamp=record=>stableJson(record);
