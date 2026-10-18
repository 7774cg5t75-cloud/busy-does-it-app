import {prepareBusinessContentEnquiry} from './businessContentRecords.mjs';
// Customer-supplied preparation only. Uses the original enquiry message contract,
// receipt/idempotency and owner inbox. No schema, availability or price authority.
const ENQUIRY_REQUIREMENTS=Object.freeze([
 {key:'topic',label:'What would you like to know?',max:120},
 {key:'quantity',label:'Quantity or group size (optional)',max:80},
 {key:'timing',label:'Preferred timing (optional, not confirmed)',max:160},
 {key:'location',label:'Location or delivery area (optional)',max:160},
 {key:'details',label:'Requirements or access needs (optional)',max:400}
]);
const emptyEnquiryRequirements=()=>Object.fromEntries(ENQUIRY_REQUIREMENTS.map(f=>[f.key,'']));
function validEnquiryRequirements(value){
 return !!value&&typeof value==='object'&&!Array.isArray(value)&&Object.keys(value).length===ENQUIRY_REQUIREMENTS.length&&ENQUIRY_REQUIREMENTS.every(f=>typeof value[f.key]==='string'&&value[f.key].length<=f.max&&!/[<>\u0000-\u001f\u007f]/.test(value[f.key]));
}
function prepareCustomerEnquiry({message='',requirements=emptyEnquiryRequirements(),feed,businessId,selection=null}={}){
 const fail=reason=>({ok:false,reason});
 if(typeof message!=='string'||!validEnquiryRequirements(requirements))return fail('Review the short requirement fields before sending.');
 let body=message.trim(),context='';
 if(selection){
  const checked=prepareBusinessContentEnquiry(feed,businessId,selection);if(!checked.ok)return checked;
  if(body===checked.message&&!ENQUIRY_REQUIREMENTS.some(f=>requirements[f.key].trim()))return {ok:true,message:checked.message,customerSupplied:true,transactionConfirmed:false};
  context=checked.message.replace(/\nPlease tell me more\.$/,'');
  if(body===checked.message)body='';else if(body.startsWith(context+'\n'))body=body.slice(context.length).trim();
 }
 const lines=ENQUIRY_REQUIREMENTS.filter(f=>requirements[f.key].trim()).map(f=>f.label+': '+requirements[f.key].trim());
 const text=[context,body,lines.length?'Customer-supplied requirements (not confirmed):\n'+lines.join('\n'):''].filter(Boolean).join('\n\n');
 if(!text)return fail('Write a question or add what you need before sending.');
 if(text.length>3000)return fail('The combined enquiry and selected item exceed 3,000 characters. Shorten your message or requirements; nothing was sent.');
 return {ok:true,message:text,customerSupplied:true,transactionConfirmed:false};
}
export {ENQUIRY_REQUIREMENTS,emptyEnquiryRequirements,validEnquiryRequirements,prepareCustomerEnquiry};

// Ephemeral review only; payload must come from the original request validator.
// No persistence, send authority, idempotency key or new backend schema.
function customerEnquiryReview(payload,scope,sourceStamp,type="enquiry"){
 if(!payload||typeof scope!=='string'||!scope||typeof sourceStamp!=='string')return null;
 if(!['enquiry','booking_request'].includes(type))return null;
 const fields=type==='booking_request'?['name','email','phone','service','preferredDate','note']:['name','email','phone','service','message'];
 if(fields.some(key=>typeof payload[key]!=='string'))return null;
 const exact=Object.fromEntries(fields.map(key=>[key,payload[key]]));
 return {payload:exact,key:JSON.stringify([type,scope,sourceStamp,exact])};
}
export {customerEnquiryReview};
