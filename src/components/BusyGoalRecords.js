import React from 'react';
import {Text} from 'react-native';
import {Button,Details} from './ui';
import {WorkflowStatus} from './WorkflowChrome';
import {CreatorWebsiteReview} from './CreatorWebsiteReview';
import {CanonicalWorkPanel} from './CanonicalWorkPanel';
import {styles} from '../theme/styles';
import {createBusyGoalRecords} from '../core/busyGoalRecords.mjs';
export function BusyGoalRecords({s,goal,inputText}){
 const [page,setPage]=React.useState(null),[chosen,setChosen]=React.useState(null),[busy,setBusy]=React.useState(false),[notice,setNotice]=React.useState('');
 const live=React.useRef(s),words=React.useRef(inputText),selection=React.useRef(0),flight=React.useRef(false),alive=React.useRef(true);live.current=s;words.current=inputText;React.useEffect(()=>{alive.current=true;return()=>{alive.current=false;};},[]);
 const owner=s.ownerSession?.userId,business=s.cloudWorkspace?.businessId,scope=s.ownerWorkspaceScope;
 const current=()=>alive.current&&words.current===inputText&&live.current.ownerWorkspaceScope===scope&&live.current.ownerSession?.userId===owner&&live.current.cloudWorkspace?.businessId===business&&live.current.cloudWorkspace?.role==='owner'&&live.current.connectedRuntime?.active===true;
 const api=React.useMemo(()=>createBusyGoalRecords({getCurrent:()=>({scope:live.current.ownerWorkspaceScope,ownerId:live.current.ownerSession?.userId,businessId:live.current.cloudWorkspace?.businessId,role:live.current.cloudWorkspace?.role,ready:live.current.connectedRuntime?.active===true}),creator:s.creatorDraftAccount,request:(name,body)=>s.connectedRequest(name,body)}),[owner,business,scope,s.creatorDraftAccount,s.connectedRuntime]);
 const run=async fn=>{if(flight.current||!current())return;flight.current=true;setBusy(true);try{await fn();}catch(e){if(current()){setNotice(e.message||'Inspection unavailable. Your existing work is kept.');}}finally{flight.current=false;if(current())setBusy(false);}};
 if(!s.connectedRuntime?.active||s.cloudWorkspace?.role!=='owner'||!['saved-content','enquiries'].includes(goal?.contextKind))return null;
 const content=goal.contextKind==='saved-content';
 const replace=(token,apply)=>{const fresh=()=>current()&&selection.current===token;const run=()=>{if(!fresh())return false;try{return apply();}catch(e){if(current())setNotice(e.message);return false;}};if(chosen?.state==='Filed'){if(typeof s.requestOwnerEditTransition!=='function'){setNotice('Keep your current quote work before changing this selection.');return false;}return s.requestOwnerEditTransition(run,{isCurrent:fresh});}return run();};
 const load=after=>run(async()=>{const token=++selection.current;const r=content?await api.wording(after):await api.enquiries(after,after?page.revision:null);if(current())replace(token,()=>{setPage(r);setChosen(null);setNotice(content?'Choose the exact saved wording. Its offer details and public-use permission still need your review.':'Choose the original enquiry. People are not matched by names or contact details.');return true;});});
 const select=item=>run(async()=>{const token=++selection.current;const r=content?await api.readWording(item):await api.readEnquiry(item);if(!current())return;replace(token,()=>{if(!content&&r.state==='Filed'&&s.connectedInstallEnquiry(r.record)!==true)throw Error('Keep your current customer work before reopening this enquiry.');setChosen(r);setNotice(content?'Saved words inspected again. Choose where they should go, then review the private save.':'Original source inspected again. Each next action stays under its own review.');return true;});});
 return <Details label={content?'Choose wording for your website':'Choose the enquiry to work on'}>
  <Button label={content?'Find my saved wording':'Find my enquiries'} disabled={busy} onPress={()=>load(null)}/>
  {page?.items.map((item,index)=><Button key={item.draftId||item.id} label={content?(item.briefPreview||'Saved private draft')+' · choice '+(index+1):(item.state==='Filed'?item.record.customer.name:'Unfiled enquiry')+' · '+String(item.record.enquiry?.rawText||item.record.pending?.rawText||'Choose to review').slice(0,80)} disabled={busy} onPress={()=>select(item)}/>)}
  {page&&(content?page.nextAfter:page.nextCursor)?<Button label="More saved items" disabled={busy} onPress={()=>load(content?page.nextAfter:page.nextCursor)}/>:null}
  {page&&!page.items.length?<WorkflowStatus title="Nothing saved here yet" body={content?'Prepare and save your wording in Content Creator first. Busy will not invent an offer.':'Open the original Inbox to review a new enquiry. Nothing is filed or booked automatically.'}/>:null}
  {chosen&&content?<><Text selectable style={styles.cardBody}>{chosen.content.text}</Text><CreatorWebsiteReview key={chosen.draftId+':'+chosen.revision} s={s} record={chosen}/></>:null}
  {chosen&&!content&&chosen.state==='Filed'&&s.cloudRevision===chosen.record.revision?<CanonicalWorkPanel key={chosen.record.customer.id+':'+chosen.record.enquiry.id} s={s} customer={chosen.record.customer} sourceEnquiryId={chosen.record.enquiry.id}/>:null}
  {chosen&&!content&&chosen.state==='Pending'?<Button label="Review contact details in Inbox first" disabled={busy} onPress={()=>run(async()=>{await s.connectedRestoreJourneys();if(current())s.go('busyInbox');})}/>:null}
  {notice?<WorkflowStatus title="Your current account information" body={notice}/>:null}
 </Details>;
}
