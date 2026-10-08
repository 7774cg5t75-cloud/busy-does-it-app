import React from "react";
import {View,Text,Pressable,Linking} from "react-native";

/**
 * Expo Snack / Expo Go only:
 * The production Business App uses react-native-qrcode-svg as usual. Snack's
 * native runtime may not include the corresponding SVG TurboModule.
 * Show the exact owner-shareable HTTPS link instead of crashing startup.
 * No external QR generation service is contacted.
 */
function SnackQrFallback({value="",size=220}){
  const link=typeof value==="string"?value.trim():"";
  const canOpen=/^https:\/\/[^\s]+$/i.test(link);
  const open=()=>{
    if(canOpen)Linking.openURL(link).catch(()=>{});
  };
  return (
    <View style={{width:Math.min(Math.max(Number(size)||220,180),280),
      padding:12,backgroundColor:"#f4f5f7",borderWidth:1,
      borderColor:"#c6ced9",borderRadius:12,alignItems:"center"}}>
      <Text style={{fontWeight:"700",fontSize:14,color:"#1b2635",textAlign:"center"}}>
        Your Business App share link
      </Text>
      <Text style={{fontSize:12,color:"#31435b",textAlign:"center",marginTop:8}}>
        QR artwork is not available inside this Expo Go preview. It is included
        in the native development and production builds.
      </Text>
      {canOpen?(
        <Pressable
          accessibilityRole="link"
          onPress={open}
          style={{backgroundColor:"#2563eb",paddingHorizontal:14,paddingVertical:9,
            borderRadius:8,marginTop:12}}>
          <Text style={{color:"white",fontSize:14,fontWeight:"700"}}>Open share link</Text>
        </Pressable>
      ):(
        <Text style={{fontSize:12,color:"#58677c",textAlign:"center",marginTop:12}}>
          Publish your Business App to create its shareable link.
        </Text>
      )}
      {canOpen?(
        <Text selectable style={{fontSize:10,color:"#31435b",marginTop:10,textAlign:"center"}}>
          {link}
        </Text>
      ):null}
    </View>
  );
}
export default SnackQrFallback;
