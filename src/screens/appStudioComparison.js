import {BuilderQualityNotice} from "../components/builderQualityNotice";
import {reviewAppEditingQuality} from "../core/appAppearanceEditing.mjs";
import {reviewAppContentChanges} from '../core/appContentChangeReview.mjs';
import React from "react";
import {Text,View,ScrollView,useWindowDimensions} from "react-native";
import {Button,MetricRow} from "../components/ui";
import {styles} from "../theme/styles";
import {compareBusinessAppDesign} from "../core/appUsabilityAudit.mjs";
import {compareAppScreenQuality} from "../core/appResponsiveQuality.mjs";
import {SAMPLE_WIDTHS} from "../core/appResponsiveDesign.mjs";

// Both sides use the original marketplace renderer. Fixed content widths are
// a development/owner preview, never claims about a native device screenshot.
function AppStudioComparison({original,proposed,renderSurface,onQualityRepair}){
 const [side,setSide]=React.useState("proposed");
 const [widthId,setWidthId]=React.useState("phone");
 const [contentLimit,setContentLimit]=React.useState(12);
 const dimensions=useWindowDimensions();
 const [viewport,setViewport]=React.useState(null),[fit,setFit]=React.useState(true);
 const contentReview=reviewAppContentChanges(original,proposed);
 const comparison=compareBusinessAppDesign(original,proposed);
 const width=SAMPLE_WIDTHS.find(x=>x.id===widthId)||SAMPLE_WIDTHS[1];
 const previewWidth=fit?Math.min(width.width,viewport||Math.max(240,dimensions.width-80)):width.width;
 if(!comparison.ok)return <Text style={styles.cardBody}>{comparison.reason}</Text>;
 const quality=comparison.designOnly?compareAppScreenQuality(original,proposed):null;
 return <>
  <Text style={styles.sectionLabel}>Before and after comparison</Text>
  <BuilderQualityNotice quality={reviewAppEditingQuality(proposed)} onRepair={onQualityRepair}/>
  <Text style={styles.cardBody}>{comparison.changeCount+" layout / navigation differences recorded. "+
   (comparison.designOnly?"Only design settings changed.":"Public content or modules also changed; review everything.")}</Text>
  {comparison.changes.slice(0,8).map(change=><MetricRow key={change.field}
   left={change.label} right={String(change.from)+" → "+String(change.to)}/>)}
  {quality?.ok?<Text style={styles.cardBody}>{quality.changedWidthCount+
   " of 3 sample widths have predicted navigation or column changes. Text wrapping, accessibility and customer tasks need separate testing."}</Text>:null}
  {contentReview.ok&&contentReview.changeCount>0?<View>
   <Text style={styles.sectionLabel}>Public wording and service changes</Text>
   <Text style={styles.cardBody}>Review additions, removals, changed wording and list positions below. This covers the listed public fields; inspect both previews for other changes.</Text>
   {contentReview.rows.slice(0,contentLimit).map(row=><View key={row.id} style={{marginBottom:10}}>
    <Text style={styles.sectionLabel}>{row.subject+' — '+row.kind+' '+row.field}</Text>
    <Text selectable style={styles.cardBody}>{'Before: '+(row.before||'(not supplied)')}</Text>
    <Text selectable style={styles.cardBody}>{'After: '+(row.after||'(not supplied)')}</Text>
   </View>)}
   {contentReview.rows.length>contentLimit?<Button label={'Show more content changes ('+(contentReview.rows.length-contentLimit)+' remaining)'} onPress={()=>setContentLimit(n=>n+12)}/>:null}
  </View>:!contentReview.ok?<Text style={styles.cardBody}>{contentReview.reason+' Inspect the current and proposed previews before approval.'}</Text>:null}
  <Text style={styles.sectionLabel}>Cross-screen quality checks</Text>
  <Text style={styles.cardBody}>Rules compare the proposed configurations at three sample widths; the preview below lets you inspect each supported width.</Text>
  <Text style={styles.sectionLabel}>Choose a preview width</Text>
  <Button label={fit?"✓ Fit preview to this screen":"Fit preview to this screen"} selected={fit} onPress={()=>setFit(true)}/>
  {SAMPLE_WIDTHS.map(sample=><Button key={sample.id}
   label={(!fit&&sample.id===widthId?"✓ ":"")+sample.label+" ("+sample.width+" pt)"}
   onPress={()=>{setWidthId(sample.id);setFit(false);}}/>)}
  <Button label={side==="original"?"✓ Original design":"Show original design"}
   onPress={()=>setSide("original")}/>
  <Button label={side==="proposed"?"✓ Proposed design":"Show proposed design"}
   onPress={()=>setSide("proposed")}/>
  <ScrollView horizontal={!fit} showsHorizontalScrollIndicator={!fit} onLayout={event=>{const size=event.nativeEvent.layout.width;if(Number.isFinite(size)&&size>=200)setViewport(size);}}
   accessibilityLabel="Private app design preview; scroll horizontally for wider layouts">
   <View style={{width:previewWidth}} key={width.id+":"+side}>
    {renderSurface(side==="original"?original:proposed)}
   </View>
  </ScrollView>
  <Text style={styles.cardBody}>{"Showing "+(side==="original"?"your original":"the proposed")+
   " at "+previewWidth+" layout points. Wider layouts scroll horizontally. This uses the shared app renderer, not a native device screenshot or a tested customer journey."}</Text>
 </>;
}
export {AppStudioComparison};
