import React from 'react';
import {Text} from 'react-native';
import {Button} from './ui';
import {styles} from '../theme/styles';
export function ContentDraftStatus({s}){
 const record=(s.socialDrafts||[]).find(item=>item.id===s.selectedSocialDraftId);
 if(!record||record.status!=='Draft')return null;
 const receipt=s.privateContentSave;
 const exact=receipt?.record===record;
 const newer=s.socialDraftText.trim()!==record.text;
 const media=items=>JSON.stringify((items||[]).map(item=>[item.id||'',item.uri||'',item.storagePath||'',item.fileName||'',item.width||0,item.height||0,item.contentType||item.mimeType||'image/jpeg']));
 const otherChanges=media(s.socialCreatePhotos)!==media(record.photos)||(s.socialBrief||'').trim()!==(record.brief||'');
 const message=newer?'You have newer unsaved wording. The stored draft does not include these edits.':
  otherChanges?'You have unsaved photo or brief changes. Save privately to include them.':
  exact&&receipt.status==='failed'?'The device save did not start. Your draft is still in memory; keep your changes and save privately again.':
  exact&&receipt.status==='confirmed'?'This wording was saved and read back from your private device copy. It is not published.':
  exact&&receipt.status==='saving'?'Saving this private device copy… Keep your wording until confirmation.':
  exact&&receipt.status==='unknown'?'The device save could not be confirmed. Keep your wording; no cloud or publishing success is assumed.':
  'This draft is in memory. Device recovery has not yet been confirmed for this version.';
 return <><Text accessibilityLiveRegion="polite" style={styles.cardBody}>{message}</Text>
  {exact&&receipt.status==='unknown'&&!newer&&!otherChanges&&s.checkPrivateContentCopy?<Button label="Check private device copy" onPress={s.checkPrivateContentCopy}/>:null}
 </>;
}
