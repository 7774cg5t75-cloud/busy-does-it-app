import React from 'react';
import {publicBusinessContent,selectBusinessContent} from '../core/businessContentRecords.mjs';
import {prepareSocialBrandHandoff,confirmSocialBrandHandoff,resolveSocialServiceIntent,prepareSocialRecordHandoff,prepareOwnerAnnouncementHandoff} from '../core/socialBrandHandoffV3199.mjs';

// Pending intent stays inside the original in-memory source context. No draft store or save authority.
export function useSocialContentHandoff(input){
 const live=React.useRef(input),epoch=React.useRef(0);live.current=input;
 const scope=input.workspaceScope;
 const current=()=>live.current.workspaceScope===scope;
 const context=()=>({website:live.current.website,app:live.current.app,businessId:live.current.businessId,approvedProfile:live.current.approvedProfile});
 const setContext=value=>{live.current={...live.current,sourceContext:value};input.setSourceContext(value);};
 const valid=()=>current()&&!!live.current.ownerId&&!!live.current.businessId&&['owner','admin'].includes(live.current.role);
 const prepare=(serviceName='',platform='',sourceMode='',purpose='service',ownerFacts='')=>{
  if(!valid())return false;
  const evidence=purpose==='owner-announcement'?prepareOwnerAnnouncementHandoff({...context(),sourceMode,ownerFacts}):serviceName||purpose==='business-introduction'?prepareSocialBrandHandoff({...context(),serviceName,sourceMode,purpose}):(()=>{const result=prepareSocialBrandHandoff({...context(),sourceMode});return result.ok?null:result;})();
  const pending={evidence,serviceName,sourceMode,purpose,ownerFacts,session:{},platform:['Facebook','Instagram'].includes(platform)?platform:'',scope,ownerId:live.current.ownerId};
  epoch.current++;setContext({...live.current.sourceContext,pendingContentIdea:pending});
  input.go('socialCreator');return true;
 };
 const keep=expected=>{if(!valid()||live.current.sourceContext?.pendingContentIdea!==expected)return false;epoch.current++;const {pendingContentIdea,...rest}=live.current.sourceContext;setContext(rest);return true;};
 const loadRecords=async(kind,platform='',sourceMode='')=>{
  if(!valid()||!['product','event'].includes(kind))return false;
  const pending={purpose:kind,platform,sourceMode,scope,ownerId:live.current.ownerId,loading:true};
  epoch.current++;setContext({...live.current.sourceContext,pendingContentIdea:pending});input.go('socialCreator');
  const ticket=capture();
  try{
   const result=await live.current.loadApprovedContent?.();
   if(!fresh(ticket))return false;
   const feed=result?.ok===true&&result.businessId===live.current.businessId?publicBusinessContent(result.records,result.businessId):null;
   const records=feed?.ok?selectBusinessContent(feed,{kind}).filter(row=>row.data.status!=='cancelled'):[];
   epoch.current++;setContext({...live.current.sourceContext,pendingContentIdea:{...pending,loading:false,feed,records,evidence:feed?.ok?null:{ok:false,reason:'Current approved records could not be loaded. Your draft is unchanged.'}}});return !!feed?.ok;
  }catch{
   if(fresh(ticket)){epoch.current++;setContext({...live.current.sourceContext,pendingContentIdea:{...pending,loading:false,evidence:{ok:false,reason:'Could not load approved records. Your draft is unchanged.'}}});}return false;
  }
 };
 const selectRecord=(expected,selection)=>{
  if(!valid()||live.current.sourceContext?.pendingContentIdea!==expected)return false;
  const evidence=prepareSocialRecordHandoff({...context(),feed:expected.feed,sourceMode:expected.sourceMode,selection});
  epoch.current++;setContext({...live.current.sourceContext,pendingContentIdea:{...expected,evidence}});return evidence.ok;
 };
 const editOwnerFacts=(expected,value)=>{
  const pending=live.current.sourceContext?.pendingContentIdea;
  if(!valid()||!expected.session||pending?.session!==expected.session||pending.purpose!=='owner-announcement')return false;
  epoch.current++;setContext({...live.current.sourceContext,pendingContentIdea:{...pending,ownerFacts:value,evidence:prepareOwnerAnnouncementHandoff({...context(),sourceMode:pending.sourceMode,ownerFacts:value})}});return true;
 };
 const commitAccepted=(expected,checked)=>{
  // Explicit acceptance creates a new private draft target, preserving deliberately selected media.
  const warnings=live.current.aiResult?.privacyWarnings;
  const analysis=Array.isArray(warnings)&&warnings.length?{privacyWarnings:[...warnings],captions:[],story:null,detectedService:''}:null;
  epoch.current++;input.setText(checked.copy);live.current={...live.current,text:checked.copy,selectedDraftId:null,aiResult:analysis};
  input.setSelectedDraftId(null);input.setAiResult(analysis);input.setAiStatus('idle');input.setCaptionId('');
  const record=['product','event'].includes(checked.purpose);
  setContext({type:checked.purpose==='owner-announcement'?'owner_announcement':record?'approved_'+checked.purpose:checked.purpose==='business-introduction'?'approved_business':'approved_service',label:checked.purpose==='owner-announcement'?'Owner-supplied announcement · review needed':record?'Approved '+checked.purpose+' wording':checked.purpose==='business-introduction'?'Approved business introduction':'Approved service wording',service:checked.serviceName,selection:checked.selection,suggestedPlatform:expected.platform,customerId:'',jobId:''});
  return true;
 };
 const acceptRecord=async(expected,ticket)=>{
  try{
   const result=await live.current.loadApprovedContent?.();
   if(!fresh(ticket))return false;
   const feed=result?.ok===true&&result.businessId===live.current.businessId?publicBusinessContent(result.records,result.businessId):null;
   const checked=confirmSocialBrandHandoff({...context(),evidence:expected.evidence,feed});
   if(!checked.ok){epoch.current++;setContext({...live.current.sourceContext,pendingContentIdea:{...expected,evidence:{ok:false,reason:checked.reason}}});return false;}
   return commitAccepted(expected,checked);
  }catch{return false;}
 };
 const accept=(expected,ticket)=>{
  if(!fresh(ticket)||expected?.scope!==scope||live.current.sourceContext?.pendingContentIdea!==expected)return false;
  if(['product','event'].includes(expected.purpose))return acceptRecord(expected,ticket);
  const checked=confirmSocialBrandHandoff({...context(),evidence:expected.evidence});
  if(!checked.ok)return false;
  return commitAccepted(expected,checked);
 };
 const editText=value=>{if(!current())return;epoch.current++;live.current={...live.current,text:value};input.setText(value);};
 // UI confirmations must bind to the exact current local draft, including pre-render typing.
 const capture=()=>({epoch:epoch.current,scope,records:live.current.records,website:live.current.website,app:live.current.app,profile:JSON.stringify(live.current.approvedProfile),aiResult:live.current.aiResult,text:live.current.text,selectedId:live.current.selectedDraftId,photos:live.current.photos,brief:live.current.brief,channels:JSON.stringify(live.current.channels),pending:live.current.sourceContext?.pendingContentIdea});
 const fresh=ticket=>valid()&&ticket?.scope===scope&&ticket.epoch===epoch.current&&ticket.website===live.current.website&&ticket.app===live.current.app&&ticket.profile===JSON.stringify(live.current.approvedProfile)&&ticket.aiResult===live.current.aiResult&&ticket.text===live.current.text&&ticket.selectedId===live.current.selectedDraftId&&ticket.photos===live.current.photos&&ticket.brief===live.current.brief&&ticket.channels===JSON.stringify(live.current.channels)&&ticket.pending===live.current.sourceContext?.pendingContentIdea;
 const reopen=(record,load)=>{
  if(!valid()||!live.current.records?.includes(record))return false;
  const ticket=capture(),now=live.current,saved=now.records.find(row=>row.id===now.selectedDraftId);
  const media=rows=>JSON.stringify((rows||[]).map(row=>[row.id||'',row.uri||'',row.storagePath||'']));
  const dirty=now.text.trim()!==(saved?.text||'')||media(now.photos)!==media(saved?.photos)||!!now.brief&&now.brief!==(saved?.brief||'');
  const open=()=>{if(!fresh(ticket)||!live.current.records?.includes(record))return false;epoch.current++;load();return true;};
  if(dirty){input.confirm?.({keep:()=>{},discard:open});return false;}return open();
 };
 const route=text=>{
  if(!current())return {handled:false};
  const result=resolveSocialServiceIntent(text,context());
  if(result.handled&&['product','event'].includes(result.purpose)){void loadRecords(result.purpose,result.platform);return {...result,opened:valid()};}
  return result.handled?{...result,opened:prepare(result.serviceName,result.platform,'',result.purpose,result.ownerFacts)}:result;
 };
 return {route,prepare,loadRecords,selectRecord,editOwnerFacts,keep,accept,capture,fresh,editText,reopen,invalidate:()=>{if(current())epoch.current++;}};
}
