// Pure React Native preview of a finite, approved app-screen schema.
// No generated JavaScript, arbitrary web view, payment, or fake booking submit.
import React,{useState} from "react";
import {SafeAreaView,ScrollView,View,Text,Pressable,StatusBar} from "react-native";
import prototype from "./prototype.json";
const COLORS={bg:"#101827",surface:"#1C293C",text:"#F1F6FF",muted:"#A3B5D0",accent:"#6E9EFF"};
const box={backgroundColor:COLORS.surface,borderRadius:15,padding:17,marginBottom:12};
function ScreenBody({screen}){
 const request=screen.customerRequest===true;
 return <View style={box}>
   <Text style={{color:COLORS.text,fontWeight:"700",fontSize:20}}>{screen.title}</Text>
   <Text style={{color:COLORS.muted,marginTop:10,fontSize:15,lineHeight:22}}>
     {request?"This feature uses the verified BUSY customer request service when activated. This offline demonstration cannot send or confirm requests.":
       "This is a native screen placeholder using the business's approved module structure. Live public content requires the secured runtime connection."}
   </Text>
   {screen.requiresBusinessConfirmation?
     <Text style={{color:COLORS.accent,marginTop:12}}>Booking requests must be confirmed by the business. No automatic appointments.</Text>:null}
   {request?<Text style={{color:COLORS.muted,marginTop:10}}>Sending requests: not enabled in this private prototype</Text>:null}
 </View>;
}
export default function App(){
 const [current,setCurrent]=useState(prototype.screenSchema.screens[0].key);
 const screen=prototype.screenSchema.screens.find(x=>x.key===current)||prototype.screenSchema.screens[0];
 return <SafeAreaView style={{flex:1,backgroundColor:COLORS.bg}}>
  <StatusBar barStyle="light-content"/>
  <ScrollView contentContainerStyle={{padding:20,paddingBottom:55}}>
   <Text style={{color:COLORS.accent,fontSize:12,fontWeight:"700",letterSpacing:1}}>PRIVATE APP PROTOTYPE</Text>
   <Text style={{color:COLORS.text,fontSize:28,fontWeight:"800",marginTop:9}}>{prototype.appName}</Text>
   <Text style={{color:COLORS.muted,marginTop:8,marginBottom:19}}>
    Demonstration only. Not published, connected to customer data, or approved by an app store.
   </Text>
   <View style={{flexDirection:"row",flexWrap:"wrap",marginBottom:15,gap:7}}>
    {prototype.screenSchema.screens.map(item=><Pressable key={item.key}
      accessibilityRole="button" accessibilityLabel={"View "+item.title}
      onPress={()=>setCurrent(item.key)}
      style={{backgroundColor:item.key===current?COLORS.accent:COLORS.surface,
        paddingHorizontal:13,paddingVertical:11,borderRadius:10}}>
       <Text style={{color:item.key===current?COLORS.bg:COLORS.text,fontWeight:"600"}}>{item.title}</Text>
     </Pressable>)}
   </View>
   <ScreenBody screen={screen}/>
   <Text style={{color:COLORS.muted,fontSize:12}}>No store submission or third-party payment is performed by this app.</Text>
  </ScrollView>
 </SafeAreaView>;
}
