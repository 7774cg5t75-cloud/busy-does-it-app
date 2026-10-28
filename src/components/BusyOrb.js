import {floatingBounds,clampFloatingOrb,floatingDrag,parkFloatingOrb,floatingIntent,preferredFloatingOrb} from '../theme/floatingOrb.mjs';
import {useMotionPolicy,useMotionValue} from '../theme/motion';
import {orbMotion} from '../theme/interaction.mjs';
import React from 'react';
import {View,Pressable,PanResponder,Animated,Easing} from 'react-native';
import Svg,{Circle,Rect,Path,Defs,RadialGradient,LinearGradient,Stop,Ellipse} from 'react-native-svg';
import {appColors as C,getAppearance,orbState} from '../theme/appearance.mjs';
import {retainOrbPosition} from '../theme/useAppearance';
const labels={idle:'Tap to talk to BUSY',listening:'BUSY is listening',speaking:'BUSY is speaking',processing:'BUSY is working on your request',error:'BUSY needs attention',approval:'Your review is needed'};
export function MicrophoneIcon({size=24,color=C.ink,stop=false}){return <Svg width={size} height={size} viewBox="0 0 32 32" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">{stop?<Rect x="10" y="10" width="12" height="12" rx="2" fill={color}/>:<><Rect x="12" y="4" width="8" height="15" rx="4" fill="none" stroke={color} strokeWidth="2"/><Path d="M8 14v2a8 8 0 0 0 16 0v-2M16 24v4m-5 0h10" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"/></>}</Svg>;}
let orbSequence=0;
// Genuine SVG light layers; native motion remains bounded by the original OS policy.
export function BusyOrb({size=144,state='idle',onPress,disabled=false,label,accessibilityActions,onAccessibilityAction,ambient=true,luminous=false}){
 const identity=React.useRef(null);if(!identity.current)identity.current='busy-light-'+(++orbSequence);const id=identity.current;
 const current=labels[state]?state:'idle',accent=current==='error'?C.red:current==='approval'?C.amber:current==='listening'?C.red:C.violet;
 const policy=useMotionPolicy(),halo=useMotionValue(0),spec=orbMotion(current,{enabled:policy.enabled&&!disabled,ambient,small:size<=70});
 React.useEffect(()=>{if(!halo)return;halo.stopAnimation();halo.setValue(0);if(!spec)return;const cycle=Animated.sequence([Animated.timing(halo,{toValue:1,duration:spec.duration,useNativeDriver:true,isInteraction:false,easing:Easing?.inOut&&Easing?.sin?Easing.inOut(Easing.sin):undefined}),Animated.timing(halo,{toValue:0,duration:spec.duration,useNativeDriver:true,isInteraction:false})]),animation=Animated.loop(cycle,{iterations:spec.repeat,resetBeforeIteration:true});animation.start();return()=>{animation.stop();halo.stopAnimation();halo.setValue(0);};},[current,policy.enabled,disabled,ambient,size,halo]);
 const Halo=Animated?.View||View;
 return <Pressable accessibilityRole="button" accessibilityLabel={label||labels[current]} accessibilityValue={{text:labels[current]}} accessibilityLiveRegion="polite" accessibilityHint="Opens the original BUSY conversation. Microphone permission is requested there." accessibilityState={{disabled}} accessibilityActions={accessibilityActions} onAccessibilityAction={onAccessibilityAction} disabled={disabled} onPress={onPress} style={({pressed})=>({width:size,height:size,borderRadius:size/2,alignItems:'center',justifyContent:'center',opacity:disabled?.6:pressed?.88:1,transform:pressed&&!policy.reduceMotion?[{scale:.97}]:[{scale:1}]})}>
  <Halo pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{position:'absolute',inset:0,borderRadius:size/2,opacity:halo?halo.interpolate({inputRange:[0,1],outputRange:[spec?.baseOpacity||.88,spec?.opacity||.88]}):.88,transform:[{scale:halo?halo.interpolate({inputRange:[0,1],outputRange:[1,spec?.scale||1]}):1}]}}>
   <Svg width={size} height={size} viewBox="0 0 200 200">
    <Defs>
     <RadialGradient id={id+'halo'}><Stop offset=".34" stopColor="#536AFF" stopOpacity="0"/><Stop offset=".64" stopColor="#6D44E9" stopOpacity=".32"/><Stop offset=".8" stopColor="#246DFF" stopOpacity=".12"/><Stop offset="1" stopColor="#246DFF" stopOpacity="0"/></RadialGradient>
     <RadialGradient id={id+'core'} cx=".4" cy=".35"><Stop offset="0" stopColor={C.surface}/><Stop offset="1" stopColor={C.bg}/></RadialGradient>
     <LinearGradient id={id+'ring'} x1="0" y1="0" x2="1" y2="1"><Stop offset="0" stopColor="#42E7FF"/><Stop offset=".28" stopColor="#4385FF"/><Stop offset=".58" stopColor="#9172FF"/><Stop offset=".78" stopColor="#F05DDD"/><Stop offset="1" stopColor="#6E8CFF"/></LinearGradient>
     <RadialGradient id={id+'cyan'}><Stop offset="0" stopColor="#65F1FF" stopOpacity=".8"/><Stop offset="1" stopColor="#1C95FF" stopOpacity="0"/></RadialGradient>
     <RadialGradient id={id+'pink'}><Stop offset="0" stopColor="#FF75E7" stopOpacity=".75"/><Stop offset="1" stopColor="#B847FF" stopOpacity="0"/></RadialGradient>
    {luminous?<RadialGradient id={id+'electric'}><Stop offset="0" stopColor="#E7FFFF"/><Stop offset=".13" stopColor="#38ECFF" stopOpacity=".98"/><Stop offset=".42" stopColor="#147EFF" stopOpacity=".55"/><Stop offset="1" stopColor="#147EFF" stopOpacity="0"/></RadialGradient>:null}
    </Defs>
    <Circle cx="100" cy="100" r="99" fill={'url(#'+id+'halo)'}/>
    <Circle cx="100" cy="100" r="65" fill={'url(#'+id+'core)'}/>
    <Circle cx="100" cy="100" r="68" fill="none" stroke={'url(#'+id+'ring)'} strokeWidth={luminous?22:16} opacity={luminous?.22:.13}/>
    <Circle cx="100" cy="100" r="68" fill="none" stroke={'url(#'+id+'ring)'} strokeWidth={luminous?10:8} opacity={luminous?.6:.35}/>
    <Circle cx="100" cy="100" r="68" fill="none" stroke={'url(#'+id+'ring)'} strokeWidth={luminous?4.5:3.5}/>
    <Ellipse cx="46" cy="64" rx="32" ry="40" fill={'url(#'+id+'cyan)'}/><Ellipse cx="157" cy="130" rx="33" ry="40" fill={'url(#'+id+'pink)'}/>
    <Path d="M38 77A67 67 0 0 1 115 34M163 122a67 67 0 0 1-45 43" fill="none" stroke="#E0F7FF" strokeWidth="1.2" strokeLinecap="round" opacity=".9"/>
    {luminous?<>
     <Path d="M34 105A68 68 0 0 1 105 32" fill="none" stroke="#26E7FF" strokeWidth="5" strokeLinecap="round"/>
     <Path d="M138 44A68 68 0 0 1 165 120M139 154A68 68 0 0 1 72 161" fill="none" stroke="#FF49D6" strokeWidth="4" strokeLinecap="round"/>
     <Path d="M53 148A68 68 0 0 0 146 149" fill="none" stroke="#29CFFF" strokeWidth="3" strokeLinecap="round"/>
     <Circle cx="48" cy="56" r="25" fill={'url(#'+id+'electric)'}/><Circle cx="142" cy="47" r="23" fill={'url(#'+id+'pink)'}/>
     <Circle cx="48" cy="56" r="2.8" fill="#DBFFFF"/><Circle cx="145" cy="49" r="3" fill="#FFE9FC"/>
     <Path d="M40 117A61 61 0 0 0 111 160M121 41A61 61 0 0 1 160 102" stroke="#8766FF" strokeWidth="1.3" fill="none" opacity=".7"/>
    </>:null}
    <Circle cx="100" cy="100" r="59" fill="none" stroke={C.blueText} strokeWidth=".7" opacity=".26"/>
    {['listening','error','approval'].includes(current)?<Circle cx="100" cy="100" r="69" fill="none" stroke={accent} strokeWidth="3"/>:null}
   </Svg>
  </Halo>
  {luminous&&current==='idle'?<Halo pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{position:'absolute',inset:0,opacity:halo&&spec?halo.interpolate({inputRange:[0,1],outputRange:[.25,.88]}):.62,transform:[{translateX:halo&&spec?halo.interpolate({inputRange:[0,1],outputRange:[-2.5,2.5]}):0},{translateY:halo&&spec?halo.interpolate({inputRange:[0,1],outputRange:[1.5,-1.5]}):0}]}}>
   <Svg width={size} height={size} viewBox="0 0 200 200">
    <Defs>
     <RadialGradient id={id+'livingCyan'}><Stop offset="0" stopColor="#DBFFFF"/><Stop offset=".16" stopColor="#27ECFF" stopOpacity=".95"/><Stop offset=".48" stopColor="#158AFF" stopOpacity=".45"/><Stop offset="1" stopColor="#158AFF" stopOpacity="0"/></RadialGradient>
     <RadialGradient id={id+'livingPink'}><Stop offset="0" stopColor="#FFF3FF"/><Stop offset=".18" stopColor="#FF51E5" stopOpacity=".95"/><Stop offset=".5" stopColor="#B747FF" stopOpacity=".4"/><Stop offset="1" stopColor="#B747FF" stopOpacity="0"/></RadialGradient>
    </Defs>
    <Ellipse cx="41" cy="68" rx="17" ry="25" fill={'url(#'+id+'livingCyan)'}/>
    <Ellipse cx="153" cy="57" rx="17" ry="23" fill={'url(#'+id+'livingPink)'}/>
    <Path d="M34 92A67 67 0 0 1 49 56" fill="none" stroke="#B8FFFF" strokeWidth="1.2" strokeLinecap="round"/>
   </Svg>
  </Halo>:null}
  <MicrophoneIcon size={size>70?32:21} color={current==='listening'?accent:C.ink} stop={current==='listening'}/>
 </Pressable>;
}
// A measured 48-point overlay, never a layout rail. Native x/y values avoid
// React updates on drag frames; unknown or fully occupied geometry hides it.
export function BusyMiniOrb({s,bounds,obstacles=[],ready=true,layoutVersion=0}){
 const [fallback,setFallback]=React.useState(null),[engaged,setEngaged]=React.useState(false),[hidden,setHidden]=React.useState(true);
 const policy=useMotionPolicy(),x=useMotionValue(0),y=useMotionValue(0),live=React.useRef(null),last=React.useRef(null),start=React.useRef(null),drag=React.useRef(false),alive=React.useRef(true),snap=React.useRef(null);
 const dismissed=React.useRef(null),previousScope=React.useRef(null),snapOwner=React.useRef(null),previousReset=React.useRef(null);
 const scope=JSON.stringify([s.ownerSession?.userId,s.cloudWorkspace?.businessId,s.screen]),geometry=JSON.stringify([bounds?.width,bounds?.height]);
 const edge=getAppearance().orbEdge,orbY=getAppearance().orbY??1,reset=getAppearance().orbReset||0,stamp=scope+geometry+String(layoutVersion)+':'+reset;
 live.current={scope,stamp,s,bounds,obstacles,ready};
 const current=()=>alive.current&&live.current.stamp===stamp&&live.current.ready;
 const stop=()=>{snap.current?.stop?.();x?.stopAnimation?.();y?.stopAnimation?.();};
 const move=point=>{if(!current()||!point)return;last.current=point;if(x&&y){x.setValue(point.x);y.setValue(point.y);}else setFallback(point);};
 const settle=point=>{
  if(!current())return null;stop();last.current=point;
  if(!point){setHidden(true);return null;}setHidden(false);
  if(x&&y&&policy.enabled){const jobs=[Animated.timing(x,{toValue:point.x,duration:200,useNativeDriver:true,isInteraction:false}),Animated.timing(y,{toValue:point.y,duration:200,useNativeDriver:true,isInteraction:false})];const job={start:()=>jobs.forEach(j=>j.start()),stop:()=>jobs.forEach(j=>j.stop())};snap.current=job;job.start();return job;}
  move(point);return null;
 };
 React.useEffect(()=>{alive.current=true;return()=>{alive.current=false;stop();};},[]);
 React.useEffect(()=>{
  const owner=snapOwner.current;if(owner&&owner.stamp===stamp&&owner.edge===edge&&owner.orbY===orbY&&owner.obstacles===obstacles&&owner.enabled===policy.enabled&&ready){snapOwner.current=null;return;}snapOwner.current=null;
  stop();drag.current=drag.current||!!start.current;start.current=null;setEngaged(false);
  if(previousReset.current!==reset){previousReset.current=reset;last.current=null;dismissed.current=null;}
  if(previousScope.current!==scope){previousScope.current=scope;last.current=null;}
  if(dismissed.current===scope){setHidden(true);return;}
  const b=floatingBounds(bounds);if(!ready||!b){setHidden(true);return;}
  const preferred=preferredFloatingOrb(bounds,edge,orbY);
  const point=parkFloatingOrb(preferred,bounds,obstacles,edge);const owned=settle(point);
  return()=>owned?.stop();
 },[stamp,edge,orbY,ready,obstacles,policy.enabled]);
 const responder=React.useMemo(()=>{
  const should=(_,g)=>current()&&floatingDrag(g.dx,g.dy);
  return PanResponder?.create?.({
   onMoveShouldSetPanResponder:should,onMoveShouldSetPanResponderCapture:should,
   onPanResponderGrant:()=>{if(!current())return;stop();drag.current=true;setEngaged(true);const token={...last.current,moved:false};start.current=token;for(const [axis,value] of [['x',x],['y',y]])value?.stopAnimation?.(v=>{if(current()&&start.current===token&&!token.moved&&Number.isFinite(v))token[axis]=v;});},
   onPanResponderMove:(_,g)=>{if(!current()||![g.dx,g.dy].every(Number.isFinite)||!start.current)return;drag.current=true;start.current.moved=true;move(clampFloatingOrb({x:start.current.x+g.dx,y:start.current.y+g.dy},live.current.bounds));},
   onPanResponderRelease:(_,g)=>{if(!current())return;const point=start.current?clampFloatingOrb({x:start.current.x+(Number.isFinite(g.dx)?g.dx:0),y:start.current.y+(Number.isFinite(g.dy)?g.dy:0)},live.current.bounds):last.current;const intent=floatingIntent(point,live.current.bounds),next=parkFloatingOrb(point,live.current.bounds,live.current.obstacles,intent?.edge);if(intent){snapOwner.current={stamp,...intent,obstacles:live.current.obstacles,enabled:policy.enabled};retainOrbPosition(intent);}settle(next);start.current=null;setEngaged(false);},
   onPanResponderTerminationRequest:()=>true,
   onPanResponderTerminate:()=>{if(!current())return;drag.current=true;start.current=null;setEngaged(false);settle(parkFloatingOrb(preferredFloatingOrb(live.current.bounds,getAppearance().orbEdge,getAppearance().orbY),live.current.bounds,live.current.obstacles,getAppearance().orbEdge));}
  })?.panHandlers||{};
 },[stamp,policy.enabled,x,y]);
 const action=event=>{if(!current())return;const name=event.nativeEvent.actionName,b=floatingBounds(live.current.bounds);if(!b||!['moveLeft','moveRight','moveUp','moveDown','reset','dismiss'].includes(name))return;if(name==='dismiss'){dismissed.current=scope;stop();setHidden(true);return;}drag.current=false;start.current=null;setEngaged(false);const p=last.current||{x:b.right,y:b.bottom},desired={x:name==='reset'?b.right:name==='moveLeft'?b.left:name==='moveRight'?b.right:p.x,y:name==='moveUp'?p.y-72:name==='moveDown'?p.y+72:name==='reset'?b.bottom:p.y};const next=parkFloatingOrb(desired,live.current.bounds,live.current.obstacles,name==='moveLeft'?'left':name==='moveRight'?'right':undefined);const intent=floatingIntent(desired,live.current.bounds);if(intent){snapOwner.current={stamp,...intent,obstacles:live.current.obstacles,enabled:policy.enabled};retainOrbPosition(intent);}settle(next);};
 if(!ready||hidden||!floatingBounds(bounds)||!last.current)return null;
 const Surface=Animated?.View||View;
 return <Surface {...responder} onTouchStart={()=>{if(current()&&!start.current){drag.current=false;setEngaged(true);}}} onTouchEnd={()=>{if(current())setEngaged(false);}} onTouchCancel={()=>{if(current()){drag.current=true;start.current=null;setEngaged(false);settle(parkFloatingOrb(preferredFloatingOrb(live.current.bounds,getAppearance().orbEdge,getAppearance().orbY),live.current.bounds,live.current.obstacles,getAppearance().orbEdge));}}} style={{position:'absolute',width:48,height:48,left:x?0:fallback?.x??last.current.x,top:y?0:fallback?.y??last.current.y,zIndex:20,opacity:engaged?1:.64,...x&&y?{transform:[{translateX:x},{translateY:y}]}:{}}}>
  <BusyOrb size={48} ambient accessibilityActions={[{name:'moveLeft',label:'Move BUSY left'},{name:'moveRight',label:'Move BUSY right'},{name:'moveUp',label:'Move BUSY up'},{name:'moveDown',label:'Move BUSY down'},{name:'reset',label:'Move BUSY to a safe bottom corner'},{name:'dismiss',label:'Hide floating BUSY on this screen'}]} onAccessibilityAction={action} state={orbState({status:s.busyCommandStatus,error:s.busyCommandError})} onPress={()=>{if(current()&&!drag.current)live.current.s.openTalkToBusy(true);}}/>
 </Surface>;
}
