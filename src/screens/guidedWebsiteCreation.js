import {useOwnerEditNavigation} from './useOwnerEditNavigation';
import React from 'react';
import {Text,Image} from 'react-native';
import {WebView} from 'react-native-webview';
import {Card,Button,Field} from '../components/ui';
import {styles} from '../theme/styles';
import {prepareGuidedWebsite,refineGuidedWebsite,currentGuidedWebsite,keepGuidedWebsite} from '../core/guidedWebsiteJourney.mjs';
import {websitePhotoChoices} from '../core/websitePhotoReview.mjs';
import {websiteRequestContent} from '../core/websiteRequestPlan.mjs';
import {withWebsitePreviewViewport} from '../core/websiteResponsivePreview.mjs';
import {applyStructuredWebsiteEdit,applyWebsiteLayoutChange,renderWebsiteHtml,rebuildPrivateWebsiteDraft} from '../domain/websiteBuilder';
const deps={fieldEdit:applyStructuredWebsiteEdit,layoutEdit:applyWebsiteLayoutChange,renderPage:renderWebsiteHtml,rebuild:rebuildPrivateWebsiteDraft};
export function GuidedWebsiteCreation({s}){
 const [goal,setGoal]=React.useState(''),[change,setChange]=React.useState(''),[headline,setHeadline]=React.useState(''),[journey,setJourney]=React.useState(null),[notice,setNotice]=React.useState(''),[width,setWidth]=React.useState('phone'),[busy,setBusy]=React.useState(false),[fenced,setFenced]=React.useState(false),[kept,setKept]=React.useState(false),[headlineDirty,setHeadlineDirty]=React.useState(false),[changeDirty,setChangeDirty]=React.useState(false),[unavailable,setUnavailable]=React.useState([]);
 const alive=React.useRef(true),flight=React.useRef(false),live=React.useRef(null),epoch=React.useRef(0);React.useEffect(()=>{alive.current=true;return()=>{alive.current=false;};},[]);
 const context={website:s.websiteDraft,ownerId:s.ownerSession?.userId,businessId:s.cloudWorkspace?.businessId,profileRevision:s.connectedRuntime?.profileRevision};live.current={context,journey,epoch:epoch.current};
 const report=useOwnerEditNavigation(s,{source:context.website,projectId:context.website?.id,revision:context.website?.generation},()=>{if(flight.current)return false;setJourney(null);setGoal('');setChange('');setHeadline('');setHeadlineDirty(false);setChangeDirty(false);return true;});
 const captured=epoch.current,scope=[context.ownerId,context.businessId].join(':'),source=websiteRequestContent(context.website),fresh=journey&&currentGuidedWebsite(journey,context),current=()=>alive.current&&epoch.current===captured&&[live.current.context.ownerId,live.current.context.businessId].join(':')===scope;
 const update=(fn,value)=>{if(!current()||flight.current)return;epoch.current++;fn(value);report(true);if(fn===setGoal)setJourney(null);if(fn===setHeadline)setHeadlineDirty(!!value);if(fn===setChange)setChangeDirty(!!value);};
 const refine=options=>{if(!current()||!fresh||flight.current||fenced||options.photoPath&&unavailable.includes(options.photoPath))return false;const next=refineGuidedWebsite(journey,context,options,deps);if(!next.ok){setNotice(next.reason);return false;}setJourney(next);report(true);if(options.headline)setHeadlineDirty(false);if(options.request)setChangeDirty(false);setKept(false);setNotice('Here is the revised design. Your current website is unchanged.');return true;};
 return <Card title="Your business. Your website." body="Tell Busy the outcome you want. We start with this business’s saved facts, wording and approved photographs. Nothing is published.">
  <Field label="What would you like?" value={goal} maxLength={400} onChangeText={v=>update(setGoal,v)}/>
  {!context.website?<><Text style={styles.cardBody}>First prepare your private starting point from the existing business information. No new facts will be invented.</Text><Button label="Prepare from my saved business information" onPress={()=>{if(!current())return false;return s.buildWebsiteFromBrandBrain?.();}}/></>:<>
  <Button label="See my website" disabled={busy||fenced} onPress={()=>{if(!current()||flight.current||fenced)return false;const p=prepareGuidedWebsite({...context,goal},deps);if(!p.ok){setNotice(p.reason);return false;}const open=()=>{if(!current()||websiteRequestContent(live.current.context.website)!==source)return false;setJourney(p);report(true);setKept(false);setNotice('Prepared privately. Choose photographs or make a change, then review before keeping.');return true;};const allowed=report.commit(open);if(allowed!==false)return allowed;return s.requestOwnerEditTransition?s.requestOwnerEditTransition(open,{isCurrent:current}):false;}}/>
  {fresh&&!kept?<>
   <Text style={styles.cardBody}>Using {context.website.businessName}’s current website information. Your current colours, wording and unsaved draft are the starting point.</Text>
   <Button label="Phone preview" onPress={()=>{if(current())setWidth('phone');}}/><Button label="Desktop preview" onPress={()=>{if(current())setWidth('desktop');}}/>
   <WebView source={{html:withWebsitePreviewViewport(journey.plan.candidateHtml,width)}} style={{height:520}} originWhitelist={['about:blank']} javaScriptEnabled={false} domStorageEnabled={false} incognito allowFileAccess={false} mixedContentMode="never" onShouldStartLoadWithRequest={r=>r.url==='about:blank'||r.url?.startsWith('about:blank#')===true}/>
   <Text style={styles.cardBody}>Review sharpness, the visible crop and the full page at both sizes. This is a private preview, with no live enquiry or public address.</Text>
   {websitePhotoChoices(context.website).length?websitePhotoChoices(context.website).map((photo,i)=><React.Fragment key={photo.storagePath}><Image source={{uri:photo.asset.uri}} accessibilityLabel={photo.asset.alt||'Approved business photograph'} style={{width:'100%',height:140,resizeMode:'contain'}} onError={()=>{if(current()){setUnavailable([...new Set([...unavailable,photo.storagePath])]);setNotice('This photograph could not be loaded. Choose another original or keep a typography-led design.');}}}/><Text style={styles.cardBody}>{photo.asset.alt||'Your approved photograph'} — {photo.warning}</Text><Button label={'Use this photograph '+(i+1)+' at the top'} disabled={busy||fenced||unavailable.includes(photo.storagePath)} onPress={()=>refine({photoPath:photo.storagePath})}/></React.Fragment>):<Text style={styles.cardBody}>No suitable current approved gallery photograph is available. A typography-led design works without invented images. Add or review photographs through the original media controls.</Text>}
   <Button label="Frame the photograph higher on phones" disabled={busy||fenced} onPress={()=>refine({request:'Frame the photograph higher on phones'})}/><Button label="Centre the photograph on desktop" disabled={busy||fenced} onPress={()=>refine({request:'Centre the photograph on desktop'})}/>
   <Button label="Try another design" disabled={busy||fenced} onPress={()=>refine({request:'Try another design',rejectCurrent:true})}/>
   <Field label="What would you change?" value={change} maxLength={400} onChangeText={v=>update(setChange,v)}/><Button label="Review this change" disabled={busy||fenced} onPress={()=>refine({request:change})}/>
   <Field label="Your chosen headline" value={headline} maxLength={140} onChangeText={v=>update(setHeadline,v)}/><Button label="Keep this design and review my headline" disabled={busy||fenced} onPress={()=>refine({headline})}/>
   <Button label="Keep this design" disabled={busy||fenced||headlineDirty||changeDirty} onPress={async()=>{
    if(!current()||flight.current||fenced||!fresh||headlineDirty||changeDirty)return false;report(false);flight.current=true;setBusy(true);const reviewed=journey;
    let result;try{result=await keepGuidedWebsite(reviewed,{getContext:()=>live.current.context,apply:s.applyWebsitePageInstruction});}catch{result={ok:false,unknown:true,reason:'The outcome is unknown. Inspect the original Studio before any new attempt.'};}finally{flight.current=false;if(alive.current)setBusy(false);}
    if(!current())return false;setNotice(result.reason);setFenced(!result.ok);if(!result.ok)report(true);setKept(result.ok);return result.ok;
   }}/>
   <Button label="Discard preview — keep my current website" disabled={busy} onPress={()=>{if(!current()||flight.current)return false;setJourney(null);setNotice('Preview discarded. Your current website and wording were kept.');return true;}}/>
  </>:null}
  {journey&&!fresh&&!kept?<Text style={styles.cardBody}>The original website changed. Your request and headline are kept here; prepare a fresh review before changing it.</Text>:null}
  {fenced?<Text style={styles.cardBody}>This attempt will not be replayed. Use the original account inspection and recovery controls before a new review.</Text>:null}
  <Button label="Continue editing in Website Studio" disabled={busy} onPress={()=>{if(!current())return false;const open=()=>s.go?.('websitePreview');return s.requestOwnerEditTransition?s.requestOwnerEditTransition(open,{isCurrent:current}):open();}}/>
  </>}
  {notice?<Text accessibilityLiveRegion="polite" style={styles.cardBody}>{notice}</Text>:null}
 </Card>;
}
