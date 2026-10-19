import {IMAGE_OPTIONS} from '../core/appImageAppearance.mjs';
import {proposeCoordinatedAppChanges} from '../core/appCoordinatedStudio.mjs';
import React from 'react';
import {View,Text} from 'react-native';
import {Button,Field} from '../components/ui';
import {styles} from '../theme/styles';
import {selectedAppImageOperation} from '../core/appSelectedImage.mjs';
export function AppSelectedImageControls({config,selection,copy,onCopy,onPrepare,disabled=false}){
 const [group,setGroup]=React.useState(null);
 const editEpoch=React.useRef(0),renderedEpoch=editEpoch.current;
 const live=React.useRef(null);live.current={config,selection,disabled,group,copy};
 const current=()=>live.current.config===config&&live.current.selection===selection&&live.current.group===group&&live.current.copy===copy&&!live.current.disabled;
 const edit=selectedAppImageOperation(config,selection,{kind:'description',...copy});
 return <View>
  <Text style={styles.cardBody}>Edit this approved photo’s accessible description and caption, or move it in the gallery. The picture controls below affect only this photo; collection presets elsewhere affect the whole gallery. Nothing is uploaded or published.</Text>
  {group?<Button label="Cancel picture choice" disabled={disabled} onPress={()=>{if(current()){live.current.group=null;setGroup(null);}}}/>:null}
  {(()=>{const operation={kind:'image_appearance',index:selection.index,expectedUri:selection.expectedUri,value:{fit:'contain',size:'large'}},proof=proposeCoordinatedAppChanges(config,[operation]);return <Button label="Preview whole selected photograph" disabled={disabled||!proof.ok} onPress={()=>{if(current()&&editEpoch.current===renderedEpoch&&proof.ok)onPrepare(operation);}}/>;})()}
  <View style={{flexDirection:'row',flexWrap:'wrap',gap:6}}>{Object.keys(IMAGE_OPTIONS).map(field=><Button key={field} label={'This photo '+field} disabled={disabled} onPress={()=>{if(current()){const next=group===field?null:field;live.current.group=next;setGroup(next);}}}/>)}</View>
  {group?IMAGE_OPTIONS[group].map(value=>{const operation={kind:'image_appearance',index:selection.index,expectedUri:selection.expectedUri,value:{[group]:value}},proof=proposeCoordinatedAppChanges(config,[operation]);return <Button key={value} label={'Preview this photo '+value} disabled={disabled||!proof.ok} onPress={()=>{if(current()&&editEpoch.current===renderedEpoch&&proof.ok)onPrepare(operation);}}/>;}):null}
  {(()=>{const operation={kind:'image_appearance',index:selection.index,expectedUri:selection.expectedUri,value:null},proof=proposeCoordinatedAppChanges(config,[operation]);return <Button label="Reset this photo style" disabled={disabled||!proof.ok} onPress={()=>{if(current()&&editEpoch.current===renderedEpoch&&proof.ok)onPrepare(operation);}}/>;})()}
  <Field label="Selected photo description" value={copy?.alt||''} maxLength={160} multiline onChangeText={alt=>{if(current()){editEpoch.current++;onCopy(previous=>({...previous,alt}));}}}/>
  <Field label="Selected photo caption" value={copy?.caption||''} maxLength={240} multiline onChangeText={caption=>{if(current()){editEpoch.current++;onCopy(previous=>({...previous,caption}));}}}/>
  <Button label="Preview selected photo wording" disabled={disabled||!edit.ok} onPress={()=>{if(current()&&editEpoch.current===renderedEpoch&&edit.ok)onPrepare(edit.operation);}}/>
  <View style={{flexDirection:'row',flexWrap:'wrap',gap:8}}>{['earlier','later'].map(direction=>{
   const move=selectedAppImageOperation(config,selection,{kind:'move',direction});
   return <Button key={direction} label={'Preview photo '+direction} disabled={disabled||!move.ok} onPress={()=>{if(current()&&editEpoch.current===renderedEpoch&&move.ok)onPrepare(move.operation);}}/>;
  })}</View>
  {!edit.ok?<Text style={styles.cardBody}>{edit.reason}</Text>:null}
 </View>;
}
