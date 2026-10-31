import {ConnectedBusinessFacts} from '../components/ConnectedBusinessFacts';
import {ConnectedApplicationEntry} from './ConnectedApplicationEntry';
import {createConnectedApplicationRuntime} from './connectedApplicationRuntime.mjs';
import React from 'react';
import {ScrollView,Text,View,Alert,AppState} from 'react-native';
import {WebView} from 'react-native-webview';
import {Card,Button,Field} from '../components/ui';
import {styles} from '../theme/styles';
import {appColors as C} from '../theme/appearance.mjs';
import {WebsiteContentEditor} from '../screens/websiteContentEditor';
import {MiniAppSurface} from '../screens/miniApps';
import {AppEnquiryJourneyEditor} from '../screens/appEnquiryJourneyEditor';
import {renderWebsiteHtml} from '../domain/websiteBuilder';
import {prepareGoalToPrivateApp,executeGoalToPrivateApp} from '../core/goalToPrivateApp.mjs';
import {executePrivateAppBatch,privateAppEditSource,bindPrivateAppProposal} from '../core/privateAppEditSession.mjs';
import {createConnectedBuilderSession} from './connectedBuilderSession.mjs';
import {createOwnerEditNavigation} from '../core/ownerEditNavigation.mjs';
// Integration workbench mounts ORIGINAL editors/planner/surface. It is deliberately
// a bounded staging slice, not another Home, CRM, builder or persistence engine.
export function ConnectedBuilderWorkspace({inspector,onClose}){
 const [spaces,setSpaces]=React.useState([]),[basis,setBasis]=React.useState(null),[appStatus,setAppStatus]=React.useState(null),[busy,setBusy]=React.useState(false),[notice,setNotice]=React.useState(''),[goal,setGoal]=React.useState(''),[review,setReview]=React.useState(null),[proposal,setProposal]=React.useState(null),[undo,setUndo]=React.useState(null),[suspended,setSuspended]=React.useState(false),[selectedIds,setSelectedIds]=React.useState([]),[application,setApplication]=React.useState(null);
 const generation=React.useRef(0),alive=React.useRef(true),live=React.useRef(null),session=React.useRef(null),navigation=React.useRef(null),typing=React.useRef(0),inFlight=React.useRef(false),appDirty=React.useRef({}),foreground=React.useRef(true);
 if(!session.current)session.current=createConnectedBuilderSession({request:(a,p)=>inspector.requestConnected(a,p)});
 live.current={basis,appStatus,goal,busy,proposal,review,suspended};
 const scope=()=>[live.current.basis?.actorId,live.current.basis?.businessId].join(':');
 if(!navigation.current)navigation.current=createOwnerEditNavigation({getScope:scope,confirm:({keep,discard,message})=>Alert.alert('Keep unfinished work?',message||'Opening another workspace replaces this unsaved review.',[{text:'Keep my work',style:'cancel',onPress:keep},{text:'Discard unsaved review',onPress:discard}])});
 React.useEffect(()=>{alive.current=true;let active=true;inspector.requestConnected('workspaces').then(r=>{if(active)setSpaces(r.items);}).catch(()=>{if(active)setNotice('Business membership contracts are not yet available. No workspace was opened.');});return()=>{active=false;alive.current=false;generation.current++;session.current.clear();};},[]);
 React.useEffect(()=>{let active=true,serial=0;const listener=AppState.addEventListener('change',state=>{const check=++serial;if(state!=='active'){foreground.current=false;setSuspended(true);return;}if(!session.current.scope){foreground.current=true;setSuspended(false);return;}session.current.read().then(()=>{if(active&&check===serial){foreground.current=true;setSuspended(false);}}).catch(()=>{if(!active||check!==serial)return;if(!inspector.signedIn){setBasis(null);setAppStatus(null);session.current.clear();}setNotice('Reconnect and verify business access before continuing. Unconfirmed edits have not been saved.');});});return()=>{active=false;serial++;listener.remove();};},[]);
 async function run(work){if(inFlight.current)return;inFlight.current=true;const e=generation.current;setBusy(true);setNotice('');try{const message=await work(()=>alive.current&&e===generation.current&&foreground.current&&!live.current.suspended);if(alive.current&&e===generation.current&&message)setNotice(message);}catch{if(alive.current&&e===generation.current){setNotice('The staging operation could not be confirmed. No write was replayed. Recheck access before continuing.');if(!inspector.signedIn){setBasis(null);setAppStatus(null);session.current.clear();}}}finally{if(alive.current&&e===generation.current){inFlight.current=false;setBusy(false);}}}
 const send=(action,payload={},options={})=>{if(options.isCurrent&&!options.isCurrent())throw Error('Workspace changed');return inspector.requestConnected(action,{...payload,businessId:live.current.basis.businessId,expectedProfileRevision:live.current.basis.profileRevision});};
 const open=id=>navigation.current.request(()=>run(async current=>{setBasis(null);setAppStatus(null);setReview(null);setProposal(null);setUndo(null);setSelectedIds([]);await inspector.requestConnected('initialize',{businessId:id});const found=await session.current.open(id);if(!current())return;setBasis(found);live.current={...live.current,basis:found};const status=await send('owner_status');if(current())setAppStatus(status);return 'Business opened from its current account records. Nothing published.';}));
 const ownerState={ownerSession:{userId:basis?.actorId},cloudWorkspace:{businessId:basis?.businessId},setOwnerEditDirty:r=>navigation.current.report({...r,scope:scope()}),requestOwnerEditTransition:navigation.current.request,releaseOwnerEdit:navigation.current.release,withOwnerEditCommit:navigation.current.withCommit};
 const facts=basis?.profile,app=appStatus?.app,catalog=appStatus?.catalog||appStatus?.moduleCatalog||[];
 if(application)return <ConnectedApplicationEntry key={application.ownerId+application.businessId} runtime={application} onExit={()=>{application.dispose();setApplication(null);}}/>;
 return <ScrollView style={{flex:1,backgroundColor:C.bg}} contentContainerStyle={{padding:16,paddingTop:55,paddingBottom:60}} keyboardShouldPersistTaps="handled">
  <Card eyebrow="Isolated staging" title="Connected business drafts" body="Original website and app editors. Account operations require provisioned staging contracts. Publishing, payments and customer communication remain unavailable."/>
  <Button label="Back to security inspector" disabled={busy} onPress={()=>navigation.current.request(onClose)}/>
  {spaces.map(s=><Button key={s.businessId} label={'Open '+s.businessName} disabled={busy} onPress={()=>open(s.businessId)}/>)}
  {notice?<Text accessibilityLiveRegion="polite" style={styles.cardBody}>{notice}</Text>:null}
  {suspended?<Card title="Recheck business access" body="The app paused. Verify the current session and membership before viewing or changing private work."><Button label="Verify current workspace" onPress={()=>run(async current=>{if(session.current.scope)await session.current.read();if(alive.current){foreground.current=true;setSuspended(false);}})}/></Card>:null}
  <View style={suspended?{display:'none'}:null}>
  {basis?<>
   {!facts?<ConnectedBusinessFacts s={{...ownerState,connectedReadProfile:()=>session.current.read(),connectedSaveProfile:async values=>{const result=await session.current.profile({...values,ownerApproved:true});if(alive.current&&live.current.basis?.businessId===values.basis.businessId&&result.ok)setBasis(result.observed);return result;}}}/>:null}
   <Button label="Open Busy" disabled={busy||!basis.profile||!appStatus} onPress={()=>navigation.current.request(()=>run(async current=>{const fresh=await inspector.requestConnected('builder_read',{businessId:basis.businessId});const status=await inspector.requestConnected('owner_status',{businessId:basis.businessId});if(current())setApplication(createConnectedApplicationRuntime({environment:'isolated-staging',inspector,basis:fresh,appStatus:status,onExit:()=>{setApplication(null);onClose();}}));}))}/>
   <Card title="Saved business information" body={facts?.businessName||'Open and approve the account business details above before creating private drafts.'}>
    <Text style={styles.cardBody}>{facts?.services?.map(s=>s.name).join(' • ')}</Text>
    <Button label="Recheck account drafts" disabled={busy} onPress={()=>navigation.current.request(()=>run(async current=>{const r=await session.current.reconcile();const a=await send('owner_status');if(current()){setBasis(r.observed);setAppStatus(a);setReview(null);setProposal(null);}return 'Current account versions inspected. This is not a recovered own-write receipt.';}))}/>
   </Card>
   {!basis.websiteDraft?<Button label="Review website from saved facts" disabled={busy||!facts} onPress={()=>Alert.alert('Create this private website?', 'Use the saved business information shown above. Your approval creates only a private draft.',[{text:'Keep current work',style:'cancel'},{text:'Create private draft',onPress:()=>run(async current=>{const r=await session.current.website({basis,action:'create',sourceRevision:basis.profileRevision,ownerApproved:true});if(current()&&r.ok)setBasis(r.observed);return r.ok?'Website saved and independently reopened.':r.reason;})}])}/>:<>
    <Card title="Private website draft" body="Original shared HTML renderer. External navigation and remote requests are disabled in this internal preview.">
     <WebView style={{height:420}} source={{html:renderWebsiteHtml(basis.websiteDraft).replace('<head>','<head><meta http-equiv="Content-Security-Policy" content="default-src &#39;none&#39;; style-src &#39;unsafe-inline&#39;; img-src data:;">')}} javaScriptEnabled={false} originWhitelist={['about:blank']} onShouldStartLoadWithRequest={r=>r.url==='about:blank'} />
    </Card>
    <WebsiteContentEditor key={basis.businessId} draft={basis.websiteDraft} ownerState={ownerState} onApply={patch=>{run(async current=>{const r=await session.current.website({basis,action:'edit_text',patch,ownerApproved:true});if(current()&&r.ok)setBasis(r.observed);return r.ok?'Website wording saved and independently reopened.':r.reason;});return false;}}/>
   </>}
   {!app?<Card title="Create your private business app" body="Use the original goal planner and reviewed creation authority. Creation and configuration are separate operations.">
    <Field label="What should customers be able to do?" value={goal} maxLength={600} onChangeText={v=>{typing.current++;setGoal(v);setReview(null);}}/>
    {(facts?.services||[]).map(service=><Button key={service.id} label={(selectedIds.includes(service.id)?'Included: ':'Include service: ')+service.name} disabled={busy||selectedIds.length>=6&&!selectedIds.includes(service.id)} onPress={()=>{typing.current++;setReview(null);setSelectedIds(ids=>ids.includes(service.id)?ids.filter(id=>id!==service.id):[...ids,service.id]);}}/>)}
    <Button label="Prepare from saved services" disabled={busy||!facts||!selectedIds.length} onPress={()=>{const p=prepareGoalToPrivateApp({ownerId:basis.actorId,businessId:basis.businessId,app:null,profile:facts,catalog,goal,selectedIds});setReview(p.ok?p:null);setNotice(p.ok?p.plan.summary:p.reason);}}/>
    {review?<Button label="Approve private app creation" disabled={busy} onPress={()=>run(async current=>{const e=typing.current;const result=await executeGoalToPrivateApp({review,current:()=>({ownerId:live.current.basis.actorId,businessId:live.current.basis.businessId,app:null,profile:live.current.basis.profile,catalog}),isCurrent:()=>current()&&typing.current===e&&live.current.review===review,send});if(current()&&result.status)setAppStatus(result.status);return result.ok?'Private app created, configured and independently reopened.':result.reason;})}/>:null}
   </Card>:<>
    <MiniAppSurface config={app.draft_config} interactive={false} catalogueContextKey={basis.businessId+':'+app.id}/>
    <AppEnquiryJourneyEditor key={basis.businessId+app.id} ownerId={basis.actorId} businessId={basis.businessId} app={app} catalog={catalog} approvedProfile={facts} busy={busy} Surface={MiniAppSurface} onDraftChange={dirty=>navigation.current.report({token:appDirty.current,identity:{source:app,projectId:app.id,revision:app.draft_revision,ownerId:basis.actorId,businessId:basis.businessId},dirty,scope:scope(),onDiscard:()=>{setProposal(null);return true;}})} onPreview={p=>{setProposal(p?bindPrivateAppProposal(p,{businessId:basis.businessId,app}):null);return true;}}/>
    {proposal?<Button label="Approve reviewed Studio changes" disabled={busy} onPress={()=>run(async current=>{const result=await executePrivateAppBatch({businessId:basis.businessId,app,operations:proposal.operations,source:proposal.source,isCurrent:()=>current()&&live.current.appStatus?.app===app&&live.current.proposal===proposal,write:p=>send('apply_coordinated_edits',p),readStatus:()=>send('owner_status')});if(current()&&result.status)setAppStatus(result.status);if(current()&&result.ok){setProposal(null);setUndo({app:result.status.app,operations:result.undoOperations});navigation.current.release(appDirty.current);}return result.ok?'Studio change confirmed; reopen remains available.':result.reason;})}/>:null}
    {undo&&undo.app===app?<Button label="Undo last confirmed Studio change" disabled={busy} onPress={()=>run(async current=>{const result=await executePrivateAppBatch({businessId:basis.businessId,app,operations:undo.operations,isCurrent:()=>current()&&live.current.appStatus?.app===app,write:p=>send('apply_coordinated_edits',p),readStatus:()=>send('owner_status')});if(current()&&result.status)setAppStatus(result.status);if(current()&&result.ok)setUndo(null);return result.ok?'Eligible Studio change reversed through its original authority.':result.reason;})}/>:null}
   </>}
  </>:null}
  </View>
 </ScrollView>;
}
