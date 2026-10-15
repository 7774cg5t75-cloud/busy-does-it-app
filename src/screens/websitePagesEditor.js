import React from "react";
import {Text,TextInput,View} from "react-native";
import {Button,Card,Field} from "../components/ui";
import {styles} from "../theme/styles";

/** Private owner-managed pages. Built-in pages remain generated and protected. */
function WebsitePagesEditor({draft,onApply,onShare,onShareZip,onBackup}){
 const [open,setOpen]=React.useState(false);
 const [metadata,setMetadata]=React.useState(null);
 const [metadataTitle,setMetadataTitle]=React.useState(''),[metadataDescription,setMetadataDescription]=React.useState('');
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
       onPress={()=>{
        if(item.id.startsWith("page-"))selectPage(item);else setSelected("");
        setMetadata({pageId:item.id,expectedWebsiteId:draft.id,expectedGeneration:draft.generation});
        setMetadataTitle(draft.seo?.pages?.[item.id]?.title||'');setMetadataDescription(draft.seo?.pages?.[item.id]?.description||'');
       }}/>
     ))}
     {metadata?<View>
      <Text style={styles.sectionLabel}>How this page is described in search</Text>
      <Text style={styles.cardBody}>Use accurate wording. This changes your private page title and description; it does not prove indexing or ranking improvements.</Text>
      <Field label="Search title (up to 70 characters)" value={metadataTitle} onChangeText={setMetadataTitle}/>
      <Field label="Search description (up to 160 characters)" value={metadataDescription} onChangeText={setMetadataDescription}/>
      <Button label="Save private page search details" onPress={()=>{if(apply({...metadata,action:'edit-page-metadata',title:metadataTitle,description:metadataDescription}))setMetadata(null);}}/>
      <Button label="Restore automatic page search details" onPress={()=>{if(apply({...metadata,action:'reset-page-metadata'}))setMetadata(null);}}/>
     </View>:null}
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
       <Text style={styles.sectionLabel}>Add a photo and description</Text>
       <Text style={styles.cardBody}>Choose an already approved gallery photograph. Your section heading and wording above are reused; you can edit them afterwards.</Text>
       {(sections.find(x=>x.id==="gallery")?.items||[])
         .filter(asset=>asset?.approved!==false&&asset?.storagePath)
         .slice(0,12).map((asset,index)=>(
          <Button key={asset.storagePath}
           label={"Add approved photo "+(index+1)+" with the wording above"}
           onPress={()=>{
             if(apply({action:"add-photo-feature",pageId:selected,
                 title:sectionTitle,body:sectionBody,storagePath:asset.storagePath})){
               setSectionTitle("");setSectionBody("");
             }
           }}/>
         ))}
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
       <Text style={styles.cardBody}>Save an optional private cloud backup of your approved website pictures while their originals are still on this device. Only a signed-in business owner or admin can transfer them. This does not change or publish your website.</Text>
       <Button label="Privately back up my original photos" onPress={onBackup}/>
       <Text style={styles.cardBody}>Export your real static HTML pages, styling and approved pictures as a ZIP to Files or a compatible app on iPhone or Android. Missing originals are retrieved only from your verified business-owned backups. If any photo cannot be recovered, BUSY stops rather than making an incomplete website. This ZIP does not transfer working booking forms, payments, cloud services or your domain.</Text>
       <Button label="Export my static website ZIP" onPress={onShareZip}/>
      </View>
     ):null}
    </Card>
   ):null}
  </>
 );
}
export {WebsitePagesEditor};
