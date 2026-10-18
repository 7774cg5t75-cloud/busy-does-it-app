import React from 'react';
import {Text,View} from 'react-native';
import {Button,Field} from '../components/ui';
import {styles} from '../theme/styles';
import {selectedAppService,selectedAppServiceOperation} from '../core/appSelectedService.mjs';
export function AppSelectedServiceControls({config,selection,onPrepare,disabled=false}){
 const row=selectedAppService(config,selection);
 const [copy,setCopy]=React.useState(()=>({name:row?.name||'',description:row?.description||''}));
 const live=React.useRef(null);live.current={config,selection,copy,disabled};
 const current=()=>live.current.config===config&&live.current.selection===selection&&live.current.copy===copy&&!live.current.disabled;
 const edit=selectedAppServiceOperation(config,selection,{kind:'wording',value:copy});
 return <View>
  <Text style={styles.cardBody}>Only this owner-written service changes. Existing identifiers, category, price and duration labels stay intact. This is not a booking or availability update.</Text>
  <Field label="Selected service name" value={copy.name} maxLength={120} onChangeText={name=>{if(current())setCopy({...copy,name});}}/>
  <Field label="Selected service description" value={copy.description} maxLength={600} multiline onChangeText={description=>{if(current())setCopy({...copy,description});}}/>
  <Button label="Preview selected service wording" disabled={disabled||!edit.ok} onPress={()=>{if(current()&&edit.ok)onPrepare(edit.operation);}}/>
  <View style={{flexDirection:'row',flexWrap:'wrap',gap:8}}>{['earlier','later'].map(direction=>{
   const move=selectedAppServiceOperation(config,selection,{kind:'move',direction});
   return <Button key={direction} label={'Preview service '+direction} disabled={disabled||!move.ok} onPress={()=>{if(current()&&move.ok)onPrepare(move.operation);}}/>;
  })}</View>
  {!edit.ok?<Text accessibilityLiveRegion="polite" style={styles.cardBody}>{edit.reason}</Text>:null}
 </View>;
}
