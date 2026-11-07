import React from 'react';
import {Text} from 'react-native';
import {Card,Button} from './ui';
import {styles} from '../theme/styles';
export function ContentSourceReview({s}){
 const active=React.useRef(true);React.useEffect(()=>{active.current=true;return()=>{active.current=false;};},[]);
 const evidence=s.socialSourceContext?.contentEvidence;
 if(!evidence)return null;
 const review=s.socialSourceContext.contentSourceReview,exact=review?.evidence===evidence&&review.checkedText===s.socialDraftText;
 const owner=evidence.purpose==='owner-announcement',item=['product','event'].includes(evidence.purpose);
 return <Card title={owner?'Owner-supplied announcement':item?'Approved '+evidence.purpose+' starting point':'Approved business starting point'}
  body={owner?'The details came from your own draft, not independent verification. Review any dates, terms or prices before publication.':'This draft retains the source you chose. Recheck current facts without replacing your edited words.'}>
  {!owner?<Button label="Check current source facts" onPress={s.socialContentActions?.reviewSource}/>:null}
  {!s.socialSourceContext.pendingContentIdea&&s.socialContentActions?.reprepareSource?<Button label="Prepare a fresh idea from this source" onPress={()=>s.socialContentActions.reprepareSource(evidence)}/>:null}
  {evidence.channel==='social'&&s.selectedSocialDraftId&&!s.socialSourceContext.pendingContentIdea&&s.socialContentActions?.reviewSocialVariation?<Button label="Review separate draft with updated facts" onPress={()=>s.socialContentActions.reviewSocialVariation({isCurrent:()=>active.current})}/>:null}
  {evidence.channel==='newsletter'&&s.selectedSocialDraftId&&!s.socialSourceContext.pendingContentIdea&&s.socialContentActions?.refreshNewsletterSource?<Button label="Review updated newsletter starting facts" onPress={()=>s.socialContentActions.refreshNewsletterSource({isCurrent:()=>active.current})}/>:null}
  {evidence.channel==='newsletter'&&s.selectedSocialDraftId&&s.socialContentActions?.reuseNewsletter?<Button label="Start a separate newsletter draft" onPress={()=>s.socialContentActions.reuseNewsletter({isCurrent:()=>active.current})}/>:null}
  {evidence.manualSourceReview?<Text style={styles.cardBody}>You reviewed updated starting facts. Check your own wording against them; your latest edits have not been confirmed saved.</Text>:null}
  {exact?<Text accessibilityLiveRegion="polite" style={styles.cardBody}>{review.status==='current'?'The starting facts still match the current source. Your edited wording is not independently verified; nothing was saved or published by this check.':review.reason||'The source changed. Your current wording has been kept; review it against the current information.'}</Text>:!owner?<Text style={styles.cardBody}>Current source has not been checked for this wording in this review.</Text>:null}
 </Card>;
}
