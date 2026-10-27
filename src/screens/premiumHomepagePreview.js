import React from 'react';import {Text} from 'react-native';import {WebView} from 'react-native-webview';import {Card,Button,Field} from '../components/ui';import {styles} from '../theme/styles';import {preparePremiumHomepagePreview} from '../domain/premiumHomepagePreview';import {stableJson} from '../core/stableJson.mjs';
export function PremiumHomepagePreview({ownerId,businessId,approvedFacts}){
 const [sample,setSample]=React.useState(null),[notice,setNotice]=React.useState(''),[description,setDescription]=React.useState('');const live=React.useRef(null),epoch=React.useRef(0),initial=React.useRef([ownerId,businessId]),alive=React.useRef(true);React.useEffect(()=>{alive.current=true;return()=>{alive.current=false;};},[]);
 const stamp=stableJson([ownerId,businessId,approvedFacts]);live.current={stamp};const current=()=>alive.current&&!!ownerId&&!!businessId&&live.current.stamp===stamp;
 if(initial.current[0]!==ownerId||initial.current[1]!==businessId)return null;
 const captured=epoch.current;
 return <Card title="See a premium homepage sample" body="Try the same professional Website Builder with your supplied business facts. This optional private sample makes no changes to your website. No payment, account save or publication occurs.">
  <Field label="Optional description for this sample" value={description} maxLength={1000} onChangeText={value=>{if(!current())return;epoch.current++;setDescription(value);setSample(null);}}/>
  <Button label="Prepare a private homepage sample" onPress={()=>{if(!current()||captured!==epoch.current)return false;const facts=approvedFacts?{...approvedFacts,description:description||approvedFacts.description}:null,result=preparePremiumHomepagePreview(facts);if(!result.ok){setNotice(result.reason);return false;}setSample({stamp,value:result});setNotice('Prepared locally using the original Website Builder. No hosted preview, charge or publication.');return true;}}/>
  {sample?.stamp===stamp?<>
   <Text style={styles.cardBody}>This is a private sample only. It has no public address and cannot receive enquiries. Your current website stays unchanged.</Text>
   <WebView source={{html:sample.value.html}} style={{height:460}} originWhitelist={['about:blank']} javaScriptEnabled={false} domStorageEnabled={false} onShouldStartLoadWithRequest={request=>request.url==='about:blank'||request.url?.startsWith('about:blank#')===true}/>
   <Button label="Clear this private sample" onPress={()=>{if(!current())return false;epoch.current++;setSample(null);setNotice('Sample cleared. Your original website is unchanged.');return true;}}/>
  </>:null}
  {notice?<Text accessibilityLiveRegion="polite" style={styles.cardBody}>{notice}</Text>:null}
 </Card>;
}
