import React from 'react';
import {Text,View} from 'react-native';
import {Button} from '../components/ui';
import {styles} from '../theme/styles';
import {textTypographySupports} from '../../supabase/functions/busy-website-worker/websiteTextTypography.mjs';
// Finite choices stage the original instruction/preview path, never CSS or a save.
export function WebsiteTypographyControls({section,selection,onChoose}){
 const [active,setActive]=React.useState(null),[help,setHelp]=React.useState(false);
 const scope=JSON.stringify([selection?.draftId,selection?.generation,selection?.pageId,selection?.sectionId,selection?.itemId,selection?.field,section?.type]);
 const live=React.useRef(null);live.current={scope,section,onChoose,category:null};
 const target=selection?.field==='title'?'title':selection?.field==='body'?'body':null;
 if(!target||!(selection?.itemId?['services','faq','testimonials'].includes(section?.type):textTypographySupports[target+'Font'].includes(section?.type)))return null;
 const subject=target==='title'?'heading':'paragraph';
 const groups={font:[['brand','Use brand font'],['sans','Clean sans serif'],['serif','Classic serif'],['mono','Monospace']],
  weight:[['brand','Use brand weight'],['regular','Regular'],['medium','Medium'],['bold','Bold'],['heavy','Extra bold']],
  'line spacing':[['brand','Use brand spacing'],['standard','Comfortable'],['relaxed','More breathing room']],
  alignment:[['brand','Use brand alignment'],['left','Left'],['center','Centre'],['right','Right']],
  colour:[['brand','Use original colour'],['ink','Section foreground'],['accent','Readable brand accent']]};
 if(target==='body')for(const group of ['size','size on phones','size on desktop'])groups[group]=[['brand','Use existing reading style'],['normal','Standard paragraph'],['large','Larger paragraph'],['extra-large','Extra large paragraph']];
 if(target==='title'&&!selection.itemId)for(const group of ['size on phones','size on desktop'])groups[group]=[['smaller','Smaller heading'],['normal','Standard heading'],['bigger','Bigger heading']];
 const category=active?.scope===scope&&groups[active.name]?active.name:null;
 live.current.category=category;
 const current=()=>live.current.scope===scope&&live.current.section===section&&live.current.onChoose===onChoose;
 const choose=(instruction,fromCategory=null)=>{if(current()&&(!fromCategory||live.current.category===fromCategory))onChoose(instruction);};
 return <View>
  <Text style={styles.sectionLabel}>Style this {subject}</Text>
  <Text style={styles.cardBody}>Choose a setting, then preview and approve. Your Brand DNA and other content stay unchanged.</Text>
  {target==='title'?<View style={{flexDirection:'row',flexWrap:'wrap',gap:6}}>{['smaller','normal','bigger'].map(size=><Button key={size} label={'Choose '+size+' heading'} onPress={()=>choose('make this heading '+size)}/>)}</View>:null}
  <View style={{flexDirection:'row',flexWrap:'wrap',gap:6}}>{Object.keys(groups).map(name=><View key={name} style={{width:'48%'}}><Button label={(category===name?'✓ ':'')+name} onPress={()=>{if(current())setActive(category===name?null:{scope,name});}}/></View>)}</View>
  {category?<View accessibilityLiveRegion="polite">{groups[category].map(([value,label])=><Button key={value} label={label} onPress={()=>choose(category.startsWith('size')?target==='title'?'make this heading '+value+' on '+category.split(' on ')[1]:'set this paragraph size to '+value+(category==='size'?'':' on '+category.split(' on ')[1]):'set this '+subject+' '+category+' to '+value,category)}/>)}</View>:null}
  {category?<Button label="Cancel style choice" onPress={()=>{if(current()){live.current.category=null;setActive(null);}}}/>:null}
  {target==='body'?<Button label="Preview easier reading" onPress={()=>choose('set this paragraph size to large; set this paragraph line spacing to relaxed')}/>:null}
  <Button label="Preview brand text styling" onPress={()=>choose(['font','weight','alignment','line spacing','colour'].map(field=>'set this '+subject+' '+field+' to brand').join('; '))}/>
  <Button label={help?'Hide typography guidance':'What these controls change'} onPress={()=>setHelp(!help)}/>
  {help?<Text style={styles.cardBody}>Default styling applies to this selected {selection?.itemId?'card':'section'} {subject}. Phone and desktop sizes affect only their named widths. Foreground and adjusted brand-accent colours use supported solid backgrounds; contrast over photos is not assessed. Preview the result before keeping it.</Text>:null}
 </View>;
}
