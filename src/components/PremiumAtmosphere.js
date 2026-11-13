import React from 'react';
import {View} from 'react-native';
import Svg,{Defs,RadialGradient,LinearGradient,Stop,Ellipse,Circle,Path} from 'react-native-svg';
import {appColors as C,getAppearance,moodForScreen} from '../theme/appearance.mjs';
let sequence=0;
// Static, decorative chrome only; no animated stars, images, business facts or IO.
export function PremiumAtmosphere({screen='home'}){
 const id=React.useRef(null);if(!id.current)id.current='atmosphere-'+(++sequence);
 const night=getAppearance().resolved==='midnight',prefix=id.current,home=screen==='home';
 return <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{position:'absolute',top:0,left:0,right:0,height:340}}><Svg width="100%" height="100%" viewBox="0 0 400 340" preserveAspectRatio="none">
  <Defs><RadialGradient id={prefix+'a'}><Stop offset="0" stopColor={C[moodForScreen(screen)]} stopOpacity={night?(home?.26:.18):.07}/><Stop offset="1" stopColor={C.bg} stopOpacity="0"/></RadialGradient><RadialGradient id={prefix+'b'}><Stop offset="0" stopColor={C.blueText} stopOpacity={night?(home?.19:.13):.04}/><Stop offset="1" stopColor={C.bg} stopOpacity="0"/></RadialGradient></Defs>
  <Ellipse cx="345" cy="80" rx="230" ry="190" fill={'url(#'+prefix+'a)'}/><Ellipse cx="30" cy="150" rx="240" ry="180" fill={'url(#'+prefix+'b)'}/>
  {home?<>
   <Path d="M15 48C72 5 155 30 208 92S332 188 386 103M28 185C102 169 135 88 209 92" fill="none" stroke={C.cyan} strokeWidth=".65" opacity={night?.23:.1}/>
   <Path d="M208 92C264 49 344 43 386 103" fill="none" stroke={C.violet} strokeWidth=".8" opacity={night?.26:.1}/>
   {[[28,185],[208,92],[386,103],[75,33]].map(([cx,cy],i)=><Circle key={'connected'+i} cx={cx} cy={cy} r={i===1?2:1.3} fill={i%2?C.violet:C.cyan} opacity={night?.65:.35}/>)}
  </>:null}
  {night?[[18,30],[346,24],[377,115],[42,202],[310,190],[366,256]].map(([cx,cy],i)=><Circle key={i} cx={cx} cy={cy} r={i%2?1:1.5} fill={C.blueText} opacity=".32"/>):null}
 </Svg></View>;
}
export function ChromeIcon({name='home',size=22,color=C.muted}){
 const paths={website:'M3 4h18v16H3zM3 8h18',app:'M7 2h10v20H7zM10 18h4',content:'M4 3h16v18H4zM7 16l4-5 3 3 3-4M8 7h1',growth:'M4 18l5-6 4 2 7-10M15 4h5v5',paid:'M4 20v-6h3v6M10 20V9h3v11M16 20V3h3v17',home:'M3 11 12 3l9 8M6 10v11h12V10M10 21v-7h4v7',work:'M3 7h18v14H3zM8 7V3h8v4M3 12h18M10 11v4h4v-4',results:'M4 21V12h4v9M10 21V7h4v14M16 21V3h4v18',settings:'M12 3v3m0 12v3M3 12h3m12 0h3M6 6l2 2m8 8 2 2M6 18l2-2M16 8l2-2',back:'M15 5l-7 7 7 7',spark:'M12 1l3 8 8 3-8 3-3 8-3-8-8-3 8-3z'};
 return <Svg width={size} height={size} viewBox="0 0 24 24" accessibilityElementsHidden><Path d={paths[name]||paths.home} fill={name==='spark'?color:'none'} stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>{name==='settings'?<Circle cx="12" cy="12" r="5" stroke={color} strokeWidth="1.6" fill="none"/>:null}</Svg>;
}

// The original cyan-star mark, rendered as feathered SVG light rather than an
// image/shadow rectangle. Static and non-interactive in every motion policy.
export function BusyBrandStar({size=32}){
 const identity=React.useRef(null);if(!identity.current)identity.current='busy-brand-light-'+(++sequence);
 const id=identity.current,night=getAppearance().resolved==='midnight';
 return <Svg width={size} height={size} viewBox="0 0 40 40" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
  <Defs>
   <RadialGradient id={id+'halo'}><Stop offset="0" stopColor={C.cyan} stopOpacity={night?.58:.2}/><Stop offset=".4" stopColor={C.cyan} stopOpacity={night?.2:.08}/><Stop offset="1" stopColor={C.cyan} stopOpacity="0"/></RadialGradient>
   <LinearGradient id={id+'star'} x1="0" y1="0" x2="1" y2="1"><Stop offset="0" stopColor={night?'#D9FFFF':C.cyan}/><Stop offset=".45" stopColor={C.cyan}/><Stop offset="1" stopColor={C.blueText}/></LinearGradient>
  </Defs>
  <Circle cx="20" cy="20" r="20" fill={'url(#'+id+'halo)'}/>
  <Path d="M20 3l4.5 12.5L37 20l-12.5 4.5L20 37l-4.5-12.5L3 20l12.5-4.5z" fill={'url(#'+id+'star)'}/>
  <Path d="M20 9v9L11 20l9 1v10l1-10 8-1-8-2z" fill={night?'#ECFFFF':C.cyan} opacity=".75"/>
 </Svg>;
}
