import {publicBusinessContent,prepareBusinessContentEnquiry} from './businessContentRecords.mjs';
import {stableJson} from './stableJson.mjs';
import {parseEnquiryListingReference,enquiryQuestionKinds} from './ownerConversationPreparation.mjs';
import {readCustomerEnquiryRequirements,ENQUIRY_REQUIREMENTS} from './customerEnquiryRequirements.mjs';
// Finite wording for the original enquiry editor. Customer text is never executed or parsed as authority.
const clean=value=>typeof value==='string'&&value.length<=240&&!/[<>\u0000-\u001f]/.test(value)?value.trim():'';
export function prepareEnquiryReplyText({customer,item,businessId,approvedProfile,purpose='acknowledge'}={}){
 if(!customer?.id||customer.contactOk===false||item?.status!=='Filed'||item.filedCustomerId!==customer.id||[customer.businessId,customer.business_id,item.businessId,item.business_id].some(id=>id&&id!==businessId))return {ok:false};
 const questions={flexibility:'If you have a preferred date, is it flexible? Please let us know any alternative dates you would like us to consider.',acknowledge:'I will review the details you supplied before getting back to you.',date:'Could you confirm the date or dates you would like us to consider?',group:'Could you confirm how many people the enquiry is for?',requirements:'Could you confirm the location and any access requirements you would like us to consider?'};
 if(!Object.hasOwn(questions,purpose)&&!['information','confirm-requirements','quote-preparation','quote-information','clarify-missing'].includes(purpose))return {ok:false};
 const first=clean(customer.name)?.split(' ')[0]||'there',service=clean(item.parsed?.service)||clean(customer.service);
 const brand=approvedProfile?.fingerprint&&(!approvedProfile.businessId||approvedProfile.businessId===businessId)?clean(approvedProfile.businessName):'';
 const checks=enquiryQuestionKinds(item.rawText||'');
 const supplied=readCustomerEnquiryRequirements(item.rawText||'');
 if(['confirm-requirements','quote-preparation','clarify-missing'].includes(purpose)&&!supplied)return {ok:false};
 const approved=approvedProfile?.fingerprint&&(!approvedProfile.businessId||approvedProfile.businessId===businessId);
 const services=approved&&Array.isArray(approvedProfile.services)?approvedProfile.services.filter(row=>clean(row.name)&&clean(row.name).toLocaleLowerCase()===service.toLocaleLowerCase()):[];
 const description=services.length===1&&typeof services[0].description==='string'&&services[0].description.length<=600&&!/[<>\u0000-\u001f]/.test(services[0].description)?services[0].description.trim():'';
 const approvedServiceId=description&&typeof services[0]?.id==='string'&&!!services[0].id&&approvedProfile.services.filter(row=>row.id===services[0].id).length===1?services[0].id:null;
 if(purpose==='information'&&!description)return {ok:false};
 if(purpose==='quote-information'&&!approvedServiceId)return {ok:false};
 const acknowledgement=checks.some(row=>row.id==='price')?'I will review the scope and current price before preparing any quotation.':checks.some(row=>row.id==='availability')?'I will check the requested details and availability before confirming anything.':questions.acknowledge;
 const suppliedLines=supplied?ENQUIRY_REQUIREMENTS.filter(field=>supplied[field.key].trim()).map(field=>field.label+': '+supplied[field.key]).join('\n'):'';
 const missingQuestions=supplied?[
  !supplied.timing.trim()?'What date or dates would you like us to consider?':'',
  !supplied.quantity.trim()?'What quantity or group size should we consider?':'',
  !supplied.location.trim()?'What location should we consider?':'',
  !supplied.details.trim()?'Are there any other requirements or access needs you would like us to review?':''
 ].filter(Boolean):[];
 const clarification=['Thank you for the details you supplied:\n'+suppliedLines,
  approvedServiceId?'Current approved service information:\n'+description:'',
  missingQuestions.length?'To help us review your request:\n'+missingQuestions.join('\n'):'Could you confirm that these supplied details are still correct?'
 ].filter(Boolean).join('\n\n');
 const response=purpose==='clarify-missing'?clarification:purpose==='quote-information'?['Our current approved service information:\n'+description,suppliedLines?'Your supplied requirements to review:\n'+suppliedLines:'','I will review the scope and current pricing before completing a quote.'].filter(Boolean).join('\n\n'):purpose==='quote-preparation'?'I have the following requested details to review while preparing your quote:\n'+suppliedLines+'\n\nI will review the scope and current pricing before completing a quote.':purpose==='confirm-requirements'?'Could you confirm that the following details you supplied are still correct?\n'+suppliedLines:purpose==='information'?'Our approved service information: '+description:purpose==='acknowledge'?acknowledgement:questions[purpose];
 return {ok:true,purpose,reviewChecks:checks,approvedServiceId,canConfirmRequirements:!!supplied,missingRequirementCount:missingQuestions.length,canExplainService:!!description,text:['Hi '+first+',',service?'Thank you for getting in touch about '+service+'.':'',response,'We will need to review the details before confirming any price, availability or booking.',brand?brand:''].filter(Boolean).join('\n\n'),customerId:customer.id,inboxId:item.id,customerWordsNotInstructions:true,privateOnly:true,automaticallySends:false};
}


