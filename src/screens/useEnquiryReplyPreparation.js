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
  const run=()=>protectQuoteDraftTransition({workspace:scope,workspaceRef:input.scopeRef,draftRef,epochRef:epoch,renderEpoch:capturedEpoch,sourceCurrent:fresh,confirm:input.confirm,apply,promptTitle:'Keep your current reply?',promptBody:'Opening this private preparation will replace your current words. Nothing will be sent.'});
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
  const apply=()=>{
   epoch.current++;session.current={...next,words:prepared.text,generatedText:prepared.text};live.current={...live.current,text:prepared.text,selectedCustomerId:customerId};
   input.setSelectedCustomerId(customerId);input.setText(prepared.text);input.setOrigin(customerId,item);input.go('enquiryFollowUp');
  };
  if(sourceCurrent(session.current)&&session.current.customer===customer&&session.current.item===item&&live.current.text===session.current.generatedText){let applied=false;input.requestTransition(()=>{apply();applied=true;},{isCurrent:()=>sourceCurrent(next)&&epoch.current===renderEpoch});return applied;}
  return protect(apply,()=>sourceCurrent(next));
 };
 const edit=value=>{
  if(!valid()||typeof value!=='string')return false;
  if(session.current&&(!bound(session.current)||live.current.selectedCustomerId!==session.current.customer.id))return false;
  epoch.current++;live.current={...live.current,text:value};if(session.current)session.current={...session.current,words:value};input.setText(value);return true;
 };
 const replaceLegacy=(customer,operation)=>epoch.current===renderEpoch&&live.current.revision===input.revision&&protect(()=>{session.current=null;epoch.current++;operation();},()=>live.current.customers.includes(customer)&&customer.contactOk!==false&&![customer.businessId,customer.business_id].some(id=>id&&id!==business));
 const currentEnquiry=()=>{
  const data=live.current,receipt=data.origin,selected=data.contextCustomerId;
  if(data.contextKind!=='customer'&&data.selectedInboxItemId){
   const current=data.inboxItems.filter(row=>row.id===data.selectedInboxItemId);
   if(current.length!==1||current[0].status!=='Filed'||selected&&current[0].filedCustomerId!==selected||receipt&&receipt.item!==current[0])return null;
  }
  if(receipt){if(receipt.workspace!==scope||selected&&receipt.customerId!==selected||!data.inboxItems.includes(receipt.item)||JSON.stringify(receipt.item)!==receipt.stamp)return null;return receipt.item?.status==='Filed'&&receipt.item.filedCustomerId===receipt.customerId?receipt.item:null;}
  const rows=data.inboxItems.filter(row=>row.id===data.selectedInboxItemId&&row.status==='Filed'&&(!selected||row.filedCustomerId===selected));return rows.length===1?rows[0]:null;
 };
 const prepareCurrent=(purpose='acknowledge',customerId='')=>{
  if(!valid())return {found:false,blocked:true};
  if(epoch.current!==renderEpoch||live.current.revision!==input.revision||live.current.contextKind!==input.contextKind||live.current.contextCustomerId!==input.contextCustomerId||live.current.selectedInboxItemId!==input.selectedInboxItemId||live.current.origin!==input.origin||input.getOrigin?.()!==input.origin)return {found:true,prepared:false,stale:true};
  const item=currentEnquiry();if(!item||customerId&&item.filedCustomerId!==customerId)return {found:false};
  return {found:true,prepared:prepare(item.filedCustomerId,item.id,purpose)};
 };
 const resume=()=>{
  if(!valid())return {found:false,blocked:true};
  const value=session.current;if(!bound(value)||!live.current.text?.trim())return {found:false};
  const fresh=()=>session.current===value&&sourceCurrent(value)&&epoch.current===renderEpoch&&live.current.selectedCustomerId===input.selectedCustomerId;
  if(!fresh())return {found:true,opened:false};
  let opened=false;input.requestTransition(()=>{live.current={...live.current,selectedCustomerId:value.customer.id};input.setSelectedCustomerId(value.customer.id);input.go('enquiryFollowUp');opened=true;},{isCurrent:fresh});return {found:true,opened};
 };
 const value=session.current;
 return {prepare,prepareCurrent,resume,continuation:value&&sourceCurrent(value)&&input.text?.trim()?{customer:value.customer,item:value.item,text:input.text,epoch:renderEpoch,revision:value.revision}:null,edit,replaceLegacy,prepareQuestion:purpose=>value&&session.current===value&&sourceCurrent(value)&&epoch.current===renderEpoch?prepare(value.customer.id,value.item.id,purpose):false,hasSession:()=>!!session.current,
  text:value?(valid()&&bound(value)&&input.selectedCustomerId===value.customer.id?input.text:''):input.text,
  review:value&&valid()&&bound(value)&&input.selectedCustomerId===value.customer.id?{item:value.item,customer:value.customer,purpose:value.purpose,current:sourceCurrent(value),epoch:renderEpoch}:null,
  returnToSource:()=>sourceCurrent(session.current)&&epoch.current===renderEpoch?input.returnToSource(session.current.customer.id):false};
}
