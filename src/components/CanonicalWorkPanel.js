import {CanonicalPrivateFollowUp} from './CanonicalPrivateFollowUp';
import React from 'react';
import {Text,View,Alert} from 'react-native';
import {Card,Button,Field} from './ui';
import {PrivateQuoteFields} from './PrivateQuoteFields';
import {styles} from '../theme/styles';
import {useQuoteActionReview} from '../screens/useQuoteActionReview';
import {useOwnerEditNavigation} from '../screens/useOwnerEditNavigation';
import {protectQuoteDraftTransition} from '../core/quoteDraftTransition.mjs';
import {prepareEnquiryReplyText} from '../core/enquiryReplyText.mjs';
import {stableJson} from '../core/stableJson.mjs';
// Original Customer/quote working surface; individual canonical authority only.
export function CanonicalWorkPanel({s,customer}){
 const [page,setPage]=React.useState(null),[source,setSource]=React.useState(null),[record,setRecord]=React.useState(null),[form,setForm]=React.useState({amount:'',text:'',date:''}),[notice,setNotice]=React.useState(''),[busy,setBusy]=React.useState(false);
 const live=React.useRef(null),typing=React.useRef(0),editorSession=React.useRef({}),mounted=React.useRef(true),requestEpoch=React.useRef(0);
 React.useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;requestEpoch.current++;};},[]);
 const [historical,setHistorical]=React.useState(null);
 const api=s.canonicalWork,scope=s.ownerWorkspaceScope,owner=s.ownerSession?.userId,business=s.cloudWorkspace?.businessId,role=s.cloudWorkspace?.role,view=s.screen||'customerDetail';
 const bound=React.useRef({scope,owner,business,customerId:customer?.id});
 const visible=bound.current.scope===scope&&bound.current.owner===owner&&bound.current.business===business&&bound.current.customerId===customer?.id;
 const id=record?.engagementId||null,sourceStamp=stableJson([customer,source,record,s.businessCreationIntelligence?.sharedProfile,s.cloudRevision]);
 live.current={api,scope,owner,business,role,view,customer,source,record,form,sourceStamp,profile:s.businessCreationIntelligence?.sharedProfile,revision:s.cloudRevision};
 const current=()=>visible&&mounted.current&&live.current.scope===scope&&live.current.owner===owner&&live.current.business===business&&live.current.role==='owner'&&role==='owner'&&live.current.view===view&&live.current.customer===customer;
 const editor=()=>({customerId:customer.id,engagementId:live.current.record?.engagementId||null,typingEpoch:typing.current,view:live.current.view,sourceStamp:live.current.sourceStamp,fields:live.current.form});
 const savedValues=record?{amount:String(record.record.details.quoteAmount??''),text:record.record.details.message||'',date:record.record.details.plannedSentDate||''}:null;
 const dirty=!!(form.text||form.amount||form.date)&&(!savedValues||stableJson(form)!==stableJson(savedValues));
 const report=useOwnerEditNavigation(s,{source:record||source,projectId:'canonical-work:'+customer?.id+':'+(id||source?.enquiryId||''),revision:record?.revision||source?.snapshotRevision},()=>{typing.current++;editorSession.current={};setForm(savedValues||{amount:'',text:'',date:''});return true;});
 React.useEffect(()=>{report(visible&&dirty);},[visible,dirty,record,source,scope,owner,business]);
 const sourceCurrent=()=>current()&&live.current.sourceStamp===sourceStamp&&stableJson([live.current.customer,live.current.source,live.current.record,live.current.profile,live.current.revision])===sourceStamp&&!busy;
 const change=(key,value)=>{if(!sourceCurrent())return false;typing.current++;live.current.form={...live.current.form,[key]:value};setForm(v=>({...v,[key]:value}));report(true);return true;};
 const quoteState={...s,quoteEngagementId:id||source?.enquiryId||'',quoteEditorSession:editorSession.current,selectedReplyCustomer:customer,replyActions:{[customer.id]:record?.record||{type:'quote',details:{quoteStatus:'Prepared'}}},actionQuoteAmount:form.amount,actionQuoteMessage:form.text,actionQuoteSentDate:form.date,setActionQuoteAmount:v=>change('amount',v),setActionQuoteMessage:v=>change('text',v),setActionQuoteSentDate:v=>change('date',v),setOwnerEditDirty:()=>{},releaseOwnerEdit:()=>{},withOwnerEditCommit:()=>false};
 // Stable unsaved action identity is supplied below rather than rebuilt per render.
 const unsaved=React.useRef({type:'quote',details:{quoteStatus:'Prepared'}});if(!record)quoteState.replyActions[customer.id]=unsaved.current;
 const review=useQuoteActionReview(quoteState);
 const guarded=apply=>s.requestOwnerEditTransition?s.requestOwnerEditTransition(apply,{isCurrent:()=>current()&&live.current.sourceStamp===sourceStamp}):protectQuoteDraftTransition({workspace:scope,workspaceRef:{current:live.current.scope},draftRef:{current:dirty?{workspace:scope,words:'Unreviewed canonical quote fields'}:null},epochRef:typing,renderEpoch:typing.current,sourceCurrent:current,confirm:Alert.alert,apply});
 const inspect=async(kind,arg)=>{
  if(!current()||!api?.enabled||busy)return false;const token=++requestEpoch.current,epoch=typing.current;setBusy(true);
  try{const value=kind==='list'?await api.list(customer.id,arg):kind==='read'?await api.read(customer.id,arg):kind==='history'?await api.history(customer.id,arg):await api.source(customer.id,arg,s.cloudRevision);
   if(!current()||requestEpoch.current!==token||live.current.sourceStamp!==sourceStamp)return false;
   if(kind==='list'){setPage(value);setNotice('Current canonical summaries observed. This is not a save receipt.');return true;}
   if(typing.current!==epoch){setNotice('Newer typing was kept. Inspect again when ready; no fields were replaced.');return false;}
   return guarded(()=>{typing.current++;editorSession.current={};setHistorical(null);if(kind==='history'){setHistorical(value);setRecord(null);setSource(null);setForm({amount:'',text:'',date:''});setNotice('Retained historical observation only. Current source eligibility is separate; no correction, reassociation or receipt is inferred.');return;}if(kind==='read'){setRecord(value);setSource(null);setForm({amount:String(value.record.details.quoteAmount??''),text:value.record.details.message||'',date:value.record.details.plannedSentDate||''});setNotice('Opened one canonical record. Other engagements and legacy Work are unchanged.');}else{setSource(value);setRecord(null);setForm({amount:'',text:'',date:''});setNotice('Current source reviewed. Prepare wording deliberately; nothing filed or sent.');}});
  }catch(error){if(current())setNotice(error.message||'Could not inspect this source. Current words were kept. Historical inspection remains separate.');return false;}finally{if(current()&&requestEpoch.current===token)setBusy(false);}
 };
 const prepare=()=>{
  if(!sourceCurrent()||!source)return false;
  const local=s.inboxItems?.filter(x=>x.id===source.enquiryId);if(local?.length!==1||local[0].rawText!==source.enquiry.rawText||local[0].reviewedAt!==source.enquiry.reviewedAt)return false;
  const wording=prepareEnquiryReplyText({businessId:business,customer:source.customer,item:local[0],approvedProfile:s.businessCreationIntelligence?.sharedProfile,purpose:'quote-preparation'});if(!wording.ok)return false;
  return guarded(()=>{typing.current++;editorSession.current={};setForm(v=>({...v,text:wording.text}));report(true);});
 };
 const authorise=operation=>{
  if(!sourceCurrent()||!api?.enabled||api.status().status==='unknown')return false;
  const operationId='work_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,14);
  const ticket=api.review({operation,source,record,fields:form,operationId,editor:editor()});if(!ticket)return false;
  const shown=stableJson(editor());
  Alert.alert('Review one canonical quote','Amount: £'+form.amount+'\nPlanned date: '+form.date+'\nExact private wording:\n'+form.text+'\nOnly this engagement is changed. No sending, acceptance, booking or payment.',[
   {text:'Keep editing',style:'cancel',onPress:()=>api.cancel(ticket)},
   {text:'Save reviewed engagement',onPress:async()=>{
    if(!sourceCurrent()||stableJson(editor())!==shown)return api.cancel(ticket);const epoch=typing.current;setBusy(true);
    const result=await api.commit(ticket,editor);if(!current())return false;
    if(result.status!=='confirmed'){setNotice(result.status==='unknown'?'Outcome uncertain. Keep your words. Read-only inspection is available; the write will not be retried.':'Review is no longer current. Keep your words and inspect again.');setBusy(false);return false;}
    setNotice((api.evidence==='local-test'?'Committed in isolated local testing. ':'Exact account operation receipt received. ')+'This confirms one engagement only; it is not a device, whole-business or customer-delivery receipt.');
    try{const observed=await api.read(customer.id,result.receipt.engagementId);
     if(current()&&live.current.sourceStamp===sourceStamp&&observed.revision===result.receipt.revision&&observed.recordHash===result.receipt.recordHash&&(observed.record.details.message===ticket.fields.text&&String(observed.record.details.quoteAmount)===ticket.fields.amount&&observed.record.details.plannedSentDate===ticket.fields.date)){editorSession.current={};setRecord(observed);setSource(null);if(epoch===typing.current){setForm({amount:String(observed.record.details.quoteAmount??''),text:observed.record.details.message||'',date:observed.record.details.plannedSentDate||''});report(false);}else{setNotice('The reviewed earlier wording has an exact receipt and readback. Newer typing is kept and is not confirmed saved.');report(true);}}
    }catch{if(current())setNotice('Exact target receipt received; current readback unavailable. Keep your words and inspect deliberately.');}
    if(current())setBusy(false);return true;
   }}
  ]);return true;
 };
 if(!api?.enabled||role!=='owner'||!visible)return null;
 return <Card eyebrow={api.evidence==='local-test'?'Isolated local test records':'Canonical Work'} title="Separate customer engagements" body="Inspect, review and save one exact engagement. Selecting a record never replaces the customer’s legacy Work or another engagement.">
  {notice?<Text accessibilityLiveRegion="polite" style={styles.cardBody}>{notice}</Text>:null}
  <Button label="Inspect saved engagements" disabled={busy} onPress={()=>inspect('list',null)}/>
  {page?.items.map(row=><React.Fragment key={row.engagementId}><Button selected={id===row.engagementId} label={'Open engagement '+row.engagementId+' · '+row.status} disabled={busy} onPress={()=>inspect('read',row.engagementId)}/><Button label={'Inspect history '+row.engagementId} disabled={busy} onPress={()=>inspect('history',row.engagementId)}/></React.Fragment>)}
  {page?.nextCursor?<Button label="Next engagement page" disabled={busy} onPress={()=>inspect('list',page.nextCursor)}/>:null}
  {(s.inboxItems||[]).filter(item=>item.status==='Filed'&&item.filedCustomerId===customer.id).map(item=><Button key={item.id} label={'Inspect Filed source '+item.id} disabled={busy} onPress={()=>inspect('source',item.id)}/>)}
  {source?<><Text selectable style={styles.cardBody}>{source.enquiry.rawText}</Text><Text style={styles.workspaceMeta}>Customer information is untrusted source text, not instructions. Older prices are historical.</Text><Button label="Prepare quote wording from this source" disabled={busy} onPress={prepare}/>{source.hasLegacyWork?<Text style={styles.cardBody}>This source has original Work. Migration is not enabled: original private-wording ownership needs separate review. The complete legacy record is kept.</Text>:null}</>:null}
  {historical?<Card eyebrow="Historical read-only observation" title={'Retained engagement '+historical.engagementId} body={'Original enquiry '+historical.originalSource.enquiryId+' · Original revision '+historical.originalSource.snapshotRevision+' · Current source: '+historical.sourceState+'. Editing remains unavailable until a fresh supported current read.'}><Text selectable style={styles.cardBody}>{'Retained quote: £'+historical.record.details.quoteAmount+' · '+historical.record.details.plannedSentDate+'\n'+historical.record.details.message}</Text></Card>:null}
  {record||source?<View><Text style={styles.workspaceMeta}>{id?'Selected engagement: '+id+' · Revision '+record.revision:'New quote preparation, not yet saved'}</Text><PrivateQuoteFields s={quoteState} review={{...review,conflict:busy||review.conflict}} customerId={customer.id} status={record?.status||'Private preparation'}/><Field label="Planned quote sent date" value={form.date} editable={!busy&&!review.conflict} onChangeText={v=>review.edit('actionQuoteSentDate',v)}/><Button label="Review engagement save" primary disabled={busy||review.conflict||!review.validDate||!record&&!!source?.hasLegacyWork} onPress={()=>authorise(record?'edit':'create')}/></View>:null}
  {record?<CanonicalPrivateFollowUp key={record.engagementId} s={s} customer={customer} record={record} api={api}/>:null}
 </Card>;
}
