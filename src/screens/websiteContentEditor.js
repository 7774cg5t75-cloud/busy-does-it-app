import React from "react";
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

function WebsiteContentEditor({draft,onApply}){
 const [open,setOpen]=React.useState(false);
 const [sectionId,setSectionId]=React.useState("");
 const [selection,setSelection]=React.useState(null);
 const [value,setValue]=React.useState("");
 const section=(draft?.sections||[]).find(s=>s.id===sectionId)||null;
 const change=(field,itemId=null)=>{
  const target=itemId?selectedItem(section,itemId):section;
  if(!target)return;
  setSelection({sectionId,field,itemId});
  setValue(display(target[field]));
 };
 const save=()=>{
  if(!selection||!onApply)return;
  const ok=onApply({...selection,value});
  if(ok)setSelection(null);
 };
 return (
  <>
   <Button label={open?"Hide direct content editor":"Edit website content directly"}
     onPress={()=>setOpen(x=>!x)}/>
   {open ? (
    <Card eyebrow="Direct website editor"
      title="Change the exact words you want"
      body="Select a section and a field. BUSY saves only that field in your private draft. No AI credits, no outside developer, and nothing goes public until you approve a version."
      footer="Images still use your approved photo library. Website design and page order can be changed with BUSY's design controls."
      tone="blue">
     {(draft?.sections||[]).map(s=>(
      <Button key={s.id} label={(sectionId===s.id?"✓ ":"")+"Edit "+(s.title||s.id)}
        onPress={()=>{
         setSectionId(s.id);
         setSelection(null);
         setValue("");
        }}/>
     ))}
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
         </View>
        )):null}
      </View>
     ):null}
     {selection&&selection.sectionId===sectionId ? (
      <View>
       <Text style={styles.sectionLabel}>{"Edit "+labelFor[selection.field]}</Text>
       {selection.field==="body"?(
        <View style={styles.fieldWrap}>
         <Text style={styles.fieldLabel}>Your exact wording</Text>
         <View style={styles.fieldBox}>
          <TextInput value={value} onChangeText={setValue}
           multiline numberOfLines={4} textAlignVertical="top"
           placeholder="Type what you want visitors to see"
           placeholderTextColor="#9AA3B2"
           style={[styles.fieldInput,{minHeight:112,textAlignVertical:"top"}]}/>
         </View>
        </View>
       ):(
        <Field label={labelFor[selection.field]} value={value}
         onChangeText={setValue} placeholder="Type your replacement text"
         autoCapitalize={selection.field==="email"?"none":"sentences"}
         keyboardType={selection.field==="email"?"email-address":selection.field==="phone"?"phone-pad":"default"}/>
       )}
       <Button primary label="Save to private draft" onPress={save}/>
       <Button label="Cancel this edit" onPress={()=>setSelection(null)}/>
      </View>
     ):null}
    </Card>
   ):null}
  </>
 );
}
export {WebsiteContentEditor};
