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
 return <Card eyebrow="Talk & Explore" title="Nothing will be changed" body="Ask Busy about your website or app. Explore ideas without changing anything.">
  <Text accessibilityRole="text" accessibilityLiveRegion="polite" style={styles.sectionLabel}>Talk & Explore — nothing will be changed</Text>
  <Text style={styles.cardBody}>{(context.project?.display_name||context.project?.businessName||context.project?.draft_config?.publicProfile?.businessName||'Your '+context.kind)}</Text>
  {!valid?<Text accessibilityRole="alert" style={styles.cardBody}>Your project or account changed. Exit and reopen Talk & Explore before making changes.</Text>:null}
  {(session.conversation?.turns||[]).map((turn,index)=><Text key={index} style={styles.cardBody}>{(turn.role==='owner'?'You: ':'Busy: ')+turn.text}</Text>)}
  <Field label="Talk & Explore question or idea" value={text} maxLength={400} multiline onChangeText={value=>{if(current()){setText(value);setReview(false);}}} placeholder={context.kind==='app'?'Would deposits or loyalty help? Or: move services above contact':'Would booking requests help? Or: move services above contact'}/>
  <Button label="Discuss without changing anything" disabled={!valid||!text.trim()} onPress={()=>{if(!current())return;const result=runBuilderExplore(session,context,{type:'discuss',text});setSession(result.session);setNotice(result.ok?'Nothing changed.':result.reason);setReview(false);}}/>
  <Text style={styles.cardBody}>Voice is not available here yet. You can type to discuss supported features and design ideas at no extra cost.</Text>
  {valid&&!review?(session.alternatives||[]).map(idea=><Button key={idea.instruction} label={idea.label} onPress={()=>{if(current()){setText(idea.instruction);setReview(false);}}}/>):null}
  {session.idea&&valid?<Button label="Make changes" onPress={()=>{if(current())setReview(true);}}/>:null}
  {review&&valid?<View>
   <Text style={styles.sectionLabel}>Review your idea</Text>
   {session.idea.summary.map((line,index)=><Text key={index} style={styles.cardBody}>{line}</Text>)}
   <Text style={styles.cardBody}>Preparing this idea costs £0. Next, you can review it in the editor. Nothing is applied until you approve it there. Publishing stays separate.</Text>
   <Button label="Review changes in editor" onPress={()=>{if(!current())return;const handoff=prepareBuilderExploreHandoff(session,context,{ownerConfirmed:true});if(handoff.ok){if(onHandoff(handoff)===true)alive.current=false;}else setNotice(handoff.reason);}}/>
   <Button label="Keep exploring" onPress={()=>{if(current())setReview(false);}}/>
  </View>:null}
  {notice?<Text accessibilityLiveRegion="polite" style={styles.cardBody}>{notice}</Text>:null}
  <Button label="Exit Talk & Explore — leave project unchanged" onPress={()=>{alive.current=false;onExit();}}/>
 </Card>;
}
