import {workspaceDensity} from '../theme/interaction.mjs';
import {CanonicalWorkEntry} from './CanonicalWorkEntry';
import Svg,{Path} from 'react-native-svg';
import {appColors as C} from '../theme/appearance.mjs';
import React from 'react';
import {View,Text,Pressable,useWindowDimensions} from 'react-native';

// Navigation through the existing shell only. These labels do not grant capability or authority.
export function HomeCoreAreas({s}){
 const density=workspaceDensity(useWindowDimensions());
 const scope=JSON.stringify([s.ownerSession?.userId,s.cloudWorkspace?.businessId]);
 const live=React.useRef({scope,s});live.current={scope,s};
 const [paidScope,setPaidScope]=React.useState(null);
 const run=action=>()=>{if(live.current.scope===scope)action(live.current.s);};
 const areas=[
  ['Website Builder','Create and edit your business website.',state=>state.openWebsiteBuilder()],
  ['App Builder','Build your customer services and enquiry app.',state=>state.openMiniAppBuilder()],
  ['Content Creator','Prepare posts and review your content drafts.',state=>state.openSocialCentre()],
  ['Get More Customers','Review growth ideas and saved marketing projects.',state=>state.go('growthCommandCentre')],
  ['Work & Customers','Manage customers, work and follow-ups.',state=>state.jump('workHub','Work')],
  ['Get Paid','Review quote assistance. Payments are not enabled here.',()=>setPaidScope(scope)],
 ];
 return <View accessibilityLabel="Your BUSY tools">
  <View style={{flexDirection:'row',flexWrap:'wrap',justifyContent:'space-between',gap:10}}>
   {areas.map(([title,description,action],index)=><Pressable key={title} accessibilityRole="button" accessibilityLabel={title} accessibilityHint={description} onPress={run(action)} style={({pressed})=>({width:density.tileWidth,minHeight:78,padding:10,flexDirection:'row',alignItems:'center',gap:8,borderWidth:1,borderColor:pressed?C.blueText:C.border,borderRadius:14,backgroundColor:pressed?C.blueSoft:C.card})}>
    <View style={{width:30,height:34,borderRadius:9,alignItems:'center',justifyContent:'center',backgroundColor:C.surface}}><Svg width={22} height={22} viewBox="0 0 32 32" accessibilityElementsHidden><Path d={['M4 7h24v19H4zM4 12h24M9 9h1m3 0h1','M10 3h12v26H10zM14 25h4','M7 24l2-7L23 3l6 6-14 14zM9 17l6 6M5 29h22','M4 25l8-9 6 4L28 6M20 6h8v8','M4 10h24v17H4zM11 10V5h10v5M4 17h24M14 16v4h4v-4','M8 3h12l6 6v20H8zM20 3v7h6M12 16h10M12 21h8'][index]} fill="none" stroke={[C.cyan,C.violet,C.rose,C.violet,C.cyan,C.green][index]} strokeWidth={1.7} strokeLinejoin="round" strokeLinecap="round"/></Svg></View>
    <View style={{flex:1,minWidth:0}}>
    <Text style={{color:C.ink,fontSize:13,lineHeight:18,marginTop:0,fontWeight:'700'}}>{title}</Text>
    <Text style={{color:C.muted,fontSize:11,lineHeight:15,marginTop:3}}>{["Create your website","Build your customer app","Prepare your content","Review credible opportunities","Customers and follow-ups","Prepare and review quotes"][index]}</Text></View>
   </Pressable>)}
  </View>
  {paidScope===scope?<View accessibilityLiveRegion="polite" style={{marginTop:14}}>
   <Text style={{color:C.ink,fontSize:13,lineHeight:18,marginTop:0,fontWeight:'700'}}>Get Paid · available now</Text>
   <Text style={{color:C.muted,fontSize:14,lineHeight:21,marginVertical:8}}>Open a saved business customer in Work to prepare and review a quote. Busy does not create an invoice, request payment or collect money from this shortcut.</Text>
   <Pressable accessibilityRole="button" accessibilityLabel="Open Work for quote assistance" onPress={run(state=>state.jump('workHub','Work'))} style={{paddingVertical:14}}><Text style={{color:C.ink,fontWeight:'700'}}>Open Work for quote assistance</Text></Pressable>
   <CanonicalWorkEntry s={s}/>
   <Pressable accessibilityRole="button" accessibilityLabel="Close Get Paid explanation" onPress={run(()=>setPaidScope(null))} style={{paddingVertical:14}}><Text style={{color:C.muted}}>Close</Text></Pressable>
  </View>:null}
 </View>;
}
