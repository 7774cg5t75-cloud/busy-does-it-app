import React from 'react';
import {Text,View} from 'react-native';
import {Card,Button} from './ui';
import {styles} from '../theme/styles';
import {buildSeoAudit} from '../domain/websiteManagement';
export function GrowthWebsiteOpportunities({s}){
 const draft=s.websiteDraft,businessId=s.cloudWorkspace?.businessId,ownerId=s.ownerSession?.userId;
 const live=React.useRef(s);live.current=s;
 if(!ownerId||!businessId||!draft||draft.businessId&&draft.businessId!==businessId||draft.business_id&&draft.business_id!==businessId)return null;
 const current=()=>live.current.ownerSession?.userId===ownerId&&live.current.cloudWorkspace?.businessId===businessId&&live.current.websiteDraft===draft;
 const gaps=buildSeoAudit(draft).checks.filter(check=>!check.pass).slice(0,3);
 return <Card eyebrow="Get More Customers · your website source" title="Make it easier to find and contact you"
  body={gaps.length?'These checks use your current private website wording, not a public-site inspection. Review which suggestions fit your business.':'The existing source checks found no missing basics here. This does not verify ranking, indexing, accessibility or live enquiries.'}
  footer="No URL fetching, public inspection, external scan, publication or paid action." tone="blue">
  {gaps.map(check=><View key={check.id} style={styles.recordRow}><Text accessibilityRole="header" style={styles.workspacePanelTitle}>{check.label}</Text><Text style={styles.cardBody}>{check.detail}</Text></View>)}
  <Button label="Review these details in Website Builder" onPress={()=>{if(current())live.current.openWebsiteBuilder();}}/>
 </Card>;
}
