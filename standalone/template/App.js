import {createNativeRequestScreen} from './nativeRequestScreen';
import {ServiceActionButton} from './serviceActionButton';
import {serviceCardStyle} from './appServicePresentation.mjs';
import {appImagePresentation} from './appImageAppearance.mjs';
import {AppFaqCard} from './appFaqCard';
import {ServiceDetails} from "./serviceDetails";
import {appComponentTextStyle} from './appComponentAppearance.mjs';
import {BusinessContentView} from './businessContentView';
/**
 * V3.155 independent native Business App. Offline by default.
 * A separately owner-approved LIVE connection loads only a strict public
 * published version. Enquiries/booking requests use BUSY's verified public
 * challenge/submit service, never a fake local acknowledgement.
 */
import React,{useState,useEffect} from "react";
import {SafeAreaView,ScrollView,View,Text,TextInput,Pressable,StatusBar,Image,
 ActivityIndicator,useWindowDimensions,Linking} from "react-native";
import prototype from "./prototype.json";
import {verifiedPublicRuntime,publicNativeApp} from "./nativeBusinessClient";
import {responsiveAppLayout} from "./appResponsiveDesign.mjs";
import {nativeContactAction,searchPublicNativeServices,browsePublicNativeServices,prepareServiceQuestion,SERVICE_QUESTION_TOPICS} from "./nativeCustomerActions.mjs";
import {ServiceCategoryFilter} from './serviceCategoryFilter';
import {nativePalette} from "./nativePalette.mjs";
import {appVisualPresentation} from "./appVisualPresentationV3194.mjs";
const LOOK=prototype.appearance||{};
const COLORS=nativePalette(LOOK.brandPalette,LOOK.brandAccent);
const VISUAL=appVisualPresentation(LOOK);
const box={backgroundColor:COLORS.surface,borderRadius:15,padding:17,marginBottom:12};
const t={color:COLORS.text},sub={color:COLORS.muted,marginTop:9,
 fontSize:VISUAL.type.bodySize,lineHeight:VISUAL.type.bodySize+7};
