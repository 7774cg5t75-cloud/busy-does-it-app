import React from 'react';
import {Text,View} from 'react-native';
import {Card,Button} from './ui';
import {styles} from '../theme/styles';
import {parseEnquiryListingReference} from '../core/ownerConversationPreparation.mjs';
import {readCustomerEnquiryRequirements} from '../core/customerEnquiryRequirements.mjs';
// Read-only original filed record; no extraction, customer write or send authority.
export function QuoteEnquiryContext(props){
 const {s,customerId=s.selectedReplyActionId}=props;
 const live=React.useRef(null);live.current={s,item:Object.hasOwn(props,'item')?props.item:s.quoteEnquiryOriginItem||s.quoteFollowUpOriginItem,customerId};
 const item=live.current.item,scope=s.ownerWorkspaceScope,stamp=JSON.stringify(item);
 if(!item&&customerId===s.selectedReplyActionId&&s.quoteEnquiryLinkStatus==='needs-review')return <Card eyebrow="Saved enquiry link" title="Review the original enquiry" body="This quote keeps an enquiry reference, but its current filed record could not be matched. Your quote wording is kept. Do not assume the original requirements are unchanged or that anything was delivered." tone="blue"/>;
 if(!item||item.status!=='Filed'||item.filedCustomerId!==customerId||!s.inboxItems?.includes(item))return null;
 return <Card eyebrow="Original filed enquiry" title={item.parsed?.name||'Customer request'} body="Review the current customer request alongside your private quote. Saving the quote can retain its filing reference; device/account saving and customer delivery need separate evidence. Requested dates and requirements are not confirmed availability or bookings.">
  {s.quoteEnquiryLinkStatus==='linked'?<Text style={styles.cardBody}>This quote retains a link to this filing record. Review the current request; the link does not prove that its wording is unchanged or that the quote was delivered.</Text>:null}
  {item.parsed?.service?<Text style={styles.cardBody}>{'Requested service: '+item.parsed.service}</Text>:null}
  <Text selectable style={styles.workspaceMeta}>{'Filed enquiry reference: '+item.id+' · Recorded source: '+(item.source||'Not recorded')}</Text>
  {item.rawText?<View style={styles.recordRow}><Text accessibilityRole="header" style={styles.workspacePanelTitle}>Recorded enquiry wording</Text><Text selectable style={styles.conversationBody}>{item.rawText}</Text></View>:<Text style={styles.cardBody}>The original item has no retained message wording. Review its customer record for supplied details.</Text>}
  {props.openQuote&&s.startDirectCustomerAction?<Button label={s.replyActions?.[customerId]?.type==='quote'?"Continue this customer's private quote":"Prepare a private quote from this enquiry"} onPress={()=>{const now=live.current;return now.s.ownerWorkspaceScope===scope&&now.item===item&&now.customerId===customerId&&JSON.stringify(item)===stamp&&now.s.inboxItems?.filter(row=>row.id===item.id).length===1&&now.s.inboxItems.includes(item)?now.s.startDirectCustomerAction(customerId,'quote',item.id):false;}}/>:null}
  {props.appendQuote&&readCustomerEnquiryRequirements(item.rawText)?<Button label="Add supplied details without replacing my wording" onPress={()=>props.appendQuote(item)}/>:null}
  {props.prepareQuote&&readCustomerEnquiryRequirements(item.rawText)?<Button label="Use supplied details in my quote draft" onPress={()=>props.prepareQuote(item)}/>:null}
  {props.prepareCatalogue&&parseEnquiryListingReference(item.rawText)?<Button label="Use current approved item information" onPress={()=>props.prepareCatalogue(item)}/>:null}
  {props.prepareService?<Button label="Use approved service information" onPress={()=>props.prepareService(item)}/>:null}
  {(s.quoteEnquiryOriginItem===item||s.customerEnquiryOriginItem===item)&&s.returnToQuoteEnquiry?<Button label="Return to original enquiry" onPress={()=>live.current.s.ownerWorkspaceScope===scope&&live.current.item===item&&live.current.customerId===customerId&&JSON.stringify(item)===stamp&&live.current.s.inboxItems?.includes(item)?live.current.s.returnToQuoteEnquiry(customerId):false}/>:null}
 </Card>;
}
