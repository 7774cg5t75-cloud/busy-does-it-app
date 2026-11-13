import React from 'react';
import {Alert,Text} from 'react-native';
import {Card,Field,Button} from './ui';
import {styles} from '../theme/styles';
import {isApprovedQuoteProjection,formatApprovedQuoteProjection,QUOTE_DECISION_LABELS} from '../core/quoteAccessPolicy.mjs';
import {BUSINESS_APP_QUOTATIONS_ENABLED} from '../core/businessAppQuoteSession.mjs';
import {useOwnerEditNavigation} from '../screens/useOwnerEditNavigation';
// Original request screen composition only. No live route, client authority or quote fetch.
export function BusinessAppQuotationEntry(){if(!BUSINESS_APP_QUOTATIONS_ENABLED)return null;return null;}
export function BusinessAppQuoteReview({s,session}){
 const [observed,setObserved]=React.useState(null),[question,setQuestion]=React.useState(''),[notice,setNotice]=React.useState(''),[busy,setBusy]=React.useState(false);
 const epoch=React.useRef(0),flight=React.useRef(false),mounted=React.useRef(true),live=React.useRef(null);live.current={question,session};
 React.useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;};},[]);
 React.useEffect(()=>{if(!observed)return;const delay=Date.parse(observed.idleExpiresAt)-Date.now();const timer=setTimeout(()=>{if(mounted.current){setObserved(v=>v===observed?null:v);setNotice('Viewing eligibility expired. Renewed authentication and current server eligibility are required. Your question is kept.');}},Math.max(0,Math.min(delay,2147483647)));timer?.unref?.();return()=>clearTimeout(timer);},[observed,session]);
 const target=React.useRef(session.context());
 const report=useOwnerEditNavigation(s,{source:session,projectId:'business-app-quote:'+target.current.presentationId,revision:observed?.quoteVersion||0},()=>{epoch.current++;setQuestion('');live.current.question='';return true;});
 React.useEffect(()=>{report(!!question);},[question,session]);
 const current=()=>mounted.current&&live.current.session===session&&session.current();
 const run=async(task,kind='read')=>{if(!current()||flight.current)return false;flight.current=kind;setBusy(true);try{return await task();}finally{flight.current=false;if(mounted.current)setBusy(false);}};
 const inspect=()=>run(async()=>{const e=epoch.current,r=await session.read();if(!current())return false;
  if(e!==epoch.current){setNotice('Newer question wording kept. Review current quotation eligibility again.');return false;}
  if(r.status!=='available'){setObserved(null);setNotice('Quotation unavailable or viewing session expired. Your question is kept. No quote access, response or renewal is claimed.');return false;}
  setObserved(r.observation);setNotice('Exact quotation inspected in isolated local validation. Availability, viewing and a customer decision are separate facts.');return true;
 });
 const editor=()=>({typingEpoch:epoch.current,question:live.current.question,target:session.context()});
 const decide=action=>{
  if(!current()||flight.current||!session.isObservation(observed))return false;
  const ticket=session.review({observation:observed,action,question:action==='question'?question:'',operationId:'quote_decision_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,10),editor:editor()});if(!ticket)return false;let used=false;
  Alert.alert('Review '+QUOTE_DECISION_LABELS[action],(action==='question'?question:action==='request_to_proceed'?'This records interest only. It does not create an order, payment obligation, appointment or reservation.':'This declines this quotation only. It does not cancel separately confirmed work.')+'\n\nQuote '+observed.projection.quoteIdentifier+' · version '+observed.quoteVersion+'\n'+observed.projection.scope+'\nTotal £'+observed.projection.total+'\n\nLocal validation only; no customer communication, booking, invoice or payment.',[
   {text:'Keep reviewing',style:'cancel',onPress:()=>{used=true;session.cancel(ticket);}},
   {text:'Record reviewed '+QUOTE_DECISION_LABELS[action],onPress:()=>{if(used||!current()||flight.current)return false;used=true;return run(async()=>{const r=await session.commit(ticket,editor);if(!current())return false;setObserved(null);
    if(r.status==='confirmed'){setNotice('Exact non-binding local validation receipt received. Owner review remains required. No booking, invoice, payment or sending occurred.');return true;}
    setNotice(r.status==='unknown'?'Outcome uncertain. Do not replay. A later observation cannot recover an acknowledgement.':'Review changed. Your wording is kept.');return false;
   },'write');}}
  ]);return true;
 };
 if(!current())return <Card title="Quotation unavailable" body="Current authenticated account and exact request eligibility are required."/>;
 const v=session.isObservation(observed)&&isApprovedQuoteProjection(observed?.projection)?observed:null;
 return <Card eyebrow="Business App quotation · local validation" title={v?v.projection.quoteIdentifier:'Review your quotation'} body="Customer route and execution are disabled. This source component is verified with fictional local evidence.">
  {notice?<Text accessibilityLiveRegion="polite" style={styles.cardBody}>{notice}</Text>:null}
  <Button label="Inspect current quotation" disabled={busy} onPress={inspect}/>
  {v?<Text selectable style={styles.cardBody}>{formatApprovedQuoteProjection(v.projection)}</Text>:null}
  <Field label="Question about this exact quotation" multiline value={question} editable={flight.current!=='write'} onChangeText={v=>{if(!current()||flight.current==='write')return false;epoch.current++;live.current.question=v;setQuestion(v);report(!!v);}}/>
  {v?['request_to_proceed','decline','question'].map(action=><Button key={action} label={'Review '+QUOTE_DECISION_LABELS[action]} disabled={busy||['pending','unknown'].includes(session.status().status)||action==='question'&&!question.trim()} onPress={()=>decide(action)}/>):null}
  <Text style={styles.cardBody}>Request to proceed is non-binding and needs business review. Decline and Ask a question are not acceptance. Binding acceptance is unavailable. No action confirms work or creates an invoice or payment.</Text>
 </Card>;
}
