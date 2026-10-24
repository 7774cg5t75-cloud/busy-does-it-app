/**
 * V3.181 — reconcile server-stored BUSY Work booking ledger with device records.
 * The DB is authoritative for Business App booking date/time/status; local
 * snapshots are retained for other work and optional customer display fields.
 * This does not certify external calendar delivery or published app success.
 */
import {inspectBookingAssociationV3233} from './bookingCancelReadbackV3233.mjs';
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function reconcileWorkBookingLedger({
 businessId="",appId="",ledger=null,localBookings=[]
}={}){
 if(!UUID.test(businessId)||!Array.isArray(localBookings)||localBookings.length>3000||
   !ledger||!Array.isArray(ledger.rows)||ledger.rows.length>200||
   ledger.rows.some(row=>row?.business_id!==businessId||
     (appId&&row?.mini_app_id!==appId)||
     !UUID.test(row?.request_id||"")||
     !["confirmed","cancelled"].includes(row?.state)))
  return {ok:false,reason:"The authenticated business booking ledger is unavailable or mismatched."};
 const server=new Map();
 let invalid=0;
 for(const row of ledger.rows){
   const date=String(row.calendar_date||"").slice(0,10);
   const time=String(row.calendar_time||"").slice(0,5);
   if(server.has(row.request_id)||!/^\d{4}-\d{2}-\d{2}$/.test(date)||
      !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)||
      typeof row.customer_record_id!=="string"||
      row.customer_record_id.length>160){invalid++;continue;}
   server.set(row.request_id,{...row,date,time});
 }
 // Invalid or duplicate DB results must never get silently converted into
 // customer-visible confirmed work. Continue local-only, flag for review.
 if(invalid)return {ok:false,reason:"Business App booking records need an owner review."};
 const prior=new Map(localBookings.filter(x=>UUID.test(x?.sourceMiniAppRequestId||""))
   .map(x=>[x.sourceMiniAppRequestId,x]));
 const localOnly=localBookings.filter(x=>!UUID.test(x?.sourceMiniAppRequestId||"")||
   !server.has(x.sourceMiniAppRequestId));
 const output=[...localOnly];
 let cancelled=0,reconciled=0,serverOnly=0,disagreements=0;
 for(const [requestId,row] of server){
   const device=prior.get(requestId);
   if(row.state==="cancelled"){cancelled++;continue;}
   const mismatch=!!device&&
     (device.date!==row.date||device.time!==row.time);
   if(mismatch)disagreements++;
   if(device)reconciled++;else serverOnly++;
   output.push({
     customerId:row.customer_record_id,
     customerName:device?.customerName||"BUSY customer",
     service:device?.service||"Business App booking",
     date:row.date,time:row.time,
     value:device?.value||0,
     durationHours:device?.durationHours||2,
     sourceMiniAppRequestId:requestId,
     serverWorkLedgerId:row.id,
     evidence:"durable_busy_work_ledger_not_external_calendar",
     hasLocalSnapshot:!!device
   });
 }
 output.sort((a,b)=>String(a.date).localeCompare(String(b.date))||
   String(a.time).localeCompare(String(b.time)));
 return {ok:true,bookings:output,
   counts:{serverConfirmed:reconciled+serverOnly,serverOnly,
     matchedDevice:reconciled,cancelled,disagreements,
     localOnly:localOnly.length},
   source:"authenticated_business_owner_status",
   resultCapped:ledger.truncated===true,
   needsOwnerReview:disagreements>0||ledger.truncated===true,
   providerDeliveryIndependentlyVerified:false,
   remoteCalendarSyncVerified:false,
   noDataWritten:true,noCrossBusinessLearning:true};
}
export {reconcileWorkBookingLedger};

// Original request-to-loaded-Work navigation only. Never creates or restores a record.
export async function continueLinkedWorkBooking({requestId,getCurrent,read,transition,open,notice}){
 const start=getCurrent(),{scope,source,appId}=start||{};
 const id=source?.link?.customer_record_id,action=source?.replyActions?.[id];
 const candidates=[...(source?.customers||[]),...(source?.lastSimulatedRecipients||[])].filter(row=>row?.id===id),customer=candidates[0];
 const stamp=JSON.stringify([customer,action,source?.link]),revision=source?.revision;
 const current=()=>{const now=getCurrent();return now?.scope===scope&&now.actor===start.actor&&now.businessId===start.businessId&&now.role==='owner'&&now.view===start.view&&now.appId===appId&&now.source?.revision===revision&&now.source.replyActions?.[id]===action&&JSON.stringify([customer,action,now.source.link])===stamp&&[...(now.source.customers||[]),...(now.source.lastSimulatedRecipients||[])].includes(customer)&&[...(now.source.customers||[]),...(now.source.lastSimulatedRecipients||[])].filter(row=>row?.id===id).every(row=>row===customer);};
 if(!UUID.test(requestId||'')||!scope||!start.actor||start.role!=='owner'||!Number.isSafeInteger(revision)||revision<1||source?.link?.action_record_id!==`miniapp-booking-${requestId}`||!customer||candidates.some(row=>row!==customer)||action?.type!=='booking'||action.details?.sourceMiniAppRequestId!==requestId||source.link?.request_id!==requestId||source.link?.business_id!==start.businessId||[customer.businessId,customer.business_id].some(b=>b&&b!==start.businessId)||!current()){notice?.('The current linked customer and booking are unavailable. Open this business’s supported recovery; no record was restored.');return false;}
 const inspect=async()=>{
  const result=inspectBookingAssociationV3233({businessId:start.businessId,requestId,customerId:id,actionId:`miniapp-booking-${requestId}`,response:await read(requestId,current)});
  if(!current()||!result.ok||result.appId!==appId)throw Error('The booking association changed or could not be verified. Keep your work and inspect the current request.');
  return result;
 };
 try{const observed=await inspect(),fresh=await inspect();
  if(JSON.stringify(fresh)!==JSON.stringify(observed)){notice?.('The booking changed during review. Your work is kept; open the current request again.');return false;}
  let used=false;
  // Original navigation approvals are synchronous. Do not discard before an awaited read.
  return transition(()=>{if(used||!current())return false;used=true;return open(id)!==false;},{isCurrent:()=>!used&&current()});
 }catch(error){if(current())notice?.(error.message);return false;}
}