function Button({title,onPress,disabled=false}){
 return <Pressable accessibilityRole="button" accessibilityLabel={title} disabled={disabled}
   onPress={onPress} style={{backgroundColor:disabled?COLORS.line:COLORS.accent,
     padding:14,minHeight:48,justifyContent:"center",
     borderRadius:11,marginTop:12}}>
   <Text style={{color:disabled?COLORS.muted:COLORS.bg,fontSize:15,
     fontWeight:"700",textAlign:"center"}}>{title}</Text>
 </Pressable>;
}
function Field({title,value,onChange,multiline=false,maxLength,disabled=false,inputRef}){
 return <View style={{marginTop:13}}>
  <Text style={{color:COLORS.text,fontWeight:"600"}}>{title}</Text>
  <TextInput ref={inputRef} accessibilityLabel={title} editable={!disabled} accessibilityState={{disabled}} value={value} onChangeText={onChange}
    multiline={multiline} maxLength={maxLength} keyboardType={title==="Email address"?"email-address":"default"}
    autoCapitalize={title==="Email address"?"none":"sentences"}
    placeholderTextColor={COLORS.muted}
    style={{color:COLORS.text,backgroundColor:COLORS.bg,borderColor:COLORS.line,
      borderWidth:1,borderRadius:9,padding:12,marginTop:6,
      minHeight:multiline?92:48,textAlignVertical:"top"}}/>
 </View>;
}
const RequestScreen=createNativeRequestScreen({Button,Field,COLORS,box,t,sub});
function ServicesInfo({app,layout,onRequestService}){
 const [query,setQuery]=useState("");
 const [category,setCategory]=useState('');
 const [questionService,setQuestionService]=useState('');
 const browse=browsePublicNativeServices(app.services||[],query,category),results=browse.rows;
 return <View style={box}>
  <Text style={{...t,fontSize:VISUAL.type.sectionSize,fontWeight:VISUAL.type.sectionWeight}}>Services</Text>
  <ServiceCategoryFilter categories={browse.categories} selected={browse.selectedCategory} onSelect={setCategory} colors={COLORS} query={query} resultCount={results.length} onClear={()=>{setQuery('');setCategory('');}}/>
  {app.services?.length>4?<TextInput accessibilityLabel="Search services"
    value={query} onChangeText={setQuery}
    placeholder="Find a service" placeholderTextColor={COLORS.muted}
    style={{color:COLORS.text,backgroundColor:COLORS.bg,padding:12,
      minHeight:48,borderRadius:9,marginTop:12}}/>:null}
  {results.length?<View style={{flexDirection:"row",flexWrap:"wrap",gap:12}}>
   {results.map((service,i)=><View key={service.id||service.name||i} style={{marginTop:14,
     width:VISUAL.serviceColumns===1?"100%":
       layout?.serviceColumns===2?"48%":"100%",
     backgroundColor:VISUAL.serviceStyle==="cards"?COLORS.bg:COLORS.surface,
     borderWidth:VISUAL.serviceStyle==="rows"?0:1,
     borderColor:i===0&&VISUAL.featuredFirst?COLORS.accent:COLORS.line,
     borderRadius:VISUAL.serviceStyle==="rows"?0:11,
     padding:VISUAL.serviceStyle==="rows"?6:12,
     borderBottomWidth:VISUAL.serviceStyle==="rows"?1:undefined,
     borderBottomColor:VISUAL.serviceStyle==="rows"?COLORS.line:undefined,...serviceCardStyle(app.servicePresentation||LOOK.servicePresentation,service.id,COLORS)}}>
     {i===0&&VISUAL.featuredFirst?<Text style={{
       color:COLORS.accent,fontWeight:"700",fontSize:12,marginBottom:6}}>
       Featured service
     </Text>:null}
     <Text style={{...t,fontWeight:VISUAL.type.sectionWeight,
       fontSize:VISUAL.type.bodySize+2,...appComponentTextStyle(app.componentStyles||LOOK.componentStyles,'service:'+service.id+':title',{colors:COLORS,baseSize:VISUAL.type.bodySize+2})}}>{service.name}</Text>
     <ServiceDetails service={service} onRelatedServices={category=>{setQuery('');setCategory(category);}} colors={COLORS} bodySize={VISUAL.type.bodySize} textStyle={appComponentTextStyle(app.componentStyles||LOOK.componentStyles,'service:'+service.id+':body',{colors:COLORS,baseSize:VISUAL.type.bodySize})}/>
     {app.supportsBookingRequest&&app.moduleKeys?.includes("booking_request")?
      <ServiceActionButton serviceId={service.id} action="booking_request" presentation={app.servicePresentation||LOOK.servicePresentation} colors={COLORS} title={"Request "+service.name}
       onPress={()=>onRequestService?.(service.name,"booking_request")}/>:null}
     {app.supportsEnquiry&&app.moduleKeys?.includes("enquiry")?
      <ServiceActionButton serviceId={service.id} action="enquiry" presentation={app.servicePresentation||LOOK.servicePresentation} colors={COLORS} title={"Ask about "+service.name}
       onPress={()=>onRequestService?.(service.name,"enquiry")}/>:null}
     {app.supportsEnquiry&&app.moduleKeys?.includes("enquiry")?<View>
      <Button title={questionService===service.name?"Hide question ideas":"Help me ask about "+service.name} onPress={()=>setQuestionService(questionService===service.name?'':service.name)}/>
      {questionService===service.name?SERVICE_QUESTION_TOPICS.map(topic=><Button key={topic.key} title={topic.label} onPress={()=>onRequestService?.(service.name,'enquiry',null,topic.key)}/>):null}
     </View>:null}
   </View>)}
  </View>:<Text style={sub}>{query?"No services match your search.":"No public services are listed."}</Text>}
 </View>;
}
function LiveInfo({screen,app,layout,onRequestService,onOpenContact,onOpenOfferEnquiry,contactNotice,catalogueContextKey='',catalogueStates={},onCatalogueStateChange}){
 if(screen.key==="business_profile")return <View style={box}>
  <Text style={{...t,fontSize:21,fontWeight:"700",...appComponentTextStyle(app.componentStyles||LOOK.componentStyles,'header-title',{colors:COLORS,baseSize:21})}}>{app.title}</Text>
  <Text style={{...sub,...appComponentTextStyle(app.componentStyles||LOOK.componentStyles,'header-tagline',{colors:COLORS,baseSize:VISUAL.type.bodySize})}}>{app.tagline||app.about||"Contact this business for more information."}</Text>
  {app.heroUrl?<Image source={{uri:app.heroUrl}} accessible
    accessibilityRole="image" accessibilityLabel="Business cover photo"
    style={{height:layout?.ok?layout.heroHeight:190,
      borderRadius:LOOK.imageCorners==="square"?2:12,marginTop:12}}
    resizeMode="cover"/>:null}
  {app.tagline&&app.about?<Text style={sub}>{app.about}</Text>:null}
  {(app.contentLayout||[]).map(block=><BusinessContentView key={block.kind} contextKey={catalogueContextKey} savedBrowseState={catalogueStates[block.kind]} onSaveBrowseState={value=>onCatalogueStateChange?.(block.kind,value)} feed={app.businessContent} colors={COLORS} {...block} onInterest={app.supportsEnquiry?(name,prepared)=>onRequestService?.(name,'enquiry',prepared):null}/>)}
  {(app.faqs||[]).map((row,i)=><AppFaqCard key={row.id||i} row={row} colors={COLORS} componentStyles={app.componentStyles||LOOK.componentStyles} bodySize={VISUAL.type.bodySize}/>)}
  {(app.testimonials||[]).map((row,i)=><View key={'testimonial'+i} style={{marginTop:16}}><Text style={sub}>{row.text}</Text><Text style={{...t,fontWeight:'700'}}>{row.attribution}</Text></View>)}
 </View>;
 if(screen.key==="services")return <ServicesInfo app={app} layout={layout} onRequestService={onRequestService}/>;
 if(screen.key==="gallery")return <View style={box}>
   <Text style={{...t,fontSize:20,fontWeight:"700"}}>Approved photos</Text>
   {app.gallery?.length?<View style={{flexDirection:"row",flexWrap:"wrap",gap:8}}>
     {app.gallery.map((photo,i)=>
       <View key={i} style={{width:layout?.galleryColumns===3?"31%":
         layout?.galleryColumns===2?"48%":"100%"}}>
       <Image source={{uri:photo.uri}} resizeMode={appImagePresentation(app.imageStyles||LOOK.imageStyles,photo.uri).resizeMode} accessible accessibilityRole="image"
        accessibilityLabel={String(photo.alt||photo.caption||"Business photo "+(i+1))}
        style={{width:"100%",...appImagePresentation(app.imageStyles||LOOK.imageStyles,photo.uri,{height:layout?.ok?layout.galleryHeight:190,corners:LOOK.imageCorners}),marginTop:12}}/>
       {photo.caption?<Text style={{...sub,fontSize:VISUAL.type.bodySize}}>{photo.caption}</Text>:null}
       </View>
     )}</View>:<Text style={sub}>No photographs have been approved for this app yet.</Text>}
 </View>;
 if(screen.key==="offers")return <View style={box}>
   <Text style={{...t,fontSize:20,fontWeight:"700"}}>Current offers</Text>
   {app.offers?.length?app.offers.map((offer,i)=><View key={i}
      style={{paddingVertical:13,borderBottomColor:COLORS.line,borderBottomWidth:1}}>
      <Text style={{...t,fontWeight:"700",fontSize:17}}>{offer.title}</Text>
      {offer.body?<Text style={sub}>{offer.body}</Text>:null}
      <Text style={sub}>{"Terms: "+offer.terms}</Text>
      {offer.endDate?<Text style={sub}>{"Ends "+offer.endDate}</Text>:null}
      {app.supportsEnquiry&&app.moduleKeys?.includes("enquiry")?
       <Button title={"Ask about "+offer.title}
        onPress={()=>onOpenOfferEnquiry?.(offer.title)}/>:null}
    </View>):<Text style={sub}>No approved offer is active today.</Text>}
  </View>;
 if(screen.key==="loyalty")return <View style={box}>
   <Text style={{...t,fontSize:20,fontWeight:"700"}}>Loyalty rewards</Text>
   {app.loyalty?<View>
     <Text style={{...t,fontWeight:"700",marginTop:12}}>{app.loyalty.programName}</Text>
     <Text style={sub}>{"The business offers: "+app.loyalty.reward}</Text>
     <Text style={sub}>{"Programme target: "+app.loyalty.targetStamps+" eligible stamps or visits."}</Text>
     <Text style={sub}>{"Terms: "+app.loyalty.terms}</Text>
     <Text style={sub}>Ask the business to check your personal progress and eligibility.
       This app does not award stamps or redeem rewards automatically.</Text>
   </View>:<Text style={sub}>No verified public loyalty details are available.</Text>}
  </View>;
 if(screen.key==="contact")return <View style={box}>
   <Text style={{...t,fontSize:20,fontWeight:"700"}}>Contact</Text>
   {["phone","email","openingHours"].map(key=>app.contact?.[key]?
    <View key={key}>
     <Text style={sub}>{key==="openingHours"?"Opening hours":key+": "}
        {app.contact[key]}</Text>
     {["phone","email"].includes(key)&&nativeContactAction(app.contact,key).ok?
      <Button title={key==="phone"?"Call the business":"Email the business"}
       onPress={()=>onOpenContact?.(key)}/>:null}
    </View>:null)}
   {contactNotice?<Text style={sub}>{contactNotice}</Text>:null}
 </View>;
 return <View style={box}><Text style={sub}>
  This optional module requires its own public permission and runtime integration.
  No customer data or money is collected here.
 </Text></View>;
}
export default function App(){
 const viewport=useWindowDimensions();
 const runtime=prototype.runtimeConnection;
 const connected=verifiedPublicRuntime(runtime);
 const [current,setCurrent]=useState(prototype.screenSchema.screens[0].key);
 const [requestedService,setRequestedService]=useState("");
 const [requestOrigin,setRequestOrigin]=useState('');
 const [requestedIntent,setRequestedIntent]=useState("");
 const [requestedKind,setRequestedKind]=useState("service");
 const [requestedMessage,setRequestedMessage]=useState("");
 const [requestSelection,setRequestSelection]=useState(null);
 const requestForms=React.useRef(new Map());
 const catalogueCache=React.useRef({scope:'',states:{}});
 const [refreshSequence,setRefreshSequence]=useState(0);
 const [measuredFrameWidth,setMeasuredFrameWidth]=useState(0);
 const [contactNotice,setContactNotice]=useState("");
 const [loading,setLoading]=useState(connected),[live,setLive]=useState(null),
  [error,setError]=useState("");
 useEffect(()=>{
  let active=true;
  if(!connected){setLoading(false);return ()=>{active=false;};}
  setLoading(true);setError("");setLive(null);
  publicNativeApp(runtime).then(result=>{
   if(!active)return;
   setLive(result.ok?result.app:null);setError(result.ok?"":result.reason);setLoading(false);
  });
  return ()=>{active=false;};
 },[connected,runtime?.expectedVersionId,refreshSequence]);
 const pages=live?prototype.screenSchema.screens.filter(s=>
  live.moduleKeys?.includes(s.key)).map(s=>({...s,title:live.navigationLabels?.[s.key]||s.title})):[];
 const chosen=pages.find(x=>x.key===current)||pages[0];
 const publicViewContext=JSON.stringify([live?.businessContent?.businessId||'',live?.appId||'',live?.versionId||'',runtime?.expectedAppId||'',runtime?.expectedVersionId||'']);
 const viewContext=React.useRef(publicViewContext);viewContext.current=publicViewContext;
 if(catalogueCache.current.scope!==publicViewContext)catalogueCache.current={scope:publicViewContext,states:{}};
 const requestFormKey=JSON.stringify([live?.versionId,chosen?.key,requestedKind,requestedService,requestedIntent,requestSelection]);
 const requestIdentity=React.useRef(requestFormKey);requestIdentity.current=requestFormKey;
 const resumeRequestKey=JSON.stringify([live?.versionId,requestedIntent,requestedKind,requestedService,requestedIntent,requestSelection]);
 const resumableRequest=requestForms.current.get(resumeRequestKey);
 const outerPadding=LOOK.layoutDensity==="compact"?13:
   LOOK.layoutDensity==="airy"?28:20;
 const contentWidth=Math.max(250,Math.floor((measuredFrameWidth||viewport.width)-2*outerPadding));
 const responsive=responsiveAppLayout({
  modules:prototype.screenSchema.screens.map(screen=>({
   key:screen.key,enabled:!live||live.moduleKeys?.includes(screen.key)})),
  navigation:prototype.screenSchema.screens.map(screen=>screen.key),
  presentation:LOOK,
  publicProfile:{services:live?.services||[],assets:{gallery:live?.gallery||[]}}
 },contentWidth);
 return <SafeAreaView style={{flex:1,backgroundColor:COLORS.bg}}>
  <StatusBar barStyle={COLORS.text==="#14212B"?"dark-content":"light-content"}/>
  <ScrollView onLayout={({nativeEvent})=>{
    const width=Math.floor(nativeEvent.layout.width);
    if(width>=250&&width!==measuredFrameWidth)setMeasuredFrameWidth(width);
   }} contentContainerStyle={{padding:outerPadding,paddingBottom:55}}>
   <Text style={{color:COLORS.accent,fontSize:12,fontWeight:"700",letterSpacing:1}}>
    {live?"LIVE PUBLIC BUSINESS APP":connected?
      "CHECKING LIVE CONNECTION":"PRIVATE APP PROTOTYPE"}</Text>
   <Text style={{color:COLORS.text,
     fontSize:VISUAL.headerCompact?VISUAL.type.titleSize-5:
       VISUAL.headerEmphasis?VISUAL.type.titleSize+4:VISUAL.type.titleSize,
     fontWeight:VISUAL.type.titleWeight,
     letterSpacing:VISUAL.type.titleSpacing,
     textAlign:VISUAL.headerCentered?"center":"left",
     marginTop:9}}>
    {live?.title||prototype.appName}</Text>
   <Text style={{color:COLORS.muted,fontSize:12,marginTop:5}}>
    {"Native layout • "+(LOOK.headerStyle||"refined")+" header • "+(responsive.ok?responsive.navigation:"list")+" navigation"}
   </Text>
   {loading?<ActivityIndicator color={COLORS.accent} style={{marginTop:25}}/>:null}
   {error?<View><Text style={sub}>{error}</Text>
    <Button title="Try loading this app again"
     onPress={()=>setRefreshSequence(x=>x+1)}/></View>:null}
   {!connected?<Text style={sub}>
    This unsigned offline prototype is deliberately not connected to real
    customer records or bookings. A separate approved, published Business App
    version and secure connection are required before customer actions work.
   </Text>:null}
   {live&&chosen?<View>
    <Text style={{...sub,marginBottom:16}}>
      Requests are sent through BUSY's protected business service. They
      never automatically confirm an appointment or take payment.
    </Text>
    <View style={{flexDirection:responsive.ok&&responsive.navigation==="list"?"column":"row",flexWrap:"wrap",marginBottom:15,gap:7}}>
     {pages.map(item=><Pressable key={item.key} accessibilityRole="button"
      accessibilityLabel={"View "+item.title} onPress={()=>setCurrent(item.key)}
      style={{backgroundColor:item.key===chosen.key?COLORS.accent:COLORS.surface,
       width:responsive.ok&&responsive.navigation==="list"?"100%":undefined,
       minHeight:48,justifyContent:"center",
       paddingHorizontal:13,paddingVertical:11,borderRadius:10}}
       accessibilityState={{selected:item.key===chosen.key}}>
      <Text style={{color:item.key===chosen.key?COLORS.bg:COLORS.text,
       fontWeight:"600"}}>{item.title}</Text>
     </Pressable>)}
    </View>
    {!['enquiry','booking_request'].includes(chosen.key)&&resumableRequest&&pages.some(page=>page.key===requestedIntent)?<Button title={resumableRequest.result?.ok?'Return to saved request':resumableRequest.result?.mayHaveBeenReceived?'Return to unconfirmed request':'Return to my unfinished request'} onPress={()=>{if(viewContext.current===publicViewContext&&requestForms.current.get(resumeRequestKey)===resumableRequest)setCurrent(requestedIntent);}}/>:null}
    {["enquiry","booking_request"].includes(chosen.key)?
     <RequestScreen key={requestFormKey}
      screen={chosen} live={live} runtime={runtime} contentSelection={requestSelection}
      savedState={requestForms.current.get(requestFormKey)}
      onRemoveAttachment={value=>{
       if(viewContext.current!==publicViewContext||requestIdentity.current!==requestFormKey||!requestSelection||chosen.key!=='enquiry')return;
       const previous=requestForms.current.get(requestFormKey);
       if(previous?.result?.ok||previous?.result?.mayHaveBeenReceived)return;
       const nextKey=JSON.stringify([live?.versionId,chosen.key,'service','',requestedIntent,null]);
       requestIdentity.current=nextKey;
       requestForms.current.delete(requestFormKey);
       requestForms.current.set(nextKey,{...value,enquiryReview:null,result:null,possibleDuplicateRetry:false});
       if(requestForms.current.size>8)requestForms.current.delete(requestForms.current.keys().next().value);
       setRequestSelection(null);setRequestedService('');setRequestedKind('service');setRequestedMessage('');
      }}
      onReturnToInformation={requestOrigin&&pages.some(page=>page.key===requestOrigin)?()=>{if(viewContext.current===publicViewContext)setCurrent(requestOrigin);}:null}
      onSaveState={value=>{if(viewContext.current!==publicViewContext)return;const key=requestFormKey;if(requestIdentity.current!==key&&!requestForms.current.has(key))return;requestForms.current.set(key,value);if(requestForms.current.size>8)requestForms.current.delete(requestForms.current.keys().next().value);}}
      initialService={chosen.key===requestedIntent?
       requestedService:""}
      initialMessage={requestedMessage|| (chosen.key==="enquiry"&&requestedIntent==="enquiry"&&requestedService?
       requestedKind==="offer"?
        "I would like to ask about the offer: "+requestedService+".":
        "I would like to know more about "+requestedService+".":"")}/>:
     <LiveInfo screen={chosen} app={live} layout={responsive} catalogueContextKey={publicViewContext} catalogueStates={catalogueCache.current.states} onCatalogueStateChange={(kind,value)=>{if(catalogueCache.current.scope===publicViewContext)catalogueCache.current.states[kind]=value;}}
      onOpenOfferEnquiry={offerTitle=>{
       if(!live.supportsEnquiry||!live.moduleKeys?.includes("enquiry"))return;
       setRequestSelection(null);setRequestedMessage("");setRequestedService(offerTitle);setRequestedKind("offer");
       setRequestedIntent("enquiry");setCurrent("enquiry");
      }}
      contactNotice={contactNotice}
      onOpenContact={key=>{
       const action=nativeContactAction(live.contact,key);
       if(!action.ok){setContactNotice(action.reason);return;}
       setContactNotice("");
       Linking.openURL(action.url).catch(()=>setContactNotice(
        "This device could not open that contact method. Use the details shown above."));
      }}
      onRequestService={(serviceName,intent,prepared,topic)=>{
       if(viewContext.current!==publicViewContext)return;
       if(intent==="booking_request"&&
          (!live.supportsBookingRequest||!live.moduleKeys?.includes(intent)))return;
       if(intent==="enquiry"&&
          (!live.supportsEnquiry||!live.moduleKeys?.includes(intent)))return;
       if(!["booking_request","enquiry"].includes(intent))return;
       const question=topic?prepareServiceQuestion(live.services||[],serviceName,topic):null;
       if(topic&&(!question?.ok||intent!=='enquiry')){setContactNotice(question?.reason||'Choose an enquiry question.');return;}
       setRequestOrigin(chosen.key);
       setRequestSelection(prepared?.ok?{...prepared.selection,businessId:prepared.businessId}:null);setRequestedMessage(question?.ok?question.message:prepared?.ok?prepared.message:"");setRequestedService(serviceName);setRequestedIntent(intent);setRequestedKind(topic?"service-question-"+topic:"service");
       setCurrent(intent);
      }}/>}
   </View>:null}
   <Text style={{color:COLORS.muted,fontSize:12,marginTop:20}}>
    No app-store submission or third-party payment is performed by this app.
   </Text>
  </ScrollView>
 </SafeAreaView>;
}
