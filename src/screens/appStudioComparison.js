import React from "react";
import {Text,View,ScrollView} from "react-native";
import {Button,MetricRow} from "../components/ui";
import {styles} from "../theme/styles";
import {compareBusinessAppDesign} from "../core/appUsabilityAudit.mjs";
import {compareAppScreenQuality} from "../core/appResponsiveQuality.mjs";
import {SAMPLE_WIDTHS} from "../core/appResponsiveDesign.mjs";

// Both sides use the original marketplace renderer. Fixed content widths are
// a development/owner preview, never claims about a native device screenshot.
function AppStudioComparison({original,proposed,renderSurface}){
 const [side,setSide]=React.useState("proposed");
 const [widthId,setWidthId]=React.useState("phone");
 const comparison=compareBusinessAppDesign(original,proposed);
 const width=SAMPLE_WIDTHS.find(x=>x.id===widthId)||SAMPLE_WIDTHS[1];
 if(!comparison.ok)return <Text style={styles.cardBody}>{comparison.reason}</Text>;
 const quality=comparison.designOnly?compareAppScreenQuality(original,proposed):null;
 return <>
  <Text style={styles.sectionLabel}>Before and after comparison</Text>
  <Text style={styles.cardBody}>{comparison.changeCount+" layout / navigation differences recorded. "+
   (comparison.designOnly?"Only design settings changed.":"Public content or modules also changed; review everything.")}</Text>
  {comparison.changes.slice(0,8).map(change=><MetricRow key={change.field}
   left={change.label} right={String(change.from)+" → "+String(change.to)}/>)}
  {quality?.ok?<Text style={styles.cardBody}>{quality.changedWidthCount+
   " of 3 sample widths have predicted navigation or column changes. Text wrapping, accessibility and customer tasks need separate testing."}</Text>:null}
  <Text style={styles.sectionLabel}>Cross-screen quality checks</Text>
  <Text style={styles.cardBody}>Rules compare the proposed configurations at three sample widths; the preview below lets you inspect each supported width.</Text>
  <Text style={styles.sectionLabel}>Choose a preview width</Text>
  {SAMPLE_WIDTHS.map(sample=><Button key={sample.id}
   label={(sample.id===widthId?"✓ ":"")+sample.label+" ("+sample.width+" pt)"}
   onPress={()=>setWidthId(sample.id)}/>)}
  <Button label={side==="original"?"✓ Original design":"Show original design"}
   onPress={()=>setSide("original")}/>
  <Button label={side==="proposed"?"✓ Proposed design":"Show proposed design"}
   onPress={()=>setSide("proposed")}/>
  <ScrollView horizontal showsHorizontalScrollIndicator
   accessibilityLabel="Private app design preview; scroll horizontally for wider layouts">
   <View style={{width:width.width}} key={width.id+":"+side}>
    {renderSurface(side==="original"?original:proposed)}
   </View>
  </ScrollView>
  <Text style={styles.cardBody}>{"Showing "+(side==="original"?"your original":"the proposed")+
   " at "+width.width+" layout points. Wider layouts scroll horizontally. This uses the shared app renderer, not a native device screenshot or a tested customer journey."}</Text>
 </>;
}
export {AppStudioComparison};
