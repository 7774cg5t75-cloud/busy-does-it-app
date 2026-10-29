import {stableJson} from '../core/stableJson.mjs';
// Review tickets own no records. Original request, snapshot and Customer records
// remain the authorities; no customer matching, booking or send is inferred.
export function createConnectedEnquiryJourney({request,businessId,ownerId,isCurrent=()=>true}){
 const tickets=new WeakMap();let busy=false,unknown=false;
 const verified=r=>r?.businessId===businessId&&(r.ownerId||r.actorId)===ownerId&&isCurrent();
 async function review(requestId){
  if(busy||unknown||!isCurrent())throw Error('Inspect the current account before another review');
  const source=await request('app_enquiry_review',{businessId,requestId});const basis=await request('builder_read',{businessId});
  if(!verified(source)||basis.actorId!==ownerId||basis.businessId!==businessId||!isCurrent())throw Error('Enquiry access changed');
  const value={source,revision:basis.revision};tickets.set(value,stableJson(value));return value;
 }
 async function importSource(value){
  if(busy||unknown||!isCurrent()||tickets.get(value)!==stableJson(value))throw Error('Review this enquiry again');tickets.delete(value);busy=true;
  try{
   const r=await request('app_enquiry_import',{businessId,requestId:value.source.requestId,requestHash:value.source.requestHash,expectedRevision:value.revision});
   if(!verified(r)||!Number.isSafeInteger(r.revision))throw Error('Source receipt unavailable');
   const pending=await request('pending_review',{businessId,expectedRevision:r.revision,enquiryId:r.enquiryId});
   if(!verified(pending)||pending.pending?.rawText!==value.source.message)throw Error('Pending source changed');
   const checked={source:value.source,pending,revision:r.revision};tickets.set(checked,stableJson(checked));return {ok:true,review:checked,observedOnly:r.observedOnly===true};
  }catch{unknown=true;return {ok:false,unknown:true,mayReplay:false};}finally{busy=false;}
 }
 async function file(value,fields){
  if(busy||unknown||!isCurrent()||tickets.get(value)!==stableJson(value))throw Error('Review current contact details again');tickets.delete(value);busy=true;
  if(!fields||Object.keys(fields).some(k=>!['name','phone','email','address','service','eventDate','eventTime','note','confidence'].includes(k))||Object.values(fields).some(v=>typeof v!=='string'||v.length>6000)){busy=false;throw Error('Review supported contact fields');}
  const id=value.source.requestId.replaceAll('-','_'),capture={customerId:'customer_'+id,enquiryId:value.pending.pending.id,sourceRecordId:'source_'+id,intakeId:'intake_'+id,activityId:'activity_'+id,sourceHash:value.pending.sourceHash,...fields};
  try{
   const r=await request('app_enquiry_file',{businessId,expectedRevision:value.revision,capture,identityDecision:'create_separate_contact'});
   if(!verified(r)||r.customerId!==capture.customerId||r.enquiryId!==capture.enquiryId||r.revision!==value.revision+1)throw Error('Filing receipt unavailable');
   const observed=await request('filed_review',{businessId,expectedRevision:r.revision,customerId:r.customerId,enquiryId:r.enquiryId});
   if(!verified(observed)||observed.customer?.id!==r.customerId||observed.enquiry?.filedCustomerId!==r.customerId)throw Error('Filing readback unavailable');
   return {ok:true,receipt:r,observed,requestOrigin:{requestId:value.source.requestId,appId:value.source.appId}};
  }catch{unknown=true;return {ok:false,unknown:true,mayReplay:false};}finally{busy=false;}
 }
 return {review,importSource,file,get uncertain(){return unknown;}};
}
