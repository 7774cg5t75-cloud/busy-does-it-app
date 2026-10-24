import {decodeBusinessCache} from './businessCache.mjs';
import {stableJson} from './stableJson.mjs';
export const quoteCustomerSource=customer=>customer&&[customer.id,customer.name,customer.service,customer.businessId,customer.business_id];
// Read only the original scoped snapshot. No retry, cache, write or restore authority.
export async function readPrivateQuoteCopy({read,ownerId,businessId,revision,customer,record}){
 try{
  const cache=decodeBusinessCache(await read(),{ownerId,businessId});
  if(!cache||cache.revision!==revision||!customer?.id||record?.type!=='quote')return {status:'unknown'};
  const matches=[...(cache.payload.customers||[]),...(cache.payload.lastSimulatedRecipients||[])].filter(row=>row?.id===customer.id);
  if(matches.length!==1)return {status:'unknown'};
  const savedCustomer=matches[0];
  if(!savedCustomer||[savedCustomer.businessId,savedCustomer.business_id].some(id=>id&&id!==businessId)||stableJson(quoteCustomerSource(savedCustomer))!==stableJson(quoteCustomerSource(customer)))return {status:'unknown'};
  const saved=cache.payload.replyActions?.[customer.id];
  if(!saved||stableJson(saved)!==stableJson(record))return {status:'unknown'};
  const d=saved.details,date=d?.plannedSentDate,parsed=new Date(String(date)+'T12:00:00Z');
  const complete=d?.quoteStatus==='Prepared'&&['string','number'].includes(typeof d.quoteAmount)&&typeof d.message==='string'&&typeof date==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(date)&&Number.isFinite(parsed.getTime())&&parsed.toISOString().slice(0,10)===date;
  return {status:'confirmed',...(complete?{form:{amount:String(d.quoteAmount),message:d.message,date}}:{})};
 }catch{return {status:'unknown'};}
}

// Original quote-form values only; caller owns navigation, current scope and setters.
export function quoteFormFields({customer,saved,services=[],today}){
 const service=services.find(item=>item.name===customer.service);
 const fallbackAmount=Number(customer.lastJobValue)>0?customer.lastJobValue:service?.value||'';
 const amount=saved?.details?.quoteAmount??fallbackAmount;
 return {amount:String(amount??''),message:saved?.details?.message??`Hi ${customer.name.split(" ")[0]}, thanks for getting back to us. The quote for ${customer.service.toLowerCase()} is £${amount||"—"}. Let me know if you’d like to go ahead.`,
  date:saved?.details?.quoteSentAt?String(saved.details.quoteSentAt).slice(0,10):/^\d{4}-\d{2}-\d{2}$/.test(saved?.details?.plannedSentDate||'')?saved.details.plannedSentDate:today};
}