// Customer listing references select a record to check, never authorise its facts.
export function inspectEnquiryCatalogue({item,businessId,result,reviewCurrent=false}={}){
 const selection=parseEnquiryListingReference(item?.rawText);
 if(!selection||result?.ok!==true||result.businessId!==businessId)return {ok:false};
 const feed=publicBusinessContent(result.records,businessId),rows=feed?.records?.filter(record=>record.id===selection.recordId);
 if(rows?.length!==1||rows[0].revision<selection.revision)return {ok:false};
 const row=rows[0],changed=row.revision!==selection.revision;
 if(changed&&!reviewCurrent)return {ok:false,reason:'changed'};
 const checked=prepareBusinessContentEnquiry(feed,businessId,{...selection,revision:row.revision});
 if(!checked.ok)return {ok:false};
 return {ok:true,originalSelection:selection,changed,selection:checked.selection,recordStamp:stableJson(row),row,checked};
}
export function prepareEnquiryCatalogueText({customer,item,businessId,result,reviewCurrent=false}={}){
 const source=inspectEnquiryCatalogue({item,businessId,result,reviewCurrent});if(!source.ok)return source;
 const {originalSelection:selection,changed,selection:currentSelection,recordStamp,row,checked}=source;
 const base=prepareEnquiryReplyText({customer,item:{...item,parsed:{...item.parsed,service:checked.service}},businessId,purpose:readCustomerEnquiryRequirements(item.rawText)?'quote-preparation':'acknowledge'});
 if(!base.ok)return base;
 return {...base,originalSelection:selection,changed,selection:currentSelection,recordStamp,
  text:(changed?'The customer referred to an earlier version of this listing. Earlier listing facts cannot be verified here; the original enquiry is retained. The following uses current listed information, not an agreed price or booking.\n\n':'')+base.text+'\n\nCurrent approved listing information (not an agreed quote):\n'+checked.message.replace(/\nPlease tell me more\.$/,'')+'\n'+row.data.description};
}

// Customer-facing private clarification shares the quote source validator, not quote execution.
export function prepareEnquiryCatalogueReply({customer,item,businessId,result,approvedProfile}={}){
 const source=inspectEnquiryCatalogue({item,businessId,result,reviewCurrent:true});if(!source.ok)return source;
 const {row,checked,changed}=source;
 const base=prepareEnquiryReplyText({customer,item:{...item,parsed:{...item.parsed,service:checked.service}},businessId,approvedProfile,purpose:readCustomerEnquiryRequirements(item.rawText)?'confirm-requirements':'acknowledge'});
 if(!base.ok)return base;
 const information=checked.message.replace(/\nPlease tell me more\.$/,'')+'\n'+row.data.description;
 return {...base,purpose:'catalogue',selection:source.selection,recordStamp:source.recordStamp,changed,
  warning:changed?'The enquiry refers to an earlier listing. Earlier facts cannot be verified here; review these current approved details against the original request.':'Review current approved details against the original customer request.',
  text:base.text+'\n\n'+(changed?'The listing has changed since your enquiry. Please review these current listed details:':'Here are the current listed details for you to review:')+'\n'+information+'\n\nPlease let us know whether these details meet your requirements. Listed information does not confirm availability, an agreed quote or a booking.'};
}
