import React from 'react';
import {Text} from 'react-native';
import {Button,Field} from '../components/ui';
import {styles} from '../theme/styles';
import {PrivateFormPreview} from './privateFormPreview';
export function PrivateArtifactFields({spec,values,setValues,result,onEvaluate,disabled=false}){
 if(spec.kind==='private-form')return <PrivateFormPreview {...{spec,values,setValues,result,onEvaluate,disabled}}/>;
 return <>{spec.inputs.map(f=>f.type==='boolean'?<Button key={f.id} label={f.label+': '+(values[f.id]?'Yes':'No')} disabled={disabled} onPress={()=>setValues(old=>({...old,[f.id]:!old[f.id]}))}/>:<Field key={f.id} label={f.label+' ('+f.unit+')'} value={String(values[f.id]??'')} maxLength={32} keyboardType="decimal-pad" editable={!disabled} onChangeText={v=>setValues(old=>({...old,[f.id]:/^-?\d+(?:\.\d{1,6})?$/.test(v)?Number(v):v}))}/>)}<Button label="Calculate these private values" disabled={disabled} onPress={onEvaluate}/>{result?.outputs?spec.outputs.map(o=><Text key={o.id} style={styles.cardBody}>{o.label+': '+result.outputs[o.id]+(o.unit?' '+o.unit:'')}</Text>):null}</>;
}
