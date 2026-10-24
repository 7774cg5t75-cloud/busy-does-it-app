import React from 'react';import {Card,Button} from './ui';
// Read the original quote beside private follow-up wording, without copying or sending it.
export function QuoteFollowUpRecordReview({s}){
 const live=React.useRef(s);live.current=s;
 const customer=s.selectedReplyCustomer,action=customer?s.replyActions?.[customer.id]:null;
 if(!customer||action?.type!=='quote')return null;
 const scope=s.ownerWorkspaceScope,owner=s.ownerSession?.userId,business=s.cloudWorkspace?.businessId,revision=s.cloudRevision,epoch=s.getQuoteFollowUpTypingEpoch?.(),stamp=JSON.stringify([customer,action]);
 const canOpen=!!scope&&!!owner&&!!business&&['owner','admin'].includes(s.cloudWorkspace?.role)&&![customer.businessId,customer.business_id].some(id=>id&&id!==business)&&s.quoteFollowUpSourceCurrent!==false;
 return <Card eyebrow="Original quote record" title="Review the quote wording"
  body={action.details?.message||'No quote wording is retained in this record. Check the customer and original enquiry before preparing a follow-up.'}
  footer={'Recorded status: '+(action.details?.quoteStatus||'Not recorded')+'. This does not establish delivery, customer agreement, availability or payment.'}>
  {canOpen&&s.openSavedReplyAction?<Button label="Review original quote" onPress={()=>{
   const now=live.current;
   if(now.ownerWorkspaceScope!==scope||now.ownerSession?.userId!==owner||now.cloudWorkspace?.businessId!==business||!['owner','admin'].includes(now.cloudWorkspace?.role)||now.cloudRevision!==revision||now.quoteFollowUpSourceCurrent===false||now.selectedReplyCustomer!==customer||now.replyActions?.[customer.id]!==action||JSON.stringify([customer,action])!==stamp||now.getQuoteFollowUpTypingEpoch?.()!==epoch)return false;
   return now.openSavedReplyAction(customer.id);
  }}/>:null}
 </Card>;
}
