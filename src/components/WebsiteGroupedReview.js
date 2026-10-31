import React from 'react';
import {Text,View} from 'react-native';
import {WebView} from 'react-native-webview';
import {Button,Details} from './ui';
import {WorkflowStatus} from './WorkflowChrome';
import {styles} from '../theme/styles';
import {locateWebsiteRequest} from '../core/websiteRequestPlan.mjs';
import {prepareWebsitePageInstructionPreview} from '../core/websitePageInstructions.mjs';
import {applyStructuredWebsiteEdit,applyWebsiteLayoutChange,renderWebsiteHtml} from '../domain/websiteBuilder';
export function WebsiteGroupedReview({s,plan,onDiscard}){
 const [review,setReview]=React.useState(null),[busy,setBusy]=React.useState(false),[notice,setNotice]=React.useState(''),[unknown,setUnknown]=React.useState(false),[whole,setWhole]=React.useState(true);
 const live=React.useRef(s),flight=React.useRef(false),alive=React.useRef(true);live.current=s;
 React.useEffect(()=>{alive.current=true;return()=>{alive.current=false;};},[]);
 const owner=s.ownerSession?.userId,business=s.cloudWorkspace?.businessId,scope=s.ownerWorkspaceScope;
 const current=()=>alive.current&&live.current.ownerWorkspaceScope===scope&&live.current.ownerSession?.userId===owner&&live.current.cloudWorkspace?.businessId===business&&live.current.websiteDraft?.id===plan.draftId;
 const location=locateWebsiteRequest(plan,s.websiteDraft),validReview=review&&review.source===s.websiteDraft&&location.ok&&review.completed===location.completed;
 const inspect=async()=>{if(flight.current)return;flight.current=true;setBusy(true);try{if(!s.connectedAccountRead)throw Error('Reopen the saved website, then paste the original request to recover its progress.');await s.connectedAccountRead();if(current()){setUnknown(false);setReview(null);setNotice('Account inspected independently. Only an exact planned boundary can continue; no save was replayed.');}}catch(e){if(current())setNotice(e.message);}finally{flight.current=false;if(current())setBusy(false);}};
 const preview=()=>{if(!location.ok||!location.next||unknown)return;const result=prepareWebsitePageInstructionPreview(s.websiteDraft,{draftId:plan.draftId,pageId:plan.pageId,generation:s.websiteDraft.generation,instruction:location.next.instruction},{fieldEdit:applyStructuredWebsiteEdit,layoutEdit:applyWebsiteLayoutChange,renderPage:renderWebsiteHtml});if(result.ok){setReview({...result,source:s.websiteDraft,completed:location.completed});setWhole(false);}else setNotice(result.reason);};
 const apply=async()=>{if(flight.current||!validReview||unknown)return;const captured=review,source=s.websiteDraft;flight.current=true;setBusy(true);try{const result=await s.applyWebsitePageInstruction?.({pageId:plan.pageId,generation:source.generation,instruction:location.next.instruction});if(!current())return;setReview(null);if(result?.applied){setNotice('This part was saved and independently reopened. Review the next part before saving anything else.');}else{setUnknown(true);setNotice(result?.reason||'Save not confirmed. Inspect the account before continuing.');}}catch{if(current()){setUnknown(true);setNotice('Save not confirmed. Inspect the account; do not repeat it.');}}finally{flight.current=false;if(current())setBusy(false);}};
 const html=whole?plan.candidateHtml:validReview?review.candidateHtml:plan.originalHtml;
 return <View>
  <WorkflowStatus title={location.ok?(location.done?'All planned parts observed in this website':location.completed+' of '+plan.groups.length+' parts observed in this website'):'Plan needs another review'} body={location.ok?plan.summary:location.reason}/>
  <Text style={styles.cardBody}>Each part saves separately with its own Undo. Stopping keeps previously saved parts. Progress observations are not recovered save receipts. This plan stays in this open editor; keep the original request before leaving.</Text>
  <Details label="Keep a copy of this request"><Text selectable style={styles.cardBody}>{plan.instruction}</Text>{location.ok&&!location.done?<><Text style={styles.cardBody}>Remaining wording after the observed saved parts — review again if reopening this editor:</Text><Text selectable style={styles.cardBody}>{plan.groups.slice(location.completed).map(g=>g.instruction).join('; ')}</Text></>:null}</Details>
  {plan.groups.map((group,i)=><Text key={String(i)} style={styles.cardBody}>{'Part '+(i+1)+': '+group.steps.join(' · ')}</Text>)}
  <Button label={whole?'Show original website':'Show complete proposed result'} onPress={()=>{setWhole(!whole);setReview(null);}}/>
  <View style={{height:300}}><WebView source={{html,baseUrl:'about:blank'}} javaScriptEnabled={false} domStorageEnabled={false} incognito javaScriptCanOpenWindowsAutomatically={false} allowFileAccess={false} mixedContentMode="never" onShouldStartLoadWithRequest={r=>r?.url==='about:blank'||String(r?.url||'').startsWith('about:blank#')}/></View>
  {location.ok&&!location.done?<Button label="Review next part" disabled={busy||unknown} onPress={preview}/>:null}
  {validReview?<><Text style={styles.cardBody}>{review.steps.join(' · ')}</Text><Button primary label="Save this reviewed part privately" disabled={busy||unknown} onPress={apply}/></>:null}
  {unknown?<Button label="Inspect saved account before continuing" disabled={busy} onPress={inspect}/>:null}
  {notice?<WorkflowStatus title="Website update" body={notice}/>:null}
  <Button label="Stop planning — keep saved work" disabled={busy} onPress={onDiscard}/>
 </View>;
}
