import React from 'react';
import {Text,View} from 'react-native';
import {Button} from '../components/ui';
import {styles} from '../theme/styles';
import {planSelectedWebsiteChanges} from '../core/websiteContextPlan.mjs';
// Stage only the original finite instructions. No coordinates, uploads,
// image approval or save path; original preview/transaction/Undo owns changes.
export function WebsitePhotoControls({draft,selection,section,onChoose}){
 const [active,setActive]=React.useState(null);
 const scope=JSON.stringify(selection),live=React.useRef(null);live.current={draft,scope};
 if(selection?.field!=='photo'||!['hero','photo-feature','gallery'].includes(section?.type))return null;
 const groups={framing:[['Focus top','crop this photo to the top'],['Focus centre','crop this photo to the center'],['Focus bottom','crop this photo to the bottom']],
  size:[['Larger picture','make this photo bigger'],['Smaller picture','make this photo smaller']]};
 if(section.type==='gallery'){
  groups.framing.push(['Show whole photograph','show this whole photograph'],['Fill picture tile','fill this photo frame']);
  groups.position=[['Earlier in gallery','move this photo to the left'],['Later in gallery','move this photo to the right']];
  groups['phone size']=[['Larger tiles on phones','make this photo bigger on phones'],['Smaller tiles on phones','make this photo smaller on phones']];
 }else if(section.type==='photo-feature'){
  delete groups.size;
  groups.position=[['Picture before text','move this photo to the left'],['Picture after text','move this photo to the right']];
 }
 const category=active?.draft===draft&&active.scope===scope?active.name:null;
 const current=()=>live.current.draft===draft&&live.current.scope===scope;
 return <View>
  <Text style={styles.sectionLabel}>Adjust this picture</Text>
  <Text style={styles.cardBody}>{section.type==='gallery'?'Framing and position affect this photo; size presets affect the whole gallery.':'Use responsive picture presets; text and customer actions stay intact.'} Choose, compare, then apply. Nothing changes yet.</Text>
  <View style={{flexDirection:'row',flexWrap:'wrap',gap:6}}>{Object.keys(groups).map(name=><View key={name} style={{width:'48%'}}><Button label={(category===name?'✓ ':'')+'Picture '+name} onPress={()=>{if(current())setActive(category===name?null:{draft,scope,name});}}/></View>)}</View>
  {category&&groups[category]?<View accessibilityLiveRegion="polite">{groups[category].map(([label,instruction])=>{
   const plan=planSelectedWebsiteChanges(draft,selection?.pageId,selection,instruction);
   return <Button key={instruction} label={label} disabled={!plan.ok} onPress={()=>{if(current()&&plan.ok)onChoose(instruction);}}/>;
  })}</View>:null}
 </View>;
}
