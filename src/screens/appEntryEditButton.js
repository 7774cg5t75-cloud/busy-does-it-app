import React from 'react';
import {Pressable,Text} from 'react-native';
// Deliberate owner-only selection control: ordinary scrolling, text and
// customer actions are not captured by a whole-card gesture handler.
export function AppEntryEditButton({label,selected=false,onPress,colors}){
 return <Pressable accessibilityRole="button" accessibilityLabel={label}
  accessibilityHint="Select this owner-written entry for a private Studio comparison"
  accessibilityState={{selected}} onPress={onPress}
  style={{minHeight:48,marginTop:8,paddingVertical:10,paddingHorizontal:12,
   borderWidth:2,borderRadius:8,borderColor:selected?colors.accent:colors.line,
   backgroundColor:colors.surface,justifyContent:'center',maxWidth:'100%'}}>
  <Text style={{color:colors.text,fontWeight:'600',flexShrink:1}}>{(selected?'✓ ':'')+label}</Text>
 </Pressable>;
}
