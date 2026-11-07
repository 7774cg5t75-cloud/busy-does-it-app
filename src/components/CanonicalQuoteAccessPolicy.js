import React from 'react';
import {inspectQuoteItemisation} from '../core/quoteItemisation.mjs';
import {QuoteItemisationEditor} from './QuoteItemisationEditor';
import {Alert,Text} from 'react-native';
import {Card,Field,Button} from './ui';
import {styles} from '../theme/styles';
import {stableJson} from '../core/stableJson.mjs';
import {QUOTE_ACCESS_DAYS,QUOTE_DECISION_LABELS,QUOTE_PRESENTATION_TEXT_FIELDS,QUOTE_PRESENTATION_LABELS,formatApprovedQuoteProjection,isApprovedQuoteProjection} from '../core/quoteAccessPolicy.mjs';
import {useOwnerEditNavigation} from '../screens/useOwnerEditNavigation';

export function CanonicalQuoteAccessPolicy({s,customerId,record,reference,grantId,sourceBlocked=false,sourceReviewEpoch=0}){
 const api=s.canonicalWork,scope=s.ownerWorkspaceScope;
 const [inputs,setInputs]=React.useState({durationDays:14,calendarZone:'Europe/London',validUntil:'',fields:{quoteIdentifier:''}}),[reviewed,setReviewed]=React.useState(null),[observed,setObserved]=React.useState(null),[decisions,setDecisions]=React.useState(null),[notice,setNotice]=React.useState(''),[busy,setBusy]=React.useState(false),[details,setDetails]=React.useState(false);
 const observedNow=React.useRef(observed);observedNow.current=observed;
 const baseline=React.useRef({durationDays:14,calendarZone:'Europe/London',validUntil:'',fields:{quoteIdentifier:''}});
 const epoch=React.useRef(0),flight=React.useRef(false),mounted=React.useRef(true),live=React.useRef(null),original=React.useRef({scope,owner:s.ownerSession?.userId,business:s.cloudWorkspace?.businessId,grantId});
 React.useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;};},[]);
 const identity=stableJson([s.ownerSession?.userId,s.cloudWorkspace,s.cloudRevision,s.screen,record,reference,grantId,sourceBlocked,sourceReviewEpoch]);live.current={identity,scope,inputs,view:s.screen,role:s.cloudWorkspace?.role,blocked:sourceBlocked,epoch:epoch.current};
 const visible=original.current.scope===scope&&original.current.owner===s.ownerSession?.userId&&original.current.business===s.cloudWorkspace?.businessId&&original.current.grantId===grantId;
 const current=()=>visible&&mounted.current&&live.current.identity===identity&&live.current.scope===scope&&live.current.role==='owner';
 const report=useOwnerEditNavigation(s,{source:record,projectId:'quote-presentation:'+grantId,revision:record.revision},()=>{epoch.current++;setInputs(JSON.parse(stableJson(baseline.current)));setReviewed(null);return true;});
 const itemsValid=!inputs.fields.itemisedPrices?.length||inspectQuoteItemisation(inputs.fields.itemisedPrices,reference.terms?.amount??record.record?.details?.quoteAmount??'').ok;
 const dirty=stableJson(inputs)!==stableJson(baseline.current);
 React.useEffect(()=>{report(dirty);},[dirty,inputs,scope,record]);
 const edit=(key,value,field=false)=>{if(!current()||flight.current==='write')return false;epoch.current++;setReviewed(null);setInputs(old=>field?{...old,fields:{...old.fields,[key]:value}}:{...old,[key]:value});report(true);return true;};
 const free=()=>current()&&!flight.current&&!['pending','unknown'].includes(api.status().status);
 const options=()=>({...live.current.inputs,fields:Object.fromEntries(Object.entries(live.current.inputs.fields).filter(([,v])=>v!==''&&(!Array.isArray(v)||v.length>0)))});
 const run=async(task,kind='read')=>{if(!current()||flight.current)return false;flight.current=kind;setBusy(true);try{return await task();}catch{if(current())setNotice('Current preparation unavailable. Your unfinished fields are kept; no successful action is claimed.');return false;}finally{flight.current=false;if(mounted.current)setBusy(false);}};
 const inspect=()=>run(async()=>{const e=epoch.current,v=await api.accessRead(customerId,record.engagementId,reference.referenceId,grantId);if(!current()||e!==epoch.current)return false;setObserved({identity,value:v});setNotice('Independent account observation · '+v.state+'. No earlier save receipt reconstructed.');return true;});
 const inspectDecisions=after=>run(async()=>{const v=await api.accessDecisions(customerId,record.engagementId,reference.referenceId,grantId,after);if(!current())return false;setDecisions({identity,value:v});return true;});
 const prepare=()=>run(async()=>{if(observedNow.current?.identity===identity&&observedNow.current?.value?.presentationId||live.current.blocked||!itemsValid||!/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{1,3})?Z$/.test(inputs.validUntil))return false;const e=epoch.current,v=await api.accessReview(customerId,record.engagementId,reference.referenceId,grantId,options());if(!current()||e!==epoch.current){if(current())setNotice('Newer typing kept. Obtain a fresh review for those fields.');return false;}setReviewed({identity,epoch:e,value:v});return true;});
 // Reuse an independently observed preparation as editor input only, never as a receipt or save authority.
 const continueObserved=()=>{
  const saved=observed?.identity===identity?observed.value:null;
  if(!free()||sourceBlocked||saved?.state!=='prepared_disabled'||saved.revision!==1||!isApprovedQuoteProjection(saved.projection)||!QUOTE_ACCESS_DAYS.includes(saved.durationDays))return false;
  const e=epoch.current;let used=false;
  const fields=Object.fromEntries(QUOTE_PRESENTATION_TEXT_FIELDS.filter(k=>typeof saved.projection[k]==='string').map(k=>[k,saved.projection[k]]));
  if(saved.projection.itemisedPrices)fields.itemisedPrices=saved.projection.itemisedPrices.map(row=>({...row}));
  const next={durationDays:saved.durationDays,calendarZone:saved.calendarZone,validUntil:saved.validUntil,fields};
  Alert.alert('Continue saved private quotation preparation',formatApprovedQuoteProjection(saved.projection)+'\n\n'+(dirty?'Replace only this editor’s unfinished presentation fields? Other quote and private wording stays unchanged.':'Load these saved fields for deliberate review?')+' This saved presentation is immutable. A replacement needs a newly reviewed grant; loading fields does not enable another save under this grant. Nothing is issued.',[
   {text:'Keep current fields',style:'cancel',onPress:()=>{used=true;}},
   {text:'Continue saved fields',onPress:()=>{if(used||!free()||sourceBlocked||e!==epoch.current||observedNow.current?.value!==saved)return false;used=true;epoch.current++;baseline.current=JSON.parse(stableJson(next));setInputs(next);setReviewed(null);report(false);setDetails(true);setNotice('Saved presentation fields loaded for review. No earlier operation receipt or customer access was restored.');return true;}}
  ]);return true;
 };
 const editor=operation=>({customerId,engagementId:record.engagementId,referenceId:reference.referenceId,grantId,view:live.current.view,typingEpoch:epoch.current,sourceStamp:live.current.identity,purpose:operation,inputs:live.current.inputs,fields:{}});
 const decide=operation=>{
  const base=operation==='accessPrepare'?reviewed?.value:observed?.value;
  if(!free()||!base||operation==='accessPrepare'&&(sourceBlocked||reviewed.identity!==identity||reviewed.epoch!==epoch.current||!api.isAccessReview(base))||operation==='accessRevoke'&&(observed.identity!==identity||base.revision!==1))return false;
  const ticket=api.review({operation,record:base,fields:{},operationId:'quote_policy_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,10),editor:editor(operation)});if(!ticket)return false;let used=false;
  const detail=operation==='accessPrepare'?'Future access: '+base.durationDays+' calendar days from authorised activation in '+base.calendarZone+', capped at quote validity '+base.validUntil+'.\n\n'+formatApprovedQuoteProjection(base.projection):'Revoke this exact private presentation '+base.presentationId+'. Subsequent server validation must deny; retained records are not erased.';
  Alert.alert('Review exact customer quotation preparation',detail+'\n\nNot activated or issued. Request to proceed is non-binding. Binding acceptance and booking remain unavailable.',[
   {text:'Keep editing',style:'cancel',onPress:()=>{used=true;api.cancel(ticket);}},
   {text:operation==='accessPrepare'?'Save reviewed private presentation':'Revoke reviewed private presentation',onPress:()=>{if(used||!free())return false;used=true;return run(async()=>{const r=await report.commit(()=>api.commit(ticket,()=>editor(operation)));if(!current())return false;if(r.status!=='confirmed'){setNotice(r.status==='unknown'?'Outcome uncertain. Do not replay; independent inspection cannot recover the acknowledgement.':'Review expired. Your fields are kept.');return false;}if(operation==='accessPrepare'){baseline.current=JSON.parse(stableJson(live.current.inputs));report(false);}setReviewed(null);setNotice('Exact private target receipt received. Customer access is not activated.');try{const v=await api.accessRead(customerId,record.engagementId,reference.referenceId,grantId);if(v.presentationId!==r.receipt.presentationId||v.revision!==r.receipt.revision)throw Error('Target differs');if(current())setObserved({identity,value:v});}catch{if(current())setNotice('Acknowledged target receipt retained; later readback unavailable. Do not replay.');}return true;},'write');}}
  ]);return true;
 };
 if(!api?.accessPolicyEnabled||!visible||s.cloudWorkspace?.role!=='owner')return null;
 const freshReview=reviewed?.identity===identity&&reviewed?.epoch===epoch.current?reviewed.value:null,v=observed?.identity===identity?observed.value:null;
 return <Card eyebrow="V22.53 · private preparation" title="Review customer-facing quote and access duration" body="Internal preparation → approved presentation → customer access → customer decision → booking preparation. These remain separate. Nothing is issued or made available here.">
  {notice?<Text accessibilityLiveRegion="polite" style={styles.cardBody}>{notice}</Text>:null}
  {sourceBlocked?<Text style={styles.cardBody}>Current source review is required. Unfinished fields are kept; saving is disabled.</Text>:null}
  {QUOTE_PRESENTATION_TEXT_FIELDS.filter(key=>key==='quoteIdentifier'||details).map(key=><Field key={key} label={QUOTE_PRESENTATION_LABELS[key]} value={inputs.fields[key]||''} editable={!sourceBlocked&&!busy} onChangeText={v=>edit(key,v,true)}/>)}
  <Button label={details?"Hide optional quotation terms":"Edit optional customer-facing terms"} disabled={busy} onPress={()=>setDetails(!details)}/>
  {details?<QuoteItemisationEditor rows={inputs.fields.itemisedPrices||[]} quoteTotal={reference.terms?.amount??record.record?.details?.quoteAmount??''} disabled={busy||sourceBlocked} onChange={rows=>edit('itemisedPrices',rows,true)}/>:null}
  <Field label="Quote validity deadline (UTC, YYYY-MM-DDTHH:mm:ssZ)" value={inputs.validUntil} editable={!sourceBlocked&&!busy} onChangeText={v=>edit('validUntil',v)}/>
  <Field label="Calendar time zone for grant review" value={inputs.calendarZone} editable={!sourceBlocked&&!busy} onChangeText={v=>edit('calendarZone',v)}/>
  {QUOTE_ACCESS_DAYS.map(days=><Button key={days} label={'Choose '+days+' days'+(inputs.durationDays===days?' · selected':'')} disabled={busy||sourceBlocked} onPress={()=>edit('durationDays',days)}/>)}
  <Text style={styles.cardBody}>Default 14 days; 7 or 30 by deliberate review. The earlier quote-validity deadline always wins. Lifetime starts only at authorised activation. Viewing eligibility expires after 15 minutes of inactivity; every later read/response must recheck current authority. Revocation cannot remove copies already viewed or captured.</Text>
  <Button label="Inspect saved private presentation" disabled={busy} onPress={inspect}/>
  <Button label="Prepare exact V22.53 presentation review" disabled={busy||sourceBlocked||!!v?.presentationId||!free()||!inputs.fields.quoteIdentifier||!inputs.validUntil||!itemsValid} onPress={prepare}/>
  {freshReview?<Button label="Review V22.53 private preparation save" disabled={busy||!free()} onPress={()=>decide('accessPrepare')}/>:null}
  {v?.presentationId?<Text style={styles.cardBody}>This recorded presentation cannot be overwritten. Review or revoke it here. A replacement requires a new, explicitly reviewed grant and current source checks.</Text>:null}
  {v?<Text selectable style={styles.cardBody}>{'Private presentation: '+v.state+'\nActivation not recorded. No customer availability claimed.'}</Text>:null}
  {isApprovedQuoteProjection(v?.projection)?<Text selectable style={styles.cardBody}>{formatApprovedQuoteProjection(v.projection)}</Text>:null}
  {v?.state==='prepared_disabled'&&isApprovedQuoteProjection(v.projection)?<Button label="Continue saved presentation fields" disabled={busy||sourceBlocked||!free()} onPress={continueObserved}/>:null}
  {v?.revision===1?<Button label="Review V22.53 presentation revocation" disabled={busy||!free()} onPress={()=>decide('accessRevoke')}/>:null}
  {v?.presentationId?<Button label="Inspect quote decision preparation history" disabled={busy} onPress={()=>inspectDecisions(0)}/>:null}
  {decisions?.identity===identity?<Text selectable style={styles.cardBody}>{'Quote '+(decisions.value.quoteIdentifier||'context unavailable')+' · version '+(decisions.value.quoteVersion||'unavailable')+'\nEvidence: '+(decisions.value.evidenceStatus||'context unavailable')+'\nOriginal request '+(decisions.value.requestId||'unavailable')+'\nOwner-linked account '+(decisions.value.consumerId||'unavailable')+'\nLocal validation only; review current source before preparing the next owner action.'}</Text>:null}
  {decisions?.identity===identity?decisions.value.items.map(x=><Text key={x.responseId} selectable style={styles.cardBody}>{QUOTE_DECISION_LABELS[x.action]+' · local validation only\n'+x.question+'\nRecorded '+x.recordedAt+'\nNo binding agreement, booking or payment. Owner review remains required.'}</Text>):null}
  {decisions?.identity===identity&&decisions.value.nextCursor?<Button label="More quote decision preparation history" disabled={busy} onPress={()=>inspectDecisions(decisions.value.nextCursor)}/>:null}
  <Text style={styles.cardBody}>Request to proceed: interest only, with owner confirmation still required. Decline and Ask a question are not acceptance. Accept quote and agree to pay requires a firm offer, legal checks and separate release authority; it is disabled. No action automatically books, reserves a slot, invoices or charges.</Text>
 </Card>;
}
