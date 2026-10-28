import {workspaceDensity} from '../theme/interaction.mjs';
import {CanonicalWorkEntry} from './CanonicalWorkEntry';
import Svg,{Path,Defs,RadialGradient,Stop,Circle} from 'react-native-svg';
import {appColors as C,getAppearance} from '../theme/appearance.mjs';
import React from 'react';
import {View,Text,Pressable,useWindowDimensions} from 'react-native';

let toolSequence=0;
// Navigation through the existing shell only. These labels do not grant capability or authority.
export function HomeCoreAreas({s}){
 const identity=React.useRef(null);if(!identity.current)identity.current='home-tools-'+(++toolSequence);
 const density=workspaceDensity(useWindowDimensions());
 const scope=JSON.stringify([s.ownerSession?.userId,s.cloudWorkspace?.businessId]);
 const live=React.useRef({scope,s});live.current={scope,s};
 const [paidScope,setPaidScope]=React.useState(null);
 const run=action=>()=>{if(live.current.scope===scope)action(live.current.s);};
 const accents=getAppearance().resolved==='midnight'?['#28DFFF','#C077FF','#FF9B53','#F267D9','#40C7FF','#54E7AC']:[C.cyan,C.violet,C.amber,C.rose,C.blueText,C.green];
 const areas=[
  ['Website Builder','Create and edit your business website.',state=>state.openWebsiteBuilder()],
  ['App Builder','Build your customer services and enquiry app.',state=>state.openMiniAppBuilder()],
  ['Content Creator','Prepare posts and review your content drafts.',state=>state.openSocialCentre()],
  ['Get More Customers','Review growth ideas and saved marketing projects.',state=>state.go('growthCommandCentre')],
  ['Work & Customers','Manage customers, work and follow-ups.',state=>state.jump('workHub','Work')],
  ['Get Paid','Review quote assistance. Payments are not enabled here.',()=>setPaidScope(scope)],
 ];
 return <View accessibilityLabel="Your BUSY tools">
  <View style={{flexDirection:'row',flexWrap:'wrap',justifyContent:'space-between',gap:6}}>
   {areas.map(([title,description,action],index)=><Pressable key={title} accessibilityRole="button" accessibilityLabel={title} accessibilityHint={description} onPress={run(action)} style={({pressed})=>({width:density.tileWidth,minHeight:64,padding:7,flexDirection:'row',alignItems:'center',gap:6,borderWidth:1,borderColor:pressed?accents[index]:C.border,borderRadius:14,backgroundColor:pressed?C.blueSoft:C.card,overflow:'hidden'})}>
    <View pointerEvents="none" style={{position:'absolute',left:0,top:12,bottom:12,width:2,borderRadius:2,backgroundColor:accents[index],opacity:.65}}/>
    <View style={{width:30,height:36,borderRadius:9,alignItems:'center',justifyContent:'center',backgroundColor:C.surface,shadowColor:accents[index],shadowOpacity:.3,shadowRadius:8,shadowOffset:{width:0,height:0}}}><Svg width={28} height={32} viewBox="0 0 32 32" accessibilityElementsHidden><Defs><RadialGradient id={identity.current+index}><Stop offset="0" stopColor={accents[index]} stopOpacity=".62"/><Stop offset="1" stopColor={accents[index]} stopOpacity="0"/></RadialGradient></Defs><Circle cx="16" cy="16" r="16" fill={'url(#'+identity.current+index+')'}/><Path d={['M4 7h24v19H4zM4 12h24M9 9h1m3 0h1','M10 3h12v26H10zM14 25h4','M7 24l2-7L23 3l6 6-14 14zM9 17l6 6M5 29h22','M4 25l8-9 6 4L28 6M20 6h8v8','M4 10h24v17H4zM11 10V5h10v5M4 17h24M14 16v4h4v-4','M8 3h12l6 6v20H8zM20 3v7h6M12 16h10M12 21h8'][index]} fill="none" stroke={accents[index]} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round"/></Svg></View>
    <View style={{flex:1,minWidth:0}}>
    <Text style={{color:C.ink,fontSize:11.5,lineHeight:15,marginTop:0,fontWeight:'600'}}>{title}</Text>
    <Text style={{color:C.muted,fontSize:11,lineHeight:14,marginTop:2}}>{["Create your website","Build your app","Posts and drafts","Growth ideas","Customers and work","Review quotes"][index]}</Text></View>
   </Pressable>)}
  </View>
  {paidScope===scope?<View accessibilityLiveRegion="polite" style={{marginTop:14}}>
   <Text style={{color:C.ink,fontSize:16,lineHeight:23,marginTop:8,fontWeight:'700'}}>Get Paid · available now</Text>
   <Text style={{color:C.muted,fontSize:14,lineHeight:21,marginVertical:8}}>Open a saved business customer in Work to prepare and review a quote. Busy does not create an invoice, request payment or collect money from this shortcut.</Text>
   <Pressable accessibilityRole="button" accessibilityLabel="Open Work for quote assistance" onPress={run(state=>state.jump('workHub','Work'))} style={{paddingVertical:14}}><Text style={{color:C.ink,fontWeight:'700'}}>Open Work for quote assistance</Text></Pressable>
   <CanonicalWorkEntry s={s}/>
   <Pressable accessibilityRole="button" accessibilityLabel="Close Get Paid explanation" onPress={run(()=>setPaidScope(null))} style={{paddingVertical:14}}><Text style={{color:C.muted}}>Close</Text></Pressable>
  </View>:null}
 </View>;
}
