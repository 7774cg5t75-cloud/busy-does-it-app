import {stableJson} from './stableJson.mjs';
const uuid=v=>typeof v==='string'&&/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/.test(v);
export function creatorMediaReference(v){return !!v&&Object.keys(v).sort().join('|')==='assetId|fileName|height|id|kind|privateUseReviewed|sha256|width'&&v.kind==='website_original'&&v.privateUseReviewed===true&&uuid(v.assetId)&&typeof v.id==='string'&&/^[A-Za-z0-9_-]{1,120}$/.test(v.id)&&typeof v.sha256==='string'&&/^[a-f0-9]{64}$/.test(v.sha256)&&typeof v.fileName==='string'&&v.fileName.length<=200&&!/[<>/\\]/.test(v.fileName)&&['width','height'].every(k=>Number.isSafeInteger(v[k])&&v[k]>=0&&v[k]<=20000);}
export function validCreatorEditor(v){return !!v&&Object.keys(v).sort().join('|')==='captions|privacyWarnings|selectedCaptionId|story'&&v.story===null&&Array.isArray(v.captions)&&v.captions.length<=6&&new Set(v.captions.map(x=>x?.id)).size===v.captions.length&&v.captions.every(x=>x&&Object.keys(x).sort().join('|')==='id|text'&&typeof x.id==='string'&&/^[A-Za-z0-9_-]{1,120}$/.test(x.id)&&typeof x.text==='string'&&x.text.length<=15000&&!/[<>]/.test(x.text))&&typeof v.selectedCaptionId==='string'&&(!v.selectedCaptionId||v.captions.some(c=>c.id===v.selectedCaptionId))&&Array.isArray(v.privacyWarnings)&&v.privacyWarnings.length<=12&&v.privacyWarnings.every(x=>typeof x==='string'&&x.length<=500);}
export function validMediaProjection(v,refs){return Array.isArray(v)&&v.length===refs.length&&v.every((x,i)=>x?.id===refs[i].id&&x.assetId===refs[i].assetId&&x.sha256===refs[i].sha256&&['eligible','unavailable'].includes(x.state)&&(x.state==='unavailable'?!('storagePath'in x):typeof x.storagePath==='string'&&['image/jpeg','image/png','image/webp'].includes(x.contentType)&&Number.isSafeInteger(x.byteLength)&&x.byteLength>=20&&x.byteLength<=9437184));}
const alphabet='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
export function creatorImageDataUri(bytes,type){let result='';for(let i=0;i<bytes.length;i+=3){const n=(bytes[i]<<16)|((bytes[i+1]||0)<<8)|(bytes[i+2]||0);result+=alphabet[(n>>>18)&63]+alphabet[(n>>>12)&63]+(i+1<bytes.length?alphabet[(n>>>6)&63]:'=')+(i+2<bytes.length?alphabet[n&63]:'=');}return 'data:'+type+';base64,'+result;}
export async function readCreatorOriginal({baseUrl,apiKey,ownerAccessToken,fetchOriginal,businessId,ownerId,isCurrent=()=>true},meta){
 const safePath=new RegExp('^'+businessId+'/'+ownerId+'/[a-f0-9-]{36}\\.(jpg|png|webp)$');
 if(!isCurrent()||meta?.state!=='eligible'||!safePath.test(meta.storagePath)||!['image/jpeg','image/png','image/webp'].includes(meta.contentType)||!Number.isSafeInteger(meta.byteLength)||meta.byteLength<20||meta.byteLength>9437184||!/^[a-f0-9]{64}$/.test(meta.sha256))throw Error('Review a current owned original');
 const token=await ownerAccessToken();if(!token||!isCurrent())throw Error('Account changed');
 const response=await fetchOriginal(baseUrl+'/functions/v1/busy-website-original-media',{method:'POST',headers:{apikey:apiKey,Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({action:'download',businessId,storagePath:meta.storagePath,expectedSha256:meta.sha256})},45000);
 if(!isCurrent()||!response.ok||response.headers.get('x-busy-original-sha256')!==meta.sha256||response.headers.get('content-type')!==meta.contentType||Number(response.headers.get('content-length'))!==meta.byteLength)throw Error('Original integrity or permission unavailable');
 const bytes=new Uint8Array(await response.arrayBuffer());if(!isCurrent()||bytes.length!==meta.byteLength)throw Error('Original changed');return bytes;
}
export async function materializeCreatorMedia(api,value,isCurrent=()=>true){
 const refs=value.content.media;if(!refs.length)return value;
 const fresh=await api.read(value.draftId,value.revision);if(!isCurrent()||fresh.currentRevision!==value.currentRevision||stableJson(fresh.content)!==stableJson(value.content))throw Error('Draft changed');
 const photos=[];let total=0;
 for(let i=0;i<refs.length;i++){const ref=refs[i],meta=fresh.mediaProjection[i];let uri='';if(meta.state==='eligible'&&total+meta.byteLength<=25*1024*1024){try{const bytes=await api.downloadMedia(meta,isCurrent);if(!isCurrent())throw Error('Editor changed');uri=creatorImageDataUri(bytes,meta.contentType);total+=bytes.length;}catch{uri='';}}
  photos.push({id:ref.id,uri,fileName:ref.fileName,width:ref.width,height:ref.height,mimeType:meta.contentType||'',exportOriginalPath:meta.state==='eligible'?meta.storagePath:'',creatorOriginalRef:{...ref},mediaUnavailable:!uri});}
 const final=await api.read(value.draftId,value.revision);if(!isCurrent()||final.currentRevision!==value.currentRevision||stableJson(final.content)!==stableJson(value.content)||final.sourceState!==fresh.sourceState)throw Error('Permissions/source changed');
 for(let i=0;i<photos.length;i++)if(final.mediaProjection[i].state!=='eligible'||stableJson(final.mediaProjection[i])!==stableJson(fresh.mediaProjection[i]))photos[i]={...photos[i],uri:'',exportOriginalPath:'',mediaUnavailable:true};
 return {...final,resolvedPhotos:photos};
}
// Review preparation only. No provider eligibility, scheduling or publication authority.
export function creatorPublisherPreparation(v){if(!v||v.status!=='Draft'||v.historical||v.sourceState==='retired')return null;const checks=[
 {key:'copy',satisfied:v.content.text===v.content.text.trim()&&v.content.text.length<=5000,detail:'Original publisher trims copy and caps it at 5,000 characters. Your saved wording is never changed here.'},
 {key:'format',satisfied:v.content.format==='social',detail:'The original photo-post queue does not establish a poster, advert or newsletter transaction.'},
 {key:'channels',satisfied:v.content.channels.length>0,detail:'Choose at least one supported destination; selection does not establish a connected provider account.'},
 {key:'private_media',satisfied:v.content.media.length>0&&v.mediaProjection?.length===v.content.media.length&&v.mediaProjection.every(m=>m.state==='eligible'),detail:'Original publisher requires photos. Private access is separate from public marketing permission.'},
 {key:'source',satisfied:['current','not_linked'].includes(v.sourceState),detail:'Historical source evidence cannot authorise a renewed activity.'}
 ];return {draftId:v.draftId,revision:v.revision,text:v.content.text,format:v.content.format,treatment:v.content.treatment,channels:[...v.content.channels],media:v.content.media.map(r=>({id:r.id,assetId:r.assetId,sha256:r.sha256,fileName:r.fileName})),privateTiming:v.content.schemaVersion===3?{date:v.content.editor.proposedScheduleDate,time:v.content.editor.proposedScheduleTime}:null,checks,privatePreparationSupported:checks.every(c=>c.satisfied),publisherScopeBinding:'unsupported_original_email_only_workspace',copyright:'not_established',promotionalConsent:'not_established',providerEligibility:'not_established',publicMediaPermission:'not_established',originalQueueAssociation:'not_established',executionAuthorised:false};}

export function creatorPublisherBlockReason(record,photos=[]){return record?.creatorAccountRevision||record?.creatorContentVersion||photos.some(p=>p.creatorOriginalRef)?'Private Creator account work needs a separately authorised original publisher handoff. Private media review is not public-use permission.':'';}

// Read-only local selection review. Only the original authenticated upload gateway
// may mint the real asset/digest later; this function cannot upload or mint either.
export async function prepareCreatorLocalOriginals({businessId,ownerId,photos,inspectLocal,isCurrent=()=>true}){
 if(!uuid(businessId)||!uuid(ownerId)||!Array.isArray(photos)||!photos.length||photos.length>6||typeof inspectLocal!=='function'||new Set(photos.map(p=>p?.id)).size!==photos.length)throw Error('Review one to six distinct local selections');
 const selection=JSON.stringify(photos.map(p=>[p?.id,p?.uri,p?.mimeType,p?.fileName]));const unchanged=()=>isCurrent()&&selection===JSON.stringify(photos.map(p=>[p?.id,p?.uri,p?.mimeType,p?.fileName]));
 const files=[];let total=0;
 for(const photo of photos){
  if(!unchanged()||!photo||photo.creatorOriginalRef||typeof photo.id!=='string'||!/^[A-Za-z0-9_-]{1,120}$/.test(photo.id)||typeof photo.uri!=='string'||photo.uri.length>2048||! /^(file|content):\/\//i.test(photo.uri))throw Error('Only explicitly selected local originals can be prepared');
  const meta=await inspectLocal(photo);if(!unchanged()||meta?.exists!==true||!Number.isSafeInteger(meta.size)||meta.size<20||meta.size>9437184||total+meta.size>25*1024*1024||!['image/jpeg','image/png','image/webp'].includes(photo.mimeType))throw Error('Review the local file size and claimed image type');
  total+=meta.size;files.push({id:photo.id,fileName:typeof photo.fileName==='string'?photo.fileName.slice(0,200):'',bytes:meta.size,claimedContentType:photo.mimeType});
 }
 return {businessId,ownerId,files,totalBytes:total,source:'owner_selected_local_files',state:'awaiting_original_gateway_validation',serverIdentityVerified:false,assetIdentityEstablished:false,privateAccess:'not_established',copyright:'not_established',promotionalConsent:'not_established',publicUsePermission:'not_established',providerEligibility:'not_established',uploadAuthorised:false,executionAuthorised:false};
}
