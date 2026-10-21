import React from 'react';
import {Text} from 'react-native';
import {Button} from './ui';
import {styles} from '../theme/styles';
// Deliberate owner navigation from an existing filing receipt, never inbound-content authority.
export function InboxCustomerContinuation({s,item}){
 const live=React.useRef(s);live.current=s;
 const scope=s.ownerWorkspaceScope,customer=s.customers?.find(row=>row.id===item.filedCustomerId),action=customer?s.replyActions?.[customer.id]:null;
 if(item.status!=='Filed'||!scope||!customer||!['owner','admin'].includes(s.cloudWorkspace?.role)||[customer.businessId,customer.business_id].some(id=>id&&id!==s.cloudWorkspace?.businessId))return null;
 const epoch=s.getQuoteFollowUpTypingEpoch?.(),stamp=JSON.stringify([item,customer,action]),revision=s.cloudRevision;
 const current=()=>{
  const now=live.current;
  return now.ownerWorkspaceScope===scope&&now.ownerSession?.userId===s.ownerSession?.userId&&now.cloudWorkspace?.businessId===s.cloudWorkspace?.businessId&&now.cloudRevision===revision&&JSON.stringify([item,customer,action])===stamp&&['owner','admin'].includes(now.cloudWorkspace?.role)&&now.inboxItems?.includes(item)&&item.status==='Filed'&&now.customers?.includes(customer)&&customer.id===item.filedCustomerId&&now.replyActions?.[customer.id]===action&&now.getQuoteFollowUpTypingEpoch?.()===epoch;
 };
 const prepare=()=>{
  if(!current()||action?.type!=='quote'||action.details?.quoteStatus!=='Sent')return false;
  return live.current.prepareQuoteFollowUp(customer.id,item.id);
 };
 return <><Text style={styles.cardBody}>This item was filed into an existing customer record. Further work stays private until you approve a supported action.</Text>
  {action?.type==='quote'&&action.details?.quoteStatus==='Prepared'?<Button label="Continue this private quote" onPress={()=>current()?live.current.openSavedReplyAction(customer.id,item.id):false}/>:null}
  {s.enquiryReplyActions?<Button label="Prepare a private enquiry reply" onPress={()=>current()?live.current.enquiryReplyActions.prepare(customer.id,item.id):false}/>:null}
  <Button label="Open this customer" onPress={()=>current()?live.current.openCustomer(customer.id,item.id):false}/>
  {action?.type==='quote'&&action.details?.quoteStatus==='Sent'?<Button label="Prepare a private quote follow-up" onPress={prepare}/>:null}
 </>;
}
