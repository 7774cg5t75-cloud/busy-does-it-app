import {savedGrowthPreference} from '../domain/growthContinuation.mjs';
import {stableJson} from '../core/stableJson.mjs';
import React from 'react';
import {Text,View,Alert} from 'react-native';
import {Card,Button} from './ui';
import {styles} from '../theme/styles';
import {buildGrowthOpportunities,growthOpportunityInput,currentGrowthOpportunity,prepareGrowthWebsiteChange} from '../domain/growthOpportunities.mjs';
const priorityLabel={attention:'Review this enquiry',review:'Review the linked private quote',preparation:'Private preparation idea',restricted:'Contact restricted'};
const contactLabel={restricted:'This customer record restricts contact.',permission_not_established:'Permission to contact has not been established.',no_recipient_or_contact_permission:'No recipient or contact permission is established.'};
const outcomeLabel={enquiry:'Enquiry',quotation:'Quote',outreach:'Outreach',response:'Customer response',wonWork:'Won work',payment:'Payment received'};
const outcomeStatus={recorded:'Recorded in the existing workspace',private_prepared_record:'Private quote recorded; not issued or accepted',not_established:'Not established by this evidence'};
// Only review/feedback presentation lives here. Existing CRM/Creator own all drafts and writes.
export function GrowthOpportunities({s}){
 const [selection,setSelection]=React.useState(null),[feedback,setFeedback]=React.useState([]),[showRejected,setShowRejected]=React.useState(false),[notice,setNotice]=React.useState('');
 const selectedNow=React.useRef(selection);selectedNow.current=selection;const review=React.useRef(null),alive=React.useRef(true);
 React.useEffect(()=>{alive.current=true;return()=>{alive.current=false;review.current=null;};},[]);
 const live=React.useRef(s);live.current=s;
 const scope=s.ownerWorkspaceScope,owner=s.ownerSession?.userId,business=s.cloudWorkspace?.businessId;
 const input=growthOpportunityInput(s),rows=buildGrowthOpportunities(input);
 if(!scope||!owner||!business||!['owner','admin'].includes(s.cloudWorkspace?.role))return null;
 const same=()=>alive.current&&live.current.ownerWorkspaceScope===scope&&live.current.ownerSession?.userId===owner&&live.current.cloudWorkspace?.businessId===business&&['owner','admin'].includes(live.current.cloudWorkspace?.role);
 const current=row=>same()&&currentGrowthOpportunity(growthOpportunityInput(live.current),row);
 const response=row=>feedback.find(f=>f.scope===scope&&f.owner===owner&&f.business===business&&f.id===row.id&&f.stamp===row.stamp)?.value||savedGrowthPreference(input,row,s.socialDrafts);
 const visible=rows.filter(row=>showRejected||!['irrelevant','later'].includes(response(row))).sort((a,b)=>Number(response(b)==='useful')-Number(response(a)==='useful'));
 const chosen=selection?.scope===scope&&selection.owner===owner&&selection.business===business?selection.row:null;
 const checked=chosen&&current(chosen);
 const rate=(row,value)=>{if(!current(row))return false;review.current=null;setFeedback(old=>[...old.filter(f=>!(f.scope===scope&&f.id===row.id)),{scope,owner,business,id:row.id,stamp:row.stamp,value}]);setNotice('Preference kept for this running session and exact source only. It is not a customer outcome or durable save.');return true;};
 const canAct=row=>row?.next==='creator_service'?typeof s.socialContentActions?.prepareGrowth==='function':row?.next==='enquiry_review'&&typeof s.enquiryReplyActions?.prepare==='function';
 const act=row=>{
  if(!current(row)||!canAct(row)||row.next==='none')return false;let used=false;const ticket={};review.current=ticket;
  Alert.alert('Review the supported next step',row.title+'\n\n'+row.why+'\n\n'+(row.next==='creator_service'?'Prepare a factual service explanation in the existing Content Creator. No customer information is copied.':'Open the exact Filed enquiry in the original private reply workflow. Contact permission is still not established.')+' No message is sent and no business outcome is recorded.',[
   {text:'Keep reviewing',style:'cancel',onPress:()=>{used=true;}},
   {text:'Prepare privately',onPress:()=>{if(used||review.current!==ticket||selectedNow.current?.row!==row||!current(row))return false;used=true;review.current=null;const now=live.current;return row.next==='creator_service'?now.socialContentActions?.prepareGrowth?.(row):now.enquiryReplyActions?.prepare?.(row.customerId,row.sourceId,'acknowledge');}}
  ]);return true;
 };
 const websiteChange=()=>{
  const patch=checked&&prepareGrowthWebsiteChange(growthOpportunityInput(live.current),chosen);
  if(!patch||typeof live.current.applyWebsiteFieldChange!=='function')return false;let used=false;const ticket={};review.current=ticket;
  Alert.alert('Review exact private website service',patch.title+'\n\n'+patch.body+'\n\nUse these current approved words in the original Website Builder. Existing entries stay unchanged. Nothing is published; no ranking or enquiry benefit is established.',[
   {text:'Keep website unchanged',style:'cancel',onPress:()=>{used=true;}},
   {text:'Apply private website preparation',onPress:()=>{if(used||review.current!==ticket||selectedNow.current?.row!==chosen||!current(chosen)||JSON.stringify(prepareGrowthWebsiteChange(growthOpportunityInput(live.current),chosen))!==JSON.stringify(patch))return false;used=true;review.current=null;const applied=live.current.applyWebsiteFieldChange(patch)===true;setNotice(applied?'Private website preparation applied through the original editor. Its Undo restores the earlier draft; nothing was published.':'The original editor did not apply this change. Your current draft is kept; review its source and locks.');return applied;}}
  ]);return true;
 };
 return <Card eyebrow="Get More Customers · evidence first" title="Review opportunities already supported by your business" body="Existing enquiries and private website source gaps, not newly discovered external leads. Priority is an explainable review order, not a chance of winning work." footer="No external discovery, outreach, sending, spending or publication. Applicable private-draft preferences can change review order; they are owner judgements, not verified customer outcomes or account-save receipts.">
  <Text accessibilityLiveRegion="polite" style={styles.cardBody}>{notice}</Text>
  <Text style={styles.cardBody}>{rows.length+' supported source opportunities. Up to 100 original Inbox entries and current approved services are inspected; this is not a complete account-history scan.'}</Text>
  <Button label={showRejected?'Hide rejected suggestions':'Show rejected suggestions'} onPress={()=>{if(same())setShowRejected(v=>!v);}}/>
  {visible.slice(0,20).map(row=><View key={row.id} style={styles.recordRow}><Text style={styles.cardBody}>{priorityLabel[row.priority]+' · '+row.title+(response(row)?' · '+response(row):'')}</Text><Button label={'Inspect opportunity: '+row.title} onPress={()=>{if(current(row)){review.current=null;const next={scope,owner,business,row};selectedNow.current=next;setSelection(next);setNotice('');}}}/></View>)}
  {visible.length>20?<Text style={styles.cardBody}>20 shown. Review the original Inbox or Website Builder for further source records.</Text>:null}
  {!rows.length?<Text style={styles.cardBody}>No supported source opportunity is available. No prospect or customer need was invented. Review approved business facts and original enquiries first.</Text>:null}
  {chosen&&!checked?<Text style={styles.cardBody}>This source changed or became unavailable. Earlier source details are hidden and its actions are disabled. Inspect a current entry above; your independently written Creator draft is kept.</Text>:null}
  {chosen&&checked?<View>
   <Text accessibilityRole="header" style={styles.workspacePanelTitle}>{chosen.title}</Text>
   <Text style={styles.cardBody}>{chosen.why}</Text>
   <Text selectable style={styles.cardBody}>{'Known:\n'+chosen.known.join('\n')+'\nUnknown or inferred:\n'+chosen.uncertain.join('\n')+'\nContact: '+contactLabel[chosen.contact]+'\n'+chosen.observationMeaning+(chosen.observedAt?' · '+chosen.observedAt:'')}</Text>
   <Text selectable style={styles.cardBody}>{'Source-grounded outcomes:\n'+Object.entries(chosen.outcomes).map(([key,value])=>outcomeLabel[key]+': '+outcomeStatus[value]).join('\n')+'\nNo causal attribution, accepted contract or revenue is established.'}</Text>
   <Button label="This suggestion is useful" disabled={!checked} onPress={()=>rate(chosen,'useful')}/>
   <Button label="Not relevant — reject this suggestion" disabled={!checked} onPress={()=>rate(chosen,'irrelevant')}/>
   <Button label="Clear my feedback for this source" disabled={!checked} onPress={()=>rate(chosen,'neutral')}/>
   <Button label={chosen.next==='creator_service'?'Review factual Content Creator preparation':'Review private enquiry preparation'} disabled={!checked||!canAct(chosen)||chosen.next==='none'} onPress={()=>act(chosen)}/>
   {chosen.kind==='website_service_gap'&&prepareGrowthWebsiteChange(input,chosen)?<Button label="Review approved service for the private website" disabled={!checked||typeof s.applyWebsiteFieldChange!=='function'} onPress={websiteChange}/>:null}
   {chosen.kind==='website_service_gap'?<Button label="Inspect the original website draft" disabled={!checked||typeof s.openWebsiteBuilder!=='function'} onPress={()=>current(chosen)&&live.current.openWebsiteBuilder?.()}/>:null}
  </View>:null}
 </Card>;
}

