import React from 'react';
import * as SecureStore from 'expo-secure-store';
import {Text} from 'react-native';
import {Details,Button} from './ui';
import {WorkflowStatus} from './WorkflowChrome';
import {styles} from '../theme/styles';
import {createWebsiteRequestCheckpoint,recoverWebsiteRequest} from '../core/websiteRequestCheckpoint.mjs';
import {websiteRequestContent} from '../core/websiteRequestPlan.mjs';
import {applyStructuredWebsiteEdit,applyWebsiteLayoutChange,rebuildPrivateWebsiteDraft,renderWebsiteHtml} from '../domain/websiteBuilder';
export function WebsiteRequestRecovery({s,plan,inputText,onRestore}){
 const owner=s.ownerSession?.userId,business=s.cloudWorkspace?.businessId,id=s.websiteDraft?.id,scope=s.ownerWorkspaceScope;
 const store=React.useMemo(()=>createWebsiteRequestCheckpoint(SecureStore,{ownerId:owner,businessId:business,websiteId:id}),[owner,business,id]);
 const text=React.useRef(inputText);text.current=inputText;
 const live=React.useRef(s),flight=React.useRef(false),alive=React.useRef(true);live.current=s;React.useEffect(()=>{alive.current=true;return()=>{alive.current=false;};},[]);
 const [saved,setSaved]=React.useState(undefined),[notice,setNotice]=React.useState(''),[busy,setBusy]=React.useState(false);
 const current=()=>alive.current&&live.current.cloudWorkspace?.role==='owner'&&text.current===inputText&&live.current.websiteDraft===s.websiteDraft&&live.current.ownerWorkspaceScope===scope&&live.current.ownerSession?.userId===owner&&live.current.cloudWorkspace?.businessId===business&&live.current.websiteDraft?.id===id;
 const run=async fn=>{if(flight.current||!current())return;flight.current=true;setBusy(true);try{await fn();}catch(e){if(current())setNotice(e.message||'Recovery unavailable. Your open work is kept.');}finally{flight.current=false;if(current())setBusy(false);}};
 if(!owner||!business||!id||s.cloudWorkspace?.role!=='owner')return null;
 return <Details label="Continue unfinished website changes">
  <Text style={styles.cardBody}>Optional protected recovery on this device for seven days. It keeps your proposed changes, not proof that a website save succeeded. Nothing is automatically repeated.</Text>
  <Button label="Check unfinished changes on this device" disabled={busy} onPress={()=>run(async()=>{const r=await store.inspect();if(current()){setSaved({scope,record:r});setNotice(r?.expired?'This device plan has expired. You can replace it with a new reviewed plan or forget it.':r?'A private plan was found. Inspect the saved website before continuing.':'No plan saved for this website on this device.');}})}/>
  <Button label="Keep this reviewed plan on this device" disabled={busy||!plan||saved?.scope!==scope} onPress={()=>run(async()=>{const expected=saved.record?.revision||0;await store.save(plan,expected,current);const r=await store.inspect();if(current()){setSaved({scope,record:r});setNotice('Device plan read back exactly. Website saving is separate.');}})}/>
  {saved?.scope===scope&&saved.record?<>
   <Button label="Review continuing the saved plan" disabled={busy||saved.record.expired===true} onPress={()=>run(async()=>{const r=await store.inspect();if(!r||r.revision!==saved.record.revision)throw Error('Device plan changed. Check it again.');const website=live.current.websiteDraft;
    if(!s.connectedRuntime?.verify)throw Error('Account inspection is unavailable. Your plan stays protected; nothing was repeated.');
    const account=await s.connectedRuntime.verify();if(!current()||account.actorId!==owner||account.businessId!==business||account.notOwnReceipt!==true||account.websiteDraft?.generation!==website.generation||websiteRequestContent(account.websiteDraft)!==websiteRequestContent(website))throw Error('Open the current saved website, then review this plan again.');
    const recovered=recoverWebsiteRequest(r,website,{ownerId:owner,businessId:business,websiteId:id},{fieldEdit:applyStructuredWebsiteEdit,layoutEdit:applyWebsiteLayoutChange,rebuild:rebuildPrivateWebsiteDraft,renderPage:renderWebsiteHtml});if(!recovered.ok)throw Error(recovered.reason);if(current()){onRestore(recovered.plan);setNotice(recovered.position.done?'All parts are already present. No earlier save acknowledgement is claimed.':'Remaining work prepared for a fresh review. Nothing was replayed.');}})}/>
   <Button label="Forget only this device plan" disabled={busy} onPress={()=>run(async()=>{if(await store.remove(saved.record.revision,current)&&current()){setSaved({scope,record:null});setNotice('Device plan removed. Website and saved history are unchanged.');}})}/>
  </>:null}
  {notice?<WorkflowStatus title="Unfinished website work" body={notice}/>:null}
 </Details>;
}
