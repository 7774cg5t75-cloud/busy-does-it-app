import React from 'react';
import {Alert,Text} from 'react-native';
import {Card,Button} from './ui';
import {styles} from '../theme/styles';
import {CanonicalRecipientManagement} from './CanonicalRecipientManagement';
import {stableJson} from '../core/stableJson.mjs';

export function CanonicalQuoteBinding({s,customerId,record,reference,selection,sourceBlocked=false,sourceReviewEpoch=0}){
 const api=s.canonicalWork,scope=s.ownerWorkspaceScope,owner=s.ownerSession?.userId,business=s.cloudWorkspace?.businessId;
 const [context,setContext]=React.useState(null),[saved,setSaved]=React.useState(null),[busy,setBusy]=React.useState(false),[notice,setNotice]=React.useState('');
 const live=React.useRef(null),flight=React.useRef(false),mounted=React.useRef(true),bound=React.useRef({scope,owner,business,id:record.engagementId,ref:reference.referenceId});
 React.useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;};},[]);
 const stamp=stableJson([owner,business,s.cloudWorkspace?.role,s.cloudRevision,s.screen,record,reference,selection,sourceBlocked,sourceReviewEpoch]);live.current={scope,stamp};
 const visible=bound.current.scope===scope&&bound.current.owner===owner&&bound.current.business===business&&bound.current.id===record.engagementId&&bound.current.ref===reference.referenceId;
 const current=()=>visible&&mounted.current&&live.current.scope===scope&&live.current.stamp===stamp&&s.cloudWorkspace?.role==='owner';
 const eligible=()=>current()&&!sourceBlocked&&!reference.termsChanged&&!flight.current&&!['unknown','pending'].includes(api.status().status)&&api.isBindingContext(context)&&!context.bindingExists&&context.recipientReview.recipient.requestId===selection?.recipient?.requestId&&context.referenceId===reference.referenceId&&context.termsHash===reference.termsHash;
 const editor=()=>({customerId,engagementId:record.engagementId,referenceId:reference.referenceId,requestId:selection?.recipient?.requestId,view:s.screen,typingEpoch:0,purpose:'quote_recipient_binding',sourceStamp:stamp,fields:{}});
 const inspect=async(kind)=>{
  if(!current()||flight.current||sourceBlocked||kind==='context'&&(!selection?.recipientIdentified||reference.termsChanged))return false;flight.current=true;setBusy(true);
  try{const v=kind==='context'?await api.quoteBindingContext(customerId,record.engagementId,reference.referenceId,selection.recipient.requestId,reference.quoteRevision):await api.quoteBindingRead(customerId,record.engagementId,reference.referenceId);if(!current())return false;
   if(kind==='context'){if(stableJson(v.recipientReview)!==stableJson(selection)){setContext(null);setNotice('Recipient evidence changed since selection. Inspect the original candidate again before a new review.');return false;}setContext(v);setNotice(v.bindingExists?'A private binding already exists for this quote version. Inspect it; replacement requires a separate reviewed contract.':'Fresh server checks match your selected recipient and saved terms. Review the private binding next.');}
   else{setSaved(v);setNotice(v.eligibility==='absent'?'No saved private binding was observed. This is not a failed earlier save receipt.':'Private binding observation: '+v.eligibility+'. This does not recreate an earlier acknowledgement or grant access.');}return true;
  }catch{if(current()){if(kind==='context')setContext(null);else setSaved(null);setNotice('Current private binding inspection unavailable. Existing owner wording and prior receipts are retained.');}return false;}
  finally{flight.current=false;if(mounted.current)setBusy(false);}
 };
 const review=()=>{
  if(!eligible())return false;const ticket=api.review({operation:'binding',record:context,fields:{},operationId:'quote_binding_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,10),editor:editor()});if(!ticket)return false;let used=false;const r=context.recipientReview.recipient;
  Alert.alert('Review owner-private recipient binding','Saved quote reference '+reference.referenceId+' · version '+context.quoteRevision+' · £'+context.terms.amount+' · planned quote date '+context.terms.plannedQuoteDate+'\n'+context.terms.wording+'\n\nSelected signed-in account '+r.consumerId+'\nOriginal identity-evidence request '+r.requestId+'\nApp/version '+r.appId+' / '+r.appVersionId+'\n\nProvenance is the original owner-linked request, not certified personhood. Unsaved editor changes are excluded. Saving grants zero consumer access and does not issue a quote, associate a quote request, send a message or book anything.',[
   {text:'Keep reviewing',style:'cancel',onPress:()=>{used=true;api.cancel(ticket);}},
   {text:'Save reviewed private binding',onPress:async()=>{
    if(used||!eligible())return false;used=true;flight.current=true;setBusy(true);let acknowledged=false;
    try{const result=await api.commit(ticket,editor);if(!current())return false;if(result.status!=='confirmed'){setNotice(result.status==='unknown'?'Private binding outcome uncertain. Do not replay. Later readback cannot recover the acknowledgement.':'Review expired. No binding receipt is claimed.');return false;}acknowledged=true;setNotice('Exact owner-private binding receipt received. Consumer access remains disabled.');const v=await api.quoteBindingRead(customerId,record.engagementId,reference.referenceId);if(!current())return false;if(v.binding?.bindingId!==result.receipt.bindingId||v.binding?.reviewHash!==result.receipt.reviewHash||v.binding?.termsHash!==result.receipt.termsHash)throw Error('Binding readback differs');setSaved(v);setContext(null);return true;}
    catch{if(current())setNotice(acknowledged?'Exact binding receipt retained; current readback unavailable. Do not replay.':'Binding operation unavailable. No successful save is claimed.');return false;}
    finally{flight.current=false;if(mounted.current)setBusy(false);}
   }}
  ]);return true;
 };
 if(!api?.bindingEnabled||!visible||s.cloudWorkspace?.role!=='owner')return null;
 return <Card eyebrow="V22.52 · private preparation" title="Save this exact recipient and quote version" body="Select a candidate first, then request fresh server checks and review exact saved terms. Original private bindings remain immutable; separate reviewed decisions manage their effective recipient. It is separate from consumer access and quote presentation.">
  {notice?<Text accessibilityLiveRegion="polite" style={styles.cardBody}>{notice}</Text>:null}
  <Button label="Recheck selected recipient and exact quote" disabled={busy||sourceBlocked||reference.termsChanged||!selection?.recipientIdentified} onPress={()=>inspect('context')}/>
  <Button label="Review private recipient binding" disabled={busy||!eligible()} onPress={review}/>
  <Button label="Inspect saved private recipient binding" disabled={busy||sourceBlocked} onPress={()=>inspect('saved')}/>
  {saved?.binding&&!api.managementEnabled?<Text selectable style={styles.cardBody}>{'Private binding '+saved.binding.bindingId+' · version '+saved.binding.quoteRevision+' · '+saved.eligibility+'\nServer recorded '+saved.binding.recordedAt+' (not presentation or acceptance time)\n'+(saved.eligibility==='current'&&!sourceBlocked?'Owner-linked account '+saved.recipient.consumerId+' · identity-evidence request '+saved.recipient.requestId:'Current recipient details are unavailable for this observation.')+'\nNo consumer access, quote/request association, customer response or booking authority.'}</Text>:null}
  <CanonicalRecipientManagement key={reference.referenceId} s={s} customerId={customerId} record={record} reference={reference} selection={selection} sourceBlocked={sourceBlocked} sourceReviewEpoch={sourceReviewEpoch}/>
 </Card>;
}
