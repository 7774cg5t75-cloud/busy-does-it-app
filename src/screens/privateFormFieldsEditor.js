import React from 'react';
import {Text} from 'react-native';
import {Button,Details,Field} from '../components/ui';
import {styles} from '../theme/styles';
import {editPrivateForm,formInstruction,newPrivateFormField} from '../core/privateFormEdit.mjs';
export function PrivateFormFieldsEditor({spec,context,isCurrent,onPrepared,onUndo,hasUndo=false}){
 const [selected,setSelected]=React.useState(''),[label,setLabel]=React.useState(''),[type,setType]=React.useState('text'),[words,setWords]=React.useState(''),[notice,setNotice]=React.useState('');
 const f=spec.fields.find(f=>f.id===selected),apply=op=>{if(isCurrent?.()!==true)return false;const r=editPrivateForm(spec,op,context);if(!r.ok){setNotice(r.reason);return false;}onPrepared(r.spec);setNotice('Change prepared. Review the updated examples before accepting a new version.');return true;};
 return <Details label="Change the questions and behaviour">
  <Field label="Tell Busy one form change" value={words} maxLength={240} onChangeText={setWords}/>
  <Button label="Prepare this form change" onPress={()=>{if(isCurrent?.()!==true)return false;const r=formInstruction(spec,words,context);if(!r.ok){setNotice(r.reason);return false;}onPrepared(r.spec);setNotice(r.summary||'Change prepared. The new draft needs review.');return true;}}/>
  <Button label="Undo my last form edit" disabled={!hasUndo} onPress={onUndo}/>
  <Details label="Add a question"><Field label="New question wording" value={label} maxLength={80} onChangeText={setLabel}/>{[['text','Short text'],['number','Number'],['choice','Fixed choices'],['boolean','Yes or no']].map(([value,title])=><Button key={value} label={'Use '+title+(type===value?' ✓':'')} onPress={()=>setType(value)}/>)}<Button label="Prepare the new question" onPress={()=>apply({kind:'add',field:newPrivateFormField(spec,type,label)})}/></Details>
  {spec.fields.map(field=><Button key={field.id} label={'Edit question: '+field.label} onPress={()=>setSelected(field.id)}/>)}
  {f?<Details label={'Settings for '+f.label}>
   <Button label="Move this question earlier" onPress={()=>apply({kind:'move',fieldId:f.id,direction:'up'})}/><Button label="Move this question later" onPress={()=>apply({kind:'move',fieldId:f.id,direction:'down'})}/>
   <Button label={f.required?'Make this question optional':'Make this question required'} onPress={()=>apply({kind:'update',fieldId:f.id,changes:{required:!f.required}})}/>
   <Button label="Remove this question" onPress={()=>apply({kind:'remove',fieldId:f.id})}/>
   <Details label="Change the answer type">{[['text','Short text'],['number','Number'],['choice','Fixed choices'],['boolean','Yes or no']].map(([value,title])=><Button key={value} label={'Change to '+title} onPress={()=>apply({kind:'type',fieldId:f.id,type:value})}/>)}</Details>
   {f.type==='number'?<>{[['min','Minimum'],['max','Maximum'],['default','Starting value']].map(([key,title])=><Field key={key} label={title+' for '+f.label} value={String(f[key]??'')} maxLength={24} keyboardType="decimal-pad" onChangeText={text=>{if(!/^-?\d+(?:\.\d{1,6})?$/.test(text)){setNotice('Enter a complete number. Existing settings are kept.');return;}apply({kind:'update',fieldId:f.id,changes:{[key]:Number(text)}});}}/>)}<Field label={'Units for '+f.label} value={f.unit} maxLength={32} onChangeText={unit=>apply({kind:'update',fieldId:f.id,changes:{unit}})}/></>:null}
   {f.type==='text'?<Field label={'Maximum characters for '+f.label} value={String(f.maxLength)} maxLength={3} keyboardType="number-pad" onChangeText={text=>{if(!/^\d{1,3}$/.test(text)){setNotice('Choose a whole text limit. Existing settings are kept.');return;}apply({kind:'update',fieldId:f.id,changes:{maxLength:Number(text)}});}}/>:null}
   {f.type==='choice'?<><Field label="Wording for an additional choice" value={label} maxLength={80} onChangeText={setLabel}/><Button label="Add this fixed choice" onPress={()=>{let n=1;while(f.options.some(o=>o.value==='option_'+n))n++;return apply({kind:'update',fieldId:f.id,changes:{options:[...f.options,{value:'option_'+n,label}]}});}}/>{f.options.map(o=><Button key={o.value} label={'Remove choice: '+o.label} onPress={()=>apply({kind:'update',fieldId:f.id,changes:{options:f.options.filter(x=>x.value!==o.value),default:f.default===o.value?'':f.default}})}/>)}</>:null}
   <Details label="When to show this question"><Button label="Always show this question" onPress={()=>apply({kind:'unconditional',fieldId:f.id})}/>{spec.fields.slice(0,spec.fields.indexOf(f)).filter(p=>!p.when&&['choice','boolean'].includes(p.type)).flatMap(p=>(p.type==='boolean'?[{value:true,label:'Yes'},{value:false,label:'No'}]:p.options).map(o=><Button key={p.id+String(o.value)} label={'Only when '+p.label+' is '+o.label} onPress={()=>apply({kind:'update',fieldId:f.id,changes:{when:{field:p.id,equals:o.value}}})}/>))}</Details>
  </Details>:null}
  {spec.calculation?<Button label="Remove the read-only calculation from this form" onPress={()=>apply({kind:'detach_calculation'})}/>:null}
  {notice?<Text accessibilityLiveRegion="polite" style={styles.cardBody}>{notice}</Text>:null}
 </Details>;
}
