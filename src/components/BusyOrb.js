import {useMotionPolicy,useMotionValue} from '../theme/motion';
import {orbMotion,horizontalOrbDrag} from '../theme/interaction.mjs';
import React from 'react';
import {View,Text,Pressable,PanResponder,Animated,useWindowDimensions} from 'react-native';
import Svg,{Circle,Rect,Path} from 'react-native-svg';
import {appColors as C,getAppearance,orbState,clampOrbX,snapOrbEdge} from '../theme/appearance.mjs';
import {retainOrbEdge} from '../theme/useAppearance';
const labels={idle:'Tap to talk to BUSY',listening:'BUSY is listening',speaking:'BUSY is speaking',processing:'BUSY is working on your request',error:'BUSY needs attention',approval:'Your review is needed'};
export function MicrophoneIcon({size=24,color=C.ink,stop=false}){return <Svg width={size} height={size} viewBox="0 0 32 32" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">{stop?<Rect x="10" y="10" width="12" height="12" rx="2" fill={color}/>:<><Rect x="12" y="4" width="8" height="15" rx="4" fill="none" stroke={color} strokeWidth="2"/><Path d="M8 14v2a8 8 0 0 0 16 0v-2M16 24v4m-5 0h10" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"/></>}</Svg>;}
// Static layered light: no timer, pretend progress, GPU blur or perpetual animation.
export function BusyOrb({size=144,state='idle',onPress,disabled=false,label,accessibilityActions,onAccessibilityAction,ambient=true}){
 const current=labels[state]?state:'idle',accent=current==='error'?C.red:current==='approval'?C.amber:current==='listening'?C.red:C.violet;
 const policy=useMotionPolicy(),halo=useMotionValue(0),spec=orbMotion(current,{enabled:policy.enabled&&!disabled,ambient:ambient&&size>70});
 React.useEffect(()=>{if(!halo)return;halo.stopAnimation();halo.setValue(0);if(!spec)return;const cycle=Animated.sequence([Animated.timing(halo,{toValue:1,duration:spec.duration,useNativeDriver:true,isInteraction:false}),Animated.timing(halo,{toValue:0,duration:spec.duration,useNativeDriver:true,isInteraction:false})]),animation=Animated.loop(cycle,{iterations:spec.repeat,resetBeforeIteration:true});animation.start();return()=>{animation.stop();halo.stopAnimation();halo.setValue(0);};},[current,policy.enabled,disabled,ambient,size,halo]);
 const Halo=Animated?.View||View;
 return <Pressable accessibilityRole="button" accessibilityLabel={label||labels[current]} accessibilityValue={{text:labels[current]}} accessibilityLiveRegion="polite" accessibilityHint="Opens the original BUSY conversation. Microphone permission is requested there." accessibilityState={{disabled}} accessibilityActions={accessibilityActions} onAccessibilityAction={onAccessibilityAction} disabled={disabled} onPress={onPress} style={({pressed})=>({width:size,height:size,borderRadius:size/2,alignItems:'center',justifyContent:'center',opacity:disabled?.6:pressed?.88:1,transform:pressed&&!policy.reduceMotion?[{scale:.97}]:[{scale:1}]})}>
  <Halo pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{position:'absolute',inset:0,borderRadius:size/2,backgroundColor:C.blueSoft,opacity:halo?halo.interpolate({inputRange:[0,1],outputRange:[.4,spec?.opacity||.4]}):.4,transform:[{scale:halo?halo.interpolate({inputRange:[0,1],outputRange:[1,spec?.scale||1]}):1}]}}/>
  <View pointerEvents="none" style={{position:'absolute',inset:size*.07,borderRadius:size/2,borderWidth:1,borderColor:accent,opacity:.32}}/>
  <View pointerEvents="none" style={{position:'absolute',inset:size*.15,borderRadius:size/2,borderWidth:2,borderColor:accent,backgroundColor:C.card,transform:[{rotate:'-18deg'}]}}/>
  <View pointerEvents="none" style={{position:'absolute',top:size*.16,left:size*.43,width:size*.2,height:2,borderRadius:2,backgroundColor:C.cyan}}/>
  <MicrophoneIcon size={size>70?32:21} color={current==='listening'?accent:C.ink} stop={current==='listening'}/>
 </Pressable>;
}
// Keep the assistant in a reserved safe rail: no overlay can cover task controls.
// Native translation/snap avoids a React update on every drag frame.
export function BusyMiniOrb({s}){
 const [width,setWidth]=React.useState(320),[x,setX]=React.useState(null),[engaged,setEngaged]=React.useState(false),drag=React.useRef(false),live=React.useRef(null),start=React.useRef(null),alive=React.useRef(true);
 const edge=getAppearance().orbEdge,base=edge==='left'?12:Math.max(12,width-60),position=useMotionValue(base),policy=useMotionPolicy(),snap=React.useRef(null);
 const scope=JSON.stringify([s.ownerSession?.userId,s.cloudWorkspace?.businessId,s.screen]);live.current={width,base,scope,s};
 React.useEffect(()=>{alive.current=true;return()=>{alive.current=false;snap.current?.stop?.();position?.stopAnimation?.();};},[]);
 const previousWidth=React.useRef(width);
 React.useEffect(()=>{
  const resized=previousWidth.current!==width;previousWidth.current=width;
  if(!resized&&drag.current&&policy.enabled)return;
  snap.current?.stop?.();position?.stopAnimation?.();let ownedAnimation=null;
  if(position&&policy.enabled&&!resized){ownedAnimation=Animated.timing(position,{toValue:base,duration:180,useNativeDriver:true,isInteraction:false});snap.current=ownedAnimation;ownedAnimation.start();}
  else position?.setValue?.(base);
  setX(null);start.current=null;
  // Only stop this effect's own animation, not a newer drag-release snap.
  return()=>ownedAnimation?.stop();
 },[base,width,policy.enabled]);
 const move=value=>{if(!alive.current)return;if(position)position.setValue(value);else setX(value);};
 const settle=value=>{if(!alive.current)return;snap.current?.stop?.();if(position&&policy.enabled){snap.current=Animated.timing(position,{toValue:value,duration:180,useNativeDriver:true,isInteraction:false});snap.current.start();}else move(value);};
 const responder=React.useMemo(()=>PanResponder?.create?.({
  onMoveShouldSetPanResponder:(_,g)=>alive.current&&horizontalOrbDrag(g.dx,g.dy),
  onPanResponderGrant:()=>{if(!alive.current)return;drag.current=true;setEngaged(true);snap.current?.stop?.();start.current=live.current.base;position?.stopAnimation?.(value=>{if(Number.isFinite(value))start.current=clampOrbX(value,live.current.width);});},
  onPanResponderMove:(_,g)=>{if(!alive.current||!Number.isFinite(g.dx))return;drag.current=true;move(clampOrbX((start.current??live.current.base)+g.dx,live.current.width));},
  onPanResponderRelease:(_,g)=>{if(!alive.current)return;if(drag.current){const value=clampOrbX((start.current??live.current.base)+(Number.isFinite(g.dx)?g.dx:0),live.current.width),next=snapOrbEdge(value,live.current.width);retainOrbEdge(next);settle(next==='left'?12:live.current.width-60);}setEngaged(false);if(!position)setX(null);start.current=null;},
  onPanResponderTerminationRequest:()=>true,
  onPanResponderTerminate:()=>{if(!alive.current)return;drag.current=true;setEngaged(false);start.current=null;settle(live.current.base);}
 })?.panHandlers||{},[position,policy.enabled]);
 const dimensions=useWindowDimensions(),fontScale=Number.isFinite(dimensions.fontScale)?dimensions.fontScale:1,railHeight=Math.max(64,Math.ceil(18*fontScale+16));
 const Surface=Animated?.View||View,current=()=>alive.current&&live.current.scope===scope;
 return <View accessibilityLabel="BUSY assistant rail" onLayout={e=>{const next=e.nativeEvent.layout.width;if(Number.isFinite(next)&&next>=72){setWidth(next);}}} style={{height:railHeight,backgroundColor:C.nav,borderTopWidth:1,borderTopColor:C.border,justifyContent:'center'}}>
  <Text pointerEvents="none" style={{alignSelf:edge==='left'?'flex-end':'flex-start',marginHorizontal:76,color:C.muted,fontSize:12,lineHeight:18}}>{fontScale>=1.6?'BUSY':'BUSY · tap to talk'}</Text>
  <Surface {...responder} onTouchStart={()=>{if(!alive.current)return;drag.current=false;setEngaged(true);}} onTouchEnd={()=>{if(alive.current)setEngaged(false);}} style={{position:'absolute',left:position?0:x??base,top:(railHeight-48)/2,opacity:engaged?1:.78,...position?{transform:[{translateX:position}]}:{}}}>
   <BusyOrb size={48} ambient={false} accessibilityActions={[{name:'moveLeft',label:'Move BUSY to the left edge'},{name:'moveRight',label:'Move BUSY to the right edge'}]} onAccessibilityAction={event=>{if(!current())return;const next=event.nativeEvent.actionName==='moveLeft'?'left':event.nativeEvent.actionName==='moveRight'?'right':null;if(next){retainOrbEdge(next);settle(next==='left'?12:live.current.width-60);}}} state={orbState({status:s.busyCommandStatus,error:s.busyCommandError})} onPress={()=>{if(current()&&!drag.current)live.current.s.openTalkToBusy(true);}}/>
  </Surface>
 </View>;
}
