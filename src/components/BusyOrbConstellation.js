import React from 'react';
import {View} from 'react-native';
import Svg,{Defs,RadialGradient,LinearGradient,Stop,Path,Circle,Ellipse} from 'react-native-svg';
import {getAppearance} from '../theme/appearance.mjs';
let sequence=0;
// A deliberate, static orbital composition. No particles, timers, hit targets or
// implied processing; the original orb owns the single native breathing loop.
export function BusyOrbConstellation(){
 const identity=React.useRef(null);if(!identity.current)identity.current='busy-orbit-'+(++sequence);
 const id=identity.current,night=getAppearance().resolved==='midnight';
 const nodes=[[28,88,2,'#36DCFF'],[55,142,1.7,'#6B8FFF'],[92,46,1.8,'#32EDFF'],[265,43,1.7,'#6D9FFF'],[310,107,2.5,'#FF59D5'],[279,145,1.8,'#796BFF'],[211,157,1.5,'#20DFFF']];
 return <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{position:'absolute',inset:0}}><Svg width="100%" height="100%" viewBox="0 0 340 184">
  <Defs>
   <RadialGradient id={id+'haze'}><Stop offset="0" stopColor="#215EFF" stopOpacity={night?.24:.08}/><Stop offset=".6" stopColor="#7238DC" stopOpacity={night?.12:.04}/><Stop offset="1" stopColor="#215EFF" stopOpacity="0"/></RadialGradient>
   <LinearGradient id={id+'track'}><Stop offset="0" stopColor="#16D8FF" stopOpacity=".22"/><Stop offset=".3" stopColor="#35BFFF" stopOpacity=".82"/><Stop offset=".7" stopColor="#8467FF" stopOpacity=".68"/><Stop offset="1" stopColor="#FF4ACB" stopOpacity=".4"/></LinearGradient>
   {nodes.map(([, , ,color],i)=><RadialGradient key={i} id={id+'node'+i}><Stop offset="0" stopColor={color} stopOpacity=".8"/><Stop offset=".25" stopColor={color} stopOpacity=".36"/><Stop offset="1" stopColor={color} stopOpacity="0"/></RadialGradient>)}
  </Defs>
  <Ellipse cx="170" cy="96" rx="169" ry="91" fill={'url(#'+id+'haze)'}/>
  <Path d="M28 88C53 20 256 17 310 107C330 170 91 184 55 142C15 113 37 76 92 46" fill="none" stroke={'url(#'+id+'track)'} strokeWidth="1"/>
  <Path d="M55 142C106 156 262 8 296 65C336 122 185 167 92 46M28 88C99 46 248 39 279 145" fill="none" stroke={'url(#'+id+'track)'} strokeWidth=".75" opacity=".8"/>
  {nodes.map(([cx,cy,r,color],i)=><React.Fragment key={i}><Circle cx={cx} cy={cy} r={r*6} fill={'url(#'+id+'node'+i+')'}/><Circle cx={cx} cy={cy} r={r} fill={color}/><Circle cx={cx} cy={cy} r={r*.4} fill={night?'#F1FCFF':'#284A81'}/></React.Fragment>)}
 </Svg></View>;
}
