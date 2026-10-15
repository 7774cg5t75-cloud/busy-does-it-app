// Original review-only voice/language handlers, extracted without another engine.
function createWebsiteVoiceActions({websiteBeginTask,websiteTaskAwait,websiteTaskCurrent,websiteAsyncGateRef,websiteDraftRef,cloudWorkspace,ownerAccessToken,fetchWithTimeout,BUSY_COMMAND_URL,BUSY_AI_TOKEN,busyRequestId,selectedWebsiteVoiceContextIsCurrent,ExpoFile,voiceUploadEligible,expoFetch}){
const interpretWebsitePageLanguage=async({pageId,generation,instruction,conversationContext}={})=>{
    const task=websiteBeginTask("language");if(!task)return {ok:false,reason:"The website changed. Review your latest draft."};
    try{
    const current=websiteDraftRef.current;
    const stillCurrent=()=>{
      const now=websiteDraftRef.current;
      return !!now?.id&&now.id===current?.id&&now.generation===generation&&
        now.pages?.some(p=>p.id===pageId&&p.enabled!==false);
    };
    if(!stillCurrent()||typeof instruction!=="string"||
       !instruction.trim()||instruction.length>400)
      return {ok:false,reason:"Select a current page and a short description of your changes."};
    const workspace=cloudWorkspace?.businessId||"";
    const token=await websiteTaskAwait(task,async()=>(ownerAccessToken()));
    if(!workspace||!token)return {ok:false,reason:"Sign in to your business to use AI interpretation."};
    if(!stillCurrent())return {ok:false,reason:"Your website changed. No AI request was sent."};
    const sectionIds=current.pages.find(p=>p.id===pageId)?.sectionIds||[];
    const sections=(current.sections||[]).filter(p=>p.enabled!==false&&sectionIds.includes(p.id))
      .slice(0,30).map(p=>({id:p.id,title:String(p.title||p.id).slice(0,100)}));
    // Local conversation is only context. The server never treats its
    // history as instructions to execute, and this app validates the result.
    const history=Array.isArray(conversationContext?.history)
      ?conversationContext.history.slice(-5).filter(turn=>
        ["owner","busy"].includes(turn?.role)&&typeof turn.text==="string"&&
        turn.text.trim().length>0&&turn.text.length<=400):[];
    const preserve={keepColours:conversationContext?.keepColours===true,
      keepPhotos:conversationContext?.keepPhotos===true};
    try{
      const response=await websiteTaskAwait(task,async()=>(fetchWithTimeout(BUSY_COMMAND_URL,{
        method:"POST",headers:{apikey:BUSY_AI_TOKEN,Authorization:`Bearer ${token}`,
          "Content-Type":"application/json",
          "x-busy-request-id":busyRequestId("website-page-intent")},
        body:JSON.stringify({mode:"website-page-intent-v1",ownerConsent:true,
          businessId:workspace,sections,text:instruction,history,preserve})
      },30000)));
      const data=await websiteTaskAwait(task,async()=>(response.json().catch(()=>({}))));
      if(!response.ok)throw Error(String(data.error||"Language interpretation unavailable."));
      if(data.mode!=="website-page-intent-v1"||data.requiresReview!==true||
         data.action!==null||data.command!==null||data.changesApplied!==false)
        throw Error("The AI result was not review-only. No changes were made.");
      if(!stillCurrent())return {ok:false,reason:"Your website changed while BUSY was interpreting the request. No changes were applied."};
      const canonical=String(data.canonicalInstruction||"").trim().slice(0,400);
      if(!canonical)return {ok:false,clarification:String(data.clarification||"Could you clarify how you want the page to look?").slice(0,250),reason:"BUSY needs a little more detail. No changes were made."};
      // Prevent unsupported or invented AI operations from reaching the draft.
      const checked=planWebsitePageInstructions(current,{
        draftId:current.id,pageId,generation,instruction:canonical
      });
      if(!checked.ok)return {ok:false,reason:"BUSY needs clarification: "+String(checked.reason||"The request is not supported.").slice(0,200)};
      return {ok:true,canonical,steps:checked.steps.length,
        reason:"BUSY interpreted "+checked.steps.length+" safe change(s). Check the wording and preview before applying. Nothing was saved.",
        chargedRequest:true};
    }catch(error){if(!websiteTaskCurrent(task))return {ok:false,reason:"The website changed. Review your latest draft."};
      return {ok:false,reason:String(error?.message||"BUSY could not interpret that request. No changes were made.").slice(0,250)};
    }

    }catch{return {ok:false,reason:"The website operation could not complete. Review your current draft before retrying."};}finally{websiteAsyncGateRef.current.finish(task);}
  };
const transcribeSelectedWebsiteAudio = async (audioUri, selection) => {
    const task=websiteBeginTask("voice");if(!task)return {ok:false,error:"The website changed. Select it again."};
    try{
    const selectionIsCurrent=()=>selectedWebsiteVoiceContextIsCurrent(websiteDraftRef.current,selection);
    if(!selectionIsCurrent())return {ok:false,error:"Your website changed. Tap the part you want to edit again."};
    try{
      const file=new ExpoFile(String(audioUri||""));
      if(!file.exists||!voiceUploadEligible(Number(file.size||0)))
        return {ok:false,error:"This recording exceeds the 9 MB upload allowance or is empty. No audio was sent. Record a shorter instruction."};
      const token=await websiteTaskAwait(task,async()=>(ownerAccessToken()));
      if(!token)return {ok:false,error:"Sign in again before using voice editing."};
      if(!selectionIsCurrent())return {ok:false,error:"The selected website part changed. Tap it again."};
      const form=new FormData();
      form.append("mode","website-selection-transcript-v1");
      form.append("audio",file,`busy-selected-website-${Date.now()}.m4a`);
      const response=await websiteTaskAwait(task,async()=>(fetchWithTimeout(BUSY_COMMAND_URL,{
        method:"POST",
        headers:{apikey:BUSY_AI_TOKEN,Authorization:`Bearer ${token}`,
          "x-busy-request-id":busyRequestId("website-selected-transcript")},
        body:form
      },45000,expoFetch)));
      const payload=await websiteTaskAwait(task,async()=>(response.json().catch(()=>({}))));
      if(!response.ok)throw Error(String(payload?.error||"Voice transcription is not available."));
      if(payload?.mode!=="website-selection-transcript-v1"||
         payload.requiresReview!==true||payload.command!==null||payload.action!==null||
         !String(payload.transcript||"").trim())
        throw Error("The service did not return a transcription-only result. No change was made.");
      if(!selectionIsCurrent())return {ok:false,error:"Your website changed while BUSY was listening. Tap the part again; no edit was applied."};
      const usage=payload.voiceUsage||{};
      const remaining=Number.isInteger(usage.remaining)&&usage.remaining>=0&&
        usage.remaining<=12?usage.remaining:null;
      return {ok:true,transcript:String(payload.transcript).trim().slice(0,400),
        remaining,dailyLimit:12};
    }catch(error){if(!websiteTaskCurrent(task))return {ok:false,error:"The website changed. Select it again."};
      return {ok:false,error:String(error?.message||"Voice transcription failed. Your website was not changed.").slice(0,240)};
    }

    }finally{websiteAsyncGateRef.current.finish(task);}
  };
const transcribeWebsitePageAudio=async(audioUri,scope)=>{
    const task=websiteBeginTask("voice");if(!task)return {ok:false,error:"The website changed. Select it again."};
    try{
    const isCurrent=()=>{
      const now=websiteDraftRef.current;
      return !!now?.id&&now.id===scope?.draftId&&
        now.generation===scope?.generation&&
        now.pages?.some(p=>p.id===scope?.pageId&&p.enabled!==false);
    };
    if(!isCurrent())return {ok:false,error:"This website page has changed. Select it again."};
    try{
      const file=new ExpoFile(String(audioUri||""));
      if(!file.exists||!voiceUploadEligible(Number(file.size||0)))
        return {ok:false,error:"Recording must be under 9 MB. Nothing was sent."};
      const token=await websiteTaskAwait(task,async()=>(ownerAccessToken()));
      if(!token)return {ok:false,error:"Sign in again before transcribing."};
      if(!isCurrent())return {ok:false,error:"The draft changed before sending. Nothing was sent."};
      const form=new FormData();
      form.append("mode","website-page-transcript-v1");
      form.append("audio",file,`busy-website-page-${Date.now()}.m4a`);
      const response=await websiteTaskAwait(task,async()=>(fetchWithTimeout(BUSY_COMMAND_URL,{
        method:"POST",headers:{apikey:BUSY_AI_TOKEN,Authorization:`Bearer ${token}`,
          "x-busy-request-id":busyRequestId("website-page-transcript")},body:form
      },45000,expoFetch)));
      const data=await websiteTaskAwait(task,async()=>(response.json().catch(()=>({}))));
      if(!response.ok)throw Error(String(data.error||"Page transcription failed."));
      if(data.mode!=="website-page-transcript-v1"||data.requiresReview!==true||
         data.action!==null||data.command!==null||
         !String(data.transcript||"").trim())
        throw Error("The provider did not return review-only text.");
      if(!isCurrent())return {ok:false,error:"Website changed while transcribing. Nothing was applied."};
      const remaining=data.voiceUsage?.remaining;
      return {ok:true,transcript:String(data.transcript).trim().slice(0,400),
        remaining:Number.isInteger(remaining)&&remaining>=0&&remaining<=12?remaining:null,
        dailyLimit:12};
    }catch(error){if(!websiteTaskCurrent(task))return {ok:false,error:"The website changed. Select it again."};
      return {ok:false,error:String(error?.message||"Transcription failed. No changes were made.").slice(0,240)};
    }

    }finally{websiteAsyncGateRef.current.finish(task);}
  };
return {interpretWebsitePageLanguage,transcribeSelectedWebsiteAudio,transcribeWebsitePageAudio};
}
export {createWebsiteVoiceActions};
