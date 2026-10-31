import React from 'react';
import {Text,Alert} from 'react-native';
import {Card,Field,Button} from './ui';
import {styles} from '../theme/styles';
import {stableJson} from '../core/stableJson.mjs';
import {useOwnerEditNavigation} from '../screens/useOwnerEditNavigation';

// Disabled proposal: append-only owner decisions, never external acceptance.
export function CanonicalAgreementDecision({s,customerId,record,evidence,sourceBlocked=false,sourceReviewEpoch=0}){
 const api=s.canonicalWork,scope=s.ownerWorkspaceScope;
 const [words,setWords]=React.useState(''),[binding,setBinding]=React.useState(null),[busy,setBusy]=React.useState(false),[notice,setNotice]=React.useState(''),[readback,setReadback]=React.useState(null),[readiness,setReadiness]=React.useState(null);
 const epoch=React.useRef(0),flight=React.useRef(false),live=React.useRef(null),mounted=React.useRef(true);
 const stamp=stableJson([scope===undefined,s.ownerSession?.userId,s.cloudWorkspace?.businessId,s.cloudWorkspace?.role,customerId,record,evidence.evidenceId,s.screen,s.cloudRevision,sourceBlocked,sourceReviewEpoch]);
 live.current={scope,stamp,words};
 React.useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;};},[]);
 const current=()=>mounted.current&&live.current.scope===scope&&live.current.stamp===stamp&&s.cloudWorkspace?.role==='owner';
 const report=useOwnerEditNavigation(s,{source:record,projectId:'agreement-decision:'+evidence.evidenceId,revision:record.revision},()=>{epoch.current++;live.current.words='';setWords('');return true;});
 React.useEffect(()=>{report(!!words);},[words,record,scope]);
 const eligible=()=>current()&&!sourceBlocked&&!['pending','unknown'].includes(api.status().status)&&api.isDecisionContext(binding)&&binding.revision===record.revision&&binding.reportState!=='withdrawn';
 const inspect=async()=>{
  if(!current()||sourceBlocked||flight.current)return false;const typing=epoch.current;flight.current='read';setBusy(true);
  try{const v=await api.decisionContext(customerId,record.engagementId,evidence.evidenceId,record.revision);if(!current())return false;if(epoch.current!==typing){setNotice('Newer wording kept. Review the report again.');return false;}setReadback(null);setBinding(v);setNotice(v.reportState==='withdrawn'?'This report is withdrawn. No new decision is supported.':'Current report inspected. Review a correction or withdrawal; original evidence will remain unchanged.');return true;}
  catch{if(current())setNotice('Current review unavailable. Your words are kept; no authority or missing record is inferred.');return false;}
  finally{flight.current=false;if(mounted.current)setBusy(false);}
 };
 const inspectReadiness=async()=>{
  if(!current()||flight.current)return false;flight.current='read';setBusy(true);
  try{const v=await api.bookingReadiness(customerId,record.engagementId,evidence.evidenceId);if(!current())return false;setReadiness(v);return true;}
  catch{if(current())setNotice('Readiness unavailable. No booking relationship or permission is inferred. Your words are kept.');return false;}
  finally{flight.current=false;if(mounted.current)setBusy(false);}
 };
 const review=action=>{
  if(!eligible()||flight.current||!words.trim())return false;
  const fields={action,text:words},editor=()=>({customerId,engagementId:record.engagementId,evidenceId:evidence.evidenceId,view:s.screen,typingEpoch:epoch.current,purpose:'agreement_decision',sourceStamp:stamp,fields:{action,text:live.current.words}});
  const ticket=api.review({operation:'decision',record:binding,fields,operationId:'report_decision_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,10),editor:editor()});if(!ticket){setNotice('Decision review unavailable. Keep your wording; inspect current evidence again.');return false;}
  const typing=epoch.current;let used=false;
  Alert.alert(action==='correct'?'Correct owner report — still unverified':'Withdraw owner report — not deletion','Original report '+evidence.evidenceId+' · quote version '+binding.quoteRevision+'\nOriginal account:\n'+binding.originalOwnerAccount+'\nCurrent account:\n'+(binding.currentOwnerAccount??'Withdrawn')+'\n\n'+(action==='correct'?'Proposed corrected account:':'Reason for withdrawal:')+'\n'+words+'\n\nNo acceptance, booking, diary or customer message will change.',[
   {text:'Keep editing',style:'cancel',onPress:()=>{used=true;api.cancel(ticket);}},
   {text:action==='correct'?'Record reviewed correction':'Record reviewed withdrawal',onPress:async()=>{
    if(used||!eligible()||flight.current||epoch.current!==typing)return false;used=true;flight.current='save';setBusy(true);let acknowledged=false;
    try{const result=await api.commit(ticket,editor);if(!current())return false;if(result.status!=='confirmed'){setNotice(result.status==='unknown'?'Decision outcome uncertain. Keep your words; do not replay. History cannot recreate an acknowledgement.':'Review expired. Your words are kept.');return false;}acknowledged=true;setReadiness(null);setNotice('Exact decision receipt received. This records the owner decision only.');const v=await api.agreementRead(customerId,record.engagementId,evidence.evidenceId);if(!current())return false;if(v.decisionRevision!==result.receipt.revision||v.decisionId!==result.receipt.decisionId||v.decisionStatement!==ticket.fields.text||v.reportState!==(action==='correct'?'corrected':'withdrawn'))throw Error('Decision readback differs');setReadback(v);setBinding(null);if(epoch.current===typing){setWords('');live.current.words='';report(false);}return true;}
    catch{if(current())setNotice(acknowledged?'Decision receipt retained; current readback unavailable. Do not replay.':'Decision unavailable. Your words are kept.');return false;}
    finally{flight.current=false;if(mounted.current)setBusy(false);}
   }}
  ]);return true;
 };
 if(!api?.decisionEnabled)return null;
 const observed=readback||binding||evidence;
 return <Card eyebrow="Local proposal · owner decisions" title="Correct or withdraw this report" body="Original evidence stays immutable. A correction remains unverified; withdrawal is not deletion or lawful erasure.">
  {notice?<Text accessibilityLiveRegion="polite" style={styles.cardBody}>{notice}</Text>:null}
  <Text selectable style={styles.cardBody}>{'Report state: '+(observed.reportState||'original')+' · decision version '+(observed.decisionRevision||0)+'\n'+(observed.currentOwnerAccount??(observed.reportState==='withdrawn'?'No current owner account':observed.ownerAccount))}</Text>
  <Button label="Inspect current report before a decision" disabled={busy||sourceBlocked} onPress={inspect}/>
  <Button label="Review booking readiness without making a booking" disabled={busy||sourceBlocked} onPress={inspectReadiness}/>
  {readiness?<Text selectable style={styles.cardBody}>{'Readiness observation · report '+readiness.reportState+' · unverified\nCaptured quote version '+readiness.quoteRevision+'; current version '+readiness.currentQuoteRevision+'\n'+(readiness.termsChanged?'Quote terms changed. This report does not apply to the new terms.':'Internal terms match; customer acceptance is still unverified.')+'\nNo exact canonical/request association is established by this protocol. No booking is authorised.\nStill required:\n'+readiness.requirements.join('\n')}</Text>:null}
  <Field label="Corrected account or reason for withdrawal" multiline value={words} editable={flight.current!=='save'&&!sourceBlocked&&s.cloudWorkspace?.role==='owner'} onChangeText={v=>{if(!current()||sourceBlocked||flight.current==='save')return false;epoch.current++;live.current.words=v;setWords(v);report(!!v);}}/>
  <Button label="Review correction" disabled={busy||!eligible()||!words.trim()} onPress={()=>review('correct')}/>
  <Button label="Review withdrawal" disabled={busy||!eligible()||!words.trim()} onPress={()=>review('withdraw')}/>
 </Card>;
}
