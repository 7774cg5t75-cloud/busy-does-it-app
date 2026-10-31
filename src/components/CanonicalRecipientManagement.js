import React from 'react';
import {CanonicalQuoteGrant} from './CanonicalQuoteGrant';
import {Alert,Text} from 'react-native';
import {Card,Button} from './ui';
import {styles} from '../theme/styles';
import {isQuotePresentationProjection} from '../core/quotePresentationContract.mjs';
import {stableJson} from '../core/stableJson.mjs';

export function CanonicalQuotePresentationPreview({projection}){
 if(!projection||!isQuotePresentationProjection(projection,projection.engagementId,projection.referenceId))return null;
 return <Card eyebrow="Private preview · customer access disabled" title="Exact quote information prepared for review" body="Only these whitelisted fields are included. This is not a sent, issued, presented or accepted quote.">
  <Text selectable style={styles.cardBody}>{'Prepared · version '+projection.quoteRevision+'\nAmount £'+projection.amount+'\nPlanned quote date '+projection.plannedQuoteDate+'\n'+projection.wording}</Text>
 </Card>;
}
export function CanonicalRecipientManagement({s,customerId,record,reference,selection,sourceBlocked=false,sourceReviewEpoch=0}){
 const api=s.canonicalWork,scope=s.ownerWorkspaceScope,owner=s.ownerSession?.userId,business=s.cloudWorkspace?.businessId;
 const [savedObserved,setObserved]=React.useState(null),[savedContext,setContext]=React.useState(null),[savedPreparation,setPreparation]=React.useState(null),[savedHistory,setHistory]=React.useState(null),[notice,setNotice]=React.useState(''),[busy,setBusy]=React.useState(false);
 const stamps=React.useRef({});
 const mounted=React.useRef(true),flight=React.useRef(false),live=React.useRef(null),bound=React.useRef({scope,owner,business,id:record.engagementId,ref:reference.referenceId});
 React.useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;};},[]);
 const stamp=stableJson([owner,business,s.cloudWorkspace?.role,s.cloudRevision,s.screen,record,reference,selection,sourceBlocked,sourceReviewEpoch]);live.current={scope,stamp,api};
 const observed=stamps.current.observed===stamp?savedObserved:null,context=stamps.current.context===stamp?savedContext:null,preparation=stamps.current.preparation===stamp?savedPreparation:null,history=stamps.current.history===stamp?savedHistory:null;
 const store=(kind,setter,v)=>{stamps.current[kind]=stamp;setter(v);};
 const visible=bound.current.scope===scope&&bound.current.owner===owner&&bound.current.business===business&&bound.current.id===record.engagementId&&bound.current.ref===reference.referenceId;
 const current=()=>visible&&mounted.current&&live.current.scope===scope&&live.current.stamp===stamp&&live.current.api===api&&s.cloudWorkspace?.role==='owner';
 const free=()=>current()&&!flight.current&&!['pending','unknown'].includes(api.status().status);
 const run=async(task)=>{if(!current()||flight.current)return false;flight.current=true;setBusy(true);try{return await task();}catch{if(current()){setContext(null);setObserved(null);setPreparation(null);setHistory(null);setNotice('Current private review unavailable. No successful action is claimed; owner wording and existing receipts are retained.');}return false;}finally{flight.current=false;if(mounted.current)setBusy(false);}};
 const inspect=()=>run(async()=>{const v=await api.quoteBindingRead(customerId,record.engagementId,reference.referenceId);if(!current())return false;store('observed',setObserved,v);setContext(null);setNotice('Current recipient binding: '+v.eligibility+'. Account observation only; no earlier receipt reconstructed.');return true;});
 const prepare=kind=>run(async()=>{
  if(!observed?.binding||['pending','unknown'].includes(api.status().status))return false;
  let v;
  if(kind==='revoke'||kind==='replace'){
   if(kind==='replace'&&(sourceBlocked||!selection?.recipientIdentified||reference.termsChanged))return false;
   v=await api.managementReview(customerId,record.engagementId,reference.referenceId,kind,kind==='replace'?selection.recipient.requestId:null,observed.binding.revision);
   if(!current())return false;
   if(kind==='replace'&&stableJson(v.proposedRecipient)!==stableJson(selection)){setContext(null);setNotice('Selected recipient evidence changed. Inspect the candidate again before replacement.');return false;}
  }else{if(sourceBlocked||observed.eligibility!=='current'||reference.termsChanged)return false;v=await api.presentationReview(customerId,record.engagementId,reference.referenceId,observed.binding.revision,kind==='15'?15:60);if(!current())return false;}
  store('context',setContext,v);setNotice('Fresh server review obtained. Review the exact action before recording it. No customer access is enabled.');return true;
 });
 const openHistory=before=>run(async()=>{const v=await api.bindingHistory(customerId,record.engagementId,reference.referenceId,before);if(!current())return false;store('history',setHistory,v);return true;});
 const inspectPreparation=()=>run(async()=>{const v=await api.presentationRead(customerId,record.engagementId,reference.referenceId);if(!current())return false;store('preparation',setPreparation,v);setNotice('Private access preparation: '+v.preparationState+'. Customer access and responses remain disabled.');return true;});
 const editor=(operation,base)=>({customerId,engagementId:record.engagementId,referenceId:reference.referenceId,view:s.screen,typingEpoch:0,purpose:operation==='management'?'binding_decision':operation==='presentation'?'presentation_preparation':'presentation_withdrawal',action:base.action??null,requestId:base.requestId??null,preparationId:base.preparation?.preparationId??null,sourceStamp:stamp,fields:{}});
 const review=(operation,base)=>{
  if(!free()||!base)return false;
  if(operation==='management'&&!api.isManagementContext(base)||operation==='presentation'&&(!api.isPresentationContext(base)||sourceBlocked))return false;
  const ticket=api.review({operation,record:base,fields:{},operationId:'recipient_manage_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,10),editor:editor(operation,base)});if(!ticket)return false;let used=false;
  const description=operation==='management'?(base.action==='revoke'?'Revoke this binding. Existing preparations become unusable; original binding/history remain.':'Replace the effective recipient with freshly reviewed owner-linked account '+base.proposedRecipient.recipient.consumerId+'. Original evidence remains immutable.'):(operation==='presentation'?'Record an owner-private access preparation for '+base.durationMinutes+' minutes. It grants ZERO customer access.':'Withdraw this private access preparation. No disclosure or sending occurred.');
  Alert.alert('Review private quote recipient action',description+'\n\nReference '+reference.referenceId+'\nQuote version '+reference.quoteRevision+'\n'+(reference.terms?'£'+reference.terms.amount+' · '+reference.terms.plannedQuoteDate+'\n'+reference.terms.wording:'Exact immutable reference remains unchanged.')+'\n\nUnsaved quote fields are excluded. No message, acceptance, booking or payment operation is included.',[
   {text:'Keep reviewing',style:'cancel',onPress:()=>{used=true;api.cancel(ticket);}},
   {text:'Record reviewed private action',onPress:async()=>{if(used||!free())return false;used=true;return run(async()=>{const result=await api.commit(ticket,()=>editor(operation,base));if(!current())return false;
    if(result.status!=='confirmed'){setNotice(result.status==='unknown'?'Outcome uncertain. Do not replay this action. A later observation cannot recover its acknowledgement.':'Review expired. Obtain fresh server review.');return false;}
    setContext(null);setNotice('Exact target-specific private receipt received. Consumer access remains disabled.');
    try{
     if(operation==='management'){const v=await api.quoteBindingRead(customerId,record.engagementId,reference.referenceId);if(!current())return false;if(v.binding?.bindingId!==result.receipt.bindingId||v.binding?.revision!==result.receipt.revision)throw Error('Readback differs');store('observed',setObserved,v);setPreparation(null);setHistory(null);}
     else{const v=await api.presentationRead(customerId,record.engagementId,reference.referenceId);if(!current())return false;if(v.preparation?.preparationId!==result.receipt.preparationId)throw Error('Readback differs');store('preparation',setPreparation,v);}
    }catch{if(current())setNotice('Exact private receipt retained; later current readback unavailable. Do not replay.');}return true;
   });}}
  ]);return true;
 };
 if(!api?.managementEnabled||!visible||s.cloudWorkspace?.role!=='owner')return null;
 return <Card eyebrow="Owner-private recipient management" title="Manage recipient and access preparation" body="Revoke or explicitly replace the current binding while retaining its original evidence. Access preparations are private, version-bound and disabled for customers.">
  {notice?<Text accessibilityLiveRegion="polite" style={styles.cardBody}>{notice}</Text>:null}
  <Button label="Inspect current recipient management status" disabled={busy} onPress={inspect}/>
  {observed?.binding?<Text selectable style={styles.cardBody}>{'Binding '+observed.binding.bindingId+' · revision '+observed.binding.revision+' · '+observed.eligibility}</Text>:null}
  <Button label="Prepare recipient revocation" disabled={busy||!observed?.binding||observed.eligibility==='revoked'||!free()} onPress={()=>prepare('revoke')}/>
  <Button label="Prepare reviewed recipient replacement" disabled={busy||sourceBlocked||reference.termsChanged||!observed?.binding||!selection?.recipientIdentified||!free()} onPress={()=>prepare('replace')}/>
  <Button label="Prepare private access review for 15 minutes" disabled={busy||sourceBlocked||observed?.eligibility!=='current'||!free()} onPress={()=>prepare('15')}/>
  <Button label="Prepare private access review for 60 minutes" disabled={busy||sourceBlocked||observed?.eligibility!=='current'||!free()} onPress={()=>prepare('60')}/>
  {context?<Button label="Review prepared recipient action" disabled={busy||!free()} onPress={()=>review(context.currentBindingDecision?'management':'presentation',context)}/>:null}
  <Button label="Inspect recipient decision history" disabled={busy||!observed?.binding} onPress={()=>openHistory(null)}/>
  {history?.items.map(x=><Text key={x.decisionId} selectable style={styles.cardBody}>{'Revision '+x.revision+' · '+x.action+' · '+x.state+'\nServer recorded '+x.recordedAt}</Text>)}
  {history?.nextCursor?<Button label="Older recipient decisions" disabled={busy} onPress={()=>openHistory(history.nextCursor)}/>:null}
  <Button label="Inspect private access preparation" disabled={busy||!observed?.binding} onPress={inspectPreparation}/>
  {preparation?.preparation?<Text selectable style={styles.cardBody}>{'Private preparation '+preparation.preparation.preparationId+' · '+preparation.preparationState+'\nExpires '+preparation.preparation.expiresAt+'\nNot presentation, delivery, response or acceptance evidence.'}</Text>:null}
  {preparation?.preparation?.revision===1?<Button label="Review withdrawing private access preparation" disabled={busy||!free()} onPress={()=>review('presentationWithdrawal',preparation)}/>:null}
  <CanonicalQuoteGrant s={s} customerId={customerId} record={record} reference={reference} preparation={preparation} sourceBlocked={sourceBlocked} sourceReviewEpoch={sourceReviewEpoch}/>
  <CanonicalQuotePresentationPreview projection={!sourceBlocked?preparation?.projection:null}/>
  <Text style={styles.cardBody}>Customer disclosure, responses, acceptance and booking remain unavailable. Owner-linked request provenance does not certify real-world identity or prove that this quote was requested.</Text>
 </Card>;
}
