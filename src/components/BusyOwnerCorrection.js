import React from 'react';
import {Text} from 'react-native';
import {Details,Button} from './ui';
import {WorkflowStatus} from './WorkflowChrome';
import {styles} from '../theme/styles';
import {classifyOwnerCorrection,prepareOwnerGoalCorrection} from '../core/ownerGoalCorrection.mjs';
export function BusyOwnerCorrection({s,inputText}){
 const [review,setReview]=React.useState(null),[busy,setBusy]=React.useState(false),[unknown,setUnknown]=React.useState(false),[notice,setNotice]=React.useState('');
 const live=React.useRef(s),words=React.useRef(inputText),alive=React.useRef(true),flight=React.useRef(false);live.current=s;words.current=inputText;React.useEffect(()=>{alive.current=true;return()=>{alive.current=false;};},[]);
 const scope=s.ownerWorkspaceScope,owner=s.ownerSession?.userId,business=s.cloudWorkspace?.businessId;
 const current=()=>alive.current&&words.current===inputText&&live.current.ownerWorkspaceScope===scope&&live.current.ownerSession?.userId===owner&&live.current.cloudWorkspace?.businessId===business&&live.current.cloudWorkspace?.role==='owner';
 const run=async fn=>{if(flight.current||!current())return;flight.current=true;setBusy(true);try{await fn();}catch{if(current())setNotice('Account details could not be confirmed. Your words are kept; nothing was repeated.');}finally{flight.current=false;if(current())setBusy(false);}};
 const intent=classifyOwnerCorrection(inputText);if(!intent)return null;
 return <Details label="Review what Busy should use next time">
  <WorkflowStatus title="Your correction" body={intent.explanation}/>
  {intent.scope==='future-approved-facts'&&s.connectedReadProfile&&s.connectedSaveProfile?<>
   <Button label={unknown?'Inspect business details before another review':'Review this change to my business details'} disabled={busy} onPress={()=>run(async()=>{const basis=await s.connectedReadProfile();if(!current())return;const proposal=prepareOwnerGoalCorrection(inputText,basis,{ownerId:owner,businessId:business});setReview(proposal.ok?{basis,proposal}:null);setUnknown(false);setNotice(proposal.ok?'Review the exact change below. No account details have changed yet.':proposal.reason);})}/>
   {review&&!unknown?<><Text selectable style={styles.cardBody}>{'Current: '+(review.proposal.before||'Not recorded')+'\nProposed: '+(review.proposal.after||'Remove the approved short promise')}</Text><Button primary label="Approve and save for future preparation" disabled={busy} onPress={()=>run(async()=>{const captured=review;setUnknown(true);const result=await s.connectedSaveProfile({basis:captured.basis,profile:captured.proposal.profile});if(!current())return;setReview(null);if(result.ok){setUnknown(false);setNotice('Approved business details saved and independently reopened. Future preparation can reuse them; existing drafts were kept.');}else setNotice('Save not confirmed. Inspect the account before another deliberate review; your wording is kept.');})}/></>:null}
  </>:<Text style={styles.cardBody}>{intent.scope==='future-approved-facts'?'Account saving is not connected here. No lasting preference has been saved.':'This guidance has not been saved as a lasting business rule.'}</Text>}
  {notice?<WorkflowStatus title="Business context update" body={notice}/>:null}
 </Details>;
}
