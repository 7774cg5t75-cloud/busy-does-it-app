import React from 'react';
import {View,Text,useWindowDimensions} from 'react-native';
import {appColors as C} from '../theme/appearance.mjs';
import {workspaceDensity} from '../theme/interaction.mjs';
export function dashboardMoney(value){return typeof value==='number'&&Number.isFinite(value)?new Intl.NumberFormat('en-GB',{style:'currency',currency:'GBP',maximumFractionDigits:2}).format(value).replace(/\.00$/,''):'Not recorded';}
// Values supplied by original screen selectors; no business calculations or attribution.
export function DashboardMetrics({items}){
 const density=workspaceDensity(useWindowDimensions());
 return <View style={{flexDirection:'row',flexWrap:'wrap',gap:8}}>{items.map((item,index)=><View key={item.label} style={{width:density.tileWidth,minWidth:0,paddingVertical:10,paddingHorizontal:10,borderRadius:12,backgroundColor:C.input,borderWidth:1,borderColor:C.border}}>
  <View style={{width:18,height:2,borderRadius:2,backgroundColor:[C.cyan,C.violet,C.green,C.rose][index%4],marginBottom:7}}/>
  <Text style={{color:C.muted,fontSize:12,lineHeight:17}}>{item.label}</Text><Text style={{color:C.ink,fontSize:21,lineHeight:28,fontWeight:'700',marginTop:2}}>{item.value}</Text>
 </View>)}</View>;
}
