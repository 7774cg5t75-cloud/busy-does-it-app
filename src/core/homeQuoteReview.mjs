// A candidate in the original Home ranking, not another task or quote store.
export function homeQuoteReview(s,getCurrent){
 const scope=s.ownerWorkspaceScope,owner=s.ownerSession?.userId,businessId=s.cloudWorkspace?.businessId;
 const customer=s.customers?.find(row=>row.id===s.selectedReplyActionId),action=customer?s.replyActions?.[customer.id]:null;
 const wording=s.quoteFollowUpDraft,epoch=s.getQuoteFollowUpTypingEpoch?.();
 if(s.quoteFollowUpSourceCurrent===false||!scope||!owner||!businessId||!['owner','admin'].includes(s.cloudWorkspace?.role)||typeof wording!=='string'||!wording.trim()||epoch===undefined||!customer||action?.type!=='quote'||action.details?.quoteStatus!=='Sent'||action.details.followUpSentAt||[customer.businessId,customer.business_id].some(id=>id&&id!==businessId))return null;
 return {id:'private-quote-review-'+customer.id,score:56,eyebrow:'Work & Customers',title:'Continue your private quote follow-up',body:'Your current follow-up wording for '+customer.name+' is available in this workspace. Review it before any separate action; no customer message has been sent by this suggestion.',why:'This comes from your actual unfinished wording and an existing saved quote.',evidence:[['Source','Existing customer and saved quote'],['Status','Private wording; no send performed']],actionLabel:'Continue private follow-up',canIgnore:false,tone:'blue',onAction:()=>{
  const now=getCurrent();
  if(now.quoteFollowUpSourceCurrent===false||now.ownerWorkspaceScope!==scope||now.ownerSession?.userId!==owner||now.cloudWorkspace?.businessId!==businessId||!['owner','admin'].includes(now.cloudWorkspace?.role)||!now.customers?.includes(customer)||now.replyActions?.[customer.id]!==action||now.selectedReplyActionId!==customer.id||now.quoteFollowUpDraft!==wording||now.getQuoteFollowUpTypingEpoch?.()!==epoch||action.details.followUpSentAt)return false;
  now.go('quoteFollowUp');return true;
 }};
}

// Only the owner's currently selected original prepared record; never guess a customer.
export function homePreparedQuoteReview(s,getCurrent){
 const scope=s.ownerWorkspaceScope,owner=s.ownerSession?.userId,businessId=s.cloudWorkspace?.businessId;
 const {customer,action}=preparedQuoteTarget(s)||{};
 if(!customer||typeof s.openSavedReplyAction!=='function')return null;
 const stamp=JSON.stringify([customer.id,customer.name,customer.service,customer.businessId,customer.business_id,action]),revision=s.cloudRevision;
 return {id:'prepared-quote-review-'+customer.id,score:56,eyebrow:'Work & Customers',title:'Continue your prepared quote',body:'Review the recorded quote for '+customer.name+'. This workspace record is not proof of account saving or customer delivery.',why:'This is your currently selected prepared quote, not a new quote or a sent message.',evidence:[['Source','Selected customer and original quote record'],['Status','Recorded as prepared; delivery not verified']],actionLabel:'Review prepared quote',canIgnore:false,tone:'blue',onAction:()=>{
  const now=getCurrent();
  if(now.ownerWorkspaceScope!==scope||now.ownerSession?.userId!==owner||now.cloudWorkspace?.businessId!==businessId||!['owner','admin'].includes(now.cloudWorkspace?.role)||now.cloudRevision!==revision||now.selectedReplyActionId!==customer.id||!now.customers?.includes(customer)||now.replyActions?.[customer.id]!==action||JSON.stringify([customer.id,customer.name,customer.service,customer.businessId,customer.business_id,action])!==stamp)return false;
  return now.openSavedReplyAction(customer.id);
 }};
}

// Reuse current original records for Home/Talk navigation; not a customer matcher or store.
export function preparedQuoteTarget(s,exactName=''){
 const owner=s.ownerSession?.userId,business=s.cloudWorkspace?.businessId;
 if(!s.ownerWorkspaceScope||!owner||!business||!['owner','admin'].includes(s.cloudWorkspace?.role))return null;
 const key=value=>String(value||'').trim().replace(/\s+/g,' ').toLowerCase();
 const matches=(s.customers||[]).filter(customer=>exactName?key(customer.name)===key(exactName):customer.id===s.selectedReplyActionId);
 if(matches.length!==1)return null;
 const customer=matches[0],action=s.replyActions?.[customer.id];
 if([customer.businessId,customer.business_id].some(id=>id&&id!==business)||action?.type!=='quote'||action.details?.quoteStatus!=='Prepared'||!String(action.details?.message||'').trim())return null;
 return {customer,action};
}