export function GrowthContentOrigin({s}){
 const [observation,setObservation]=React.useState(null),[notice,setNotice]=React.useState('');
 const observedNow=React.useRef(observation);observedNow.current=observation;const confirmation=React.useRef(null);
 const alive=React.useRef(true);React.useEffect(()=>{alive.current=true;return()=>{alive.current=false;};},[]);
 const live=React.useRef(s);live.current=s;
 const origin=s.socialSourceContext?.pendingContentIdea?.growthOrigin||s.socialSourceContext?.growthOrigin,api=s.socialContentActions,scope=s.ownerWorkspaceScope;
 const owner=s.ownerSession?.userId,business=s.cloudWorkspace?.businessId;
 if(!origin||origin.ownerId!==owner||origin.businessId!==business||!['owner','admin'].includes(s.cloudWorkspace?.role))return null;
 const current=()=>alive.current&&live.current.ownerWorkspaceScope===scope&&live.current.ownerSession?.userId===owner&&live.current.cloudWorkspace?.businessId===business&&['owner','admin'].includes(live.current.cloudWorkspace?.role)&&live.current.socialSourceContext?.growthOrigin===origin&&!live.current.socialSourceContext?.pendingContentIdea;
 const currentInspection=observation&&current()?api?.inspectGrowth?.():null;
 const exact=observation?.origin===origin&&current()&&api?.fresh?.(observation.ticket)&&stableJson([currentInspection?.state,currentInspection?.current?.stamp,currentInspection?.sourceRevision])===stableJson([observation.result.state,observation.result.current?.stamp,observation.result.sourceRevision]);
 const inspect=()=>{
  if(!current()||typeof api?.inspectGrowth!=='function')return false;
  const ticket=api.capture(),result=api.inspectGrowth();
  if(!current()||!api.fresh(ticket))return false;
  const next={origin,ticket,result};observedNow.current=next;confirmation.current=null;setObservation(next);setNotice('Current workspace source inspected independently. No earlier save receipt, account read or customer outcome was reconstructed.');return true;
 };
 const prepare=()=>{
  if(!exact||observedNow.current!==observation||!observation.result.mayPrepare)return false;
  const checked=api.inspectGrowth();if(!checked.mayPrepare||checked.current.stamp!==observation.result.current.stamp)return false;
  let used=false;const decision={};confirmation.current=decision;Alert.alert('Review current Growth source',checked.current.title+'\n\n'+checked.current.why+'\n\nPrepare a separate current idea in Creator? Existing wording, photos and the saved draft stay until a new Use/Keep decision. Nothing is sent.',[
   {text:'Keep my draft',style:'cancel',onPress:()=>{used=true;}},
   {text:'Prepare current idea',onPress:()=>{if(used||confirmation.current!==decision||observedNow.current!==observation||!current()||!api.fresh(observation.ticket))return false;const now=api.inspectGrowth();if(!now.mayPrepare||now.current.stamp!==checked.current.stamp)return false;used=true;return api.prepareGrowth(now.current);}}
  ]);return true;
 };
 const status={current:'The exact source revision still supports this preparation.',changed:'The source changed. Review current facts before preparing another idea.',historical_reference_current_source:'The old reference has no retained revision. A supported source is available now; this does not prove the earlier facts were unchanged.',resolved:'The service is already described in the current private Services section. The earlier gap is no longer present.',restricted:'This source is restricted or disabled. No preparation is authorised.',ambiguous:'The original source is ambiguous. No record was chosen.',unavailable:'The exact current source is unavailable or not permitted.',unsupported:'This historical reference is unsupported.'};
 return <Card eyebrow="Get More Customers source" title="Review this saved opportunity source" body="Saved provenance is a historical reference only. Deliberately inspect current authorised workspace facts without replacing your wording or media. This is not an account restoration or outreach receipt.">
  <Text selectable style={styles.cardBody}>{'Saved website reference: '+origin.sourceId+' · original service: '+origin.serviceName}</Text>
  {notice?<Text accessibilityLiveRegion="polite" style={styles.cardBody}>{notice}</Text>:null}
  <Button label="Inspect current opportunity source" disabled={!current()||!api?.inspectGrowth} onPress={inspect}/>
  {exact?<Text style={styles.cardBody}>{status[observation.result.state]||status.unavailable}</Text>:observation?<Text style={styles.cardBody}>The draft or source changed after inspection. Your words are kept; inspect current evidence again.</Text>:null}
  {exact&&observation.result.mayPrepare?<>
   <Text selectable style={styles.cardBody}>{observation.result.current.known.join('\n')+'\n'+observation.result.current.uncertain.join('\n')}</Text>
   <Button label="Review a separate idea from current facts" onPress={prepare}/>
   <Text style={styles.cardBody}>Preference preparation belongs to this private Creator draft. Save it through the existing private-draft control; account durability and a scoped account CAS writer are not established.</Text>
   {observation.result.state==='current'?[['useful','Useful'],['irrelevant','Not relevant'],['later','Reconsider later'],['clear','Clear previous feedback']].map(([choice,label])=><Button key={choice} label={'Prepare saved preference: '+label} onPress={()=>{if(observedNow.current!==observation||!current()||!api.fresh(observation.ticket))return false;confirmation.current=null;const ok=api.prepareGrowthPreference?.(choice);if(ok){observedNow.current=null;setObservation(null);setNotice('Preference prepared on this draft; not confirmed saved. Use the original private-draft save and readback. Wording and media were kept.');}return !!ok;}}/>):null }
  </>:null}
  <Text style={styles.cardBody}>No outreach, customer response, conversion or payment is established by this inspection or preference.</Text>
 </Card>;
}
