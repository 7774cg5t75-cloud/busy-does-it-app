import React from 'react';
import {Text} from 'react-native';
import {Card,Button} from './ui';
import {styles} from '../theme/styles';
export function ContentSourceReview({s}){
 const evidence=s.socialSourceContext?.contentEvidence;
 if(!evidence)return null;
 const review=s.socialSourceContext.contentSourceReview,exact=review?.evidence===evidence&&review.checkedText===s.socialDraftText;
 const owner=evidence.purpose==='owner-announcement',item=['product','event'].includes(evidence.purpose);
 return <Card title={owner?'Owner-supplied announcement':item?'Approved '+evidence.purpose+' starting point':'Approved business starting point'}
  body={owner?'The details came from your own draft, not independent verification. Review any dates, terms or prices before publication.':'This draft retains the source you chose. Recheck current facts without replacing your edited words.'}>
  {!owner?<Button label="Check current source facts" onPress={s.socialContentActions?.reviewSource}/>:null}
  {!s.socialSourceContext.pendingContentIdea&&s.socialContentActions?.reprepareSource?<Button label="Prepare a fresh idea from this source" onPress={()=>s.socialContentActions.reprepareSource(evidence)}/>:null}
  {exact?<Text accessibilityLiveRegion="polite" style={styles.cardBody}>{review.status==='current'?'The starting facts still match the current source. Your edited wording is not independently verified; nothing was saved or published by this check.':review.reason||'The source changed. Your current wording has been kept; review it against the current information.'}</Text>:!owner?<Text style={styles.cardBody}>Current source has not been checked for this wording in this review.</Text>:null}
 </Card>;
}
