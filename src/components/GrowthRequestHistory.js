import React from 'react';
import {Text,View} from 'react-native';
import {Card,Button} from './ui';
import {styles} from '../theme/styles';
import {growthRequestHistory,growthRequestActivity} from '../domain/growthRequestHistory.mjs';
const input=s=>({ownerId:s.ownerSession?.userId,businessId:s.cloudWorkspace?.businessId,role:s.cloudWorkspace?.role,remote:s.miniAppsStatus,customers:s.customers});
export function GrowthRequestHistory({s}){
 const [activity,setActivity]=React.useState(null);
 const live=React.useRef(s);live.current=s;const alive=React.useRef(true);React.useEffect(()=>{alive.current=true;return()=>{alive.current=false;};},[]);
 const scope=s.ownerWorkspaceScope,owner=s.ownerSession?.userId,business=s.cloudWorkspace?.businessId,rows=growthRequestHistory(input(s));
 if(!scope||!owner||!business||!['owner','admin'].includes(s.cloudWorkspace?.role))return null;
 return <Card eyebrow="Original Business App records" title="What is actually recorded?" body="These exact request links and original customer source records establish a recorded enquiry relationship. They do not establish that a marketing activity caused it, that a Filed Inbox item matches, or that a customer converted.">
  {!rows.length?<Text style={styles.cardBody}>No exact supported request-to-enquiry relationship is available in the current loaded records. Nothing was inferred from a name, message, date or customer ID alone.</Text>:null}
  {rows.slice(0,10).map(row=><View key={row.requestId} style={styles.recordRow}>
   <Text selectable style={styles.cardBody}>{'Original request: '+row.requestId+'\nRecorded enquiry source: '+row.sourceId+'\nBusiness reply stored: '+(row.businessReplyStored?'Recorded in this request':'Not established')+'\nSigned-in customer-role reply stored: '+(row.customerReplyStored?'Recorded in this request':'Not established')+'\n'+(row.messageHistoryComplete?'Current loaded message checkpoint is complete.':'Message history may be incomplete; absence proves nothing.')+'\nProvider delivery, marketing attribution, linked quote, won work and payment: Not established.'}</Text>
   <Button label={'Inspect recorded request activity: '+row.requestId} onPress={()=>{const now=live.current;if(!alive.current||now.ownerWorkspaceScope!==scope||now.ownerSession?.userId!==owner||now.cloudWorkspace?.businessId!==business)return false;const value=growthRequestActivity(input(now),row);if(!value)return false;setActivity({scope,owner,business,value});return true;}}/>
   {activity?.scope===scope&&activity.owner===owner&&activity.business===business&&activity.value.requestId===row.requestId&&growthRequestActivity(input(s),row)?.stamp===activity.value.stamp?<View><Text style={styles.cardBody}>Exact stored activity only. Notification submission is not delivery, viewing, acceptance or acquisition attribution.</Text>{activity.value.items.map(item=><Text key={item.messageId} selectable style={styles.cardBody}>{item.meaning+' · '+item.messageId+' · server record '+item.recordedAt+' · notification intent '+item.notificationState+'\nDelivery, acceptance, Filed Inbox, quote, won work and paid attribution: Not established.'}</Text>)}</View>:null}
   <Button label="Review the original request conversation" disabled={typeof s.openOwnerMiniAppRequest!=='function'} onPress={()=>{
    const now=live.current;if(!alive.current||now.ownerWorkspaceScope!==scope||now.ownerSession?.userId!==owner||now.cloudWorkspace?.businessId!==business)return false;
    const current=growthRequestHistory(input(now)).find(x=>x.requestId===row.requestId&&x.stamp===row.stamp);return current?now.openOwnerMiniAppRequest(row.requestId):false;
   }}/>
  </View>)}
  <Text style={styles.cardBody}>No message is sent by this view. Opening the original conversation uses its existing authenticated reader and may update its unread marker. No new Inbox or activity ledger is created.</Text>
 </Card>;
}
