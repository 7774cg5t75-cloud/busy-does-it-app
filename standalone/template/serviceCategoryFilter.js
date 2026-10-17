import React from 'react';
import {View,Text,Pressable} from 'react-native';
function ServiceCategoryFilter({categories=[],selected='',onSelect,colors}){
 const [limit,setLimit]=React.useState(8);
 if(!categories.length)return null;
 const choices=['',...categories.slice(0,limit)];
 return <View accessibilityLabel="Service categories" style={{flexDirection:'row',flexWrap:'wrap',gap:8,marginVertical:10}}>
  {choices.map(value=><Pressable key={value||'all'} accessibilityRole="button" accessibilityState={{selected:selected===value}} onPress={()=>onSelect(value)}
   style={{minHeight:48,padding:12,borderRadius:10,borderWidth:selected===value?2:1,borderColor:colors.line,backgroundColor:colors.surface}}><Text style={{color:colors.text}}>{value||'All categories'}</Text></Pressable>)}
  {categories.length>limit?<Pressable accessibilityRole="button" onPress={()=>setLimit(x=>x+8)} style={{minHeight:48,padding:12}}><Text style={{color:colors.text}}>More categories</Text></Pressable>:null}
 </View>;
}
export {ServiceCategoryFilter};
