import {decodeBusinessCache} from './businessCache.mjs';
import {stableJson} from './stableJson.mjs';
export const quoteCustomerSource=customer=>customer&&[customer.id,customer.name,customer.service,customer.businessId,customer.business_id];
// Read only the original scoped snapshot. No retry, cache, write or restore authority.
export async function readPrivateQuoteCopy({read,ownerId,businessId,revision,customer,record}){
 try{
  const cache=decodeBusinessCache(await read(),{ownerId,businessId});
  if(!cache||cache.revision!==revision||!customer?.id||record?.type!=='quote')return {status:'unknown'};
  const savedCustomer=(cache.payload.customers||[]).find(row=>row.id===customer.id)||(cache.payload.lastSimulatedRecipients||[]).find(row=>row.id===customer.id);
  if(!savedCustomer||[savedCustomer.businessId,savedCustomer.business_id].some(id=>id&&id!==businessId)||stableJson(quoteCustomerSource(savedCustomer))!==stableJson(quoteCustomerSource(customer)))return {status:'unknown'};
  const saved=cache.payload.replyActions?.[customer.id];
  return {status:saved&&stableJson(saved)===stableJson(record)?'confirmed':'unknown'};
 }catch{return {status:'unknown'};}
}

// Original quote-form values only; caller owns navigation, current scope and setters.
export function quoteFormFields({customer,saved,services=[],today}){
 const service=services.find(item=>item.name===customer.service);
 const fallbackAmount=Number(customer.lastJobValue)>0?customer.lastJobValue:service?.value||'';
 const amount=saved?.details?.quoteAmount??fallbackAmount;
 return {amount:String(amount||''),message:saved?.details?.message||`Hi ${customer.name.split(" ")[0]}, thanks for getting back to us. The quote for ${customer.service.toLowerCase()} is £${amount||"—"}. Let me know if you’d like to go ahead.`,
  date:saved?.details?.quoteSentAt?String(saved.details.quoteSentAt).slice(0,10):/^\d{4}-\d{2}-\d{2}$/.test(saved?.details?.plannedSentDate||'')?saved.details.plannedSentDate:today};
}
