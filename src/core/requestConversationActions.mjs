import {inspectBookingAssociationV3233} from './bookingCancelReadbackV3233.mjs';
const UUID=/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
// Existing conversation endpoints mark unread state; they are not pure reads.
// This adapter scopes results and paging without duplicating conversations.
function createRequestConversationActions(getContext){
 let latest=null,accountInspection=null;
 return {inspectMiniAppAccountBooking:async(requestId,{isCurrent=()=>true,navigate=false}={})=>{
  const c=getContext(),source=c.detail,req=source?.request;
  if(!c.accountRecoveryEnabled){c.setMiniAppsError('Secure account booking inspection is prepared but not enabled. Your current work is kept.');return false;}
  if(c.memberRole!=='owner'||c.role!=='business'||!c.ownerScope?.userId||req?.id!==requestId||req.business_id!==c.businessId||req.request_type!=='booking_request'||!UUID.test(requestId||'')||!isCurrent())return false;
  const token={};accountInspection=token;
  const current=()=>{const n=getContext();return accountInspection===token&&isCurrent()&&n.screen===c.screen&&n.ownerScope===c.ownerScope&&n.workspaceScope===c.workspaceScope&&n.businessId===c.businessId&&n.memberRole==='owner'&&n.role==='business'&&n.detail===source;};
  try{
   const raw=await c.request('owner_booking_revision',{requestId,includeAssociation:true});if(!current())return false;
   const customerId=raw?.revision?.association?.customerId;
   if(typeof customerId!=='string'||!(/^[A-Za-z0-9][A-Za-z0-9:_-]{0,159}$/).test(customerId))throw Error('Unsupported booking association.');
   const observed=inspectBookingAssociationV3233({businessId:c.businessId,requestId,customerId,actionId:`miniapp-booking-${requestId}`,response:raw});
   if(!observed.ok||observed.appId!==req.mini_app_id||!observed.association.diary)throw Error('A supported durable Work booking could not be verified. No customer was restored.');
   const result=await c.accountReader({observed,isCurrent:current});if(!current())return false;
   if(!result?.ok)throw Error(result?.reason||'Current account records could not be verified.');
   if(navigate==='diary'){
    if(!result.review.matchesLedger)throw Error('Account and diary records differ. Review them before continuing.');
    return c.requestTransition(()=>{if(!current())return false;accountInspection=null;c.setCalendarDate(result.review.ledger.date);c.go('workCalendar');return true;},{isCurrent:current});
   }
   c.setSelectedMiniAppRequestDetail({...source,accountBookingReview:result.review});return true;
  }catch(error){if(current())c.setMiniAppsError(error?.message||'Account inspection failed. Current work was kept.');return false;}
 },loadMiniAppRequestDetail:async(requestId,role,{before='',append=false,navigate=true}={})=>{
  const c=getContext(),owner=role==='business',source=c.detail;
  if(!UUID.test(requestId)||!['business','customer'].includes(role)||!c.ownerScope?.userId||owner&&!c.businessId)return false;
  if(append&&(!before||source?.request?.id!==requestId||c.role!==role||source.nextBefore!==before||latest?.append))return false;
  const ticket={ownerScope:c.ownerScope,workspaceScope:c.workspaceScope,businessId:c.businessId,append};latest=ticket;
  const current=()=>latest===ticket&&getContext().ownerScope===ticket.ownerScope&&getContext().workspaceScope===ticket.workspaceScope&&
   (!owner||getContext().businessId===ticket.businessId)&&(!append||getContext().detail===source&&getContext().role===role);
  if(navigate&&!append)c.setOwnerFollowupReview(null);c.setMiniAppRequestHistoryLoading(true);c.setMiniAppsError('');
  try{
   const data=await c.request(owner?'owner_request_detail':'customer_request_detail',{requestId,before,limit:30},{includeBusiness:owner,isCurrent:current});
   if(!current())return false;const detail=data?.detail;
   if(detail?.request?.id!==requestId||!UUID.test(detail.request.mini_app_id)||
    (owner?detail.request.business_id!==c.businessId:detail.request.consumer_user_id!==c.ownerScope.userId)||
    detail.app&&detail.app.id!==detail.request.mini_app_id||
    !Array.isArray(detail.messages)||detail.messages.length>50||detail.messages.some(m=>!UUID.test(m?.id)||m.request_id!==requestId)||
    !Array.isArray(detail.events)||detail.events.length>100)throw Error('The conversation response did not match the selected request and account.');
   const merged=append?{...source,messages:[...(source.messages||[]),...detail.messages.filter(m=>!(source.messages||[]).some(old=>old.id===m.id))],
    events:[...(source.events||[]),...detail.events.filter(e=>!(source.events||[]).some(old=>old.id===e.id))],nextBefore:detail.nextBefore}:detail;
   // No awaits between validation and applying this exact scoped result.
   if(owner&&data.status)c.applyMiniAppsStatus(data);
   c.setSelectedMiniAppRequestRole(role);c.setSelectedMiniAppRequestDetail(merged);
   if(navigate){c.setTab('Home');c.go('miniAppRequestDetail');}
   if(!owner)void Promise.resolve(c.loadMyBusyApps?.({quiet:true})).catch(()=>{});
   return true;
  }catch(error){if(current())c.setMiniAppsError(error?.message||'BUSY could not load that request conversation.');return false;}
  finally{if(latest===ticket){c.setMiniAppRequestHistoryLoading(false);latest=null;}}
 }};
}
export {createRequestConversationActions};
