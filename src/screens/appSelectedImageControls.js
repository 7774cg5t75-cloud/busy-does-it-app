import React from 'react';
import {View,Text} from 'react-native';
import {Button,Field} from '../components/ui';
import {styles} from '../theme/styles';
import {selectedAppImageOperation} from '../core/appSelectedImage.mjs';
export function AppSelectedImageControls({config,selection,copy,onCopy,onPrepare,disabled=false}){
 const edit=selectedAppImageOperation(config,selection,{kind:'description',...copy});
 return <View>
  <Text style={styles.cardBody}>Edit this approved photo’s accessible description and caption, or move it in the gallery. Size and corner presets apply to the whole gallery. Nothing is uploaded or published.</Text>
  <Field label="Selected photo description" value={copy?.alt||''} maxLength={160} multiline onChangeText={alt=>{if(!disabled)onCopy({...copy,alt});}}/>
  <Field label="Selected photo caption" value={copy?.caption||''} maxLength={240} multiline onChangeText={caption=>{if(!disabled)onCopy({...copy,caption});}}/>
  <Button label="Preview selected photo wording" disabled={disabled||!edit.ok} onPress={()=>{if(!disabled&&edit.ok)onPrepare(edit.operation);}}/>
  <View style={{flexDirection:'row',flexWrap:'wrap',gap:8}}>{['earlier','later'].map(direction=>{
   const move=selectedAppImageOperation(config,selection,{kind:'move',direction});
   return <Button key={direction} label={'Preview photo '+direction} disabled={disabled||!move.ok} onPress={()=>{if(!disabled&&move.ok)onPrepare(move.operation);}}/>;
  })}</View>
  {!edit.ok?<Text style={styles.cardBody}>{edit.reason}</Text>:null}
 </View>;
}
