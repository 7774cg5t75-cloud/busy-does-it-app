import React from 'react';
import {Text,View} from 'react-native';
import {Button} from '../components/ui';
import {styles} from '../theme/styles';
import {COMPONENT_STYLE_OPTIONS} from '../core/appComponentAppearance.mjs';
import {selectedAppFaq} from '../core/appSelectedFaq.mjs';
import {selectedAppService} from '../core/appSelectedService.mjs';
import {proposeCoordinatedAppChanges} from '../core/appCoordinatedStudio.mjs';
export function AppComponentStyleControls({config,selection,onPrepare,disabled=false}){
 const [target,setTarget]=React.useState(null),[group,setGroup]=React.useState(null);
 const live=React.useRef(null);live.current={config,selection,disabled,target,group};
 const current=()=>live.current.config===config&&live.current.selection===selection&&live.current.target===target&&live.current.group===group&&!live.current.disabled;
 const row=selectedAppService(config,selection);
 const faq=selectedAppFaq(config,selection);
 const targets=selection?.part==='header'?[['header-title','App heading'],['header-tagline','Header paragraph']]:faq?.id?[['faq:'+faq.id+':title','This question'],['faq:'+faq.id+':body','This answer']]:row?.id?[['service:'+row.id+':title','This service heading'],['service:'+row.id+':body','This service description']]:[];
 if(!['header','service','faq'].includes(selection?.part))return null;
 if(!targets.length)return <Text style={styles.cardBody}>Individual styling needs a unique saved item identifier. Existing collection presets and wording editing remain available; no identifier is invented.</Text>;
 const key=targets.some(([key])=>key===target)?target:targets[0][0];
 return <View>
  <Text style={styles.sectionLabel}>Style selected text only</Text>
  <Text style={styles.cardBody}>These settings affect only the named text component. Collection and app-wide presets below have a different scope. Actions, business facts and Brand DNA stay unchanged.</Text>
  {(()=>{const operation={kind:'component_appearance',field:key,value:{size:'large',weight:key.endsWith('title')?'bold':'regular',align:'left'}},proof=proposeCoordinatedAppChanges(config,[operation]);return <Button label="Preview clearer selected text" disabled={disabled||!proof.ok} onPress={()=>{if(current()&&proof.ok)onPrepare(operation);}}/>;})()}
  {(()=>{const operations=targets.map(([field])=>({kind:'component_appearance',field,value:{size:field.endsWith('title')?'large':'normal',weight:field.endsWith('title')?'bold':'regular',align:'left'}})),proof=proposeCoordinatedAppChanges(config,operations);return <View><Button label="Preview both selected texts" disabled={disabled||!proof.ok} onPress={()=>{if(current()&&proof.ok)onPrepare(operations);}}/><Text style={styles.cardBody}>Review the named heading and paragraph together. Their wording, other items and customer actions stay unchanged.</Text></View>;})()}
  <View style={{flexDirection:'row',flexWrap:'wrap',gap:6}}>{targets.map(([value,label])=><Button key={value} label={(value===key?'✓ ':'')+label} disabled={disabled} onPress={()=>{if(current()){live.current.target=value;live.current.group=null;setTarget(value);setGroup(null);}}}/>)}</View>
  <View style={{flexDirection:'row',flexWrap:'wrap',gap:6}}>{Object.keys(COMPONENT_STYLE_OPTIONS).map(field=><Button key={field} label={'Text '+field} disabled={disabled} onPress={()=>{if(current()){const next=group===field?null:field;live.current.group=next;setGroup(next);}}}/>)}</View>
  {group&&Object.hasOwn(COMPONENT_STYLE_OPTIONS,group)?<View accessibilityLiveRegion="polite">{COMPONENT_STYLE_OPTIONS[group].map(value=>{
   const operation={kind:'component_appearance',field:key,value:{[group]:value}},proof=proposeCoordinatedAppChanges(config,[operation]);
   return <Button key={value} label={'Preview '+value+' selected '+group} disabled={disabled||!proof.ok} onPress={()=>{if(current()&&proof.ok)onPrepare(operation);}}/>;
  })}</View>:null}
  {group?<Button label="Cancel selected text choice" disabled={disabled} onPress={()=>{if(current()){live.current.group=null;setGroup(null);}}}/>:null}
  {(()=>{const operation={kind:'component_appearance',field:key,value:null},proof=proposeCoordinatedAppChanges(config,[operation]);return <Button label="Use original style for selected text" disabled={disabled||!proof.ok} onPress={()=>{if(current()&&proof.ok)onPrepare(operation);}}/>;})()}
 </View>;
}
