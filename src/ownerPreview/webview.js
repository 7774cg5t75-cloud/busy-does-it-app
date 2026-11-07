import React from 'react';
import {Text,View} from 'react-native';
import {WebView as Original} from 'react-native-webview';
const csp='<meta http-equiv="Content-Security-Policy" content="default-src \'none\'; img-src data: file:; style-src \'unsafe-inline\'; script-src \'unsafe-inline\'; connect-src \'none\'; frame-src \'none\'; form-action \'none\'">';
export const WebView=React.forwardRef((props,ref)=>{
 if(typeof props.source?.html!=='string')return <View><Text>Remote preview unavailable offline.</Text></View>;
 const html=csp+props.source.html;
 return <Original {...props} ref={ref} source={{html}} originWhitelist={['about:*']} onShouldStartLoadWithRequest={r=>r.url==='about:blank'||r.url.startsWith('about:blank#')} incognito={true} sharedCookiesEnabled={false} thirdPartyCookiesEnabled={false} allowFileAccess={false} allowsLinkPreview={false} allowsInlineMediaPlayback={false} javaScriptCanOpenWindowsAutomatically={false} onOpenWindow={()=>{}} />;
});
export default WebView;
