import {appColors as C} from "../theme/appearance.mjs";
import React from "react";
import {Text,TextInput,View} from "react-native";
import {Button,Card,Field} from "../components/ui";
import {styles} from "../theme/styles";

const STYLE_GROUPS = [
 {title:"Fonts and presentation", choices:[
  ["Elegant headings", "typography", "refined"],
  ["Bold clear headings", "typography", "confident"],
  ["Compact headings", "typography", "compact"],
  ["Editorial serif headings", "typography", "editorial"],
  ["Friendly rounded headings", "typography", "friendly"]
 ]},
 {title:"Spacing", choices:[
  ["More breathing space", "spacing", "generous"],
  ["Comfortable spacing", "spacing", "comfortable"],
  ["Compact spacing", "spacing", "compact"]
 ]},
 {title:"Services and navigation", choices:[
  ["Service cards", "cardLayout", "cards"],
  ["Service outlines", "cardLayout", "outlines"],
  ["Service rows", "cardLayout", "rows"],
  ["Rounded navigation", "navStyle", "pill"],
  ["Underlined navigation", "navStyle", "underline"]
 ]},
 {title:"Main picture and button", choices:[
  ["Make the contact button stand out", "ctaEmphasis", "strong"],
  ["Normal button emphasis", "ctaEmphasis", "normal"],
  ["Large main photo", "heroSize", "extra-large"],
  ["Standard main photo", "heroSize", "large"],
  ["Show top of main photo", "photoFocus", "top"],
  ["Centre main photo", "photoFocus", "center"],
  ["Show bottom of main photo", "photoFocus", "bottom"]
 ]}
];

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
 // Display the actual private order; keep hidden sections available to restore.
 const ranks=new Map(visible.map((id,index)=>[id,index]));
 const orderedSections=[...sections].sort((a,b)=>(ranks.get(a.id)??visible.length)-(ranks.get(b.id)??visible.length));
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
       {STYLE_GROUPS.map(group=><View key={group.title} style={styles.workspacePanel}>
        <Text accessibilityRole="header" style={styles.workspacePanelTitle}>{group.title}</Text>
        <View style={styles.choiceGrid}>{group.choices.map(([label,field,value])=><View key={label} style={styles.choiceCell}>
         <Button compact label={label} onPress={()=>apply({action:"style",field,value})}/>
        </View>)}</View>
       </View>)}
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
       {orderedSections.map(section=>(
        <View key={section.id} style={styles.recordRow}>
         <Text style={styles.sectionLabel}>{section.title||section.id}{section.enabled===false?" (hidden)":""}</Text>
         {section.enabled!==false&&section.id!=="hero"?(
          <View style={styles.choiceGrid}>
           <View style={styles.choiceCell}><Button compact label="Move up" onPress={()=>apply({action:"move",sectionId:section.id,direction:"up"})}/></View>
           <View style={styles.choiceCell}><Button compact label="Move down" onPress={()=>apply({action:"move",sectionId:section.id,direction:"down"})}/></View>
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
          <Button danger={confirmDelete===section.id} label={confirmDelete===section.id?"Confirm delete this extra section":"Delete extra section"}
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
          placeholderTextColor={C.muted}
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
