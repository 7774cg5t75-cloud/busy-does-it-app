import React from 'react';
import {View,Text} from 'react-native';
import {Button} from './ui';
import {styles} from '../theme/styles';
// Shared presentation of existing deterministic reviews, never AI scoring.
export function BuilderQualityNotice({quality,onRepair}){
 if(!quality)return null;
 return <View accessibilityLiveRegion="polite">
  <Text style={styles.sectionLabel}>{quality.level==='critical'?'Fix before continuing':quality.level==='advisory'?'Busy’s design suggestion':'Structured edit checks'}</Text>
  <Text style={styles.cardBody}>{quality.explanation}</Text>
  {(quality.findings||[]).slice(0,3).map(f=><View key={f.id}>
   <Text style={styles.cardBody}>{f.message+' ('+(f.evidence==='heuristic'?'suggestion, not measured':f.evidence)+')'}</Text>
   {onRepair&&f.repair?<Button label="Preview the suggested adjustment" onPress={()=>onRepair(f.repair)}/>:null}
  </View>)}
  {quality.level==='advisory'?<Text style={styles.cardBody}>Your choice remains available. Compare both layouts, then use the normal approval control to keep it.</Text>:null}
  <Text style={styles.cardBody}>Browser/device layout and assistive interaction are not verified by these structured checks.</Text>
 </View>;
}
