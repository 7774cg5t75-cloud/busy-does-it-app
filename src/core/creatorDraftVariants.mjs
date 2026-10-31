// Faithful finite original busy-social-content output; analysis remains unverified.
const keys=(v,k)=>v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).sort().join('|')===k;
const text=(v,max)=>typeof v==='string'&&v.length<=max&&!/[<>]/.test(v);
const id=v=>typeof v==='string'&&/^[A-Za-z0-9_-]{1,120}$/.test(v);
export function validCreatorEditorV3(v,media){
 if(!keys(v,'captions|detectedService|privacyWarnings|proposedScheduleDate|proposedScheduleTime|selectedCaptionId|story|summary')||!text(v.summary,700)||!text(v.detectedService,180)||!Array.isArray(media)||!Array.isArray(v.captions)||v.captions.length>6||!Array.isArray(v.privacyWarnings)||v.privacyWarnings.length>12||!v.privacyWarnings.every(x=>text(x,500)))return false;
 if(typeof v.proposedScheduleDate!=='string'||typeof v.proposedScheduleTime!=='string'||v.proposedScheduleDate&&(!/^(?!0000)[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(v.proposedScheduleDate)||!Number.isFinite(Date.parse(v.proposedScheduleDate+'T00:00:00Z'))||new Date(v.proposedScheduleDate+'T00:00:00Z').toISOString().slice(0,10)!==v.proposedScheduleDate)||v.proposedScheduleTime&&!/^(?:[01][0-9]|2[0-3]):[0-5][0-9]$/.test(v.proposedScheduleTime))return false;
 if(!v.captions.every(c=>id(c?.id)&&text(c.text,15000)&&(keys(c,'id|text')||keys(c,'id|label|reason|recommendedChannels|text|tone')&&text(c.label,120)&&text(c.tone,120)&&text(c.reason,600)&&Array.isArray(c.recommendedChannels)&&c.recommendedChannels.length<=3&&new Set(c.recommendedChannels).size===c.recommendedChannels.length&&c.recommendedChannels.every(x=>['Facebook','Instagram','Google Business'].includes(x))))||new Set(v.captions.map(c=>c.id)).size!==v.captions.length||typeof v.selectedCaptionId!=='string'||v.selectedCaptionId&&!v.captions.some(c=>c.id===v.selectedCaptionId))return false;
 if(v.story===null)return true;
 const s=v.story,ids=media.map(r=>r.id);
 return keys(s,'afterImageId|beforeImageId|confidence|reason|type')&&['before_after','finished_result','process','equipment','general','unclear'].includes(s.type)&&['High','Medium','Low'].includes(s.confidence)&&text(s.reason,700)&&['beforeImageId','afterImageId'].every(k=>typeof s[k]==='string'&&(!s[k]||ids.includes(s[k])))&&(s.type!=='before_after'||!!s.beforeImageId&&!!s.afterImageId&&s.beforeImageId!==s.afterImageId);
}
