import React from 'react';import {prepareEnquiryReplyText} from '../core/enquiryReplyText.mjs';import {protectQuoteDraftTransition} from '../core/quoteDraftTransition.mjs';
// Volatile source/typing metadata. Original parent enquiry fields remain the only wording state.
export function useEnquiryReplyPreparation(input){
 const live=React.useRef(input),session=React.useRef(null),epoch=React.useRef(0);live.current=input;
 const scope=input.scope,owner=input.ownerId,business=input.businessId,renderEpoch=epoch.current;
 const valid=()=>live.current.scope===scope&&input.scopeRef.current===scope&&!!owner&&!!business&&live.current.ownerId===owner&&live.current.businessId===business&&['owner','admin'].includes(live.current.role);
 const bound=value=>value&&value.scope===scope&&value.owner===owner&&value.business===business;
 const sourceStamp=(customer,item)=>JSON.stringify([customer,item,live.current.profile]);
 const sourceCurrent=value=>valid()&&bound(value)&&live.current.revision===value.revision&&live.current.customers.includes(value.customer)&&live.current.inboxItems.includes(value.item)&&value.item.status==='Filed'&&value.item.filedCustomerId===value.customer.id&&value.customer.contactOk!==false&&![value.customer.businessId,value.customer.business_id].some(id=>id&&id!==business)&&sourceStamp(value.customer,value.item)===value.stamp;
 const protect=(apply,sourceIsCurrent=()=>true)=>{
  if(!valid())return false;
  const capturedEpoch=epoch.current,text=live.current.text,selected=live.current.selectedCustomerId;
  const fresh=()=>valid()&&epoch.current===capturedEpoch&&live.current.text===text&&live.current.selectedCustomerId===selected&&sourceIsCurrent();
  const draftRef=bound(session.current)?session:{current:text?.trim()?{workspace:scope,words:text}:null};
  const run=()=>protectQuoteDraftTransition({workspace:scope,workspaceRef:input.scopeRef,draftRef,epochRef:epoch,renderEpoch:capturedEpoch,sourceCurrent:fresh,confirm:input.confirm,apply});
  let applied=false;input.requestTransition(()=>{applied=run();},{isCurrent:fresh});return applied===true;
 };
 const prepare=(customerId,inboxId,purpose='acknowledge')=>{
  if(!valid()||epoch.current!==renderEpoch)return false;
  const rows=live.current.customers.filter(row=>row.id===customerId),items=live.current.inboxItems.filter(row=>row.id===inboxId);
  if(rows.length!==1||items.length!==1)return false;
  const customer=rows[0],item=items[0],prepared=prepareEnquiryReplyText({customer,item,businessId:business,approvedProfile:live.current.profile,purpose});
  if(!prepared.ok)return false;
  const next={scope,workspace:scope,owner,business,customer,item,revision:live.current.revision,stamp:sourceStamp(customer,item),purpose};
  if(sourceCurrent(session.current)&&session.current.customer===customer&&session.current.item===item&&session.current.purpose===purpose){let opened=false;input.requestTransition(()=>{input.setSelectedCustomerId(customerId);input.go('enquiryFollowUp');opened=true;},{isCurrent:()=>sourceCurrent(session.current)&&epoch.current===renderEpoch});return opened;}
  return protect(()=>{
   epoch.current++;session.current={...next,words:prepared.text};live.current={...live.current,text:prepared.text,selectedCustomerId:customerId};
   input.setSelectedCustomerId(customerId);input.setText(prepared.text);input.setOrigin(customerId,item);input.go('enquiryFollowUp');
  },()=>sourceCurrent(next));
 };
 const edit=value=>{
  if(!valid()||typeof value!=='string')return false;
  if(session.current&&(!bound(session.current)||live.current.selectedCustomerId!==session.current.customer.id))return false;
  epoch.current++;live.current={...live.current,text:value};if(session.current)session.current={...session.current,words:value};input.setText(value);return true;
 };
 const replaceLegacy=(customer,operation)=>protect(()=>{session.current=null;epoch.current++;operation();},()=>live.current.customers.includes(customer)&&![customer.businessId,customer.business_id].some(id=>id&&id!==business));
 const value=session.current;
 return {prepare,edit,replaceLegacy,hasSession:()=>!!session.current,
  text:value?(valid()&&bound(value)&&input.selectedCustomerId===value.customer.id?input.text:''):input.text,
  review:value&&valid()&&bound(value)&&input.selectedCustomerId===value.customer.id?{item:value.item,customer:value.customer,purpose:value.purpose,current:sourceCurrent(value),epoch:renderEpoch}:null,
  returnToSource:()=>sourceCurrent(session.current)&&epoch.current===renderEpoch?input.returnToSource(session.current.customer.id):false};
}
