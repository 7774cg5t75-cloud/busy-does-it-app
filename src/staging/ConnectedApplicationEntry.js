import React from 'react';
import {AppState,View,Text} from 'react-native';
import {Button} from '../components/ui';
// The ORIGINAL application is evaluated only after the staging capability and
// transport denial are established. Missing auth never imports production UI.
export function ConnectedApplicationEntry({runtime,onExit}){
 const [verified,setVerified]=React.useState(true),[notice,setNotice]=React.useState('');
 const Application=React.useMemo(()=>require('../app/AppController').default,[runtime]);
 React.useEffect(()=>{let alive=true,epoch=0;const check=async()=>{const e=++epoch;setVerified(false);try{await runtime.verify();if(alive&&e===epoch)setVerified(true);}catch{if(alive&&e===epoch)setNotice('Reconnect and verify your business before continuing. Your unfinished device work is kept.');}};const sub=AppState.addEventListener('change',state=>{if(state!=='active'){epoch++;setVerified(false);}else check();});return()=>{alive=false;epoch++;sub.remove();runtime.dispose();};},[runtime]);
 return <View style={{flex:1}}>
  <View style={verified?{flex:1}:{display:'none'}}><Application connectedRuntime={runtime}/></View>
  {!verified?<View style={{padding:24,paddingTop:70}}><Text>{notice||'Checking your business access…'}</Text><Button label="Check connection" onPress={async()=>{try{await runtime.verify();if(runtime.active)setVerified(true);}catch{setNotice('Access is still unavailable. Nothing was saved or replayed.');}}}/><Button label="Return to sign-in inspector" onPress={onExit}/></View>:null}
 </View>;
}
