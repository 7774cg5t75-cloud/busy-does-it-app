import React,{useEffect,useRef,useState} from "react";
import {ActivityIndicator,KeyboardAvoidingView,Platform,Pressable,ScrollView,StyleSheet,Text,TextInput,View} from "react-native";
import {createStagingAuthInspector,FIXTURES}
 from "./stagingAuthInspectorV3131.mjs";

/**
 * V3.131 development-only gate: no production business data or native login
 * preferences are imported here. Auth secrets exist only in local component
 * state until submission, then remain only in the private inspector closure.
 */
const SETTINGS={
 environment:process.env.EXPO_PUBLIC_BUSY_ENVIRONMENT||"",
 baseUrl:process.env.EXPO_PUBLIC_BUSY_STAGING_SUPABASE_URL||"",
 publishableKey:process.env.EXPO_PUBLIC_BUSY_STAGING_PUBLISHABLE_KEY||""
};
const copy={
 "staging-test-account-required":"Choose one of the two fictional test owners and enter its password.",
 "staging-sign-in-failed":"Supabase could not sign in to this fictional account. Check the password and confirmation.",
 "staging-network-unavailable":"Could not contact staging Supabase. Check the connection and try again.",
 "staging-identity-unverified":"Supabase did not confirm the expected staging identity.",
 "staging-own-row-failed":"The test owner could not read their own business record.",
 "staging-cross-owner-denial-failed":"Security check failed: access to the other business was not denied.",
 "staging-anonymous-denial-failed":"Security check failed: anonymous access was not denied.",
 "staging-account-changed":"The authenticated identity changed. Please sign in again.",
 "staging-session-cancelled":"This test session was cancelled.",
 "staging-no-session":"Sign in first.",
 "staging-not-configured":"Staging needs its own Supabase URL and public key before login can work."
};
function TestButton({title,onPress,disabled=false,secondary=false}){
 return <Pressable accessibilityRole="button" accessibilityLabel={title}
   disabled={disabled} onPress={onPress}
   style={[styles.button,secondary&&styles.secondary,disabled&&styles.disabled]}>
   <Text style={styles.buttonText}>{title}</Text>
 </Pressable>;
}
export default function StagingSignInScreen(){
 const inspector=useRef(null);
 if(!inspector.current)inspector.current=createStagingAuthInspector({config:SETTINGS});
 const [selected,setSelected]=useState("a");
 const [password,setPassword]=useState("");
 const [busy,setBusy]=useState(false);
 const [result,setResult]=useState(null);
 const [notice,setNotice]=useState("");
 const [status,setStatus]=useState("Not signed in");
 useEffect(()=>()=>{inspector.current?.clearLocal();},[]);
 const run=async(mode)=>{
  if(busy)return;
  setBusy(true);setNotice("");
  if(mode==="login"){
   const privatePassword=password;
   setPassword("");setResult(null);setStatus("Checking Supabase Auth and database...");
   try{
    const value=await inspector.current.signIn(FIXTURES[selected].email,privatePassword);
    setResult(value);setStatus("Real staging identity verified");
   }catch(e){setStatus("Verification not complete");setNotice(copy[e?.message]||"The staging check did not complete. Try again.");}
  }else if(mode==="recheck"){
   try{const value=await inspector.current.recheck();
    setResult(value);setStatus("Real staging identity verified");
   }catch(e){setResult(null);setStatus("Verification not complete");
    setNotice(copy[e?.message]||"The session is no longer verified. Sign in again.");}
  }else{
   await inspector.current.signOut();
   setResult(null);setStatus("Signed out of this test device");
   setNotice("Local session cleared. Existing access tokens can remain valid until their normal expiry.");
  }
  setBusy(false);
 };
 const choose=(key)=>{
  if(busy||inspector.current.signedIn)return;
  setSelected(key);setPassword("");setNotice("");setResult(null);
 };
 return <KeyboardAvoidingView style={styles.fill}
   behavior={Platform.OS==="ios"?"padding":undefined}>
  <ScrollView contentContainerStyle={styles.content}
    keyboardShouldPersistTaps="handled">
   <View style={styles.tag}><Text style={styles.tagText}>ISOLATED STAGING • V3.131</Text></View>
   <Text style={styles.title}>Test real Busy sign-in</Text>
   <Text style={styles.hint}>This is a separate test app. Use only the two fictional accounts in Busy Does It Staging. No production data or customer publishing.</Text>
   <View style={styles.panel}>
    <Text style={styles.label}>Supabase connection</Text>
    <Text style={inspector.current.configured?styles.good:styles.warning}>
      {inspector.current.configured?"Connected to the designated staging project":"Staging project key / URL not configured"}
    </Text>
    <Text style={styles.info}>Real Supabase authentication • read-only business checks • no saved session</Text>
   </View>
   <View style={styles.panel}>
    <Text style={styles.label}>Choose a fictional owner</Text>
    <View style={styles.choiceRow}>
     {["a","b"].map(k=><Pressable key={k}
       accessibilityRole="button" disabled={busy||inspector.current.signedIn}
       onPress={()=>choose(k)}
       style={[styles.choice,selected===k&&styles.choiceActive]}>
       <Text style={styles.choiceText}>Owner {k.toUpperCase()}</Text>
       <Text style={styles.choiceSub}>{FIXTURES[k].name}</Text>
     </Pressable>)}
    </View>
    <Text style={styles.label}>Account</Text>
    <Text style={styles.info}>{FIXTURES[selected].email}</Text>
    <Text style={[styles.label,{marginTop:16}]}>Test account password</Text>
    <TextInput accessibilityLabel="Fictional test account password"
      value={password} onChangeText={setPassword}
      placeholder="Password" placeholderTextColor="#8794a4"
      secureTextEntry autoCorrect={false} autoCapitalize="none"
      textContentType="password"
      editable={!busy&&!inspector.current.signedIn}
      style={styles.input}/>
    <TestButton title="Sign in and verify"
      onPress={()=>run("login")}
      disabled={!inspector.current.configured||busy||inspector.current.signedIn||!password}/>
   </View>
   <View style={styles.panel}>
    <Text style={styles.label}>Test results</Text>
    {busy?<ActivityIndicator color="#6fe3bc"/>:null}
    <Text style={styles.status}>{status}</Text>
    {result?<View>
      <Text style={styles.good}>✓ Genuine Supabase Auth identity verified</Text>
      <Text style={styles.good}>✓ Own fictional business record visible</Text>
      <Text style={styles.good}>✓ Other fictional business record hidden</Text>
      <Text style={styles.good}>✓ Anonymous access blocked</Text>
      <Text style={styles.info}>Signed in as {result.account}. Test data only.</Text>
      <Text style={styles.info}>Hosted HTTPS preview: not yet verified</Text>
    </View>:null}
    {notice?<Text style={styles.warning}>{notice}</Text>:null}
    <TestButton title="Recheck access" secondary
      disabled={busy||!inspector.current.signedIn}
      onPress={()=>run("recheck")}/>
    <TestButton title="Sign out and clear session" secondary
      disabled={busy||!inspector.current.signedIn}
      onPress={()=>run("logout")}/>
   </View>
   <Text style={styles.footer}>Passwords and tokens are never placed in GitHub, saved to AsyncStorage or printed in test results. Full app testing and hosted websites remain separate release gates.</Text>
  </ScrollView>
 </KeyboardAvoidingView>;
}
const styles=StyleSheet.create({
 fill:{flex:1,backgroundColor:"#080f19"},
 content:{paddingTop:64,paddingBottom:58,paddingHorizontal:20,maxWidth:540,width:"100%",alignSelf:"center"},
 tag:{alignSelf:"flex-start",borderRadius:20,backgroundColor:"#173929",paddingVertical:8,paddingHorizontal:13},
 tagText:{color:"#89edc6",fontSize:11,fontWeight:"700",letterSpacing:1},
 title:{color:"#f8fafc",fontSize:29,fontWeight:"800",marginTop:20,marginBottom:12},
 hint:{color:"#b6c4d4",fontSize:15,lineHeight:23,marginBottom:20},
 panel:{backgroundColor:"#122031",borderColor:"#2a3c4c",borderWidth:1,borderRadius:17,padding:18,marginBottom:14},
 label:{color:"#eaf0f6",fontSize:14,fontWeight:"700",marginBottom:8},
 info:{color:"#afc2d3",fontSize:13,lineHeight:21,marginTop:8},
 good:{color:"#78e6bb",fontSize:14,lineHeight:22,marginTop:8},
 warning:{color:"#ffcf85",fontSize:14,lineHeight:21,marginTop:8},
 status:{color:"#e6edf5",fontSize:16,fontWeight:"700",marginVertical:12},
 choiceRow:{flexDirection:"row",gap:9,marginBottom:18},
 choice:{flex:1,borderWidth:1,borderColor:"#455466",borderRadius:12,padding:13},
 choiceActive:{borderColor:"#6fe3bc",backgroundColor:"#183b37"},
 choiceText:{color:"#f1f5f9",fontWeight:"800",fontSize:15},
 choiceSub:{color:"#b9ccd9",fontSize:11,marginTop:5},
 input:{borderWidth:1,borderColor:"#435569",backgroundColor:"#080f19",
   color:"#f8fafc",fontSize:16,padding:13,borderRadius:12,marginBottom:14},
 button:{borderRadius:12,backgroundColor:"#14795c",paddingVertical:15,
   paddingHorizontal:14,alignItems:"center",marginTop:12},
 secondary:{backgroundColor:"#294155"},
 disabled:{opacity:.45},
 buttonText:{fontWeight:"800",color:"#ffffff",fontSize:14},
 footer:{color:"#859bb0",fontSize:12,lineHeight:18,marginHorizontal:2,marginTop:4}
});
