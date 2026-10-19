import {AppServicePresentationControls} from './appServicePresentationControls';
import {AppNavigationLabelControls} from './appNavigationLabelControls';
import {AppSelectedInstruction} from "./appSelectedInstruction";
import {AppComponentStyleControls} from './appComponentStyleControls';
import {AppSelectedServiceControls} from './appSelectedServiceControls';
import {AppSelectedBrandControls} from './appSelectedBrandControls';
import {AppSelectedFaqControls} from './appSelectedFaqControls';
import React from 'react';
import {AppSelectedImageControls} from './appSelectedImageControls';
import {selectedAppImage} from '../core/appSelectedImage.mjs';
import {Text,View} from 'react-native';
import {Button,Field} from '../components/ui';
import {styles} from '../theme/styles';
import {proposeCoordinatedAppChanges} from '../core/appCoordinatedStudio.mjs';
import {proposeAppSectionMove} from '../core/appSectionOrder.mjs';
import {PROFILE_TEXT_LIMITS} from '../core/appProfileFieldUndo.mjs';
// Native selection + bounded controls reuse the ORIGINAL Studio proposal,
// comparison, CAS approval and Undo. No native dragging or local save engine.
export function AppVisualSelection({Surface,config,businessContent,onPrepare,busy=false,voiceScope,onTranscribe}){
 const [selection,setSelection]=React.useState(null),[selectionSource,setSelectionSource]=React.useState(null);
 const [wording,setWording]=React.useState('');
 const [imageCopy,setImageCopy]=React.useState({alt:'',caption:''});
 const live=React.useRef(null);live.current={config,busy,selection,wording,imageCopy};
 const setWordingDraft=value=>{live.current.wording=value;setWording(value);};
 const current=()=>live.current.config===config&&!live.current.busy;
 const select=value=>{
  if(!current())return;
  live.current.selection=value;setSelection(value);setSelectionSource(config);
  const image=selectedAppImage(config,value);setImageCopy({alt:image?.alt||'',caption:image?.caption||''});
  const field=value.part==='header'?'tagline':value.part==='wording'?value.field:null;
  setWordingDraft(field?String(config?.publicProfile?.[field]??(field==='tagline'?config?.display?.tagline:'')??''):'');
 };
 const selectionCurrent=selectionSource===config;
 const prepare=operation=>{
  if(!current()||!selectionCurrent||live.current.selection!==selection||live.current.wording!==wording||live.current.imageCopy!==imageCopy)return;
  const proposal=proposeCoordinatedAppChanges(config,Array.isArray(operation)?operation:[operation]);
  if(proposal.ok)onPrepare(proposal);
 };
 const choices=selection?.part==='header'?[['typeStyle','balanced'],['typeStyle','editorial'],['typeStyle','impact'],['typeStyle','friendly']]:
  selection?.part==='navigation'?[['navigationStyle','tabs'],['navigationStyle','list']]:
  selection?.part==='spacing'?[['layoutDensity','comfortable'],['layoutDensity','compact'],['layoutDensity','airy']]:
  selection?.part==='services'?[['serviceStyle','cards'],['serviceStyle','rows'],['serviceStyle','spotlight']]:
  selection?.part==='gallery'?[['galleryLayout','grid'],['galleryLayout','stack'],['imageScale','regular'],['imageScale','large'],['imageCorners','rounded'],['imageCorners','square']]:[];
 const field=selection?.part==='header'?'tagline':selection?.part==='wording'?selection.field:null;
 const textOp=Object.hasOwn(PROFILE_TEXT_LIMITS,field||'')?{kind:'text',field,value:wording}:null;
 const textProof=textOp?proposeCoordinatedAppChanges(config,[textOp]):null;
 const moves=selection?.moduleKey?['up','down'].filter(direction=>proposeAppSectionMove(config,{moduleKey:selection.moduleKey,direction}).ok):[];
 return <View>
  <Text style={styles.cardBody}>Tap an outlined part to edit it. These controls prepare a private Studio comparison; nothing is saved or published here.</Text>
  <Surface config={config} businessContent={businessContent} ownerEdit={{selection:selectionCurrent?selection:null,onSelect:select}}/>
  <Button label={(selection?.part==='spacing'?'✓ ':'')+'Select app spacing'} disabled={busy} onPress={()=>select({part:'spacing'})}/>
  <Button label={(selection?.part==='branding'?'✓ ':'')+'Select app colours'} disabled={busy} onPress={()=>select({part:'branding'})}/>
  {selection?<View accessibilityLiveRegion="polite">
   <Text style={styles.sectionLabel}>{'Selected '+(selection.moduleKey||selection.field||selection.part).replaceAll('_',' ')}</Text>
   {!selectionCurrent?<View><Text accessibilityRole="alert" style={styles.cardBody}>The app source changed. Your unsubmitted wording is kept here; reselect the current part before preparing changes.</Text><Button label="Use current app source" disabled={busy} onPress={()=>select(selection)}/></View>:null}
   <AppNavigationLabelControls key={JSON.stringify(selection)+String(selectionCurrent)} config={config} selection={selection} disabled={busy||!selectionCurrent} onPrepare={prepare}/>
   {['service','service-button'].includes(selection.part)?<AppServicePresentationControls key={JSON.stringify(selection)+String(selectionCurrent)} config={config} selection={selection} disabled={busy||!selectionCurrent} onPrepare={prepare}/>:null}
   <AppComponentStyleControls key={JSON.stringify(selection)+String(selectionCurrent)} config={config} selection={selection} disabled={busy||!selectionCurrent} onPrepare={prepare}/>
   {['services','gallery'].includes(selection.part)?<Text style={styles.cardBody}>Presentation applies to this collection, preserving its content and customer actions.</Text>:null}
   <View style={{flexDirection:'row',flexWrap:'wrap',gap:8}}>
    {choices.map(([field,value])=>{
     const proof=proposeCoordinatedAppChanges(config,[{kind:'appearance',field,value}]);
     return <Button key={field+value} label={'Preview '+value+' '+(field==='typeStyle'?'typography':field==='serviceStyle'?'services':field==='galleryLayout'?'gallery layout':field==='imageScale'?'images':field==='imageCorners'?'image corners':selection.part)} disabled={busy||!selectionCurrent||!proof.ok} onPress={()=>prepare({kind:'appearance',field,value})}/>;
    })}
   </View>
   {selection.part==='image'?<View><Text style={styles.cardBody}>Only this photograph is selected. Choose the entire gallery separately to change its layout.</Text><Button label="Select entire gallery" disabled={busy||!selectionCurrent} onPress={()=>{if(current()&&live.current.selection===selection)select({part:'gallery',moduleKey:'gallery'});}}/></View>:null}
   {selection.part==='image'?<AppSelectedImageControls config={config} selection={selection} copy={imageCopy} disabled={busy||!selectionCurrent} onCopy={value=>{if(current()&&selectionCurrent&&live.current.selection===selection&&live.current.imageCopy===imageCopy)setImageCopy(value);}} onPrepare={prepare}/>:null}
   {selection.part==='service'?<AppSelectedServiceControls key={JSON.stringify(selection)+String(selectionCurrent)} config={config} selection={selection} disabled={busy||!selectionCurrent} onPrepare={prepare}/>:null}
   {selection.part==='faq'?<AppSelectedFaqControls key={JSON.stringify(selection)+String(selectionCurrent)} config={config} selection={selection} disabled={busy||!selectionCurrent} onPrepare={prepare}/>:null}
   {selection.part==='branding'?<AppSelectedBrandControls config={config} disabled={busy||!selectionCurrent} onPrepare={prepare}/>:null}
   {textOp?<View>
    <Field label={field==='tagline'?'App tagline (header and summary)':'Selected business '+field} value={wording} maxLength={PROFILE_TEXT_LIMITS[field]} multiline onChangeText={value=>{if(current()&&selectionCurrent&&live.current.selection===selection)setWordingDraft(value);}}/>
    <Text style={styles.cardBody}>Owner-written wording only. Review every affected screen in Studio before applying; your existing approval and Undo controls remain.</Text>
    <Button label="Cancel selected wording" disabled={busy||!selectionCurrent} onPress={()=>{if(current()&&selectionCurrent&&live.current.selection===selection)setWordingDraft(String(config?.publicProfile?.[field]??(field==='tagline'?config?.display?.tagline:'')??''));}}/>
    <Button label="Preview selected wording" disabled={busy||!selectionCurrent||!textProof?.ok} onPress={()=>prepare(textOp)}/>
    {selectionCurrent&&textProof&&!textProof.ok?<Text style={styles.cardBody}>{textProof.reason}</Text>:null}
   </View>:null}
   {moves.map(direction=><Button key={direction} label={'Preview selected section '+direction} disabled={busy||!selectionCurrent} onPress={()=>prepare({kind:'move',moduleKey:selection.moduleKey,direction})}/>)}
   {!['service','image','branding','faq'].includes(selection.part)&&!textOp&&!choices.some(([field,value])=>proposeCoordinatedAppChanges(config,[{kind:'appearance',field,value}]).ok)&&!moves.length?<Text accessibilityRole="alert" style={styles.cardBody}>No change is available for this selection. Current choices and owner locks are preserved.</Text>:null}
   <AppSelectedInstruction key={JSON.stringify(selection)} config={config} selection={selection} disabled={busy||!selectionCurrent} voiceScope={voiceScope} onTranscribe={onTranscribe} onPrepare={proposal=>{if(current()&&selectionCurrent&&live.current.selection===selection)onPrepare(proposal);}}/>
   <Button label="Cancel selection" onPress={()=>{if(current()){live.current.selection=null;setSelection(null);setSelectionSource(null);setWordingDraft('');}}}/>
  </View>:null}
 </View>;
}
