import React from 'react';
import {Text} from 'react-native';
import {Card,Button} from './ui';
import {styles} from '../theme/styles';
import {followUpQuoteChoices} from '../core/homeQuoteReview.mjs';

// Original Work record selection only; no follow-up creation, persistence or send.
export function QuoteFollowUpChoices({s}){
 const live=React.useRef(s);live.current=s;
 const [limit,setLimit]=React.useState(6);
 const owner=s.ownerSession?.userId,business=s.cloudWorkspace?.businessId,scope=s.ownerWorkspaceScope;
 if(!owner||!business||!scope||!['owner','admin'].includes(s.cloudWorkspace?.role))return null;
 const entries=followUpQuoteChoices(s),revision=s.cloudRevision,selected=s.selectedReplyActionId;
 return <Card eyebrow="Private quote review" title="Choose a quote to review"
  body={entries.length?'Review the recorded quote and original enquiry before preparing a private follow-up. Recorded Sent status is not proof of customer delivery.':'No recorded Sent quote is available for private follow-up. Prepared quotes and customer enquiries remain available in Work.'} tone="blue">
  {entries.slice(0,limit).map(({customer,action})=>{
   const stamp=JSON.stringify([customer,action]);
   return <React.Fragment key={customer.id}>
    <Text style={styles.cardBody}>{customer.name+(customer.service?' · '+customer.service:'')+' · Recorded as sent'+(action.details?.enquiryReference?' · Saved enquiry reference to review':'')}</Text>
    <Button label={'Review quote for '+customer.name} onPress={()=>{
     const now=live.current;
     if(now.ownerWorkspaceScope!==scope||now.ownerSession?.userId!==owner||now.cloudWorkspace?.businessId!==business||now.cloudRevision!==revision||now.selectedReplyActionId!==selected||!['owner','admin'].includes(now.cloudWorkspace?.role)||!followUpQuoteChoices(now).some(row=>row.customer===customer&&row.action===action)||JSON.stringify([customer,action])!==stamp)return false;
     return now.openSavedReplyAction(customer.id);
    }}/>
   </React.Fragment>;
  })}
  {entries.length>limit?<Button label="Show more recorded quotes" onPress={()=>setLimit(value=>value+6)}/>:null}
 </Card>;
}
