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
