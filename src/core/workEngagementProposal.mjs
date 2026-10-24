import {stableJson} from './stableJson.mjs';
import {quoteEnquiryReference,resolveQuoteEnquiryReference} from './quoteEnquiryReference.mjs';
import {enquiryReplyCustomerSource} from './privateEnquiryReply.mjs';
import {prepareEnquiryReplyText} from './enquiryReplyText.mjs';
// Historical nested-v2 SESSION/compatibility prototype only, NEVER persisted.
// V22.51 chooses individual canonical records as permanent Work authority.
export const WORK_ENGAGEMENT_KIND='customer-work-engagements';
export const isWorkEngagementModel=value=>value?.kind===WORK_ENGAGEMENT_KIND;
const copy=value=>{
 if(value===null||typeof value==='string'||typeof value==='boolean'||typeof value==='number'&&Number.isFinite(value))return value;
 if(Array.isArray(value))return value.map(copy);
 if(value&&Object.prototype.toString.call(value)==='[object Object]')return Object.fromEntries(Object.entries(value).map(([key,v])=>[key,copy(v)]));
 throw Error('Unsupported non-JSON Work data');
};
const stamp=(customer,item)=>stableJson([enquiryReplyCustomerSource(customer),item]);
const key=reference=>'filed:'+encodeURIComponent(stableJson([reference.businessId,reference.customerId,reference.inboxId,reference.reviewedAt,reference.queuedAt]));
const operationBlocked=c=>c.bookingOperation?.customerId===c.customer?.id&&['pending','unknown','confirmed-review'].includes(c.bookingOperation.phase)||c.quoteCopy?.customerId===c.customer?.id&&['saving','unknown'].includes(c.quoteCopy.status);
const originalSupported=c=>['quote','booking','reminder'].includes(c.action?.type)&&c.action.origin==='manual'&&!c.action.details?.sourceMiniAppRequestId&&!c.action.sourceMiniAppRequestId&&!isWorkEngagementModel(c.action);
const scopeCurrent=c=>!operationBlocked(c)&&!!c.ownerId&&!!c.businessId&&c.role==='owner'&&Number.isSafeInteger(c.revision)&&c.revision>0&&c.customers?.filter(row=>row?.id===c.customer?.id).length===1&&c.customers.includes(c.customer)&&![c.customer?.businessId,c.customer?.business_id].some(id=>id&&id!==c.businessId);
const source=(reference,c)=>{const item=resolveQuoteEnquiryReference(reference,{businessId:c.businessId,customerId:c.customer.id,inboxItems:c.inboxItems,revision:c.revision});return item&&![item.businessId,item.business_id].some(id=>id&&id!==c.businessId)?{reference:copy(reference),stamp:stamp(c.customer,item)}:null;};
export function inspectWorkEngagementProposal(model,c){
 try{
  if(!scopeCurrent(c)||!originalSupported(c)||model?.kind!==WORK_ENGAGEMENT_KIND||model.version!==2||model.ownerId!==c.ownerId||model.businessId!==c.businessId||model.customerId!==c.customer.id||model.baseRevision!==c.revision||model.profileStamp!==stableJson(c.profile||null)||!Array.isArray(model.engagements)||model.engagements.length<2||model.engagements.length>20)return false;
  const ids=new Set();
  for(const entry of model.engagements){
   if(!entry?.source||entry.id!==key(entry.source.reference)||ids.has(entry.id)||!['quote','booking','reminder'].includes(entry.record?.type)||stableJson(source(entry.source.reference,c))!==stableJson(entry.source)||stableJson(entry.record.details?.enquiryReference)!==stableJson(entry.source.reference))return false;
   ids.add(entry.id);
  }
  const original=model.engagements[0];
  return original.id===model.primaryId&&original.evidence==='workspace-record'&&stableJson(original.record)===stableJson(c.action)&&model.engagements.slice(1).every(e=>e.evidence==='session-proposal'&&e.record.type==='quote'&&e.record.details.quoteStatus==='Prepared'&&e.record.done===false);
 }catch{return false;}
}
export function prepareWorkEngagementProposal(c,enquiryId,existing=null){
 try{
  if(!scopeCurrent(c)||!originalSupported(c))return null;
  const originalSource=source(c.action.details?.enquiryReference,c);if(!originalSource)return null;
  if(existing&&!inspectWorkEngagementProposal(existing,c))return null;
  const rows=c.inboxItems.filter(item=>item?.id===enquiryId);if(rows.length!==1)return null;
  const item=rows[0],reference=quoteEnquiryReference({businessId:c.businessId,customerId:c.customer.id,item,revision:c.revision}),newSource=reference&&source(reference,c);
  const prepared=prepareEnquiryReplyText({customer:c.customer,item,businessId:c.businessId,approvedProfile:c.profile,purpose:'quote-preparation'});
  if(!newSource||!prepared.ok)return null;
  const originalId=key(originalSource.reference),id=key(reference);
  const prior=existing||{kind:WORK_ENGAGEMENT_KIND,version:2,ownerId:c.ownerId,businessId:c.businessId,customerId:c.customer.id,baseRevision:c.revision,profileStamp:stableJson(c.profile||null),primaryId:originalId,engagements:[{id:originalId,source:originalSource,evidence:'workspace-record',record:copy(c.action)}]};
  if(prior.engagements.length>=20||prior.engagements.some(e=>e.id===id||e.source.reference.inboxId===enquiryId))return null;
  const next={...copy(prior),engagements:[...copy(prior.engagements),{id,source:newSource,evidence:'session-proposal',reviewed:false,record:{type:'quote',task:'Prepare a private quote',origin:'manual',done:false,details:{quoteStatus:'Prepared',quoteAmount:'',plannedSentDate:'',message:prepared.text,enquiryReference:copy(reference)}}}]};
  return inspectWorkEngagementProposal(next,c)?next:null;
 }catch{return null;}
}
export function reviewWorkEngagementQuote(model,c,id,fields){
 if(!inspectWorkEngagementProposal(model,c))return null;
 const entries=model.engagements.filter(e=>e.id===id),entry=entries[0];
 const amount=fields?.amount,date=fields?.date,text=fields?.text;
 if(entries.length!==1||entry.evidence!=='session-proposal'||typeof amount!=='string'||!/^\d+(?:\.\d{1,2})?$/.test(amount)||!Number.isFinite(Number(amount))||typeof text!=='string'||!text.trim()||text.length>12000||typeof date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(date))return null;
 const parsed=new Date(date+'T12:00:00Z');if(!Number.isFinite(parsed.getTime())||parsed.toISOString().slice(0,10)!==date)return null;
 return {...copy(model),engagements:model.engagements.map(e=>e===entry?{...copy(e),reviewed:true,record:{...copy(e.record),details:{...copy(e.record.details),quoteAmount:amount,plannedSentDate:date,message:text}}}:copy(e))};
}
// Compatibility classifier only: legacy writers have NO v2 mutation authority.
// Actual hosted rejection still requires the existing deployed read/write fences.
export function legacyWorkWritePreservesEngagements(before,after){
 try{return !isWorkEngagementModel(before)||stableJson(before)===stableJson(after);}catch{return false;}
}
export function engagementRecordedStatus(entry){const a=entry?.record;if(!a)return 'Unsupported';return a.type==='quote'?a.details?.quoteStatus||'Not recorded':a.type==='booking'?a.details?.bookingStatus||'Not recorded':a.details?.reminderStatus||'Not recorded';}
