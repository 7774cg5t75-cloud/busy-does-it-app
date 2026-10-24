import React from 'react';
import {View,Text,TextInput,Pressable} from 'react-native';
import {BusyOrb,MicrophoneIcon} from './BusyOrb';
import {appColors as C,orbState} from '../theme/appearance.mjs';
// One BUSY conversation/composer, using the original command and voice routes.
export function BusyHomeEntry({s}){
 const text=s.busyEntryText||'',working=s.busyCommandStatus==='thinking';
 const send=()=>{if(!text.trim()||working)return false;return s.sendBusyEntry(text);};
 return <View style={{paddingTop:8,paddingBottom:24,alignItems:'center'}}>
  <View pointerEvents="none" accessibilityElementsHidden style={{position:'absolute',top:12,left:24,right:24,height:150,borderRadius:100,backgroundColor:C.blueSoft,opacity:.35}}/>
  {[[12,18,2],[83,34,3],[22,103,2],[90,124,2],[65,4,2]].map(([left,top,size],i)=><View key={i} pointerEvents="none" accessibilityElementsHidden style={{position:'absolute',left:left+'%',top,width:size,height:size,borderRadius:2,backgroundColor:C.blueText,opacity:.35}}/>)}
  <BusyOrb onPress={()=>s.openTalkToBusy(true)} state={orbState({status:s.busyCommandStatus,error:s.busyCommandError})} label="Talk to BUSY"/>
  <Text style={{color:C.ink,fontSize:24,fontWeight:'700',letterSpacing:-.6,marginTop:8}}>What needs doing?</Text>
  <Text style={{color:C.muted,fontSize:14,lineHeight:21,textAlign:'center',marginTop:8,marginBottom:20}}>Tell BUSY. Take back a little of your day.</Text>
  <View style={{width:'100%',flexDirection:'row',alignItems:'center',backgroundColor:C.input,borderColor:C.controlBorder,borderWidth:1,borderRadius:20,padding:6}}>
   <Pressable accessibilityRole="button" accessibilityLabel="Speak to BUSY" accessibilityHint="Uses the same voice conversation as the BUSY orb" onPress={()=>s.openTalkToBusy(true)} style={{width:48,height:48,alignItems:'center',justifyContent:'center'}}><MicrophoneIcon size={24} color={C.blueText}/></Pressable>
   <TextInput accessibilityLabel="Ask BUSY" placeholder="Ask BUSY anything…" placeholderTextColor={C.muted} value={text} onChangeText={s.setBusyEntryText} onSubmitEditing={send} returnKeyType="send" style={{flex:1,minWidth:0,color:C.ink,fontSize:16,paddingVertical:14,paddingHorizontal:6}}/>
   <Pressable accessibilityRole="button" accessibilityLabel="Send request to BUSY" accessibilityState={{disabled:!text.trim()||working}} disabled={!text.trim()||working} onPress={send} style={{minWidth:52,minHeight:48,borderRadius:14,backgroundColor:text.trim()?C.blue:C.surface,alignItems:'center',justifyContent:'center'}}><Text style={{fontSize:21,color:text.trim()?C.onAction:C.muted}}>↑</Text></Pressable>
  </View>
  <Text style={{color:C.muted,fontSize:12,lineHeight:18,marginTop:10,textAlign:'center'}}>Voice or type. BUSY keeps approvals in your hands.</Text>
 </View>;
}
