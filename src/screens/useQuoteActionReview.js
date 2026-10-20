import React from 'react';
const fields=['actionQuoteAmount','actionQuoteMessage','actionQuoteSentDate'];
const values=s=>fields.map(key=>String(s[key]??''));
// Current-input checks around the original form/complete callback, never save authority.
export function useQuoteActionReview(s){
 const live=React.useRef(s),epoch=React.useRef(0);live.current=s;
 const scope=s.ownerWorkspaceScope,customer=s.selectedReplyCustomer,action=customer?s.replyActions?.[customer.id]:null;
 const customerStamp=JSON.stringify(customer&&[customer.id,customer.name,customer.service,customer.businessId,customer.business_id]);
 const stamp=JSON.stringify(action),renderEpoch=epoch.current,renderValues=values(s);
 const current=()=>!!scope&&!!s.ownerSession?.userId&&!!s.cloudWorkspace?.businessId&&['owner','admin'].includes(live.current.cloudWorkspace?.role)&&![customer?.businessId,customer?.business_id].some(id=>id&&id!==s.cloudWorkspace?.businessId)&&JSON.stringify(customer&&[customer.id,customer.name,customer.service,customer.businessId,customer.business_id])===customerStamp&&live.current.ownerWorkspaceScope===scope&&live.current.ownerSession?.userId===s.ownerSession?.userId&&live.current.cloudWorkspace?.businessId===s.cloudWorkspace?.businessId&&live.current.selectedReplyCustomer===customer&&live.current.replyActions?.[customer?.id]===action&&JSON.stringify(action)===stamp;
 const edit=(field,value)=>{
  if(!current()||action?.type!=='quote'||!fields.includes(field)||typeof value!=='string')return false;
  epoch.current++;live.current={...live.current,[field]:value};
  s['set'+field[0].toUpperCase()+field.slice(1)]?.(value);return true;
 };
 const commit=operation=>{
  if(!current()||action?.type!=='quote'||epoch.current!==renderEpoch||JSON.stringify(values(live.current))!==JSON.stringify(renderValues))return false;
  // Consume this exact review even if another callback is invoked before render.
  epoch.current++;const result=operation();if(result===false&&epoch.current===renderEpoch+1)epoch.current=renderEpoch;return result;
 };
 return {edit,commit};
}
