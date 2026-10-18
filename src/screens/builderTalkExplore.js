import React from 'react';
import {Text,View} from 'react-native';
import {Button,Field,Card} from '../components/ui';
import {styles} from '../theme/styles';
import {beginBuilderExplore,currentBuilderExplore,runBuilderExplore,prepareBuilderExploreHandoff} from '../core/builderExplore.mjs';
// Same original conversation/planning, no remote action handlers accepted.
export function BuilderTalkExplore({context,onExit,onHandoff}){
 const [session,setSession]=React.useState(()=>beginBuilderExplore(context)),[text,setText]=React.useState(''),[review,setReview]=React.useState(false),[notice,setNotice]=React.useState('');
 const alive=React.useRef(true);React.useEffect(()=>()=>{alive.current=false;},[]);
 const live=React.useRef(null);live.current={context,session,text,review};
 const current=()=>alive.current&&live.current.context===context&&live.current.session===session&&live.current.text===text&&live.current.review===review&&currentBuilderExplore(session,context);
 const valid=currentBuilderExplore(session,context);
 return <Card eyebrow="Talk & Explore" title="Nothing will be changed" body="Local discussion using the current private project and existing capability planner. No AI/provider call, saving, publishing, customer action or charge. This first version is typed and capability-focused, not general AI chat.">
  <Text accessibilityRole="text" accessibilityLiveRegion="polite" style={styles.sectionLabel}>Talk & Explore — nothing will be changed</Text>
  <Text style={styles.cardBody}>{context.kind+' • '+(context.project?.display_name||context.project?.id||'project')+' • revision '+(context.project?.draft_revision||context.project?.generation||'?')}</Text>
  {!valid?<Text accessibilityRole="alert" style={styles.cardBody}>The project or account changed. Old discussion cannot prepare edits. Exit and reopen with current source.</Text>:null}
  {(session.conversation?.turns||[]).map((turn,index)=><Text key={index} style={styles.cardBody}>{(turn.role==='owner'?'You: ':'Busy: ')+turn.text}</Text>)}
  <Field label="Talk & Explore question or idea" value={text} maxLength={400} multiline onChangeText={value=>{if(current()){setText(value);setReview(false);}}} placeholder={context.kind==='app'?'Would deposits or loyalty help? Or: move services above contact':'Would booking requests help? Or: move services above contact'}/>
  <Button label="Discuss without changing anything" disabled={!valid||!text.trim()} onPress={()=>{if(!current())return;const result=runBuilderExplore(session,context,{type:'discuss',text});setSession(result.session);setNotice(result.ok?'Nothing changed.':result.reason);setReview(false);}}/>
  <Text style={styles.cardBody}>Microphone upload is unavailable here: the existing transcription service can use credits. Typing stays local; no chargeable voice or generation is started.</Text>
  {session.idea&&valid?<Button label="Make changes — review handoff" onPress={()=>{if(current())setReview(true);}}/>:null}
  {review&&valid?<View>
   <Text style={styles.sectionLabel}>Review this handoff</Text>
   {session.idea.summary.map((line,index)=><Text key={index} style={styles.cardBody}>{line}</Text>)}
   <Text style={styles.cardBody}>Local preparation: £0. Leave Explore to prepare the original private editor review. This does not apply, save or publish the project. Normal editor approval is still required.</Text>
   <Button label="Leave Explore and prepare private review" onPress={()=>{if(!current())return;const handoff=prepareBuilderExploreHandoff(session,context,{ownerConfirmed:true});if(handoff.ok){if(onHandoff(handoff)===true)alive.current=false;}else setNotice(handoff.reason);}}/>
   <Button label="Keep exploring — cancel handoff" onPress={()=>{if(current())setReview(false);}}/>
  </View>:null}
  {notice?<Text accessibilityLiveRegion="polite" style={styles.cardBody}>{notice}</Text>:null}
  <Button label="Exit Talk & Explore — leave project unchanged" onPress={()=>{alive.current=false;onExit();}}/>
 </Card>;
}
