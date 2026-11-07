import React from 'react';import {Button} from './ui';import {inspectPrivateEnquiryReply} from '../core/privateEnquiryReply.mjs';
export function SavedEnquiryReplyButton({s,customer,label}){
 const live=React.useRef(s);live.current=s;
 const scope=s.ownerWorkspaceScope,owner=s.ownerSession?.userId,business=s.cloudWorkspace?.businessId,revision=s.cloudRevision,record=customer?.privateEnquiryReply,stamp=JSON.stringify(record);
 if(!scope||!['owner','admin'].includes(s.cloudWorkspace?.role)||!s.enquiryReplyActions?.reviewSaved||!inspectPrivateEnquiryReply({ownerId:owner,businessId:business,customer,inboxItems:s.inboxItems,revision}))return null;
 return <Button label={label||"Review saved private reply"} onPress={()=>{const now=live.current;if(now.ownerWorkspaceScope!==scope||now.ownerSession?.userId!==owner||now.cloudWorkspace?.businessId!==business||now.cloudRevision!==revision||!['owner','admin'].includes(now.cloudWorkspace?.role)||!now.customers?.includes(customer)||customer.privateEnquiryReply!==record||JSON.stringify(record)!==stamp)return false;return now.enquiryReplyActions.reviewSaved(customer.id);}}/>;
}
