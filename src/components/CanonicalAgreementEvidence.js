import React from 'react';
import {CanonicalAgreementDecision} from './CanonicalAgreementDecision';
import {Text,Alert} from 'react-native';
import {Card,Field,Button} from './ui';
import {styles} from '../theme/styles';
import {stableJson} from '../core/stableJson.mjs';
import {useOwnerEditNavigation} from '../screens/useOwnerEditNavigation';

// Formal stored owner report, not customer acceptance. Words stay in this specialist.
export function CanonicalAgreementEvidence({s,customerId,record,sourceBlocked=false,sourceReviewEpoch=0}){
 const api=s.canonicalWork,scope=s.ownerWorkspaceScope,owner=s.ownerSession?.userId,business=s.cloudWorkspace?.businessId;
 const [words,setWords]=React.useState(''),[binding,setBinding]=React.useState(null),[page,setPage]=React.useState(null),[observed,setObserved]=React.useState(null),[notice,setNotice]=React.useState(''),[busy,setBusy]=React.useState(false);
 const epoch=React.useRef(0),flight=React.useRef(false),live=React.useRef(null),mounted=React.useRef(true),bound=React.useRef({scope,owner,business,customerId,id:record.engagementId});
 React.useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;};},[]);
 const identity=stableJson([record,s.cloudRevision,s.screen,sourceReviewEpoch]);
 live.current={scope,owner,business,customerId,record,identity,words,role:s.cloudWorkspace?.role,blocked:sourceBlocked};
 const visible=bound.current.scope===scope&&bound.current.owner===owner&&bound.current.business===business&&bound.current.customerId===customerId&&bound.current.id===record.engagementId;
 const current=()=>visible&&mounted.current&&live.current.scope===scope&&live.current.owner===owner&&live.current.business===business&&live.current.role==='owner'&&live.current.identity===identity;
 const editable=()=>current()&&!live.current.blocked&&api.isAgreementContext(binding)&&binding.revision===record.revision&&binding.recordHash===record.recordHash;
 const editor=()=>({customerId,engagementId:record.engagementId,view:s.screen,typingEpoch:epoch.current,sourceStamp:identity,purpose:'owner_reported_offline',fields:{text:live.current.words}});
 const report=useOwnerEditNavigation(s,{source:record,projectId:'canonical-agreement:'+record.engagementId,revision:record.revision},()=>{epoch.current++;live.current.words='';setWords('');return true;});
 React.useEffect(()=>{report(visible&&!!words);},[visible,words,record,scope]);
 const inspect=async(kind,arg=null)=>{
  if(!current()||flight.current)return false;flight.current='read';setBusy(true);const typing=epoch.current;
  try{
   const value=kind==='terms'?await api.agreementContext(customerId,record.engagementId,record.revision):kind==='list'?await api.agreementList(customerId,record.engagementId,arg):await api.agreementRead(customerId,record.engagementId,arg);
   if(!current())return false;
   if(kind==='terms'){if(epoch.current!==typing){setNotice('Newer words were kept. Review terms again before recording a report.');return false;}setBinding(value);setNotice('Exact internal Prepared terms reviewed. This is not proof of an offer, delivery or customer acceptance.');}
   else if(kind==='list')setPage(value);else setObserved(value);
   return true;
  }catch{if(current())setNotice('Evidence inspection unavailable. Your words are kept; no missing evidence or earlier save is inferred.');return false;}
  finally{flight.current=false;if(mounted.current)setBusy(false);}
 };
 const review=()=>{
  if(!editable()||flight.current||!words.trim()||['unknown','pending'].includes(api.status().status))return false;
  const ticket=api.review({operation:'agreement',record:binding,fields:{text:words},operationId:'agreement_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,12),editor:editor()});if(!ticket){setNotice('Report review unavailable. Check current terms and the 5,000-byte account limit; your exact words were kept.');return false;}
  const typing=epoch.current;let used=false;
  Alert.alert('Record owner report — not acceptance','Quote version '+binding.revision+' · £'+binding.terms.amount+'\nExact internal quote wording:\n'+binding.terms.wording+'\n\nOwner-reported verbal/offline account (unverified):\n'+words+'\n\nServer recording time is not an acceptance date. No quote, booking, diary or message state changes.',[
   {text:'Keep editing',style:'cancel',onPress:()=>{used=true;api.cancel(ticket);}},
   {text:'Record reviewed owner report',onPress:async()=>{
    if(used||!editable()||epoch.current!==typing||flight.current)return false;used=true;flight.current='save';setBusy(true);let acknowledged=false;
    try{
     const result=await api.commit(ticket,editor);if(!current())return false;
     if(result.status!=='confirmed'){setNotice(result.status==='unknown'?'Report outcome uncertain. Keep your words. No automatic retry; matching history cannot recover an acknowledgement.':'Review expired. Your words are kept.');return false;}
     acknowledged=true;setNotice('Exact owner-report receipt received. It proves recording only, not customer agreement or booking permission.');
     const value=await api.agreementRead(customerId,record.engagementId,result.receipt.evidenceId);if(!current())return false;
     if(value.termsHash!==result.receipt.termsHash||value.ownerAccount!==ticket.fields.text||value.quoteRevision!==binding.revision)throw Error('Report readback differs');
     setObserved(value);if(epoch.current===typing){setWords('');live.current.words='';report(false);}setBinding(null);return true;
    }catch{if(current())setNotice(acknowledged?'Exact report receipt retained; current readback unavailable. Do not replay.':'Report could not be reviewed. No successful recording is claimed.');return false;}
    finally{flight.current=false;if(mounted.current)setBusy(false);}
   }}
  ]);return true;
 };
 if(!api?.agreementEnabled||!visible)return null;
 return <Card eyebrow="Owner-reported evidence · unverified" title="Quote agreement reports" body={'Engagement '+record.engagementId+'. Separate from Work notes and follow-up wording. Recording a report never marks the quote Accepted.'}>
  {notice?<Text accessibilityLiveRegion="polite" style={styles.cardBody}>{notice}</Text>:null}
  <Button label="Review exact quote terms for an owner report" disabled={busy||sourceBlocked} onPress={()=>inspect('terms')}/>
  {binding?<Text selectable style={styles.cardBody}>{'Internal Prepared quote · version '+binding.revision+' · £'+binding.terms.amount+' · planned quote date '+binding.terms.plannedQuoteDate+'\n'+binding.terms.wording}</Text>:null}
  <Field label="Owner-reported verbal or offline account" multiline value={words} editable={flight.current!=='save'&&!sourceBlocked&&s.cloudWorkspace?.role==='owner'} onChangeText={v=>{if(!current()||sourceBlocked||flight.current==='save')return false;epoch.current++;live.current.words=v;setWords(v);report(!!v);}}/>
  <Button label="Review recording this owner report" disabled={busy||!editable()||!words.trim()||['unknown','pending'].includes(api.status().status)} onPress={review}/>
  <Button label="Inspect recorded owner reports" disabled={busy} onPress={()=>inspect('list')}/>
  {page?.items.map(row=><Button key={row.evidenceId} label={'Inspect owner report '+row.evidenceId+' · quote version '+row.quoteRevision} disabled={busy} onPress={()=>inspect('read',row.evidenceId)}/>)}
  {page?.nextCursor?<Button label="Next owner report page" disabled={busy} onPress={()=>inspect('list',page.nextCursor)}/>:null}
  {observed?<><Text selectable style={styles.cardBody}>{'Owner report '+observed.evidenceId+' · '+(observed.reportState||'original')+' · UNVERIFIED · quote version '+observed.quoteRevision+'\nRecorded by server at '+observed.recordedAt+' (not an external agreement time)\nCaptured amount £'+observed.terms.amount+'\n'+observed.terms.wording+'\nOwner account:\n'+observed.ownerAccount}</Text><Text selectable style={styles.cardBody}>{'Current quote version '+observed.currentQuoteRevision+' · £'+observed.currentTerms.amount+'\n'+observed.currentTerms.wording}</Text><Text style={styles.cardBody}>{observed.termsChanged?'Quote version/terms differ. This old report cannot establish agreement to the current quote.':'Matching internal terms do not prove customer acceptance.'} No canonical booking association is established by this protocol; original request/link/diary authority remains required. This read is not a receipt for a prior session.</Text></>:null}
  {observed?<CanonicalAgreementDecision key={observed.evidenceId} s={s} customerId={customerId} record={record} evidence={observed} sourceBlocked={sourceBlocked} sourceReviewEpoch={sourceReviewEpoch}/>:null}
 </Card>;
}
