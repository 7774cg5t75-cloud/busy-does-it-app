import React from 'react';
import {View,Text,Pressable} from 'react-native';
import {useAppearance} from '../theme/useAppearance';
import {appColors as C} from '../theme/appearance.mjs';
export function AppearanceChoices({firstRun=false}){
 const appearance=useAppearance();if(firstRun&&appearance.chosen)return null;
 return <View style={{backgroundColor:C.card,borderWidth:1,borderColor:C.border,borderRadius:22,padding:18,marginBottom:16}}>
  <Text style={{color:C.ink,fontSize:20,fontWeight:'700'}}>Appearance</Text>
  <Text style={{color:C.muted,lineHeight:21,marginVertical:8}}>Your BUSY workspace, your light. This device only; your business branding stays unchanged.</Text>
  {[['midnight','Midnight','Our signature midnight navy.'],['daylight','Daylight','Clear, calm and light.'],['automatic','Automatic','Follows your device’s light or dark setting.']].map(([mode,label,detail])=><Pressable key={mode} accessibilityRole="radio" accessibilityState={{checked:appearance.mode===mode}} accessibilityLabel={label+' appearance'} onPress={()=>appearance.choose(mode)} style={{minHeight:62,padding:12,marginTop:8,borderRadius:14,borderWidth:1,borderColor:appearance.mode===mode?C.blueText:C.controlBorder,backgroundColor:appearance.mode===mode?C.blueSoft:C.card}}><Text style={{color:C.ink,fontWeight:'700'}}>{label}{appearance.mode===mode?' · selected':''}</Text><Text style={{color:C.muted,marginTop:4}}>{detail}</Text></Pressable>)}
  <Text accessibilityLiveRegion="polite" style={{color:C.muted,fontSize:12,lineHeight:18,marginTop:12}}>{appearance.persistence==='unconfirmed'?'Your choice is active, but device storage was not confirmed.':appearance.persistence==='saving'?'Keeping this choice on your device…':'You can change this any time in Settings.'}</Text>
  <Pressable accessibilityRole="button" onPress={firstRun?appearance.skip:appearance.resetOrb} style={{minHeight:48,justifyContent:'center'}}><Text style={{color:C.blueText,fontWeight:'700'}}>{firstRun?'Skip for now':'Reset BUSY mini-orb position'}</Text></Pressable>
 </View>;
}
