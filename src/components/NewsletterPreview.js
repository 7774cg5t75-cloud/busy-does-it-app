import React from 'react';
import {Platform,Text,View} from 'react-native';
import {WebView} from 'react-native-webview';
import {Card,Button} from './ui';
import {styles} from '../theme/styles';
import {newsletterPreview} from '../core/newsletterPreview.mjs';
import {buildContentBrandSnapshot} from '../core/businessBrandDnaV3195.mjs';

export function NewsletterPreview({s}){
 const [compact,setCompact]=React.useState(true),[showHtml,setShowHtml]=React.useState(false);
 if(!s.ownerSession?.userId||!['owner','admin'].includes(s.cloudWorkspace?.role)||s.socialSourceContext?.contentEvidence?.businessId!==s.cloudWorkspace?.businessId)return null;
 const brand=buildContentBrandSnapshot({businessId:s.cloudWorkspace.businessId,approvedProfile:s.businessCreationIntelligence?.sharedProfile,website:s.websiteDraft,app:s.miniAppsStatus?.app,sourceMode:s.socialSourceContext.contentEvidence.sourceMode});
 const preview=newsletterPreview({text:s.socialDraftText,name:brand.ok?brand.identity.name:'',colour:brand.ok?brand.design?.primaryColour:''});
 return <Card title="Private email preview" body="Presentation of your current subject and wording. Links are inactive; photos are kept in your draft but not loaded here. Nothing is sent or saved by previewing.">
  <Button label={compact?'Use wider preview':'Use phone-width preview'} onPress={()=>setCompact(!compact)}/>
  <View style={{width:'100%',maxWidth:compact?360:640,height:520,alignSelf:'center'}}>
   {Platform.OS==='web'?<iframe title="Private newsletter preview" sandbox="" referrerPolicy="no-referrer" srcDoc={preview.html} style={{width:'100%',height:'100%',border:0}}/>:<WebView accessibilityLabel="Private newsletter preview" source={{html:preview.html}} javaScriptEnabled={false} domStorageEnabled={false} allowFileAccess={false} mixedContentMode="never" originWhitelist={['about:blank']} onShouldStartLoadWithRequest={request=>request.url==='about:blank'} style={{flex:1}}/>}
  </View>
  <Button label={showHtml?'Hide HTML copy':'Show HTML for manual copying'} onPress={()=>setShowHtml(!showHtml)}/>
  {showHtml?<><Text style={styles.cardBody}>Copy only into a trusted editor for review. This is private HTML, not a delivered email. Sending permissions, unsubscribe, sender verification and costs still need separate review.</Text><Text selectable accessibilityLabel="Newsletter HTML for manual copying" style={styles.cardBody}>{preview.html}</Text></>:null}
 </Card>;
}
