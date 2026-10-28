import React from 'react';
import {View} from 'react-native';
import Svg,{Defs,RadialGradient,Stop,Ellipse,Circle,Path} from 'react-native-svg';
import {appColors as C,getAppearance,moodForScreen} from '../theme/appearance.mjs';
let sequence=0;
// Static, decorative chrome only; no animated stars, images, business facts or IO.
export function PremiumAtmosphere({screen='home'}){
 const id=React.useRef(null);if(!id.current)id.current='atmosphere-'+(++sequence);
 const night=getAppearance().resolved==='midnight',prefix=id.current;
 return <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{position:'absolute',top:0,left:0,right:0,height:340}}><Svg width="100%" height="100%" viewBox="0 0 400 340" preserveAspectRatio="none">
  <Defs><RadialGradient id={prefix+'a'}><Stop offset="0" stopColor={C[moodForScreen(screen)]} stopOpacity={night?.18:.07}/><Stop offset="1" stopColor={C.bg} stopOpacity="0"/></RadialGradient><RadialGradient id={prefix+'b'}><Stop offset="0" stopColor={C.blueText} stopOpacity={night?.13:.04}/><Stop offset="1" stopColor={C.bg} stopOpacity="0"/></RadialGradient></Defs>
  <Ellipse cx="345" cy="80" rx="230" ry="190" fill={'url(#'+prefix+'a)'}/><Ellipse cx="30" cy="150" rx="240" ry="180" fill={'url(#'+prefix+'b)'}/>
  {night?[[18,30],[346,24],[377,115],[42,202],[310,190],[366,256]].map(([cx,cy],i)=><Circle key={i} cx={cx} cy={cy} r={i%2?1:1.5} fill={C.blueText} opacity=".32"/>):null}
 </Svg></View>;
}
export function ChromeIcon({name='home',size=22,color=C.muted}){
 const paths={home:'M3 11 12 3l9 8M6 10v11h12V10M10 21v-7h4v7',work:'M3 7h18v14H3zM8 7V3h8v4M3 12h18M10 11v4h4v-4',results:'M4 21V12h4v9M10 21V7h4v14M16 21V3h4v18',settings:'M12 3v3m0 12v3M3 12h3m12 0h3M6 6l2 2m8 8 2 2M6 18l2-2M16 8l2-2',back:'M15 5l-7 7 7 7',spark:'M12 1l3 8 8 3-8 3-3 8-3-8-8-3 8-3z'};
 return <Svg width={size} height={size} viewBox="0 0 24 24" accessibilityElementsHidden><Path d={paths[name]||paths.home} fill={name==='spark'?color:'none'} stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>{name==='settings'?<Circle cx="12" cy="12" r="5" stroke={color} strokeWidth="1.6" fill="none"/>:null}</Svg>;
}
