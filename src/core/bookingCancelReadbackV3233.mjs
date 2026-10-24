/**
 * V3.233 client-side check of an owner-only, server-scoped READ-ONLY
 * booking revision before explicitly approved cancellation.
 * The server and PostgreSQL still decide; this is never write permission.
 */
const UUID=/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
function assessBookingCancelReadbackV3233({
 businessId="",requestId="",response=null,localBookingStatus=""
}={}){
 const deny=reason=>({ok:false,reason,maySend:false,
  customerNotified:false,calendarDelivered:false,mayRetryAutomatically:false});
 const r=response?.revision;
 if(!UUID.test(businessId)||!UUID.test(requestId)||
   response?.ok!==true||!r||r.ok!==true||
   r.businessId!==businessId||r.requestId!==requestId||
   !UUID.test(r.appId)||r.readOnly!==true||
   r.ownerApprovalRequired!==true||
   r.mayClose!==true||r.alreadyClosed!==false||
   !["reviewing","accepted"].includes(r.status)||
   !["booking_draft","booking_confirmed"].includes(r.bridgeState)||
   (r.status==="reviewing"&&(r.bridgeState!=="booking_draft"||
    r.workLedgerState!=="not_applicable"))||
   (r.status==="accepted"&&(r.bridgeState!=="booking_confirmed"||
    r.workLedgerState!=="confirmed"))||
   (localBookingStatus==="Confirmed"&&r.workLedgerState!=="confirmed")||
   typeof r.updatedAt!=="string"||
   !Number.isFinite(Date.parse(r.updatedAt))||
   r.calendarDelivered!==false||r.customerNotified!==false)
  return deny("This booking has changed or could not be verified. Open the current booking before cancelling.");
 return {ok:true,kind:"owner_booking_cancel_preflight_v3233",
  requestId,businessId,expectedStatus:r.status,
  expectedUpdatedAt:r.updatedAt,
  workLedgerState:r.workLedgerState,
  ownerApprovedCancellationStillRequired:true,
  calendarDelivered:false,customerNotified:false,
  mayRetryAutomatically:false,maySend:false};
}
export {assessBookingCancelReadbackV3233};

// Fixed original revision projection only. Observation cannot settle an own lost receipt.
export function inspectBookingReadbackV3233({businessId,requestId,response}={}){
 const r=response?.revision,deny=()=>({ok:false,reason:'The original booking evidence is incomplete or inconsistent.'});
 if(!UUID.test(businessId||'')||!UUID.test(requestId||'')||response?.ok!==true||r?.ok!==true||r.kind!=='owner_booking_revision_v3233'||r.businessId!==businessId||r.requestId!==requestId||!UUID.test(r.appId||'')||r.readOnly!==true||r.ownerApprovalRequired!==true||r.customerDetailsIncluded!==false||r.calendarDelivered!==false||r.customerNotified!==false||r.mayRetryAutomatically!==false||typeof r.updatedAt!=='string'||!Number.isFinite(Date.parse(r.updatedAt)))return deny();
 const draft=r.status==='reviewing'&&r.bridgeState==='booking_draft'&&r.workLedgerState==='not_applicable'&&r.mayClose===true&&r.alreadyClosed===false;
 const confirmed=r.status==='accepted'&&r.bridgeState==='booking_confirmed'&&r.workLedgerState==='confirmed'&&r.mayClose===true&&r.alreadyClosed===false;
 const closed=r.status==='closed'&&r.bridgeState==='closed'&&['cancelled','not_applicable'].includes(r.workLedgerState)&&r.mayClose===false&&r.alreadyClosed===true;
 if(!draft&&!confirmed&&!closed)return deny();
 return {ok:true,kind:'booking-observation',businessId,requestId,appId:r.appId,sourceState:draft?'draft':confirmed?'confirmed':'closed',updatedAt:r.updatedAt,workLedgerState:r.workLedgerState,alreadyClosed:closed,readOnly:true,notOwnReceipt:true,canAdoptLocalStatus:false,mayRetryAutomatically:false,mayReschedule:false};
}

export function inspectBookingAssociationV3233({businessId,requestId,customerId,actionId,response}={}){
 const base=inspectBookingReadbackV3233({businessId,requestId,response}),a=response?.revision?.association;
 const deny=()=>({ok:false,reason:'The current customer and original booking association could not be verified. Keep your wording and inspect the source again.'});
 if(!base.ok||response.revision.notOwnReceipt!==true||a?.kind!=='persisted_booking_association_v3233'||a.customerId!==customerId||a.actionId!==actionId||typeof a.linkRevision!=='string'||!Number.isFinite(Date.parse(a.linkRevision)))return deny();
 let diary=null;
 if(a.diary){
  const d=a.diary,p=new Date(String(d.date)+'T12:00:00Z');
  if(!UUID.test(d.id||'')||typeof d.date!=='string'||!/^20\d{2}-\d{2}-\d{2}$/.test(d.date)||!Number.isFinite(p.getTime())||p.toISOString().slice(0,10)!==d.date||typeof d.time!=='string'||!/^([01]\d|2[0-3]):[0-5]\d$/.test(d.time)||typeof d.timeZone!=='string'||!/^[A-Za-z_]+(?:\/[A-Za-z0-9_+\-]+)*$/.test(d.timeZone)||d.timeZone.length>64||d.state!==base.workLedgerState||typeof d.revision!=='string'||!Number.isFinite(Date.parse(d.revision)))return deny();
  diary={id:d.id,date:d.date,time:d.time,timeZone:d.timeZone,state:d.state,revision:d.revision};
 }else if(base.workLedgerState!=='not_applicable')return deny();
 return {...base,association:{kind:a.kind,customerId,actionId,linkRevision:a.linkRevision,diary}};
}

