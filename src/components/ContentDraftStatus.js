import {contentDraftChanges} from '../core/contentDraftChanges.mjs';
import React from 'react';
import {Text} from 'react-native';
import {Button} from './ui';
import {styles} from '../theme/styles';
export function ContentDraftStatus({s}){
 const record=(s.socialDrafts||[]).find(item=>item.id===s.selectedSocialDraftId);
 if(!record)return s.socialDraftText?.trim()||s.socialCreatePhotos?.length?<Text accessibilityLiveRegion="polite" style={styles.cardBody}>Changes not saved yet. Save privately to keep a draft; nothing is published.</Text>:null;
 if(record.status!=='Draft')return null;
 const receipt=s.privateContentSave;
 const exact=receipt?.record===record;
 const changes=contentDraftChanges({text:s.socialDraftText,photos:s.socialCreatePhotos,brief:s.socialBrief,channels:s.socialDraftChannels,...Object.hasOwn(s,'socialSourceContext')?{sourceContext:s.socialSourceContext}:{}},record);
 const newer=changes.wording,otherChanges=changes.media||changes.brief||changes.channels||changes.source;
 const message=newer?'You have newer unsaved wording. The stored draft does not include these edits.':
  changes.source?'Your starting facts, format or writing treatment changed. Save privately to keep these changes; your account copy has not been confirmed.':
  changes.channels?'Your destination choices differ from this saved draft. Save privately to keep them; publishing still requires connected, approved channels.':
  otherChanges?'You have unsaved photo or brief changes. Save privately to include them.':
  exact&&receipt.status==='failed'?'The device save did not start. Your draft is still in memory; keep your changes and save privately again.':
  exact&&receipt.status==='confirmed'?'This wording was saved and read back from your private device copy. It is not published.':
  exact&&receipt.status==='saving'?'Saving this private device copy… Keep your wording until confirmation.':
  exact&&receipt.status==='unknown'?'The device save could not be confirmed. Keep your wording; no cloud or publishing success is assumed.':
  'This draft is in memory. Device recovery has not yet been confirmed for this version.';
 return <><Text accessibilityLiveRegion="polite" style={styles.cardBody}>{message}</Text>
  {newer&&record.contentEvidence?.channel==='newsletter'&&s.socialContentActions?.resumeNewsletterWording?<Button label="Review saved newsletter wording only" onPress={s.socialContentActions.resumeNewsletterWording}/>:null}
  {exact&&receipt.status==='unknown'&&!newer&&!otherChanges&&s.checkPrivateContentCopy?<Button label="Check private device copy" onPress={s.checkPrivateContentCopy}/>:null}
 </>;
}
