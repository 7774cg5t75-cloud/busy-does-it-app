import React from 'react';import {Text,Alert} from 'react-native';
import {Card,Button} from '../components/ui';import {styles} from '../theme/styles';
import {appEnquirySetup} from '../core/appEnquirySetup.mjs';import {stableJson} from '../core/stableJson.mjs';
export function AppEnquirySetup({businessId,ownerId,app,catalog,busy=false,onEnable,Surface}){
 const [preview,setPreview]=React.useState(null),[notice,setNotice]=React.useState('');const live=React.useRef(null),decision=React.useRef(null),flight=React.useRef(null),alive=React.useRef(true);
 React.useEffect(()=>{alive.current=true;return()=>{alive.current=false;decision.current=null;};},[]);
 const setup=appEnquirySetup({businessId,app,catalog}),stamp=stableJson([ownerId,setup?.source,catalog]);live.current={ownerId,businessId,app,catalog,busy,stamp};
 const current=()=>!!ownerId&&alive.current&&!live.current.busy&&live.current.stamp===stamp&&stableJson([live.current.ownerId,appEnquirySetup(live.current)?.source,live.current.catalog])===stamp;
 const request=step=>{if(!current()||flight.current||!step.plan||typeof onEnable!=='function')return false;let used=false;const token={};decision.current=token;
  Alert.alert('Review '+step.key+' enquiry setup','Enable the original '+step.key+' module version '+step.version+' in this exact private app revision? This uses its original module writer, not Studio content approval. It does not publish, submit an enquiry or confirm a booking. Unsaved original editor wording must be kept or deliberately discarded first.',[
   {text:'Keep current app',style:'cancel',onPress:()=>{used=true;}},{text:'Enable original '+step.key,onPress:async()=>{if(used||decision.current!==token||!current()||flight.current)return false;used=true;flight.current=token;try{const result=await onEnable(step.key);if(alive.current&&live.current.ownerId===ownerId&&live.current.businessId===businessId)setNotice(result===true?'The original module operation returned. Inspect the current app revision; this card does not mint a save receipt.':'The original operation did not establish completion. Keep existing work and inspect the original app before trying again.');return result===true;}finally{if(flight.current===token)flight.current=null;}}}
  ]);return true;
 };
 return <Card eyebrow="Guided App Builder" title="Set up customer enquiries" body="Use the original supported Services and Enquiry modules, then configure service copy and the enquiry journey below. Module changes are separate original operations; Studio still owns coordinated content approval, saving and Undo.">
  {!setup?<Text style={styles.cardBody}>A current supported app and exact available module versions are required. No capability was invented or enabled.</Text>:<>
   {setup.steps.map(step=><React.Fragment key={step.key}><Text style={styles.cardBody}>{step.key+' · version '+step.version+' · '+(step.enabled?'enabled in current private draft':'not enabled')}</Text>{!step.enabled?<><Button label={'Preview original '+step.key+' setup'} disabled={busy||!step.plan} onPress={()=>{if(current())setPreview({stamp,config:step.plan.nextConfig});}}/><Button label={'Review enabling original '+step.key} disabled={busy||!step.plan||!onEnable} onPress={()=>request(step)}/></>:null}</React.Fragment>)}
   {setup.ready?<Text style={styles.cardBody}>Both original modules are enabled in the current draft. Continue with the service-and-enquiry editor below. Original name, email-or-phone and message validation still applies; optional requirement fields remain the original fixed schema.</Text>:null}
   {preview?.stamp===stamp&&Surface?<><Text style={styles.cardBody}>Inert proposed module preview only. Nothing was saved or published.</Text><Surface config={preview.config} interactive={false} catalogueContextKey={'enquiry-setup:'+app.id+':'+app.draft_revision}/></>:null}
  </>}
  {notice?<Text accessibilityLiveRegion="polite" style={styles.cardBody}>{notice}</Text>:null}
 </Card>;
}
