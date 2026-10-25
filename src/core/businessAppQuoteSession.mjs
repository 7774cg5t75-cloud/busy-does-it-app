import {stableJson} from './stableJson.mjs';
import {isApprovedQuoteProjection} from './quoteAccessPolicy.mjs';
export const BUSINESS_APP_QUOTATIONS_ENABLED=false;
const uuid=v=>typeof v==='string'&&/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(v);
// Original account/request context guards navigation only. SQL/service remains authoritative.
// No live route uses this local-validation adapter; no token is recent-authentication evidence.
export function createBusinessAppQuoteSession({enabled=BUSINESS_APP_QUOTATIONS_ENABLED,getCurrent,accessToken,service,presentationId}){
 const initial=getCurrent(),scope=initial?.scope,actor=initial?.userId,app=initial?.appId,request=initial?.requestId,observations=new WeakMap(),tickets=new WeakMap();
 let latest=null,viewSession=null,readEpoch=0,outcome={status:'idle'},availability='unavailable';
 const current=()=>{const c=getCurrent();return enabled===true&&!!scope&&c?.scope===scope&&c.ready===true&&c.userId===actor&&c.appId===app&&c.requestId===request&&[actor,app,request,presentationId].every(uuid);};
 const call=async(op,fields,beforeSend=()=>true)=>{if(!current())throw Error('Quotation route disabled or account/request changed.');const token=await accessToken();if(!current()||!token||!beforeSend())throw Error('Current account unavailable.');const v=await service(op,{presentationId,appId:app,requestId:request,...fields},{token});if(!current())throw Error('Account/request changed during quotation operation.');return v;};
 const exact=v=>v&&v.presentationId===presentationId&&v.appId===app&&v.requestId===request&&v.actorId===actor&&v.mode==='local_validation_only'&&v.requiresHostedSessionProof===true&&v.consumerAccessAuthorised===false;
 const isObservation=v=>current()&&latest===v&&observations.get(v)===stableJson(v)&&isApprovedQuoteProjection(v.projection);
 const read=async()=>{const epoch=++readEpoch;try{const v=await call('quote_read',{sessionId:viewSession});if(epoch!==readEpoch)return {status:'superseded'};
  if(!exact(v)||!uuid(v.sessionId)||v.notOwnReceipt!==true||!Number.isSafeInteger(v.quoteVersion)||v.quoteVersion<1||!Number.isSafeInteger(v.responseRevision)||v.responseRevision<0||!Number.isSafeInteger(v.sessionRevision)||v.sessionRevision<1||!Number.isFinite(Date.parse(v.idleExpiresAt))||!isApprovedQuoteProjection(v.projection)||v.projection.quoteVersion!==v.quoteVersion)throw Error('Unsupported quotation observation.');
  viewSession=v.sessionId;latest=v;observations.set(v,stableJson(v));availability='available_local_validation';return {status:'available',observation:v};
 }catch{if(epoch!==readEpoch)return {status:'superseded'};latest=null;availability='unavailable';return {status:'unavailable',reason:'Current quote or viewing eligibility unavailable. Sign-in renewal and eligibility must be verified; no automatic renewal occurred.'};}};
 const review=({observation,action,question='',operationId,editor})=>{
  if(!isObservation(observation)||['pending','unknown'].includes(outcome.status)||!['request_to_proceed','decline','question'].includes(action)||typeof question!=='string'||action==='question'&&!question.trim()||action!=='question'&&question!==''||typeof operationId!=='string'||!/^[A-Za-z0-9_-]{8,120}$/.test(operationId)||!editor||!Number.isSafeInteger(editor.typingEpoch)||editor.typingEpoch<0)return null;
  try{if(encodeURIComponent(question).replace(/%[A-F0-9]{2}/g,'x').length>10000)return null;}catch{return null;}
  const ticket=Object.freeze({action,question,operationId});tickets.set(ticket,{observation,editor:stableJson(editor),used:false});return ticket;
 };
 const cancel=ticket=>{const v=tickets.get(ticket);if(v)v.used=true;return false;};
 const commit=async(ticket,getEditor)=>{
  const t=tickets.get(ticket);if(!current()||!t||t.used||!isObservation(t.observation)||stableJson(getEditor())!==t.editor||['pending','unknown'].includes(outcome.status))return {status:'reviewRequired'};
  t.used=true;outcome={status:'pending'};let sent=false;
  try{const r=await call('quote_decision',{sessionId:viewSession,action:ticket.action,question:ticket.question,expectedRevision:t.observation.responseRevision,operationId:ticket.operationId},()=>{if(!isObservation(t.observation)||stableJson(getEditor())!==t.editor)return false;sent=true;return true;});
   if(!exact(r)||r.sessionId!==viewSession||r.quoteVersion!==t.observation.quoteVersion||r.actorId!==actor||!uuid(r.responseId)||r.previousRevision!==t.observation.responseRevision||r.revision!==t.observation.responseRevision+1||r.action!==ticket.action||r.question!==ticket.question||r.operationId!==ticket.operationId||r.ownOperationReceipt!==true||r.notOwnReceipt===true||r.bindingAgreementRecorded!==false||r.bookingConfirmed!==false||r.executionAuthorised!==false||!Number.isFinite(Date.parse(r.recordedAt)))throw Error('Exact quotation decision receipt mismatch.');
   outcome={status:'confirmed',receipt:r};latest=null;availability='review_required';return outcome;
  }catch{outcome={status:sent?'unknown':'reviewRequired'};latest=null;availability='unavailable';return outcome;}
 };
 return {read,review,cancel,commit,isObservation,current,status:()=>({...outcome,availability}),context:()=>({presentationId,appId:app,requestId:request,userId:actor})};
}
