import React from 'react';
import {CanonicalQuoteRecipient} from './CanonicalQuoteRecipient';
import {Text,Alert} from 'react-native';
import {Card,Button} from './ui';
import {styles} from '../theme/styles';
import {stableJson} from '../core/stableJson.mjs';
// Exact saved quote preparation, not a communication, public token or acceptance.
export function CanonicalQuoteReference({s,customerId,record,sourceBlocked=false,sourceReviewEpoch=0}){
 const api=s.canonicalWork,scope=s.ownerWorkspaceScope;
 const [binding,setBinding]=React.useState(null),[page,setPage]=React.useState(null),[observed,setObserved]=React.useState(null),[notice,setNotice]=React.useState(''),[busy,setBusy]=React.useState(false);
 const live=React.useRef(null),flight=React.useRef(false),mounted=React.useRef(true);
 React.useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;};},[]);
 const stamp=stableJson([s.ownerSession?.userId,s.cloudWorkspace?.businessId,s.cloudWorkspace?.role,s.cloudRevision,s.screen,record,sourceBlocked,sourceReviewEpoch]);live.current={scope,stamp};
 const current=()=>mounted.current&&live.current.scope===scope&&live.current.stamp===stamp&&s.cloudWorkspace?.role==='owner';
 const editor=()=>({customerId,engagementId:record.engagementId,view:s.screen,typingEpoch:0,purpose:'quote_reference',sourceStamp:stamp,fields:{}});
 const eligible=()=>current()&&!sourceBlocked&&!['pending','unknown'].includes(api.status().status)&&api.isQuoteReferenceContext(binding)&&binding.revision===record.revision&&binding.recordHash===record.recordHash;
 const inspect=async(kind,arg=null)=>{
  if(!current()||flight.current)return false;flight.current=true;setBusy(true);
  try{const v=kind==='review'?await api.quoteReferenceContext(customerId,record.engagementId,record.revision):kind==='list'?await api.quoteReferenceList(customerId,record.engagementId,arg):await api.quoteReferenceRead(customerId,record.engagementId,arg);if(!current())return false;if(kind==='review'){setBinding(v);setNotice('Saved account terms reviewed. Unsaved quote-editor changes are excluded and remain untouched.');}else if(kind==='list')setPage(v);else setObserved(v);return true;}
  catch{if(current())setNotice('Preparation inspection unavailable. No presentation, response or missing record is inferred. Existing wording is untouched.');return false;}
  finally{flight.current=false;if(mounted.current)setBusy(false);}
 };
 const review=()=>{
  if(!eligible()||flight.current)return false;const ticket=api.review({operation:'reference',record:binding,fields:{},operationId:'quote_ref_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,10),editor:editor()});if(!ticket)return false;let used=false;
  Alert.alert('Record private quote reference — not presentation','Saved quote version '+binding.revision+' · £'+binding.terms.amount+' · planned quote date '+binding.terms.plannedQuoteDate+'\n'+binding.terms.wording+'\n\nUnsaved editor changes are excluded. This only records reviewed internal terms. It does not approve issuance, send a quote, prove presentation, link a customer reply or permit booking.',[
   {text:'Keep reviewing',style:'cancel',onPress:()=>{used=true;api.cancel(ticket);}},
   {text:'Record reviewed private reference',onPress:async()=>{
    if(used||!eligible()||flight.current)return false;used=true;flight.current=true;setBusy(true);let acknowledged=false;
    try{const result=await api.commit(ticket,editor);if(!current())return false;if(result.status!=='confirmed'){setNotice(result.status==='unknown'?'Private reference outcome uncertain. Do not replay. Later observations cannot recover the acknowledgement.':'Review expired. No preparation receipt is claimed.');return false;}acknowledged=true;setNotice('Exact private preparation receipt received. No quote was presented or sent.');const v=await api.quoteReferenceRead(customerId,record.engagementId,result.receipt.referenceId);if(!current())return false;if(v.termsHash!==result.receipt.termsHash||v.quoteRevision!==binding.revision||stableJson(v.terms)!==stableJson(binding.terms))throw Error('Readback differs');setObserved(v);setBinding(null);return true;}
    catch{if(current())setNotice(acknowledged?'Exact preparation receipt retained; current readback unavailable. Do not replay.':'Preparation unavailable. No successful recording is claimed.');return false;}
    finally{flight.current=false;if(mounted.current)setBusy(false);}
   }}
  ]);return true;
 };
 if(!api?.quoteReferenceEnabled)return null;
 return <Card eyebrow="Private preparation · no execution" title="Exact quote and communication review" body={'Engagement '+record.engagementId+'. Review a saved version before any future presentation or request association. A private reference is not a customer-facing token.'}>
  {notice?<Text accessibilityLiveRegion="polite" style={styles.cardBody}>{notice}</Text>:null}
  <Button label="Inspect saved quote terms for private preparation" disabled={busy||sourceBlocked} onPress={()=>inspect('review')}/>
  <Button label="Review recording private quote reference" disabled={busy||!eligible()} onPress={review}/>
  <Button label="Inspect prepared quote versions" disabled={busy||sourceBlocked} onPress={()=>inspect('list')}/>
  {page?.items.map(x=><Button key={x.referenceId} label={'Inspect quote reference '+x.referenceId+' · version '+x.quoteRevision} disabled={busy} onPress={()=>inspect('read',x.referenceId)}/>)}
  {page?.nextCursor?<Button label="Next quote reference page" disabled={busy} onPress={()=>inspect('list',page.nextCursor)}/>:null}
  {observed?<><Text selectable style={styles.cardBody}>{'Private reference '+observed.referenceId+' · PREPARED, NOT PRESENTED\nQuote version '+observed.quoteRevision+' · £'+observed.terms.amount+' · planned quote date '+observed.terms.plannedQuoteDate+'\n'+observed.terms.wording+'\nRecorded by server at '+observed.recordedAt+' (not a sending or conversation time)\nCurrent quote version '+observed.currentQuoteRevision+' · £'+observed.currentTerms.amount+'\n'+observed.currentTerms.wording}</Text><Text style={styles.cardBody}>{observed.termsChanged?'Current quote terms differ. This reference describes the earlier version.':'Matching internal terms do not prove presentation or customer acceptance.'} No provider evidence, exact customer-response link or canonical booking-request relationship is established by this protocol. Original request/link/ledger and diary authority remain required. This read is not an earlier save receipt.</Text></>:null}
  {observed?<CanonicalQuoteRecipient key={observed.referenceId} s={s} customerId={customerId} record={record} reference={observed} sourceBlocked={sourceBlocked} sourceReviewEpoch={sourceReviewEpoch}/>:null}
 </Card>;
}
