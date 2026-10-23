import React from 'react';
import {View,Text,Pressable,PanResponder} from 'react-native';
import Svg,{Circle,Rect,Path} from 'react-native-svg';
import {appColors as C,getAppearance,orbState,clampOrbX,snapOrbEdge} from '../theme/appearance.mjs';
import {retainOrbEdge} from '../theme/useAppearance';
const labels={idle:'Tap to talk to BUSY',listening:'BUSY is listening',speaking:'BUSY is speaking',processing:'BUSY is working on your request',error:'BUSY needs attention',approval:'Your review is needed'};
export function MicrophoneIcon({size=24,color=C.ink,stop=false}){return <Svg width={size} height={size} viewBox="0 0 32 32" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">{stop?<Rect x="10" y="10" width="12" height="12" rx="2" fill={color}/>:<><Rect x="12" y="4" width="8" height="15" rx="4" fill="none" stroke={color} strokeWidth="2"/><Path d="M8 14v2a8 8 0 0 0 16 0v-2M16 24v4m-5 0h10" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"/></>}</Svg>;}
// Static layered light: no timer, pretend progress, GPU blur or perpetual animation.
export function BusyOrb({size=144,state='idle',onPress,disabled=false,label,accessibilityActions,onAccessibilityAction}){
 const current=labels[state]?state:'idle',accent=current==='error'?C.red:current==='approval'?C.amber:current==='listening'?C.cyan:C.violet;
 return <Pressable accessibilityRole="button" accessibilityLabel={label||labels[current]} accessibilityValue={{text:labels[current]}} accessibilityLiveRegion="polite" accessibilityHint="Opens the original BUSY conversation. Microphone permission is requested there." accessibilityState={{disabled}} accessibilityActions={accessibilityActions} onAccessibilityAction={onAccessibilityAction} disabled={disabled} onPress={onPress} style={({pressed})=>({width:size,height:size,borderRadius:size/2,alignItems:'center',justifyContent:'center',opacity:disabled?.45:pressed?.8:1})}>
  <View pointerEvents="none" style={{position:'absolute',inset:0,borderRadius:size/2,backgroundColor:C.blueSoft,opacity:.65}}/>
  <View pointerEvents="none" style={{position:'absolute',inset:size*.07,borderRadius:size/2,borderWidth:1,borderColor:accent,opacity:.32}}/>
  <View pointerEvents="none" style={{position:'absolute',inset:size*.15,borderRadius:size/2,borderWidth:2,borderColor:accent,backgroundColor:C.card,transform:[{rotate:'-18deg'}]}}/>
  <View pointerEvents="none" style={{position:'absolute',top:size*.16,left:size*.43,width:size*.2,height:2,borderRadius:2,backgroundColor:C.cyan}}/>
  <MicrophoneIcon size={size>70?32:21} color={current==='listening'?accent:C.ink} stop={current==='listening'}/>
 </Pressable>;
}
// A reserved rail on overview screens, not a floating overlay above task controls.
// Horizontal dragging/edge retention is the safe subset; no free vertical placement.
export function BusyMiniOrb({s}){
 const [width,setWidth]=React.useState(320),[x,setX]=React.useState(null),drag=React.useRef(false),live=React.useRef(null);
 const edge=getAppearance().orbEdge,base=edge==='left'?12:Math.max(12,width-60);live.current={width,base};
 const responder=React.useMemo(()=>PanResponder?.create?.({onMoveShouldSetPanResponder:(_,g)=>Math.abs(g.dx)>10&&Math.abs(g.dx)>Math.abs(g.dy),onPanResponderGrant:()=>{drag.current=false;},onPanResponderMove:(_,g)=>{drag.current=true;setX(clampOrbX(live.current.base+g.dx,live.current.width));},onPanResponderRelease:(_,g)=>{if(drag.current)retainOrbEdge(snapOrbEdge(clampOrbX(live.current.base+g.dx,live.current.width),live.current.width));setX(null);},onPanResponderTerminate:()=>{setX(null);drag.current=true;}})?.panHandlers||{},[]);
 return <View accessibilityLabel="BUSY assistant rail" onLayout={e=>setWidth(e.nativeEvent.layout.width)} style={{height:64,backgroundColor:C.nav,borderTopWidth:1,borderTopColor:C.border,justifyContent:'center'}}>
  <Text pointerEvents="none" style={{alignSelf:edge==='left'?'flex-end':'flex-start',marginHorizontal:76,color:C.muted,fontSize:12}}>BUSY · tap to talk</Text>
  <View {...responder} onTouchStart={()=>{drag.current=false;}} style={{position:'absolute',left:x??base,top:8}}><BusyOrb size={48} accessibilityActions={[{name:"moveLeft",label:"Move BUSY to the left edge"},{name:"moveRight",label:"Move BUSY to the right edge"}]} onAccessibilityAction={event=>{if(event.nativeEvent.actionName==="moveLeft")retainOrbEdge("left");if(event.nativeEvent.actionName==="moveRight")retainOrbEdge("right");}} state={orbState({status:s.busyCommandStatus,error:s.busyCommandError})} onPress={()=>{if(!drag.current)s.openTalkToBusy(true);}}/></View>
 </View>;
}
