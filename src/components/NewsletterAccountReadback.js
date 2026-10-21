import React from 'react';
import {Text} from 'react-native';
import {Button,Card} from './ui';
import {styles} from '../theme/styles';
import {stableJson} from '../core/stableJson.mjs';
import {contentDraftChanges} from '../core/contentDraftChanges.mjs';
import {inspectNewsletterAccount} from '../core/newsletterAccountReadback.mjs';

export function NewsletterAccountReadback({s}){
 const [review,setReview]=React.useState(null),live=React.useRef(s),request=React.useRef(0);live.current=s;
 React.useEffect(()=>()=>{request.current++;},[]);
 const records=s.socialDrafts||[],matches=records.filter(row=>row.id===s.selectedSocialDraftId),record=matches.length===1?matches[0]:null;
 const stamp=record?stableJson(record):'',scope=s.ownerWorkspaceScope,owner=s.ownerSession?.userId,business=s.cloudWorkspace?.businessId;
 const eligible=record?.contentEvidence?.channel==='newsletter'&&record.contentEvidence.businessId===business&&record.status==='Draft'&&!record.publishedAt&&owner&&['owner','admin'].includes(s.cloudWorkspace?.role);
 const check=async(reopen=false)=>{
  if(!eligible||!s.readPrivateContentAccount||s.socialContentActions?.isRenderCurrent?.()===false)return false;
  const localRevision=s.cloudRevision,token=++request.current,ticket=s.socialContentActions.capture(),evidence=s.socialSourceContext?.contentEvidence;
  const current=(expectedEpoch=ticket.epoch)=>{const now=live.current,rows=now.socialDrafts?.filter(row=>row.id===record.id);return request.current===token&&now.ownerWorkspaceScope===scope&&now.cloudRevision===localRevision&&now.ownerSession?.userId===owner&&now.cloudWorkspace?.businessId===business&&['owner','admin'].includes(now.cloudWorkspace?.role)&&now.selectedSocialDraftId===record.id&&rows?.length===1&&rows[0]===record&&stableJson(record)===stamp&&now.socialSourceContext?.contentEvidence===evidence&&now.socialContentActions.fresh({...ticket,epoch:expectedEpoch});};
  if(!current())return false;
  setReview({status:'checking',record,stamp,ticket,scope,owner,business,localRevision});
  let result;try{result=await s.readPrivateContentAccount();}catch{result={ok:false};}
  if(!current())return false;
  const inspected=inspectNewsletterAccount({result,businessId:business,record,minimumRevision:localRevision,ownerId:owner});setReview({...inspected,record,stamp,ticket,scope,owner,business,localRevision});
  if(!reopen||inspected.status!=='confirmed')return inspected.status==='confirmed';
  // Reuse the original source checker and original dirty-editor Keep/Open path.
  // A compatible account revision is not itself approval of the content facts.
  if(live.current.socialSourceContext?.pendingContentIdea||!s.openSocialDraft||!s.socialContentActions.reviewSavedSource)return false;
  const sourceCurrent=await s.socialContentActions.reviewSavedSource(record);
  if(!current(ticket.epoch+1))return false;
  const reviewedTicket={...ticket,epoch:ticket.epoch+1};
  setReview({...inspected,status:sourceCurrent?'confirmed':'sourceChanged',record,stamp,ticket:reviewedTicket,scope,owner,business,localRevision});
  return sourceCurrent?s.openSocialDraft(record.id)!==false:false;
 };
 if(!eligible)return null;
 const exact=review?.record===record&&review.stamp===stamp&&review.scope===scope&&review.owner===owner&&review.business===business&&review.localRevision===s.cloudRevision&&s.socialContentActions?.fresh(review.ticket);
 const dirty=contentDraftChanges({text:s.socialDraftText,photos:s.socialCreatePhotos,brief:s.socialBrief,channels:s.socialDraftChannels,...Object.hasOwn(s,'socialSourceContext')?{sourceContext:s.socialSourceContext}:{}},record).dirty||s.socialDraftText!==record.text;
 const messages={checking:'Checking the account copy. No save or send is being attempted.',confirmed:dirty?'The saved newsletter record was confirmed in the account. Your current edits are not confirmed saved.':'The saved newsletter record was confirmed in the account at the checked revision. This is not delivery or current-source approval.',absent:'This draft was not found in the checked account snapshot. Your device copy and current edits are kept.',different:'The account record differs. Your current wording and media are kept; nothing was restored or overwritten.',stale:'The account response is older than this workspace. Keep your current work and check again; nothing was restored or retried.',unknown:'Could not confirm the account copy. Keep your work; no save was retried.',sourceChanged:'The saved account record matches, but its starting source needs fresh review. Your current wording was kept.'};
 return <Card title="Newsletter account copy" body="Read the original business snapshot to check this saved newsletter. Device evidence and source review are separate.">
  <Button label="Check newsletter account copy" disabled={exact&&review.status==='checking'} onPress={()=>check(false)}/>
  {s.openSocialDraft&&!s.socialSourceContext?.pendingContentIdea?<Button label="Review and reopen saved newsletter" disabled={exact&&review.status==='checking'} onPress={()=>check(true)}/>:null}
  {exact&&review.status==='different'&&review.preview?<Card title="Account newsletter — read only" body={'Subject: '+review.preview.subject+'\n\n'+review.preview.body} footer="Your open draft stays unchanged. This version has not been opened, saved or sent.">
   <Text style={styles.cardBody}>{'Differences: '+(review.preview.differences.join('; ')||'saved record details')+'.'}</Text>
   <Text style={styles.cardBody}>{'Account writing treatment: '+review.preview.treatment+'.'}</Text>
   {review.preview.brief?<Text style={styles.cardBody}>{'Account audience intention: '+review.preview.brief+' — this does not select recipients or establish marketing permission.'}</Text>:null}
  </Card>:null}
  <Text accessibilityLiveRegion="polite" style={styles.cardBody}>{exact?messages[review.status]:'No current account confirmation for this draft and wording.'}</Text>
 </Card>;
}
