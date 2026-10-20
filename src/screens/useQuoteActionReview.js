import React from 'react';
import {useOwnerEditNavigation} from './useOwnerEditNavigation';
const fields=['actionQuoteAmount','actionQuoteMessage','actionQuoteSentDate'];
const values=s=>fields.map(key=>String(s[key]??''));
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const customerSource=customer=>customer&&[customer.id,customer.name,customer.service,customer.businessId,customer.business_id];
function recordValues(action,fallback){
 const details=action?.details||{};
 return [String(details.quoteAmount??fallback[0]),String(details.message??fallback[1]),details.quoteSentAt?String(details.quoteSentAt).slice(0,10):details.plannedSentDate||fallback[2]];
}
// Volatile input/receipt metadata only. Original parent fields and reply actions own the data.
export function useQuoteActionReview(s){
 const live=React.useRef(s),epoch=React.useRef(0),dirty=React.useRef(false),pending=React.useRef(null);live.current=s;
 const scope=s.ownerWorkspaceScope,customer=s.selectedReplyCustomer,action=customer?s.replyActions?.[customer.id]:null;
 const customerStamp=JSON.stringify(customerSource(customer)),stamp=JSON.stringify(action),renderEpoch=epoch.current,renderValues=values(s);
 const baseline=React.useRef({scope,customerId:customer?.id,action,stamp,values:renderValues});
 if(baseline.current.scope!==scope||baseline.current.customerId!==customer?.id){baseline.current={scope,customerId:customer?.id,action,stamp,values:renderValues};dirty.current=false;pending.current=null;}
 const current=()=>!!scope&&!!s.ownerSession?.userId&&!!s.cloudWorkspace?.businessId&&
  ['owner','admin'].includes(live.current.cloudWorkspace?.role)&&
  ![customer?.businessId,customer?.business_id].some(id=>id&&id!==s.cloudWorkspace?.businessId)&&
  JSON.stringify(customerSource(customer))===customerStamp&&live.current.ownerWorkspaceScope===scope&&
  live.current.ownerSession?.userId===s.ownerSession?.userId&&live.current.cloudWorkspace?.businessId===s.cloudWorkspace?.businessId&&
  live.current.selectedReplyCustomer===customer&&live.current.replyActions?.[customer?.id]===action&&JSON.stringify(action)===stamp;
 const acknowledged=pending.current&&pending.current.scope===scope&&pending.current.customerId===customer?.id&&
  pending.current.customerStamp===customerStamp&&action!==pending.current.action&&JSON.stringify(action?.details)===pending.current.details;
 const changed=baseline.current.action!==action||baseline.current.stamp!==stamp;
 if(changed&&!pending.current&&!dirty.current&&same(renderValues,recordValues(action,baseline.current.values)))baseline.current={scope,customerId:customer?.id,action,stamp,values:renderValues};
 const conflict=(baseline.current.action!==action||baseline.current.stamp!==stamp)&&!acknowledged;
 const report=useOwnerEditNavigation(s,{source:action,projectId:'quote:'+customer?.id,revision:stamp},()=>{
  if(!current())return false;
  const restored=recordValues(action,baseline.current.values);
  fields.forEach((field,index)=>s['set'+field[0].toUpperCase()+field.slice(1)]?.(restored[index]));
  epoch.current++;dirty.current=false;pending.current=null;
  baseline.current={scope,customerId:customer?.id,action,stamp,values:restored};return true;
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
  pending.current=null;baseline.current={scope,customerId:customer.id,action,stamp,values:receipt.values};
  if(epoch.current===receipt.epoch&&same(values(live.current),receipt.values)){
   dirty.current=false;report(false);s.back?.();
  }else{dirty.current=true;report(true);}
 },[action,stamp,scope,customerStamp,...renderValues]);
 return {edit,commit,checkDeviceCopy:()=>current()&&s.checkPrivateQuoteCopy?.({isCurrent:()=>current()&&epoch.current===renderEpoch}),validDate,conflict,saving:!!pending.current,dirty:dirty.current,sentAt:()=>validDate?new Date(date+'T12:00:00').toISOString():null};
}
