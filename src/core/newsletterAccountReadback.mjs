import {readNewsletterWording} from './newsletterWording.mjs';
import {restoreContentDraft,contentDraftChanges} from './contentDraftChanges.mjs';
import {stableJson} from './stableJson.mjs';

// Inspect original authenticated business-snapshot readback, never a provider queue.
export function inspectNewsletterAccount({result,businessId,record,minimumRevision,ownerId}){
 if(!businessId||!record?.id||record.contentEvidence?.businessId!==businessId||record.contentEvidence.channel!=='newsletter'||record.status!=='Draft'||record.publishedAt||result?.ok!==true||result.businessId!==businessId||!Number.isSafeInteger(result.revision)||result.revision<1||!Array.isArray(result.payload?.socialDrafts))return {status:'unknown'};
 if([record.businessId,record.business_id].some(id=>id&&id!==businessId)||ownerId&&[record.ownerId,record.owner_id].some(id=>id&&id!==ownerId))return {status:'unknown'};
 if(Number.isSafeInteger(minimumRevision)&&result.revision<minimumRevision)return {status:'stale',revision:result.revision};
 const matches=result.payload.socialDrafts.filter(row=>row?.id===record.id);
 if(!matches.length)return {status:'absent',revision:result.revision};
 if(matches.length!==1)return {status:'unknown'};
 try{const same=stableJson(matches[0])===stableJson(record);return {status:same?'confirmed':'different',revision:result.revision,...!same?{preview:newsletterVersionPreview({record:matches[0],baseline:record,businessId,ownerId})}:{}};}catch{return {status:'unknown'};}
}

// Read-only presentation of one exact authenticated account candidate; never a restore ticket.
export function newsletterVersionPreview({record,baseline,businessId,ownerId}={}){
 if(!record||record.id!==baseline?.id||record.status!=='Draft'||record.publishedAt||record.contentEvidence?.businessId!==businessId||record.contentEvidence.channel!=='newsletter'||[record.businessId,record.business_id].some(id=>id&&id!==businessId)||ownerId&&[record.ownerId,record.owner_id].some(id=>id&&id!==ownerId)||typeof record.text!=='string'||record.text.length>15000||typeof record.brief!=='string'||record.brief.length>3000)return null;
 const wording=readNewsletterWording(record.text);if(!wording)return null;
 try{
  const restored=restoreContentDraft(record);
  return {subject:wording.subject,body:wording.body,brief:record.brief,treatment:['standard','welcoming','concise','detailed','brand'].includes(record.contentEvidence.treatment)?record.contentEvidence.treatment:'not specified',differences:newsletterEditorDifferences({...restored,sourceContext:restored.source},baseline)};
 }catch{return null;}
}

// Compare the inspected account version with current editable fields separately
// from the saved device record. Presentation only; never a restoration permit.
export function newsletterEditorDifferences(current,record){
 try{
  const changes=contentDraftChanges(current,record);
  const names={wording:'subject or body',brief:'audience intention or brief',media:'media references',channels:'destination choices',source:'starting facts, format or writing treatment'};
  return Object.entries(names).filter(([key])=>changes[key]).map(([,label])=>label);
 }catch{return null;}
}
