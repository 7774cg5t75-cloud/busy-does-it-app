import React from "react";
import {Text,TextInput,View} from "react-native";
import {Button,Card,Field} from "../components/ui";
import {styles} from "../theme/styles";

/**
 * Optional no-code controls: every action uses the same private undo stack.
 * No CSS editor, unverified image URL, API call, or publish button.
 */
function WebsiteLayoutControls({draft,onApply}){
 const [open,setOpen]=React.useState(false);
 const [styling,setStyling]=React.useState(false);
 const [sectionTools,setSectionTools]=React.useState(false);
 const [newTitle,setNewTitle]=React.useState("");
 const [newBody,setNewBody]=React.useState("");
 const [confirmDelete,setConfirmDelete]=React.useState("");
 const sections=Array.isArray(draft?.sections)?draft.sections:[];
 const sectionOrder=Array.isArray(draft?.designPlan?.sectionOrder)?draft.designPlan.sectionOrder:[];
 const visible=[...new Set([...sectionOrder,...sections.filter(s=>s.enabled!==false).map(s=>s.id)])]
   .filter(id=>sections.some(s=>s.id===id&&s.enabled!==false));
 const apply=(change)=>onApply?.(change)===true;
 const add=()=>{
  if(apply({action:"add-text",title:newTitle,body:newBody})){
   setNewTitle("");setNewBody("");
  }
 };
 const askDelete=(id)=>{
  if(confirmDelete!==id){setConfirmDelete(id);return;}
  if(apply({action:"delete",sectionId:id}))setConfirmDelete("");
 };
 return (
  <>
   <Button label={open?"Hide layout and appearance":"Change layout and appearance"}
     onPress={()=>setOpen(x=>!x)}/>
   {open?(
    <Card eyebrow="Website layout"
     title="Make this website your own"
     body="Change layout, spacing, fonts and your approved pictures. Everything stays in the private draft until you explicitly publish."
     tone="blue">
     <Button label={styling?"Hide style choices":"Colours, fonts and overall look"}
      onPress={()=>setStyling(x=>!x)}/>
     {styling?(
      <View>
       <Text style={styles.sectionLabel}>Fonts and presentation</Text>
       <Button label="Elegant headings" onPress={()=>apply({action:"style",field:"typography",value:"refined"})}/>
       <Button label="Bold clear headings" onPress={()=>apply({action:"style",field:"typography",value:"confident"})}/>
       <Button label="Compact headings" onPress={()=>apply({action:"style",field:"typography",value:"compact"})}/>
       <Text style={styles.sectionLabel}>Spacing</Text>
       <Button label="More breathing space" onPress={()=>apply({action:"style",field:"spacing",value:"generous"})}/>
       <Button label="Comfortable spacing" onPress={()=>apply({action:"style",field:"spacing",value:"comfortable"})}/>
       <Button label="Compact spacing" onPress={()=>apply({action:"style",field:"spacing",value:"compact"})}/>
       <Text style={styles.sectionLabel}>Services and navigation</Text>
       <Button label="Service cards" onPress={()=>apply({action:"style",field:"cardLayout",value:"cards"})}/>
       <Button label="Service outlines" onPress={()=>apply({action:"style",field:"cardLayout",value:"outlines"})}/>
       <Button label="Service rows" onPress={()=>apply({action:"style",field:"cardLayout",value:"rows"})}/>
       <Button label="Rounded navigation" onPress={()=>apply({action:"style",field:"navStyle",value:"pill"})}/>
       <Button label="Underlined navigation" onPress={()=>apply({action:"style",field:"navStyle",value:"underline"})}/>
       <Text style={styles.sectionLabel}>Main picture and button</Text>
       <Button label="Make the contact button stand out" onPress={()=>apply({action:"style",field:"ctaEmphasis",value:"strong"})}/>
       <Button label="Normal button emphasis" onPress={()=>apply({action:"style",field:"ctaEmphasis",value:"normal"})}/>
       <Button label="Large main photo" onPress={()=>apply({action:"style",field:"heroSize",value:"extra-large"})}/>
       <Button label="Standard main photo" onPress={()=>apply({action:"style",field:"heroSize",value:"large"})}/>
       <Button label="Show top of main photo" onPress={()=>apply({action:"style",field:"photoFocus",value:"top"})}/>
       <Button label="Centre main photo" onPress={()=>apply({action:"style",field:"photoFocus",value:"center"})}/>
       <Button label="Show bottom of main photo" onPress={()=>apply({action:"style",field:"photoFocus",value:"bottom"})}/>
       {(sections.find(s=>s.id==="gallery")?.items||[])
        .filter(x=>x?.approved!==false&&x?.storagePath)
        .slice(0,12).map((item,i)=>(
         <Button key={item.storagePath} label={"Use approved gallery image "+(i+1)+" as main photo"}
          onPress={()=>apply({action:"choose-hero-photo",storagePath:item.storagePath})}/>
        ))}
      </View>
     ):null}
     <Button label={sectionTools?"Hide section arrangement":"Arrange and add sections"}
      onPress={()=>setSectionTools(x=>!x)}/>
     {sectionTools?(
      <View>
       <Text style={styles.cardBody}>Move sections in the order visitors should see them. Hidden sections can be restored.</Text>
       {sections.map(section=>(
        <View key={section.id} style={{marginTop:8}}>
         <Text style={styles.sectionLabel}>{section.title||section.id}{section.enabled===false?" (hidden)":""}</Text>
         {section.enabled!==false&&section.id!=="hero"?(
          <View>
           <Button label="Move up" onPress={()=>apply({action:"move",sectionId:section.id,direction:"up"})}/>
           <Button label="Move down" onPress={()=>apply({action:"move",sectionId:section.id,direction:"down"})}/>
          </View>
         ):null}
         {!["hero","contact"].includes(section.id)?(
          <Button label={section.enabled===false?"Show section":"Hide section"}
           onPress={()=>apply({action:section.enabled===false?"show":"hide",sectionId:section.id})}/>
         ):null}
         {section.type==="text"&&section.enabled!==false&&String(section.body||"").trim()?(
          <Button label="Duplicate this text section" onPress={()=>apply({action:"duplicate",sectionId:section.id})}/>
         ):null}
         {section.id.startsWith("custom-")&&section.type==="text"?(
          <Button label={confirmDelete===section.id?"Confirm delete this extra section":"Delete extra section"}
           onPress={()=>askDelete(section.id)}/>
         ):null}
        </View>
       ))}
       <Text style={styles.sectionLabel}>Add your own text section</Text>
       <Field label="Section heading" value={newTitle} onChangeText={setNewTitle}
        placeholder="e.g. Our story"/>
       <View style={styles.fieldWrap}>
        <Text style={styles.fieldLabel}>Your wording</Text>
        <View style={styles.fieldBox}>
         <TextInput value={newBody} onChangeText={setNewBody} multiline numberOfLines={4}
          textAlignVertical="top" placeholder="Write what you want visitors to know"
          placeholderTextColor="#9AA3B2"
          style={[styles.fieldInput,{minHeight:112,textAlignVertical:"top"}]}/>
        </View>
       </View>
       <Button label="Add section to private draft" onPress={add}/>
      </View>
     ):null}
    </Card>
   ):null}
  </>
 );
}
export {WebsiteLayoutControls};
