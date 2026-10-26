import {stableJson} from './stableJson.mjs';
import {opportunityDraftReference} from './opportunityDraftReference.mjs';
import {restoreContentDraft} from './contentDraftChanges.mjs';
export const CREATOR_DRAFT_ACCOUNT_ENABLED=false;
const id=v=>typeof v==='string'&&/^[A-Za-z0-9_-]{1,120}$/.test(v),uuid=v=>typeof v==='string'&&/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(v);
export function finiteCreatorContent(v){return !!v&&Object.keys(v).sort().join('|')==='brandFingerprint|brief|channels|format|media|ownerFacts|preparedCopy|schemaVersion|text|treatment'&&v.schemaVersion===1&&['social','poster','advert','newsletter'].includes(v.format)&&['standard','welcoming','concise','detailed','brand'].includes(v.treatment)&&[['text',15000],['brief',3000],['brandFingerprint',240],['ownerFacts',3000],['preparedCopy',15000]].every(([k,n])=>typeof v[k]==='string'&&v[k].length<=n&&!/[<>]/.test(v[k]))&&!!v.text.trim()&&Array.isArray(v.channels)&&v.channels.length<=3&&new Set(v.channels).size===v.channels.length&&v.channels.every(c=>['Facebook','Instagram','Google Business'].includes(c))&&Array.isArray(v.media)&&v.media.length===0;}
export function creatorContentFromEditor(s){
 const r=s.socialDrafts?.filter(r=>r.id===s.selectedSocialDraftId),e=s.socialSourceContext?.contentEvidence;
 const known=new Set(['id','businessId','ownerId','business_id','owner_id','creatorAccountRevision','source','sourceLabel','contentEvidence','suggestedPlatform','sourceCustomerId','sourceJobId','service','photos','brief','text','selectedCaptionId','captions','story','privacyWarnings','channels','status','createdAt','updatedAt','scheduleDate','scheduleTime','approvedAt','publishedAt']);
 if(r?.length!==1||Object.keys(r[0]).some(k=>!known.has(k))||[r[0].businessId,r[0].business_id].some(v=>v&&v!==s.cloudWorkspace?.businessId)||[r[0].ownerId,r[0].owner_id].some(v=>v&&v!==s.ownerSession?.userId)||r[0].sourceCustomerId||r[0].sourceJobId||r[0].service||r[0].privacyWarnings?.length||e?.ownerSuppliedNotIndependentlyVerified!==true||e?.reusedDraft||r[0].status!=='Draft'||r[0].publishedAt||s.socialCreatePhotos?.length||r[0].photos?.length||r[0].captions?.length||r[0].story||r[0].selectedCaptionId||e?.purpose!=='owner-announcement'||e.businessId!==s.cloudWorkspace?.businessId)return null;
 const content={schemaVersion:1,text:s.socialDraftText,brief:s.socialBrief||'',format:e.channel,treatment:e.treatment||'standard',channels:Object.entries({facebook:'Facebook',instagram:'Instagram',googleBusiness:'Google Business'}).filter(([key])=>s.socialDraftChannels?.[key]===true).map(([,value])=>value),media:[],ownerFacts:e.ownerFacts||'',preparedCopy:e.copy||'',brandFingerprint:typeof e.accountBrandFingerprint==='string'?e.accountBrandFingerprint:String(s.businessCreationIntelligence?.sharedProfile?.fingerprint||'')};
 const reference=e.opportunityReference?opportunityDraftReference(e.opportunityReference,{ownerId:s.ownerSession?.userId,businessId:s.cloudWorkspace?.businessId}):null;
 return finiteCreatorContent(content)&&(!e.opportunityReference||reference)?{draftId:r[0].id,content,reference}:null;
}
export function creatorAccountRecord(v){
 if(!finiteCreatorContent(v?.content))return null;
 const c=v.content;return {id:v.draftId,businessId:v.businessId,ownerId:v.ownerId,status:'Draft',text:c.text,brief:c.brief,photos:[],channels:c.channels,source:'owner-announcement',sourceLabel:'Private account Creator draft',contentEvidence:{businessId:v.businessId,purpose:'owner-announcement',channel:c.format,treatment:c.treatment,ownerFacts:c.ownerFacts,copy:c.preparedCopy,ownerSuppliedNotIndependentlyVerified:true,accountBrandFingerprint:c.brandFingerprint,...v.opportunityReference?{opportunityReference:v.opportunityReference}:{}},creatorAccountRevision:v.revision};
}
export function openCreatorAccountRecord(s,v){
 const record=creatorAccountRecord(v),actions=s.socialContentActions;
 if(!record||record.businessId!==s.cloudWorkspace?.businessId||record.ownerId!==s.ownerSession?.userId||s.socialDrafts?.some(r=>r.id===record.id))return false;
 // Original replaceDraft validates its ticket, consumes Keep/Use and advances its epoch.
 return actions.replaceDraft(()=>{
  const restored=restoreContentDraft(record);
  s.installCreatorAccountRecord(record,restored);return true;
 });
}
export function createCreatorDraftAccount({enabled=CREATOR_DRAFT_ACCOUNT_ENABLED,getCurrent,ownerAccessToken,request}){
 const initial=getCurrent(),observed=new WeakMap(),tickets=new WeakMap();let uncertain=null,pending=false;
 const valid=()=>{const c=getCurrent();return enabled===true&&c.scope===initial.scope&&!!c.scope&&c.ownerId===initial.ownerId&&c.businessId===initial.businessId&&c.role==='owner'&&c.ready===true&&uuid(c.ownerId)&&uuid(c.businessId);};
 const io=async(name,body,before=()=>true)=>{if(!valid())throw Error('Creator account disabled or scope changed');const token=await ownerAccessToken();if(!valid()||!token||!before())throw Error('Review changed');const r=await request('rpc/busy_creator_draft_'+name+'_v1',{method:'POST',token,body:{p_business_id:initial.businessId,...body}});if(!valid())throw Error('Scope changed');return r;};
 const scoped=r=>r?.ownerId===initial.ownerId&&r.businessId===initial.businessId;
 const record=r=>scoped(r)&&id(r.draftId)&&Number.isSafeInteger(r.revision)&&r.revision>0&&finiteCreatorContent(r.content)&&r.status==='Draft'&&['not_linked','current','historical','retired'].includes(r.sourceState)&&Number.isFinite(Date.parse(r.recordedAt))&&(r.opportunityReference===null||!!opportunityDraftReference(r.opportunityReference,initial));
 return {enabled:enabled===true,
  async list(opportunityId=null,after=null){if(opportunityId!==null&&!uuid(opportunityId)||after!==null&&!id(after))throw Error('Exact cursor and opportunity required');const r=await io('list',{p_opportunity_id:opportunityId,p_after:after,p_limit:20});if(!scoped(r)||r.notOwnReceipt!==true||!Array.isArray(r.items)||r.items.length>20||r.items.some(x=>!id(x.draftId)||!Number.isSafeInteger(x.revision)||x.revision<1||typeof x.briefPreview!=='string'||x.briefPreview.length>120)||r.nextAfter!==null&&!id(r.nextAfter))throw Error('Invalid Creator catalogue');return r;},
  async read(draftId,revision=null){if(!id(draftId)||revision!==null&&(!Number.isSafeInteger(revision)||revision<1))throw Error('Exact draft required');const r=await io('read',{p_draft_id:draftId,p_revision:revision});if(!record(r)||r.notOwnReceipt!==true||'operationId'in r||r.draftId!==draftId||!Number.isSafeInteger(r.currentRevision)||r.currentRevision<r.revision||r.historical!==(r.currentRevision!==r.revision)||revision!==null&&r.revision!==revision)throw Error('Invalid independent draft read');observed.set(r,stableJson(r));return r;},
  review({draftId,content,reference=null,base=null,requestKey,isCurrent=()=>true}){
   if(!valid()||uncertain||!id(draftId)||!finiteCreatorContent(content)||!isCurrent()||!id(requestKey)||requestKey.length<8||reference&&!opportunityDraftReference(reference,initial)||base&&(observed.get(base)!==stableJson(base)||base.historical||base.draftId!==draftId))return null;
   const t={draftId,content:JSON.parse(stableJson(content)),reference,base,requestKey};tickets.set(t,{stamp:stableJson(t),isCurrent});return t;
  },
  async commit(t){const info=t&&tickets.get(t);if(!info||pending||uncertain||!valid()||!info.isCurrent()||info.stamp!==stableJson(t))return {ok:false,status:'not_sent'};tickets.delete(t);pending=true;
   try{const r=await io('write',{p_draft_id:t.draftId,p_expected_revision:t.base?.revision||0,p_content:t.content,p_opportunity_id:t.reference?.opportunityId||null,p_opportunity_revision:t.reference?.revision||null,p_source_hash:t.reference?.sourceHash||null,p_request_key:t.requestKey},info.isCurrent);
    if(!info.isCurrent()||!record(r)||r.ownOperationReceipt!==true||r.notOwnReceipt!==false||r.executionAuthorised!==false||!uuid(r.operationId)||r.requestKey!==t.requestKey||r.draftId!==t.draftId||r.revision!==(t.base?.revision||0)+1||stableJson(r.content)!==stableJson(t.content)||stableJson(r.opportunityReference)!==stableJson(t.reference))throw Error('Exact own receipt unavailable');return {ok:true,status:'committed',receipt:r};
   }catch(e){if(e?.status===403&&e?.payload?.code==='42501'||e?.status===400&&e?.payload?.code==='22023'||e?.status===409&&['40001','23505'].includes(e?.payload?.code))return {ok:false,status:'rejected',mayReplay:false};uncertain=t.requestKey;return {ok:false,status:'unknown',mayReplay:false};}finally{pending=false;}
  },
  async recover(){if(!uncertain)return null;const r=await io('operation',{p_request_key:uncertain});if(!scoped(r)||r.notOwnReceipt!==true||typeof r.found!=='boolean'||r.found&&(!record(r)||r.requestKey!==uncertain||!uuid(r.operationId)||r.operationObserved!==true))throw Error('Exact observation unavailable');if(r.found)uncertain=null;return r;}
 };
}
const sessions=new WeakMap();
export function creatorDraftAccountBindings(options){const key=options.sessionRef?.current;if(!key)return {enabled:false};const c=options.getCurrent();let e=sessions.get(key);if(!e||e.scope!==c.scope||e.owner!==c.ownerId||e.business!==c.businessId){e={scope:c.scope,owner:c.ownerId,business:c.businessId,options};e.api=createCreatorDraftAccount({...options,getCurrent:()=>e.options.getCurrent(),ownerAccessToken:()=>e.options.ownerAccessToken(),request:(...a)=>e.options.request(...a)});sessions.set(key,e);}e.options=options;return e.api;}
