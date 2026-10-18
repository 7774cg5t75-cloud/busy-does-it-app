import React from 'react';
import {Text,View} from 'react-native';
import {Button} from '../components/ui';
import {styles} from '../theme/styles';
import {OPTIONS} from '../core/appAppearanceEditing.mjs';
import {nativePalette,LABELS} from '../core/nativePalette.mjs';
import {auditStandaloneContrast} from '../core/appContrastAudit.mjs';
import {proposeCoordinatedAppChanges} from '../core/appCoordinatedStudio.mjs';
export function AppSelectedBrandControls({config,onPrepare,disabled=false}){
 const [expanded,setExpanded]=React.useState(false);
 const live=React.useRef(null);live.current={config,disabled};
 const current=()=>live.current.config===config&&!live.current.disabled;
 const palette=config?.presentation?.brandPalette||'midnight';
 const colors=nativePalette(palette,config?.presentation?.brandAccent),audit=auditStandaloneContrast(colors);
 const quick=['midnight','forest','linen','porcelain'];
 const choices=expanded?OPTIONS.brandPalette.filter(name=>name!=='custom'):quick;
 return <View>
  <Text style={styles.cardBody}>App-wide colours affect supported screens, cards and accents, not only the selected heading. Your website and stored Brand DNA stay separate. Review in Studio before approval; Undo restores the original.</Text>
  <View style={{backgroundColor:colors.bg,padding:12,borderRadius:12}}>
   <Text style={{color:colors.text,fontSize:18,fontWeight:'700'}}>{LABELS[palette]||'Current app colours'}</Text>
   <View style={{backgroundColor:colors.surface,padding:12,marginTop:8,borderRadius:8}}>
    <Text style={{color:colors.accent,fontWeight:'700'}}>Service accent</Text>
    <Text style={{color:colors.muted,marginTop:6}}>Customer information stays readable on supported solid backgrounds.</Text>
   </View>
  </View>
  <Text style={styles.cardBody}>{audit.normalTextAA?'Calculated text contrast passes for these supported solid-colour pairs.':'These colour pairs need review.'} This is not a device or screenshot assessment. Rendered accents may be adjusted for readability; your saved brand colour is retained.</Text>
  <View style={{flexDirection:'row',flexWrap:'wrap',gap:6}}>{choices.map(name=>{
   const operation={kind:'appearance',field:'brandPalette',value:name},proposal=proposeCoordinatedAppChanges(config,[operation]);
   return <View key={name} style={{width:'48%'}}><Button label={(palette===name?'✓ ':'')+'Preview '+LABELS[name]} disabled={disabled||!proposal.ok} onPress={()=>{if(current()&&proposal.ok)onPrepare(operation);}}/></View>;
  })}</View>
  <Button label={expanded?'Show fewer app colours':'Show all app colours'} disabled={disabled} onPress={()=>{if(current())setExpanded(!expanded);}}/>
 </View>;
}
