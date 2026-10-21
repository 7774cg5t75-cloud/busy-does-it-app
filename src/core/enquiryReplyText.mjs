import {enquiryQuestionKinds} from './ownerConversationPreparation.mjs';
import {readCustomerEnquiryRequirements,ENQUIRY_REQUIREMENTS} from './customerEnquiryRequirements.mjs';
// Finite wording for the original enquiry editor. Customer text is never executed or parsed as authority.
const clean=value=>typeof value==='string'&&value.length<=240&&!/[<>\u0000-\u001f]/.test(value)?value.trim():'';
export function prepareEnquiryReplyText({customer,item,businessId,approvedProfile,purpose='acknowledge'}={}){
 if(!customer?.id||customer.contactOk===false||item?.status!=='Filed'||item.filedCustomerId!==customer.id||[customer.businessId,customer.business_id,item.businessId,item.business_id].some(id=>id&&id!==businessId))return {ok:false};
 const questions={flexibility:'If you have a preferred date, is it flexible? Please let us know any alternative dates you would like us to consider.',acknowledge:'I will review the details you supplied before getting back to you.',date:'Could you confirm the date or dates you would like us to consider?',group:'Could you confirm how many people the enquiry is for?',requirements:'Could you confirm the location and any access requirements you would like us to consider?'};
 if(!Object.hasOwn(questions,purpose)&&!['information','confirm-requirements','quote-preparation'].includes(purpose))return {ok:false};
 const first=clean(customer.name)?.split(' ')[0]||'there',service=clean(item.parsed?.service)||clean(customer.service);
 const brand=approvedProfile?.fingerprint&&(!approvedProfile.businessId||approvedProfile.businessId===businessId)?clean(approvedProfile.businessName):'';
 const checks=enquiryQuestionKinds(item.rawText||'');
 const supplied=readCustomerEnquiryRequirements(item.rawText||'');
 if(['confirm-requirements','quote-preparation'].includes(purpose)&&!supplied)return {ok:false};
 const approved=approvedProfile?.fingerprint&&(!approvedProfile.businessId||approvedProfile.businessId===businessId);
 const services=approved&&Array.isArray(approvedProfile.services)?approvedProfile.services.filter(row=>clean(row.name)&&clean(row.name).toLocaleLowerCase()===service.toLocaleLowerCase()):[];
 const description=services.length===1&&typeof services[0].description==='string'&&services[0].description.length<=600&&!/[<>\u0000-\u001f]/.test(services[0].description)?services[0].description.trim():'';
 if(purpose==='information'&&!description)return {ok:false};
 const acknowledgement=checks.some(row=>row.id==='price')?'I will review the scope and current price before preparing any quotation.':checks.some(row=>row.id==='availability')?'I will check the requested details and availability before confirming anything.':questions.acknowledge;
 const suppliedLines=supplied?ENQUIRY_REQUIREMENTS.filter(field=>supplied[field.key].trim()).map(field=>field.label+': '+supplied[field.key]).join('\n'):'';
 const response=purpose==='quote-preparation'?'I have the following requested details to review while preparing your quote:\n'+suppliedLines+'\n\nI will review the scope and current pricing before completing a quote.':purpose==='confirm-requirements'?'Could you confirm that the following details you supplied are still correct?\n'+suppliedLines:purpose==='information'?'Our approved service information: '+description:purpose==='acknowledge'?acknowledgement:questions[purpose];
 return {ok:true,purpose,reviewChecks:checks,canConfirmRequirements:!!supplied,canExplainService:!!description,text:['Hi '+first+',',service?'Thank you for getting in touch about '+service+'.':'',response,'We will need to review the details before confirming any price, availability or booking.',brand?brand:''].filter(Boolean).join('\n\n'),customerId:customer.id,inboxId:item.id,customerWordsNotInstructions:true,privateOnly:true,automaticallySends:false};
}
