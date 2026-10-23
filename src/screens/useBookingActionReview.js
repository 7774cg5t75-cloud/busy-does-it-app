import React from 'react';
import {useOwnerEditNavigation} from './useOwnerEditNavigation';
const fields=['actionBookingDate','actionBookingTime','actionJobValue','actionJobNote'];
const values=s=>fields.map(key=>String(s[key]??''));
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
// Volatile review metadata only. Work's original fields, diary and completion own all data.
export function useBookingActionReview(s){
 const live=React.useRef(s),epoch=React.useRef(0),dirty=React.useRef(false),pending=React.useRef(null);live.current=s;
 const customer=s.selectedReplyCustomer,action=s.replyActions?.[customer?.id],scope=s.ownerWorkspaceScope;
 const actor=s.ownerSession?.userId,business=s.cloudWorkspace?.businessId,role=s.cloudWorkspace?.role,view=s.view;
 const table=s.replyActions,tableStamp=JSON.stringify(table),revision=s.cloudRevision,slot=s.quietSlot;
 const stamp=JSON.stringify(action),customerStamp=JSON.stringify(customer),renderValues=values(s),typing=epoch.current;
 const baseline=React.useRef({scope,actor,business,id:customer?.id,action,stamp,values:renderValues});
 if(baseline.current.scope!==scope||baseline.current.actor!==actor||baseline.current.business!==business||baseline.current.id!==customer?.id){baseline.current={scope,actor,business,id:customer?.id,action,stamp,values:renderValues};dirty.current=false;pending.current=null;}
 const current=()=>!!scope&&!!actor&&!!business&&['owner','admin'].includes(role)&&
  ![customer?.businessId,customer?.business_id].some(id=>id&&id!==business)&&
  live.current.ownerWorkspaceScope===scope&&live.current.ownerSession?.userId===actor&&live.current.cloudWorkspace?.businessId===business&&live.current.cloudWorkspace?.role===role&&live.current.view===view&&
  live.current.replyActions===table&&JSON.stringify(table)===tableStamp&&live.current.cloudRevision===revision&&live.current.quietSlot===slot&&
  live.current.selectedReplyCustomer===customer&&JSON.stringify(customer)===customerStamp&&live.current.replyActions?.[customer?.id]===action&&JSON.stringify(action)===stamp&&action?.type==='booking';
 const receipt=pending.current;
 const acknowledged=receipt&&receipt.scope===scope&&receipt.actor===actor&&receipt.business===business&&receipt.role===role&&receipt.view===view&&receipt.id===customer?.id&&action!==receipt.action&&receipt.matches(action);
 const conflict=(baseline.current.action!==action||baseline.current.stamp!==stamp)&&!acknowledged;
 const report=useOwnerEditNavigation(s,{source:action,projectId:'booking:'+customer?.id,revision:stamp},()=>{
  if(!current())return false;
  const details=action?.details||{},restored=[String(details.bookingDate??baseline.current.values[0]),String(details.bookingTime??baseline.current.values[1]),String(details.jobValue??baseline.current.values[2]),String(details.completionNote??baseline.current.values[3])];
  restored.forEach((value,index)=>s['set'+fields[index][0].toUpperCase()+fields[index].slice(1)]?.(value));
  epoch.current++;dirty.current=false;pending.current=null;baseline.current={scope,actor,business,id:customer.id,action,stamp,values:restored};return true;
 });
 const edit=(field,value)=>{
  if(!current()||conflict||!fields.includes(field)||typeof value!=='string')return false;
  epoch.current++;live.current={...live.current,[field]:value};dirty.current=!same(values(live.current),baseline.current.values);report(dirty.current);
  s['set'+field[0].toUpperCase()+field.slice(1)]?.(value);return true;
 };
 const commit=(operation,matches,{leave=true,savedFields=fields,onAccepted}={})=>{
  if(!current()||conflict||pending.current||typing!==epoch.current||!same(values(live.current),renderValues))return false;
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
 return {edit,commit,transition,conflict,saving:!!pending.current,dirty:dirty.current};
}
