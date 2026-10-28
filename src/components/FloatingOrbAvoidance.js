import React from 'react';
import {View} from 'react-native';
// Shell-local layout observation only. No account state, persistence or actions.
export const FloatingOrbContext=React.createContext(null);
export function useFloatingOrbAvoidance(){
 const context=React.useContext(FloatingOrbContext),ref=React.useRef(null),key=React.useRef({});
 const read=React.useCallback(()=>{
  if(!context)return;
  const revision=context.version(),sequence=context.pending(key.current);
  if(!ref.current?.measureInWindow){context.report(key.current,null,revision,sequence);return;}
  ref.current.measureInWindow((x,y,width,height)=>context.report(key.current,{x,y,width,height},revision,sequence));
 },[context]);
 React.useEffect(()=>context?.register(key.current,read),[context,read]);
 return {ref,onLayout:read,collapsable:false};
}
export function OrbSafeRegion({children,style}){const boundary=useFloatingOrbAvoidance();return <View {...boundary} style={style}>{children}</View>;}
export function useFloatingOrbLayout(scope){
 const live=React.useRef(null),alive=React.useRef(true),root=React.useRef(null),[model,setModel]=React.useState(null);
 const epoch=React.useMemo(()=>({scope,rows:new Map(),viewport:null,origin:null,scrolling:false,revision:0,readSequence:0}),[scope]);live.current=epoch;
 const current=()=>alive.current&&live.current===epoch;
 const publish=()=>{
  if(!current())return;
  const ready=!!epoch.viewport&&!!epoch.origin&&!epoch.scrolling&&[...epoch.rows.values()].every(row=>row.rect!==null);
  const obstacles=ready?[...epoch.rows.values()].map(({rect})=>({...rect,x:rect.x-epoch.origin.x,y:rect.y-epoch.origin.y})):[];
  const stamp=JSON.stringify([epoch.revision,ready,epoch.viewport,obstacles]);
  setModel(previous=>previous?.epoch===epoch&&previous.stamp===stamp?previous:{epoch,stamp,ready,version:epoch.revision,bounds:epoch.viewport,obstacles});
 };
 const context=React.useMemo(()=>({
  version:()=>epoch.revision,
  pending(key){if(!current()||!epoch.rows.has(key))return null;const row=epoch.rows.get(key);row.rect=null;row.sequence=++epoch.readSequence;publish();return row.sequence;},
  report(key,rect,revision,sequence){if(!current()||revision!==epoch.revision||!epoch.rows.has(key)||sequence!==epoch.rows.get(key).sequence)return;epoch.rows.get(key).rect=rect&&[rect.x,rect.y,rect.width,rect.height].every(Number.isFinite)?rect:null;publish();},
  register(key,read){if(!current())return;const row={read,rect:null,sequence:0};epoch.rows.set(key,row);publish();read();return()=>{if(!current()||epoch.rows.get(key)!==row)return;epoch.rows.delete(key);publish();};}
 }),[epoch]);
 const refresh=()=>{if(!current())return;epoch.scrolling=false;epoch.revision++;for(const row of epoch.rows.values())row.rect=null;publish();for(const row of epoch.rows.values())row.read();};
 const onLayout=e=>{
  if(!current())return;const {width,height}=e.nativeEvent.layout;
  if(!Number.isFinite(width)||!Number.isFinite(height))return;
  epoch.viewport={width,height};const viewport=epoch.viewport;epoch.origin=null;epoch.revision++;publish();
  root.current?.measureInWindow?.((x,y)=>{if(!current()||epoch.viewport!==viewport||![x,y].every(Number.isFinite))return;epoch.origin={x,y};refresh();});
 };
 React.useEffect(()=>{alive.current=true;return()=>{alive.current=false;};},[]);
 return {context,root,onLayout,version:model?.epoch===epoch?model.version:0,ready:model?.epoch===epoch&&model.ready,bounds:model?.epoch===epoch?model.bounds:null,obstacles:model?.epoch===epoch?model.obstacles:[],startScroll:()=>{if(current()){epoch.scrolling=true;epoch.revision++;publish();}},endScroll:refresh};
}
