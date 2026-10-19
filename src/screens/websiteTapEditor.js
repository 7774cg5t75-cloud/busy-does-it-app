import {selectedWebsiteComparisons} from '../core/websiteSelectedComparisons.mjs';
import {amendSelectedWebsiteQualityInstruction} from "../core/websiteSelectedChangePreview.mjs";
import {BuilderQualityNotice} from "../components/builderQualityNotice";
import {WebsiteTypographyControls} from "./websiteTypographyControls";
import {WebsitePhotoControls} from './websitePhotoControls';
import React from "react";
import {Image,KeyboardAvoidingView,Modal,Platform,SafeAreaView,ScrollView,Text,TextInput,View} from "react-native";
import {Button,Card,Field} from "../components/ui";
import {styles} from "../theme/styles";
import {interpretSelectedWebsiteRequest} from "../core/websiteContextualEdit.mjs";
import {planSelectedWebsiteChanges} from "../core/websiteContextPlan.mjs";
import {contextualEditExamples} from "../core/contextualEditingCore.mjs";
import {ownerDesignPreference} from "../core/websiteMeasuredDesignCoach.mjs";
import {WebsiteSelectedVoice} from "./websiteSelectedVoice";
import {WebView} from "react-native-webview";
import {withWebsitePreviewViewport} from "../core/websiteResponsivePreview.mjs";

