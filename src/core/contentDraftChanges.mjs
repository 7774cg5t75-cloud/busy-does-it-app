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
  date:draft.scheduleDate||today,time:draft.scheduleTime||'19:00',
  analysis:{restoredPrivateDraft:true,summary:draft.story?`${storyLabel} content`:'Saved social draft',detectedService:draft.service||'',story:draft.story||null,privacyWarnings:draft.privacyWarnings||[],captions:draft.captions||[]},
  source:{type:draft.source||'phone',label:draft.sourceLabel||'Saved draft',contentEvidence:draft.contentEvidence||null,selection:draft.contentEvidence?.selection,customerId:draft.sourceCustomerId||'',jobId:draft.sourceJobId||'',service:draft.service||'',suggestedPlatform:['Facebook','Instagram'].includes(draft.suggestedPlatform)?draft.suggestedPlatform:''}};
}
export function contentDraftChanges(current,record){
 const savedPhotos=savedContentPhotos(record);
 const requested=privateContentChannels(current.channels);
 const exact=record?.contentEvidence?.channel==='newsletter';
 const wording=String(current.text||''),brief=String(current.brief||'');
 const result={wording:(exact?wording:wording.trim())!==String(record?.text||''),media:media(current.photos)!==media(savedPhotos),brief:(exact?brief:brief.trim())!==String(record?.brief||''),channels:requested!==null&&JSON.stringify([...requested].sort())!==JSON.stringify([...(record?.channels||[])].sort())};
 return {...result,dirty:Object.values(result).some(Boolean)};
}
