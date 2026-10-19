import React from 'react';
import {prepareSocialBrandHandoff,confirmSocialBrandHandoff} from '../core/socialBrandHandoffV3199.mjs';

// Pending intent stays inside the original in-memory source context. No draft store or save authority.
export function useSocialContentHandoff(input){
 const live=React.useRef(input),epoch=React.useRef(0);live.current=input;
 const scope=input.workspaceScope;
 const current=()=>live.current.workspaceScope===scope;
 const context=()=>({website:live.current.website,app:live.current.app,businessId:live.current.businessId,approvedProfile:live.current.approvedProfile});
 const setContext=value=>{live.current={...live.current,sourceContext:value};input.setSourceContext(value);};
 const valid=()=>current()&&!!live.current.ownerId&&!!live.current.businessId&&['owner','admin'].includes(live.current.role);
 const prepare=(serviceName='',platform='',sourceMode='')=>{
  if(!valid())return false;
  const evidence=serviceName?prepareSocialBrandHandoff({...context(),serviceName,sourceMode}):(()=>{const result=prepareSocialBrandHandoff({...context(),sourceMode});return result.ok?null:result;})();
  const pending={evidence,serviceName,sourceMode,platform:['Facebook','Instagram'].includes(platform)?platform:'',scope,ownerId:live.current.ownerId};
  epoch.current++;setContext({...live.current.sourceContext,pendingContentIdea:pending});
  input.go('socialCreator');return true;
 };
 const keep=expected=>{if(!valid()||live.current.sourceContext?.pendingContentIdea!==expected)return false;epoch.current++;const {pendingContentIdea,...rest}=live.current.sourceContext;setContext(rest);return true;};
 const accept=(expected,ticket)=>{
  if(!fresh(ticket)||expected?.scope!==scope||live.current.sourceContext?.pendingContentIdea!==expected)return false;
  const checked=confirmSocialBrandHandoff({...context(),evidence:expected.evidence});
  if(!checked.ok)return false;
  // Explicit acceptance creates a new private draft target, preserving deliberately selected media.
  epoch.current++;input.setText(checked.copy);live.current={...live.current,text:checked.copy};
  input.setSelectedDraftId(null);input.setAiResult(null);input.setAiStatus('idle');input.setCaptionId('');
  setContext({type:'approved_service',label:'Approved service wording',service:checked.serviceName,suggestedPlatform:expected.platform,customerId:'',jobId:''});
  return true;
 };
 const editText=value=>{if(!current())return;epoch.current++;live.current={...live.current,text:value};input.setText(value);};
 // UI confirmations must bind to the exact current local draft, including pre-render typing.
 const capture=()=>({epoch:epoch.current,scope,website:live.current.website,app:live.current.app,profile:JSON.stringify(live.current.approvedProfile),aiResult:live.current.aiResult,text:live.current.text,selectedId:live.current.selectedDraftId,photos:live.current.photos,brief:live.current.brief,channels:JSON.stringify(live.current.channels),pending:live.current.sourceContext?.pendingContentIdea});
 const fresh=ticket=>valid()&&ticket?.scope===scope&&ticket.epoch===epoch.current&&ticket.website===live.current.website&&ticket.app===live.current.app&&ticket.profile===JSON.stringify(live.current.approvedProfile)&&ticket.aiResult===live.current.aiResult&&ticket.text===live.current.text&&ticket.selectedId===live.current.selectedDraftId&&ticket.photos===live.current.photos&&ticket.brief===live.current.brief&&ticket.channels===JSON.stringify(live.current.channels)&&ticket.pending===live.current.sourceContext?.pendingContentIdea;
 const reopen=(record,load)=>{
  if(!valid()||!live.current.records?.includes(record))return false;
  const ticket=capture(),now=live.current,saved=now.records.find(row=>row.id===now.selectedDraftId);
  const media=rows=>JSON.stringify((rows||[]).map(row=>[row.id||'',row.uri||'',row.storagePath||'']));
  const dirty=now.text.trim()!==(saved?.text||'')||media(now.photos)!==media(saved?.photos)||!!now.brief&&now.brief!==(saved?.brief||'');
  const open=()=>{if(!fresh(ticket)||!live.current.records?.includes(record))return false;epoch.current++;load();return true;};
  if(dirty){input.confirm?.({keep:()=>{},discard:open});return false;}return open();
 };
 return {prepare,keep,accept,capture,fresh,editText,reopen,invalidate:()=>{if(current())epoch.current++;}};
}
