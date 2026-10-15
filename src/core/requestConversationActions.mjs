const UUID=/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
// Existing conversation endpoints mark unread state; they are not pure reads.
// This adapter scopes results and paging without duplicating conversations.
function createRequestConversationActions(getContext){
 let latest=null;
 return {loadMiniAppRequestDetail:async(requestId,role,{before='',append=false,navigate=true}={})=>{
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
