import React from 'react';
import {Text} from 'react-native';
import {Button,Field} from '../components/ui';
import {styles} from '../theme/styles';
import {formRelevant,privateFormDefaults} from '../core/privateForm.mjs';
export function PrivateFormPreview({spec,values,setValues,result,onEvaluate,disabled=false}){
 return <>
  <Text style={styles.cardBody}>Private local check only. Nothing is submitted, booked, ordered, sent or charged.</Text>
  {spec.fields.filter(f=>formRelevant(f,values)).map(f=><React.Fragment key={f.id}>
   {f.type==='choice'?<><Text style={styles.sectionLabel}>{f.label+(f.required?' — required':'')}</Text>{f.options.map(o=><Button key={o.value} label={o.label+(values[f.id]===o.value?' ✓':'')} disabled={disabled} onPress={()=>setValues(old=>({...old,[f.id]:o.value}))}/>)}</>:f.type==='boolean'?<Button label={f.label+': '+(values[f.id]?'Yes':'No')} disabled={disabled} onPress={()=>setValues(old=>({...old,[f.id]:!old[f.id]}))}/>:<Field label={f.label+(f.type==='number'?' ('+f.unit+')':'')+(f.required?' — required':'')} value={String(values[f.id]??'')} editable={!disabled} maxLength={f.type==='text'?f.maxLength:32} keyboardType={f.type==='number'?'decimal-pad':'default'} onChangeText={value=>setValues(old=>({...old,[f.id]:f.type==='number'&&/^-?\d+(?:\.\d{1,6})?$/.test(value)?Number(value):value}))}/>}
   {result?.errors?.[f.id]?<Text accessibilityLiveRegion="polite" style={styles.cardBody}>{result.errors[f.id]}</Text>:null}
  </React.Fragment>)}
  <Button label="Check these private form values" disabled={disabled} onPress={onEvaluate}/>
  <Button label="Reset to reviewed starting values" disabled={disabled} onPress={()=>setValues(privateFormDefaults(spec))}/>
  {result?.ok?<Text accessibilityLiveRegion="polite" style={styles.cardBody}>{result.valid?'These values pass the reviewed local checks. Nothing was submitted.':'Please check the highlighted information. Your wording is kept.'}</Text>:null}
  {result?.outputs&&spec.calculation?spec.calculation.outputs.map(o=><Text key={o.id} style={styles.cardBody}>{o.label+': '+result.outputs[o.id]+(o.unit?' '+o.unit:'')}</Text>):null}
 </>;
}
