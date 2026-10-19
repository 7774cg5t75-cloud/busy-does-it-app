import React from "react";
import {useOwnerEditNavigation} from "./useOwnerEditNavigation";
import {Text, TextInput, View} from "react-native";
import {Card, Button, Field} from "../components/ui";
import {styles} from "../theme/styles";
import {fieldChoices} from "../core/websiteStructuredEditing.mjs";

const labelFor={
 title:"Heading or name",body:"Wording",cta:"Button label",
 ctaHref:"Button destination",phone:"Public phone number",
 email:"Public email address",openingHours:"Opening hours",
};
const display=v=>String(v||"");
const selectedItem=(section,id)=>
 (Array.isArray(section?.items)?section.items:[]).find(item=>item?.id===id)||null;

function WebsiteContentEditor({draft,onApply:commitChange,suggestions=[],ownerState={}}){
 const [open,setOpen]=React.useState(false);
 const [sectionId,setSectionId]=React.useState("");
 const [selection,setSelection]=React.useState(null);
 const [value,setValue]=React.useState("");
 const [newEntryTitle,setNewEntryTitle]=React.useState("");
 const [newEntryBody,setNewEntryBody]=React.useState("");
 const [confirmRemoval,setConfirmRemoval]=React.useState(null);
 const [createKind,setCreateKind]=React.useState("");
 const [testimonialPermission,setTestimonialPermission]=React.useState(false);
 const dirty=React.useRef({field:false,entry:false}),epoch=React.useRef(0);
 const [draftNotice,setDraftNotice]=React.useState(''),[pendingDraft,setPendingDraft]=React.useState(null);
 const clearWording=()=>{dirty.current={field:false,entry:false};epoch.current++;setValue('');setNewEntryTitle('');setNewEntryBody('');setSelection(null);setConfirmRemoval(null);setTestimonialPermission(false);setPendingDraft(null);};
 const reportOwnerDraft=useOwnerEditNavigation(ownerState,{source:draft,projectId:draft?.id,revision:draft?.generation},clearWording);
 const mark=(part,value)=>{dirty.current={...dirty.current,[part]:value};epoch.current++;reportOwnerDraft(Object.values(dirty.current).some(Boolean));};
 const liveDraft=React.useRef(draft);liveDraft.current=draft;
 const version=JSON.stringify([draft?.businessId,draft?.id,draft?.generation]);
 const [reviewedVersion,setReviewedVersion]=React.useState(version);
 const capturedEpoch=epoch.current;
 const transition=action=>{
  if(liveDraft.current!==draft||capturedEpoch!==epoch.current)return;
  const run=()=>{if(liveDraft.current!==draft)return false;action();return true;};
  if(!Object.values(dirty.current).some(Boolean))return run();
  if(ownerState.requestOwnerEditTransition)return ownerState.requestOwnerEditTransition(run);
  setPendingDraft({run,epoch:epoch.current,draft});
 };
 const onApply=change=>{
  if(reviewedVersion!==version||liveDraft.current!==draft||capturedEpoch!==epoch.current)return false;
  const fieldChange=selection&&change.sectionId===selection.sectionId&&change.field===selection.field&&change.itemId===selection.itemId;
  const entryChange=['add-item','create-collection'].includes(change.action);
  if(dirty.current.field&&!fieldChange||dirty.current.entry&&!entryChange){setDraftNotice('Finish or cancel your other unsaved wording before making this change. Nothing was saved.');return false;}
  const saved=commitChange?.(change);
  if(saved===true){if(fieldChange)mark('field',false);if(entryChange)mark('entry',false);setDraftNotice('');}
  return saved;
 };
 const section=(draft?.sections||[]).find(s=>s.id===sectionId)||null;
 const change=(field,itemId=null)=>transition(()=>{
  const target=itemId?selectedItem(section,itemId):section;
  if(!target)return;
  setConfirmRemoval(null);
  setSelection({sectionId,field,itemId});
  setValue(display(target[field]));
 });
 const save=()=>{
  if(!selection||!onApply)return;
  const ok=onApply({...selection,value});
  if(ok)setSelection(null);
 };
 return (
  <>
   {draftNotice?<Text accessibilityLiveRegion="polite" style={styles.cardBody}>{draftNotice}</Text>:null}
   {pendingDraft?<View><Text style={styles.cardBody}>Your website wording is not saved.</Text>
    <Button label="Keep editing website wording" onPress={()=>setPendingDraft(null)}/>
    <Button label="Discard website wording and continue" onPress={()=>{if(pendingDraft.draft!==liveDraft.current||pendingDraft.epoch!==epoch.current)return;const run=pendingDraft.run;clearWording();reportOwnerDraft(false);run();}}/>
   </View>:null}
   <Button label={open?"Hide direct content editor":"Edit website content directly"}
     onPress={()=>setOpen(x=>!x)}/>
   {reviewedVersion!==version?<View>
    <Text accessibilityLiveRegion="polite" style={styles.cardBody}>The website draft changed. Your typed text is kept, but no edit can be applied until you review the current version.</Text>
    <Button label="I reviewed the current version — keep my text" onPress={()=>setReviewedVersion(version)}/>
   </View>:null}
   {suggestions.slice(0,3).map(suggestion=><View key={suggestion.id}>
    <Text style={styles.cardBody}>{suggestion.reason}</Text>
    <Button label={'Prepare a website answer: '+suggestion.question} onPress={()=>transition(()=>{
     if(liveDraft.current!==draft)return;
     const faq=(draft.sections||[]).find(section=>section.type==='faq'&&section.enabled!==false);
     setOpen(true);setSectionId(faq?.id||'');setCreateKind(faq?'':'faq');setSelection(null);setNewEntryTitle(suggestion.question);setNewEntryBody('');setConfirmRemoval(null);
    })}/>
   </View>)}
   {open ? (
    <Card eyebrow="Direct website editor"
      title="Change the exact words you want"
      body="Select a section and a field. BUSY saves only that field in your private draft. No AI credits, no outside developer, and nothing goes public until you approve a version."
      footer="Images still use your approved photo library. Website design and page order can be changed with BUSY's design controls."
      tone="blue">
     {(draft?.sections||[]).map(s=>(
      <Button key={s.id} label={(sectionId===s.id?"✓ ":"")+"Edit "+(s.title||s.id)}
        onPress={()=>transition(()=>{
         setSectionId(s.id);
         setCreateKind("");
         setSelection(null);
         setValue("");
         setConfirmRemoval(null);
         setNewEntryTitle("");
         setNewEntryBody("");
        })}/>
     ))}
     {["services","faq","testimonials"].filter(kind=>!(draft?.sections||[])
       .some(item=>item.id===kind)).map(kind=>(
       <Button key={"new-section-"+kind} label={
        "Create "+(kind==="faq"?"FAQs":kind==="testimonials"?"Testimonials":"Services")+" section"}
        onPress={()=>transition(()=>{
         setCreateKind(kind);setSectionId("");setSelection(null);
         setNewEntryTitle("");setNewEntryBody("");setTestimonialPermission(false);
        })}/>
     ))}
     {createKind?(
      <View>
       <Text style={styles.sectionLabel}>
        {"First "+(createKind==="faq"?"FAQ":createKind==="testimonials"?"testimonial":"service")+" for your new section"}
       </Text>
       <Field label={createKind==="faq"?"Question":createKind==="testimonials"?"Attribution":"Service name"}
        value={newEntryTitle} onChangeText={v=>{if(liveDraft.current!==draft)return;mark("entry",true);setNewEntryTitle(v);setTestimonialPermission(false);}}
        placeholder="Use your exact wording"/>
       <View style={styles.fieldWrap}>
        <Text style={styles.fieldLabel}>
         {createKind==="faq"?"Answer":createKind==="testimonials"?"Genuine testimonial wording":"Service description"}
        </Text>
        <View style={styles.fieldBox}>
         <TextInput value={newEntryBody} onChangeText={v=>{if(liveDraft.current!==draft)return;mark("entry",true);setNewEntryBody(v);setTestimonialPermission(false);}}
          multiline numberOfLines={3} textAlignVertical="top"
          placeholder="What should visitors know?"
          placeholderTextColor="#9AA3B2"
          style={[styles.fieldInput,{minHeight:95,textAlignVertical:"top"}]}/>
        </View>
       </View>
       {createKind==='testimonials'?<Button label={(testimonialPermission?'✓ ':'')+'I have permission to display this genuine testimonial'} onPress={()=>setTestimonialPermission(x=>!x)}/>:null}
       <Button label="Create section in private draft" disabled={createKind==='testimonials'&&!testimonialPermission} onPress={()=>{
        const kind=createKind;
        if(onApply?.({action:"create-collection",sectionId:kind,
         title:newEntryTitle,body:newEntryBody})===true){
         setSectionId(kind);setCreateKind("");
         setNewEntryTitle("");setNewEntryBody("");setTestimonialPermission(false);
        }
       }}/>
       <Button label="Cancel new section" onPress={()=>{if(capturedEpoch!==epoch.current||liveDraft.current!==draft)return;setCreateKind("");setNewEntryTitle("");setNewEntryBody("");mark("entry",false);}}/>
      </View>
     ):null}
     {section ? (
      <View>
       <Text style={styles.sectionLabel}>Editing: {section.title||section.id}</Text>
       {(fieldChoices[section.type]||[]).map(field=>(
        <Button key={field} label={"Change "+labelFor[field]}
          onPress={()=>change(field)}/>
       ))}
       {["services","faq","testimonials"].includes(section.type) ?
        (section.items||[]).map((item,index)=>(
         <View key={item.id||index}>
          <Text style={styles.cardBody}>{"Item "+(index+1)+": "+(item.title||"Customer wording")}</Text>
          <Button label="Edit name / question / attribution"
            onPress={()=>change("title",item.id)}/>
          <Button label="Edit description / answer / testimonial"
            onPress={()=>change("body",item.id)}/>
          {["services","faq","testimonials"].includes(section.type)?(
           <View>
            {index>0?<Button label={"Move "+item.title+" up"}
             onPress={()=>{
              setConfirmRemoval(null);
              onApply?.({action:"move-item",sectionId:section.id,
               itemId:item.id,expectedTitle:item.title,direction:"up"});
             }}/>:null}
            {index<(section.items||[]).length-1?
             <Button label={"Move "+item.title+" down"}
              onPress={()=>{
               setConfirmRemoval(null);
               onApply?.({action:"move-item",sectionId:section.id,
                itemId:item.id,expectedTitle:item.title,direction:"down"});
              }}/>:null}
           </View>
          ):null}
         </View>
        )):null}
      </View>
     ):null}
     {section&&["services","faq","testimonials"].includes(section.type)?(
      <View>
       <Text style={styles.sectionLabel}>
         {section.type==="services"?"Add a service":section.type==="testimonials"?"Add a genuine testimonial":"Add a FAQ"}
       </Text>
       <Field label={section.type==="services"?"Service name":section.type==="testimonials"?"Attribution":"Question"}
         value={newEntryTitle} onChangeText={v=>{if(liveDraft.current!==draft)return;mark("entry",true);setNewEntryTitle(v);setTestimonialPermission(false);}}
         placeholder={section.type==="services"?"Name your service":"Enter your question"}/>
       <View style={styles.fieldWrap}>
        <Text style={styles.fieldLabel}>
         {section.type==="services"?"Service description":section.type==="testimonials"?"Genuine testimonial wording":"Answer"}
        </Text>
        <View style={styles.fieldBox}>
         <TextInput value={newEntryBody} onChangeText={v=>{if(liveDraft.current!==draft)return;mark("entry",true);setNewEntryBody(v);setTestimonialPermission(false);}}
          multiline numberOfLines={3} textAlignVertical="top"
          placeholder="Your exact wording"
          placeholderTextColor="#9AA3B2"
          style={[styles.fieldInput,{minHeight:95,textAlignVertical:"top"}]}/>
        </View>
       </View>
       {section.type==='testimonials'?<Button label={(testimonialPermission?'✓ ':'')+'I have permission to display this genuine testimonial'} onPress={()=>setTestimonialPermission(x=>!x)}/>:null}
       <Button disabled={section.type==='testimonials'&&!testimonialPermission} label={section.type==="services"?"Add service to private draft":section.type==='testimonials'?'Add testimonial to private draft':"Add FAQ to private draft"}
        onPress={()=>{
         if(onApply?.({action:"add-item",sectionId:section.id,
          title:newEntryTitle,body:newEntryBody})===true){
          setNewEntryTitle("");setNewEntryBody("");setTestimonialPermission(false);setConfirmRemoval(null);
         }
        }}/>
       {(section.items||[]).map((item,i)=>(
        <View key={"remove-"+(item.id||i)}>
         <Button label={confirmRemoval?.id===item.id?
            "Confirm removing "+item.title:"Remove "+item.title}
          onPress={()=>{
           if(confirmRemoval?.id!==item.id){
            setConfirmRemoval({id:item.id,title:item.title});return;
           }
           if(onApply?.({action:"remove-item",sectionId:section.id,
            itemId:item.id,expectedTitle:item.title})===true)
            setConfirmRemoval(null);
          }}/>
        </View>
       ))}
       {confirmRemoval?<Button label="Keep this entry"
        onPress={()=>setConfirmRemoval(null)}/>:null}
       <Text style={styles.cardBody}>
        Your changes stay private until you publish and can be reversed with website Undo.
       </Text>
      </View>
     ):null}
     {selection&&selection.sectionId===sectionId ? (
      <View>
       <Text style={styles.sectionLabel}>{"Edit "+labelFor[selection.field]}</Text>
       {selection.field==="body"?(
        <View style={styles.fieldWrap}>
         <Text style={styles.fieldLabel}>Your exact wording</Text>
         <View style={styles.fieldBox}>
          <TextInput value={value} onChangeText={next=>{if(liveDraft.current!==draft)return;mark("field",true);setValue(next);}}
           multiline numberOfLines={4} textAlignVertical="top"
           placeholder="Type what you want visitors to see"
           placeholderTextColor="#9AA3B2"
           style={[styles.fieldInput,{minHeight:112,textAlignVertical:"top"}]}/>
         </View>
        </View>
       ):(
        <Field label={labelFor[selection.field]} value={value}
         onChangeText={next=>{if(liveDraft.current!==draft)return;mark("field",true);setValue(next);}} placeholder="Type your replacement text"
         autoCapitalize={selection.field==="email"?"none":"sentences"}
         keyboardType={selection.field==="email"?"email-address":selection.field==="phone"?"phone-pad":"default"}/>
       )}
       <Button primary label="Save to private draft" onPress={save}/>
       <Button label="Cancel this edit" onPress={()=>{if(capturedEpoch!==epoch.current||liveDraft.current!==draft)return;setSelection(null);mark("field",false);}}/>
      </View>
     ):null}
    </Card>
   ):null}
  </>
 );
}
export {WebsiteContentEditor};
