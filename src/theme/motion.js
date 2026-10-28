import React from 'react';
import {AccessibilityInfo,AppState,Animated,View} from 'react-native';
let snapshot={reduceMotion:true,active:AppState?.currentState==='active',known:false,enabled:false},generation=0,reducedRevision=0,stop=null;
const listeners=new Set();
function publish(change){const next={...snapshot,...change};next.enabled=next.known&&!next.reduceMotion&&next.active;if(Object.keys(next).every(k=>next[k]===snapshot[k]))return;snapshot=next;for(const fn of listeners)fn(next);}
function observe(){
 const ticket=++generation,revision=reducedRevision;publish({known:false,active:AppState?.currentState==='active'});
 const reduced=AccessibilityInfo?.addEventListener?.('reduceMotionChanged',value=>{reducedRevision++;publish({reduceMotion:!!value,known:true});});
 const active=AppState?.addEventListener?.('change',value=>publish({active:value==='active'}));
 try{Promise.resolve(AccessibilityInfo?.isReduceMotionEnabled?.()).then(value=>{if(ticket===generation&&revision===reducedRevision&&typeof value==='boolean')publish({reduceMotion:value,known:true});}).catch(()=>{});}catch{/* Stay still when the OS preference is unavailable. */}
 return ()=>{generation++;reduced?.remove?.();active?.remove?.();};
}
export function useMotionPolicy(){
 const [policy,setPolicy]=React.useState(()=>({...snapshot,enabled:false}));
 React.useEffect(()=>{listeners.add(setPolicy);if(listeners.size===1)stop=observe();setPolicy(snapshot);return()=>{listeners.delete(setPolicy);if(!listeners.size){stop?.();stop=null;}};},[]);
 return policy;
}
export function useMotionValue(initial=1){const value=React.useRef(null);if(!value.current&&typeof Animated?.Value==='function')value.current=new Animated.Value(initial);return value.current;}
// Immediate content/interaction; only a short opacity settling, never a delayed
// mount, business-state transition, save or callback after an animation.
export function MotionReveal({children,identity,style}){
 const policy=useMotionPolicy(),opacity=useMotionValue(1);
 React.useEffect(()=>{if(!opacity)return;opacity.stopAnimation();opacity.setValue(policy.enabled?.94:1);if(!policy.enabled)return;const animation=Animated.timing(opacity,{toValue:1,duration:150,useNativeDriver:true,isInteraction:false});animation.start();return()=>{animation.stop();opacity.stopAnimation();opacity.setValue(1);};},[identity,policy.enabled,opacity]);
 const Surface=Animated?.View||View;
 return <Surface style={[style,{opacity:opacity||1}]}>{children}</Surface>;
}
