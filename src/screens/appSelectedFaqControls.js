import React from 'react';
import {Text,View} from 'react-native';
import {Button,Field} from '../components/ui';
import {styles} from '../theme/styles';
import {selectedAppFaq,selectedAppFaqOperation} from '../core/appSelectedFaq.mjs';
export function AppSelectedFaqControls({config,selection,onPrepare,disabled=false}){
 const row=selectedAppFaq(config,selection);
 const [copy,setCopy]=React.useState(()=>({question:row?.question||'',answer:row?.answer||''}));
 const editEpoch=React.useRef(0),renderedEpoch=editEpoch.current;
 const live=React.useRef(null);live.current={config,selection,copy,disabled};
 const current=()=>live.current.config===config&&live.current.selection===selection&&live.current.copy===copy&&!live.current.disabled;
 const edit=selectedAppFaqOperation(config,selection,{kind:'wording',value:copy});
 return <View>
  <Text style={styles.cardBody}>Edit this owner-written customer question and answer. Other answers, business records and your website stay unchanged. Compare in Studio before approval.</Text>
  <Field label="Selected customer question" value={copy.question} maxLength={160} multiline onChangeText={question=>{if(current()){editEpoch.current++;setCopy(previous=>({...previous,question}));}}}/>
  <Field label="Selected owner answer" value={copy.answer} maxLength={1200} multiline onChangeText={answer=>{if(current()){editEpoch.current++;setCopy(previous=>({...previous,answer}));}}}/>
  <Button label="Preview selected answer" disabled={disabled||!edit.ok} onPress={()=>{if(current()&&editEpoch.current===renderedEpoch&&edit.ok)onPrepare(edit.operation);}}/>
  <Button label="Cancel selected answer wording" disabled={disabled} onPress={()=>{if(current()){editEpoch.current++;setCopy({question:row?.question||'',answer:row?.answer||''});}}}/>
  <View style={{flexDirection:'row',flexWrap:'wrap',gap:8}}>{['earlier','later'].map(direction=>{
   const move=selectedAppFaqOperation(config,selection,{kind:'move',direction});
   return <Button key={direction} label={'Preview answer '+direction} disabled={disabled||!move.ok} onPress={()=>{if(current()&&editEpoch.current===renderedEpoch&&move.ok)onPrepare(move.operation);}}/>;
  })}</View>
  {!edit.ok?<Text accessibilityLiveRegion="polite" style={styles.cardBody}>{edit.reason}</Text>:null}
 </View>;
}
