import React from 'react';
import {View,Text,TextInput,Pressable,ActivityIndicator} from 'react-native';
import {BusyOrb,MicrophoneIcon} from './BusyOrb';
import {appColors as C,orbState} from '../theme/appearance.mjs';
// Original composer/voice owners. UI feedback never invents assistant activity.
export function BusyHomeEntry({s}){
 const text=s.busyEntryText||'',working=s.busyCommandStatus==='thinking'||!!s.busyEntrySubmission;
 const [focused,setFocused]=React.useState(false),live=React.useRef(null),sent=React.useRef(null),alive=React.useRef(true);
 const scope=JSON.stringify([s.ownerSession?.userId,s.cloudWorkspace?.businessId]);live.current={s,scope,text,working};
 React.useEffect(()=>{alive.current=true;return()=>{alive.current=false;};},[]);
 if(sent.current&&(sent.current.scope!==scope||sent.current.text!==text))sent.current=null;
 const current=()=>alive.current&&live.current.scope===scope;
 const send=()=>{if(!current()||live.current.text!==text||!text.trim()||live.current.working||sent.current)return false;sent.current={scope,text};const result=live.current.s.sendBusyEntry(text);if(result===false)sent.current=null;return result;};
 const voice=()=>{if(current())return live.current.s.openTalkToBusy(true);return false;};
 return <View style={{paddingTop:8,paddingBottom:24,alignItems:'center'}}>
  <View pointerEvents="none" accessibilityElementsHidden style={{position:'absolute',top:12,left:24,right:24,height:150,borderRadius:100,backgroundColor:C.blueSoft,opacity:.35}}/>
  {[[12,18,2],[83,34,3],[22,103,2],[90,124,2],[65,4,2]].map(([left,top,size],i)=><View key={i} pointerEvents="none" accessibilityElementsHidden style={{position:'absolute',left:left+'%',top,width:size,height:size,borderRadius:2,backgroundColor:C.blueText,opacity:.35}}/>)}
  <BusyOrb onPress={voice} state={orbState({status:s.busyCommandStatus,error:s.busyCommandError})} label="Talk to BUSY"/>
  <Text accessibilityRole="header" style={{color:C.ink,fontSize:24,lineHeight:32,fontWeight:'700',letterSpacing:-.6,marginTop:8}}>What needs doing?</Text>
  <Text style={{color:C.muted,fontSize:14,lineHeight:21,textAlign:'center',marginTop:8,marginBottom:20}}>Tell BUSY. Take back a little of your day.</Text>
  <View style={{width:'100%',flexDirection:'row',alignItems:'center',backgroundColor:C.input,borderColor:focused?C.blueText:C.controlBorder,borderWidth:1,borderRadius:20,padding:6}}>
   <Pressable accessibilityRole="button" accessibilityLabel="Speak to BUSY" accessibilityHint="Uses the same voice conversation as the BUSY orb" onPress={voice} style={({pressed})=>({width:48,height:48,borderRadius:14,backgroundColor:pressed?C.blueSoft:'transparent',alignItems:'center',justifyContent:'center'})}><MicrophoneIcon size={24} color={C.blueText}/></Pressable>
   <TextInput accessibilityLabel="Ask BUSY" placeholder="Ask BUSY anything…" placeholderTextColor={C.muted} selectionColor={C.blueText} value={text} onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)} onChangeText={value=>{if(current())live.current.s.setBusyEntryText(value);}} onSubmitEditing={send} blurOnSubmit={false} returnKeyType="send" style={{flex:1,minWidth:0,color:C.ink,fontSize:16,paddingVertical:14,paddingHorizontal:6}}/>
   <Pressable accessibilityRole="button" accessibilityLabel="Send request to BUSY" accessibilityState={{disabled:!text.trim()||working,busy:working}} disabled={!text.trim()||working} onPress={send} style={({pressed})=>({minWidth:52,minHeight:48,borderRadius:14,backgroundColor:text.trim()&&!working?C.blue:C.surface,opacity:pressed?.86:1,alignItems:'center',justifyContent:'center'})}>{working?<ActivityIndicator accessibilityElementsHidden color={C.blueText} size="small"/>:<Text style={{fontSize:21,color:text.trim()?C.onAction:C.muted}}>↑</Text>}</Pressable>
  </View>
  <Text accessibilityLiveRegion="polite" style={{color:C.muted,fontSize:12,lineHeight:18,marginTop:10,textAlign:'center'}}>{working?(s.busyCommandStatus==='thinking'?'BUSY is working on your request. You can keep typing.':'Your request is queued for BUSY. You can keep typing.'):'Voice or type. BUSY keeps approvals in your hands.'}</Text>
 </View>;
}