// Fixed account-only recognition projection. This is never a restore or receipt permit.
export function validAccountBookingWork(value,source,observed){
 const exact=(v,keys)=>!!v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).sort().join(',')===[...keys].sort().join(',');
 const a=observed?.association,d=a?.diary;
 if(!a||!d||!exact(value,['businessId','ownerId','requestId','appId','revision','schemaVersion','requestRevision','linkRevision','workRevision','customer','action','ledger','matchesLedger','readOnly','notOwnReceipt','canRestore'])||value.businessId!==source.businessId||value.ownerId!==source.ownerId||value.requestId!==observed.requestId||value.appId!==observed.appId||value.revision!==source.revision||value.schemaVersion!==1||value.requestRevision!==observed.updatedAt||value.linkRevision!==a.linkRevision||value.workRevision!==d.revision||value.readOnly!==true||value.notOwnReceipt!==true||value.canRestore!==false||typeof value.matchesLedger!=='boolean')return false;
 const c=value.customer,b=value.action,l=value.ledger;
 if(!exact(c,['id','name','service'])||c.id!==a.customerId||typeof c.name!=='string'||!c.name||c.name.length>240||typeof c.service!=='string'||!c.service||c.service.length>240||!exact(b,['id','type','status','date','time'])||b.id!==a.actionId||b.type!=='booking'||!['Draft','Confirmed','Cancelled'].includes(b.status)||typeof b.date!=='string'||typeof b.time!=='string'||!exact(l,['id','date','time','timeZone','state'])||l.id!==d.id||l.date!==d.date||l.time!==d.time||l.timeZone!==d.timeZone||l.state!==d.state)return false;
 const date=new Date(b.date+'T12:00:00Z');
 if(b.date!==''&&(!/^20\d{2}-\d{2}-\d{2}$/.test(b.date)||!Number.isFinite(date.getTime())||date.toISOString().slice(0,10)!==b.date)||b.time!==''&&!/^([01]\d|2[0-3]):[0-5]\d$/.test(b.time)||b.status!=='Draft'&&(!b.date||!b.time))return false;
 return value.matchesLedger===(b.date===l.date&&b.time===l.time&&b.status===(l.state==='confirmed'?'Confirmed':'Cancelled'));
}

// Display comparison only. Neither a local match nor this predicate authorises a write.
export function accountBookingContext(review,{ownerId,businessId,role,request,customers=[],lastSimulatedRecipients=[],replyActions={},revision}={}){
 if(role!=='owner'||!UUID.test(ownerId||'')||!UUID.test(businessId||'')||review?.ownerId!==ownerId||review.businessId!==businessId||request?.business_id!==businessId||request.id!==review.requestId||request.mini_app_id!==review.appId||!Number.isSafeInteger(review.revision)||review.revision<1)return null;
 const observed={requestId:request.id,appId:request.mini_app_id,updatedAt:review.requestRevision,association:{customerId:review.customer?.id,actionId:review.action?.id,linkRevision:review.linkRevision,diary:{...review.ledger,revision:review.workRevision}}};
 if(![review.requestRevision,review.linkRevision,review.workRevision].every(x=>typeof x==='string'&&Number.isFinite(Date.parse(x)))||!validAccountBookingWork(review,{ownerId,businessId,revision:review.revision},observed))return null;
 const rows=[...(Array.isArray(customers)?customers:[]),...(Array.isArray(lastSimulatedRecipients)?lastSimulatedRecipients:[])].filter(row=>row?.id===review.customer.id);
 let device='missing';
 if(rows.length>1)device='ambiguous';
 else if(rows.length===1){
  const c=rows[0],a=replyActions?.[c.id],d=a?.details;
  if([c.businessId,c.business_id].some(id=>id&&id!==businessId))device='foreign';
  else if(a?.type!=='booking'||d?.sourceMiniAppRequestId!==request.id)device='unsupported';
  else device=c.name===review.customer.name&&c.service===review.customer.service&&d.bookingStatus===review.action.status&&d.bookingDate===review.action.date&&d.bookingTime===review.action.time?'matching':'different';
 }
 return {device,revisionDiffers:Number.isSafeInteger(revision)&&revision!==review.revision,sourceConflict:!review.matchesLedger};
}
