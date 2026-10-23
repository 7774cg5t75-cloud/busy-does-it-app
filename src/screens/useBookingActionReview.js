import React from 'react';
import {Alert} from 'react-native';
import {useOwnerEditNavigation} from './useOwnerEditNavigation';
const fields=['actionBookingDate','actionBookingTime','actionJobValue','actionJobNote'];
const values=s=>fields.map(key=>String(s[key]??''));
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
// Volatile review metadata only. Work's original fields, diary and completion own all data.
export function useBookingActionReview(s){
 const live=React.useRef(s),epoch=React.useRef(0),dirty=React.useRef(false),pending=React.useRef(null);live.current=s;
 const mounted=React.useRef(true);React.useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;pending.current=null;};},[]);
 const [statusReview,setStatusReview]=React.useState(null),statusTicket=React.useRef(null);
 const customer=s.selectedReplyCustomer,action=s.replyActions?.[customer?.id],scope=s.ownerWorkspaceScope;
 const actor=s.ownerSession?.userId,business=s.cloudWorkspace?.businessId,role=s.cloudWorkspace?.role,view=s.screen??s.view;
 const table=s.replyActions,tableStamp=JSON.stringify(table),revision=s.cloudRevision,slot=s.quietSlot;
 const stamp=JSON.stringify(action),customerStamp=JSON.stringify(customer),renderValues=values(s),typing=epoch.current;
 const baseline=React.useRef({scope,actor,business,id:customer?.id,action,stamp,values:renderValues});
 if(baseline.current.scope!==scope||baseline.current.actor!==actor||baseline.current.business!==business||baseline.current.id!==customer?.id){baseline.current={scope,actor,business,id:customer?.id,action,stamp,values:renderValues};dirty.current=false;pending.current=null;}
 const current=()=>mounted.current&&!!scope&&!!actor&&!!business&&['owner','admin'].includes(role)&&
  ![customer?.businessId,customer?.business_id].some(id=>id&&id!==business)&&
  live.current.ownerWorkspaceScope===scope&&live.current.ownerSession?.userId===actor&&live.current.cloudWorkspace?.businessId===business&&live.current.cloudWorkspace?.role===role&&(live.current.screen??live.current.view)===view&&
  live.current.replyActions===table&&JSON.stringify(table)===tableStamp&&live.current.cloudRevision===revision&&live.current.quietSlot===slot&&
  live.current.selectedReplyCustomer===customer&&JSON.stringify(customer)===customerStamp&&live.current.replyActions?.[customer?.id]===action&&JSON.stringify(action)===stamp&&action?.type==='booking';
 const receipt=pending.current;
 const acknowledged=receipt&&receipt.scope===scope&&receipt.actor===actor&&receipt.business===business&&receipt.role===role&&receipt.view===view&&receipt.id===customer?.id&&action!==receipt.action&&receipt.matches(action);
 const statusOperation=s.bookingStatusOperation;
 const statusAcknowledged=!!statusOperation&&statusOperation.scope===scope&&statusOperation.customerId===customer?.id&&statusOperation.role===role&&['confirmed','local'].includes(statusOperation.phase)&&statusOperation.before===baseline.current.action&&action!==statusOperation.before&&statusOperation.matches?.(action);
 if(statusAcknowledged)baseline.current={...baseline.current,action,stamp}; // Only this local record changed; no fields or dirty metadata are cleared.
 const conflict=(baseline.current.action!==action||baseline.current.stamp!==stamp)&&!acknowledged;
 const report=useOwnerEditNavigation(s,{source:action,projectId:'booking:'+customer?.id,revision:stamp},()=>{
  if(!current())return false;
  const details=action?.details||{},restored=[String(details.bookingDate??baseline.current.values[0]),String(details.bookingTime??baseline.current.values[1]),String(details.jobValue??baseline.current.values[2]),String(details.completionNote??baseline.current.values[3])];
  restored.forEach((value,index)=>{live.current={...live.current,[fields[index]]:value};s['set'+fields[index][0].toUpperCase()+fields[index].slice(1)]?.(value);});
  epoch.current++;dirty.current=false;pending.current=null;baseline.current={scope,actor,business,id:customer.id,action,stamp,values:restored};return true;
 });
 const edit=(field,value)=>{
  if(!current()||conflict||!fields.includes(field)||typeof value!=='string')return false;
  epoch.current++;live.current={...live.current,[field]:value};dirty.current=!same(values(live.current),baseline.current.values);report(dirty.current);
  s['set'+field[0].toUpperCase()+field.slice(1)]?.(value);return true;
 };
 const statusBlocked=()=>!!customer?.id&&!!live.current.bookingStatusOperation&&live.current.bookingStatusOperation.customerId===customer.id&&['pending','unknown','confirmed-review'].includes(live.current.bookingStatusOperation.phase);
 const commit=(operation,matches,{leave=true,savedFields=fields,onAccepted}={})=>{
  if(!current()||conflict||pending.current||statusBlocked()||typing!==epoch.current||!same(values(live.current),renderValues))return false;
  const ticket={scope,actor,business,role,view,onAccepted,id:customer.id,action,matches,values:renderValues,typing:++epoch.current,leave,savedFields};pending.current=ticket;
  try{const result=report.commit(operation);if(result===false||result===null){pending.current=null;return false;}return result;}
  catch(error){pending.current=null;throw error;}
 };
 React.useEffect(()=>{
  const ticket=pending.current;
  if(!ticket||!acknowledged||!current())return;
  pending.current=null;
  const accepted=baseline.current.values.map((value,index)=>ticket.savedFields.includes(fields[index])?ticket.values[index]:value);
  baseline.current={scope,actor,business,id:customer.id,action,stamp,values:accepted};
  dirty.current=!same(values(live.current),accepted);report(dirty.current);
  if(!dirty.current){if(ticket.onAccepted)ticket.onAccepted();else if(ticket.leave)s.back?.();}
 },[action,stamp,scope,actor,business,...renderValues]);
 const transition=operation=>{
  let used=false;
  const isCurrent=()=>!used&&current()&&!conflict&&!pending.current&&typing===epoch.current&&same(values(live.current),renderValues);
  if(!isCurrent()||typeof s.requestOwnerEditTransition!=='function')return false;
  return s.requestOwnerEditTransition(()=>{if(used||!current()||pending.current)return false;used=true;return operation();},{isCurrent});
 };
 const inspectStatus=async()=>{
  const captured=epoch.current;
  const valid=()=>current()&&epoch.current===captured;
  if(!valid()||typeof s.prepareBookingStatus!=='function')return false;
  try{const observed=await s.prepareBookingStatus(customer.id,'Cancelled',{isCurrent:valid,readOnly:true});if(!valid()||!observed?.readOnly||!observed.notOwnReceipt)return false;
   setStatusReview({scope,id:customer.id,phase:'observation',message:observed.kind==='local-booking-observation'?'This is the current local booking only. No account outcome or durable draft was verified.':observed.alreadyClosed?'The original account request now shows closed. This is an observation, not proof that your interrupted action committed. Do not replay cancellation.':'The original account request is not recorded as closed. This does not settle a pending or lost acknowledgement; do not retry it automatically.'});return true;
  }catch{if(valid())setStatusReview({scope,id:customer.id,phase:'observation',message:'The original request could not be checked. Keep your wording; no operation was retried.'});return false;}
 };
 const reviewStatus=status=>statusBlocked()?false:transition(async()=>{
  const captured=epoch.current,wording=values(live.current),token={};statusTicket.current=token;
  const valid=()=>statusTicket.current===token&&current()&&!conflict&&!pending.current&&epoch.current===captured&&same(values(live.current),wording);
  setStatusReview({scope,id:customer.id,phase:'checking',message:'Checking the original booking before review. Nothing has been changed.'});
  try{
   if(typeof s.prepareBookingStatus!=='function')throw Error('Account-backed booking review is unavailable. Keep your current details.');
   const review=await s.prepareBookingStatus(customer.id,status,{isCurrent:valid});
   if(!valid()||!review){if(current())setStatusReview({scope,id:customer.id,phase:'conflict',message:'The booking or editor changed. Your wording is kept; start a fresh review.'});return false;}
   setStatusReview({scope,id:customer.id,phase:'approval',message:'Review the recorded date, time and value before choosing. Nothing has been changed.'});
   let approvedOnce=false;
   Alert.alert(status==='Cancelled'?'Review booking cancellation':'Review booking reopening',
    customer.name+' · '+customer.id+'\nRecorded: '+String(action.details?.bookingDate||'No date')+' at '+String(action.details?.bookingTime||'No time')+'\nRecorded value: '+String(action.details?.jobValue??action.details?.sourceQuoteAmount??'Not recorded')+'\n'+
    (action.details?.sourceMiniAppRequestId?'The original request and Work transaction must confirm this change. Calendar/customer delivery is separate.':'This changes the local booking record only. Account saving and customer agreement are not confirmed.')+'\n'+(status==='Cancelled'?'Cancellation removes this booking from active work.':'Review diary clashes before reopening.'),[
     {text:'Keep current booking',style:'cancel',onPress:()=>{if(!approvedOnce&&statusTicket.current===token){statusTicket.current=null;setStatusReview(null);}}},
     {text:status==='Cancelled'?'Approve reviewed cancellation':'Approve reviewed reopening',style:status==='Cancelled'?'destructive':'default',onPress:async()=>{
      if(approvedOnce||!valid())return false;approvedOnce=true;
      // UI choice and parent review are distinct one-use checks. Keep the original source predicate intact.
      const operationCurrent=()=>valid();
      setStatusReview({scope,id:customer.id,phase:'pending',message:'Applying only the reviewed status. Your editor is kept.'});
      let result;try{result=await s.setBookingStatus(customer.id,status,{review,isCurrent:operationCurrent});}catch{if(current())setStatusReview({scope,id:customer.id,phase:'unknown',message:'The outcome could not be verified. Keep your wording and inspect the original booking; do not retry automatically.'});return false;}finally{if(statusTicket.current===token)statusTicket.current=null;}
      if(current())setStatusReview({scope,id:customer.id,phase:result===true?'observed':'review',message:result===true?'The original status operation returned confirmation. Device/account snapshot saving and delivery remain separate.':'Keep your current wording. Check the original operation status before another action.'});
      return result;
     }},
    ]);return true;
  }catch(error){if(statusTicket.current===token)statusTicket.current=null;if(current())setStatusReview({scope,id:customer.id,phase:'failed',message:error?.message||'Could not review the original booking. Nothing was submitted.'});return false;}
 });
 const unsupportedReschedule=!!action?.details?.sourceMiniAppRequestId&&(s.actionBookingDate!==action.details.bookingDate||s.actionBookingTime!==action.details.bookingTime);
 return {edit,commit,transition,unsupportedReschedule,reviewStatus,inspectStatus,statusBlocked:statusBlocked(),statusReview:statusReview&&statusReview.scope===scope&&statusReview.id===customer?.id&&(!s.bookingStatusOperation||s.bookingStatusOperation.customerId!==customer?.id||s.bookingStatusOperation.phase==='pending'||statusReview.phase==='observation')?statusReview:null,conflict,saving:!!pending.current,dirty:dirty.current};
}
