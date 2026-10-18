import React from 'react';
import {Text,View} from 'react-native';
import {Button} from '../components/ui';
import {styles} from '../theme/styles';
import {proposeCoordinatedAppChanges} from '../core/appCoordinatedStudio.mjs';
import {proposeAppSectionMove} from '../core/appSectionOrder.mjs';
// Native selection is deliberate tapping + accessible buttons, not web dragging.
// Proposals return to the ORIGINAL Studio preview, CAS approval and Undo.
export function AppVisualSelection({Surface,config,businessContent,onPrepare,busy=false}){
 const [selection,setSelection]=React.useState(null);
 const prepare=operation=>{
  if(busy)return;
  const proposal=proposeCoordinatedAppChanges(config,[operation]);
  if(proposal.ok)onPrepare(proposal);
 };
 const choices=selection?.part==='header'?[['typeStyle','balanced'],['typeStyle','editorial'],['typeStyle','impact'],['typeStyle','friendly']]:
  selection?.part==='navigation'?[['navigationStyle','tabs'],['navigationStyle','list']]:
  selection?.part==='spacing'?[['layoutDensity','comfortable'],['layoutDensity','compact'],['layoutDensity','airy']]:[];
 const moves=selection?.moduleKey?['up','down'].filter(direction=>proposeAppSectionMove(config,{moduleKey:selection.moduleKey,direction}).ok):[];
 return <View>
  <Text style={styles.cardBody}>Tap the outlined header or a navigation label to select it. Native controls prepare a private Studio comparison; nothing is saved or published here.</Text>
  <Surface config={config} businessContent={businessContent} ownerEdit={{selection,onSelect:value=>{if(!busy)setSelection(value);}}}/>
  <Button label={(selection?.part==='spacing'?'✓ ':'')+'Select app spacing'} disabled={busy} onPress={()=>setSelection({part:'spacing'})}/>
  {selection?<View accessibilityLiveRegion="polite">
   <Text style={styles.sectionLabel}>{'Selected '+(selection.moduleKey||selection.part).replaceAll('_',' ')}</Text>
   {choices.map(([field,value])=>{
    const proof=proposeCoordinatedAppChanges(config,[{kind:'appearance',field,value}]);
    return <Button key={field+value} label={'Preview '+value+' '+(field==='typeStyle'?'typography':selection.part)} disabled={busy||!proof.ok} onPress={()=>prepare({kind:'appearance',field,value})}/>;
   })}
   {moves.map(direction=><Button key={direction} label={'Preview selected section '+direction} disabled={busy} onPress={()=>prepare({kind:'move',moduleKey:selection.moduleKey,direction})}/>)}
   {!choices.some(([field,value])=>proposeCoordinatedAppChanges(config,[{kind:'appearance',field,value}]).ok)&&!moves.length?<Text accessibilityRole="alert" style={styles.cardBody}>No change is available for this selection. Current choices and owner locks are preserved.</Text>:null}
  </View>:null}
 </View>;
}
