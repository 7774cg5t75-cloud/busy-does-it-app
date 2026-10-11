import React from "react";
import {Pressable,Text,View} from "react-native";
import {AudioModule,RecordingPresets,setAudioModeAsync,
 useAudioRecorder,useAudioRecorderState} from "expo-audio";
import {styles} from "../theme/styles";

/**
 * V3.141: Voice capture stays attached to ONE selected website element.
 * Recording requires an explicit tap and returns editable text only.
 * This component never invokes the Operator action router or applies a change.
 */
function WebsiteSelectedVoice({selection,onTranscribe,onTranscript}){
 const recorder=useAudioRecorder(RecordingPresets.HIGH_QUALITY);
 const state=useAudioRecorderState(recorder,250);
 const working=React.useRef(false);
 const started=React.useRef(false);
 const alive=React.useRef(true);
 const [stage,setStage]=React.useState("idle");
 const [message,setMessage]=React.useState("");
 React.useEffect(()=>{
  alive.current=true;
  return ()=>{
   alive.current=false;
   if(started.current){
    started.current=false;
    recorder.stop().catch(()=>{});
    setAudioModeAsync({playsInSilentMode:true,allowsRecording:false}).catch(()=>{});
   }
  };
 },[recorder]);
 const start=async()=>{
  if(working.current||started.current||state.isRecording||stage==="transcribing")return;
  working.current=true;
  setStage("starting");setMessage("Checking microphone access…");
  try{
   const permission=await AudioModule.requestRecordingPermissionsAsync();
   if(!alive.current)return;
   if(!permission.granted){
    setStage("error");setMessage("Microphone permission is off. Enable it in Settings, or type your instruction.");return;
   }
   await setAudioModeAsync({playsInSilentMode:true,allowsRecording:true});
   await recorder.prepareToRecordAsync();
   if(!alive.current)return;
   recorder.record();
   started.current=true;
   setStage("recording");
   setMessage("Listening to this selected part. Say one short instruction, then tap Stop.");
  }catch(e){
   if(alive.current){setStage("error");setMessage(String(e?.message||"Microphone unavailable. Type instead."));}
   await setAudioModeAsync({playsInSilentMode:true,allowsRecording:false}).catch(()=>{});
  }finally{working.current=false;}
 };
 const stop=async()=>{
  if(working.current||!started.current)return;
  working.current=true;
  started.current=false;
  setStage("transcribing");setMessage("Transcribing your words for review…");
  try{
   await recorder.stop();
   const uri=recorder.uri;
   await setAudioModeAsync({playsInSilentMode:true,allowsRecording:false});
   if(!alive.current)return;
   if(!uri)throw Error("No recording was saved. Try again or type.");
   const answer=await onTranscribe?.(uri,selection);
   if(!alive.current)return;
   if(!answer?.ok||!answer?.transcript)
    throw Error(answer?.error||"Voice transcription is unavailable. Type your instruction instead.");
   onTranscript?.(answer.transcript);
   setStage("idle");
   setMessage("Your words were transcribed. Review them before tapping Apply.");
  }catch(e){
   await setAudioModeAsync({playsInSilentMode:true,allowsRecording:false}).catch(()=>{});
   if(alive.current){setStage("error");setMessage(String(e?.message||"Voice was not understood. No changes were made.").slice(0,250));}
  }finally{working.current=false;}
 };
 const listening=stage==="recording"||(stage==="idle"&&state.isRecording);
 return <View style={{marginTop:12,marginBottom:10}}>
  <Text style={styles.sectionLabel}>Or say your change</Text>
  <Text style={styles.cardBody}>Your recording is sent to BUSY's transcription service, which may incur processing cost. No website action happens until you review and apply its words.</Text>
  <Pressable accessibilityRole="button"
   accessibilityLabel={listening?"Stop voice instruction and transcribe":"Record a voice instruction about this selection"}
   accessibilityState={{disabled:stage==="transcribing"||stage==="starting"}}
   disabled={stage==="transcribing"||stage==="starting"}
   onPress={listening?stop:start}
   style={({pressed})=>({backgroundColor:listening?"#9F4F3E":"#285B92",
    paddingVertical:16,paddingHorizontal:16,borderRadius:12,marginVertical:6,
    opacity:pressed?.8:1})}>
   <Text style={{color:"#FFFFFF",fontWeight:"800",textAlign:"center",fontSize:17}}>
    {listening?"■ Stop and transcribe":stage==="transcribing"?"Transcribing…":
      stage==="starting"?"Preparing microphone…":"🎙 Speak about this part"}
   </Text>
  </Pressable>
  {message?<Text accessibilityRole="alert" style={styles.cardBody}>{message}</Text>:null}
 </View>;
}
export {WebsiteSelectedVoice};
