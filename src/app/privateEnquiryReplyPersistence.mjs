import {writePrivateEnquiryReplyCopy,readPrivateEnquiryReplyCopy} from '../core/privateEnquiryReply.mjs';
import {enqueuePrivateCheckpoint} from '../core/privateCheckpointQueue.mjs';

// Device persistence adapter for the original reply field and scoped snapshot.
// No React state owner, account write authority or independent persistence store.
export async function persistPrivateReply({customer,record,isCurrent,reconcile},{key,getCurrent,storage,setCustomers}){
 const start=getCurrent(),context=start?.context;
 if(!key||!context?.ready)return {status:'failed'};
 let payload,stamp;
 try{payload=context.getPayload();stamp=JSON.stringify(payload);}catch{return {status:'failed'};}
 const current=()=>{
  try{
   const now=getCurrent();
   return now.scope===start.scope&&now.scope===now.renderedScope&&now.context?.ownerId===context.ownerId&&now.context?.businessId===context.businessId&&now.context?.revision===context.revision&&now.context?.ready&&['owner','admin'].includes(now.role)&&isCurrent()&&JSON.stringify(now.context.getPayload())===stamp;
  }catch{return false;}
 };
 if(!current())return {status:'failed'};
 const result=await enqueuePrivateCheckpoint(key,async()=>{
  if(!current())return {status:'failed'};
  if(reconcile)return {...await readPrivateEnquiryReplyCopy({ownerId:context.ownerId,businessId:context.businessId,encoded:reconcile.encoded,read:()=>storage.getItem(key)}),customer:reconcile.customer,encoded:reconcile.encoded};
  return writePrivateEnquiryReplyCopy({ownerId:context.ownerId,businessId:context.businessId,revision:context.revision,customer,record,payload,isCurrent:current,write:value=>{if(!current())throw Error('Workspace changed before write');return storage.setItem(key,value);},read:()=>storage.getItem(key)});
 });
 if(!current())return {...result,status:'unknown'};
 if(result.status==='confirmed')setCustomers(rows=>rows.includes(customer)?rows.map(row=>row===customer?result.customer:row):rows);
 return result;
}

// Original account-session bindings: feature gate is rollout only, never authority.
// The editor supplies its genuine live typing epoch. No copied state or payload apply.
export function privateReplyAccountBindings({enabled,recoveryEnabled=false,sessionRef,contextRef,ownerAccessToken,request}){
 if(enabled!==true&&recoveryEnabled!==true)return {trustedAccountEnabled:false,accountRecoveryEnabled:false};
 const current=(getEditorEpoch,getRecoveredContext)=>()=>{
  const original=contextRef.current,recovered=getRecoveredContext?.();
  if(getRecoveredContext&&!recovered)return {...original,ready:false,inputEpoch:getEditorEpoch()};
  return {...original,...(recovered?{identity:recovered.workspace,businessId:recovered.workspace.businessId,ownerId:recovered.workspace.actorId,role:recovered.workspace.memberRole,ready:true,recoveredReply:recovered.projection}:{}),inputEpoch:getEditorEpoch()};
 };
 return {
  trustedAccountEnabled:enabled===true,accountRecoveryEnabled:recoveryEnabled===true,
  readFirstAccountReply:({customerId,enquiryId,getEditorEpoch,getRecoveredContext})=>sessionRef.current.reviewEnquiry({getCurrent:current(getEditorEpoch,getRecoveredContext),ownerAccessToken,request,customerId,enquiryId}),
  prepareFirstAccountReply:({review,newText,getEditorEpoch,getRecoveredContext})=>sessionRef.current.prepareEnquiryOperation({getCurrent:current(getEditorEpoch,getRecoveredContext),review,newText}),
  loadAccountReplyChoices:args=>sessionRef.current.discoverPrivateReplies({...args,ownerAccessToken,request}),
  inspectAccountReply:args=>sessionRef.current.inspectDiscoveredReply({...args,ownerAccessToken,request}),
  reconcilePrivateAccountReply:({getEditorEpoch,getRecoveredContext})=>sessionRef.current.reconcilePrivateReply({getCurrent:current(getEditorEpoch,getRecoveredContext),ownerAccessToken,request}),
  readPrivateAccountReply:({customerId,enquiryId,getEditorEpoch,getRecoveredContext})=>sessionRef.current.readPrivateReply({getCurrent:current(getEditorEpoch,getRecoveredContext),ownerAccessToken,request,customerId,enquiryId}),
  preparePrivateAccountEdit:({review,newText,getEditorEpoch,getRecoveredContext})=>sessionRef.current.preparePrivateReplyEdit({getCurrent:current(getEditorEpoch,getRecoveredContext),review,newText}),
  commitPrivateAccountEdit:({ticket,getEditorEpoch,getRecoveredContext})=>sessionRef.current.mutatePrivate({getCurrent:current(getEditorEpoch,getRecoveredContext),ownerAccessToken,request,ticket}),
 };
}
