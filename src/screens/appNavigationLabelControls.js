import React from 'react';
import {View,Text} from 'react-native';
import {Field,Button} from '../components/ui';
import {styles} from '../theme/styles';
import {proposeCoordinatedAppChanges} from '../core/appCoordinatedStudio.mjs';
export function AppNavigationLabelControls({config,selection,onPrepare,disabled}){
 const module=config?.modules?.find(m=>m.key===selection?.moduleKey);
 const [text,setText]=React.useState(module?.label||module?.title||'');
 const editEpoch=React.useRef(0),renderedEpoch=editEpoch.current;
 const live=React.useRef(null);live.current={config,selection,text,disabled};
 const current=()=>live.current.config===config&&live.current.selection===selection&&live.current.text===text&&!live.current.disabled;
 if(selection?.part!=='navigation'||!['business_profile','services','gallery','contact'].includes(module?.key))return null;
 const op={kind:'navigation_label',moduleKey:module.key,value:text.trim()},proof=proposeCoordinatedAppChanges(config,[op]),reset={...op,value:null},resetProof=proposeCoordinatedAppChanges(config,[reset]);
 return <View><Text style={styles.cardBody}>Change this menu wording only. It still opens the same screen.</Text>
  <Field label="Selected navigation label" value={text} maxLength={36} onChangeText={value=>{if(current()){editEpoch.current++;setText(value);}}}/>
  <Button label="Preview navigation wording" disabled={disabled||!proof.ok} onPress={()=>{if(current()&&editEpoch.current===renderedEpoch&&proof.ok)onPrepare(op);}}/>
  <Button label="Cancel navigation wording" disabled={disabled} onPress={()=>{if(current()){editEpoch.current++;setText(module?.label||module?.title||'');}}}/>
  <Button label="Reset navigation wording" disabled={disabled||!resetProof.ok} onPress={()=>{if(current()&&editEpoch.current===renderedEpoch&&resetProof.ok)onPrepare(reset);}}/>
  {!proof.ok?<Text style={styles.cardBody}>{proof.reason}</Text>:null}
 </View>;
}
