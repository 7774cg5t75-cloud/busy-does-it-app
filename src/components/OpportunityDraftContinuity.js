import {reviewOwnerOpportunity} from '../domain/ownerGrowthOpportunity.mjs';
import React from 'react';
import {Text,Alert} from 'react-native';
import {Card,Button} from './ui';
import {styles} from '../theme/styles';
import {stableJson} from '../core/stableJson.mjs';
import {opportunityDraftReference,compareOpportunityDraft} from '../core/opportunityDraftReference.mjs';
export function OpportunityDraftContinuity({s}){
 const [observation,setObservation]=React.useState(null),[notice,setNotice]=React.useState('');const live=React.useRef(s),flight=React.useRef(null),decision=React.useRef(null),alive=React.useRef(true);live.current=s;
 React.useEffect(()=>{alive.current=true;return()=>{alive.current=false;flight.current=null;};},[]);
 const owner=s.ownerSession?.userId,business=s.cloudWorkspace?.businessId,scope=s.ownerWorkspaceScope,ref=opportunityDraftReference(s.socialSourceContext?.contentEvidence?.opportunityReference,{ownerId:owner,businessId:business});
 const stamp=stableJson([scope,ref,s.selectedSocialDraftId,s.socialDraftText,s.socialCreatePhotos]);
 const current=()=>alive.current&&live.current.ownerWorkspaceScope===scope&&live.current.ownerSession?.userId===owner&&live.current.cloudWorkspace?.businessId===business&&live.current.cloudWorkspace?.role==='owner'&&stableJson([scope,opportunityDraftReference(live.current.socialSourceContext?.contentEvidence?.opportunityReference,{ownerId:owner,businessId:business}),live.current.selectedSocialDraftId,live.current.socialDraftText,live.current.socialCreatePhotos])===stamp;
 if(!ref||!owner||!business||s.cloudWorkspace?.role!=='owner')return null;
 const visible=observation?.stamp===stamp?observation:null;
 const inspect=async()=>{if(!current()||!s.growthOpportunityAccount?.enabled)return false;const ticket={};flight.current=ticket;
  try{const v=await live.current.growthOpportunityAccount.read(ref.opportunityId);if(!current()||flight.current!==ticket)return false;setObservation({stamp,state:compareOpportunityDraft(ref,v),value:v});setNotice('Independent account source inspection. Your wording, media and selected draft were not replaced.');return true;}
  catch{if(current()&&flight.current===ticket){setObservation({stamp,state:'unavailable'});setNotice('The source is unavailable. No historical account details are redisclosed and no renewed preparation is authorised.');}return false;}
 };
 const revise=async()=>{
  const creator=live.current.socialContentActions,account=live.current.growthOpportunityAccount;
  if(!current()||!visible?.value||!['same_version','same_source_later_version','changed'].includes(visible.state)||!account?.enabled||!creator?.capture||!creator?.prepare||live.current.socialSourceContext?.pendingContentIdea)return false;
  const capture=creator.capture(),token={};decision.current=token;
  const checked=async()=>{const v=await account.read(ref.opportunityId);if(!current()||decision.current!==token||!creator.fresh(capture)||v.revision!==visible.value.revision||v.sourceHash!==visible.value.sourceHash)return null;const reference=account.reference(v),now=live.current;const review=reviewOwnerOpportunity({ownerId:owner,businessId:business,role:now.cloudWorkspace?.role,scope,approvedProfile:now.businessCreationIntelligence?.sharedProfile},v.record);return reference&&review.ok&&review.mayPrepare?{v,reference,review}:null;};
  try{const prepared=await checked();if(!prepared){if(current())setNotice('The source or current business facts changed. Your original draft is kept; inspect again.');return false;}let used=false;
   Alert.alert('Review a separate current draft',prepared.review.ownerFacts+'\n\nCurrent source revision '+prepared.v.revision+'. This prepares another private draft through Creator. Your existing wording, media and saved original remain until its separate Use/Keep decision. Nothing is saved or sent.',[
    {text:'Keep existing draft',style:'cancel',onPress:()=>{used=true;}},{text:'Prepare separate current draft',onPress:async()=>{if(used||decision.current!==token||!current()||!creator.fresh(capture))return false;used=true;const fresh=await checked();if(!fresh)return false;const evidence=live.current.socialSourceContext.contentEvidence;return creator.prepare('','','approved-profile','owner-announcement',fresh.review.ownerFacts,evidence?.treatment||'standard',false,evidence?.channel||'social',null,null,fresh.reference);}}
   ]);return true;
  }catch{if(current())setNotice('Current source review is unavailable. Existing words and saved originals are kept.');return false;}
 };
 const explanation={same_version:'The exact saved opportunity version was observed. Renewed preparation still requires deliberate source review in Growth.',same_source_later_version:'A later version retains the same report facts. This saved reference remains historical.',changed:'The opportunity report changed. Keep the existing wording; review a separate current preparation in Growth.',restricted:'Private use is restricted or unknown. No renewed preparation is authorised.',retired:'This opportunity is retired. The old draft remains historical wording.',unavailable:'The opportunity could not be inspected under current authority.'};
 return <Card eyebrow="Saved opportunity reference" title="Review this draft's Growth source" body="This typed reference identifies an owner-reported opportunity version. It is not current eligibility, contact consent, an activity receipt or a conversion.">
  <Text selectable style={styles.cardBody}>{ref.opportunityId+' · saved revision '+ref.revision}</Text>
  <Button label="Inspect this saved opportunity source" disabled={!s.growthOpportunityAccount?.enabled} onPress={inspect}/>
  {notice?<Text accessibilityLiveRegion="polite" style={styles.cardBody}>{notice}</Text>:null}
  {visible?<Text style={styles.cardBody}>{explanation[visible.state]}</Text>:null}
  {visible&&['same_version','same_source_later_version','changed'].includes(visible.state)?<Text selectable style={styles.cardBody}>{'Original owner-reported source account: '+ref.sourceAccount+'\nCurrent owner-reported source account: '+visible.value.record.source}</Text>:null}
  {visible&&['same_version','same_source_later_version','changed'].includes(visible.state)?<Button label="Review a separate draft from current opportunity facts" disabled={!s.socialContentActions?.prepare} onPress={revise}/>:null}
  <Button label="Review saved opportunities in Get More Customers" onPress={()=>current()&&live.current.go?.('growthCommandCentre')}/>
 </Card>;
}
