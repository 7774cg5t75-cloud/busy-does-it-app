import React from 'react';
import {Text} from 'react-native';
import {Card,Button} from './ui';
import {styles} from '../theme/styles';
export function ContentAccountReadback({s}){
 const record=s.socialDrafts?.find(row=>row.id===s.selectedSocialDraftId);
 if(!record||!s.socialContentActions?.checkAccountDraft)return null;
 const review=s.socialSourceContext?.contentCloudReview;
 const exact=review?.record===record&&review.checkedText===s.socialDraftText;
 return <Card title="Check the saved account record" body="An account check only reads status and saved wording. It does not retry a save, schedule or publication, and it does not replace your current words or photos.">
  <Button label="Check account wording and status" disabled={!!s.socialPublishingLoading} onPress={s.socialContentActions.checkAccountDraft}/>
  {exact?<Text accessibilityLiveRegion="polite" style={styles.cardBody}>{review.message}</Text>:<Text style={styles.cardBody}>No current account readback is confirmed for this wording. Device-copy evidence is shown separately.</Text>}
 </Card>;
}
