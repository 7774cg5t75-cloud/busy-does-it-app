// One candidate in the original Home ranking, never a task store or urgency signal.
export function homeEnquiryReview(s,getCurrent){
 const scope=s.ownerWorkspaceScope,owner=s.ownerSession?.userId,business=s.cloudWorkspace?.businessId;
 const item=s.inboxItems?.find(row=>row.id===s.selectedInboxItemId&&row.status==='Pending');
 if(!scope||!owner||!business||!['owner','admin'].includes(s.cloudWorkspace?.role)||!item||typeof s.resumeCurrentEnquiry!=='function')return null;
 const stamp=JSON.stringify(item),revision=s.cloudRevision;
 return {id:'continue-enquiry-'+item.id,score:110,eyebrow:'Work & Customers',title:'Continue your enquiry review',body:'Return to the enquiry you selected. Your current review fields stay in place; the enquiry is not yet filed.',why:'This is an actual selected Pending Inbox item, not a notification or invented task.',evidence:[['Source','Selected Inbox enquiry'],['Status','Review not filed']],actionLabel:'Continue enquiry review',canIgnore:false,tone:'blue',onAction:()=>{
  const now=getCurrent();
  if(now.ownerWorkspaceScope!==scope||now.ownerSession?.userId!==owner||now.cloudWorkspace?.businessId!==business||!['owner','admin'].includes(now.cloudWorkspace?.role)||now.cloudRevision!==revision||now.selectedInboxItemId!==item.id||!now.inboxItems?.includes(item)||JSON.stringify(item)!==stamp)return false;
  return now.resumeCurrentEnquiry();
 }};
}

// Original in-memory reply continuation, not a new task or save record.
export function homeEnquiryReplyReview(s,getCurrent){
 const draft=s.enquiryReplyActions?.continuation,scope=s.ownerWorkspaceScope,owner=s.ownerSession?.userId,business=s.cloudWorkspace?.businessId;
 if(!draft||!scope||!owner||!business||!['owner','admin'].includes(s.cloudWorkspace?.role))return null;
 const stamp=JSON.stringify(draft),revision=s.cloudRevision;
 return {id:'private-enquiry-reply-'+draft.customer.id,score:58,eyebrow:'Work & Customers',title:'Continue your private enquiry reply',body:'Your unfinished reply for '+draft.customer.name+' is held in this workspace. Review the exact enquiry before any separate action; saving and delivery are not confirmed.',why:'This comes from actual current private wording and its filed enquiry, not a generated task or reminder.',evidence:[['Source','Current private reply and exact filed enquiry'],['Status','Workspace wording; not sent or confirmed saved']],actionLabel:'Continue private enquiry reply',canIgnore:false,tone:'blue',onAction:()=>{
  const now=getCurrent(),current=now.enquiryReplyActions?.continuation;
  if(now.ownerWorkspaceScope!==scope||now.ownerSession?.userId!==owner||now.cloudWorkspace?.businessId!==business||now.cloudRevision!==revision||!['owner','admin'].includes(now.cloudWorkspace?.role)||!current||JSON.stringify(current)!==stamp)return false;
  return now.enquiryReplyActions.resume().opened===true;
 }};
}
