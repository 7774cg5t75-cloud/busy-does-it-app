import React from 'react';
import {Text} from 'react-native';
import {Button,Card} from './ui';
import {styles} from '../theme/styles';
import {stableJson} from '../core/stableJson.mjs';
import {contentDraftChanges} from '../core/contentDraftChanges.mjs';
import {inspectNewsletterAccount} from '../core/newsletterAccountReadback.mjs';

export function NewsletterAccountReadback({s}){
 const [review,setReview]=React.useState(null),live=React.useRef(s),request=React.useRef(0);live.current=s;
 const records=s.socialDrafts||[],matches=records.filter(row=>row.id===s.selectedSocialDraftId),record=matches.length===1?matches[0]:null;
 const stamp=record?stableJson(record):'',scope=s.ownerWorkspaceScope,owner=s.ownerSession?.userId,business=s.cloudWorkspace?.businessId;
 const eligible=record?.contentEvidence?.channel==='newsletter'&&record.contentEvidence.businessId===business&&record.status==='Draft'&&!record.publishedAt&&owner&&['owner','admin'].includes(s.cloudWorkspace?.role);
 const check=async()=>{
  if(!eligible||!s.readPrivateContentAccount||s.socialContentActions?.isRenderCurrent?.()===false)return false;
  const localRevision=s.cloudRevision,token=++request.current,ticket=s.socialContentActions.capture(),evidence=s.socialSourceContext?.contentEvidence;
  const current=()=>{const now=live.current,rows=now.socialDrafts?.filter(row=>row.id===record.id);return request.current===token&&now.ownerWorkspaceScope===scope&&now.cloudRevision===localRevision&&now.ownerSession?.userId===owner&&now.cloudWorkspace?.businessId===business&&['owner','admin'].includes(now.cloudWorkspace?.role)&&now.selectedSocialDraftId===record.id&&rows?.length===1&&rows[0]===record&&stableJson(record)===stamp&&now.socialSourceContext?.contentEvidence===evidence&&now.socialContentActions.fresh(ticket);};
  if(!current())return false;
  setReview({status:'checking',record,stamp,ticket,scope,owner,business,localRevision});
  let result;try{result=await s.readPrivateContentAccount();}catch{result={ok:false};}
  if(!current())return false;
  const inspected=inspectNewsletterAccount({result,businessId:business,record});setReview({...inspected,record,stamp,ticket,scope,owner,business,localRevision});return inspected.status==='confirmed';
 };
 if(!eligible)return null;
 const exact=review?.record===record&&review.stamp===stamp&&review.scope===scope&&review.owner===owner&&review.business===business&&review.localRevision===s.cloudRevision&&s.socialContentActions?.fresh(review.ticket);
 const dirty=contentDraftChanges({text:s.socialDraftText,photos:s.socialCreatePhotos,brief:s.socialBrief,channels:s.socialDraftChannels},record).dirty||s.socialDraftText!==record.text;
 const messages={checking:'Checking the account copy. No save or send is being attempted.',confirmed:dirty?'The saved newsletter record was confirmed in the account. Your current edits are not confirmed saved.':'The saved newsletter record was confirmed in the account at the checked revision. This is not delivery or current-source approval.',absent:'This draft was not found in the checked account snapshot. Your device copy and current edits are kept.',different:'The account record differs. Your current wording and media are kept; nothing was restored or overwritten.',unknown:'Could not confirm the account copy. Keep your work; no save was retried.'};
 return <Card title="Newsletter account copy" body="Read the original business snapshot to check this saved newsletter. Device evidence and source review are separate.">
  <Button label="Check newsletter account copy" disabled={exact&&review.status==='checking'} onPress={check}/>
  <Text accessibilityLiveRegion="polite" style={styles.cardBody}>{exact?messages[review.status]:'No current account confirmation for this draft and wording.'}</Text>
 </Card>;
}
