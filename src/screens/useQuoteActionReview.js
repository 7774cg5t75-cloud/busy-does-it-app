import React from 'react';
import {Alert} from 'react-native';
import {parseEnquiryListingReference} from '../core/ownerConversationPreparation.mjs';
import {prepareEnquiryReplyText,prepareEnquiryCatalogueText,prepareQuoteEnquiryAddition} from '../core/enquiryReplyText.mjs';
import {stableJson} from '../core/stableJson.mjs';
import {quoteCustomerSource as customerSource} from '../core/privateQuoteCopy.mjs';
import {useOwnerEditNavigation} from './useOwnerEditNavigation';
const fields=['actionQuoteAmount','actionQuoteMessage','actionQuoteSentDate'];
const values=s=>fields.map(key=>String(s[key]??''));
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
function recordValues(action,fallback){
 const details=action?.details||{};
 return [String(details.quoteAmount??fallback[0]),String(details.message??fallback[1]),details.quoteSentAt?String(details.quoteSentAt).slice(0,10):details.plannedSentDate||fallback[2]];
}
// Volatile input/receipt metadata only. Original parent fields and reply actions own the data.
export function useQuoteActionReview(s){
 const live=React.useRef(s),epoch=React.useRef(0),dirty=React.useRef(false),pending=React.useRef(null);live.current=s;
 const mounted=React.useRef(true);React.useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;pending.current=null;};},[]);
 const view=s.screen??s.view,role=s.cloudWorkspace?.role,revision=s.cloudRevision;
 const engagementId=s.quoteEngagementId||null,editorSession=s.quoteEditorSession||null;
 const scope=s.ownerWorkspaceScope,customer=s.selectedReplyCustomer,action=customer?s.replyActions?.[customer.id]:null;
 const customerStamp=JSON.stringify(customerSource(customer)),stamp=JSON.stringify(action),renderEpoch=epoch.current,renderValues=values(s);
 const baseline=React.useRef({scope,engagementId,editorSession,customerId:customer?.id,action,stamp,values:renderValues});
 if(baseline.current.scope!==scope||baseline.current.customerId!==customer?.id||baseline.current.engagementId!==engagementId||baseline.current.editorSession!==editorSession){baseline.current={scope,engagementId,editorSession,customerId:customer?.id,action,stamp,values:renderValues};dirty.current=false;pending.current=null;}
 const current=()=>mounted.current&&!!scope&&!!s.ownerSession?.userId&&!!s.cloudWorkspace?.businessId&&
  ['owner','admin'].includes(role)&&live.current.cloudWorkspace?.role===role&&(live.current.quoteEngagementId||null)===engagementId&&(live.current.quoteEditorSession||null)===editorSession&&(live.current.screen??live.current.view)===view&&live.current.cloudRevision===revision&&
  ![customer?.businessId,customer?.business_id].some(id=>id&&id!==s.cloudWorkspace?.businessId)&&
  JSON.stringify(customerSource(customer))===customerStamp&&live.current.ownerWorkspaceScope===scope&&
  live.current.ownerSession?.userId===s.ownerSession?.userId&&live.current.cloudWorkspace?.businessId===s.cloudWorkspace?.businessId&&
  live.current.selectedReplyCustomer===customer&&live.current.replyActions?.[customer?.id]===action&&JSON.stringify(action)===stamp;
 const acknowledged=pending.current&&pending.current.scope===scope&&pending.current.customerId===customer?.id&&
  pending.current.customerStamp===customerStamp&&action!==pending.current.action&&JSON.stringify(action?.details)===pending.current.details;
 const changed=baseline.current.action!==action||baseline.current.stamp!==stamp;
 if(changed&&!pending.current&&!dirty.current&&same(renderValues,recordValues(action,baseline.current.values)))baseline.current={scope,engagementId,editorSession,customerId:customer?.id,action,stamp,values:renderValues};
 const conflict=(baseline.current.action!==action||baseline.current.stamp!==stamp)&&!acknowledged;
 const report=useOwnerEditNavigation(s,{source:action,projectId:'quote:'+customer?.id+(engagementId?':'+engagementId:''),revision:stamp},()=>{
  if(!current())return false;
  const restored=recordValues(action,baseline.current.values);
  fields.forEach((field,index)=>s['set'+field[0].toUpperCase()+field.slice(1)]?.(restored[index]));
  epoch.current++;dirty.current=false;pending.current=null;
  baseline.current={scope,engagementId,editorSession,customerId:customer?.id,action,stamp,values:restored};return true;
 });
 const edit=(field,value)=>{
  if(!current()||conflict||action?.type!=='quote'||!fields.includes(field)||typeof value!=='string')return false;
  epoch.current++;live.current={...live.current,[field]:value};
  dirty.current=!same(values(live.current),baseline.current.values);report(dirty.current);
  s['set'+field[0].toUpperCase()+field.slice(1)]?.(value);return true;
 };
 const date=String(s.actionQuoteSentDate||''),parsed=new Date(date+'T12:00:00Z');
 const validDate=/^\d{4}-\d{2}-\d{2}$/.test(date)&&Number.isFinite(parsed.getTime())&&parsed.toISOString().slice(0,10)===date;
 const commit=(operation,details)=>{
  if(!validDate||!current()||conflict||pending.current||action?.type!=='quote'||epoch.current!==renderEpoch||!same(values(live.current),renderValues))return false;
  const receipt={scope,customerId:customer.id,customerStamp,action,details:JSON.stringify(details),values:renderValues,epoch:++epoch.current};pending.current=receipt;
  const result=report.commit(operation);
  if(result===false&&pending.current===receipt){pending.current=null;if(epoch.current===receipt.epoch)epoch.current=renderEpoch;return false;}
  return true; // A request was prepared, not a device/cloud save acknowledgement.
 };
 React.useEffect(()=>{
  const receipt=pending.current;
  if(!receipt||!acknowledged||!current())return;
  pending.current=null;baseline.current={scope,engagementId,editorSession,customerId:customer.id,action,stamp,values:receipt.values};
  if(epoch.current===receipt.epoch&&same(values(live.current),receipt.values)){
   dirty.current=false;report(false);s.back?.();
  }else{dirty.current=true;report(true);}
 },[action,stamp,scope,customerStamp,...renderValues]);
 const transition=operation=>{
  const isCurrent=()=>current()&&!conflict&&!pending.current&&epoch.current===renderEpoch;
  if(!isCurrent()||typeof s.requestOwnerEditTransition!=='function')return false;
  return s.requestOwnerEditTransition(operation,{isCurrent});
 };
 const prepareEnquiry=(item,purpose='quote-preparation')=>{
  if(!item||typeof item!=='object')return false;
  if(!['quote-preparation','quote-information','quote-add-details'].includes(purpose))return false;
  const profile=live.current.businessCreationIntelligence?.sharedProfile,revision=live.current.cloudRevision;
  const itemStamp=stableJson(item),profileStamp=stableJson(profile||null);
  const sourceCurrent=()=>current()&&!conflict&&!pending.current&&action?.type==='quote'&&(!action.details?.quoteStatus||action.details.quoteStatus==='Prepared')&&customer.contactOk!==false&&live.current.cloudRevision===revision&&Number.isSafeInteger(revision)&&live.current.quoteEnquiryOriginItem===item&&live.current.inboxItems?.filter(row=>row.id===item?.id).length===1&&live.current.inboxItems.includes(item)&&live.current.customers?.filter(row=>row.id===customer.id).length===1&&live.current.customers.includes(customer)&&stableJson(item)===itemStamp&&stableJson(live.current.businessCreationIntelligence?.sharedProfile||null)===profileStamp;
  if(epoch.current!==renderEpoch||!sourceCurrent())return false;
  const prepared=purpose==='quote-add-details'?prepareQuoteEnquiryAddition({customer,item,businessId:s.cloudWorkspace.businessId,wording:values(live.current)[1]}):prepareEnquiryReplyText({customer,item,businessId:s.cloudWorkspace.businessId,approvedProfile:profile,purpose});
  if(!prepared.ok){if(purpose==='quote-add-details')Alert.alert('Keep your current wording',prepared.reason);return false;}
  let used=false;
  const typing=epoch.current,wording=values(live.current);
  Alert.alert(purpose==='quote-add-details'?'Add these supplied details?':'Use these enquiry details?',(purpose==='quote-add-details'?'Current wording:\n'+wording[1]+'\n\nProposed wording:\n':'')+prepared.text+'\n\nThis changes only your private wording. Your amount and date stay unchanged. Nothing is saved or sent.',[
   {text:'Keep my wording',style:'cancel',onPress:()=>{used=true;}},
   {text:'Use these requirements',onPress:()=>{if(used||!sourceCurrent()||epoch.current!==typing||!same(values(live.current),wording))return false;used=true;return edit('actionQuoteMessage',prepared.text);}},
  ]);
  return true;
 };
 const prepareCatalogue=async(item)=>{
  const start=live.current,revision=start.cloudRevision,typing=epoch.current,wording=values(start),itemStamp=stableJson(item||null);
  const sourceCurrent=()=>current()&&!conflict&&!pending.current&&action?.type==='quote'&&(!action.details?.quoteStatus||action.details.quoteStatus==='Prepared')&&customer.contactOk!==false&&live.current.cloudRevision===revision&&Number.isSafeInteger(revision)&&epoch.current===typing&&same(values(live.current),wording)&&live.current.quoteEnquiryOriginItem===item&&live.current.inboxItems?.includes(item)&&live.current.inboxItems.filter(row=>row?.id===item?.id).length===1&&live.current.customers?.includes(customer)&&live.current.customers.filter(row=>row?.id===customer.id).length===1&&stableJson(item||null)===itemStamp;
  if(epoch.current!==renderEpoch||!sourceCurrent()||!parseEnquiryListingReference(item?.rawText)||typeof start.businessContentRequest!=='function')return false;
  const read=async()=>prepareEnquiryCatalogueText({customer,item,businessId:s.cloudWorkspace.businessId,reviewCurrent:true,result:await live.current.businessContentRequest('content_list')});
  try{
   const prepared=await read();if(!sourceCurrent())return false;
   if(!prepared.ok){Alert.alert('Review the selected item','The enquiry’s selected item or option changed, expired or could not be checked. Your wording, amount and date are kept.');return false;}
   let used=false;
   Alert.alert(prepared.changed?'Review the changed listing':'Use this approved item?',prepared.text+'\n\nReview the listed information and customer requests. Your amount and date stay unchanged. Nothing is saved or sent.',[
    {text:'Keep my wording',style:'cancel',onPress:()=>{used=true;}},
    {text:prepared.changed?'Use reviewed current information':'Use this item information',onPress:async()=>{
     if(used||!sourceCurrent())return false;used=true;
     try{const checked=await read();if(!sourceCurrent()||!checked.ok||checked.recordStamp!==prepared.recordStamp||stableJson(checked.selection)!==stableJson(prepared.selection))return false;return edit('actionQuoteMessage',checked.text);}catch{return false;}
    }},
   ]);return true;
  }catch{if(sourceCurrent())Alert.alert('Could not check this item','Keep your current wording. No preparation was accepted or saved.');return false;}
 };
 const reviewDeviceCopy=async()=>{
  const typing=epoch.current,wording=values(live.current);
  const valid=()=>current()&&!conflict&&!pending.current&&action?.details?.quoteStatus==='Prepared'&&epoch.current===typing&&same(values(live.current),wording);
  if(!valid()||typeof s.checkPrivateQuoteCopy!=='function')return false;
  try{const checked=await s.checkPrivateQuoteCopy({isCurrent:valid,review:true});if(!valid())return false;
   if(checked?.status!=='confirmed'||!checked.form){Alert.alert('Keep your current quote','A complete matching prepared quote was not verified in this device copy. Your fields stay unchanged. No account save or delivery was confirmed.');return false;}
   const form=checked.form;let used=false;
   const use=async wordingOnly=>{
    if(used||!valid())return false;used=true;
    try{const fresh=await s.checkPrivateQuoteCopy({isCurrent:valid,review:true});
     if(!valid()||fresh?.status!=='confirmed'||stableJson(fresh.form)!==stableJson(form))return false;
     if(!wordingOnly)edit('actionQuoteAmount',form.amount);
     edit('actionQuoteMessage',form.message);
     if(!wordingOnly)edit('actionQuoteSentDate',form.date);return true;
    }catch{if(valid())Alert.alert('Device quote could not be checked','Your fields are kept. No save was retried.');return false;}
   };
   Alert.alert('Review checked device quote','Current amount: '+wording[0]+' · date: '+wording[2]+'\nCurrent wording:\n'+wording[1]+'\n\nDevice amount: '+form.amount+' · date: '+form.date+'\nDevice wording:\n'+form.message+'\n\nChoose wording only to keep your edited amount and date, or all checked fields. Another read is required. This does not save, send or confirm an account operation.',[
    {text:'Keep editing',style:'cancel',onPress:()=>{used=true;}},
    {text:'Use checked wording only',onPress:()=>use(true)},
    {text:'Use checked device fields',onPress:()=>use(false)}
   ]);return true;
  }catch{if(valid())Alert.alert('Device quote could not be checked','Your current words, amount and date are kept. Nothing was retried.');return false;}
 };
 const enquiryInformation=current()&&s.quoteEnquiryOriginItem?prepareEnquiryReplyText({customer,item:s.quoteEnquiryOriginItem,businessId:s.cloudWorkspace.businessId,approvedProfile:s.businessCreationIntelligence?.sharedProfile,purpose:'quote-information'}):null;
 return {edit,commit,transition,reviewDeviceCopy,prepareEnquiry,appendEnquiry:item=>prepareEnquiry(item,'quote-add-details'),prepareCatalogue,canExplainService:enquiryInformation?.ok===true,checkDeviceCopy:()=>current()&&s.checkPrivateQuoteCopy?.({isCurrent:()=>current()&&epoch.current===renderEpoch}),validDate,conflict,saving:!!pending.current,dirty:dirty.current,sentAt:()=>validDate?new Date(date+'T12:00:00').toISOString():null};
}
