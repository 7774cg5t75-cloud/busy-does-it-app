import {parseEnquiryListingReference} from './ownerConversationPreparation.mjs';
import {stableJson} from './stableJson.mjs';
// Private preparation evidence in the original reply record, not current-source authority.
export function privateReplyCatalogueProvenance({businessId,item,prepared}={}){
 try{
  const original=parseEnquiryListingReference(item?.rawText),selected=prepared?.selection;
  if(!businessId||prepared?.businessId&&prepared.businessId!==businessId||!original||!selected||selected.recordId!==original.recordId||(selected.variantId||'')!==(original.variantId||'')||!Number.isSafeInteger(selected.revision)||selected.revision<original.revision||typeof prepared.recordStamp!=='string'||prepared.recordStamp.length>20000)return null;
  const row=JSON.parse(prepared.recordStamp);
  if(row.id!==selected.recordId||row.revision!==selected.revision||!['product','event'].includes(row.kind)||typeof row.data?.name!=='string'||!row.data.name.trim()||selected.variantId&&row.data.variants?.filter(x=>x.id===selected.variantId).length!==1)return null;
  return {version:1,kind:'owner-reviewed-catalogue-preparation',businessId,originalSelection:original,selection:{recordId:selected.recordId,revision:selected.revision,...selected.variantId?{variantId:selected.variantId}:{}},recordStamp:stableJson(row),currentApproval:false,wordingIndependentlyVerified:false};
 }catch{return null;}
}
export function privateReplySourceReview({businessId,item,provenance}={}){
 const checked=privateReplyCatalogueProvenance({businessId,item,prepared:provenance});
 if(!checked)return provenance?'Saved source evidence could not be matched. Keep your wording and review the original enquiry and current item.':'This is private owner wording. No retained catalogue preparation evidence is available; check current item information before reusing facts.';
 const row=JSON.parse(checked.recordStamp),variant=checked.selection.variantId?row.data.variants?.find(x=>x.id===checked.selection.variantId)?.label:'';
 return [row.data.name,variant,'This reply retains an earlier owner-reviewed preparation. Customer requirements remain customer-supplied; saved wording remains owner wording. Retained evidence is not approval of current item facts. Recheck before reusing this wording.'].filter(Boolean).join(' · ');
}


// A retained private copy is attribution, not immutable historical evidence.
export function privateReplySavedSourceSummary({ownerId,businessId,customer,record}={}){
 try{
  if(!record||record.ownerId!==ownerId||record.businessId!==businessId||record.customerId!==customer?.id||record.reference?.customerId!==customer.id||record.reference.businessId!==businessId)return null;
  const source=JSON.parse(record.sourceStamp),saved=source?.[1];
  if(!Array.isArray(source)||source.length!==2||source[0]?.id!==customer.id||saved?.id!==record.reference.inboxId||saved.filedCustomerId!==customer.id||saved.status!=='Filed'||[saved.businessId,saved.business_id].some(id=>id&&id!==businessId)||typeof saved.rawText!=='string'||saved.rawText.length>15000)return null;
  return {text:saved.rawText,notice:'Earlier private customer-message copy; not independently authenticated history. Your saved reply is owner wording. Review the currently recorded enquiry and approved facts separately.'};
 }catch{return null;}
}
export function privateReplyCatalogueChanges({businessId,item,provenance,current}={}){
 const prior=privateReplyCatalogueProvenance({businessId,item,prepared:provenance}),next=privateReplyCatalogueProvenance({businessId,item,prepared:current});
 if(!prior||!next)return 'No comparable retained preparation evidence. Review current approved information; earlier listing facts cannot be verified here.';
 const a=JSON.parse(prior.recordStamp),b=JSON.parse(next.recordStamp),fields={name:'name',description:'description',amountMinor:'informational price',currency:'price currency',startsAt:'event date',endsAt:'event end',location:'venue',variants:'options'};
 const differences=Object.entries(fields).filter(([key])=>stableJson(a.data[key]??null)!==stableJson(b.data[key]??null)).map(([,label])=>label);
 return (differences.length?'Current approved information differs from retained private preparation: '+differences.join(', ')+'.':'The compared fields match the retained private preparation.')+' This comparison is not authenticated historical evidence or approval of your saved wording.';
}
