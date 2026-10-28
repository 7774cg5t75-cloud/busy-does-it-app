import {appColors as C} from '../theme/appearance.mjs';
import React from "react";
import {Pressable,Text,View} from "react-native";
import {AudioModule,RecordingPresets,setAudioModeAsync,
 useAudioRecorder,useAudioRecorderState} from "expo-audio";
import {styles} from "../theme/styles";
import {voiceDurationState} from "../core/websiteVoiceRecordingPolicy.mjs";

/**
 * V3.142: explicit START -> RECORD -> STOP -> REVIEW -> SEND sequence.
 * Silence never stops recording. Five-minute announced safety cutoff does
 * not send any audio; only a separate user tap can request transcription.
 * Closing the editor discards the unsent recording, not the website draft.
 */
function WebsiteSelectedVoice({selection,startImmediately=false,onTranscribe,onTranscript,contextLabel="selected element",editorKind="website"}){
 const recorder=useAudioRecorder(RecordingPresets.HIGH_QUALITY);
 const state=useAudioRecorderState(recorder,250);
 const working=React.useRef(false);
 const started=React.useRef(false);
 const autoStarted=React.useRef(false);
 const alive=React.useRef(true);
 const [stage,setStage]=React.useState("idle");
 const [message,setMessage]=React.useState("");
 const [pendingUri,setPendingUri]=React.useState("");
 const [elapsedAtStop,setElapsedAtStop]=React.useState(0);
 const time=voiceDurationState(stage==="recording"?state.durationMillis:elapsedAtStop);
 const forApp=editorKind==="app";
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
  if(working.current||started.current||state.isRecording||
     stage==="transcribing"||stage==="review"||stage==="starting")return;
  working.current=true;
  setPendingUri("");setElapsedAtStop(0);
  setStage("starting");setMessage("Checking microphone permission…");
  try{
   const permission=await AudioModule.requestRecordingPermissionsAsync();
   if(!alive.current)return;
   if(!permission.granted){
    setStage("error");
    setMessage("Microphone permission is off. Enable it in Settings or type instead.");
    return;
   }
   await setAudioModeAsync({playsInSilentMode:true,allowsRecording:true});
   await recorder.prepareToRecordAsync();
   if(!alive.current)return;
   recorder.record();
   started.current=true;
   setStage("recording");
   setMessage("Listening. Pauses are fine — Busy waits for you to press Stop.");
  }catch(error){
   if(alive.current){
    setStage("error");
    setMessage(String(error?.message||"Microphone could not start. You can type instead."));
   }
   await setAudioModeAsync({playsInSilentMode:true,allowsRecording:false}).catch(()=>{});
  }finally{working.current=false;}
 };
 // The owner explicitly tapped the selected element's toolbar microphone.
 // Start the same guarded recording flow; no server upload happens until
 // the owner later taps Send after pressing Stop.
 React.useEffect(()=>{
  if(startImmediately&&!autoStarted.current){
   autoStarted.current=true;
   void start();
  }
 },[startImmediately]);
 const stop=async(limitReached=false)=>{
  if(working.current||!started.current)return;
  working.current=true;
  started.current=false;
  setElapsedAtStop(Number(state.durationMillis)||0);
  setStage("stopping");
  setMessage("Saving your recording on this device…");
  try{
   await recorder.stop();
   await setAudioModeAsync({playsInSilentMode:true,allowsRecording:false});
   if(!alive.current)return;
   const uri=recorder.uri;
   if(!uri)throw Error("The recording could not be saved. Try again or type.");
   setPendingUri(uri);
   setStage("review");
   setMessage(limitReached
     ?"Five-minute recording limit reached. Your words were saved locally. Nothing was sent. Review or discard."
     :"Recording stopped. Nothing has been sent. Tap Send for transcription or discard it.");
  }catch(error){
   await setAudioModeAsync({playsInSilentMode:true,allowsRecording:false}).catch(()=>{});
   if(alive.current){
    setStage("error");
    setMessage(String(error?.message||"Recording could not be saved. Nothing was sent."));
   }
  }finally{working.current=false;}
 };
 // Duration is a protection against accidental indefinite capture, NOT
 // end-of-speech detection. Pauses of any length under the cap do nothing.
 React.useEffect(()=>{
  if(stage==="recording"&&time.atLimit&&started.current&&!working.current){
   void stop(true);
  }
 },[stage,time.atLimit]);
 const discard=()=>{
  if(stage!=="review"||working.current)return;
  setPendingUri("");
  setElapsedAtStop(0);
  setStage("idle");
  setMessage("Recording discarded. No audio was sent and no builder change was made.");
 };
 const send=async()=>{
  if(stage!=="review"||!pendingUri||working.current)return;
  working.current=true;
  setStage("transcribing");
  setMessage("Transcribing the recording for your review. No builder changes are made.");
  try{
   const result=await onTranscribe?.(pendingUri,selection);
   if(!alive.current)return;
   if(!result?.ok||!result?.transcript)
    throw Error(result?.error||"Transcription unavailable. Type your instruction instead.");
   onTranscript?.(result.transcript);
   setPendingUri("");
   setStage("idle");
   setMessage("Transcription ready. Check the words below, then explicitly apply your change."+
    (Number.isInteger(result.remaining)?" "+result.remaining+
      " of 12 "+(forApp?"app":"selected-website")+" voice requests remain today (UTC).":""));
  }catch(error){
   // Never retry a chargeable upload automatically. The owner must start
   // a new recording or type a request; avoid repeated unknown charges.
   if(alive.current){
    setPendingUri("");
    setStage("error");
    setMessage(String(error?.message||"Transcription failed. No website change was made.").slice(0,250));
   }
  }finally{working.current=false;}
 };
 const listening=stage==="recording";
 const busy=["starting","stopping","transcribing"].includes(stage);
 const button=(label,handler,disabled=false,color=C.blue)=>
  <Pressable accessibilityRole="button" accessibilityLabel={label}
   accessibilityState={{disabled:disabled||busy}}
   disabled={disabled||busy} onPress={handler}
   style={({pressed})=>({backgroundColor:disabled||busy?C.surface:color,minHeight:48,justifyContent:"center",paddingVertical:15,
    paddingHorizontal:14,borderRadius:12,marginVertical:5,
    opacity:pressed?.88:1})}>
   <Text style={{color:disabled||busy?C.muted:color===C.surface?C.ink:C.onAction,fontWeight:"700",textAlign:"center",fontSize:16,lineHeight:23}}>
    {label}
   </Text>
  </Pressable>;
 return <View style={{marginTop:12,marginBottom:10}}>
  <Text style={styles.sectionLabel}>Or say your change</Text>
  <Text style={styles.cardBody}>
   {forApp?"This recording is only for the selected private app design element. BUSY returns text for your review and does not change or publish your app. ":
    contextLabel==="page"?"This recording is for the entire current website page. Name the sections you want changed. No change is applied until you review, preview and approve. ":""}
   Tap Record, speak naturally, then tap Stop yourself. BUSY never stops because you pause.
   A clearly shown five-minute safety limit prevents accidental endless recording.
   Voice transcription uses a cloud service and may incur usage cost. There is a separate 12-request daily allowance for this editing mode (UTC).
  </Text>
  {listening?(
   <View accessibilityLiveRegion="polite">
    <Text style={{color:C.red,fontSize:22,lineHeight:30,fontWeight:"700"}}>
     {"● Recording  "+time.elapsed+" / 05:00"}
    </Text>
    <Text style={styles.cardBody}>
     {time.warning?"Less than a minute left before the safety limit. Stop whenever you finish.":
      "Take your time — even a long silence won't stop the recording."}
    </Text>
   </View>
  ):null}
  {stage==="review"?(
   <>
    <Text style={styles.cardBody}>{"Recorded "+voiceDurationState(elapsedAtStop).elapsed+
      ". Sending uses one of today\'s 12 voice requests; no edits are applied automatically."}</Text>
    {button("Send recording for transcription",send)}
    {button("Discard recording — do not send",discard,false,C.surface)}
   </>
  ):(
   button(listening?"■ Stop recording — keep it for review":
     busy?"BUSY is preparing…":forApp?"🎙 Start recording app change":contextLabel==="page"?"🎙 Start recording page request":"🎙 Start recording this part",
     listening?()=>stop(false):start,busy,listening?C.redAction:C.blue)
  )}
  {message?<Text accessibilityRole="alert" style={styles.cardBody}>{message}</Text>:null}
 </View>;
}
export {WebsiteSelectedVoice};
