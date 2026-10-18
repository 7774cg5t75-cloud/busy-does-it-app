import React from 'react';
import {View,Text} from 'react-native';
import {Button} from '../components/ui';
import {styles} from '../theme/styles';
import {selectedAppService} from '../core/appSelectedService.mjs';
import {SERVICE_PRESENTATION_OPTIONS} from '../core/appServicePresentation.mjs';
import {proposeCoordinatedAppChanges} from '../core/appCoordinatedStudio.mjs';
export function AppServicePresentationControls({config,selection,disabled,onPrepare}){
 const [active,setActive]=React.useState(null),live=React.useRef(null);live.current={config,selection,disabled,active};
 const current=()=>live.current.config===config&&live.current.selection===selection&&live.current.active===active&&!live.current.disabled;
 const row=selectedAppService(config,selection);if(!row?.id)return null;
 const action=selection.part==='service-button'?selection.action:null,prefix=action==='booking_request'?'booking':action==='enquiry'?'enquiry':null;
 const fields=prefix?[[prefix+'Size','Button size'],[prefix+'Tone','Button emphasis'],[prefix+'Align','Button alignment'],[prefix+'Corners','Button corners']]:[['spacing','Card spacing'],['surface','Card background'],['corners','Card corners']];
 return <View><Text style={styles.sectionLabel}>{prefix?'Style this request button':'Style this service card'}</Text><Text style={styles.cardBody}>{prefix?'Only this service’s selected button changes. Its wording and request destination stay the same.':'Only this identified card changes. Existing text styles, category, price and actions are preserved.'}</Text>
  <View style={{flexDirection:'row',flexWrap:'wrap',gap:6}}>{fields.map(([field,label])=><Button key={field} label={label} disabled={disabled} onPress={()=>{if(current())setActive(active===field?null:field);}}/>)}</View>
  {active&&fields.some(([key])=>key===active)?SERVICE_PRESENTATION_OPTIONS[active].map(value=>{const op={kind:'service_presentation',field:row.id,value:{[active]:value}},proof=proposeCoordinatedAppChanges(config,[op]);return <Button key={value} label={'Preview '+value} disabled={disabled||!proof.ok} onPress={()=>{if(current()&&proof.ok)onPrepare(op);}}/>;}):null}
  {(()=>{const op={kind:'reset_service_presentation',field:row.id,value:prefix||'card'},proof=proposeCoordinatedAppChanges(config,[op]);return <Button label={prefix?'Reset this button style':'Reset this card style'} disabled={disabled||!proof.ok} onPress={()=>{if(current()&&proof.ok)onPrepare(op);}}/>;})()}
 </View>;
}
