import React from 'react';
import {View,Text,Image,TextInput,Pressable,useWindowDimensions,Linking} from 'react-native';
import {selectBusinessContent,contentPrice,contentEventSchedule,prepareBusinessContentEnquiry} from './businessContentRecords.mjs';
function BusinessContentView({feed,kind,layout='cards',title,onInterest,featuredId='',colors={text:'#16253a',muted:'#46556a',surface:'#fff',line:'#8b93a3'}}){
 const [query,setQuery]=React.useState(''),[category,setCategory]=React.useState(''),[selected,setSelected]=React.useState(''),[notice,setNotice]=React.useState(''),[pageSize,setPageSize]=React.useState(12),[categoryCount,setCategoryCount]=React.useState(8);
 const width=useWindowDimensions().width;
 const [options,setOptions]=React.useState({});
 const [optionRevisions,setOptionRevisions]=React.useState({});
 const chooseOption=(row,value)=>{setOptions(x=>({...x,[row.id]:value}));setOptionRevisions(x=>({...x,[row.id]:row.revision}));};
 const rows=selectBusinessContent(feed,{kind,query,category});
 if(featuredId){const index=rows.findIndex(r=>r.id===featuredId);if(index>0)rows.unshift(...rows.splice(index,1));}
 const categories=[...new Set(selectBusinessContent(feed,{kind}).map(r=>r.data.category).filter(Boolean))];
 const detail=rows.find(r=>r.id===selected),visible=detail?[detail]:rows.slice(0,pageSize);
 const button=(label,onPress,selected)=><Pressable accessibilityRole="button" accessibilityState={typeof selected==='boolean'?{selected}:undefined} onPress={onPress} style={{padding:12,minHeight:48,borderWidth:1,borderColor:colors.line,borderRadius:8,marginVertical:4}}><Text style={{color:colors.text}}>{label}</Text></Pressable>;
 return <View style={{padding:12,backgroundColor:colors.surface,borderRadius:12,marginVertical:10}}>
  <Text style={{fontSize:23,fontWeight:'700',color:colors.text}}>{title|| (kind==='event'?'Upcoming events':'Products')}</Text>
  <Text style={{color:colors.muted,marginVertical:8}}>{feed?.ok?'Approved information checked '+feed.checkedAt:'Current approved information is unavailable.'}</Text>
  <TextInput accessibilityLabel={'Search '+kind+' records'} value={query} onChangeText={v=>{setQuery(v.slice(0,100));setSelected('');setPageSize(12);}} placeholder="Search names or categories" placeholderTextColor="#46556a" style={{padding:12,minHeight:48,borderWidth:1,borderColor:colors.line,color:colors.text}}/>
  {categories.length?<View style={{flexDirection:'row',flexWrap:'wrap',gap:8}}>{button('All categories',()=>{setCategory('');setSelected('');})}{categories.slice(0,categoryCount).map(c=><View key={c}>{button(c,()=>{setCategory(c);setSelected('');setPageSize(12);})}</View>)}</View>:null}
  {categories.length>categoryCount?button('More categories',()=>setCategoryCount(x=>x+8)):null}
  {detail?button('Back to all results',()=>setSelected('')):null}
  <View style={{flexDirection:'row',flexWrap:'wrap',gap:12}}>
   {visible.map(row=>{const data=row.data;return <View key={row.id} style={{width:layout==='cards'&&width>=700&&!detail?'48%':'100%',padding:14,borderWidth:1,borderColor:'#cbd2dc',borderRadius:10}}>
    {data.image?<Image source={{uri:data.image.uri}} accessibilityLabel={data.image.alt} accessible style={{height:180,width:'100%',borderRadius:8}}/>:null}
    <Text style={{fontSize:19,fontWeight:'700',color:colors.text}}>{data.name}</Text>
    <Text style={{color:colors.muted,marginTop:6}}>{data.category}</Text>
    <Text style={{color:colors.text,marginTop:6}}>{detail?data.description:data.description.slice(0,180)}</Text>
    {detail?<Text style={{color:colors.muted,marginTop:6}}>Approved listing revision {row.revision}. Review current details before enquiring.</Text>:null}
    {kind==='product'?<><Text style={{fontWeight:'700',color:colors.text,marginTop:8}}>{contentPrice(data.amountMinor,data.currency)}</Text><Text style={{color:colors.muted}}>Availability: {data.availability.replaceAll('_',' ')}. No stock reservation or checkout.</Text>{detail&&data.variants?.length?button('Standard option • '+contentPrice(data.amountMinor,data.currency),()=>chooseOption(row,''),!options[row.id]):null}{detail?(data.variants||[]).map(v=><View key={v.id}>{button((options[row.id]===v.id?'✓ ':'')+v.label+' • '+contentPrice(v.amountMinor,data.currency)+(v.sku?' • '+v.sku:''),()=>chooseOption(row,v.id),options[row.id]===v.id)}</View>):null}</>:<>
      <Text style={{color:data.status==='cancelled'?'#a32121':colors.text,fontWeight:'700'}}>{data.status==='cancelled'?'Cancelled':contentEventSchedule(data)}</Text>
      <Text style={{color:colors.muted}}>{data.location||'Online event'}</Text><Text style={{color:colors.muted}}>An event listing does not confirm attendance.</Text>{data.onlineUrl?button('Open public event information',()=>Linking.openURL(data.onlineUrl).catch(()=>setNotice('The event link could not be opened.'))):null}
    </>}
    {!detail?button('View '+data.name,()=>setSelected(row.id)):null}
    {onInterest&&data.status!=='cancelled'?button('Ask about '+data.name,()=>{if(options[row.id]&&optionRevisions[row.id]!==row.revision){setNotice('This option has changed. Review the details and choose an option again.');return;}const prepared=prepareBusinessContentEnquiry(feed,feed?.businessId,{recordId:row.id,revision:row.revision,...options[row.id]?{variantId:options[row.id]}:{}});if(prepared.ok)onInterest(prepared.service,prepared);else setNotice(prepared.reason);}):null}
   </View>;})}
  </View>
  {!detail&&rows.length>pageSize?button('Show more '+(kind==='product'?'products':'events'),()=>setPageSize(x=>x+12)):null}
  {notice?<Text accessibilityLiveRegion="polite" style={{color:colors.muted}}>{notice}</Text>:null}
  {feed?.ok&&!rows.length?<Text style={{color:colors.muted}}>No approved matching {kind==='product'?'products':'upcoming events'}.</Text>:null}
 </View>;
}
export {BusinessContentView};
