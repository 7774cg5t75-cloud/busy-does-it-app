import React from 'react';
import {View,Text,Pressable} from 'react-native';

// Navigation through the existing shell only. These labels do not grant capability or authority.
export function HomeCoreAreas({s}){
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
 return <View>
  <Text style={{color:'#F4F7FE',fontSize:18,fontWeight:'700',marginBottom:12}}>Six clear choices</Text>
  <View style={{flexDirection:'row',flexWrap:'wrap',justifyContent:'space-between',gap:10}}>
   {areas.map(([title,description,action])=><Pressable key={title} accessibilityRole="button" accessibilityLabel={title} accessibilityHint={description} onPress={run(action)} style={{width:'48%',minHeight:112,padding:12,borderWidth:1,borderColor:'#475569',borderRadius:12,backgroundColor:'#171F2D'}}>
    <Text style={{color:'#F4F7FE',fontSize:16,fontWeight:'700'}}>{title}</Text>
    <Text style={{color:'#B4C0D2',fontSize:14,lineHeight:21,marginTop:6}}>{description}</Text>
   </Pressable>)}
  </View>
  {paidScope===scope?<View accessibilityLiveRegion="polite" style={{marginTop:14}}>
   <Text style={{color:'#F4F7FE',fontSize:16,fontWeight:'700'}}>Get Paid · available now</Text>
   <Text style={{color:'#B4C0D2',fontSize:14,lineHeight:21,marginVertical:8}}>Open a saved business customer in Work to prepare and review a quote. Busy does not create an invoice, request payment or collect money from this shortcut.</Text>
   <Pressable accessibilityRole="button" accessibilityLabel="Open Work for quote assistance" onPress={run(state=>state.jump('workHub','Work'))} style={{paddingVertical:14}}><Text style={{color:'#F4F7FE',fontWeight:'700'}}>Open Work for quote assistance</Text></Pressable>
   <Pressable accessibilityRole="button" accessibilityLabel="Close Get Paid explanation" onPress={run(()=>setPaidScope(null))} style={{paddingVertical:14}}><Text style={{color:'#B4C0D2'}}>Close</Text></Pressable>
  </View>:null}
 </View>;
}
