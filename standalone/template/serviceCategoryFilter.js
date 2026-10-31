import React from 'react';
import {View,Text,Pressable} from 'react-native';
function ServiceCategoryFilter({categories=[],selected='',onSelect,colors,query='',resultCount,onClear}){
 const [limit,setLimit]=React.useState(8);
 if(!categories.length&&!query)return null;
 const choices=['',...categories.slice(0,limit)];
 return <View accessibilityLabel="Service categories" style={{flexDirection:'row',flexWrap:'wrap',gap:8,marginVertical:10}}>
  {Number.isInteger(resultCount)?<Text accessibilityLiveRegion="polite" style={{color:colors.text,width:'100%'}}>{resultCount+' matching service'+(resultCount===1?'':'s')}</Text>:null}
  {(query||selected)&&typeof onClear==='function'?<Pressable accessibilityRole="button" accessibilityLabel="Clear service filters" onPress={onClear} style={{minHeight:48,padding:12}}><Text style={{color:colors.text}}>Show all services</Text></Pressable>:null}
  {choices.map(value=><Pressable key={value||'all'} accessibilityRole="button" accessibilityState={{selected:selected===value}} onPress={()=>onSelect(value)}
   style={{minHeight:48,padding:12,borderRadius:10,borderWidth:selected===value?2:1,borderColor:colors.line,backgroundColor:colors.surface}}><Text style={{color:colors.text}}>{value||'All categories'}</Text></Pressable>)}
  {categories.length>limit?<Pressable accessibilityRole="button" onPress={()=>setLimit(x=>x+8)} style={{minHeight:48,padding:12}}><Text style={{color:colors.text}}>More categories</Text></Pressable>:null}
 </View>;
}
export {ServiceCategoryFilter};
