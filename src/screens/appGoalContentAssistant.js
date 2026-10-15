import React from 'react';
import {Text,TextInput,View} from 'react-native';
import {Button} from '../components/ui';
import {styles} from '../theme/styles';
import {appGoalContentQuestions,prepareAppGoalContent} from '../core/appGoalContentPreparation.mjs';
function AppGoalContentAssistant({businessId,ownerId,app,goal,onPreview,onNotice,onSavedFacts,busy}){
 const [answers,setAnswers]=React.useState({}),live=React.useRef(null),alive=React.useRef(true);
 const context={businessId,ownerId,app,goal};live.current=context;
 React.useEffect(()=>{alive.current=true;return()=>{alive.current=false;};},[]);
 const questions=appGoalContentQuestions(app.draft_config,goal);
 if(!questions.length)return null;
 return <View>
  <Text style={styles.sectionLabel}>Prepare the missing details first</Text>
  <Text style={styles.cardBody}>Use facts you already saved, or answer only the missing questions. Busy will prepare them in Studio for your approval; existing wording stays unchanged.</Text>
  <Button label="Compare my saved business facts" onPress={onSavedFacts} disabled={busy}/>
  {questions.map(q=><View key={q.id}>
   <Text style={styles.cardBody}>{q.label+(q.locked?' (protected by your editing locks)':'')}</Text>
   {!q.locked?<TextInput accessibilityLabel={q.label} multiline maxLength={q.max} editable={!busy}
    value={answers[q.id]||''} onChangeText={value=>setAnswers(old=>({...old,[q.id]:value}))}/>:null}
  </View>)}
  <Button label="Preview my answers in Studio" disabled={busy||!Object.values(answers).some(x=>x.trim())}
   onPress={()=>{
    const now=live.current;
    if(!alive.current||now.ownerId!==ownerId||now.businessId!==businessId||now.goal!==goal||now.app!==app){onNotice('The app changed. Review its current missing details.');return;}
    const proposal=prepareAppGoalContent({...context,answers});
    if(proposal.ok&&onPreview(proposal))onNotice('Your answers are prepared in Studio. Compare, approve or discard; nothing is saved yet.');
    else onNotice(proposal.reason||'Review the current draft before preparing content.');
   }}/>
 </View>;
}
export {AppGoalContentAssistant};
