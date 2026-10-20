// A candidate in the original Home ranking, not another task or quote store.
export function homeQuoteReview(s,getCurrent){
 const scope=s.ownerWorkspaceScope,owner=s.ownerSession?.userId,businessId=s.cloudWorkspace?.businessId;
 const customer=s.customers?.find(row=>row.id===s.selectedReplyActionId),action=customer?s.replyActions?.[customer.id]:null;
 const wording=s.quoteFollowUpDraft,epoch=s.getQuoteFollowUpTypingEpoch?.();
 if(s.quoteFollowUpSourceCurrent===false||!scope||!owner||!businessId||!['owner','admin'].includes(s.cloudWorkspace?.role)||typeof wording!=='string'||!wording.trim()||epoch===undefined||!customer||action?.type!=='quote'||action.details?.quoteStatus!=='Sent'||action.done||action.details.followUpSentAt||[customer.businessId,customer.business_id].some(id=>id&&id!==businessId))return null;
 return {id:'private-quote-review-'+customer.id,score:56,eyebrow:'Work & Customers',title:'Continue your private quote follow-up',body:'Your current follow-up wording for '+customer.name+' is available in this workspace. Review it before any separate action; no customer message has been sent by this suggestion.',why:'This comes from your actual unfinished wording and an existing saved quote.',evidence:[['Source','Existing customer and saved quote'],['Status','Private wording; no send performed']],actionLabel:'Continue private follow-up',canIgnore:false,tone:'blue',onAction:()=>{
  const now=getCurrent();
  if(now.quoteFollowUpSourceCurrent===false||now.ownerWorkspaceScope!==scope||now.ownerSession?.userId!==owner||now.cloudWorkspace?.businessId!==businessId||!['owner','admin'].includes(now.cloudWorkspace?.role)||!now.customers?.includes(customer)||now.replyActions?.[customer.id]!==action||now.selectedReplyActionId!==customer.id||now.quoteFollowUpDraft!==wording||now.getQuoteFollowUpTypingEpoch?.()!==epoch||action.done||action.details.followUpSentAt)return false;
  now.go('quoteFollowUp');return true;
 }};
}

// Only the owner's currently selected original prepared record; never guess a customer.
export function homePreparedQuoteReview(s,getCurrent){
 const scope=s.ownerWorkspaceScope,owner=s.ownerSession?.userId,businessId=s.cloudWorkspace?.businessId;
 const customer=s.customers?.find(row=>row.id===s.selectedReplyActionId),action=customer?s.replyActions?.[customer.id]:null;
 if(!scope||!owner||!businessId||!['owner','admin'].includes(s.cloudWorkspace?.role)||!customer||action?.type!=='quote'||action.done||action.details?.quoteStatus!=='Prepared'||!String(action.details?.message||'').trim()||[customer.businessId,customer.business_id].some(id=>id&&id!==businessId)||typeof s.openSavedReplyAction!=='function')return null;
 const stamp=JSON.stringify([customer.id,customer.name,customer.service,customer.businessId,customer.business_id,action]),revision=s.cloudRevision;
 return {id:'prepared-quote-review-'+customer.id,score:56,eyebrow:'Work & Customers',title:'Continue your prepared quote',body:'Review the recorded quote for '+customer.name+'. This workspace record is not proof of account saving or customer delivery.',why:'This is your currently selected prepared quote, not a new quote or a sent message.',evidence:[['Source','Selected customer and original quote record'],['Status','Recorded as prepared; delivery not verified']],actionLabel:'Review prepared quote',canIgnore:false,tone:'blue',onAction:()=>{
  const now=getCurrent();
  if(now.ownerWorkspaceScope!==scope||now.ownerSession?.userId!==owner||now.cloudWorkspace?.businessId!==businessId||!['owner','admin'].includes(now.cloudWorkspace?.role)||now.cloudRevision!==revision||now.selectedReplyActionId!==customer.id||!now.customers?.includes(customer)||now.replyActions?.[customer.id]!==action||JSON.stringify([customer.id,customer.name,customer.service,customer.businessId,customer.business_id,action])!==stamp)return false;
  return now.openSavedReplyAction(customer.id);
 }};
}
