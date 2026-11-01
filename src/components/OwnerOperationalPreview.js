import React from 'react';
import {Text,Alert} from 'react-native';
import {Card,Button} from './ui';
import {styles} from '../theme/styles';
import {stableJson} from '../core/stableJson.mjs';
import {workPreparationSummary} from '../core/workPreparation.mjs';
import {createWorkPreparationSession} from '../core/workPreparationSession.mjs';
import {privateArtifactCrypto} from '../core/privateArtifactCrypto';
import {CanonicalWorkPanel} from './CanonicalWorkPanel';
// Original Studio-only, session-reviewed view. Never part of draft_config,
// published MiniAppSurface, HTML or standalone customer configuration.
export function OwnerOperationalPreview({s,app,busy=false}){
 const stamp=stableJson([s.ownerSession?.userId,s.cloudWorkspace?.businessId,app?.id,app?.draft_revision,app?.created_by]),initial=React.useRef(stamp),workspace=React.useRef(s.ownerWorkspaceScope),live=React.useRef(null),mounted=React.useRef(true);live.current={s,app,stamp};React.useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;};},[]);
 const current=()=>mounted.current&&live.current.stamp===initial.current&&live.current.s.ownerWorkspaceScope===workspace.current&&live.current.s.cloudWorkspace?.role==='owner'&&live.current.app?.business_id===live.current.s.cloudWorkspace?.businessId&&live.current.app?.created_by===live.current.s.ownerSession?.userId;
 const [view,setView]=React.useState(null),[notice,setNotice]=React.useState(''),[pending,setPending]=React.useState(false),[work,setWork]=React.useState(false);const epoch=React.useRef(0);
 if(!current()||!s.workPreparationRequest||!s.canonicalWork?.enabled)return null;
 const choose=async(item,customer)=>{if(!current()||pending||busy)return false;const token=++epoch.current;setPending(true);try{const scope={ownerId:s.ownerSession.userId,businessId:s.cloudWorkspace.businessId,customerId:customer.id,targetKind:'filed_enquiry',enquiryId:item.id},api=createWorkPreparationSession({scope,getCurrent:()=>({ready:current()&&epoch.current===token&&live.current.s.customers?.some(c=>c===customer)&&live.current.s.inboxItems?.some(i=>i===item&&i.status==='Filed'&&i.filedCustomerId===customer.id),identity:scope}),request:s.workPreparationRequest,integrity:privateArtifactCrypto}),observed=await api.read();if(!current()||epoch.current!==token)return false;if(!observed.plan||observed.needsSourceReview||observed.existingQuotePlan){setView({value:observed,customer,item});setWork(false);setNotice('Open the original Work preparation to create or review its current source first.');return false;}const appReference={id:app.id,revision:app.draft_revision},ticket=api.review(observed,null,'preview',{app:appReference});if(!ticket)return false;let used=false;Alert.alert('Review your private operational screen',observed.plan.title+'\nThis exact App and enquiry, for the owner only. No App configuration is saved or published.',[{text:'Keep private view closed',onPress:()=>{used=true;api.cancel(ticket);}},{text:'Open private operational screen',onPress:async()=>{if(used||!current()||epoch.current!==token)return false;used=true;setPending(true);try{const r=await api.commit(ticket,{ownerApproved:true});if(!r.ok||!r.preview||!current())throw Error();setView({value:r.observed,customer,item});setWork(false);setNotice('Private owner view prepared from the current source. Refresh to inspect later changes.');return true;}catch{if(current())setNotice('The App, source or preparation changed. No private screen was opened.');return false;}finally{if(mounted.current)setPending(false);}}}]);return true;}catch{if(current())setNotice('This original enquiry or private App is unavailable.');return false;}finally{if(mounted.current)setPending(false);}};
 const sourceCurrent=view&&(s.inboxItems||[]).includes(view.item)&&(s.customers||[]).includes(view.customer),summary=sourceCurrent&&workPreparationSummary(view.value.plan),guard=apply=>s.requestOwnerEditTransition?s.requestOwnerEditTransition(apply,{isCurrent:current}):work?false:(apply(),true);
 return <Card title="Your private operational screen" body="An owner-only view of original Work preparation. It does not appear in your customer App, public preview or publication.">
 {(s.inboxItems||[]).filter(i=>i.status==='Filed').map(i=>{const rows=(s.customers||[]).filter(c=>c.id===i.filedCustomerId);return rows.length===1?<Button key={i.id} label={'Review private work for '+rows[0].name} disabled={busy||pending} onPress={()=>choose(i,rows[0])}/>:null;})}
 {view&&!sourceCurrent?<Text style={styles.cardBody}>This source has changed or is unavailable. Select the current enquiry to review it again.</Text>:null}
 {view&&sourceCurrent&&!summary?<><Button label="Open original Work preparation" onPress={()=>guard(()=>setWork(!work))}/>{work?<CanonicalWorkPanel s={s} customer={view.customer} sourceEnquiryId={view.item.id}/>:null}</>:null}
 {view&&summary?<Card title={view.value.plan.title} body={'Source checked for this private view · '+summary.stage}>
 <Text style={styles.cardBody}>{summary.remaining.length+' things are still outstanding.'}</Text>
 {summary.remaining.map(i=><Text key={i.id} style={styles.cardBody}>{'○ '+i.stage+': '+i.text}</Text>)}
 <Text style={styles.cardBody}>Checked private preparation</Text>{summary.completed.map(i=><Text key={i.id} style={styles.cardBody}>{'✓ '+i.text}</Text>)}
 <Text style={styles.workspaceMeta}>This is preparation progress, not confirmed work or completion.</Text>
 <Button label="Refresh source and review private view" disabled={pending||busy} onPress={()=>guard(()=>{setView(null);setWork(false);choose(view.item,view.customer);})}/>
 <Button label={work?'Return to private operational overview':'Open original Work preparation'} onPress={()=>guard(()=>setWork(!work))}/>
 {work?<CanonicalWorkPanel s={s} customer={view.customer} sourceEnquiryId={view.item.id}/>:null}
 <Button label="Close private operational screen" onPress={()=>guard(()=>{epoch.current++;setView(null);setWork(false);})}/>
 </Card>:null}
 {notice?<Text accessibilityLiveRegion="polite" style={styles.cardBody}>{notice}</Text>:null}
 </Card>;
}
