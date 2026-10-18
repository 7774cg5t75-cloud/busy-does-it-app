import React from 'react';
import {View,Text,Image,TextInput,Pressable,useWindowDimensions,Linking} from 'react-native';
import {contentPrice,contentEventSchedule,prepareBusinessContentEnquiry} from './businessContentRecords.mjs';
import {catalogueState,catalogueSource,catalogueView,transitionCatalogue} from './catalogueState.mjs';
function BusinessContentView({feed,kind,contextKey='',layout='cards',title,onInterest,featuredId='',colors={text:'#16253a',muted:'#46556a',surface:'#fff',line:'#8b93a3'}}){
 const [storedState,setStoredState]=React.useState(null),[notice,setNotice]=React.useState(''),[pageSize,setPageSize]=React.useState(12),[categoryCount,setCategoryCount]=React.useState(8);
 const width=useWindowDimensions().width;
 const state=catalogueState(storedState,feed,kind,contextKey),{query,category,selected,detailRevision,options,optionRevisions}=state;
 // Forget the previous public selection across a scope switch, including a switch back.
 if(storedState&&storedState.scope!==state.scope)setStoredState(state);
 const source=catalogueSource(feed,kind,contextKey),sourceStamp=JSON.stringify([source,state]),live=React.useRef(sourceStamp);live.current=sourceStamp;
 const current=()=>live.current===sourceStamp;
 const change=event=>{if(current())setStoredState(before=>transitionCatalogue(before,{...event,source},feed,kind,contextKey));};
 const chooseOption=(row,value)=>change({type:'option',recordId:row.id,revision:row.revision,value});
 const {rows,categories,detail,detailChanged,related}=catalogueView(state,feed,kind);
 if(featuredId){const index=rows.findIndex(r=>r.id===featuredId);if(index>0)rows.unshift(...rows.splice(index,1));}
 const visible=detail?[detail]:rows.slice(0,pageSize);
 const openDetail=row=>change({type:'open',recordId:row.id,revision:row.revision});
 const button=(label,onPress,selected)=><Pressable accessibilityRole="button" accessibilityState={typeof selected==='boolean'?{selected}:undefined} onPress={()=>{if(current())onPress();}} style={{padding:12,minHeight:48,borderWidth:1,borderColor:colors.line,borderRadius:8,marginVertical:4}}><Text style={{color:colors.text}}>{label}</Text></Pressable>;
 return <View style={{padding:12,backgroundColor:colors.surface,borderRadius:12,marginVertical:10}}>
  <Text style={{fontSize:23,fontWeight:'700',color:colors.text}}>{title|| (kind==='event'?'Upcoming events':'Products')}</Text>
  <Text style={{color:colors.muted,marginVertical:8}}>{feed?.ok?'Approved information checked '+feed.checkedAt:'Current approved information is unavailable.'}</Text>
  <TextInput accessibilityLabel={'Search '+kind+' records'} value={query} onChangeText={v=>{change({type:'query',value:v});setPageSize(12);}} placeholder="Search names or categories" placeholderTextColor="#46556a" style={{padding:12,minHeight:48,borderWidth:1,borderColor:colors.line,color:colors.text}}/>
  {categories.length?<View style={{flexDirection:'row',flexWrap:'wrap',gap:8}}>{button('All categories',()=>{change({type:'category',value:''});})}{categories.slice(0,categoryCount).map(c=><View key={c}>{button(c,()=>{change({type:'category',value:c});setPageSize(12);})}</View>)}</View>:null}
  {categories.length>categoryCount?button('More categories',()=>setCategoryCount(x=>x+8)):null}
  {detail?button('Back to all results',()=>change({type:'back'})):null}
  {detailChanged?<View><Text accessibilityLiveRegion="polite" style={{color:colors.muted}}>This listing changed while you were viewing it. Review its current details before choosing an option or enquiring.</Text>{button('Review updated listing',()=>{change({type:'review'});})}</View>:null}
  {query||category?button('Clear search and categories',()=>{change({type:'clear'});setPageSize(12);}):null}
  {selected&&!detail?<Text accessibilityLiveRegion="polite" style={{color:colors.muted}}>The selected listing is no longer in these current results. Review the current listings before enquiring.</Text>:null}
  <View style={{flexDirection:'row',flexWrap:'wrap',gap:12}}>
   {visible.map(row=>{const data=row.data;return <View key={row.id} style={{width:layout==='cards'&&width>=700&&!detail?'48%':'100%',padding:14,borderWidth:1,borderColor:'#cbd2dc',borderRadius:10}}>
    {data.image?<Image source={{uri:data.image.uri}} accessibilityLabel={data.image.alt} accessible style={{height:180,width:'100%',borderRadius:8}}/>:null}
    <Text style={{fontSize:19,fontWeight:'700',color:colors.text}}>{data.name}</Text>
    <Text style={{color:colors.muted,marginTop:6}}>{data.category}</Text>
    <Text style={{color:colors.text,marginTop:6}}>{detail?data.description:data.description.slice(0,180)}</Text>
    {detail?<Text style={{color:colors.muted,marginTop:6}}>Approved listing revision {row.revision}. Review current details before enquiring.</Text>:null}
    {kind==='product'?<><Text style={{fontWeight:'700',color:colors.text,marginTop:8}}>{contentPrice(data.amountMinor,data.currency)}</Text><Text style={{color:colors.muted}}>Availability: {data.availability.replaceAll('_',' ')}. No stock reservation or checkout.</Text>{detail&&!detailChanged&&data.variants?.length?button('Standard option • '+contentPrice(data.amountMinor,data.currency),()=>chooseOption(row,''),!options[row.id]):null}{detail&&!detailChanged?(data.variants||[]).map(v=><View key={v.id}>{button((options[row.id]===v.id?'✓ ':'')+v.label+' • '+contentPrice(v.amountMinor,data.currency)+(v.sku?' • '+v.sku:''),()=>chooseOption(row,v.id),options[row.id]===v.id)}</View>):null}</>:<>
      <Text style={{color:data.status==='cancelled'?'#a32121':colors.text,fontWeight:'700'}}>{data.status==='cancelled'?'Cancelled':contentEventSchedule(data)}</Text>
      <Text style={{color:colors.muted}}>{data.location||'Online event'}</Text><Text style={{color:colors.muted}}>An event listing does not confirm attendance.</Text>{data.onlineUrl?button('Open public event information',()=>Linking.openURL(data.onlineUrl).catch(()=>{if(current())setNotice('The event link could not be opened.');})):null}
    </>}
    {!detail?button('View '+data.name,()=>openDetail(row)):null}
    {onInterest&&!detailChanged&&data.status!=='cancelled'?button('Ask about '+data.name,()=>{if(options[row.id]&&optionRevisions[row.id]!==row.revision){setNotice('This option has changed. Review the details and choose an option again.');return;}const prepared=prepareBusinessContentEnquiry(feed,feed?.businessId,{recordId:row.id,revision:row.revision,...options[row.id]?{variantId:options[row.id]}:{}});if(prepared.ok)onInterest(prepared.service,prepared);else setNotice(prepared.reason);}):null}
   </View>;})}
  </View>
  {related.length?<View><Text style={{color:colors.text,fontWeight:'700'}}>More in this category</Text>{related.map(row=><View key={row.id}>{button('Explore '+row.data.name,()=>openDetail(row))}</View>)}</View>:null}
  {!detail&&rows.length>pageSize?button('Show more '+(kind==='product'?'products':'events'),()=>setPageSize(x=>x+12)):null}
  {notice?<Text accessibilityLiveRegion="polite" style={{color:colors.muted}}>{notice}</Text>:null}
  {feed?.ok&&!rows.length?<Text style={{color:colors.muted}}>No approved matching {kind==='product'?'products':'upcoming events'}.</Text>:null}
 </View>;
}
export {BusinessContentView};
