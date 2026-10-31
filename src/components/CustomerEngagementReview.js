import React from 'react';
import {Text,View,Alert} from 'react-native';
import {Card,Button,Field} from './ui';
import {styles} from '../theme/styles';
import {PrivateQuoteFields} from './PrivateQuoteFields';
import {useQuoteActionReview} from '../screens/useQuoteActionReview';
import {useOwnerEditNavigation} from '../screens/useOwnerEditNavigation';
import {protectQuoteDraftTransition} from '../core/quoteDraftTransition.mjs';
import {stableJson} from '../core/stableJson.mjs';
import {prepareWorkEngagementProposal,inspectWorkEngagementProposal,reviewWorkEngagementQuote,engagementRecordedStatus} from '../core/workEngagementProposal.mjs';
// Finite migration/preparation review in the original Customer specialist.
// No persistence, Work setter, provider method, receipt or account authority.
export function CustomerEngagementReview({s,customer}){
 const [model,setModel]=React.useState(null),[selected,setSelected]=React.useState(''),[form,setForm]=React.useState({amount:'',text:'',date:''});
 const typing=React.useRef(0),session=React.useRef(null),fieldDirty=React.useRef(null),live=React.useRef(null),mounted=React.useRef(true);
 React.useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;};},[]);
 const action=s.replyActions?.[customer?.id],scope=s.ownerWorkspaceScope,actor=s.ownerSession?.userId,business=s.cloudWorkspace?.businessId,role=s.cloudWorkspace?.role,view=s.screen||'customerDetail';
 const context={bookingOperation:s.bookingStatusOperation,quoteCopy:s.privateQuoteSave,ownerId:actor,businessId:business,role,revision:s.cloudRevision,customer,customers:s.customers||[],inboxItems:s.inboxItems||[],action,profile:s.businessCreationIntelligence?.sharedProfile};
 const sourceCaptured=stableJson([context,selected,model]);
 const captured=stableJson([context,selected,model,form]);live.current={s,customer,action,scope,actor,business,role,view,context,selected,model,form,captured};
 const renderEpoch=typing.current;
 const current=()=>mounted.current&&live.current.scope===scope&&live.current.actor===actor&&live.current.business===business&&live.current.role===role&&role==='owner'&&live.current.view===view&&live.current.customer===customer&&live.current.action===action&&live.current.captured===captured&&stableJson([live.current.context,live.current.selected,live.current.model,live.current.form])===captured;
 const bound=!!model&&session.current?.scope===scope&&model.ownerId===actor&&model.businessId===business&&model.customerId===customer?.id;
 const fresh=()=>current()&&bound&&inspectWorkEngagementProposal(model,live.current.context);
 const report=useOwnerEditNavigation(s,{source:action,projectId:'engagement-proposal:'+customer?.id,revision:model?stableJson(model):''},()=>{typing.current++;session.current=null;setModel(null);setSelected('');fieldDirty.current=null;return true;});
 React.useEffect(()=>{if(bound)report(true);},[model,scope,actor,business,customer?.id]);
 const choose=(nextModel,id)=>{const entry=nextModel.engagements.find(e=>e.id===id);if(!entry)return false;typing.current++;session.current={scope};fieldDirty.current=null;setModel(nextModel);setSelected(id);setForm({amount:String(entry.record.details?.quoteAmount??''),text:entry.record.details?.message||'',date:entry.record.details?.plannedSentDate||''});report(true);return true;};
 const prepare=id=>{
  if(!current()||typing.current!==renderEpoch||model&&!fresh())return false;
  const proposed=prepareWorkEngagementProposal(context,id,model);if(!proposed)return false;
  let used=false;const epoch=typing.current;
  Alert.alert('Review another engagement',proposed.engagements.at(-1).record.details.message+'\n\nThe complete earlier Work record stays unchanged. This prepares a distinct quote in this session only. It does not save two engagements to the device or account. Enter a current price and planned date; historical prices are not reused.',[
   {text:'Keep current Work',style:'cancel',onPress:()=>{used=true;}},
   {text:'Prepare separate quote',onPress:()=>{if(used||!current()||typing.current!==epoch||fieldDirty.current?.dirty)return false;used=true;return choose(proposed,proposed.engagements.at(-1).id);}}
  ]);return true;
 };
 const entry=bound?model.engagements.find(e=>e.id===selected):null;
 const editable=fresh()&&entry?.evidence==='session-proposal';
 const inputCurrent=()=>mounted.current&&live.current.scope===scope&&live.current.actor===actor&&live.current.business===business&&live.current.role===role&&role==='owner'&&live.current.view===view&&live.current.customer===customer&&live.current.action===action&&stableJson([live.current.context,live.current.selected,live.current.model])===sourceCaptured;
 const setField=(key,value)=>{if(!editable||!inputCurrent())return false;typing.current++;live.current.form={...live.current.form,[key]:value};setForm(v=>({...v,[key]:value}));report(true);return true;};
 const quoteState={...s,screen:view,quoteEngagementId:selected,quoteEditorSession:session.current,selectedReplyCustomer:customer,replyActions:{[customer?.id]:entry?.record},actionQuoteAmount:form.amount,actionQuoteMessage:form.text,actionQuoteSentDate:form.date,
  setActionQuoteAmount:v=>setField('amount',v),setActionQuoteMessage:v=>setField('text',v),setActionQuoteSentDate:v=>setField('date',v),setOwnerEditDirty:value=>{fieldDirty.current=value;report(true);},releaseOwnerEdit:()=>{},withOwnerEditCommit:()=>false};
 const quoteReview=useQuoteActionReview(quoteState);
 const select=id=>{
  if(!fresh()||typing.current!==renderEpoch||!model.engagements.some(e=>e.id===id))return false;
  if(id===selected)return true;
  return protectQuoteDraftTransition({workspace:scope,workspaceRef:{current:live.current.scope},draftRef:{current:fieldDirty.current?.dirty?{workspace:scope,words:'Unsaved quote fields'}:null},epochRef:typing,renderEpoch,sourceCurrent:fresh,confirm:Alert.alert,apply:()=>choose(model,id),promptTitle:'Keep editing this engagement?',promptBody:'Switching records discards only the unreviewed fields in this session. The original Work record stays unchanged.'});
 };
 const review=()=>{
  if(!editable||!current()||typing.current!==renderEpoch)return false;
  const proposed=reviewWorkEngagementQuote(model,context,selected,form);if(!proposed)return false;
  let used=false;const epoch=typing.current;
  Alert.alert('Review this quote proposal','Current proposal:\n'+JSON.stringify(entry.record.details)+'\n\nReviewed amount: £'+form.amount+'\nPlanned date: '+form.date+'\nExact wording:\n'+form.text+'\n\nKeep both complete records for comparison in this session only. Nothing is saved, issued, sent, accepted, booked or paid.',[
   {text:'Keep editing',style:'cancel',onPress:()=>{used=true;}},
   {text:'Keep reviewed proposal in session',onPress:()=>{if(used||!fresh()||typing.current!==epoch)return false;used=true;return choose(proposed,selected);}}
  ]);return true;
 };
 if(role!=='owner'||!actor||!business||!customer)return null;
 const candidates=(s.inboxItems||[]).filter(item=>prepareWorkEngagementProposal(context,item.id,bound?model:null));
 if(!bound&&!candidates.length)return action?<Card eyebrow="Multiple engagements" title="Keep the original Work record" body="Another engagement cannot be prepared from these records yet. Exact current Filed-enquiry sources are required for both records; missing, duplicate, unsupported or conflicting sources are not guessed. An unresolved booking or device-write outcome must be inspected first. Your existing Work stays unchanged."/>:null;
 return <Card eyebrow="Multiple engagements · preparation" title="Keep earlier Work, prepare another enquiry" body="A bounded review of the original Work model. Complete records below are session-only proposals, not a new saved Work store. Leaving requires a deliberate discard; account and device storage are not enabled.">
  {bound&&!fresh()?<Text accessibilityLiveRegion="polite" style={styles.cardBody}>The customer, source, permissions, revision or operation evidence changed. Your proposal and typed words are kept here. New review is required; no action was retried or saved.</Text>:null}
  {candidates.map(item=><Button key={item.id} label={'Review separate quote for enquiry '+item.id} disabled={!!bound&&!fresh()||!!fieldDirty.current?.dirty} onPress={()=>prepare(item.id)}/>)}
  {bound?model.engagements.map(e=><Button key={e.id} selected={selected===e.id} label={(e.evidence==='workspace-record'?'Original Work':'Session quote proposal')+' · '+e.source.reference.inboxId+' · '+engagementRecordedStatus(e)} disabled={!fresh()} onPress={()=>select(e.id)}/>):null}
  {entry?<View><Text selectable style={styles.workspaceMeta}>{'Engagement reference: '+entry.id+' · Enquiry: '+entry.source.reference.inboxId}</Text>
   <Text style={styles.cardBody}>{entry.evidence==='workspace-record'?'Original complete workspace record, read-only here. Its device/account durability has not been checked.':'Separate quote proposal. Reviewed does not mean saved, sent or accepted.'}</Text>
   {entry.evidence==='workspace-record'?<><Text selectable style={styles.cardBody}>{entry.record.details?.message||entry.record.details?.description||'No wording recorded.'}</Text><Text style={styles.cardBody}>{'Recorded amount: '+String(entry.record.details?.quoteAmount??entry.record.details?.sourceQuoteAmount??entry.record.details?.jobValue??'Not recorded')+' · Recorded date: '+String(entry.record.details?.bookingDate||entry.record.details?.plannedSentDate||'Not recorded')}</Text></>:<>
    <PrivateQuoteFields s={quoteState} review={{...quoteReview,conflict:!editable||quoteReview.conflict}} customerId={customer.id} status="Session proposal"/>
    <Field label="Planned quote sent date" value={form.date} editable={editable&&!quoteReview.conflict} onChangeText={v=>quoteReview.edit('actionQuoteSentDate',v)}/>
    <Button label="Review quote proposal" primary disabled={!editable||quoteReview.conflict||!quoteReview.validDate} onPress={review}/>
   </>}
  </View>:null}
 </Card>;
}
