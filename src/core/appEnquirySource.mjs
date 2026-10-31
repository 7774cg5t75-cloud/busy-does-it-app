import {validatePrivateAppServices} from './appServiceCollection.mjs';
import {privateAppEditSource} from './privateAppEditSession.mjs';
import {supportedAppCatalogModule} from './appCatalogSupport.mjs';
import {prepareBusinessContentEnquiry} from './businessContentRecords.mjs';
import {reviewApprovedBuilderRecords} from './approvedBuilderRecords.mjs';
import {parseEnquiryListingReference,customerQuestionText} from './ownerConversationPreparation.mjs';
import {emptyEnquiryRequirements,prepareCustomerEnquiry,readCustomerEnquiryRequirements} from './customerEnquiryRequirements.mjs';
import {validateNativeGuestRequest} from '../../standalone/template/nativeCustomerActions.mjs';
const uuid=/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const no=reason=>({ok:false,reason,maySend:false});
const servicePattern=/^Service reference: ([A-Za-z0-9_-]{1,80}) \/ app draft revision ([1-9]\d{0,9})\.$/gm;
export function filedAppEnquirySource(item,businessId){
 const origin=item?.miniAppOrigin;
 if(!origin||typeof item.rawText!=='string'||!['requestId','appId'].every(k=>typeof origin[k]==='string'&&uuid.test(origin[k]))||typeof origin.requestHash!=='string'||!/^[0-9a-f]{64}$/i.test(origin.requestHash))return null;
 return {businessId,appId:origin.appId,requestId:origin.requestId,requestHash:origin.requestHash,message:item.rawText};
}
// Original message references are customer assertions, never authorisation or
// proof of submission-time facts. Do not parse names/prices from free text.
export function appEnquiryReference(message){
 if(typeof message!=='string'||message.length>3000)return null;
 const listing=parseEnquiryListingReference(message),services=[...message.matchAll(servicePattern)];
 if(listing&&!services.length&&!message.includes('Service reference:'))return {kind:'listing',...listing};
 if(!message.includes('Listing reference:')&&services.length===1&&message.split('Service reference:').length===2)return {kind:'service',serviceId:services[0][1],appRevision:Number(services[0][2])};
 return null;
}
export function prepareContextualAppEnquiry({businessId,app,catalog,feed,selection,customer,requirements=emptyEnquiryRequirements()}={}){
 const source=privateAppEditSource({businessId,app});
 if(!source||!Array.isArray(app.draft_config.modules)||!supportedAppCatalogModule(catalog,'enquiry')||!app.draft_config.modules.some(m=>m.key==='enquiry'&&m.enabled===true)||!customer||Object.keys(customer).some(k=>!['name','email','phone','message'].includes(k)))return no('Open the current supported private enquiry experience.');
 let service='',message=customer.message;
 if(selection?.kind==='listing'){
  if(Object.keys(selection).some(k=>!['kind','recordId','revision','variantId'].includes(k))||!reviewApprovedBuilderRecords(feed,businessId).ok)return no('Refresh the approved listing before preparing its enquiry.');
  const checked=prepareBusinessContentEnquiry(feed,businessId,selection);if(!checked.ok)return no(checked.reason);
  service=checked.service;const composed=prepareCustomerEnquiry({message,requirements,feed,businessId,selection});if(!composed.ok)return composed;message=composed.message;
 }else if(selection?.kind==='service'){
  if(Object.keys(selection).some(k=>!['kind','serviceId','appRevision'].includes(k))||selection.appRevision!==source.revision)return no('The selected service revision changed. Your words are kept.');
  const rows=app.draft_config.publicProfile?.services?.filter(r=>r.id===selection.serviceId)||[];
  if(!validatePrivateAppServices(app.draft_config.publicProfile?.services||[]).ok||rows.length!==1||typeof rows[0].name!=='string'||!/^[A-Za-z0-9_-]{1,80}$/.test(selection.serviceId)||!app.draft_config.modules.some(m=>m.key==='services'&&m.enabled===true))return no('Choose the exact current service again.');
  service=rows[0].name;const composed=prepareCustomerEnquiry({message,requirements});if(!composed.ok)return composed;
  message='Service reference: '+selection.serviceId+' / app draft revision '+source.revision+'.\n\n'+composed.message;
 }else return no('Choose an exact product, event or service before reviewing.');
 const checked=validateNativeGuestRequest('enquiry',{name:customer.name,email:customer.email,phone:customer.phone,service,message});
 return checked.ok&&appEnquiryReference(checked.payload.message)?{ok:true,payload:checked.payload,reference:appEnquiryReference(checked.payload.message),appId:app.id,businessId,sourceRevision:source.revision,privatePreparation:true,customerSupplied:true,maySend:false,submissionVerified:false}:no(checked.reason||'The exact source and customer wording exceed the supported reference format. Shorten the message; your words are kept.');
}
export function resolveAppEnquirySource({source,app,feed}={}){
 const reference=appEnquiryReference(source?.message),scope=privateAppEditSource({businessId:source?.businessId,app});
 const unavailable=reason=>({ok:false,reference,subject:reference?'Referenced item needs review':'General enquiry',reason,maySend:false});
 if(!scope||source.appId!==app.id)return unavailable('The original request and current app scope do not match.');
 if(!reference)return unavailable('No single exact source reference was retained. Names or prices cannot establish identity.');
 let facts;
 if(reference.kind==='listing'){
  if(!reviewApprovedBuilderRecords(feed,source.businessId).ok)return unavailable('Load current approved records.');
  const checked=prepareBusinessContentEnquiry(feed,source.businessId,reference);if(!checked.ok)return unavailable(checked.reason);
  const row=feed.records.find(r=>r.id===reference.recordId),variant=reference.variantId?row.data.variants?.find(v=>v.id===reference.variantId):null;
  facts={kind:row.kind,id:row.id,revision:row.revision,name:row.data.name,...row.kind==='product'?{amountMinor:variant?.amountMinor??row.data.amountMinor,currency:row.data.currency,...variant?{optionId:variant.id,optionLabel:variant.label}:{}}:{startsAt:row.data.startsAt,endsAt:row.data.endsAt,timeZone:row.data.timeZone,location:row.data.location}};
 }else{
  const rows=app.draft_config.publicProfile?.services?.filter(r=>r.id===reference.serviceId)||[];
  if(!validatePrivateAppServices(app.draft_config.publicProfile?.services||[]).ok||reference.appRevision!==scope.revision||rows.length!==1)return unavailable('The referenced private service version changed or is unavailable.');
  facts={kind:'service',id:rows[0].id,revision:scope.revision,name:rows[0].name,description:rows[0].description};
 }
 return {ok:true,reference,facts,subject:'Enquiry about '+facts.name,businessId:source.businessId,appId:source.appId,requestId:source.requestId||null,requestHash:source.requestHash||null,customerWords:reference.kind==='listing'?customerQuestionText(source.message):source.message.replace(servicePattern,'').trim(),requirements:readCustomerEnquiryRequirements(source.message),evidence:'Customer-supplied reference matched current authorised information; submission-time display and customer identity are not verified.',maySend:false,mayCreateWork:false,submissionVerified:false};
}

// Match only an already loaded original filed item to the exact canonical
// projection. No app ID inference from a name or current selected application.
export function canonicalAppEnquirySource(source,inboxItems,businessId){
 const e=source?.enquiry,c=source?.customer;
 if(!e||!c||!Array.isArray(inboxItems))return null;
 const rows=inboxItems.filter(r=>r.id===e.id&&r.status==='Filed'&&r.filedCustomerId===c.id&&r.rawText===e.rawText&&r.reviewedAt===e.reviewedAt);
 return rows.length===1?filedAppEnquirySource(rows[0],businessId):null;
}
