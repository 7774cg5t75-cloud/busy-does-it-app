import React from 'react';
import {Alert,Text} from 'react-native';
import {Card,Button} from './ui';
import {styles} from '../theme/styles';
import {stableJson} from '../core/stableJson.mjs';
import {isQuoteGrantProjection} from '../core/quotePresentationContract.mjs';

export function CanonicalQuoteGrant({s,customerId,record,reference,preparation,sourceBlocked=false,sourceReviewEpoch=0}){
 const api=s.canonicalWork,scope=s.ownerWorkspaceScope;
 const [stored,setStored]=React.useState({}),[notice,setNotice]=React.useState(''),[busy,setBusy]=React.useState(false);
 const mounted=React.useRef(true),flight=React.useRef(false),choice=React.useRef(0),live=React.useRef(null);
 React.useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;};},[]);
 const stamp=stableJson([scope,s.ownerSession?.userId,s.cloudWorkspace?.businessId,s.cloudWorkspace?.role,s.cloudRevision,s.screen,customerId,record,reference,preparation,sourceBlocked,sourceReviewEpoch]);
 live.current={stamp,api};
 const state=stored.stamp===stamp&&stored.choice===choice.current?stored:{};
 const current=epoch=>mounted.current&&live.current.stamp===stamp&&live.current.api===api&&choice.current===epoch&&s.cloudWorkspace?.role==='owner';
 const put=(epoch,patch)=>{if(current(epoch))setStored(old=>({...((old.stamp===stamp&&old.choice===epoch)?old:{}),...patch,stamp,choice:epoch}));};
 const free=()=>!flight.current&&!['pending','unknown'].includes(api.status().status);
 const run=async(task,epoch=choice.current)=>{if(!current(epoch)||flight.current)return false;flight.current=true;setBusy(true);try{return await task(epoch);}catch{if(current(epoch))setNotice('Current grant review unavailable. Existing receipts remain valid; no successful action is claimed.');return false;}finally{flight.current=false;if(mounted.current)setBusy(false);}};
 const list=after=>run(async epoch=>{const v=await api.grantList(customerId,record.engagementId,reference.referenceId,after);put(epoch,{list:v});});
 const open=id=>{if(flight.current)return false;const epoch=++choice.current;return run(async()=>{const v=await api.grantRead(customerId,record.engagementId,reference.referenceId,id);put(epoch,{observation:v});if(current(epoch))setNotice('Account observation only. No earlier save acknowledgement is reconstructed.');},epoch);};
 const prepare=()=>run(async epoch=>{if(sourceBlocked||reference.termsChanged||preparation?.preparationState!=='prepared_disabled'||!freeForReview())return false;const v=await api.grantReview(customerId,record.engagementId,reference.referenceId,preparation.preparation.preparationId,preparation.preparation.bindingRevision);put(epoch,{review:v});});
 // run owns the flight lock; only the operation fence is checked inside a read.
 const freeForReview=()=>!['pending','unknown'].includes(api.status().status);
 const revoke=()=>run(async epoch=>{if(!state.observation||!freeForReview())return false;const v=await api.grantRevokeReview(customerId,record.engagementId,reference.referenceId,state.observation.grantId,state.observation.revision);put(epoch,{review:v});});
 const editor=(operation,base,epoch)=>({customerId,engagementId:record.engagementId,referenceId:reference.referenceId,view:s.screen,typingEpoch:epoch,purpose:operation,preparationId:base.preparationId??null,grantId:base.grantId??null,sourceStamp:stamp,fields:{}});
 const review=()=>{
  const base=state.review,epoch=choice.current,operation=base?.currentGrantReview?'grantCreate':'grantRevoke';
  if(!base||!current(epoch)||!free()||operation==='grantCreate'&&(sourceBlocked||!api.isGrantReview(base))||operation==='grantRevoke'&&!api.isGrantRevocationReview(base))return false;
  const ticket=api.review({operation,record:base,fields:{},operationId:'quote_grant_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,10),editor:editor(operation,base,epoch)});if(!ticket)return false;let used=false;
  const p=base.projection,r=base.recipientEvidence?.recipient;
  const detail=operation==='grantCreate'?'Prepare a separately versioned, owner-private grant candidate.\nRecipient account '+r.consumerId+'\nOriginal request '+r.requestId+'\nApp '+r.appId+' · version '+r.appVersionId+'\nOwner-linked provenance does not certify real-world identity.\nQuote version '+p.quoteRevision+' · £'+p.amount+'\n'+p.wording+'\nExpires '+base.expiresAt:'Revoke this exact candidate '+base.grantId+'. Its immutable record remains. A replacement requires fresh review.';
  Alert.alert('Review private quote grant',detail+'\n\nCustomer access remains DISABLED. No presentation, response, acceptance or booking is executed.',[
   {text:'Keep reviewing',style:'cancel',onPress:()=>{used=true;api.cancel(ticket);}},
   {text:operation==='grantCreate'?'Record private candidate':'Revoke private candidate',onPress:()=>{if(used||!current(epoch)||!free())return false;used=true;return run(async()=>{
    const result=await api.commit(ticket,()=>({...editor(operation,base,choice.current),sourceStamp:live.current.stamp}));if(!current(epoch))return false;
    if(result.status!=='confirmed'){setNotice(result.status==='unknown'?'Outcome uncertain. Do not replay. A later observation cannot recover the acknowledgement.':'Review expired. Request fresh review.');return false;}
    put(epoch,{receipt:result.receipt,review:null});setNotice('Exact private target receipt received. Customer access remains disabled.');
    try{const v=await api.grantRead(customerId,record.engagementId,reference.referenceId,result.receipt.grantId);if(v.revision!==result.receipt.revision)throw Error('Readback differs');put(epoch,{observation:v});}catch{if(current(epoch))setNotice('Committed target receipt retained; independent readback unavailable. Do not replay.');}return true;
   },epoch);}}
  ]);return true;
 };
 const responses=(after=0)=>run(async epoch=>{const v=await api.grantResponses(customerId,record.engagementId,reference.referenceId,state.observation.grantId,after);put(epoch,{responses:v});});
 if(!api?.grantEnabled||s.cloudWorkspace?.role!=='owner')return null;
 const p=state.observation?.projection;
 return <Card eyebrow="Owner-private · customer access disabled" title="Review exact quote access preparation" body="A grant candidate is separate from recipient selection. Recording it does not make a quote available to a customer.">
  {notice?<Text accessibilityLiveRegion="polite" style={styles.cardBody}>{notice}</Text>:null}
  <Button label="Inspect private quote grant history" disabled={busy} onPress={()=>list(null)}/>
  {state.list?.items.map(x=><Button key={x.grantId} label={'Inspect grant '+x.grantId+' · generation '+x.generation} disabled={busy} onPress={()=>open(x.grantId)}/>)}
  {state.list?.nextCursor?<Button label="More private quote grants" disabled={busy} onPress={()=>list(state.list.nextCursor)}/>:null}
  <Button label="Prepare exact recipient and quote grant review" disabled={busy||sourceBlocked||reference.termsChanged||preparation?.preparationState!=='prepared_disabled'||!free()} onPress={prepare}/>
  {state.review?<Button label="Review private quote grant decision" disabled={busy||!free()} onPress={review}/>:null}
  {state.observation?<Text selectable style={styles.cardBody}>{'Grant '+state.observation.grantId+' · revision '+state.observation.revision+'\n'+state.observation.state+'\nCustomer access disabled'}</Text>:null}
  {isQuoteGrantProjection(p,reference.referenceId)?<Text selectable style={styles.cardBody}>{p.businessDisplayName+'\nPrepared quote · version '+p.quoteRevision+'\n£'+p.amount+'\n'+p.wording+'\nNo appointment confirmed.'}</Text>:null}
  {state.observation?.revision===1?<Button label="Prepare private grant revocation" disabled={busy||!free()} onPress={revoke}/>:null}
  {state.observation?<Button label="Inspect recorded response candidates" disabled={busy} onPress={()=>responses(0)}/>:null}
  {state.responses?.items.map(x=><Text key={x.responseId} selectable style={styles.cardBody}>{'Technical candidate only · '+x.action+'\n'+x.question+'\nServer recorded '+x.recordedAt+'\nNo legal acceptance or booking established.'}</Text>)}
  {state.responses?.nextCursor?<Button label="More recorded response candidates" disabled={busy} onPress={()=>responses(state.responses.nextCursor)}/>:null}
  {state.receipt?<Text style={styles.cardBody}>{'Own private receipt · '+state.receipt.grantId+' · revision '+state.receipt.revision}</Text>:null}
 </Card>;
}