const names={
 section:"Section",title:"Heading",body:"Wording",cta:"Button text",ctaHref:"Button destination",
 phone:"Phone number",email:"Email address",openingHours:"Opening hours",photo:"Photograph"
};
const list=x=>Array.isArray(x)?x:[];
// Photos are owner-approved media only; display only standard image schemes.
const photoPreviewSource=asset=>{
 const uri=typeof asset?.uri==="string"?asset.uri.trim():"";
 return /^(https:\/\/|file:\/\/)/i.test(uri)?{uri}:null;
};
function WebsiteTapEditor({draft,selection,initialMode="edit",onClose,onTextChange,onLayoutChange,onApplyInstruction,onPreviewInstruction,onTranscribe}){
 const [value,setValue]=React.useState("");
 const [confirmRemove,setConfirmRemove]=React.useState(false);
 const [showSectionDesign,setShowSectionDesign]=React.useState(false);
 const [showContextHelp,setShowContextHelp]=React.useState(false);
 const [contextRequest,setContextRequest]=React.useState("");
 const [contextNote,setContextNote]=React.useState("");
 const [showPhotoChoices,setShowPhotoChoices]=React.useState(false);
 const [selectedInstructionPreview,setSelectedInstructionPreview]=React.useState(null);
 const [showPreviewOriginal,setShowPreviewOriginal]=React.useState(false);
 const [comparisonSize,setComparisonSize]=React.useState("phone");
 const alive=React.useRef(true);React.useEffect(()=>{alive.current=true;return()=>{alive.current=false;};},[]);
 const editorLive=React.useRef(null);editorLive.current={draft,selection,contextRequest,value};
 // Old toolbar, wording and voice callbacks may survive a selection change.
 // They must not submit an earlier value against a replacement source.
 // Invalidate callbacks immediately, including before React renders the new text.
 const setContextDraft=words=>{editorLive.current.contextRequest=words;setContextRequest(words);};
 const current=()=>alive.current&&editorLive.current.draft===draft&&editorLive.current.selection===selection;
 const section=list(draft?.sections).find(s=>s.id===selection?.sectionId);
 const item=selection?.itemId?list(section?.items).find(x=>x.id===selection.itemId):null;
 const target=item||section;
 const field=selection?.field||"";
 const title=section?.title||"Website section";
 const key=[selection?.sectionId,selection?.field,selection?.itemId,selection?.photoIndex].join(":");
 React.useEffect(()=>{
  setValue(typeof target?.[field]==="string"?target[field]:"");
  setConfirmRemove(false);
  setShowSectionDesign(initialMode==="more"||selection?.field==="section");
  setShowContextHelp(initialMode==="voice");
  setContextDraft("");
  setContextNote("");
  setShowPhotoChoices(initialMode==="edit"&&selection?.field==="photo");
  setSelectedInstructionPreview(null);
  setShowPreviewOriginal(false);
  setComparisonSize("phone");
 },[key,draft?.updatedAt,initialMode]);
 const save=()=>{
  if(!current()||editorLive.current.value!==value||!selection||field==="photo")return;
  if(onTextChange?.({...selection,value})===true)onClose?.();
 };
 const apply=change=>{
  if(!current())return;
  if(onLayoutChange?.(change)===true)onClose?.();
 };
 const gallery=list(draft?.sections).find(x=>x.id==="gallery");
 const photos=list(gallery?.items).filter(x=>x?.approved!==false&&typeof x.storagePath==="string"&&x.storagePath.length);
 const photoIndex=selection?.photoIndex??-1;
 const selectedPhoto=section?.type==="gallery"?section?.items?.[photoIndex]:section?.asset;
 const selectedPhotoSource=photoPreviewSource(selectedPhoto);
 const contextExamples=contextualEditExamples({
  field,sectionType:section?.type,hasItem:!!item,
  compactHeadingPreference:section?.type==="hero"&&field==="title"
   ?ownerDesignPreference(draft,"compact-hero-title",selection?.pageId):null
 });
 const preparedInstruction=contextRequest.trim()
  ?planSelectedWebsiteChanges(draft,selection?.pageId,selection,contextRequest):null;
 const prepareContextChoice=instruction=>{
  const live=editorLive.current;
  if(live.draft!==draft||live.selection!==selection||live.contextRequest!==contextRequest)return;
  setContextDraft(instruction);setShowContextHelp(true);setSelectedInstructionPreview(null);
  setContextNote('Choice prepared. Compare it before using Apply; nothing has been saved.');
 };
 const previewContext=()=>{
  if(!current()||editorLive.current.contextRequest!==contextRequest)return;
  if(!preparedInstruction?.ok||!onPreviewInstruction){
   setContextNote(preparedInstruction?.reason||"Check your instruction before previewing.");
   return;
  }
  const outcome=onPreviewInstruction({selection,instruction:contextRequest});
  if(!outcome?.ok){
   setSelectedInstructionPreview(null);
   setContextNote(outcome?.reason||"That preview could not be prepared. No changes were made.");
   return;
  }
  setSelectedInstructionPreview(outcome);
  setShowPreviewOriginal(false);
  setContextNote("Your private comparison is ready. Nothing has been saved or published.");
 };
 const previewQualityAdjustment=repair=>{
  const live=editorLive.current;
  if(live.draft!==draft||live.selection!==selection||live.contextRequest!==contextRequest)return;
  const amended=amendSelectedWebsiteQualityInstruction(draft,{selection,instruction:contextRequest,repair});
  if(!amended.ok){setContextNote(amended.reason);return;}
  const outcome=onPreviewInstruction?.({selection,instruction:amended.instruction});
  if(!outcome?.ok){setContextNote(outcome?.reason||'The adjustment could not be previewed. Your current proposal is unchanged.');return;}
  setContextDraft(amended.instruction);setSelectedInstructionPreview(outcome);setShowPreviewOriginal(false);
  setContextNote('Suggested adjustment prepared with your other changes. Compare it, then use Apply if you want to keep it. Nothing was saved.');
 };
 const applyContext=(instruction)=>{
  if(!current()||editorLive.current.contextRequest!==contextRequest)return;
  const plan=planSelectedWebsiteChanges(draft,selection?.pageId,selection,instruction);
  if(!plan.ok){setContextNote(plan.reason);return;}
  if(onApplyInstruction){
   const applied=onApplyInstruction({selection,instruction});
   if(applied?.applied===true){setContextNote("");onClose?.();return;}
   setContextNote(applied?.reason||"BUSY couldn't safely make that change. Nothing was saved.");
   return;
  }
  // Existing single-step fallback for screens not using the new controller.
  // Never apply half a multi-step instruction.
  if(plan.steps.length!==1){
   setContextNote("This screen cannot safely apply several changes yet.");
   return;
  }
  const result=interpretSelectedWebsiteRequest(draft,selection?.pageId,selection,instruction);
  if(!result.ok){setContextNote(result.reason);return;}
  const applied=(result.type==="field"?onTextChange:onLayoutChange)?.(result.change)===true;
  if(applied){setContextNote("");onClose?.();}
  else setContextNote("BUSY couldn't apply that change. Check the website notice, or try a simpler request.");
 };
 const design=section?.appearance||{};
 const appearanceChoice=(field,value,label)=>{
  const photoOnly=section?.type==="gallery"&&selection?.field==="photo"&&
    ["photoCrop","photoFit"].includes(field)&&Number.isSafeInteger(photoIndex);
  const current=(photoOnly?section?.items?.[photoIndex]?.appearance?.[field]:design[field])||{
   headingScale:"normal",textAlign:"left",sectionSpacing:"normal",
   photoCrop:"center",photoFit:"cover",photoSide:"left",gallerySize:"comfortable"
  }[field];
  return <Button key={field+value} label={(current===value?"✓ ":"")+label}
    onPress={()=>apply(photoOnly
      ?{action:"image-style",sectionId:section?.id,photoIndex,field,value}
      :{action:"section-style",sectionId:section?.id,field,value})}/>;
 };
 return (
  <Modal visible={!!selection} onRequestClose={onClose}
   animationType="slide" presentationStyle="pageSheet">
   <SafeAreaView style={{flex:1,backgroundColor:"#0D131E"}}>
    <KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS==="ios"?"padding":undefined}>
     <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{padding:18,paddingBottom:40}}>
      <Text style={{color:"#F4F7FE",fontSize:24,fontWeight:"800",marginBottom:6}}>Edit this part</Text>
      <Text style={{color:"#B4C0D2",marginBottom:14}}>
       {title+" • "+(names[field]||"Selected element")}
      </Text>
      <Card eyebrow="Private website change" title={initialMode==="voice"?"Talk to BUSY about this part":initialMode==="more"?"More ways to adjust this part":field==="section"?"Adjust this section":field==="photo"?"Replace this picture":"Change the exact wording"}
       body="Your edits stay in your private draft. Nothing is published automatically, and you can undo a saved change."
       tone="blue">
       {selection&&field!=="photo"&&field!=="section"&&initialMode==="edit"?(
        <>
         {field==="body"?(
          <View style={styles.fieldWrap}>
           <Text style={styles.fieldLabel}>Your new wording</Text>
           <View style={styles.fieldBox}>
            <TextInput value={value} onChangeText={next=>{if(current())setValue(next);}}
             style={[styles.fieldInput,{minHeight:135,textAlignVertical:"top"}]}
             placeholderTextColor="#9AA3B2"
             placeholder="Type the exact wording you want" multiline
             textAlignVertical="top"/>
           </View>
          </View>
         ):(
          <Field label={names[field]||"Website wording"} value={value}
           onChangeText={next=>{if(current())setValue(next);}}
           autoCapitalize={field==="email"||field==="ctaHref"?"none":"sentences"}
           keyboardType={field==="email"?"email-address":field==="phone"?"phone-pad":"default"}
           placeholder="Write your replacement"/>
         )}
         <Button label="Save to private website draft" primary onPress={save}/>
         <WebsiteTypographyControls section={section} selection={selection} onChoose={prepareContextChoice}/>

        </>
       ):null}
       {selection&&field==="photo"&&initialMode==="edit"?(
        <>
         <Text style={styles.sectionLabel}>Currently selected photograph</Text>
         <WebsitePhotoControls draft={draft} selection={selection} section={section} onChoose={prepareContextChoice}/>
         {selectedPhotoSource?(
          <Image source={selectedPhotoSource} resizeMode="contain"
           accessibilityLabel={String(selectedPhoto?.alt||"Your selected business photograph").slice(0,120)}
           style={{height:190,width:"100%",backgroundColor:"#202D40",borderRadius:12,marginBottom:10}}/>
         ):(
          <Text style={styles.cardBody}>A local thumbnail is not available for this approved photo. You can still view the exact framing in your website preview.</Text>
         )}
         {section?.type==="gallery"?(
          <>
           <Text style={styles.cardBody}>{"Photo "+(photoIndex+1)+" of "+list(section.items).length+". Change its position or remove it from the draft gallery."}</Text>
           <Button label="Move photograph left / earlier"
            onPress={()=>prepareContextChoice('move this photo to the left')}/>
           <Button label="Move photograph right / later"
            onPress={()=>prepareContextChoice('move this photo to the right')}/>
           <Button label={confirmRemove?"Confirm remove from gallery":"Remove from this gallery"}
            onPress={()=>{
             if(!confirmRemove){setConfirmRemove(true);return;}
             apply({action:"remove-gallery-photo",sectionId:"gallery",photoIndex});
            }}/>
           <Text style={styles.cardBody}>Removing a gallery photograph does not delete its original file. Undo restores the previous gallery draft.</Text>
           {section?.items?.[photoIndex]?.storagePath?(
            <Button label="Use this approved picture as the main website photo"
             onPress={()=>apply({action:"choose-hero-photo",
              storagePath:section.items[photoIndex].storagePath})}/>
           ):null}
          </>
         ):(
          <>
           <Button label={showPhotoChoices?"Hide other approved pictures":"Choose another approved picture"}
            onPress={()=>setShowPhotoChoices(x=>!x)}/>
           {showPhotoChoices?(
            <View>
             <Text style={styles.cardBody}>Only your already-approved business photographs appear here. Tap one to replace this picture in your private draft.</Text>
             {photos.length?photos.slice(0,24).map((photo,i)=>(
              <View key={photo.storagePath||String(i)} style={{marginBottom:12}}>
               {photoPreviewSource(photo)?(
                <Image source={photoPreviewSource(photo)} resizeMode="cover"
                 accessibilityLabel={String(photo.alt||"Approved photograph "+(i+1)).slice(0,120)}
                 style={{width:92,height:74,borderRadius:9,backgroundColor:"#202D40"}}/>
               ):null}
               <Button label={"Use photo "+(i+1)+(photo.alt?" • "+String(photo.alt).slice(0,35):"")}
                onPress={()=>apply({action:section?.type==="hero"?"choose-hero-photo":"choose-feature-photo",
                 sectionId:section?.id,storagePath:photo.storagePath})}/>
              </View>
             )):<Text style={styles.cardBody}>Add an approved photograph to your business photo library before replacing this one.</Text>}
            </View>
           ):null}
           {section?.type==="hero"?(
            <>
             <Text style={styles.sectionLabel}>Show the best part of your main image</Text>
             <Button label="Show the top of the photo" onPress={()=>apply({action:"style",field:"photoFocus",value:"top"})}/>
             <Button label="Centre the photo" onPress={()=>apply({action:"style",field:"photoFocus",value:"center"})}/>
             <Button label="Show the bottom of the photo" onPress={()=>apply({action:"style",field:"photoFocus",value:"bottom"})}/>
             <Button label="Make the photo larger" onPress={()=>apply({action:"style",field:"heroSize",value:"extra-large"})}/>
            </>
           ):null}
          </>
         )}
        </>
       ):null}
       {selection&&section?(
        <>
         {field==='cta'&&section.type==='hero'?<View>
          <Text style={styles.sectionLabel}>Responsive button size</Text>
          <Text style={styles.cardBody}>These presets preserve the existing action and wrap on small screens.</Text>
          {['normal','roomier','wider'].map(size=><Button key={size} label={'Choose '+size+' button'} onPress={()=>{
            setContextDraft('make this button '+size);setShowContextHelp(true);setSelectedInstructionPreview(null);
            setContextNote('Preview the responsive button before applying. Its destination stays unchanged.');
          }}/>)}</View>:null}

         {initialMode==="voice"?(
          <Text style={styles.cardBody}>You selected the exact {names[field]?.toLowerCase()||"website part"}. BUSY is ready to listen. Press the red Stop control when you're finished — pauses are fine.</Text>
         ):null}
         {onPreviewInstruction?selectedWebsiteComparisons(draft,selection).map(choice=>(
          <View key={choice.id}>
           <Text style={styles.cardBody}>{choice.explanation}</Text>
           <Button label={'Compare: '+choice.label} onPress={()=>{
            if(!current()||editorLive.current.contextRequest!==contextRequest)return;
            const outcome=onPreviewInstruction({selection,instruction:choice.instruction});
            if(!outcome?.ok){setContextNote(outcome?.reason||'Select the current section again.');return;}
            setContextDraft(choice.instruction);setShowContextHelp(true);
            setSelectedInstructionPreview(outcome);setShowPreviewOriginal(false);
            setContextNote('Private comparison for this section only. Nothing has been saved.');
           }}/>
          </View>
         )):null}
         <Button label={showContextHelp?"Hide instructions for this part":"Tell BUSY what to do with this part"}
          onPress={()=>{setContextNote("");setShowContextHelp(x=>!x);}}/>
         {showContextHelp?(
          <View>
           <Text style={styles.cardBody}>BUSY knows exactly what you tapped. Try a suggested change, type an instruction or record your voice. Typed edits are local and use no AI credits; voice transcription uses a cloud service.</Text>
           {contextExamples.map(example=>(
            <Button key={example} label={'Prepare: '+example} onPress={()=>prepareContextChoice(example)}/>
           ))}
           <WebsiteSelectedVoice key={key} selection={selection} startImmediately={initialMode==="voice"} onTranscribe={onTranscribe}
            onTranscript={words=>{
              if(!current())return;
              setContextDraft(words);
              setSelectedInstructionPreview(null);
              setContextNote("Please check these words carefully. Nothing has changed yet.");
            }}/>
           <Field label="What would you like to change?" value={contextRequest}
            onChangeText={words=>{
             if(!current())return;
             setContextDraft(words);
             setSelectedInstructionPreview(null);
             setContextNote("");
            }}
            placeholder={field==="title"?"Make this heading bigger":"Make this section more premium; move this section above contact"}
            autoCapitalize="sentences"/>
           {preparedInstruction?.ok&&preparedInstruction.steps.length>1?(
            <View style={{marginTop:8,marginBottom:8}}>
             <Text style={styles.sectionLabel}>These changes will be saved together</Text>
             {preparedInstruction.steps.map((step,i)=>(
              <Text key={String(i)} style={styles.cardBody}>
               {(i+1)+". "+step.spoken}
              </Text>
             ))}
             <Text style={styles.cardBody}>If any step cannot be completed, nothing changes. One Undo restores the original.</Text>
            </View>
           ):null}
           {contextRequest||selectedInstructionPreview?<Button label="Cancel proposed changes" onPress={()=>{
            if(!current()||editorLive.current.contextRequest!==contextRequest)return;
            setContextDraft('');setSelectedInstructionPreview(null);setContextNote('Comparison cancelled. Your unsaved wording is kept.');
           }}/>:null}
           {preparedInstruction?.ok&&onPreviewInstruction?(
            <Button label="See these changes before saving" onPress={previewContext}/>
           ):null}
           {selectedInstructionPreview?.ok&&
            selectedInstructionPreview.generation===draft?.generation&&
            selectedInstructionPreview.draftId===draft?.id&&
            selectedInstructionPreview.pageId===selection?.pageId?(
            <View style={{marginVertical:10}}>
             <Text style={styles.sectionLabel}>Private before-and-after preview</Text>
             <Text style={styles.cardBody}>{selectedInstructionPreview.summary}</Text>
             <BuilderQualityNotice quality={{...selectedInstructionPreview.quality,findings:(selectedInstructionPreview.quality?.findings||[]).map(f=>({...f,repair:amendSelectedWebsiteQualityInstruction(draft,{selection,instruction:contextRequest,repair:f.repair}).ok?f.repair:null}))}} onRepair={previewQualityAdjustment}/>
             <Text style={styles.cardBody}>Compare phone, tablet or desktop layouts before applying. Wider views are scaled down on your phone.</Text>
             {["phone","tablet","desktop"].map(mode=>(
              <Button key={mode} label={(comparisonSize===mode?"✓ ":"")+"Compare "+mode+" layout"}
               onPress={()=>setComparisonSize(mode)}/>
             ))}
             <Button label={showPreviewOriginal?"Show proposed changes":"Show original website"}
              onPress={()=>setShowPreviewOriginal(x=>!x)}/>
             <View style={{height:300,borderRadius:12,overflow:"hidden",borderWidth:1,borderColor:"#50617A"}}>
              <WebView
               key={selectedInstructionPreview.generation+":"+
                (showPreviewOriginal?"original":"proposed")+":"+comparisonSize}
               source={{html:withWebsitePreviewViewport(showPreviewOriginal
                ?selectedInstructionPreview.originalHtml
                :selectedInstructionPreview.candidateHtml,comparisonSize),baseUrl:"about:blank"}}
               javaScriptEnabled={false} domStorageEnabled={false} incognito
               javaScriptCanOpenWindowsAutomatically={false}
               allowFileAccess={false} mixedContentMode="never"
               originWhitelist={["about:blank"]}
               onShouldStartLoadWithRequest={req=>
                req?.url==="about:blank"||String(req?.url||"").startsWith("about:blank#")}
               style={{backgroundColor:"#fff",flex:1}}
              />
             </View>
             <Text style={styles.cardBody}>This is a scaled visual preview of the {comparisonSize} layout, not real-device testing. Use the page checker and hosted preview before publishing.</Text>
            </View>
           ):null}
           <Button label={preparedInstruction?.ok&&preparedInstruction.steps.length>1
             ?"Apply "+preparedInstruction.steps.length+" changes together":
             "Apply reviewed instruction to this part"} primary
            onPress={()=>applyContext(contextRequest)}/>
           {contextNote?<Text style={styles.cardBody} accessibilityRole="alert">{contextNote}</Text>:null}
           <Text style={styles.cardBody}>Unrecognised requests are never guessed or published. More advanced editing still uses the controls below.</Text>
          </View>
         ):null}
         <Button label={showSectionDesign?"Hide design controls":field==="photo"?"Adjust this picture and section":"Change how this section looks"}
          onPress={()=>setShowSectionDesign(x=>!x)}/>
         {showSectionDesign?(
          <View>
           <Text style={styles.cardBody}>Change just this section. Other parts of your website keep their own design. Everything can be undone.</Text>
           <Text style={styles.sectionLabel}>Heading size</Text>
           {appearanceChoice("headingScale","compact","Smaller heading")}
           {appearanceChoice("headingScale","normal","Normal heading")}
           {appearanceChoice("headingScale","large","Larger heading")}
           <Text style={styles.sectionLabel}>Heading size only on phones</Text>
           {appearanceChoice("mobileHeadingScale","compact","Smaller on phones")}
           {appearanceChoice("mobileHeadingScale","normal","Default on phones")}
           {appearanceChoice("mobileHeadingScale","large","Larger on phones")}
           <Text style={styles.sectionLabel}>Heading size only on desktop</Text>
           {appearanceChoice("desktopHeadingScale","compact","Smaller on desktop")}
           {appearanceChoice("desktopHeadingScale","normal","Default on desktop")}
           {appearanceChoice("desktopHeadingScale","large","Larger on desktop")}
           <Text style={styles.sectionLabel}>Text alignment</Text>
           {appearanceChoice("textAlign","left","Align words left")}
           {appearanceChoice("textAlign","center","Centre this section")}
           <Text style={styles.sectionLabel}>Space around the section</Text>
           {appearanceChoice("sectionSpacing","compact","Less space")}
           {appearanceChoice("sectionSpacing","normal","Normal space")}
           {appearanceChoice("sectionSpacing","generous","More breathing room")}
           {(["hero","photo-feature"].includes(section.type)||section.type==="gallery"&&field==="photo")?(
            <>
             <Text style={styles.sectionLabel}>{section.type==="gallery"?"Crop this photograph only":"Picture crop"}</Text>
             {appearanceChoice("photoCrop","top","Focus on the top")}
             {appearanceChoice("photoCrop","center","Focus on the middle")}
             {appearanceChoice("photoCrop","bottom","Focus on the bottom")}
             {section.type==="gallery"?(
              <>
               <Text style={styles.sectionLabel}>How to fit this picture</Text>
               {appearanceChoice("photoFit","contain","Show the entire photograph")}
               {appearanceChoice("photoFit","cover","Fill the picture tile (crop edges)")}
              </>
             ):null}
            </>
           ):null}
           {section.type==="photo-feature"?(
            <>
             <Text style={styles.sectionLabel}>Photo and text arrangement</Text>
             {appearanceChoice("photoSide","left","Picture on left")}
             {appearanceChoice("photoSide","right","Picture on right")}
            </>
           ):null}
           {section.type==="gallery"?(
            <>
             <Text style={styles.sectionLabel}>Gallery photograph size</Text>
             {appearanceChoice("gallerySize","compact","Smaller photo tiles")}
             {appearanceChoice("gallerySize","comfortable","Normal photo tiles")}
             {appearanceChoice("gallerySize","large","Larger photo tiles")}
             <Text style={styles.sectionLabel}>Gallery size on phones only</Text>
             {appearanceChoice("mobileGallerySize","compact","Smaller on phones")}
             {appearanceChoice("mobileGallerySize","comfortable","Default on phones")}
             {appearanceChoice("mobileGallerySize","large","Larger on phones")}
             <Text style={styles.sectionLabel}>Gallery size on desktop only</Text>
             {appearanceChoice("desktopGallerySize","compact","Smaller on desktop")}
             {appearanceChoice("desktopGallerySize","comfortable","Default on desktop")}
             {appearanceChoice("desktopGallerySize","large","Larger on desktop")}
            </>
           ):null}
           <Button label="Restore original section style"
             onPress={()=>apply({action:"reset-section-style",sectionId:section?.id})}/>
          </View>
         ):null}
        </>
       ):null}
       <Button label="Cancel — leave website unchanged" onPress={onClose}/>
      </Card>
     </ScrollView>
    </KeyboardAvoidingView>
   </SafeAreaView>
  </Modal>
 );
}
export {WebsiteTapEditor};
