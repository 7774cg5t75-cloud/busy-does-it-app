// Finite wording for the original enquiry editor. Customer text is never executed or parsed as authority.
const clean=value=>typeof value==='string'&&value.length<=240&&!/[<>\u0000-\u001f]/.test(value)?value.trim():'';
export function prepareEnquiryReplyText({customer,item,businessId,approvedProfile,purpose='acknowledge'}={}){
 if(!customer?.id||customer.contactOk===false||item?.status!=='Filed'||item.filedCustomerId!==customer.id||[customer.businessId,customer.business_id].some(id=>id&&id!==businessId))return {ok:false};
 const questions={acknowledge:'I will review the details you supplied before getting back to you.',date:'Could you confirm the date or dates you would like us to consider?',group:'Could you confirm how many people the enquiry is for?',requirements:'Could you confirm the location and any access requirements you would like us to consider?'};
 if(!Object.hasOwn(questions,purpose))return {ok:false};
 const first=clean(customer.name)?.split(' ')[0]||'there',service=clean(item.parsed?.service)||clean(customer.service);
 const brand=approvedProfile?.fingerprint&&(!approvedProfile.businessId||approvedProfile.businessId===businessId)?clean(approvedProfile.businessName):'';
 return {ok:true,purpose,text:['Hi '+first+',',service?'Thank you for getting in touch about '+service+'.':'',questions[purpose],'We will need to review the details before confirming any price, availability or booking.',brand?brand:''].filter(Boolean).join('\n\n'),customerId:customer.id,inboxId:item.id,customerWordsNotInstructions:true,privateOnly:true,automaticallySends:false};
}
