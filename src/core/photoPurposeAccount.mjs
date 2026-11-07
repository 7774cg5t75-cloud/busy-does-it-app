import {stableJson} from './stableJson.mjs';
export const PHOTO_PURPOSES=Object.freeze(['website_hero','website_gallery','app_presentation','creator_draft','marketing_material']);
export function validPhotoDecisions(value){return !!value&&typeof value==='object'&&!Array.isArray(value)&&Object.keys(value).length<=5&&Object.entries(value).every(([k,v])=>PHOTO_PURPOSES.includes(k)&&['approved','withdrawn'].includes(v));}
// Original private registry extension only. Client hashes/approvals do not grant
// storage access, public visibility, copyright verification or upload permission.
export function createPhotoPurposeAccount({getCurrent,request,randomUUID}){
 const origin=getCurrent(),observed=new WeakMap(),tickets=new WeakMap();let flight=false,unknown=null;
 const current=()=>{const c=getCurrent();return !!origin.scope&&c.scope===origin.scope&&c.ownerId===origin.ownerId&&c.businessId===origin.businessId&&c.role==='owner'&&c.ready===true;};
 const matches=(v,source)=>v?.ownerId===origin.ownerId&&v.businessId===origin.businessId&&v.assetId===source.assetId&&v.sha256===source.sha256&&Number.isSafeInteger(v.revision)&&v.revision>=0&&validPhotoDecisions(v.decisions)&&v.publicUseAuthorised===false&&v.rightsIndependentlyVerified===false;
 const inspect=async(source,operationId=null)=>{if(!current())throw Error('Current owner required');const r=await request('media_purpose_inspect',{assetId:source.assetId,sha256:source.sha256,...operationId?{operationId}:{}});if(!current()||!matches(r,source)||r.notOwnReceipt!==true)throw Error('Original purpose inspection unavailable');observed.set(r,stableJson(r));return r;};
 return {inspect,
  review(base,decisions,isCurrent=()=>true){if(!current()||unknown||!isCurrent()||observed.get(base)!==stableJson(base)||!validPhotoDecisions(decisions))return null;const operationId=randomUUID();if(!/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/.test(operationId))throw Error('Secure operation identity unavailable');const t={base,decisions:JSON.parse(stableJson(decisions)),operationId};tickets.set(t,{stamp:stableJson(t),isCurrent});return t;},
  async commit(t){const proof=tickets.get(t);if(!proof||flight||unknown||!current()||!proof.isCurrent()||proof.stamp!==stableJson(t))return {ok:false,status:'not_sent'};tickets.delete(t);flight=true;
   try{unknown=t;const r=await request('media_purpose_save',{assetId:t.base.assetId,sha256:t.base.sha256,expectedRevision:t.base.revision,decisions:t.decisions,operationId:t.operationId,rightsAcknowledged:true});if(!current()||!proof.isCurrent()||!matches(r,t.base)||r.operationId!==t.operationId||r.revision!==t.base.revision+1)throw Error('Save outcome uncertain');const fresh=await inspect(t.base,t.operationId);if(!proof.isCurrent()||fresh.revision!==r.revision||stableJson(fresh.decisions)!==stableJson(t.decisions)||fresh.inspectedOperation?.operationId!==t.operationId)throw Error('Independent readback differs');unknown=null;return {ok:true,status:'saved_private',observed:fresh};}catch{return {ok:false,status:'unknown',mayReplay:false};}finally{flight=false;}
  },
  async recover(){if(!unknown||flight||!current())return {found:false,mayReplay:false};const t=unknown;const fresh=await inspect(t.base,t.operationId);const op=fresh.inspectedOperation;if(op?.operationId!==t.operationId||op.expectedRevision!==t.base.revision||stableJson(op.decisions)!==stableJson(t.decisions))return {found:false,mayReplay:false};unknown=null;return {found:true,independentObservation:true,ownReceiptRecovered:false,observed:fresh,mayReplay:false};},
  get uncertain(){return !!unknown;}
 };
}
