import {stableJson} from './stableJson.mjs';
export const GROWTH_OPPORTUNITY_ACCOUNT_ENABLED=false;
const uuid=v=>typeof v==='string'&&/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(v);
const hash=v=>typeof v==='string'&&/^[a-f0-9]{64}$/.test(v);
export function finiteOwnerOpportunity(v){
 return !!v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).sort().join('|')==='description|permission|serviceId|source|title'&&[['title',100],['description',600],['source',300],['serviceId',128]].every(([k,n])=>typeof v[k]==='string'&&!!v[k].trim()&&v[k].length<=n&&!/[<>\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(v[k]))&&['permitted','unknown','restricted'].includes(v.permission);
}
export function createGrowthOpportunityAccount({enabled=GROWTH_OPPORTUNITY_ACCOUNT_ENABLED,getCurrent,ownerAccessToken,request,authenticatedRequest}){
 const initial=getCurrent(),scope=initial.scope,business=initial.businessId,owner=initial.ownerId,observations=new WeakMap(),tickets=new WeakMap();let uncertain=null,pending=false;
 const valid=()=>{const v=getCurrent();return enabled===true&&!!scope&&v.scope===scope&&v.ownerId===owner&&v.businessId===business&&v.role==='owner'&&v.ready===true&&uuid(business)&&uuid(owner);};
 const io=async(name,body,before=()=>true)=>{if(!valid())throw Error('Growth account operations are disabled or the owner changed.');if(!before())throw Error('Current review unavailable.');let v;if(authenticatedRequest){if(!['read','list','write','operation'].includes(name))throw Error('Unsupported Growth operation');v=await authenticatedRequest(name,{p_business_id:business,...body},before);}else{const token=await ownerAccessToken();if(!token||!valid()||!before())throw Error('Current review unavailable.');v=await request('rpc/busy_growth_opportunity_'+name+'_v1',{method:'POST',token,body:{p_business_id:business,...body}});}if(!valid())throw Error('Account changed while the operation was pending.');return v;};
 const scoped=v=>v?.businessId===business&&v?.ownerId===owner;
 const record=v=>scoped(v)&&uuid(v.opportunityId)&&Number.isSafeInteger(v.revision)&&v.revision>0&&finiteOwnerOpportunity(v.record)&&['active','retired'].includes(v.state)&&v.provenance==='owner_reported'&&hash(v.sourceHash)&&(v.reviewedSourceHash===null||hash(v.reviewedSourceHash))&&['clear','useful','irrelevant','later'].includes(v.feedback)&&typeof v.feedbackReason==='string'&&v.feedbackReason.length<=300&&v.contactPermission==='not_established'&&v.outcomes==='not_established'&&Number.isFinite(Date.parse(v.recordedAt));
 const observe=v=>{observations.set(v,stableJson(v));return v;};
 const observed=v=>valid()&&observations.get(v)===stableJson(v)&&v.historical===false;
 return {enabled:enabled===true,
  reference(v){return observed(v)&&v.state==='active'&&v.record.permission==='permitted'&&v.reviewedSourceHash===v.sourceHash?{version:1,type:'owner_reported_opportunity',ownerId:owner,businessId:business,opportunityId:v.opportunityId,revision:v.revision,sourceHash:v.sourceHash,sourceAccount:v.record.source,provenance:'owner_reported',referenceOnly:true}:null;},
  async list(after=null){if(after!==null&&!uuid(after))throw Error('Exact page cursor required.');const v=await io('list',{p_after:after,p_limit:20});if(!scoped(v)||v.notOwnReceipt!==true||!Array.isArray(v.items)||v.items.length>20||v.items.some(x=>!uuid(x.opportunityId)||!Number.isSafeInteger(x.revision)||x.revision<1||typeof x.title!=='string'||x.title.length>100||!['active','retired'].includes(x.state))||v.nextAfter!==null&&!uuid(v.nextAfter))throw Error('Invalid private Growth page.');return v;},
  async read(id,revision=null){if(!uuid(id)||revision!==null&&(!Number.isSafeInteger(revision)||revision<1))throw Error('Exact record required.');const v=await io('read',{p_opportunity_id:id,p_revision:revision});if(!record(v)||v.opportunityId!==id||v.notOwnReceipt!==true||!Number.isSafeInteger(v.currentRevision)||v.currentRevision<v.revision||v.historical!==(v.currentRevision!==v.revision)||revision!==null&&v.revision!==revision||'operationId'in v)throw Error('Invalid independent Growth read.');return observe(v);},
  async recover(){
   if(!uncertain||!valid())return null;const op=uncertain;const v=await io('operation',{p_operation_id:op});
   if(!scoped(v)||v.notOwnReceipt!==true||typeof v.found!=='boolean'||v.found&&(!record(v)||v.operationObserved!==true||v.operationId!==op))throw Error('Exact operation observation unavailable.');
   if(v.found)uncertain=null;return v;
  },
  review({action,base=null,fields=null,feedback=null,reason=null,operationId,isCurrent=()=>true}){
   if(pending||uncertain||!valid()||!isCurrent()||!['create','edit','retire','reopen','reinspect','feedback'].includes(action)||typeof operationId!=='string'||!/^[A-Za-z0-9_-]{8,120}$/.test(operationId)||action!=='create'&&!observed(base)||action==='create'&&base!==null||['create','edit'].includes(action)&&!finiteOwnerOpportunity(fields)||!['create','edit'].includes(action)&&fields!==null||action==='feedback'&&(!['clear','useful','irrelevant','later'].includes(feedback)||typeof reason!=='string'||reason.length>300)||action!=='feedback'&&(feedback!==null||reason!==null))return null;
   const ticket={action,base,fields:fields?{...fields}:null,feedback,reason,operationId};tickets.set(ticket,{stamp:stableJson(ticket),isCurrent});return ticket;
  },
  async commit(ticket){
   const t=ticket&&tickets.get(ticket);if(!t||pending||uncertain||!valid()||!t.isCurrent()||t.stamp!==stableJson(ticket)||ticket.base&&!observed(ticket.base))return {ok:false,status:'not_sent'};
   tickets.delete(ticket);pending=true;const body={p_opportunity_id:ticket.base?.opportunityId||null,p_expected_revision:ticket.base?.revision||0,p_source_hash:ticket.base?.sourceHash||null,p_action:ticket.action,p_record:ticket.fields,p_feedback:ticket.feedback,p_reason:ticket.reason,p_operation_id:ticket.operationId};
   try{
    const v=await io('write',body,t.isCurrent);if(!t.isCurrent()||!record(v)||v.ownOperationReceipt!==true||v.notOwnReceipt!==false||v.executionAuthorised!==false||v.operationId!==ticket.operationId||v.previousRevision!==body.p_expected_revision||v.revision!==body.p_expected_revision+1||ticket.base&&v.opportunityId!==ticket.base.opportunityId||ticket.fields&&stableJson(v.record)!==stableJson(ticket.fields)||v.action!==ticket.action)throw Error('Exact target receipt unavailable.');
    const expectedState=ticket.action==='retire'?'retired':ticket.action==='reopen'||ticket.action==='create'?'active':ticket.base.state;
    if(v.state!==expectedState||ticket.base&&!ticket.fields&&(stableJson(v.record)!==stableJson(ticket.base.record)||v.sourceHash!==ticket.base.sourceHash)||ticket.action==='feedback'&&(v.feedback!==ticket.feedback||v.feedbackReason!==(ticket.feedback==='clear'?'':ticket.reason))||ticket.action==='reinspect'&&v.reviewedSourceHash!==v.sourceHash||['create','edit','retire','reopen'].includes(ticket.action)&&v.reviewedSourceHash!==null)throw Error('Action-specific receipt mismatch.');
    return {ok:true,status:'committed',receipt:v};
   }catch(error){
    // Original busyDataRequest preserves HTTP status and PostgREST payload. Only
    // exact atomic PostgreSQL rejection classes can establish a rejected RPC.
    const code=error?.payload?.code,status=error?.status;
    if(status===409&&['40001','23505'].includes(code)||status===403&&code==='42501'||status===400&&code==='22023'){observations.delete(ticket.base);return {ok:false,status:'rejected',reason:code==='42501'?'restricted':status===409?'conflict':'invalid',mayReplay:false};}
    uncertain=ticket.operationId;return {ok:false,status:'unknown',mayReplay:false};}finally{pending=false;}

  }
 };
}
const sessions=new WeakMap();
export function growthOpportunityBindings(options){
 const key=options.sessionRef?.current;if(!key||typeof key!=='object')return {enabled:false};
 const c=options.getCurrent();let entry=sessions.get(key);
 if(!entry||entry.scope!==c.scope||entry.owner!==c.ownerId||entry.business!==c.businessId){entry={scope:c.scope,owner:c.ownerId,business:c.businessId,options};entry.api=createGrowthOpportunityAccount({...options,getCurrent:()=>entry.options.getCurrent(),ownerAccessToken:()=>entry.options.ownerAccessToken(),request:(...args)=>entry.options.request(...args)});sessions.set(key,entry);}
 entry.options=options;return entry.api;
}
