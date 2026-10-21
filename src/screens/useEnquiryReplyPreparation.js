import {stableJson} from '../core/stableJson.mjs';
import {enquiryReplyCustomerSource,preparePrivateEnquiryReply,resolvePrivateEnquiryReply,inspectPrivateEnquiryReply,inspectPrivateReplyAccount,inspectPrivateReplyAccountRemoval,privateReplyAccountStatus} from '../core/privateEnquiryReply.mjs';
import React from 'react';import {prepareEnquiryReplyText} from '../core/enquiryReplyText.mjs';import {protectQuoteDraftTransition} from '../core/quoteDraftTransition.mjs';
// Volatile source/typing metadata. Original parent enquiry fields remain the only wording state.
export function useEnquiryReplyPreparation(input){
 const live=React.useRef(input),session=React.useRef(null),epoch=React.useRef(0),pendingSave=React.useRef(null);const [saveState,setSaveState]=React.useState(null),[accountState,setAccountState]=React.useState(null);const accountRequest=React.useRef(null);live.current=input;
 const scope=input.scope,owner=input.ownerId,business=input.businessId,renderEpoch=epoch.current;
 const valid=()=>live.current.scope===scope&&input.scopeRef.current===scope&&!!owner&&!!business&&live.current.ownerId===owner&&live.current.businessId===business&&['owner','admin'].includes(live.current.role);
 const bound=value=>value&&value.scope===scope&&value.owner===owner&&value.business===business;
 const sourceStamp=(customer,item)=>stableJson([enquiryReplyCustomerSource(customer),item,live.current.profile]);
 // Rebind equivalent original records after unrelated immutable customer updates.
 // A changed source, saved target, permission or snapshot revision still requires review.
 const prior=session.current;
 let ownRevision=false;
 if(valid()&&bound(prior)&&prior.revision!==live.current.revision&&!['saving','unknown'].includes(pendingSave.current?.status)){
  try{ownRevision=input.canContinueRevision?.(prior.revision,live.current.revision)===true;}catch{/* No original receipt: keep the source review boundary. */}
 }
 if(valid()&&bound(prior)&&(prior.revision===live.current.revision||ownRevision)){
  const customers=live.current.customers.filter(row=>row.id===prior.customer.id),items=live.current.inboxItems.filter(row=>row.id===prior.item.id);
  if(customers.length===1&&items.length===1&&(ownRevision||customers[0]!==prior.customer||items[0]!==prior.item)&&sourceStamp(customers[0],items[0])===prior.stamp&&stableJson(customers[0].privateEnquiryReply||null)===stableJson(prior.customer.privateEnquiryReply||null))session.current={...prior,revision:live.current.revision,customer:customers[0],item:items[0]};
 }
 const sourceCurrent=value=>valid()&&bound(value)&&live.current.revision===value.revision&&live.current.customers.filter(row=>row.id===value.customer.id).length===1&&live.current.inboxItems.filter(row=>row.id===value.item.id).length===1&&live.current.customers.includes(value.customer)&&live.current.inboxItems.includes(value.item)&&value.item.status==='Filed'&&value.item.filedCustomerId===value.customer.id&&value.customer.contactOk!==false&&![value.customer.businessId,value.customer.business_id].some(id=>id&&id!==business)&&sourceStamp(value.customer,value.item)===value.stamp;
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
  const next={draftToken:{},scope,workspace:scope,owner,business,customer,item,revision:live.current.revision,stamp:sourceStamp(customer,item),purpose};
  if(sourceCurrent(session.current)&&session.current.customer===customer&&session.current.item===item&&session.current.purpose===purpose){let opened=false;input.requestTransition(()=>{input.setSelectedCustomerId(customerId);input.go('enquiryFollowUp');opened=true;},{isCurrent:()=>sourceCurrent(session.current)&&epoch.current===renderEpoch});return opened;}
  const apply=()=>{
   pendingSave.current=null;setSaveState(null);epoch.current++;session.current={...next,words:prepared.text,generatedText:prepared.text};live.current={...live.current,text:prepared.text,selectedCustomerId:customerId};
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
  const value=session.current;if(!bound(value)||!live.current.text?.trim()){const candidates=savedReplies();return candidates.length===1?{found:true,saved:true,opened:reopen(candidates[0].customer.id,candidates[0].item.id)}:{found:false,needsSelection:candidates.length>1};}
  const fresh=()=>session.current===value&&sourceCurrent(value)&&epoch.current===renderEpoch&&live.current.selectedCustomerId===input.selectedCustomerId;
  if(!fresh())return {found:true,opened:false};
  let opened=false;input.requestTransition(()=>{live.current={...live.current,selectedCustomerId:value.customer.id};input.setSelectedCustomerId(value.customer.id);input.setOrigin(value.customer.id,value.item);input.go('enquiryFollowUp');opened=true;},{isCurrent:fresh});return {found:true,opened};
 };
 const save=async(reconcile=false,operation='save')=>{
  const value=session.current,text=live.current.text,typing=epoch.current;
  if(!sourceCurrent(value)||epoch.current!==renderEpoch||!text?.trim()||pendingSave.current?.status==='saving'||!input.persistPrivateReply)return false;
  if(!reconcile&&pendingSave.current?.status==='unknown')return false;
  const previous=pendingSave.current,removing=operation==='remove'||reconcile&&previous?.operation==='remove';
  const savedBefore=value.customer.privateEnquiryReply,savedStamp=stableJson(savedBefore||null);
  if(savedBefore&&(savedBefore.ownerId!==owner||savedBefore.businessId!==business))return false;
  if(removing&&!savedBefore)return false;
  const record=removing?null:preparePrivateEnquiryReply({ownerId:owner,businessId:business,customer:value.customer,item:value.item,revision:value.revision,text,purpose:value.purpose});
  if(!removing&&!record)return false;
  if(reconcile&&(!previous?.encoded||previous.value?.draftToken!==value.draftToken))return false;
  const ticket={value,operation:removing?'remove':'save',removedRecord:removing?savedBefore:null,text:reconcile?previous.text:text,status:'saving'};pendingSave.current=ticket;setSaveState(ticket);
  // Typing may continue, but only this exact saved text can be acknowledged.
  const current=()=>sourceCurrent(value)&&live.current.selectedCustomerId===value.customer.id&&session.current?.draftToken===value.draftToken&&pendingSave.current===ticket&&value.customer.privateEnquiryReply===savedBefore&&stableJson(savedBefore||null)===savedStamp;
  let result;try{result=await input.persistPrivateReply({customer:value.customer,record,isCurrent:current,reconcile:reconcile?previous:null});}catch{result={status:'unknown'};}
  if(!current()){if(pendingSave.current===ticket){const uncertain={...ticket,...result,status:'unknown'};pendingSave.current=uncertain;setSaveState(uncertain);}return false;}
  const next={...ticket,...result,status:['confirmed','failed'].includes(result.status)?result.status:'unknown'};
  if(result.status==='confirmed'){
   live.current={...live.current,customers:live.current.customers.map(row=>row===value.customer?result.customer:row)};
   session.current={...session.current,customer:result.customer};next.value=session.current;
   if(removing)next.status='removed';
   next.savedText=removing?null:reconcile?previous.text:text;next.newer=epoch.current!==typing||live.current.text!==next.savedText;
  }
  pendingSave.current=next;setSaveState(next);return result.status==='confirmed';
 };
 const savedAction=operation=>{
  const value=session.current,saved=value?.customer.privateEnquiryReply;
  if(!sourceCurrent(value)||epoch.current!==renderEpoch||pendingSave.current?.status==='saving'||pendingSave.current?.status==='unknown'||saved&&(saved.ownerId!==owner||saved.businessId!==business))return false;
  if(operation==='save'&&(!saved||resolvePrivateEnquiryReply({ownerId:owner,businessId:business,customer:value.customer,inboxItems:live.current.inboxItems,revision:live.current.revision})?.item===value.item))return save(false);
  if(!saved)return false;
  const typing=epoch.current,text=live.current.text,stamp=stableJson(saved);
  const fresh=()=>sourceCurrent(value)&&session.current?.draftToken===value.draftToken&&epoch.current===typing&&live.current.text===text&&live.current.selectedCustomerId===value.customer.id&&value.customer.privateEnquiryReply===saved&&stableJson(saved)===stamp;
  input.confirm(operation==='remove'?'Discard the saved private reply?':'Replace the saved private reply?',operation==='remove'?'Your current wording stays. The saved reply is removed from this business copy; account removal is not confirmed. Nothing is sent.':'This customer already has a saved reply for another enquiry. There is one saved private reply per customer. Replacing it keeps your current words and sends nothing.',[{text:'Continue editing',style:'cancel',onPress:()=>false},{text:operation==='remove'?'Discard saved reply':'Replace saved reply',style:'destructive',onPress:()=>fresh()?save(false,operation):false}]);return false;
 };
 const reopen=(customerId,inboxId)=>{
  if(!valid()||epoch.current!==renderEpoch)return false;
  const rows=live.current.customers.filter(row=>row.id===customerId);if(rows.length!==1)return false;
  const customer=rows[0],saved=resolvePrivateEnquiryReply({ownerId:owner,businessId:business,customer,inboxItems:live.current.inboxItems,revision:live.current.revision});
  if(!saved||saved.item.id!==inboxId)return false;
  const next={draftToken:{},scope,workspace:scope,owner,business,customer,item:saved.item,revision:live.current.revision,stamp:sourceStamp(customer,saved.item),purpose:saved.record.purpose};
  return protect(()=>{epoch.current++;session.current={...next,words:saved.record.text,generatedText:null};pendingSave.current=null;setSaveState({status:'reopened',savedText:saved.record.text});live.current={...live.current,text:saved.record.text,selectedCustomerId:customerId};input.setText(saved.record.text);input.setSelectedCustomerId(customerId);input.setOrigin(customerId,saved.item);input.go('enquiryFollowUp');},()=>sourceCurrent(next)&&customer.privateEnquiryReply===saved.record);
 };
 const checkAccount=async()=>{
  const value=session.current,record=value?.customer.privateEnquiryReply||null,typing=epoch.current;
  const removalTicket=pendingSave.current;
  const removing=!record&&removalTicket?.status==='removed'&&removalTicket.operation==='remove'&&removalTicket.value?.draftToken===value?.draftToken&&removalTicket.removedRecord?.reference?.inboxId===value?.item.id;
  if(!sourceCurrent(value)||!record&&!removing||record&&record.reference?.inboxId!==value.item.id||epoch.current!==renderEpoch||!input.readAccount||accountRequest.current?.checking)return false;
  const ticket={value,record,removing,removalTicket:removing?removalTicket:null,checking:true};accountRequest.current=ticket;setAccountState({status:'checking',record,removed:removing,customer:value.customer,removedRecord:removing?removalTicket.removedRecord:null});
  let result;try{
   const read=await input.readAccount();
   result=removing?inspectPrivateReplyAccountRemoval({result:read,ownerId:owner,businessId:business,customer:value.customer,removedRecord:removalTicket.removedRecord,item:value.item}):inspectPrivateReplyAccount({result:read,ownerId:owner,businessId:business,customer:value.customer,record,item:value.item});
  }catch{result={status:'unknown'};}
  if(accountRequest.current!==ticket)return false;accountRequest.current={...ticket,checking:false};
  if(!sourceCurrent(value)||session.current?.draftToken!==value.draftToken||epoch.current!==typing||live.current.selectedCustomerId!==value.customer.id||removing&&(pendingSave.current!==removalTicket||!!value.customer.privateEnquiryReply)||!removing&&value.customer.privateEnquiryReply!==record){setAccountState({status:'unknown',record,removed:removing,customer:value.customer,removedRecord:removing?removalTicket.removedRecord:null});return false;}
  setAccountState({...result,record,removed:removing,customer:value.customer,removedRecord:removing?removalTicket.removedRecord:null});return result.status==='confirmed'||result.status==='absent';
 };
 const reviewSaved=customerId=>{
  if(!valid()||epoch.current!==renderEpoch)return false;
  const rows=live.current.customers.filter(row=>row.id===customerId);if(rows.length!==1)return false;
  const customer=rows[0],saved=inspectPrivateEnquiryReply({ownerId:owner,businessId:business,customer,inboxItems:live.current.inboxItems,revision:live.current.revision});
  if(!saved)return false;if(saved.current)return reopen(customerId,saved.item.id);
  const revision=live.current.revision,recordStamp=JSON.stringify(saved.record),item={id:saved.record.reference.inboxId,status:'Unavailable',filedCustomerId:customerId};
  const fresh=()=>valid()&&live.current.revision===revision&&live.current.customers.includes(customer)&&customer.privateEnquiryReply===saved.record&&JSON.stringify(saved.record)===recordStamp;
  return protect(()=>{epoch.current++;session.current={draftToken:{},scope,workspace:scope,owner,business,customer,item,revision,stamp:'source-unavailable',purpose:saved.record.purpose,words:saved.record.text};pendingSave.current=null;setSaveState({status:'reopened',savedText:saved.record.text});live.current={...live.current,text:saved.record.text,selectedCustomerId:customerId};input.setText(saved.record.text);input.setSelectedCustomerId(customerId);input.clearOrigin?.();input.go('enquiryFollowUp');},fresh);
 };
 // Deliberate source review after a compatible account revision. This never
 // acknowledges persistence or substitutes another enquiry for the original.
 const sourceReviewCandidate=()=>{
  const value=session.current;
  if(!valid()||!bound(value)||value.revision===live.current.revision||!Number.isSafeInteger(live.current.revision)||live.current.revision<value.revision||live.current.selectedCustomerId!==value.customer.id||['saving','unknown'].includes(pendingSave.current?.status)||accountRequest.current?.checking)return null;
  const rows=live.current.customers.filter(row=>row.id===value.customer.id),items=live.current.inboxItems.filter(row=>row.id===value.item.id);
  if(rows.length!==1||items.length!==1||sourceStamp(rows[0],items[0])!==value.stamp||stableJson(rows[0].privateEnquiryReply||null)!==stableJson(value.customer.privateEnquiryReply||null))return null;
  const next={...value,customer:rows[0],item:items[0],revision:live.current.revision};return sourceCurrent(next)?next:null;
 };
 const reviewCurrentSource=()=>{
  const next=sourceReviewCandidate(),value=session.current,typing=epoch.current,text=live.current.text;
  if(!next||typing!==renderEpoch)return false;
  const fresh=()=>session.current===value&&epoch.current===typing&&live.current.text===text&&sourceReviewCandidate()?.customer===next.customer&&sourceReviewCandidate()?.item===next.item&&live.current.revision===next.revision;
  input.confirm('Review this reply source?','The account version changed, but the current customer and original filed enquiry still match. Keep your words and use this current source for further private preparation. This does not confirm any save or send.',[{text:'Keep editing',style:'cancel',onPress:()=>false},{text:'Use current enquiry',onPress:()=>{if(!fresh())return false;epoch.current++;session.current={...next,words:live.current.text};pendingSave.current=null;setSaveState(null);setAccountState(null);return true;}}]);return false;
 };
 const savedReplies=()=>valid()?live.current.customers.flatMap(customer=>{const saved=resolvePrivateEnquiryReply({ownerId:owner,businessId:business,customer,inboxItems:live.current.inboxItems,revision:live.current.revision});return saved?[{customer,...saved}]:[];}):[];
 const value=session.current;
 let ownSave=null;
 if(sourceCurrent(value)&&value.customer.privateEnquiryReply){
  try{ownSave=inspectPrivateReplyAccount({result:input.readOwnSave?.({customerId:value.customer.id,inboxId:value.item.id}),ownerId:owner,businessId:business,customer:value.customer,record:value.customer.privateEnquiryReply,item:value.item});}catch{/* Unsupported or unavailable receipt is not saving evidence. */}
 }
 return {reviewCurrentSource,checkAccount,reviewSaved,savedReplies:savedReplies(),save:()=>savedAction('save'),removeSaved:()=>savedAction('remove'),checkSave:()=>save(true),reopen,prepare,prepareCurrent,resume,continuation:value&&sourceCurrent(value)&&input.text?.trim()?{customer:value.customer,item:value.item,text:input.text,epoch:renderEpoch,revision:value.revision}:null,edit,replaceLegacy,prepareQuestion:purpose=>value&&session.current===value&&sourceCurrent(value)&&epoch.current===renderEpoch?prepare(value.customer.id,value.item.id,purpose):false,hasSession:()=>!!session.current,
  text:value?(valid()&&bound(value)&&input.selectedCustomerId===value.customer.id?input.text:''):input.text,
  review:value&&valid()&&bound(value)&&input.selectedCustomerId===value.customer.id?{item:value.item,customer:value.customer,purpose:value.purpose,canReviewCurrentSource:!!sourceReviewCandidate(),requirements:sourceCurrent(value)?prepareEnquiryReplyText({customer:value.customer,item:value.item,businessId:business,approvedProfile:input.profile,purpose:'acknowledge'}):null,current:sourceCurrent(value),epoch:renderEpoch,accountStatus:privateReplyAccountStatus({state:accountState,customer:value.customer,text:input.text,saveState,ownSave}),saveStatus:saveState?.savedText&&saveState.savedText!==input.text?'newer':saveState?.status||'unsaved'}:null,
  returnToSource:()=>{const current=session.current;if(!sourceCurrent(current)||epoch.current!==renderEpoch||live.current.selectedCustomerId!==current.customer.id)return false;input.setOrigin(current.customer.id,current.item);return input.returnToSource(current.customer.id);}};
}
