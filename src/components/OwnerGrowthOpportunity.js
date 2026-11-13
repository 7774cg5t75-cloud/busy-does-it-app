import React from 'react';
import {Text,View,Alert} from 'react-native';
import {Card,Button,Field} from './ui';
import {styles} from '../theme/styles';
import {stableJson} from '../core/stableJson.mjs';
import {ownerOpportunityServices,reviewOwnerOpportunity} from '../domain/ownerGrowthOpportunity.mjs';
export function OwnerGrowthOpportunity({s,initialRecord=null,onDraftChange,onSave,allowPrepare=true}){
 const [form,setForm]=React.useState(initialRecord?.record||{title:'',description:'',source:'',permission:'unknown',serviceId:''}),[inspection,setInspection]=React.useState(null),[notice,setNotice]=React.useState('');
 const live=React.useRef(null),epoch=React.useRef(0),decision=React.useRef(null),alive=React.useRef(true);
 React.useEffect(()=>{alive.current=true;return()=>{alive.current=false;decision.current=null;};},[]);
 const identity=React.useRef([s.ownerSession?.userId,s.cloudWorkspace?.businessId,s.ownerWorkspaceScope]);
 const visible=identity.current[0]===s.ownerSession?.userId&&identity.current[1]===s.cloudWorkspace?.businessId&&identity.current[2]===s.ownerWorkspaceScope;
 const context={ownerId:s.ownerSession?.userId,businessId:s.cloudWorkspace?.businessId,role:s.cloudWorkspace?.role,scope:s.ownerWorkspaceScope,approvedProfile:s.businessCreationIntelligence?.sharedProfile},stamp=stableJson(context),version=epoch.current;
 live.current={s,form,stamp,allowPrepare};
 const current=()=>alive.current&&visible&&live.current.stamp===stamp&&stableJson({ownerId:live.current.s.ownerSession?.userId,businessId:live.current.s.cloudWorkspace?.businessId,role:live.current.s.cloudWorkspace?.role,scope:live.current.s.ownerWorkspaceScope,approvedProfile:live.current.s.businessCreationIntelligence?.sharedProfile})===stamp;
 if(!visible||!context.ownerId||!context.businessId||!context.scope||!['owner','admin'].includes(context.role))return null;
 const edit=key=>value=>{if(!current()||version!==epoch.current)return false;epoch.current++;decision.current=null;setInspection(null);setNotice('');setForm(old=>({...old,[key]:value}));onDraftChange?.(true);return true;};
 const result=reviewOwnerOpportunity(context,form),exact=inspection?.ok&&inspection.stamp===result.stamp;
 const inspect=()=>{if(!current()||version!==epoch.current)return false;decision.current=null;setInspection(result);setNotice(result.ok?'Reviewed in this session. The information remains owner-reported; no external source was checked.':result.reason);return result.ok;};
 const prepare=()=>{
  if(!current()||version!==epoch.current||!exact||!result.mayPrepare||!live.current.allowPrepare||initialRecord&&stableJson(form)!==stableJson(initialRecord.record)||typeof s.socialContentActions?.prepare!=='function')return false;
  const ticket={};decision.current=ticket;let used=false;
  Alert.alert('Review private opportunity preparation','This retains your owner-reported account and source in a private Creator preparation. Remove unnecessary personal information. It is not a message to send, verified demand, contact permission or a customer record. Creator keeps its separate Use/Keep decision; nothing is automatically saved.',[
   {text:'Keep reviewing',style:'cancel',onPress:()=>{used=true;if(decision.current===ticket)decision.current=null;}},
   {text:'Prepare privately in Creator',onPress:()=>{if(used||decision.current!==ticket||!current()||!live.current.allowPrepare||version!==epoch.current||reviewOwnerOpportunity(context,live.current.form).stamp!==result.stamp)return false;used=true;decision.current=null;const reference=initialRecord?live.current.s.growthOpportunityAccount?.reference?.(initialRecord):null;if(initialRecord&&!reference)return false;return live.current.s.socialContentActions.prepare('','','approved-profile','owner-announcement',result.ownerFacts,'standard',false,'social',null,null,reference);}}
  ]);return true;
 };
 return <Card eyebrow="Get More Customers · owner-provided" title="Review a possible opportunity" body={initialRecord?"Editing a saved owner report. New wording remains unsaved until a reviewed account operation and readback. It is not independent discovery or a CRM customer.":"Record what you heard and why it may be relevant. This is one unsaved session preparation, not independent discovery or a new CRM customer. Use only information you are authorised to process; omit unnecessary contact or sensitive details."}>
  <Field label="Opportunity title" value={form.title} onChangeText={edit('title')}/>
  <Field label="What have you heard? Keep uncertainty explicit" value={form.description} multiline onChangeText={edit('description')}/>
  <Field label="Where did the information come from?" value={form.source} multiline onChangeText={edit('source')}/>
  {ownerOpportunityServices(context).map(service=><Button key={service.id} label={'Relevant approved service: '+service.name+(form.serviceId===service.id?' · selected':'')} onPress={()=>edit('serviceId')(service.id)}/>)}
  {['unknown','permitted','restricted'].map(value=><Button key={value} label={'Use of information: '+value+(form.permission===value?' · selected':'')} onPress={()=>edit('permission')(value)}/>)}
  <Text style={styles.cardBody}>“Permitted” is your report about using this information privately. It does not establish consent or permission for email, SMS, calls or direct marketing. No prospect identity has been verified.</Text>
  <Button label="Review my opportunity evidence" onPress={inspect}/>
  {notice?<Text accessibilityLiveRegion="polite" style={styles.cardBody}>{notice}</Text>:null}
  {exact&&onSave?<Button label="Review account opportunity save" disabled={!result.ok} onPress={()=>{if(current()&&version===epoch.current)return onSave({fields:form,isCurrent:()=>current()&&version===epoch.current});}}/>:null}
  {exact?<View><Text selectable style={styles.cardBody}>{result.ownerFacts}</Text><Button label="Review private opportunity preparation in Creator" disabled={!result.mayPrepare||!live.current.allowPrepare||!!initialRecord&&stableJson(form)!==stableJson(initialRecord.record)||!s.socialContentActions?.prepare} onPress={prepare}/><Text style={styles.cardBody}>Creator preparation is not an opportunity save. Only the original Creator save and readback can establish a saved private content draft. Its retained owner-supplied evidence is historical wording, not fresh eligibility or verified demand. Recheck it when returning. Outreach, response, enquiry, quote, work and payment: not established.</Text></View>:null}
 </Card>;
}
