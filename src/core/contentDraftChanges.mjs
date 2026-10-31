import {growthDraftOrigin} from '../domain/growthOpportunities.mjs';
import {decodeBusinessCache} from './businessCache.mjs';
import {stableJson} from './stableJson.mjs';
// Finite private-draft comparison shared by original transition and status UI.
const channels=[['facebook','Facebook'],['instagram','Instagram'],['googleBusiness','Google Business']];
export function privateContentChannels(value){
 try{
  const input=typeof value==='string'?JSON.parse(value):value;
  if(!input||typeof input!=='object'||Array.isArray(input))return null;
  return channels.filter(([key])=>input[key]===true).map(([,name])=>name);
 }catch{return null;}
}
const media=items=>JSON.stringify((items||[]).map(item=>[item.id||'',item.uri||'',item.storagePath||'',item.fileName||'',item.width||0,item.height||0,item.contentType||item.mimeType||'image/jpeg']));
export function savedContentPhotos(record){
 return (record?.photos||[]).map(photo=>{const cloud=record?.cloudMedia?.find(item=>item.id===photo.id);return cloud?{...photo,storagePath:cloud.storagePath,contentType:cloud.contentType||photo.mimeType||'image/jpeg'}:{...photo};});
}
// Pure restoration projection. Source/role/dirty-editor authority stays with the caller.
export function restoreContentDraft(draft,{today='',storyLabel=''}={}){
 return {photos:savedContentPhotos(draft),brief:draft.brief||'',text:draft.text||'',captionId:draft.selectedCaptionId||'',
  channels:{facebook:(draft.channels||[]).includes('Facebook'),instagram:(draft.channels||[]).includes('Instagram'),googleBusiness:(draft.channels||[]).includes('Google Business')},
  date:draft.creatorContentVersion===3?draft.scheduleDate:draft.scheduleDate||today,time:draft.creatorContentVersion===3?draft.scheduleTime:draft.scheduleTime||'19:00',
  analysis:{restoredPrivateDraft:true,summary:Object.hasOwn(draft,'creatorAnalysisSummary')?draft.creatorAnalysisSummary:draft.story?`${storyLabel} content`:'Saved social draft',detectedService:draft.service||'',story:draft.story||null,privacyWarnings:draft.privacyWarnings||[],captions:draft.captions||[]},
  source:{growthOrigin:growthDraftOrigin(draft.growthOrigin),type:draft.source||'phone',label:draft.sourceLabel||'Saved draft',contentEvidence:draft.contentEvidence||null,selection:draft.contentEvidence?.selection,customerId:draft.sourceCustomerId||'',jobId:draft.sourceJobId||'',service:draft.service||'',suggestedPlatform:['Facebook','Instagram'].includes(draft.suggestedPlatform)?draft.suggestedPlatform:''}};
}
export function contentDraftChanges(current,record){
 const savedPhotos=savedContentPhotos(record);
 const requested=privateContentChannels(current.channels);
 const exact=!!record?.creatorAccountRevision||!!record?.creatorContentVersion||record?.contentEvidence?.channel==='newsletter';
 const wording=String(current.text||''),brief=String(current.brief||'');
 const result={wording:(exact?wording:wording.trim())!==String(record?.text||''),media:media(current.photos)!==media(savedPhotos),brief:(exact?brief:brief.trim())!==String(record?.brief||''),channels:requested!==null&&JSON.stringify([...requested].sort())!==JSON.stringify([...(record?.channels||[])].sort())};
 if(Object.hasOwn(current,'contentEvidence')||Object.hasOwn(current,'sourceContext')){
  const evidence=Object.hasOwn(current,'contentEvidence')?current.contentEvidence:current.sourceContext?.contentEvidence;
  try{result.source=stableJson(evidence||null)!==stableJson(record?.contentEvidence||null)||stableJson(growthDraftOrigin(current.sourceContext?.growthOrigin))!==stableJson(growthDraftOrigin(record?.growthOrigin));}catch{result.source=true;}
 }
 if(record?.creatorContentVersion===3&&Object.hasOwn(current,'aiResult')){
  const a=current.aiResult;result.analysis=stableJson({summary:a?.summary??record.creatorAnalysisSummary??'',service:a?.detectedService??record.service??'',captions:a?.captions??record.captions??[],story:a&&Object.hasOwn(a,'story')?a.story:record.story??null,warnings:a?.privacyWarnings??record.privacyWarnings??[]})!==stableJson({summary:record.creatorAnalysisSummary||'',service:record.service||'',captions:record.captions||[],story:record.story||null,warnings:record.privacyWarnings||[]});
 }
 if(record?.creatorContentVersion===3&&Object.hasOwn(current,'captionId'))result.captionSelection=current.captionId!==(record.selectedCaptionId||'');
 if(record?.creatorContentVersion===3&&Object.hasOwn(current,'scheduleDate'))result.privateTiming=current.scheduleDate!==(record.scheduleDate||'')||current.scheduleTime!==(record.scheduleTime||'');
 return {...result,dirty:Object.values(result).some(Boolean)};
}

// Exact selected private device record only. Observation is not an earlier write receipt.
export async function readPrivateContentCopy({read,ownerId,businessId,revision,record}={}){
 try{
  if(!record?.id||record.status!=='Draft'||record.publishedAt||[record.businessId,record.business_id,record.contentEvidence?.businessId].some(id=>id&&id!==businessId)||[record.ownerId,record.owner_id].some(id=>id&&id!==ownerId))return {status:'unknown'};
  const cache=decodeBusinessCache(await read(),{ownerId,businessId}),rows=cache?.payload?.socialDrafts;
  if(cache?.revision!==revision||!Array.isArray(rows))return {status:'unknown'};
  const matches=rows.filter(row=>row?.id===record.id);
  return {status:matches.length===1&&stableJson(matches[0])===stableJson(record)?'confirmed':'unknown'};
 }catch{return {status:'unknown'};}
}
