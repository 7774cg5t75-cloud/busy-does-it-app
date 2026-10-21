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
