import React from 'react';
import {Text,Alert} from 'react-native';
import {Card,Field,Button} from './ui';
import {styles} from '../theme/styles';
import {stableJson} from '../core/stableJson.mjs';
import {useOwnerEditNavigation} from '../screens/useOwnerEditNavigation';

// Wording belongs to this editor; storage/revisions remain the existing finite adapter.
export function CanonicalPrivateFollowUp({s,customer,record,api}){
 const [draft,setDraft]=React.useState(null),[words,setWords]=React.useState(''),[notice,setNotice]=React.useState(''),[pending,setPending]=React.useState(false);
 const epoch=React.useRef(0),live=React.useRef(null),mounted=React.useRef(true),flight=React.useRef(false);
 React.useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;};},[]);
 const identity=stableJson([s.ownerSession?.userId,s.cloudWorkspace,s.ownerWorkspaceScope===undefined,customer,record,s.screen]);
 const scope=s.ownerWorkspaceScope,owner=s.ownerSession?.userId,business=s.cloudWorkspace?.businessId;
 live.current={identity,scope,owner,business,record,words,view:s.screen,draft};
 const current=()=>mounted.current&&live.current.scope===scope&&live.current.identity===identity&&live.current.owner===owner&&live.current.business===business&&s.cloudWorkspace?.role==='owner';
 const editor=()=>({customerId:customer.id,engagementId:record.engagementId,view:live.current.view,typingEpoch:epoch.current,sourceStamp:live.current.identity,fields:{text:live.current.words}});
 const report=useOwnerEditNavigation(s,{source:record,projectId:'canonical-private:'+record.engagementId,revision:record.revision},()=>{epoch.current++;live.current.words=draft?.text||'';setWords(draft?.text||'');return true;});
 const dirty=words!==(draft?.text||'');
 React.useEffect(()=>{report(dirty);},[dirty,record,draft,scope]);
 const replace=apply=>{
  const captured=epoch.current,isCurrent=()=>current()&&epoch.current===captured;
  return s.requestOwnerEditTransition?s.requestOwnerEditTransition(apply,{isCurrent}):dirty?false:(apply(),true);
 };
 const inspect=async()=>{
  if(!current()||flight.current)return false;flight.current=true;setPending(true);const captured=epoch.current;
  try{
   const fresh=await api.read(customer.id,record.engagementId);
   if(!current()||captured!==epoch.current||fresh.revision!==record.revision||fresh.recordHash!==record.recordHash){if(current())setNotice('This engagement changed. Your wording is kept; reopen the current quote before reviewing a save.');return false;}
   const observed=await api.privateRead(customer.id,record.engagementId,'followup');
   if(!current()||epoch.current!==captured)return false;
   return replace(()=>{epoch.current++;setDraft(observed);setWords(observed.text||'');live.current.words=observed.text||'';setNotice(observed.revision?'Current private account wording observed. This is not a receipt for an earlier save.':'No private follow-up is recorded. Prepare your own wording; nothing will be sent.');});
  }catch{if(current())setNotice('Private account inspection unavailable. Your words are kept; do not retry an uncertain save.');return false;}
  finally{flight.current=false;if(current())setPending(false);}
 };
 const review=()=>{
  if(!current()||flight.current||!draft||!words.trim())return false;
  const fields={text:words},ticket=api.review({operation:'private',record,draft,fields,operationId:'private_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,12),editor:editor()});
  if(!ticket)return false;const captured=epoch.current;let used=false;
  Alert.alert('Review private engagement follow-up','Current account wording:\n'+(draft.text??'(none)')+'\n\nProposed exact wording:\n'+words+'\n\nOnly this owner’s private follow-up is saved. No message is sent.',[
   {text:'Keep editing',style:'cancel',onPress:()=>{used=true;api.cancel(ticket);}},
   {text:'Save reviewed private wording',onPress:async()=>{
    if(used||!current()||epoch.current!==captured||flight.current)return false;used=true;flight.current=true;setPending(true);
    let acknowledged=false;
    try{
     const result=await api.commit(ticket,editor);if(!current())return false;
     if(result.status!=='confirmed'){setNotice(result.status==='unknown'?'Save outcome uncertain. Your words are kept; no automatic retry. Matching account wording cannot recover the lost acknowledgement.':'Review expired. Keep your wording and inspect the current engagement.');return false;}
     acknowledged=true;setNotice('Exact private target receipt received. Other engagements, quote fields and customer records are unchanged.');
     const observed=await api.privateRead(customer.id,record.engagementId,'followup');
     if(!current())return false;
     if(observed.revision!==result.receipt.revision||observed.engagementRevision!==record.revision||observed.text!==ticket.fields.text){setNotice('Exact receipt received, but current wording differs. Keep your words and review current account evidence.');return false;}
     setDraft(observed);if(epoch.current===captured){setWords(observed.text);live.current.words=observed.text;report(false);}else{setNotice('Earlier reviewed wording was saved and read back. Newer typing is kept and is not confirmed saved.');report(true);}return true;
    }catch{if(current())setNotice(acknowledged?'Exact private save receipt received; current readback unavailable. Your wording is kept. No message was sent.':'Save could not be reviewed. Your wording is kept; no successful save is claimed.');return false;}
    finally{flight.current=false;if(current())setPending(false);}
   }}
  ]);return true;
 };
 return <Card eyebrow="Owner-private preparation" title="This engagement’s private follow-up" body={'Customer '+customer.id+' · Engagement '+record.engagementId+'. Prepared wording does not mean the quote was issued or delivered.'}>
  {notice?<Text accessibilityLiveRegion="polite" style={styles.cardBody}>{notice}</Text>:null}
  <Button label="Inspect private follow-up" disabled={pending} onPress={inspect}/>
  {draft?<><Text style={styles.workspaceMeta}>{'Private draft revision '+draft.revision+(draft.needsReview?' · Current engagement must be reviewed':'')+'. Account observation is separate from this editor.'}</Text><Field label="Private engagement follow-up wording" multiline value={words} editable={!pending} onChangeText={value=>{if(!current()||flight.current)return false;epoch.current++;live.current.words=value;setWords(value);report(value!==(draft.text||''));}}/><Button label="Review private follow-up save" disabled={pending||!words.trim()||api.status().status==='unknown'} onPress={review}/></>:null}
 </Card>;
}
