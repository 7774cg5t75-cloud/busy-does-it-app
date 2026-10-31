import {enqueuePrivateCheckpoint} from './privateCheckpointQueue.mjs';
import {creatorContentFromEditor,finiteCreatorContent,creatorAccountRecord} from './creatorDraftAccount.mjs';
import {validCreatorEditorV3} from './creatorDraftVariants.mjs';
import {creatorMediaReference} from './creatorDraftMedia.mjs';
import {opportunityDraftReference} from './opportunityDraftReference.mjs';
import {restoreContentDraft} from './contentDraftChanges.mjs';
const uuid=v=>typeof v==='string'&&/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(v),id=v=>typeof v==='string'&&/^[A-Za-z0-9_-]{1,120}$/.test(v),keys=(v,n)=>!!v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).every(k=>n.includes(k));
const photoKeys=['id','uri','fileName','width','height','mimeType','contentType','storagePath','exportOriginalPath','creatorOriginalRef','mediaUnavailable'];
export function creatorDeviceIntent(s){
 if(s.cloudWorkspace?.role!=='owner'||!Array.isArray(s.socialCreatePhotos)||s.socialCreatePhotos.length>6||!Object.hasOwn(s,'socialScheduleDate')||!Object.hasOwn(s,'socialScheduleTime'))return null;
 const photos=[];
 for(const p of s.socialCreatePhotos){
  if(!keys(p,photoKeys)||!id(p.id)||p.creatorOriginalRef&&!creatorMediaReference(p.creatorOriginalRef)||p.creatorOriginalRef&&p.creatorOriginalRef.id!==p.id||typeof p.uri!=='string'||p.uri.length>15000000||!p.creatorOriginalRef&&!/^(file|content):\/\//.test(p.uri)||typeof(p.fileName||'')!=='string'||(p.fileName||'').length>200||/[<>/\\]/.test(p.fileName||''))return null;
  const localUri=/^(file|content):\/\//.test(p.uri)?p.uri:'';if(localUri.length>2048)return null;
  if(!p.creatorOriginalRef&&!['image/png','image/jpeg','image/webp'].includes(p.mimeType))return null;
  const width=p.width||0,height=p.height||0;if(![width,height].every(n=>Number.isSafeInteger(n)&&n>=0&&n<=20000))return null;
  photos.push({id:p.id,localUri,fileName:p.fileName||'',width,height,mimeType:p.mimeType||p.contentType||'image/jpeg',originalRef:p.creatorOriginalRef||null,originalPath:p.creatorOriginalRef?p.exportOriginalPath||'':''});
 }
 if(new Set(photos.map(p=>p.id)).size!==photos.length)return null;
 const ai=s.socialAiResult,story=Object.hasOwn(ai||{},'story')?ai.story:s.socialDrafts?.find(r=>r.id===s.selectedSocialDraftId)?.story||null;
 // Validate the exact original text/format/source state through its own adapter.
 // Device media is separately finite; no fabricated asset UUID or auth reference.
 const projected=creatorContentFromEditor({...s,socialCreatePhotos:[],socialAiResult:{...(ai||{}),story:null}});if(!projected||projected.content.schemaVersion!==3)return null;
 const content={...projected.content,editor:{...projected.content.editor,story}};if(!validCreatorEditorV3(content.editor,photos))return null;
 const evidence=s.creatorDraftAccount?.mediaOnboarding?.inspect?.(),selected=(evidence?.files||[]).filter(r=>photos.some(p=>p.id===r.id));if(selected.some(r=>!id(r.requestKey)||r.requestKey.length<8||!['not_sent','dispatched','unknown','stored_unverified','verified_private_original','rejected','local_unavailable','duplicate_asset','selection_changed','unavailable_or_restricted'].includes(r.state)))return null;const operations=selected.map(r=>({selectionId:r.id,requestKey:r.requestKey,stateHint:r.state}));
 const intent={version:1,draftId:projected.draftId,content,photos,reference:projected.reference,deviceAccountRevisionHint:s.socialDrafts.find(r=>r.id===projected.draftId)?.creatorAccountRevision||null,operations};return validIntent(intent,{ownerId:s.ownerSession?.userId,businessId:s.cloudWorkspace?.businessId})?intent:null;
}
function validIntent(v,scope){
 if(!keys(v,['version','draftId','content','photos','reference','deviceAccountRevisionHint','operations'])||v.version!==1||!id(v.draftId)||!Array.isArray(v.photos)||v.photos.length>6||new Set(v.photos.map(p=>p.id)).size!==v.photos.length||!Array.isArray(v.operations)||v.operations.length>6)return false;
 if(!v.photos.every(p=>keys(p,['id','localUri','fileName','width','height','mimeType','originalRef','originalPath'])&&id(p.id)&&typeof p.localUri==='string'&&p.localUri.length<=2048&&(!p.localUri||/^(file|content):\/\//.test(p.localUri))&&typeof p.fileName==='string'&&p.fileName.length<=200&&!/[<>/\\]/.test(p.fileName)&&[p.width,p.height].every(n=>Number.isSafeInteger(n)&&n>=0&&n<=20000)&&['image/png','image/jpeg','image/webp'].includes(p.mimeType)&&(p.originalRef===null||creatorMediaReference(p.originalRef)&&p.originalRef.id===p.id)&&typeof p.originalPath==='string'&&(!p.originalPath||new RegExp('^'+scope.businessId+'/'+scope.ownerId+'/[a-f0-9-]{36}\\.(png|jpg|webp)$').test(p.originalPath))))return false;
 if(!v.content||v.content.schemaVersion!==3||!validCreatorEditorV3(v.content.editor,v.photos)||!finiteCreatorContent({...v.content,editor:{...v.content.editor,story:null},media:[]})||!Array.isArray(v.content.media)||v.content.media.length!==0)return false;
 if(v.reference!==null&&!opportunityDraftReference(v.reference,scope))return false;
 return (v.deviceAccountRevisionHint===null||Number.isSafeInteger(v.deviceAccountRevisionHint)&&v.deviceAccountRevisionHint>0)&&v.operations.every(r=>keys(r,['selectionId','requestKey','stateHint'])&&v.photos.some(p=>p.id===r.selectionId)&&id(r.requestKey)&&r.requestKey.length>=8&&['not_sent','dispatched','unknown','stored_unverified','verified_private_original','rejected','local_unavailable','duplicate_asset','selection_changed','unavailable_or_restricted'].includes(r.stateHint));
}
export function createCreatorDeviceIntentStore(storage,scope,{now=Date.now}={}){
 const key=uuid(scope.ownerId)&&uuid(scope.businessId)?'busy_creator_intent_v1_'+scope.ownerId+'_'+scope.businessId:'';let uncertain=false;
 const queue=fn=>enqueuePrivateCheckpoint(key,async()=>{if(!key||!storage?.getItemAsync||!storage?.setItemAsync||!storage?.deleteItemAsync)throw Error('Encrypted device storage unavailable');return fn();});
 const read=async()=>{const raw=await storage.getItemAsync(key);if(!raw)return null;if(typeof raw!=='string'||new TextEncoder().encode(raw).length>32000)throw Error('Private checkpoint too large');const v=JSON.parse(raw);if(!keys(v,['version','ownerId','businessId','at','generation','intent'])||v.version!==1||v.ownerId!==scope.ownerId||v.businessId!==scope.businessId||!Number.isSafeInteger(v.at)||v.at>now()||now()-v.at>7*86400000||!Number.isSafeInteger(v.generation)||v.generation<1||!validIntent(v.intent,scope))throw Error('Private checkpoint scope, age or content needs review');return v;};
 return {
  unresolved:()=>!!uncertain,
  inspect:()=>queue(async()=>{const v=await read();if(uncertain&&v&&JSON.stringify(v)===uncertain.raw)uncertain=false;return v?{...v,notOwnReceipt:true,outcomeUnresolved:!!uncertain}:null;}),
  save:(intent,expectedGeneration,isCurrent=()=>true)=>queue(async()=>{if(uncertain||!isCurrent()||!validIntent(intent,scope))throw Error('Review a supported current private intent');const old=await read();if((old?.generation||0)!==expectedGeneration)throw Error('Device checkpoint changed; inspect before another review');const v={version:1,ownerId:scope.ownerId,businessId:scope.businessId,at:now(),generation:expectedGeneration+1,intent},raw=JSON.stringify(v);if(new TextEncoder().encode(raw).length>32000)throw Error('Too much content for encrypted device recovery; nothing was truncated');if(!isCurrent())throw Error('Creator changed');uncertain={raw};await storage.setItemAsync(key,raw);if(await storage.getItemAsync(key)!==raw||!isCurrent())throw Error('Device save outcome uncertain; inspect without replay');uncertain=false;return {generation:v.generation,ownDeviceReceipt:true};}),
  remove:(generation,isCurrent=()=>true)=>queue(async()=>{if(uncertain)throw Error('Device outcome unresolved');if(!isCurrent())return false;const old=await read();if(!old||old.generation!==generation)return false;if(!isCurrent())return false;await storage.deleteItemAsync(key);return true;})
 };
}
export async function inspectCreatorDeviceMedia(saved,{api,inspectLocal,isCurrent=()=>true}){
 const photos=[],operations=[];
 for(const p of saved.intent.photos){if(!isCurrent())throw Error('Creator changed');let available=false;if(p.localUri){try{const m=await inspectLocal({uri:p.localUri});available=m.exists===true&&Number.isSafeInteger(m.size)&&m.size>=20&&m.size<=9437184;}catch{}}
  let originalPath='';if(p.originalRef&&api?.enabled){try{const r=await api.reviewMedia({...p,exportOriginalPath:p.originalPath});if(r.ref.assetId===p.originalRef.assetId&&r.ref.sha256===p.originalRef.sha256)originalPath=p.originalPath;}catch{}}
  if(p.originalRef&&!originalPath)available=false;
  photos.push({id:p.id,uri:available?p.localUri:'',fileName:p.fileName,width:p.width,height:p.height,mimeType:p.mimeType,...p.originalRef?{creatorOriginalRef:p.originalRef,exportOriginalPath:originalPath}:{},mediaUnavailable:!available,deviceReferenceUnverified:true});
 }
 for(const op of saved.intent.operations){if(!isCurrent())throw Error('Creator changed');let state='not_reinspected';if(api?.uploadOperations?.enabled){try{const v=await api.uploadOperations.inspect(op.requestKey);state=v.found?v.state+':'+v.mediaState:'not_established';}catch{state='unavailable_or_restricted';}}operations.push({...op,currentState:state,mayReplay:false});}
 if(!isCurrent())throw Error('Creator changed');return {photos,operations};
}
export function openCreatorDeviceIntent(s,saved,inspected,newId){
 if(s.cloudWorkspace?.role!=='owner'||saved.ownerId!==s.ownerSession?.userId||saved.businessId!==s.cloudWorkspace.businessId||!validIntent(saved.intent,{ownerId:saved.ownerId,businessId:saved.businessId})||!id(newId)||s.socialDrafts.some(r=>r.id===newId))return false;
 if(!inspected||!Array.isArray(inspected.photos)||inspected.photos.length!==saved.intent.photos.length||inspected.photos.some((p,i)=>p.id!==saved.intent.photos[i].id||p.uri!==''&&p.uri!==saved.intent.photos[i].localUri||JSON.stringify(p.creatorOriginalRef||null)!==JSON.stringify(saved.intent.photos[i].originalRef)))return false;
 const content={...saved.intent.content,editor:{...saved.intent.content.editor,story:null}},record=creatorAccountRecord({businessId:saved.businessId,ownerId:saved.ownerId,draftId:newId,content,revision:0,opportunityReference:saved.intent.reference});delete record.creatorAccountRevision;record.photos=inspected.photos.map(({deviceReferenceUnverified,...p})=>p);record.story=saved.intent.content.editor.story;record.sourceLabel='Encrypted device recovery — not saved to account';
 return s.socialContentActions.replaceDraft(()=>{s.installCreatorAccountRecord(record,restoreContentDraft(record));return true;});
}
