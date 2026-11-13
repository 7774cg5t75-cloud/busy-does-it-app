import React from 'react';
import {View,Text,Pressable,ScrollView,useWindowDimensions} from 'react-native';
import {appColors as C} from '../theme/appearance.mjs';
import {interiorMood,segmentWidths,interiorType as T} from '../theme/interior.mjs';
import {ChromeIcon,BusyBrandStar} from './PremiumAtmosphere';
import {OrbSafeRegion} from './FloatingOrbAvoidance';
export const InteriorContext=React.createContext(null);
export function InteriorHeader({s,title,subtitle,brandCue,noBack}){
 const mood=interiorMood(s.screen),accent=C[mood.accent];
 return <View style={{marginBottom:14}}>
  <View style={{flexDirection:'row',alignItems:'center',gap:10,marginBottom:8}}>
   {!noBack&&s.history?.length>0?<OrbSafeRegion><Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={s.back} style={({pressed})=>({width:48,minHeight:48,borderRadius:16,alignItems:'center',justifyContent:'center',backgroundColor:pressed?C.blueSoft:C.card,borderWidth:1,borderColor:C.border})}><ChromeIcon name="back" size={20} color={C.ink}/></Pressable></OrbSafeRegion>:null}
   <View style={{width:40,height:40,borderRadius:14,backgroundColor:C.surface,borderColor:accent,borderWidth:1,alignItems:'center',justifyContent:'center'}}><ChromeIcon name={mood.icon} size={21} color={accent}/></View>
   <View style={{flex:1,minWidth:0}}><Text accessibilityRole="header" style={{fontSize:T.title,lineHeight:T.titleLine,fontWeight:'700',letterSpacing:-.5,color:C.ink}}>{title||'Busy Does It'}</Text></View>
   <BusyBrandStar size={20}/>
  </View>
  {subtitle?<Text style={{fontSize:T.body,lineHeight:T.bodyLine,color:C.muted}}>{subtitle}</Text>:null}
  {brandCue?<Text style={{fontSize:12,lineHeight:18,color:accent,marginTop:5}}>{brandCue}</Text>:null}
 </View>;
}
export function SegmentedControl({items,value,onChange,label='Choose a view'}){
 const {width,fontScale}=useWindowDimensions(),widths=segmentWidths(items.map(x=>x.label||x),width,fontScale),mood=React.useContext(InteriorContext),accent=C[mood?.accent||'blueText'];
 return <ScrollView horizontal showsHorizontalScrollIndicator contentContainerStyle={{gap:4,padding:4}} style={{flexGrow:0,marginBottom:12,borderRadius:18,backgroundColor:C.input,borderWidth:1,borderColor:C.border}} accessibilityLabel={label}>
  {items.map((item,i)=>{const text=item.label||item,key=item.key||item,selected=value===key;return <OrbSafeRegion key={key}><Pressable accessibilityRole="tab" accessibilityLabel={text} accessibilityState={{selected}} onPress={()=>onChange(key)} style={({pressed})=>({width:widths[i],minHeight:48,paddingHorizontal:12,paddingVertical:12,borderRadius:14,alignItems:'center',justifyContent:'center',backgroundColor:selected||pressed?C.surface:'transparent',borderWidth:1,borderColor:selected?accent:'transparent'})}><Text numberOfLines={1} style={{fontSize:13,lineHeight:20,fontWeight:'700',color:selected?C.ink:C.muted}}>{text}</Text></Pressable></OrbSafeRegion>;})}
 </ScrollView>;
}
export function EmptyState({title,body,actionLabel,onAction}){
 const mood=React.useContext(InteriorContext),accent=C[mood?.accent||'blueText'];
 return <View style={{padding:18,borderRadius:20,backgroundColor:C.card,borderWidth:1,borderColor:C.border,marginBottom:14}}><View style={{flexDirection:'row',alignItems:'center',gap:9,marginBottom:5}}><ChromeIcon name="spark" color={accent} size={17}/><Text accessibilityRole="header" style={{flex:1,fontSize:16,lineHeight:23,fontWeight:'700',color:C.ink}}>{title}</Text></View><Text style={{fontSize:14,lineHeight:21,color:C.muted}}>{body}</Text>{actionLabel&&onAction?<Pressable accessibilityRole="button" onPress={onAction} style={({pressed})=>({minHeight:48,justifyContent:'center',marginTop:6,opacity:pressed?.7:1})}><Text style={{fontSize:14,lineHeight:21,fontWeight:'700',color:accent}}>{actionLabel}</Text></Pressable>:null}</View>;
}
