import React from 'react';
import {View,Text} from 'react-native';
import {appColors as C} from '../theme/appearance.mjs';
import {interiorStatus,interiorType as T} from '../theme/interior.mjs';
import {ChromeIcon} from './PremiumAtmosphere';
import {Button,Card} from './ui';
// Presentation only. Callers supply authoritative status; no inferred save,
// delivery, approval or recovery action is performed by these components.
export function WorkflowStatus({title,body,tone='info',children}){
 const style=interiorStatus(tone),accent=C[style.accent];
 return <View accessibilityRole={tone==='error'?'alert':undefined} accessibilityLiveRegion="polite" style={{padding:12,marginBottom:12,borderRadius:18,backgroundColor:C.card,borderWidth:1,borderColor:C.border}}>
  <View style={{flexDirection:'row',alignItems:'center',gap:8,marginBottom:body?4:0}}><ChromeIcon name={style.icon} color={accent} size={17}/><Text accessibilityRole="header" style={{flex:1,fontSize:T.body,lineHeight:T.bodyLine,fontWeight:'700',color:C.ink}}>{title}</Text></View>
  {body?<Text style={{fontSize:T.body,lineHeight:T.bodyLine,color:C.muted}}>{body}</Text>:null}{children}
 </View>;
}
export function EditorToolbar({label='Editing actions',actions=[],children}){
 return <View accessibilityLabel={label} style={{flexDirection:'row',flexWrap:'wrap',gap:8,marginVertical:6}}>{children||actions.map(action=><View key={action.key||action.label} style={{flexGrow:1,flexBasis:140,minWidth:0}}><Button compact {...action}/></View>)}</View>;
}
export function ReviewPanel({title,body,children,footer,eyebrow='Your review'}){
 return <Card eyebrow={eyebrow} title={title} body={body} footer={footer} tone="blue">{children}</Card>;
}

// Keeps original specialist controls as children without owning their actions.
export function EditorAction({children}){return <View style={{flexGrow:1,flexBasis:140,minWidth:0}}>{children}</View>;}
