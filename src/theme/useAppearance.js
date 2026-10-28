import React from 'react';
import {Appearance} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {getAppearance,subscribeAppearance,setDeviceScheme,hydrateAppearance,updateAppearance,requestOrbReset} from './appearance.mjs';
// One device preference source, shared with the original palette/styles. No provider/remount.
export function useAppearance(){
 const [value,setValue]=React.useState(getAppearance);
 React.useEffect(()=>subscribeAppearance(setValue),[]);
 return {...value,choose:mode=>updateAppearance({mode,chosen:true},AsyncStorage.setItem),skip:()=>updateAppearance({chosen:true},AsyncStorage.setItem),resetOrb:()=>{requestOrbReset();return updateAppearance({orbEdge:'right',orbY:1},AsyncStorage.setItem);}};
}
export function useAppearanceDevice(){const value=useAppearance();React.useEffect(()=>{setDeviceScheme(Appearance?.getColorScheme?.());const subscription=Appearance?.addChangeListener?.(({colorScheme})=>setDeviceScheme(colorScheme));hydrateAppearance(AsyncStorage.getItem);return()=>subscription?.remove();},[]);return value;}
export const retainOrbEdge=edge=>updateAppearance({orbEdge:edge},AsyncStorage.setItem);

export const retainOrbPosition=({edge,position,orbY})=>updateAppearance({orbPlacement:{version:1,edge,position:position??orbY},...(['left','right'].includes(edge)?{orbEdge:edge,orbY:position??orbY}:{})},AsyncStorage.setItem);
