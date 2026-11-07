import React from 'react';
import {View,Text} from 'react-native';
import {Card,Button} from '../components/ui';
import {styles} from '../theme/styles';
import {createFormDiscovery} from '../core/customerFormDiscovery.mjs';
import {nativeCustomerFormRecovery} from '../native/customerFormRecovery';
import {CustomerAppForm} from './customerAppForm';
import {stableJson} from '../core/stableJson.mjs';
export function CustomerFormNavigation({appId,versionId,screenId='contact',accountId=null,request,integrity,isCurrent,interest=null,discoveryEnabled=false,recoveryStore=null,onAvailability=null}){
 const scope={appId,versionId,screenId,interest},stamp=stableJson([scope,accountId]),initial=React.useRef(stamp),live=React.useRef(null),alive=React.useRef(true);live.current={stamp,isCurrent};React.useEffect(()=>{alive.current=true;return()=>{alive.current=false;};},[]);const current=()=>alive.current&&initial.current===live.current.stamp&&live.current.isCurrent?.()===true;
 const store=React.useRef(null);if(!store.current&&accountId){const candidate=recoveryStore||nativeCustomerFormRecovery({accountId,appId},current);if(candidate?.scope?.accountId===accountId&&candidate?.scope?.appId===appId)store.current=candidate;}
 const [hasStored,setHasStored]=React.useState(false),[protectedReady,setProtectedReady]=React.useState(false),[entries,setEntries]=React.useState([]),[saved,setSaved]=React.useState(null),[chosen,setChosen]=React.useState(null),[expanded,setExpanded]=React.useState(true),[remember,setRemember]=React.useState(false),[notice,setNotice]=React.useState(''),[busy,setBusy]=React.useState(false);
 const load=async()=>{if(!current())return;setBusy(true);try{if(discoveryEnabled){const r=await createFormDiscovery({scope,request,isCurrent:current}).read();if(current()){setEntries(r.ok?r.entries:[]);onAvailability?.(r.ok&&r.entries.length>0);if(!r.ok)setNotice(r.reason);}}if(store.current){try{const r=await store.current.load();if(current()){setProtectedReady(true);setHasStored(!!r);}if(current()&&screenId==='contact')setSaved(r);}catch{if(current()){setHasStored(true);setNotice('Protected receipt recovery is unavailable on this device.');}}}}finally{if(current())setBusy(false);}};
 React.useEffect(()=>{void load();},[]);
 if(!current()||!entries.length&&!saved)return null;
 return <Card title="Enquiry questions" body="Choose the reviewed questions for this business. Nothing is sent until you review and choose to continue.">
 {!chosen&&protectedReady?<Button label={'Keep a protected receipt on this device'+(remember?' ✓':'')} disabled={busy} onPress={()=>setRemember(!remember)}/>:null}
 <Button label="Refresh available questions" disabled={busy} onPress={()=>load()}/>
 {entries.map(e=><Button key={e.id} label={e.title} disabled={busy||hasStored} onPress={async()=>{if(current()){if(store.current){try{const prior=await store.current.load();if(prior){setHasStored(true);if(screenId==='contact')setSaved(prior);return false;}}catch{return false;}}setChosen({identity:{id:e.id,expectedAppId:e.appId,expectedVersionId:e.appVersionId},interest:e.interest,resume:false});setExpanded(true);}}}/>)}
 {saved?<Button label="Inspect my saved enquiry receipt" disabled={busy} onPress={async()=>{if(!current()||!store.current)return false;try{const prior=await store.current.load();if(!current()||!prior||stableJson(prior)!==stableJson(saved))return false;setChosen({identity:prior.identity,interest:null,resume:true});setExpanded(true);return true;}catch{return false;}}}/>:null}
 {chosen?<><Button label={expanded?'Back to app information':'Return to my enquiry'} onPress={()=>setExpanded(!expanded)}/><View style={{display:expanded?'flex':'none'}} importantForAccessibility={expanded?'auto':'no-hide-descendants'} pointerEvents={expanded?'auto':'none'}><CustomerAppForm key={stableJson(chosen)} identity={chosen.identity} interest={chosen.interest} request={request} integrity={integrity} isCurrent={current} active={expanded} recovery={chosen.resume||remember?store.current:null} resume={chosen.resume} onNew={()=>{setChosen(null);setSaved(null);setHasStored(false);}} beforeDispatch={async()=>{if(!current())return false;if(!store.current)return true;try{return await store.current.load()===null;}catch{return false;}}}/></View></>:null}
 {!store.current?<Text style={styles.cardBody}>Receipt recovery after closing is unavailable here. No answers are saved to ordinary browser storage.</Text>:null}
 {hasStored?<Text style={styles.cardBody}>Inspect the saved enquiry from Contact before starting another on this device.</Text>:null}
 {notice?<Text style={styles.cardBody}>{notice}</Text>:null}
 </Card>;
}
