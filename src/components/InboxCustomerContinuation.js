import React from 'react';
import {Text,Alert} from 'react-native';
import {Button} from './ui';
import {styles} from '../theme/styles';
// Deliberate owner navigation from an existing filing receipt, never inbound-content authority.
export function InboxCustomerContinuation({s,item}){
 const live=React.useRef(s);live.current=s;
 const scope=s.ownerWorkspaceScope,customer=s.customers?.find(row=>row.id===item.filedCustomerId),action=customer?s.replyActions?.[customer.id]:null;
 if(item.status!=='Filed'||!scope||!customer||!['owner','admin'].includes(s.cloudWorkspace?.role)||[customer.businessId,customer.business_id].some(id=>id&&id!==s.cloudWorkspace?.businessId))return null;
 const epoch=s.getQuoteFollowUpTypingEpoch?.();
 const current=()=>{
  const now=live.current;
  return now.ownerWorkspaceScope===scope&&['owner','admin'].includes(now.cloudWorkspace?.role)&&now.inboxItems?.includes(item)&&item.status==='Filed'&&now.customers?.includes(customer)&&customer.id===item.filedCustomerId&&now.replyActions?.[customer.id]===action&&now.getQuoteFollowUpTypingEpoch?.()===epoch;
 };
 const prepare=()=>{
  if(!current()||action?.type!=='quote'||action.details?.quoteStatus!=='Sent')return false;
  const now=live.current,run=()=>current()?now.prepareQuoteFollowUp(customer.id):false;
  if(now.quoteFollowUpDraft?.trim()){
   if(now.selectedReplyActionId===customer.id)return now.go('quoteFollowUp');
   Alert.alert('Keep your current follow-up?','Preparing this saved quote will replace the other unfinished follow-up. Nothing will be sent.',[{text:'Keep current draft',style:'cancel'},{text:'Use this saved quote',onPress:run}]);return false;
  }
  return run();
 };
 return <><Text style={styles.cardBody}>This item was filed into an existing customer record. Further work stays private until you approve a supported action.</Text>
  <Button label="Open this customer" onPress={()=>current()?live.current.openCustomer(customer.id):false}/>
  {action?.type==='quote'&&action.details?.quoteStatus==='Sent'?<Button label="Prepare a private quote follow-up" onPress={prepare}/>:null}
 </>;
}
