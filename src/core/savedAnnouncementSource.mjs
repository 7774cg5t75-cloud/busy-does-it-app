import {stableJson} from './stableJson.mjs';
// Original private record identity, not caption matching or a handoff credential.
export function savedAnnouncementEligible(record,businessId,records){
 return !!businessId&&!!record?.id&&records?.filter(row=>row.id===record.id).length===1&&records.includes(record)&&record.status==='Draft'&&!record.publishedAt&&(!record.businessId||record.businessId===businessId)&&record.contentEvidence?.businessId===businessId&&record.contentEvidence.purpose==='owner-announcement'&&record.contentEvidence.ownerSuppliedNotIndependentlyVerified===true&&typeof record.text==='string'&&!!record.text.trim()&&record.text.length<=3000;
}
export const savedAnnouncementStamp=record=>stableJson(record);

export function requestsSavedAnnouncement(text){
 const value=String(text||'').trim();
 return value.length>0&&value.length<=400&&!value.includes(':')&&!/\b(?:publish|send|schedule|spend|buy|never|do not|don't)\b/i.test(value)&&/\b(?:promote|reuse|advertise|turn|make|create|prepare)\b/i.test(value)&&/\b(?:saved|wrote earlier)\b/i.test(value)&&/\b(?:announcement|offer|business update)\b/i.test(value);
}
