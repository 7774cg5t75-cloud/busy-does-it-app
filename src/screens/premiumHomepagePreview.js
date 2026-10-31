import React from 'react';import {Text} from 'react-native';import {WebView} from 'react-native-webview';import {Card,Button,Field} from '../components/ui';import {styles} from '../theme/styles';import {preparePremiumHomepagePreview,inspectPremiumSample,revisePremiumSample} from '../domain/premiumHomepagePreview';import {stableJson} from '../core/stableJson.mjs';
export function PremiumHomepagePreview({ownerId,businessId,approvedFacts}){
 const [sample,setSample]=React.useState(null),[notice,setNotice]=React.useState(''),[description,setDescription]=React.useState(''),[headline,setHeadline]=React.useState(''),[pending,setPending]=React.useState(null),[undo,setUndo]=React.useState(null);const live=React.useRef(null),epoch=React.useRef(0),initial=React.useRef([ownerId,businessId]),alive=React.useRef(true);React.useEffect(()=>{alive.current=true;return()=>{alive.current=false;};},[]);
 const stamp=stableJson([ownerId,businessId,approvedFacts]);live.current={stamp};const current=()=>alive.current&&!!ownerId&&!!businessId&&live.current.stamp===stamp;
 if(initial.current[0]!==ownerId||initial.current[1]!==businessId)return null;
 const captured=epoch.current;
 return <Card title="See a premium homepage sample" body="Try the same professional Website Builder with your supplied business facts. This optional private sample makes no changes to your website. No payment, account save or publication occurs.">
  <Field label="Optional description for this sample" value={description} maxLength={1000} onChangeText={value=>{if(!current())return;epoch.current++;setDescription(value);setPending(null);setSample(null);}}/>
  <Button label="Prepare a private homepage sample" onPress={()=>{if(!current()||captured!==epoch.current)return false;const facts=approvedFacts?{...approvedFacts,description:description||approvedFacts.description}:null,result=preparePremiumHomepagePreview(facts);if(!result.ok){setNotice(result.reason);return false;}setSample({stamp,value:result});setHeadline(result.draft.sections.find(s=>s.type==='hero')?.title||'');setPending(null);setUndo(null);setNotice('Prepared locally using the original Website Builder. No hosted preview, charge or publication.');return true;}}/>
  {sample?.stamp===stamp&&inspectPremiumSample(sample.value).ok?<>
   <Text style={styles.cardBody}>This is a private sample only. It has no public address and cannot receive enquiries. Your current website stays unchanged.</Text>
   <WebView source={{html:sample.value.html}} style={{height:460}} originWhitelist={['about:blank']} javaScriptEnabled={false} domStorageEnabled={false} onShouldStartLoadWithRequest={request=>request.url==='about:blank'||request.url?.startsWith('about:blank#')===true}/>
   {inspectPremiumSample(sample.value).missing?.map(gap=><Text key={gap.id} style={styles.cardBody}>{gap.message}</Text>)}
   <Field label="Your sample headline" value={headline} maxLength={140} onChangeText={value=>{if(!current())return;epoch.current++;setHeadline(value);setPending(null);}}/>
   <Button label="Review sample headline change" onPress={()=>{if(!current()||captured!==epoch.current)return false;const result=revisePremiumSample(sample.value,{kind:'copy',sectionId:'hero',field:'title',value:headline},{expectedRevision:sample.value.revision});if(!result.ok){setNotice(result.reason);return false;}setPending({result,stamp,epoch:epoch.current});return true;}}/>
   <Button label="Review a centred introduction" onPress={()=>{if(!current()||captured!==epoch.current)return false;const result=revisePremiumSample(sample.value,{kind:'appearance',field:'heroLayout',value:'type-center'},{expectedRevision:sample.value.revision});if(!result.ok){setNotice(result.reason);return false;}setPending({result,stamp,epoch:epoch.current});return true;}}/>
   {pending?<>
    <Text style={styles.cardBody}>{'Proposed sample headline: '+pending.result.draft.sections.find(s=>s.type==='hero')?.title+'. This only revises the private sample.'}</Text>
    <Button label="Keep my current sample" onPress={()=>{if(!current())return false;setPending(null);return true;}}/>
    <Button label="Use this sample revision" onPress={()=>{if(!current()||pending.stamp!==stamp||pending.epoch!==epoch.current)return false;epoch.current++;setUndo(sample);setSample({stamp,value:pending.result});setPending(null);setNotice('Revised this sample only. Your actual website is unchanged.');return true;}}/>
   </>:null}
   {undo?<Button label="Undo sample revision" onPress={()=>{if(!current()||captured!==epoch.current)return false;epoch.current++;setSample(undo);setHeadline(undo.value.draft.sections.find(s=>s.type==='hero')?.title||'');setUndo(null);setPending(null);return true;}}/>:null}
   <Button label="Clear this private sample" onPress={()=>{if(!current())return false;epoch.current++;setSample(null);setPending(null);setUndo(null);setNotice('Sample cleared. Your original website is unchanged.');return true;}}/>
  </>:null}
  {notice?<Text accessibilityLiveRegion="polite" style={styles.cardBody}>{notice}</Text>:null}
 </Card>;
}
