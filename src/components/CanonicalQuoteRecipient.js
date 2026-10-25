import React from 'react';
import {CanonicalQuoteBinding} from './CanonicalQuoteBinding';
import {Alert,Text} from 'react-native';
import {Card,Button} from './ui';
import {styles} from '../theme/styles';
import {stableJson} from '../core/stableJson.mjs';
// Owner-only inspection, never a customer identity registry or disclosure grant.
export function CanonicalQuoteRecipient({s,customerId,record,reference,sourceBlocked=false,sourceReviewEpoch=0}){
 const api=s.canonicalWork,scope=s.ownerWorkspaceScope,owner=s.ownerSession?.userId,business=s.cloudWorkspace?.businessId;
 const [page,setPage]=React.useState(null),[observed,setObserved]=React.useState(null),[held,setHeld]=React.useState(null),[notice,setNotice]=React.useState(''),[busy,setBusy]=React.useState(false);
 const mounted=React.useRef(true),flight=React.useRef(false),live=React.useRef(null),bound=React.useRef({scope,owner,business,id:record.engagementId,ref:reference.referenceId});
 React.useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;};},[]);
 const stamp=stableJson([owner,business,s.cloudWorkspace?.role,s.cloudRevision,s.screen,record,reference,sourceBlocked,sourceReviewEpoch]);live.current={scope,stamp,observed};
 const visible=bound.current.scope===scope&&bound.current.owner===owner&&bound.current.business===business&&bound.current.id===record.engagementId&&bound.current.ref===reference.referenceId;
 const current=()=>visible&&mounted.current&&live.current.scope===scope&&live.current.stamp===stamp&&s.cloudWorkspace?.role==='owner';
 const inspect=async(kind,arg=null)=>{
  if(!current()||sourceBlocked||reference.termsChanged||flight.current)return false;flight.current=true;setBusy(true);
  try{const v=kind==='list'?await api.recipientCandidates(customerId,record.engagementId,reference.referenceId,arg):await api.recipientReview(customerId,record.engagementId,reference.referenceId,arg);if(!current())return false;if(kind==='list')setPage(v);else{setObserved(v);setHeld(null);setNotice(v.recipientIdentified?'Original owner-linked consumer observed. This is not independently verified personhood or a quote response.':'Recipient unsupported: '+v.provenance+'. No matching by name, email or price was attempted.');}return true;}
  catch{if(current()){setObserved(null);setHeld(null);setNotice('Current recipient inspection unavailable. No identity or missing record is inferred; private wording remains untouched.');}return false;}
  finally{flight.current=false;if(mounted.current)setBusy(false);}
 };
 const review=()=>{
  if(!current()||sourceBlocked||reference.termsChanged||flight.current||!api.isRecipientReview(observed)||!observed.recipientIdentified||observed.referenceId!==reference.referenceId||observed.quoteRevision!==reference.quoteRevision||observed.termsHash!==reference.termsHash)return false;
  const value=observed,selection=stableJson(value);let used=false;
  Alert.alert('Review intended recipient privately','Quote reference '+reference.referenceId+' · quote version '+reference.quoteRevision+'\nOriginal request '+value.recipient.requestId+'\nSigned-in consumer '+value.recipient.consumerId+'\nApp version '+value.recipient.appVersionId+'\n\nEvidence: original owner-linked request. This does not independently verify the person, prove quote presentation or associate that request with this quote. No consumer can access private terms through this review.',[
   {text:'Keep inspecting',style:'cancel',onPress:()=>{used=true;}},
   {text:'Keep this private review in session',onPress:()=>{if(used||!current()||sourceBlocked||flight.current||stableJson(live.current.observed)!==selection||!api.isRecipientReview(value))return false;used=true;setHeld(value);setNotice('Private review held in this running session only. Not saved, sent or shared; no quote/request association or booking permission.');return true;}}
  ]);return true;
 };
 if(!api?.recipientReviewEnabled||!visible||s.cloudWorkspace?.role!=='owner')return null;
 return <Card eyebrow="Owner-linked identity evidence" title="Review the intended recipient" body="A CRM customer ID is not an authenticated consumer ID. Only exact persisted request links are inspected. A candidate is not a confirmed recipient or a quote response.">
  {notice?<Text accessibilityLiveRegion="polite" style={styles.cardBody}>{notice}</Text>:null}
  <Button label="Inspect original request-link candidates" disabled={busy||sourceBlocked||reference.termsChanged} onPress={()=>inspect('list')}/>
  {page?.items.map(x=><Button key={x.requestId} label={'Inspect recipient evidence request '+x.requestId} disabled={busy} onPress={()=>inspect('review',x.requestId)}/>)}
  {page?.nextCursor?<Button label="Next recipient evidence page" disabled={busy} onPress={()=>inspect('list',page.nextCursor)}/>:null}
  {observed?.recipientIdentified?<Text selectable style={styles.cardBody}>{'Consumer '+observed.recipient.consumerId+'\nOwner-linked request '+observed.recipient.requestId+'\nApp '+observed.recipient.appId+' · reviewed version '+observed.recipient.appVersionId+'\nRequest revision '+observed.recipient.requestRevision+'\nLink revision '+observed.recipient.linkRevision+'\nProvenance: owner-linked signed-in request. No customer response is linked to this quote version.'}</Text>:null}
  <Button label="Review intended recipient without disclosure" disabled={busy||sourceBlocked||!observed?.recipientIdentified||reference.termsChanged} onPress={review}/>
  {held?<Text style={styles.cardBody}>Session-only recipient review. Reinspect in a fresh session. Consumer access, presentation, customer-response and request association remain unauthorised.</Text>:null}
  <CanonicalQuoteBinding key={reference.referenceId} s={s} customerId={customerId} record={record} reference={reference} selection={observed} sourceBlocked={sourceBlocked} sourceReviewEpoch={sourceReviewEpoch}/>
 </Card>;
}
