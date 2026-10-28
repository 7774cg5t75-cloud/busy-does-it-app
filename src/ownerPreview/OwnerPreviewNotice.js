import React from 'react';
import {Pressable,Text,Alert} from 'react-native';
import {appColors as C} from '../theme/appearance.mjs';
export const OWNER_PREVIEW_EXPLANATION='Fictional device-only data. No sending, publishing, booking or account saves. Live services and financial actions are unavailable. Local proposals are not real customer activity. Unsaved work may reset on restart.';
export function OwnerPreviewNotice({compact=false}={}){
 return <Pressable accessibilityRole="button" accessibilityLabel="Owner Preview: offline fictional data. Show restrictions" accessibilityHint="Opens the full preview limitations" hitSlop={8} onPress={()=>Alert.alert('Offline Owner Preview',OWNER_PREVIEW_EXPLANATION,[{text:'Got it'}])} style={({pressed})=>({alignSelf:'flex-end',minHeight:compact?32:28,justifyContent:'center',paddingHorizontal:compact?6:16,backgroundColor:pressed?C.surface:'transparent'})}><Text style={{color:C.blueText,fontSize:10,lineHeight:15,fontWeight:'600',letterSpacing:.35}}>{compact?'PREVIEW · OFFLINE ⓘ':'OWNER PREVIEW · OFFLINE ⓘ'}</Text></Pressable>;
}
