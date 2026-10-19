import {RequestDraftStatus} from './requestDraftStatus';
import {SelectedListingSummary} from './selectedListingSummary';
import React,{useState,useEffect} from 'react';
import {View,Text,Pressable,ActivityIndicator} from 'react-native';
import {EnquiryTopicShortcuts} from './enquiryTopicShortcuts';
import {ENQUIRY_REQUIREMENTS,emptyEnquiryRequirements,prepareCustomerEnquiry,customerEnquiryReview,prepareCustomerBookingNote,applyEnquiryTopicSuggestion} from './customerEnquiryRequirements.mjs';
import {prepareBusinessContentEnquiry} from './businessContentRecords.mjs';
import {sendNativeGuestRequest,validateNativeGuestRequest} from './nativeGuestRequests';
import {nativePreferredDates} from './nativePreferredDates.mjs';
// The original request screen, extracted unchanged. The app supplies its existing
// presentation primitives; submission, review, receipt and private state stay here.
export function createNativeRequestScreen({Button,Field,COLORS,box,t,sub}){
 return function RequestScreen({screen,live,runtime,initialService="",initialMessage="",savedState=null,onSaveState,onReturnToInformation,returnInformationLabel="Back to item information",onRemoveAttachment,contentSelection=null}){
 const [input,setInput]=useState(savedState?.input||{name:"",email:"",phone:"",service:initialService,
  preferredDate:"",message:initialMessage,note:"",requirements:emptyEnquiryRequirements()});
 const [busy,setBusy]=useState(false),[result,setResult]=useState(savedState?.result||null);
 const [possibleDuplicateRetry,setPossibleDuplicateRetry]=useState(savedState?.possibleDuplicateRetry||false);
 const [enquiryReview,setEnquiryReview]=useState(savedState?.enquiryReview||null);
 useEffect(()=>{if(!inFlight.current)onSaveState?.({input,result,possibleDuplicateRetry,enquiryReview});},[input,result,possibleDuplicateRetry,enquiryReview]);
 const inFlight=React.useRef(false);
 const fieldRefs=React.useRef({});
 const editEpoch=React.useRef(0),renderedEditEpoch=editEpoch.current;
 const latestDraft=React.useRef(null);latestDraft.current={input,result,contentSelection,live,runtime};
 const dateChoices=React.useMemo(()=>nativePreferredDates(new Date(),7),[]);
 const type=screen.key==="booking_request"?"booking_request":"enquiry";
 const enabled=type==="booking_request"?live?.supportsBookingRequest:live?.supportsEnquiry;
 const set=(key)=>(value)=>{
  if(inFlight.current||busy||latestDraft.current?.live!==live||latestDraft.current?.runtime!==runtime||latestDraft.current?.contentSelection!==contentSelection||latestDraft.current?.result?.ok||latestDraft.current?.result?.mayHaveBeenReceived)return;
  editEpoch.current++;
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
  if(inFlight.current||busy||editEpoch.current!==renderedEditEpoch||!enabled||result?.ok||
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
    <RequestDraftStatus busy={busy} reviewed={reviewCurrent} result={result} colors={COLORS}/>
    <SelectedListingSummary feed={live.businessContent} businessId={contentSelection?.businessId} selection={contentSelection} colors={COLORS}/>
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
       if(inFlight.current||busy||editEpoch.current!==renderedEditEpoch||current.input!==input||current.contentSelection!==contentSelection||current.live!==live||current.runtime!==runtime||current.result?.ok||current.result?.mayHaveBeenReceived)return;
       editEpoch.current++;
       const message=typeof initialMessage==='string'&&initialMessage?(input.message===initialMessage?'':input.message.startsWith(initialMessage+'\n')?input.message.slice(initialMessage.length+1):input.message):input.message;
       onRemoveAttachment({input:{...input,service:'',message},result:null,possibleDuplicateRetry:false,enquiryReview:null});
      }}/>
      {result?.mayHaveBeenReceived?<Text style={sub}>Keep this attachment while the earlier request is unconfirmed. Do not create a replacement request.</Text>:null}
    </>:null}
    {typeof onReturnToInformation==='function'?<Button title={returnInformationLabel} disabled={busy||inFlight.current} onPress={()=>{if(inFlight.current||busy)return;onSaveState?.({input,result,possibleDuplicateRetry,enquiryReview});onReturnToInformation();}}/>:null}
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
};
}
