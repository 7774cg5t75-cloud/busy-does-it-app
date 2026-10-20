// A candidate in the original Home ranking, not another task or quote store.
export function homeQuoteReview(s,getCurrent){
 const scope=s.ownerWorkspaceScope,owner=s.ownerSession?.userId,businessId=s.cloudWorkspace?.businessId;
 const customer=s.customers?.find(row=>row.id===s.selectedReplyActionId),action=customer?s.replyActions?.[customer.id]:null;
 const wording=s.quoteFollowUpDraft,epoch=s.getQuoteFollowUpTypingEpoch?.();
 if(!scope||!owner||!businessId||!['owner','admin'].includes(s.cloudWorkspace?.role)||typeof wording!=='string'||!wording.trim()||epoch===undefined||!customer||action?.type!=='quote'||action.details?.quoteStatus!=='Sent'||action.done||action.details.followUpSentAt||[customer.businessId,customer.business_id].some(id=>id&&id!==businessId))return null;
 return {id:'private-quote-review-'+customer.id,score:56,eyebrow:'Work & Customers',title:'Continue your private quote follow-up',body:'Your current follow-up wording for '+customer.name+' is available in this workspace. Review it before any separate action; no customer message has been sent by this suggestion.',why:'This comes from your actual unfinished wording and an existing saved quote.',evidence:[['Source','Existing customer and saved quote'],['Status','Private wording; no send performed']],actionLabel:'Continue private follow-up',canIgnore:false,tone:'blue',onAction:()=>{
  const now=getCurrent();
  if(now.ownerWorkspaceScope!==scope||now.ownerSession?.userId!==owner||now.cloudWorkspace?.businessId!==businessId||!['owner','admin'].includes(now.cloudWorkspace?.role)||!now.customers?.includes(customer)||now.replyActions?.[customer.id]!==action||now.selectedReplyActionId!==customer.id||now.quoteFollowUpDraft!==wording||now.getQuoteFollowUpTypingEpoch?.()!==epoch||action.done||action.details.followUpSentAt)return false;
  now.go('quoteFollowUp');return true;
 }};
}
