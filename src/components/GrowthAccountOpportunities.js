import React from 'react';
import {Text,View,Alert} from 'react-native';
import {Card,Button,Field} from './ui';
import {styles} from '../theme/styles';
import {stableJson} from '../core/stableJson.mjs';
import {OwnerGrowthOpportunity} from './OwnerGrowthOpportunity';
export function GrowthAccountOpportunities({s}){
 const [page,setPage]=React.useState(null),[base,setBase]=React.useState(null),[busy,setBusy]=React.useState(false),[notice,setNotice]=React.useState(''),[receipt,setReceipt]=React.useState(null),[reviewed,setReviewed]=React.useState(null),[feedbackReason,setFeedbackReason]=React.useState(''),[editorGeneration,setEditorGeneration]=React.useState(0),[uncertain,setUncertain]=React.useState(false);
 const live=React.useRef(s),epoch=React.useRef(0),flight=React.useRef(null),dirty=React.useRef(false),selected=React.useRef(null),approval=React.useRef(null),alive=React.useRef(true);live.current=s;selected.current=base;
 React.useEffect(()=>{alive.current=true;return()=>{alive.current=false;approval.current=null;};},[]);
 const api=s.growthOpportunityAccount,scope=s.ownerWorkspaceScope,owner=s.ownerSession?.userId,business=s.cloudWorkspace?.businessId,screen=s.screen,profile=stableJson(s.businessCreationIntelligence?.sharedProfile||null);
 const current=()=>alive.current&&live.current.ownerWorkspaceScope===scope&&live.current.ownerSession?.userId===owner&&live.current.cloudWorkspace?.businessId===business&&live.current.cloudWorkspace?.role==='owner'&&live.current.screen===screen;
 const view=base?.scope===scope&&base.owner===owner&&base.business===business?base.value:null;
 const packet=value=>({scope,owner,business,value});
 const change=fn=>{if(!current()||flight.current)return false;if(dirty.current){let used=false;const t={};approval.current=t;Alert.alert('Keep your opportunity wording?','Opening another record replaces only this unsaved intake. Creator drafts and saved opportunity versions stay unchanged.',[{text:'Keep editing',style:'cancel',onPress:()=>{used=true;}},{text:'Discard intake and continue',onPress:()=>{if(used||approval.current!==t||!current())return false;used=true;dirty.current=false;epoch.current++;setEditorGeneration(v=>v+1);return fn();}}]);return false;}return fn();};
 const load=async(id=null,after=null,revision=null)=>{
  if(!current()||!api?.enabled||flight.current)return false;const token={};flight.current=token;const e=epoch.current;setBusy(true);
  try{const v=id?await api.read(id,revision):await api.list(after);if(!current()||flight.current!==token||epoch.current!==e)return false;if(id){setBase(packet(v));setReviewed(null);dirty.current=false;}else setPage(packet(v));setNotice('Independent private account observation. No earlier own-write receipt was recreated.');return true;}
  catch{if(current()){setReviewed(null);setNotice('Account observation unavailable. Existing wording and acknowledged receipts are kept; do not infer a missing record.');}return false;}
  finally{if(flight.current===token){flight.current=null;if(current())setBusy(false);}}
 };
 const write=({action,fields=null,isCurrent=()=>true,feedback=null,reason=null})=>{
  if(uncertain||!current()||!api?.enabled||flight.current||dirty.current&&!['create','edit'].includes(action)||action!=='create'&&selected.current?.value!==view||!isCurrent())return false;
  const e=epoch.current,target=view,ticket=api.review({action,base:action==='create'?null:view,fields,feedback,reason,operationId:'growth_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,14),isCurrent:()=>current()&&epoch.current===e&&(selected.current?.value||null)===target&&isCurrent()});if(!ticket)return false;
  let used=false;const decision={};approval.current=decision;Alert.alert('Review private opportunity '+action,(fields?JSON.stringify(fields,null,2):action==='feedback'?feedback+'\n'+reason:'Exact saved revision '+view.revision)+'\n\nOwner-reported only. No verified demand, contact consent, sending or customer outcome follows. Retirement is not legal erasure.',[
   {text:'Keep unchanged',style:'cancel',onPress:()=>{used=true;}},
   {text:'Record private '+action,onPress:async()=>{if(used||approval.current!==decision||!current()||epoch.current!==e||!isCurrent()||flight.current)return false;used=true;const token={};flight.current=token;setBusy(true);
    try{const outcome=await api.commit(ticket);if(!current())return false;if(!outcome.ok){if(outcome.status==='unknown'){setUncertain(true);setReviewed(null);}setNotice(outcome.status==='unknown'?'Outcome unknown. Your wording and earlier receipt are kept. Inspect independently; do not replay this operation.':'Review expired before sending. Your wording is kept.');return false;}
     setReceipt(packet(outcome.receipt));setNotice('Exact account operation acknowledged. Independent readback is pending.');
     const observed=await api.read(outcome.receipt.opportunityId);if(!current()||epoch.current!==e||!isCurrent())return false;
     if(observed.revision!==outcome.receipt.revision||observed.sourceHash!==outcome.receipt.sourceHash){setNotice('A later account revision was observed. Your acknowledged receipt is kept; inspect before continuing.');return false;}
     dirty.current=false;setBase(packet(observed));if(action==='reinspect')setReviewed({id:observed.opportunityId,hash:observed.sourceHash,profile});else if(action!=='feedback')setReviewed(null);setNotice('Acknowledged private operation and independent readback. This remains an owner report, not an externally verified source.');return true;
    }catch{if(current()){setReviewed(null);setNotice('Later readback unavailable. The acknowledged operation receipt and current wording remain; inspect independently.');}return false;}
    finally{if(flight.current===token){flight.current=null;if(current())setBusy(false);}}
   }}
  ]);return true;
 };
 if(!current())return null;
 if(!api?.enabled)return <><OwnerGrowthOpportunity s={s}/><Card title="Account opportunity saving is not released" body="The finite account contract is prepared for local verification. Hosted access remains disabled; the intake above is session-only until saved through the original Creator."/></>;
 const sourceCurrent=!!view&&view.state==='active'&&!view.historical&&!dirty.current&&reviewed?.id===view.opportunityId&&reviewed.hash===view.sourceHash&&reviewed.profile===profile&&view.reviewedSourceHash===view.sourceHash;
 return <Card eyebrow="Get More Customers · private account" title="Your saved opportunities" body="Owner-reported possibilities, not verified leads or marketing consent. Saved history remains separate from today's source review.">
  <Button label="Inspect saved opportunity page" disabled={busy} onPress={()=>change(()=>load())}/>
  {page?.scope===scope&&page.owner===owner&&page.business===business?<View>{page.value.items.map(row=><Button key={row.opportunityId} label={'Open saved opportunity: '+row.title+' · '+row.state} disabled={busy} onPress={()=>change(()=>load(row.opportunityId))}/>)}{page.value.nextAfter?<Button label="Next opportunity page" disabled={busy} onPress={()=>change(()=>load(null,page.value.nextAfter))}/>:null}</View>:null}
  <Button label="Prepare a new owner opportunity" disabled={busy} onPress={()=>change(()=>{setBase(null);setReviewed(null);dirty.current=false;epoch.current++;setEditorGeneration(v=>v+1);})}/>
  <Text accessibilityLiveRegion="polite" style={styles.cardBody}>{notice}</Text>
  {uncertain?<Button label="Inspect the exact uncertain operation" disabled={busy} onPress={async()=>{if(!current()||flight.current)return false;const token={};flight.current=token;setBusy(true);try{const v=await api.recover();if(!current())return false;if(v?.found){setUncertain(false);setNotice('The exact operation was independently observed. This is not an own-write receipt. Open the current record before another change.');return true;}setNotice('Operation not yet established. It may still be pending; no replay is permitted.');return false;}catch{if(current())setNotice('Recovery unavailable. Preserve your wording and do not replay.');return false;}finally{if(flight.current===token){flight.current=null;if(current())setBusy(false);}}}}/>:null}
  {receipt?.scope===scope&&receipt.owner===owner&&receipt.business===business?<Text selectable style={styles.cardBody}>{'Acknowledged own operation: '+receipt.value.opportunityId+' · revision '+receipt.value.revision+' · '+receipt.value.action+'. A later failed read does not erase this receipt.'}</Text>:null}
  {view?<View><Text selectable style={styles.cardBody}>{'Saved '+view.state+' owner report · revision '+view.revision+'\nSource account: '+view.record.source+'\nRecorded by server: '+view.recordedAt+'\nPreference: '+view.feedback+' · '+view.feedbackReason+'\nSource review: '+(sourceCurrent?'deliberately rechecked in this session':'unresolved — recheck before renewed preparation')+'\nAll business outcomes and contact permission: not established.'}</Text>
   {view.revision>1?<Button label="Inspect the previous immutable opportunity version" disabled={busy} onPress={()=>change(()=>load(view.opportunityId,null,view.revision-1))}/>:null}
   {view.historical?<><Text style={styles.cardBody}>Historical owner report only. No mutation or renewed activity is authorised by this observation.</Text><Button label="Return to current opportunity version" disabled={busy} onPress={()=>change(()=>load(view.opportunityId))}/></>:null}
   <Button label="Recheck my source account before preparing" disabled={busy||view.historical||uncertain||view.state!=='active'||dirty.current} onPress={()=>write({action:'reinspect'})}/>
   <Button label={view.state==='retired'?'Review reopening this opportunity':'Review retiring this opportunity'} disabled={busy||view.historical||uncertain||dirty.current} onPress={()=>write({action:view.state==='retired'?'reopen':'retire'})}/>
   {sourceCurrent?<><Field label="Why is this opportunity relevant or unsuitable?" value={feedbackReason} onChangeText={v=>{epoch.current++;approval.current=null;setFeedbackReason(v);}}/>{['useful','irrelevant','later','clear'].map(value=><Button key={value} label={'Review account feedback: '+value} disabled={busy} onPress={()=>write({action:'feedback',feedback:value,reason:feedbackReason})}/>)}</>:null}
  </View>:null}
  {!view||view.state==='active'&&!view.historical?<OwnerGrowthOpportunity key={view?view.opportunityId+':'+view.revision+':'+editorGeneration:'new:'+editorGeneration} s={s} initialRecord={view} allowPrepare={!busy&&!uncertain&&(!view||sourceCurrent)} onDraftChange={()=>{epoch.current++;dirty.current=true;approval.current=null;}} onSave={uncertain?null:args=>write({...args,action:view?'edit':'create'})}/>:null}
 </Card>;
}
