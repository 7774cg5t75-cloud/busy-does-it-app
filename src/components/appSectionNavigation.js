import React from 'react';
import {View,Text,Pressable} from 'react-native';
// Navigation only: original approved modules and forms retain all authority.
function AppSectionNavigation({modules,selected,onSelect,colors}){
 return <View accessibilityRole="tablist" style={{flexDirection:'row',flexWrap:'wrap',gap:8,marginVertical:12}}>
  {[{key:'',label:'Overview'},...modules].map(module=><Pressable key={module.key||'overview'}
   accessibilityRole="tab" accessibilityState={{selected:selected===module.key}}
   accessibilityLabel={module.label||module.title||module.key.replaceAll('_',' ')}
   onPress={()=>onSelect(module.key)}
   style={{minHeight:48,padding:12,borderRadius:10,borderWidth:selected===module.key?2:1,borderColor:colors.accent,backgroundColor:colors.bg}}>
   <Text style={{color:colors.text,fontWeight:selected===module.key?'700':'400'}}>{module.label||module.title||module.key.replaceAll('_',' ')}</Text>
  </Pressable>)}
 </View>;
}
export {AppSectionNavigation};
