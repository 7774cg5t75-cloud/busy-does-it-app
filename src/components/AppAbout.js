import {useFloatingOrbAvoidance} from './FloatingOrbAvoidance';
import React from 'react';
import {View,Text,Pressable,Platform} from 'react-native';
import Constants from 'expo-constants';
import {nativeApplicationVersion,nativeBuildVersion} from 'expo-application';
import {appBuildIdentity} from '../core/appBuildIdentity.mjs';
import {appColors as C} from '../theme/appearance.mjs';
export function AppAbout(){
 const avoidance=useFloatingOrbAvoidance();
 const [open,setOpen]=React.useState(false),info=appBuildIdentity({nativeVersion:nativeApplicationVersion,nativeBuild:nativeBuildVersion,config:Constants.expoConfig});
 return <View style={{marginVertical:12,borderWidth:1,borderColor:C.border,borderRadius:14,backgroundColor:C.card,padding:12}}>
  <Pressable {...avoidance} accessibilityRole="button" accessibilityIdentifier="busy-about-toggle" accessibilityLabel="About Busy Does It" accessibilityState={{expanded:open}} onPress={()=>setOpen(v=>!v)} style={{minHeight:48,justifyContent:'center'}}><Text style={{color:C.ink,fontSize:15,fontWeight:'600'}}>About Busy Does It {open?'−':'+'}</Text></Pressable>
  {open?<View accessibilityIdentifier="busy-about-details">{[['Application version',info.version],[Platform.OS==='ios'?'iOS build':'Native build',info.build],['Source commit',info.source],['Environment',info.environment]].map(([label,value])=><View key={label} style={{marginBottom:10}}><Text style={{color:C.muted,fontSize:12,lineHeight:17}}>{label}</Text><Text selectable style={{color:C.ink,fontSize:13,lineHeight:19,flexShrink:1}}>{value}</Text></View>)}
   {info.sourceStatus!=='recorded'?<Text style={{color:C.amber,fontSize:12,lineHeight:18}}>{info.sourceStatus==='local-changes'?'Local changes were present when this bundle was prepared.':info.sourceStatus==='mismatch'?'Source metadata did not match the checkout.':'Source identity was not recorded for this installation.'}</Text>:null}
   <Text style={{color:C.muted,fontSize:12,lineHeight:18}}>Identifies this installed binary and bundle, not the latest GitHub version or live-service availability.</Text>
  </View>:null}
 </View>;
}
