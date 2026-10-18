import React from 'react';
import {View,Text} from 'react-native';
import {Button,Field} from '../components/ui';
import {styles} from '../theme/styles';
import {WebsiteSelectedVoice} from './websiteSelectedVoice';
import {proposeSelectedAppInstruction} from '../core/appContextInstruction.mjs';
// Reuses the existing recorder/transcription allowance and original Studio.
export function AppSelectedInstruction({config,selection,onPrepare,disabled=false,voiceScope,onTranscribe}){
 const [text,setText]=React.useState(''),[voice,setVoice]=React.useState(false),[notice,setNotice]=React.useState('');
 const alive=React.useRef(true);React.useEffect(()=>{alive.current=true;return()=>{alive.current=false;};},[]);
 const live=React.useRef(null);live.current={config,selection,disabled,text};
 const current=()=>alive.current&&live.current.config===config&&live.current.selection===selection&&!live.current.disabled;
 const proposal=text.trim()?proposeSelectedAppInstruction(config,{selection,text}):null;
 const prepare=()=>{
  if(!current()||live.current.text!==text)return;
  if(!proposal?.ok){setNotice(proposal?.reason||'Describe a supported change first.');return;}
  setNotice(proposal.explanation||'Prepared in Studio. Nothing is saved until your normal approval.');onPrepare(proposal);
 };
 return <View>
  <Field label="Ask Busy about this selected app part" value={text} maxLength={180} multiline onChangeText={value=>{if(current()){setText(value);setNotice('');}}} placeholder={selection.part==='faq'?'Set this answer to "Owner wording", or move this answer later':selection.part==='service'?'Set this service description to "Owner wording", or move this service later':selection.part==='branding'?'Use Natural linen':selection.part==='image'?'Move this photo later, or set this photo caption to "Owner wording"':selection.part==='wording'?'Set this text to "Owner wording"':'Describe one supported appearance change'}/>
  <Button label="Preview selected instruction" disabled={disabled||!proposal?.ok} onPress={prepare}/>
  {proposal&&!proposal.ok?<Text style={styles.cardBody}>{proposal.reason}</Text>:null}
  {notice?<Text accessibilityLiveRegion="polite" style={styles.cardBody}>{notice}</Text>:null}
  {voiceScope&&onTranscribe?<Button label={voice?'Close selected-part microphone':'Speak about this selected app part'} disabled={disabled} onPress={()=>{if(current())setVoice(!voice);}}/>:null}
  {voice&&voiceScope&&!disabled?<WebsiteSelectedVoice editorKind="app" contextLabel="selected app part (review wording before preview)" selection={voiceScope}
   onTranscribe={(uri,scope)=>current()?onTranscribe(uri,scope):Promise.resolve({ok:false,error:'The selected app part changed. Nothing was sent.'})}
   onTranscript={value=>{if(current()&&live.current.text===text){setText(value);setNotice('Check the transcript, then preview. Nothing was saved.');}}}/>:null}
  <Text style={styles.cardBody}>Typed editing is local. Voice uses the existing app transcription allowance only after Record, Stop, review and Send. Selected context is rechecked; unsupported changes are never guessed.</Text>
 </View>;
}
