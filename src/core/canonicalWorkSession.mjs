import {stableJson} from './stableJson.mjs';
// V22.51 canonical individual records. Rollout is NOT authorization.
export const CANONICAL_WORK_ACCOUNT_ENABLED=false;
const uuid=v=>typeof v==='string'&&/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(v);
const hash=v=>typeof v==='string'&&/^[0-9a-f]{64}$/.test(v);
const same=(a,b)=>stableJson(a)===stableJson(b);
// Volatile finite-operation evidence only; canonical rows remain server authority.
export function createCanonicalWorkSession(){
 const observations=new WeakMap(),tickets=new WeakMap(),outcomes=new WeakMap();
 return {bind({enabled=CANONICAL_WORK_ACCOUNT_ENABLED,getCurrent,ownerAccessToken,request,evidence='account'}){
  const initial=getCurrent(),scope=initial?.scope,start={ownerId:initial?.ownerId,businessId:initial?.businessId,role:initial?.role};
  const valid=()=>{const c=getCurrent();return enabled===true&&!!scope&&typeof scope==='object'&&c?.scope===scope&&c.ready===true&&c.ownerId===start.ownerId&&c.businessId===start.businessId&&c.role==='owner'&&start.role==='owner'&&!!c.ownerId&&uuid(c.businessId);};
  const observe=(value,kind)=>{observations.set(value,{scope,owner:start.ownerId,business:start.businessId,kind,stamp:stableJson(value)});return value;};
  const observed=(value,kind)=>{const b=value&&observations.get(value);return valid()&&b?.scope===scope&&b.owner===start.ownerId&&b.business===start.businessId&&b.kind===kind&&b.stamp===stableJson(value)&&(kind!=='source'||getCurrent().revision===value.snapshotRevision);};
  const io=async(name,body,beforeSend=()=>true)=>{if(!valid())throw Error('Canonical Work is disabled or the workspace changed.');const token=await ownerAccessToken();if(!valid()||!token||!beforeSend())throw Error('Current authentication or review unavailable.');const value=await request('rpc/busy_work_'+name+'_v1',{method:'POST',token,body:{p_business_id:start.businessId,...body}});if(!valid())throw Error('Workspace changed during the request. Keep local work.');return value;};
  const scoped=(v,c,id=null)=>v&&v.businessId===start.businessId&&v.customerId===c&&(v.ownerId===start.ownerId||v.actorId===start.ownerId)&&(!id||v.engagementId===id);
  const source=async(customerId,enquiryId,revision)=>{
   const value=await io('source_review',{p_customer_id:customerId,p_enquiry_id:enquiryId,p_expected_snapshot_revision:revision});
   if(!scoped(value,customerId)||value.enquiryId!==enquiryId||value.snapshotRevision!==revision||value.schemaVersion!==1||!hash(value.sourceHash)||!hash(value.customerHash)||value.notOwnReceipt!==true||typeof value.hasLegacyWork!=='boolean')throw Error('Source review did not match the requested business/customer/enquiry.');
   return observe(value,'source');
  };
  const list=async(customerId,after=null)=>{const value=await io('list',{p_customer_id:customerId,p_after:after,p_limit:20});
   if(!scoped(value,customerId)||!Array.isArray(value.items)||value.items.length>20||value.nextCursor!==null&&!uuid(value.nextCursor)||value.notOwnReceipt!==true||value.items.some(x=>!uuid(x.engagementId)||x.type!=='quote'||x.status!=='Prepared'||!Number.isSafeInteger(x.revision)||x.revision<1||Object.keys(x).some(k=>!['engagementId','enquiryId','type','status','revision'].includes(k)))||new Set(value.items.map(x=>x.engagementId)).size!==value.items.length)throw Error('Unsupported canonical engagement page.');
   return value;
  };
  const read=async(customerId,id)=>{if(!uuid(id))throw Error('Invalid engagement identity.');const value=await io('read',{p_customer_id:customerId,p_engagement_id:id});
   if(!scoped(value,customerId,id)||value.schemaVersion!==1||!Number.isSafeInteger(value.revision)||value.revision<1||value.type!=='quote'||value.status!=='Prepared'||!hash(value.sourceHash)||!hash(value.recordHash)||value.notOwnReceipt!==true||value.record?.type!=='quote'||!value.record.details||Object.keys(value.record).some(k=>!['type','done','details'].includes(k))||Object.keys(value.record.details).some(k=>!['quoteStatus','quoteAmount','message','plannedSentDate'].includes(k)))throw Error('Unsupported or mismatched engagement read.');
   return observe(value,'record');
  };
  const history=async(customerId,id)=>{if(!uuid(id))throw Error('Invalid engagement identity.');const value=await io('history',{p_customer_id:customerId,p_engagement_id:id});if(!scoped(value,customerId,id)||value.historicalOnly!==true||value.mutationAuthorised!==false||value.notOwnReceipt!==true||!['current','changed','restricted','unsupported','unavailable'].includes(value.sourceState)||value.originalSource?.enquiryId!==value.enquiryId||!hash(value.sourceHash)||!Number.isSafeInteger(value.revision)||value.revision<1)throw Error('Historical identity mismatch.');return value;};
  const privateRead=async(customerId,id,kind)=>{const value=await io('private_read',{p_customer_id:customerId,p_engagement_id:id,p_kind:kind});if(!scoped(value,customerId,id)||value.kind!==kind||!Number.isSafeInteger(value.revision)||value.revision<0||value.notOwnReceipt!==true)throw Error('Private draft identity mismatch.');return observe(value,'private');};
  const review=({operation,source:src,record,draft,fields,operationId,editor})=>{
   if(!valid()||!['create','edit','private'].includes(operation)||typeof operationId!=='string'||!/^[A-Za-z0-9_-]{8,120}$/.test(operationId)||!editor||!Number.isSafeInteger(editor.typingEpoch)||editor.typingEpoch<0)return null;
   const base=operation==='create'?src:record;
   if(!observed(base,operation==='create'?'source':'record')||editor.customerId!==base.customerId||operation==='private'&&(!observed(draft,'private')||draft.engagementId!==record.engagementId||draft.customerId!==record.customerId))return null;
   if(['edit','private'].includes(operation)&&editor.engagementId!==record.engagementId)return null;
   if(operation==='create'&&editor.engagementId!==null)return null;
   if(['create','edit'].includes(operation)&&(!fields||typeof fields.text!=='string'||!fields.text.trim()||typeof fields.amount!=='string'||!/^\d+(?:\.\d{1,2})?$/.test(fields.amount)||typeof fields.date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(fields.date)))return null;
   if(!same(editor.fields,fields))return null;
   if(operation==='create'&&src.hasLegacyWork)return null;
   if(operation==='private'&&(!['reply','followup'].includes(draft.kind)||typeof fields?.text!=='string'||!fields.text.trim()))return null;
   const ticket=Object.freeze({operation,operationId,customerId:base.customerId,enquiryId:base.enquiryId||record?.enquiryId,engagementId:record?.engagementId||null,fields:JSON.parse(stableJson(fields||{})),source:base});
   tickets.set(ticket,{scope,editor:stableJson(editor),source:base,sourceKind:operation==='create'?'source':'record',draft,stamp:stableJson(ticket),used:false});return ticket;
  };
  const cancel=ticket=>{const t=tickets.get(ticket);if(t)t.used=true;return false;};
  const commit=async(ticket,getEditor)=>{
   const t=tickets.get(ticket),previous=outcomes.get(scope);
   if(!t||t.used||!valid()||t.scope!==scope||t.stamp!==stableJson(ticket)||!same(getEditor(),JSON.parse(t.editor))||!observed(t.source,t.sourceKind)||t.draft&&!observed(t.draft,'private')||previous&&['pending','unknown'].includes(previous.status))return {status:'reviewRequired'};
   t.used=true;const pending={status:'pending',ticket};outcomes.set(scope,pending);
   const base=t.source,fields=ticket.fields,body={p_customer_id:ticket.customerId,p_operation_id:ticket.operationId};let name,expected,operation;
   if(ticket.operation==='create'){
    name='create_quote';operation='engagement_create_quote';expected=0;
    Object.assign(body,{p_enquiry_id:base.enquiryId,p_expected_snapshot_revision:base.snapshotRevision,p_source_hash:base.sourceHash,p_customer_hash:base.customerHash,p_amount:fields.amount,p_text:fields.text,p_date:fields.date});
   }else if(ticket.operation==='edit'){
    name='edit_quote';operation='engagement_edit_quote';expected=base.revision;Object.assign(body,{p_engagement_id:base.engagementId,p_expected_revision:base.revision,p_source_hash:base.sourceHash,p_amount:fields.amount,p_text:fields.text,p_date:fields.date});
   }else{
    name='private_write';operation='engagement_private_wording';expected=t.draft.revision;Object.assign(body,{p_engagement_id:base.engagementId,p_engagement_revision:base.revision,p_expected_draft_revision:expected,p_source_hash:base.sourceHash,p_kind:t.draft.kind,p_text:fields.text});
   }
   let sent=false;
   try{
    const receipt=await io(name,body,()=>{if(!same(getEditor(),JSON.parse(t.editor))||!observed(t.source,t.sourceKind))return false;sent=true;return true;});
    if(!scoped(receipt,ticket.customerId,ticket.engagementId)||receipt.operation!==operation||receipt.operationId!==ticket.operationId||receipt.schemaVersion!==1||receipt.previousRevision!==expected||receipt.revision!==expected+1||!uuid(receipt.engagementId)||ticket.operation!=='private'&&!hash(receipt.recordHash)||ticket.operation==='private'&&(receipt.kind!==t.draft.kind||receipt.engagementRevision!==base.revision||!hash(receipt.textHash))||ticket.operation==='create'&&receipt.enquiryId!==base.enquiryId||ticket.operation!=='private'&&receipt.sourceHash!==base.sourceHash)throw Error('Exact operation receipt mismatch.');
    const result={status:'confirmed',evidence,receipt,ticket};outcomes.set(scope,result);return result;
   }catch{const status=sent?'unknown':'reviewRequired';if(outcomes.get(scope)===pending)outcomes.set(scope,{status,ticket});return {status,ticket};}
  };
  return {enabled:enabled===true,evidence,source,list,read,history,privateRead,review,cancel,commit,status:()=>outcomes.get(scope)||{status:'idle'}};
 }};
}

const accountSessions=new WeakMap();
// Reuse the original account-session identity; no second root state/store.
export function canonicalWorkBindings({sessionRef,...options}){
 const key=sessionRef?.current;if(!key||typeof key!=='object')return {enabled:false};
 if(!accountSessions.has(key))accountSessions.set(key,createCanonicalWorkSession());
 return accountSessions.get(key).bind(options);
}
