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
export function contentDraftChanges(current,record){
 const savedPhotos=(record?.photos||[]).map(photo=>{const cloud=record?.cloudMedia?.find(item=>item.id===photo.id);return cloud?{...photo,storagePath:cloud.storagePath,contentType:cloud.contentType||photo.mimeType||'image/jpeg'}:photo;});
 const requested=privateContentChannels(current.channels);
 const result={wording:String(current.text||'').trim()!==String(record?.text||''),media:media(current.photos)!==media(savedPhotos),brief:String(current.brief||'').trim()!==String(record?.brief||''),channels:requested!==null&&JSON.stringify([...requested].sort())!==JSON.stringify([...(record?.channels||[])].sort())};
 return {...result,dirty:Object.values(result).some(Boolean)};
}
