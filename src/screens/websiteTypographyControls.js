import React from 'react';
import {Text,View} from 'react-native';
import {Button} from '../components/ui';
import {styles} from '../theme/styles';
import {textTypographySupports} from '../../supabase/functions/busy-website-worker/websiteTextTypography.mjs';
// Small contextual choices use the same literal grammar/preview/commit path as Busy.
export function WebsiteTypographyControls({section,selection,onChoose}){
 const [category,setCategory]=React.useState(null);
 const target=selection?.field==='title'?'title':selection?.field==='body'?'body':null;
 if(!target||!(selection?.itemId?['services','faq','testimonials'].includes(section?.type):textTypographySupports[target+'Font'].includes(section?.type)))return null;
 const subject=target==='title'?'heading':'paragraph';
 const groups={font:[['brand','Use brand font'],['sans','Clean sans serif'],['serif','Classic serif'],['mono','Monospace']],
  weight:[['brand','Use brand weight'],['regular','Regular'],['medium','Medium'],['bold','Bold'],['heavy','Extra bold']],
  'line spacing':[['brand','Use brand spacing'],['standard','Comfortable'],['relaxed','More breathing room']],
  alignment:[['brand','Use brand alignment'],['left','Left'],['center','Centre'],['right','Right']],
  colour:[['brand','Use original colour'],['ink','Section foreground'],['accent','Readable brand accent']]};
 return <View>
  <Text style={styles.sectionLabel}>Style this {subject}</Text>
  {target==='title'?['smaller','normal','bigger'].map(size=><Button key={size} label={'Preview '+size+' heading'} onPress={()=>onChoose('make this heading '+size)}/>):null}
  <Text style={styles.cardBody}>Applies to this selected {selection?.itemId?'card':'section'} {subject}, across screen widths. Other content and your Brand DNA stay unchanged. Colour uses section foreground or an adjusted brand accent for the supported solid backgrounds; photo contrast is not assessed. Choose a setting, then preview and approve with the existing Busy controls.</Text>
  {Object.keys(groups).map(name=><Button key={name} label={(category===name?'✓ ':'')+name} onPress={()=>setCategory(category===name?null:name)}/>)}
  {category?groups[category].map(([value,label])=><Button key={value} label={label} onPress={()=>onChoose('set this '+subject+' '+category+' to '+value)}/>):null}
 </View>;
}
