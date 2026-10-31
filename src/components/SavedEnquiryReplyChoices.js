import React from 'react';import {Card} from './ui';import {SavedEnquiryReplyButton} from './SavedEnquiryReplyButton';import {inspectPrivateEnquiryReply} from '../core/privateEnquiryReply.mjs';
export function SavedEnquiryReplyChoices({s}){
 const ownerId=s.ownerSession?.userId,businessId=s.cloudWorkspace?.businessId;
 if(!ownerId||!businessId||!['owner','admin'].includes(s.cloudWorkspace?.role))return null;
 const entries=(s.customers||[]).filter(customer=>inspectPrivateEnquiryReply({ownerId,businessId,customer,inboxItems:s.inboxItems,revision:s.cloudRevision}));
 if(!entries.length)return null;
 return <Card title="Your saved private replies" body="Choose the customer whose saved reply you want to review. These are private drafts, not sent messages. Each customer currently has one saved reply.">
  {entries.map(customer=><SavedEnquiryReplyButton key={customer.id} s={s} customer={customer} label={'Review reply for '+customer.name+(customer.service?' · '+customer.service:'')}/>)}
 </Card>;
}
