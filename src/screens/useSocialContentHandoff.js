import React from 'react';
import {publicBusinessContent,selectBusinessContent,prepareBusinessContentEnquiry} from '../core/businessContentRecords.mjs';
import {prepareSocialBrandHandoff,confirmSocialBrandHandoff,resolveSocialServiceIntent,prepareSocialRecordHandoff,prepareOwnerAnnouncementHandoff} from '../core/socialBrandHandoffV3199.mjs';

// Pending intent stays inside the original in-memory source context. No draft store or save authority.
export function useSocialContentHandoff(input){
 const live=React.useRef(input),epoch=React.useRef(0);live.current=input;
 const scope=input.workspaceScope,renderEpoch=epoch.current;
 const current=()=>live.current.workspaceScope===scope;
 const context=()=>({website:live.current.website,app:live.current.app,businessId:live.current.businessId,approvedProfile:live.current.approvedProfile});
 const setContext=value=>{live.current={...live.current,sourceContext:value};input.setSourceContext(value);};
 const valid=()=>current()&&!!live.current.ownerId&&!!live.current.businessId&&['owner','admin'].includes(live.current.role);
 const prepare=(serviceName='',platform='',sourceMode='',purpose='service',ownerFacts='',treatment='standard',requiresTreatmentSelection=false)=>{
  if(!valid())return false;
  const evidence=purpose==='owner-announcement'?prepareOwnerAnnouncementHandoff({...context(),sourceMode,ownerFacts,treatment}):serviceName||purpose==='business-introduction'?prepareSocialBrandHandoff({...context(),serviceName,sourceMode,purpose,treatment}):(()=>{const result=prepareSocialBrandHandoff({...context(),sourceMode});return result.ok?null:result;})();
  const pending={evidence,serviceName,sourceMode,purpose,ownerFacts,treatment,requiresTreatmentSelection,session:{},platform:['Facebook','Instagram'].includes(platform)?platform:'',scope,ownerId:live.current.ownerId};
  epoch.current++;setContext({...live.current.sourceContext,pendingContentIdea:pending});
  input.go('socialCreator');return true;
 };
 const keep=expected=>{if(!valid()||expected?.scope!==scope||live.current.sourceContext?.pendingContentIdea!==expected)return false;epoch.current++;const {pendingContentIdea,...rest}=live.current.sourceContext;setContext(rest);return true;};
 const failPending=(expected,reason)=>{
  if(valid()&&expected?.scope===scope&&live.current.sourceContext?.pendingContentIdea===expected){epoch.current++;setContext({...live.current.sourceContext,pendingContentIdea:{...expected,loading:false,evidence:{ok:false,reason}}});}return false;
 };
 const loadRecords=async(kind,platform='',sourceMode='',hint=null,treatment='standard',requiresTreatmentSelection=false)=>{
  if(!valid()||!['product','event'].includes(kind))return false;
  const pending={purpose:kind,platform,sourceMode,treatment,requiresTreatmentSelection,scope,ownerId:live.current.ownerId,loading:true};
  epoch.current++;setContext({...live.current.sourceContext,pendingContentIdea:pending});input.go('socialCreator');
  const ticket=capture();
  try{
   const result=await live.current.loadApprovedContent?.();
   if(!fresh(ticket))return failPending(pending,'Your draft changed while records loaded. Refresh the current approved items; your words are kept.');
   const feed=result?.ok===true&&result.businessId===live.current.businessId?publicBusinessContent(result.records,result.businessId):null;
   const records=feed?.ok?selectBusinessContent(feed,{kind}).filter(row=>row.data.status!=='cancelled'):[];
   let evidence=feed?.ok?null:{ok:false,reason:'Current approved records could not be loaded. Your draft is unchanged.'};
   let selectionHint=null;
   if(hint&&feed?.ok){
    const row=feed.records.find(item=>item.id===hint.selection?.recordId),interest=prepareBusinessContentEnquiry(feed,live.current.businessId,hint.selection);
    if(row&&JSON.stringify(row)===hint.recordStamp&&interest.ok){selectionHint={selection:interest.selection,recordStamp:JSON.stringify(row)};evidence=prepareSocialRecordHandoff({...context(),sourceMode,feed,selection:interest.selection,treatment});}
    else evidence={ok:false,reason:'This item changed since the suggestion. Choose its current approved information below.'};
   }
   epoch.current++;setContext({...live.current.sourceContext,pendingContentIdea:{...pending,loading:false,feed,records,evidence,selectionHint}});return !!feed?.ok;
  }catch{
   if(fresh(ticket)){epoch.current++;setContext({...live.current.sourceContext,pendingContentIdea:{...pending,loading:false,evidence:{ok:false,reason:'Could not load approved records. Your draft is unchanged.'}}});}return false;
  }
 };
 const pendingCurrent=expected=>valid()&&expected?.scope===scope&&live.current.sourceContext?.pendingContentIdea===expected;
 const pendingTreatment=expected=>expected?.treatment||expected?.evidence?.treatment||'standard';
 const selectService=(expected,serviceName)=>{
  if(!pendingCurrent(expected)||expected.purpose!=='service')return false;
  return prepare(serviceName,expected.platform,expected.sourceMode,'service','',pendingTreatment(expected),expected.requiresTreatmentSelection);
 };
 const recordHint=expected=>expected.evidence?.selection?{selection:expected.evidence.selection,recordStamp:expected.evidence.recordStamp}:expected.selectionHint||null;
 const refreshRecords=expected=>pendingCurrent(expected)&&['product','event'].includes(expected.purpose)?loadRecords(expected.purpose,expected.platform,expected.sourceMode,recordHint(expected),pendingTreatment(expected),expected.requiresTreatmentSelection):false;
 const switchSource=(expected,sourceMode)=>{
  if(!pendingCurrent(expected)||sourceMode!=='approved-profile')return false;
  const treatment=pendingTreatment(expected);
  if(['product','event'].includes(expected.purpose)){
   const hint=recordHint(expected);
   return loadRecords(expected.purpose,expected.platform,sourceMode,hint,treatment,expected.requiresTreatmentSelection);
  }
  return prepare(expected.serviceName,expected.platform,sourceMode,expected.purpose,expected.ownerFacts,treatment,expected.requiresTreatmentSelection);
 };
 const start=purpose=>{
  if(!valid()||epoch.current!==renderEpoch||!['service','business-introduction','product','event','owner-announcement'].includes(purpose))return false;
  const pending=live.current.sourceContext?.pendingContentIdea,evidence=live.current.sourceContext?.contentEvidence;
  const treatment=pendingCurrent(pending)?pendingTreatment(pending):evidence?.businessId===live.current.businessId?evidence.treatment||'standard':'standard';
  // A treatment is reusable preference, never approval of the previous facts.
  const sourceMode=pendingCurrent(pending)?pending.sourceMode:evidence?.businessId===live.current.businessId?evidence.sourceMode||'':'';
  const requiresTreatmentSelection=pendingCurrent(pending)&&!!pending.requiresTreatmentSelection;
  return ['product','event'].includes(purpose)?loadRecords(purpose,'',sourceMode,null,treatment,requiresTreatmentSelection):prepare('','',sourceMode,purpose,'',treatment,requiresTreatmentSelection);
 };
 const selectRecord=(expected,selection)=>{
  if(!valid()||expected?.scope!==scope||live.current.sourceContext?.pendingContentIdea!==expected)return false;
  const evidence=prepareSocialRecordHandoff({...context(),feed:expected.feed,sourceMode:expected.sourceMode,treatment:expected.treatment||expected.evidence?.treatment||"standard",selection});
  const interest=prepareBusinessContentEnquiry(expected.feed,live.current.businessId,selection),row=expected.feed?.records?.find(item=>item.id===selection.recordId);
  const selectionHint=interest.ok&&row?{selection:interest.selection,recordStamp:JSON.stringify(row)}:null;
  epoch.current++;setContext({...live.current.sourceContext,pendingContentIdea:{...expected,evidence,selectionHint}});return evidence.ok;
 };
 const chooseTreatment=(expected,treatment)=>{
  if(!valid()||expected?.scope!==scope||live.current.sourceContext?.pendingContentIdea!==expected||!['service','business-introduction','product','event','owner-announcement'].includes(expected.purpose))return false;
  if(!confirmSocialBrandHandoff({...context(),evidence:expected.evidence,feed:expected.feed}).ok)return failPending(expected,'The business source changed. Prepare a current idea before choosing its wording.');
  const base={...context(),sourceMode:expected.sourceMode,treatment};
  const evidence=['product','event'].includes(expected.purpose)?prepareSocialRecordHandoff({...base,feed:expected.feed,selection:expected.evidence.selection}):expected.purpose==='owner-announcement'?prepareOwnerAnnouncementHandoff({...base,ownerFacts:expected.ownerFacts}):prepareSocialBrandHandoff({...base,serviceName:expected.serviceName,purpose:expected.purpose});
  if(!evidence.ok)return false;
  epoch.current++;setContext({...live.current.sourceContext,pendingContentIdea:{...expected,evidence,treatment,requiresTreatmentSelection:false}});return true;
 };
 const editOwnerFacts=(expected,value)=>{
  const pending=live.current.sourceContext?.pendingContentIdea;
  if(!valid()||expected?.scope!==scope||!expected.session||pending?.session!==expected.session||pending.purpose!=='owner-announcement')return false;
  epoch.current++;setContext({...live.current.sourceContext,pendingContentIdea:{...pending,ownerFacts:value,evidence:prepareOwnerAnnouncementHandoff({...context(),sourceMode:pending.sourceMode,ownerFacts:value,treatment:pending.treatment||pending.evidence?.treatment||"standard"})}});return true;
 };
 const commitAccepted=(expected,checked)=>{
  // Explicit acceptance creates a new private draft target, preserving deliberately selected media.
  const warnings=live.current.aiResult?.privacyWarnings;
  const analysis=Array.isArray(warnings)&&warnings.length?{privacyWarnings:[...warnings],captions:[],story:null,detectedService:''}:null;
  epoch.current++;input.setText(checked.copy);live.current={...live.current,text:checked.copy,selectedDraftId:null,aiResult:analysis};
  input.setSelectedDraftId(null);input.setAiResult(analysis);input.setAiStatus('idle');input.setCaptionId('');
  const record=['product','event'].includes(checked.purpose);
  setContext({type:checked.purpose==='owner-announcement'?'owner_announcement':record?'approved_'+checked.purpose:checked.purpose==='business-introduction'?'approved_business':'approved_service',label:checked.purpose==='owner-announcement'?'Owner-supplied announcement · review needed':record?'Approved '+checked.purpose+' wording':checked.purpose==='business-introduction'?'Approved business introduction':'Approved service wording',service:checked.serviceName,selection:checked.selection,contentEvidence:checked,suggestedPlatform:expected.platform,customerId:'',jobId:''});
  return true;
 };
 const acceptRecord=async(expected,ticket)=>{
  try{
   const result=await live.current.loadApprovedContent?.();
   if(!fresh(ticket))return failPending(expected,'Your draft changed while its item was checked. Your words are kept; choose the current approved item again.');
   const feed=result?.ok===true&&result.businessId===live.current.businessId?publicBusinessContent(result.records,result.businessId):null;
   const checked=confirmSocialBrandHandoff({...context(),evidence:expected.evidence,feed});
   if(!checked.ok){epoch.current++;setContext({...live.current.sourceContext,pendingContentIdea:{...expected,evidence:{ok:false,reason:checked.reason}}});return false;}
   return commitAccepted(expected,checked);
  }catch{return failPending(expected,'Could not confirm the current approved item. Your draft was kept; refresh before using the idea.');}
 };
 const accept=(expected,ticket)=>{
  if(!fresh(ticket)||expected?.requiresTreatmentSelection||expected?.scope!==scope||live.current.sourceContext?.pendingContentIdea!==expected)return false;
  if(['product','event'].includes(expected.purpose))return acceptRecord(expected,ticket);
  const checked=confirmSocialBrandHandoff({...context(),evidence:expected.evidence});
  if(!checked.ok)return false;
  return commitAccepted(expected,checked);
 };
 const checkAccountDraft=async()=>{
  if(!valid())return false;
  const record=live.current.records?.find(row=>row.id===live.current.selectedDraftId);
  if(!record)return false;
  const ticket=capture();let review;
  try{
   const result=await live.current.loadSocialStatus?.();
   if(!fresh(ticket)||!live.current.records?.includes(record))return false;
   if(result?.owner?.businessId!==live.current.businessId||!Array.isArray(result.queue))throw Error('The account response did not match the current business.');
   const matches=result.queue.filter(row=>row.client_draft_id===record.id);
   if(matches.length!==1)review={status:'unknown',message:'Could not establish one saved account record for this draft. Keep your content; do not repeat an uncertain publication.'};
   else{
    const post=matches[0],known=['Draft','Ready to publish','Scheduled','Held for setup','Publishing','Published','Partial failure','Failed','Cancelled'];
    if(!known.includes(post.status)||typeof post.caption!=='string')throw Error('The account record needs review.');
    const same=post.caption===record.text;
    review={status:same?'confirmed':'different',serverStatus:post.status,message:same?'Account wording for the saved draft was read back. Its current status is '+post.status+'. This does not confirm newer words, photos or destination changes.':'The account wording differs from this private draft. Your current words and photos were kept. Review the account record before any further action.'};
   }
  }catch{review={status:'unknown',message:'Could not confirm the saved account record. Keep your current content; no write or publication was retried.'};}
  if(!fresh(ticket)||!live.current.records?.includes(record))return false;
  epoch.current++;setContext({...live.current.sourceContext,contentCloudReview:{...review,record,checkedText:ticket.text}});return review.status==='confirmed';
 };
 const reviewSource=async()=>{
  if(!valid())return false;
  const evidence=live.current.sourceContext?.contentEvidence;
  if(!evidence)return false;
  const ticket=capture();let result;
  try{
   let feed;
   if(['product','event'].includes(evidence.purpose)){
    const loaded=await live.current.loadApprovedContent?.();
    if(!fresh(ticket))return false;
    feed=loaded?.ok===true&&loaded.businessId===live.current.businessId?publicBusinessContent(loaded.records,loaded.businessId):null;
    if(!feed?.ok)throw Error('Current approved records could not be verified.');
   }
   result=confirmSocialBrandHandoff({...context(),evidence,feed});
  }catch{result={ok:false,unknown:true,reason:'Current source could not be checked. Your wording is kept; no publication or save is confirmed.'};}
  if(!fresh(ticket))return false;
  epoch.current++;setContext({...live.current.sourceContext,contentSourceReview:{status:result.ok?'current':result.unknown?'unknown':'changed',reason:result.reason||'',checkedText:ticket.text,evidence}});return result.ok;
 };
 const editText=value=>{if(!current())return;epoch.current++;live.current={...live.current,text:value};input.setText(value);};
 // UI confirmations must bind to the exact current local draft, including pre-render typing.
 const sourceJobStamp=()=>{
  const source=live.current.sourceContext;if(source?.type!=='job')return null;
  const customer=live.current.customers?.find(row=>row.id===source.customerId),job=customer?.history?.find(row=>row.id===source.jobId&&row.kind==='job');
  return job?JSON.stringify({customerId:customer.id,jobId:job.id,service:job.service||customer.service||'',postDraft:job.postDraft||'',photos:(job.photos||[]).filter(photo=>photo.marketingOk).map(photo=>[photo.id,photo.uri,photo.storagePath,photo.marketingOk])}):'unavailable';
 };
 const capture=()=>({epoch:epoch.current,scope,jobStamp:sourceJobStamp(),records:live.current.records,website:live.current.website,app:live.current.app,profile:JSON.stringify(live.current.approvedProfile),aiResult:live.current.aiResult,text:live.current.text,selectedId:live.current.selectedDraftId,photos:live.current.photos,brief:live.current.brief,channels:JSON.stringify(live.current.channels),pending:live.current.sourceContext?.pendingContentIdea});
 const fresh=ticket=>valid()&&sourceJobStamp()!=='unavailable'&&ticket?.jobStamp===sourceJobStamp()&&ticket?.scope===scope&&ticket.epoch===epoch.current&&ticket.website===live.current.website&&ticket.app===live.current.app&&ticket.profile===JSON.stringify(live.current.approvedProfile)&&ticket.aiResult===live.current.aiResult&&ticket.text===live.current.text&&ticket.selectedId===live.current.selectedDraftId&&ticket.photos===live.current.photos&&ticket.brief===live.current.brief&&ticket.channels===JSON.stringify(live.current.channels)&&ticket.pending===live.current.sourceContext?.pendingContentIdea;
 const freshSave=(ticket,record)=>{
  const selectedId=live.current.selectedDraftId;
  return !!record?.id&&(live.current.records===ticket?.records||live.current.records?.includes(record))&&(selectedId===ticket?.selectedId||selectedId===record.id)&&fresh({...ticket,selectedId});
 };
 const protectDraftTransition=(load,record=null)=>{
  if(!valid()||record&&!live.current.records?.includes(record))return false;
  const ticket=capture(),now=live.current,saved=now.records?.find(row=>row.id===now.selectedDraftId);
  const media=rows=>JSON.stringify((rows||[]).map(row=>[row.id||'',row.uri||'',row.storagePath||'']));
  const dirty=now.text.trim()!==(saved?.text||'')||media(now.photos)!==media(saved?.photos)||!!now.brief&&now.brief!==(saved?.brief||'');
  const open=()=>{if(!fresh(ticket)||record&&!live.current.records?.includes(record))return false;epoch.current++;return load()!==false;};
  if(dirty){input.confirm?.({keep:()=>{},discard:open,...!record?{message:'Starting a new post replaces the current unsaved wording and selected photos. Saved drafts remain unchanged.',actionLabel:'Start a new post'}:{}});return false;}return open();
 };
 const reopen=(record,load)=>protectDraftTransition(load,record);
 const replaceDraft=load=>protectDraftTransition(load);
 const replaceFromJob=(customer,job,load)=>{
  const stamp=JSON.stringify(job),service=customer?.service;
  const allowed=()=>valid()&&live.current.customers?.includes(customer)&&customer.history?.includes(job)&&job.kind==='job'&&JSON.stringify(job)===stamp&&customer.service===service&&(job.photos||[]).some(photo=>photo.marketingOk);
  if(!allowed())return false;
  return protectDraftTransition(()=>allowed()?load():false);
 };

 const route=text=>{
  if(!current())return {handled:false};
  const result=resolveSocialServiceIntent(text,context());
  if(result.handled&&['product','event'].includes(result.purpose)){void loadRecords(result.purpose,result.platform,'',null,result.treatment,result.needsTreatmentSelection);return {...result,opened:valid()};}
  return result.handled?{...result,opened:prepare(result.serviceName,result.platform,'',result.purpose,result.ownerFacts,result.treatment,result.needsTreatmentSelection)}:result;
 };
 return {isRenderCurrent:()=>valid()&&epoch.current===renderEpoch,route,prepare,start,switchSource,selectService,refreshRecords,loadRecords,selectRecord,chooseTreatment,editOwnerFacts,keep,accept,capture,fresh,freshSave,reviewSource,checkAccountDraft,editText,reopen,replaceDraft,replaceFromJob,invalidate:()=>{if(current())epoch.current++;}};
}
