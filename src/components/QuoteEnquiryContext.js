import React from 'react';
import {Text} from 'react-native';
import {Card,Button} from './ui';
import {styles} from '../theme/styles';
// Read-only original filed record; no extraction, customer write or send authority.
export function QuoteEnquiryContext({s,customerId=s.selectedReplyActionId,item:supplied}){
 const live=React.useRef(null);live.current={s,item:supplied||s.quoteEnquiryOriginItem||s.quoteFollowUpOriginItem,customerId};
 const item=live.current.item,scope=s.ownerWorkspaceScope,stamp=JSON.stringify(item);
 if(!item&&customerId===s.selectedReplyActionId&&s.quoteEnquiryLinkStatus==='needs-review')return <Card eyebrow="Saved enquiry link" title="Review the original enquiry" body="This quote keeps an enquiry reference, but its current filed record could not be matched. Your quote wording is kept. Do not assume the original requirements are unchanged or that anything was delivered." tone="blue"/>;
 if(!item||item.status!=='Filed'||item.filedCustomerId!==customerId||!s.inboxItems?.includes(item))return null;
 return <Card eyebrow="Original filed enquiry" title={item.parsed?.name||'Customer request'} body="Review the current customer request alongside your private quote. Saving the quote can retain its filing reference; device/account saving and customer delivery need separate evidence. Requested dates and requirements are not confirmed bookings.">
  {s.quoteEnquiryLinkStatus==='linked'?<Text style={styles.cardBody}>This quote retains a link to this filing record. Review the current request; the link does not prove that its wording is unchanged or that the quote was delivered.</Text>:null}
  {item.parsed?.service?<Text style={styles.cardBody}>{'Requested service: '+item.parsed.service}</Text>:null}
  {item.rawText?<Text selectable style={styles.cardBody}>{item.rawText}</Text>:<Text style={styles.cardBody}>The original item has no retained message wording. Review its customer record for supplied details.</Text>}
  {(s.quoteEnquiryOriginItem===item||s.customerEnquiryOriginItem===item)&&s.returnToQuoteEnquiry?<Button label="Return to original enquiry" onPress={()=>live.current.s.ownerWorkspaceScope===scope&&live.current.item===item&&live.current.customerId===customerId&&JSON.stringify(item)===stamp&&live.current.s.inboxItems?.includes(item)?live.current.s.returnToQuoteEnquiry(customerId):false}/>:null}
 </Card>;
}
