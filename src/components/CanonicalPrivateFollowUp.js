import React from 'react';
import {Text,Alert} from 'react-native';
import {Card,Field,Button} from './ui';
import {styles} from '../theme/styles';
import {stableJson} from '../core/stableJson.mjs';
import {useOwnerEditNavigation} from '../screens/useOwnerEditNavigation';

// Wording belongs to this editor; storage/revisions remain the existing finite adapter.
export function CanonicalPrivateFollowUp({s,customer,customerId:accountCustomerId,record,accountContext=null,sourceBlocked=false,sourceReviewEpoch=0,api}){
 const customerId=accountCustomerId??customer?.id;
 const [draft,setDraft]=React.useState(null),[words,setWords]=React.useState(''),[notice,setNotice]=React.useState(''),[pending,setPending]=React.useState(false);
 const epoch=React.useRef(0),live=React.useRef(null),mounted=React.useRef(true),flight=React.useRef(false);
 React.useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;};},[]);
 const identity=stableJson([s.ownerSession?.userId,s.cloudWorkspace,s.ownerWorkspaceScope===undefined,customer,customerId,record,s.screen,sourceReviewEpoch]);
 const scope=s.ownerWorkspaceScope,owner=s.ownerSession?.userId,business=s.cloudWorkspace?.businessId;
 live.current={identity,scope,owner,business,record,words,view:s.screen,draft,sourceBlocked,role:s.cloudWorkspace?.role,accountContext};
 const contextCurrent=s.cloudWorkspace?.role==='owner'&&!sourceBlocked&&(!accountContext||api.isEditContext(accountContext,'private_followup'));
 const current=()=>!live.current.sourceBlocked&&(!live.current.accountContext||api.isEditContext(live.current.accountContext,'private_followup'))&&mounted.current&&live.current.scope===scope&&live.current.identity===identity&&live.current.owner===owner&&live.current.business===business&&live.current.role==='owner';
 const editor=()=>({customerId:customerId,engagementId:record.engagementId,view:live.current.view,typingEpoch:epoch.current,sourceStamp:live.current.identity,fields:{text:live.current.words}});
 const report=useOwnerEditNavigation(s,{source:record,projectId:'canonical-private:'+record.engagementId,revision:record.revision},()=>{epoch.current++;live.current.words=draft?.text||'';setWords(draft?.text||'');return true;});
 const dirty=words!==(draft?.text||'');
 React.useEffect(()=>{report(dirty);},[dirty,record,draft,scope]);
 const replace=apply=>{
  const captured=epoch.current,isCurrent=()=>current()&&epoch.current===captured;
  return s.requestOwnerEditTransition?s.requestOwnerEditTransition(apply,{isCurrent}):dirty?false:(apply(),true);
 };
 const inspect=async()=>{
  if(!current()||flight.current)return false;flight.current='read';setPending(true);const captured=epoch.current;
  try{
   const fresh=await api.read(customerId,record.engagementId);
   if(!current()||captured!==epoch.current||fresh.revision!==record.revision||fresh.recordHash!==record.recordHash){if(current())setNotice(captured!==epoch.current?'Newer typing was kept; inspection did not replace your wording.':'This engagement changed. Your wording is kept; reopen the current quote before reviewing a save.');return false;}
   const observed=await api.privateRead(customerId,record.engagementId,'followup');
   if(!current())return false;if(epoch.current!==captured){setNotice('Newer typing was kept. The account observation did not replace it.');return false;}
   return replace(()=>{epoch.current++;setDraft(observed);setWords(observed.text||'');live.current.words=observed.text||'';setNotice(observed.revision?'Current private account wording observed. This is not a receipt for an earlier save.':'No private follow-up is recorded. Prepare your own wording; nothing will be sent.');});
  }catch{if(current())setNotice('Private account inspection unavailable. Your words are kept; do not retry an uncertain save.');return false;}
  finally{flight.current=false;if(mounted.current)setPending(false);}
 };
 const review=()=>{
  if(!current()||flight.current||!draft||!words.trim())return false;
  const fields={text:words},ticket=api.review({operation:'private',record,draft,fields,operationId:'private_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,12),editor:editor()});
  if(!ticket)return false;const captured=epoch.current;let used=false;
  Alert.alert('Review private engagement follow-up','Current account wording:\n'+(draft.text??'(none)')+'\n\nProposed exact wording:\n'+words+'\n\nOnly this owner’s private follow-up is saved. No message is sent.',[
   {text:'Keep editing',style:'cancel',onPress:()=>{used=true;api.cancel(ticket);}},
   {text:'Save reviewed private wording',onPress:async()=>{
    if(used||!current()||epoch.current!==captured||flight.current)return false;used=true;flight.current='save';setPending(true);
    let acknowledged=false;
    try{
     const result=await api.commit(ticket,editor);if(!current())return false;
     if(result.status!=='confirmed'){setNotice(result.status==='unknown'?'Save outcome uncertain. Your words are kept; no automatic retry. Matching account wording cannot recover the lost acknowledgement.':'Review expired. Keep your wording and inspect the current engagement.');return false;}
     acknowledged=true;setNotice('Exact private target receipt received. Other engagements, quote fields and customer records are unchanged.');
     const observed=await api.privateRead(customerId,record.engagementId,'followup');
     if(!current())return false;
     if(observed.revision!==result.receipt.revision||observed.engagementRevision!==record.revision||observed.text!==ticket.fields.text){setNotice('Exact receipt received, but current wording differs. Keep your words and review current account evidence.');return false;}
     setDraft(observed);if(epoch.current===captured){setWords(observed.text);live.current.words=observed.text;report(false);}else{setNotice('Earlier reviewed wording was saved and read back. Newer typing is kept and is not confirmed saved.');report(true);}return true;
    }catch{if(current())setNotice(acknowledged?'Exact private save receipt received; current readback unavailable. Your wording is kept. No message was sent.':'Save could not be reviewed. Your wording is kept; no successful save is claimed.');return false;}
    finally{flight.current=false;if(mounted.current)setPending(false);}
   }}
  ]);return true;
 };
 return <Card eyebrow="Owner-private preparation" title="This engagement’s private follow-up" body={'Customer '+customerId+' · Engagement '+record.engagementId+'. Prepared wording does not mean the quote was issued or delivered.'}>
  {!contextCurrent?<Text style={styles.cardBody}>The current account edit binding is unavailable. Your private wording is kept here read-only. Review a fresh current engagement before another save.</Text>:null}
  {!contextCurrent&&draft?<>
   <Text selectable style={styles.cardBody}>{'Previously observed private account wording · Revision '+draft.revision+'\n'+(draft.text??'(no private wording observed)')}</Text>
   <Text selectable style={styles.cardBody}>{'Your retained session wording'+(dirty?' · Not confirmed saved':' · No newer wording')+'\n'+words}</Text>
   <Text style={styles.workspaceMeta}>These words remain in this running editor only. Source inspection has not saved, restored or sent them. Keep this editor open, or deliberately use Keep/Discard when leaving.</Text>
  </>:null}
  {notice?<Text accessibilityLiveRegion="polite" style={styles.cardBody}>{notice}</Text>:null}
  <Button label="Inspect private follow-up" disabled={pending||!contextCurrent} onPress={inspect}/>
  {draft?<><Text style={styles.workspaceMeta}>{'Private draft revision '+draft.revision+(draft.needsReview?' · Current engagement must be reviewed':'')+'. Account observation is separate from this editor.'}</Text><Field label="Private engagement follow-up wording" multiline value={words} editable={contextCurrent&&flight.current!=='save'} onChangeText={value=>{if(!current()||flight.current==='save')return false;epoch.current++;live.current.words=value;setWords(value);report(value!==(draft.text||''));}}/><Button label="Review private follow-up save" disabled={pending||!contextCurrent||!words.trim()||api.status().status==='unknown'} onPress={review}/></>:null}
 </Card>;
}
