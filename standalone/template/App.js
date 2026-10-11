/**
 * V3.155 independent native Business App. Offline by default.
 * A separately owner-approved LIVE connection loads only a strict public
 * published version. Enquiries/booking requests use BUSY's verified public
 * challenge/submit service, never a fake local acknowledgement.
 */
import React,{useState,useEffect} from "react";
import {SafeAreaView,ScrollView,View,Text,TextInput,Pressable,StatusBar,Image,
 ActivityIndicator} from "react-native";
import prototype from "./prototype.json";
import {verifiedPublicRuntime,publicNativeApp} from "./nativeBusinessClient";
import {sendNativeGuestRequest} from "./nativeGuestRequests";
const LOOK=prototype.appearance||{};
const COLORS={bg:"#101827",surface:"#1C293C",text:"#F1F6FF",muted:"#A3B5D0",
 accent:"#6E9EFF",line:"#394A64"};
const box={backgroundColor:COLORS.surface,borderRadius:15,padding:17,marginBottom:12};
const t={color:COLORS.text},sub={color:COLORS.muted,marginTop:9,fontSize:15,lineHeight:22};
function Button({title,onPress,disabled=false}){
 return <Pressable accessibilityRole="button" accessibilityLabel={title} disabled={disabled}
   onPress={onPress} style={{backgroundColor:disabled?COLORS.line:COLORS.accent,
     padding:14,borderRadius:11,marginTop:12}}>
   <Text style={{color:disabled?COLORS.muted:COLORS.bg,fontSize:15,
     fontWeight:"700",textAlign:"center"}}>{title}</Text>
 </Pressable>;
}
function Field({title,value,onChange,multiline=false}){
 return <View style={{marginTop:13}}>
  <Text style={{color:COLORS.text,fontWeight:"600"}}>{title}</Text>
  <TextInput accessibilityLabel={title} value={value} onChangeText={onChange}
    multiline={multiline} keyboardType={title==="Email address"?"email-address":"default"}
    autoCapitalize={title==="Email address"?"none":"sentences"}
    placeholderTextColor={COLORS.muted}
    style={{color:COLORS.text,backgroundColor:COLORS.bg,borderColor:COLORS.line,
      borderWidth:1,borderRadius:9,padding:12,marginTop:6,
      minHeight:multiline?92:45,textAlignVertical:"top"}}/>
 </View>;
}
function RequestScreen({screen,live,runtime}){
 const [input,setInput]=useState({name:"",email:"",phone:"",service:"",
  preferredDate:"",message:"",note:""});
 const [busy,setBusy]=useState(false),[result,setResult]=useState(null);
 const type=screen.key==="booking_request"?"booking_request":"enquiry";
 const enabled=type==="booking_request"?live?.supportsBookingRequest:live?.supportsEnquiry;
 const set=(key)=>(value)=>{setInput(prev=>({...prev,[key]:value}));setResult(null);};
 const send=async()=>{
  if(busy||!enabled)return;
  setBusy(true);setResult(null);
  try{
   const next=await sendNativeGuestRequest(runtime,live,type,input);
   setResult(next);
  }finally{setBusy(false);}
 };
 return <View style={box}>
  <Text style={{...t,fontWeight:"700",fontSize:20}}>{screen.title}</Text>
  <Text style={sub}>{type==="booking_request"?
    "Ask for an appointment. The business must confirm the date and time before anything is booked.":
    "Send a message directly to this business using BUSY's verified guest request service."}</Text>
  {!enabled?<Text style={sub}>This customer request action is not available on the live app.</Text>:(
   <>
    <Field title="Your name" value={input.name} onChange={set("name")}/>
    <Field title="Email address" value={input.email} onChange={set("email")}/>
    <Field title="Phone number (optional)" value={input.phone} onChange={set("phone")}/>
    {type==="booking_request"?<>
      <Field title="Service you want" value={input.service} onChange={set("service")}/>
      <Field title="Preferred date (optional)" value={input.preferredDate}
       onChange={set("preferredDate")}/>
      <Field title="Notes (optional)" value={input.note}
       onChange={set("note")} multiline/>
     </>:<Field title="Your message" value={input.message}
        onChange={set("message")} multiline/>}
    <Text style={{...sub,fontSize:12}}>By sending, you share these details with the business
      so it can reply. Anti-spam verification may take a few moments.
      This is not a confirmed booking or payment.</Text>
    {busy?<ActivityIndicator color={COLORS.accent} style={{marginTop:15}}/>:null}
    <Button title={busy?"Verifying and sending…":
      type==="booking_request"?"Send booking REQUEST":"Send enquiry"}
      disabled={busy} onPress={send}/>
    {result?<Text accessibilityRole="text"
       style={{color:result.ok?"#91E1B8":"#FFD8A8",marginTop:15}}>
       {result.ok?result.message:result.reason}
       {result.ok?" Keep this confirmation for your records.":""}
     </Text>:null}
   </>
  )}
 </View>;
}
function LiveInfo({screen,app}){
 if(screen.key==="business_profile")return <View style={box}>
  <Text style={{...t,fontSize:21,fontWeight:"700"}}>{app.title}</Text>
  <Text style={sub}>{app.tagline||app.about||"Contact this business for more information."}</Text>
  {app.heroUrl?<Image source={{uri:app.heroUrl}} accessible
    accessibilityRole="image" accessibilityLabel="Business cover photo"
    style={{height:LOOK.imageScale==="large"?285:190,
      borderRadius:LOOK.imageCorners==="square"?2:12,marginTop:12}}
    resizeMode="cover"/>:null}
  {app.tagline&&app.about?<Text style={sub}>{app.about}</Text>:null}
 </View>;
 if(screen.key==="services")return <View style={box}>
   <Text style={{...t,fontSize:20,fontWeight:"700"}}>Services</Text>
   {app.services?.length?app.services.map((service,i)=><View key={i} style={{marginTop:14}}>
     <Text style={{...t,fontWeight:"700"}}>{service.name}</Text>
     <Text style={sub}>{service.description||"Ask the business for details."}</Text>
   </View>):<Text style={sub}>No public services are listed.</Text>}
 </View>;
 if(screen.key==="gallery")return <View style={box}>
   <Text style={{...t,fontSize:20,fontWeight:"700"}}>Approved photos</Text>
   {app.gallery?.length?<View style={{flexDirection:"row",flexWrap:"wrap",gap:8}}>
     {app.gallery.map((photo,i)=>
       <Image key={i} source={{uri:photo.uri}} accessible accessibilityRole="image"
        accessibilityLabel={String(photo.alt||photo.caption||"Business photo "+(i+1))}
        style={{width:LOOK.galleryLayout==="stack"?"100%":
          LOOK.imageScale==="large"&&LOOK.galleryLayout!=="grid"?"100%":"48%",
          height:LOOK.galleryLayout==="stack"?270:LOOK.imageScale==="large"?220:190,
          borderRadius:LOOK.imageCorners==="square"?2:11,marginTop:12}}/>
     )}</View>:<Text style={sub}>No photographs have been approved for this app yet.</Text>}
 </View>;
 if(screen.key==="contact")return <View style={box}>
   <Text style={{...t,fontSize:20,fontWeight:"700"}}>Contact</Text>
   {["phone","email","openingHours"].map(key=>app.contact?.[key]?
    <Text key={key} style={sub}>{key==="openingHours"?"Opening hours":key+": "}
       {app.contact[key]}</Text>:null)}
 </View>;
 return <View style={box}><Text style={sub}>
  This optional module requires its own public permission and runtime integration.
  No customer data or money is collected here.
 </Text></View>;
}
export default function App(){
 const runtime=prototype.runtimeConnection;
 const connected=verifiedPublicRuntime(runtime);
 const [current,setCurrent]=useState(prototype.screenSchema.screens[0].key);
 const [loading,setLoading]=useState(connected),[live,setLive]=useState(null),
  [error,setError]=useState("");
 useEffect(()=>{
  let active=true;
  if(!connected){setLoading(false);return ()=>{active=false;};}
  publicNativeApp(runtime).then(result=>{
   if(!active)return;
   setLive(result.ok?result.app:null);setError(result.ok?"":result.reason);setLoading(false);
  });
  return ()=>{active=false;};
 },[connected,runtime?.expectedVersionId]);
 const pages=live?prototype.screenSchema.screens.filter(s=>
  live.moduleKeys?.includes(s.key)):[];
 const chosen=pages.find(x=>x.key===current)||pages[0];
 return <SafeAreaView style={{flex:1,backgroundColor:COLORS.bg}}>
  <StatusBar barStyle="light-content"/>
  <ScrollView contentContainerStyle={{padding:LOOK.layoutDensity==="compact"?13:
      LOOK.layoutDensity==="airy"?28:20,paddingBottom:55}}>
   <Text style={{color:COLORS.accent,fontSize:12,fontWeight:"700",letterSpacing:1}}>
    {connected?"LIVE PUBLIC BUSINESS APP":"PRIVATE APP PROTOTYPE"}</Text>
   <Text style={{color:COLORS.text,fontSize:28,fontWeight:"800",marginTop:9}}>
    {live?.title||prototype.appName}</Text>
   <Text style={{color:COLORS.muted,fontSize:12,marginTop:5}}>
    {"Native layout • "+(LOOK.headerStyle||"refined")+" header • "+(LOOK.navigationStyle||"tabs")+" navigation"}
   </Text>
   {loading?<ActivityIndicator color={COLORS.accent} style={{marginTop:25}}/>:null}
   {error?<Text style={sub}>{error}</Text>:null}
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
    <View style={{flexDirection:"row",flexWrap:"wrap",marginBottom:15,gap:7}}>
     {pages.map(item=><Pressable key={item.key} accessibilityRole="button"
      accessibilityLabel={"View "+item.title} onPress={()=>setCurrent(item.key)}
      style={{backgroundColor:item.key===chosen.key?COLORS.accent:COLORS.surface,
       width:LOOK.navigationStyle==="list"?"100%":undefined,
       paddingHorizontal:13,paddingVertical:11,borderRadius:10}}>
      <Text style={{color:item.key===chosen.key?COLORS.bg:COLORS.text,
       fontWeight:"600"}}>{item.title}</Text>
     </Pressable>)}
    </View>
    {["enquiry","booking_request"].includes(chosen.key)?
     <RequestScreen key={chosen.key} screen={chosen} live={live} runtime={runtime}/>:
     <LiveInfo screen={chosen} app={live}/>}
   </View>:null}
   <Text style={{color:COLORS.muted,fontSize:12,marginTop:20}}>
    No app-store submission or third-party payment is performed by this app.
   </Text>
  </ScrollView>
 </SafeAreaView>;
}
