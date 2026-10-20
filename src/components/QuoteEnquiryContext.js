import React from 'react';
import {Text} from 'react-native';
import {Card,Button} from './ui';
import {styles} from '../theme/styles';
// Read-only original filed record; no extraction, customer write or send authority.
export function QuoteEnquiryContext({s}){
 const item=s.quoteEnquiryOriginItem||s.quoteFollowUpOriginItem;
 if(!item||item.status!=='Filed'||item.filedCustomerId!==s.selectedReplyActionId||!s.inboxItems?.includes(item))return null;
 return <Card eyebrow="Original filed enquiry" title={item.parsed?.name||'Customer request'} body="Keep the original customer information alongside your private follow-up. These are recorded requests, not confirmed availability or booking details.">
  {item.parsed?.service?<Text style={styles.cardBody}>{'Requested service: '+item.parsed.service}</Text>:null}
  {item.rawText?<Text selectable style={styles.cardBody}>{item.rawText}</Text>:<Text style={styles.cardBody}>The original item has no retained message wording. Review its customer record for supplied details.</Text>}
  {s.quoteEnquiryOriginItem===item&&s.returnToQuoteEnquiry?<Button label="Return to original enquiry" onPress={s.returnToQuoteEnquiry}/>:null}
 </Card>;
}
