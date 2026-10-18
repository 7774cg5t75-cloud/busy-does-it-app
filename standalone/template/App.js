import {applyEnquiryTopicSuggestion} from './customerEnquiryRequirements.mjs';
import {EnquiryTopicShortcuts} from './enquiryTopicShortcuts';
import {ServiceActionButton} from './serviceActionButton';
import {serviceCardStyle} from './appServicePresentation.mjs';
import {appImagePresentation} from './appImageAppearance.mjs';
import {AppFaqCard} from './appFaqCard';
import {ServiceDetails} from "./serviceDetails";
import {appComponentTextStyle} from './appComponentAppearance.mjs';
import {ENQUIRY_REQUIREMENTS,emptyEnquiryRequirements,prepareCustomerEnquiry,customerEnquiryReview,prepareCustomerBookingNote} from './customerEnquiryRequirements.mjs';
import {prepareBusinessContentEnquiry} from './businessContentRecords.mjs';
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
import {sendNativeGuestRequest,validateNativeGuestRequest} from "./nativeGuestRequests";
import {responsiveAppLayout} from "./appResponsiveDesign.mjs";
import {nativeContactAction,searchPublicNativeServices,browsePublicNativeServices,prepareServiceQuestion,SERVICE_QUESTION_TOPICS} from "./nativeCustomerActions.mjs";
import {ServiceCategoryFilter} from './serviceCategoryFilter';
import {nativePalette} from "./nativePalette.mjs";
import {appVisualPresentation} from "./appVisualPresentationV3194.mjs";
import {nativePreferredDates} from "./nativePreferredDates.mjs";
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
function RequestScreen({screen,live,runtime,initialService="",initialMessage="",savedState=null,onSaveState,onReturnToInformation,onRemoveAttachment,contentSelection=null}){
 const [input,setInput]=useState(savedState?.input||{name:"",email:"",phone:"",service:initialService,
  preferredDate:"",message:initialMessage,note:"",requirements:emptyEnquiryRequirements()});
 const [busy,setBusy]=useState(false),[result,setResult]=useState(savedState?.result||null);
 const [possibleDuplicateRetry,setPossibleDuplicateRetry]=useState(savedState?.possibleDuplicateRetry||false);
 const [enquiryReview,setEnquiryReview]=useState(savedState?.enquiryReview||null);
 useEffect(()=>{if(!inFlight.current)onSaveState?.({input,result,possibleDuplicateRetry,enquiryReview});},[input,result,possibleDuplicateRetry,enquiryReview]);
 const inFlight=React.useRef(false);
 const fieldRefs=React.useRef({});
 const latestDraft=React.useRef(null);latestDraft.current={input,result,contentSelection,live,runtime};
 const dateChoices=React.useMemo(()=>nativePreferredDates(new Date(),7),[]);
 const type=screen.key==="booking_request"?"booking_request":"enquiry";
 const enabled=type==="booking_request"?live?.supportsBookingRequest:live?.supportsEnquiry;
 const set=(key)=>(value)=>{
  if(inFlight.current||busy||latestDraft.current?.live!==live||latestDraft.current?.runtime!==runtime||latestDraft.current?.contentSelection!==contentSelection||latestDraft.current?.result?.ok||latestDraft.current?.result?.mayHaveBeenReceived)return;
  setInput(prev=>({...prev,[key]:key==='requirements'&&typeof value==='function'?value(prev.requirements||emptyEnquiryRequirements()):value}));
  if(!result?.mayHaveBeenReceived){
   setResult(null);setPossibleDuplicateRetry(false);
  }
 };

 const preparedReview=type==='enquiry'?prepareCustomerEnquiry({message:input.message,requirements:input.requirements||emptyEnquiryRequirements(),feed:live.businessContent,businessId:contentSelection?.businessId,selection:contentSelection}):null;
 const preparedBookingNote=type==='booking_request'?prepareCustomerBookingNote(input.note,input.requirements||emptyEnquiryRequirements()):null;
 const validatedReview=type==='booking_request'?(preparedBookingNote.ok?validateNativeGuestRequest(type,{...input,note:preparedBookingNote.note}):preparedBookingNote):preparedReview?.ok?validateNativeGuestRequest(type,{...input,message:preparedReview.message}):null;
 const currentReview=validatedReview?.ok?customerEnquiryReview(validatedReview.payload,JSON.stringify([live.appId,live.versionId,runtime?.expectedAppId,runtime?.expectedVersionId,screen.key]),JSON.stringify([input,contentSelection]),type):null;
 const reviewLive=React.useRef(null);reviewLive.current={key:currentReview?.key,live,runtime};
 const reviewCurrent=!!enquiryReview&&enquiryReview.key===currentReview?.key;
 const send=async()=>{
  if(inFlight.current||busy||!enabled||result?.ok||
    result?.mayHaveBeenReceived&&!possibleDuplicateRetry)return;
  if(contentSelection){const checked=prepareBusinessContentEnquiry(live.businessContent,contentSelection.businessId,contentSelection);if(!checked.ok){setResult({ok:false,reason:checked.reason});return;}}
  const prepared=type==='enquiry'?prepareCustomerEnquiry({message:input.message,requirements:input.requirements||emptyEnquiryRequirements(),feed:live.businessContent,businessId:contentSelection?.businessId,selection:contentSelection}):{ok:true};
  if(!prepared.ok){setResult({ok:false,reason:prepared.reason});return;}
  if(type==='booking_request'&&contentSelection){setResult({ok:false,reason:'A selected product or event supports enquiries only.'});return;}
  {
   if(!currentReview){setResult({ok:false,reason:validatedReview?.reason||preparedReview?.reason});fieldRefs.current[validatedReview?.field]?.focus?.();return;}
   if(reviewLive.current?.key!==currentReview.key||reviewLive.current?.live!==live||reviewLive.current?.runtime!==runtime)return;
   if(!reviewCurrent){setEnquiryReview(currentReview);return;}
  }
  setEnquiryReview(null);
  inFlight.current=true;
  setBusy(true);setResult(null);setPossibleDuplicateRetry(false);
  onSaveState?.({input,result:{ok:false,mayHaveBeenReceived:true,reason:'This request is still unconfirmed. Do not submit a second request.'},possibleDuplicateRetry:false});
  try{
   const next=await sendNativeGuestRequest(runtime,live,type,enquiryReview.payload);
   onSaveState?.({input,result:next,possibleDuplicateRetry:false});setResult(next);
  }catch{
   onSaveState?.({input,result:{ok:false,mayHaveBeenReceived:true,reason:"The request outcome is unconfirmed."},possibleDuplicateRetry:false});
   setResult({ok:false,mayHaveBeenReceived:true,
    reason:"The connection failed. Your request may have reached the business."});
  }finally{inFlight.current=false;setBusy(false);}
 };
 return <View style={box}>
  <Text style={{...t,fontWeight:"700",fontSize:20}}>{screen.title}</Text>
  <Text style={sub}>{type==="booking_request"?
    "Ask for an appointment. The business must confirm the date and time before anything is booked.":
    "Send a message directly to this business using BUSY's verified guest request service."}</Text>
  {!enabled?<Text style={sub}>This customer request action is not available on the live app.</Text>:(
   <>
    <Field disabled={busy||result?.ok===true||result?.mayHaveBeenReceived===true} inputRef={node=>{fieldRefs.current.name=node;}} title="Your name" value={input.name} onChange={set("name")}/>
    <Field disabled={busy||result?.ok===true||result?.mayHaveBeenReceived===true} inputRef={node=>{fieldRefs.current.email=node;}} title="Email address" value={input.email} onChange={set("email")}/>
    <Field disabled={busy||result?.ok===true||result?.mayHaveBeenReceived===true} inputRef={node=>{fieldRefs.current.phone=node;}} title="Phone number (optional)" value={input.phone} onChange={set("phone")}/>
    <Text style={sub}>Optional requirements are shared with the business for review; no date, quantity, access arrangement or price is confirmed.</Text>
    <EnquiryTopicShortcuts requirements={input.requirements||emptyEnquiryRequirements()} onChoose={value=>set('requirements')(current=>applyEnquiryTopicSuggestion(current,value.topic))} disabled={busy||result?.ok===true||result?.mayHaveBeenReceived===true} colors={COLORS}/>
    {ENQUIRY_REQUIREMENTS.map(field=><Field disabled={busy||result?.ok===true||result?.mayHaveBeenReceived===true} key={field.key} title={field.label} maxLength={field.max} value={(input.requirements||emptyEnquiryRequirements())[field.key]}
      onChange={value=>set('requirements')(current=>({...current,[field.key]:value}))}/>)}
    {type==="booking_request"?<>
      <Field disabled={busy||result?.ok===true||result?.mayHaveBeenReceived===true} inputRef={node=>{fieldRefs.current.service=node;}} title="Service you want" value={input.service} onChange={set("service")}/>
      <Text style={{...sub,fontSize:13}}>Choose a preferred day, or type a different date below. These are NOT available appointment slots.</Text>
      <View style={{flexDirection:"row",flexWrap:"wrap",gap:7,marginTop:8}}>
       {dateChoices.map(day=><Pressable key={day.value} accessibilityRole="button"
         accessibilityLabel={"Prefer "+day.label}
         accessibilityState={{selected:input.preferredDate===day.value}}
         onPress={()=>set("preferredDate")(day.value)}
         style={{backgroundColor:input.preferredDate===day.value?COLORS.accent:COLORS.bg,
           borderColor:COLORS.line,borderWidth:1,paddingVertical:11,paddingHorizontal:12,
           minHeight:46,borderRadius:8}}>
         <Text style={{color:input.preferredDate===day.value?COLORS.bg:COLORS.text}}>
          {day.label}
         </Text>
       </Pressable>)}
      </View>
      <Field disabled={busy||result?.ok===true||result?.mayHaveBeenReceived===true} title="Preferred date (optional)" value={input.preferredDate}
       onChange={set("preferredDate")}/>
      <Field disabled={busy||result?.ok===true||result?.mayHaveBeenReceived===true} title="Notes (optional)" value={input.note}
       onChange={set("note")} multiline/>
     </>:<>
       <Text style={sub}>Optional requirements are included in your saved enquiry. They do not confirm quantity, timing, availability or attendance.</Text>

       <Field disabled={busy||result?.ok===true||result?.mayHaveBeenReceived===true} inputRef={node=>{fieldRefs.current.message=node;}} title="Your message" value={input.message} onChange={set("message")} multiline/>
     </>}
    {contentSelection&&typeof onRemoveAttachment==='function'?<>
      <Text style={sub}>This enquiry includes a selected listing. Removing it keeps your wording and requirements; check any item names in your message.</Text>
      <Button title="Remove selected listing" disabled={busy||result?.ok===true||result?.mayHaveBeenReceived===true} onPress={()=>{
       const current=latestDraft.current;
       if(inFlight.current||busy||current.input!==input||current.contentSelection!==contentSelection||current.live!==live||current.runtime!==runtime||current.result?.ok||current.result?.mayHaveBeenReceived)return;
       onRemoveAttachment({input:{...input,service:''},result:null,possibleDuplicateRetry:false,enquiryReview:null});
      }}/>
      {result?.mayHaveBeenReceived?<Text style={sub}>Keep this attachment while the earlier request is unconfirmed. Do not create a replacement request.</Text>:null}
    </>:null}
    {typeof onReturnToInformation==='function'?<Button title="Back to item information" disabled={busy||inFlight.current} onPress={()=>{if(inFlight.current||busy)return;onSaveState?.({input,result,possibleDuplicateRetry,enquiryReview});onReturnToInformation();}}/>:null}
    <Text style={{...sub,fontSize:12}}>By sending, you share these details with the business
      so it can reply. Anti-spam verification may take a few moments.
      This is not a confirmed booking or payment.</Text>
    {busy?<ActivityIndicator color={COLORS.accent} style={{marginTop:15}}/>:null}
    {reviewCurrent?<View accessibilityLiveRegion="polite">
      <Text style={t}>Review exactly what will be sent</Text>
      {Object.entries(enquiryReview.payload).map(([key,value])=><Text key={key} selectable style={sub}>{key+': '+(value||'(not supplied)')}</Text>)}
      <Text style={sub}>Confirm to share these details with this business. Editing requires a new review. No booking, order or payment is confirmed.</Text>
      <Button title={type==='booking_request'?"Correct my booking request":"Correct my enquiry"} disabled={busy} onPress={()=>setEnquiryReview(null)}/>
    </View>:null}
    <Button title={busy?"Verifying and sending…":
      type==="booking_request"?(reviewCurrent?"Confirm and send booking request":"Review booking request"):reviewCurrent?"Confirm and send enquiry":"Review enquiry"}
      disabled={busy||result?.ok===true||
       (result?.mayHaveBeenReceived===true&&!possibleDuplicateRetry)} onPress={send}/>
    {result?<Text accessibilityLiveRegion="polite" accessibilityRole="text"
       style={{color:result.ok?"#91E1B8":"#FFD8A8",marginTop:15}}>
       {result.ok?result.message:result.reason}
       {result.ok?" Keep this confirmation for your records.":""}
     </Text>:null}
    {result?.ok&&typeof result.requestId==='string'&&/^[a-zA-Z0-9_-]{1,120}$/.test(result.requestId)?<Text selectable accessibilityLiveRegion="polite" style={sub}>{'Saved request reference: '+result.requestId+'. This identifies the request; it is not appointment, order or delivery confirmation.'}</Text>:null}
    {result?.ok?<Button title="Start a separate new request"
       onPress={()=>{
        setInput({name:"",email:"",phone:"",service:initialService,
         preferredDate:"",message:"",note:""});
        setResult(null);setPossibleDuplicateRetry(false);
       }}/>:null}
    {result?.mayHaveBeenReceived?<Text style={sub}>These request details stay fixed while the outcome is unconfirmed. Check the original request before retrying; changed details are not silently resent.</Text>:null}
    {result?.mayHaveBeenReceived&&!possibleDuplicateRetry?<View>
      <Text style={sub}>
       Don't send repeatedly unless you have checked with the business:
       an earlier request might already have been recorded.
      </Text>
      <Button title="I understand — allow one more attempt"
       onPress={()=>setPossibleDuplicateRetry(true)}/>
     </View>:null}
   </>
  )}
 </View>;
}
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
    {["enquiry","booking_request"].includes(chosen.key)?
     <RequestScreen key={requestFormKey}
      screen={chosen} live={live} runtime={runtime} contentSelection={requestSelection}
      savedState={requestForms.current.get(requestFormKey)}
      onRemoveAttachment={value=>{
       if(viewContext.current!==publicViewContext||requestIdentity.current!==requestFormKey||!requestSelection||chosen.key!=='enquiry')return;
       const previous=requestForms.current.get(requestFormKey);
       if(previous?.result?.ok||previous?.result?.mayHaveBeenReceived)return;
       const nextKey=JSON.stringify([live?.versionId,chosen.key,'service','',requestedIntent,null]);
       requestForms.current.delete(requestFormKey);
       requestForms.current.set(nextKey,{...value,enquiryReview:null,result:null,possibleDuplicateRetry:false});
       if(requestForms.current.size>8)requestForms.current.delete(requestForms.current.keys().next().value);
       setRequestSelection(null);setRequestedService('');setRequestedKind('service');setRequestedMessage('');
      }}
      onReturnToInformation={requestOrigin&&pages.some(page=>page.key===requestOrigin)?()=>{if(viewContext.current===publicViewContext)setCurrent(requestOrigin);}:null}
      onSaveState={value=>{if(viewContext.current!==publicViewContext)return;const key=requestFormKey;requestForms.current.set(key,value);if(requestForms.current.size>8)requestForms.current.delete(requestForms.current.keys().next().value);}}
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
