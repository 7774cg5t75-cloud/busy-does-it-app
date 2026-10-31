import React from 'react';
import {View,Text} from 'react-native';
import {appComponentTextStyle} from './appComponentAppearance.mjs';
// Same solid surface and text contract in marketplace and standalone.
// Functional actions are deliberately outside appearance props.
export function AppFaqCard({row,colors,componentStyles,bodySize=15,children}){
 return <View style={{backgroundColor:colors.surface,padding:16,borderRadius:16,marginBottom:12}}>
  <Text accessibilityRole="header" style={{color:colors.text,fontSize:bodySize+4,lineHeight:Math.ceil((bodySize+4)*1.3),fontWeight:'700',marginBottom:7,...appComponentTextStyle(componentStyles,'faq:'+row.id+':title',{colors,baseSize:bodySize+4})}}>{row.question}</Text>
  <Text style={{color:colors.muted,fontSize:bodySize,lineHeight:Math.ceil(bodySize*1.5),...appComponentTextStyle(componentStyles,'faq:'+row.id+':body',{colors,baseSize:bodySize})}}>{row.answer}</Text>
  {children}
 </View>;
}
