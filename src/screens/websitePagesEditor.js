import React from "react";
import {Text,TextInput,View} from "react-native";
import {Button,Card,Field} from "../components/ui";
import {styles} from "../theme/styles";

/** Private owner-managed pages. Built-in pages remain generated and protected. */
function WebsitePagesEditor({draft,onApply,onShare,onShareZip}){
 const [open,setOpen]=React.useState(false);
 const [selected,setSelected]=React.useState("");
 const [newTitle,setNewTitle]=React.useState("");
 const [newBody,setNewBody]=React.useState("");
 const [pageTitle,setPageTitle]=React.useState("");
 const [sectionTitle,setSectionTitle]=React.useState("");
 const [sectionBody,setSectionBody]=React.useState("");
 const [deleteConfirm,setDeleteConfirm]=React.useState(false);
 const [showExport,setShowExport]=React.useState(false);
 const page=(draft?.customPages||[]).find(x=>x.id===selected);
 const sections=Array.isArray(draft?.sections)?draft.sections:[];
 const apply=patch=>onApply?.(patch)===true;
 const create=()=>{
  if(apply({action:"create-page",title:newTitle,body:newBody})){
   setNewTitle("");setNewBody("");
  }
 };
 const addSection=()=>{
  if(apply({action:"add-page-section",pageId:selected,
    title:sectionTitle,body:sectionBody})){
   setSectionTitle("");setSectionBody("");
  }
 };
 const selectPage=item=>{
  setSelected(item.id);setPageTitle(item.title);setDeleteConfirm(false);
 };
 return (
  <>
   <Button label={open?"Hide website page controls":"Manage website pages"}
     onPress={()=>setOpen(x=>!x)}/>
   {open?(
    <Card eyebrow="Your website pages"
      title="Add pages without starting again"
      body="BUSY builds standard pages automatically. You can create your own pages, give each a clear address, and control the wording. Existing public addresses stay stable when titles change."
      footer="New pages and edits stay in your private draft until you approve an exact hosted preview and publication."
      tone="blue">
     <Text style={styles.sectionLabel}>Your pages</Text>
     {(draft?.pages||[]).map(item=>(
      <Button key={item.id} label={(item.id===selected?"✓ ":"")+(item.title||item.id)+" • "+(item.path||"/")}
       onPress={()=>item.id.startsWith("page-")?selectPage(item):setSelected("")}/>
     ))}
     <Text style={styles.sectionLabel}>Create a new page</Text>
     <Field label="Page title" value={newTitle} onChangeText={setNewTitle}
       placeholder="e.g. Meet our team"/>
     <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>Introduction (your exact wording)</Text>
      <View style={styles.fieldBox}>
       <TextInput value={newBody} onChangeText={setNewBody}
        multiline numberOfLines={4} textAlignVertical="top"
        placeholder="Tell visitors about this page"
        placeholderTextColor="#9AA3B2"
        style={[styles.fieldInput,{minHeight:110,textAlignVertical:"top"}]}/>
      </View>
     </View>
     <Button label="Create private page" onPress={create}/>
     {page?(
      <View>
       <Text style={styles.sectionLabel}>Edit {page.title}</Text>
       <Text style={styles.cardBody}>{"Address: /pages/"+page.slug+" (stays the same when renamed)"}</Text>
       <Field label="Change page title" value={pageTitle} onChangeText={setPageTitle}/>
       <Button label="Save page title" onPress={()=>
        apply({action:"rename-page",pageId:page.id,title:pageTitle})}/>
       <Text style={styles.sectionLabel}>Page sections</Text>
       {page.sectionIds.map(id=>{
        const section=sections.find(s=>s.id===id);
        return section?(
         <View key={id}>
          <Text style={styles.cardBody}>{section.title||id}</Text>
          <Button label="Move section up" onPress={()=>apply({action:"move-page-section",pageId:page.id,sectionId:id,direction:"up"})}/>
          <Button label="Move section down" onPress={()=>apply({action:"move-page-section",pageId:page.id,sectionId:id,direction:"down"})}/>
          {page.sectionIds.length>1?(
           <Button label="Move section back to home page" onPress={()=>
            apply({action:"remove-page-section",pageId:page.id,sectionId:id})}/>
          ):null}
         </View>
        ):null;
       })}
       <Text style={styles.cardBody}>Edit the wording itself using “Edit website content directly”.</Text>
       <Text style={styles.sectionLabel}>Add a text section to this page</Text>
       <Field label="Section heading" value={sectionTitle} onChangeText={setSectionTitle}/>
       <View style={styles.fieldWrap}>
        <Text style={styles.fieldLabel}>Your wording</Text>
        <View style={styles.fieldBox}>
         <TextInput value={sectionBody} onChangeText={setSectionBody} multiline
          textAlignVertical="top" numberOfLines={4}
          placeholderTextColor="#9AA3B2" placeholder="What would you like this section to say?"
          style={[styles.fieldInput,{minHeight:100,textAlignVertical:"top"}]}/>
        </View>
       </View>
       <Button label="Add section to page" onPress={addSection}/>
       <Text style={styles.sectionLabel}>Move one of your existing text sections to this page</Text>
       {sections.filter(s=>s.id.startsWith("custom-")&&s.type==="text"&&s.enabled!==false&&!page.sectionIds.includes(s.id))
        .slice(0,30).map(s=>(
         <Button key={s.id} label={"Move "+(s.title||s.id)+" to this page"} onPress={()=>
          apply({action:"assign-section",pageId:page.id,sectionId:s.id})}/>
        ))}
       <Button label={deleteConfirm?"Confirm remove this page (keep the content)":"Remove this page"}
        onPress={()=>{
         if(!deleteConfirm){setDeleteConfirm(true);return;}
         if(apply({action:"delete-page",pageId:page.id})){
          setSelected("");setDeleteConfirm(false);
         }
        }}/>
      </View>
     ):null}
     <Button label={showExport?"Hide ownership export":"Keep a copy of my website content"}
      onPress={()=>setShowExport(x=>!x)}/>
     {showExport?(
      <View>
       <Text style={styles.cardBody}>Share a portable JSON copy of your pages, wording and design choices using your iPhone's share sheet. The export contains public business details but NOT photographs, private customer data, passwords, hosting, domain configuration or working bookings/forms. It is not yet a ready-to-host website archive.</Text>
       <Button label="Share my website content (JSON)" onPress={onShare}/>
       <Text style={styles.sectionLabel}>Portable static website ZIP</Text>
       <Text style={styles.cardBody}>On iPhone, you can also export a genuine ZIP with your page HTML, responsive styles and approved original photos **when those photo files remain available on this device**. If any original is cloud-only or missing, BUSY will stop instead of creating a broken website. This static export does not include working booking forms, cloud services, payments, DNS or your domain.</Text>
       <Button label="Export my static website ZIP (iPhone)" onPress={onShareZip}/>
      </View>
     ):null}
    </Card>
   ):null}
  </>
 );
}
export {WebsitePagesEditor};
