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
 return homeRecordedQuoteReview(s,getCurrent,false);
}
export function homeFollowUpQuoteReview(s,getCurrent){
 return homeRecordedQuoteReview(s,getCurrent,true);
}
function homeRecordedQuoteReview(s,getCurrent,followUp){
 const scope=s.ownerWorkspaceScope,owner=s.ownerSession?.userId,businessId=s.cloudWorkspace?.businessId;
 const {customer,action}=(followUp?followUpQuoteTarget(s):preparedQuoteTarget(s))||{};
 if(!customer||typeof s.openSavedReplyAction!=='function')return null;
 const stamp=JSON.stringify([customer.id,customer.name,customer.service,customer.businessId,customer.business_id,action]),revision=s.cloudRevision;
 return {id:(followUp?'recorded-quote-followup-':'prepared-quote-review-')+customer.id,score:56,eyebrow:'Work & Customers',title:followUp?'Review your recorded quote':'Continue your prepared quote',body:'Review the recorded quote for '+customer.name+'. This workspace record is not proof of account saving or customer delivery.',why:followUp?'This is your selected quote recorded as sent. Review its facts before choosing a private follow-up; no reply or urgency is inferred.':'This is your currently selected prepared quote, not a new quote or a sent message.',evidence:[['Source','Selected customer and original quote record'],['Status',followUp?'Recorded as sent; delivery not verified':'Recorded as prepared; delivery not verified']],actionLabel:followUp?'Review before following up':'Review prepared quote',canIgnore:false,tone:'blue',onAction:()=>{
  const now=getCurrent();
  if(now.ownerWorkspaceScope!==scope||now.ownerSession?.userId!==owner||now.cloudWorkspace?.businessId!==businessId||!['owner','admin'].includes(now.cloudWorkspace?.role)||now.cloudRevision!==revision||now.selectedReplyActionId!==customer.id||!now.customers?.includes(customer)||now.replyActions?.[customer.id]!==action||JSON.stringify([customer.id,customer.name,customer.service,customer.businessId,customer.business_id,action])!==stamp)return false;
  return now.openSavedReplyAction(customer.id);
 }};
}

// Reuse current original records for Home/Talk navigation; not a customer matcher or store.
export function preparedQuoteTarget(s,exactName=''){
 return quoteReviewTarget(s,exactName,'Prepared');
}

// Recorded Sent is review context, never proof of customer delivery.
export function followUpQuoteTarget(s,exactName=''){
 return quoteReviewTarget(s,exactName,'Sent');
}

function quoteReviewTarget(s,exactName,status){
 if(!quoteReviewAuthority(s))return null;
 const key=value=>String(value||'').trim().replace(/\s+/g,' ').toLowerCase();
 const matches=(s.customers||[]).filter(customer=>exactName?key(customer.name)===key(exactName):customer.id===s.selectedReplyActionId);
 if(matches.length!==1)return null;
 return quoteReviewRecord(s,matches[0],status);
}
function quoteReviewAuthority(s){return !!s.ownerWorkspaceScope&&!!s.ownerSession?.userId&&!!s.cloudWorkspace?.businessId&&['owner','admin'].includes(s.cloudWorkspace?.role);}
function quoteReviewRecord(s,customer,status){
 const business=s.cloudWorkspace.businessId,action=s.replyActions?.[customer.id];
 if([customer.businessId,customer.business_id].some(id=>id&&id!==business)||action?.type!=='quote'||action.details?.quoteStatus!==status||(status==='Sent'&&action.details?.followUpSentAt)||!String(action.details?.message||'').trim())return null;
 return {customer,action};
}

// Enumerate original eligible records by customer ID; duplicate names never select a record.
export function followUpQuoteChoices(s){
 if(!quoteReviewAuthority(s))return [];
 const rows=s.customers||[],counts=new Map();
 for(const customer of rows)counts.set(customer.id,(counts.get(customer.id)||0)+1);
 return rows.flatMap(customer=>{
  const target=counts.get(customer.id)===1?quoteReviewRecord(s,customer,'Sent'):null;
  return target?[target]:[];
 });
}

export function homeQuoteSelectionReview(s,getCurrent){
 const entries=followUpQuoteChoices(s);if(!entries.length)return null;
 const scope=s.ownerWorkspaceScope,owner=s.ownerSession.userId,business=s.cloudWorkspace.businessId,revision=s.cloudRevision;
 const stamp=JSON.stringify(entries);
 return {id:'recorded-quote-selection',score:54,eyebrow:'Work & Customers',title:'Choose a recorded quote to review',body:entries.length+' recorded quote'+(entries.length===1?' is':'s are')+' available for private review. Choose the correct customer before preparing a follow-up; delivery and urgency are not inferred.',why:'This comes from existing eligible quote records, not a reminder or a customer reply.',evidence:[['Source','Existing customer and quote records'],['Status','Recorded status; delivery not verified']],actionLabel:'Choose a quote',canIgnore:false,tone:'blue',onAction:()=>{
  const now=getCurrent();
  if(now.ownerWorkspaceScope!==scope||now.ownerSession?.userId!==owner||now.cloudWorkspace?.businessId!==business||!['owner','admin'].includes(now.cloudWorkspace?.role)||now.cloudRevision!==revision||now.customers!==s.customers||now.replyActions!==s.replyActions||JSON.stringify(followUpQuoteChoices(now))!==stamp)return false;
  return now.go('workHub')!==false;
 }};
}
