import React from 'react';
import {Text} from 'react-native';
import {styles} from '../theme/styles';
export function ContentDraftStatus({s}){
 const record=(s.socialDrafts||[]).find(item=>item.id===s.selectedSocialDraftId);
 if(!record||record.status!=='Draft')return null;
 const receipt=s.privateContentSave;
 const exact=receipt?.record===record;
 const newer=s.socialDraftText.trim()!==record.text;
 const message=newer?'You have newer unsaved wording. The stored draft does not include these edits.':
  exact&&receipt.status==='confirmed'?'This wording was saved and read back from your private device copy. It is not published.':
  exact&&receipt.status==='saving'?'Saving this private device copy… Keep your wording until confirmation.':
  exact&&receipt.status==='unknown'?'The device save could not be confirmed. Keep your wording; no cloud or publishing success is assumed.':
  'This draft is in memory. Device recovery has not yet been confirmed for this version.';
 return <Text accessibilityLiveRegion="polite" style={styles.cardBody}>{message}</Text>;
}
