import React from 'react';
import {View,Text,SafeAreaView} from 'react-native';
import {useAppearance} from '../theme/useAppearance';
import {palette} from '../theme/appearance.mjs';
// Install transport denial before evaluating original application modules.
require('./policy.js').install();
const Application=require('../../BusyDoesItApp').default;
export default function OwnerPreview(){
 useAppearance();const c=palette();
 return <View style={{flex:1,backgroundColor:c.bg}}><SafeAreaView style={{backgroundColor:c.card}}><Text accessibilityRole="header" style={{color:c.ink,fontSize:12,paddingHorizontal:16,paddingVertical:6}}>OWNER PREVIEW · Fictional device-only data. No sending, publishing, booking or account saves.</Text></SafeAreaView><Application /></View>;
}
