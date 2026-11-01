import {PrivateFormPreview} from './privateFormPreview';
import {privateFormDefaults} from '../core/privateForm.mjs';
import {privateArtifactCrypto} from '../core/privateArtifactCrypto';
import React from 'react';
import {Text,View} from 'react-native';
import {Button,Card,Details,Field} from '../components/ui';
import {styles} from '../theme/styles';
import {createPrivateFunctionAccount} from '../core/privateFunctionAccount.mjs';
import {explainCalculation} from '../core/privateCalculation.mjs';
// A PRIVATE owner composition wrapper. References never enter public draft_config.
export function PrivateFunctionLibrary({context,isCurrent,request,candidate,Surface,config,onReopenRule,onReopenForm,integrity=privateArtifactCrypto}){
 const live=React.useRef(null);live.current={context,isCurrent,request};const account=React.useRef(null);if(!account.current)account.current=createPrivateFunctionAccount({integrity,getCurrent:()=>live.current.context,isCurrent:()=>live.current.isCurrent?.()===true,request:body=>live.current.request(body)});
 const [rows,setRows]=React.useState([]),[selected,setSelected]=React.useState(null),[values,setValues]=React.useState({}),[result,setResult]=React.useState(null),[notice,setNotice]=React.useState(''),[pending,setPending]=React.useState(false),[showPreview,setShowPreview]=React.useState(false);
 const defaults=spec=>spec.kind==='private-form'?privateFormDefaults(spec):Object.fromEntries(spec.inputs.map(f=>[f.id,f.type==='boolean'?f.default:String(f.default)]));
 const current=()=>live.current.isCurrent?.()===true,refresh=async()=>{const r=await account.current.list();if(current()){if(r.ok)setRows(r.functions||[]);else setNotice(r.reason);}return r.ok;};
 const perform=async action=>{if(pending||!current())return false;setPending(true);try{return await action();}finally{setPending(false);}};
 const choose=async(row)=>{const r=await account.current.read(row.functionId,row.version);if(!current())return false;if(!r.ok){setNotice(r.reason);return false;}setSelected(r);setValues(defaults(r.artifact.spec));setResult(null);setShowPreview(false);setNotice(r.eligible?'Saved private version verified. It has not been installed or published.':'This historical version is '+r.status+' and cannot execute.');return r.ok;};
 const sameApp=selected?.reference.appRevision===context?.scope?.sourceRevision&&selected?.reference.appId===context?.scope?.projectId&&selected?.reference.ownerId===context?.scope?.ownerId&&selected?.reference.businessId===context?.scope?.businessId;
 return <Details label="Saved private app functions"><Card title="Your private functions and forms" body="Save a reviewed function or form, reopen its exact version and try it in your private app. Customer execution remains unavailable.">
  {!request?<Text style={styles.cardBody}>Private account storage is unavailable here. Your session-only experiment still works.</Text>:<>
   <Button label="Load saved private functions" disabled={pending} onPress={()=>perform(refresh)}/>
   {rows.map(row=><Button key={row.functionId} label={'Open saved function '+(row.disabled?'(disabled)':'version '+row.version)} disabled={pending} onPress={()=>perform(()=>choose(row))}/>)}
   {candidate?<Button label={selected?'Save reviewed rules as a new version':'Save reviewed rules as a private function'} disabled={pending} onPress={()=>perform(async()=>{const review=account.current.review(candidate,selected?.reference||null);if(!review.ok){setNotice(review.reason);return false;}const r=await account.current.save(review.ticket,{ownerApproved:true});if(current()){setNotice(r.ok?'Private version saved and independently reopened. Preview requires a separate deliberate action.':r.reason);if(r.ok){setSelected(r);setValues(defaults(r.artifact.spec));setShowPreview(false);setResult(null);await refresh();}}return r.ok;})}/>:<Text style={styles.cardBody}>Review and accept rules in the experiment above before saving.</Text>}
   <Button label="Inspect an uncertain save" disabled={pending} onPress={()=>perform(async()=>{const r=await account.current.recover();if(current()){setNotice(r.ok?'The exact saved record was found. This observation is not the original acknowledgement.':r.reason);if(r.ok){setSelected(r);await refresh();}}return r.ok;})}/>
   {selected?<>
    <Text style={styles.sectionLabel}>{selected.artifact.spec.title}</Text><Text style={styles.cardBody}>{selected.artifact.spec.purpose}</Text>
    <Details label="Approved assumptions and rules">{(selected.artifact.spec.fields||selected.artifact.spec.inputs).map(f=><Text key={f.id} style={styles.cardBody}>{f.label+': starting value '+f.default+(f.unit?' '+f.unit:'')}</Text>)}{(selected.artifact.spec.outputs||selected.artifact.spec.calculation?.outputs||[]).map(o=><Text key={o.id} style={styles.cardBody}>{o.label+': '+explainCalculation(o.expression,selected.artifact.spec.inputs||selected.artifact.spec.calculation.inputs)}</Text>)}</Details>
    <Button label="Prepare this exact version in my private app preview" disabled={pending||!selected.eligible||!sameApp} onPress={()=>perform(async()=>{const r=await account.current.read(selected.reference.functionId,selected.reference.version);if(!current())return false;if(!r.ok||!r.eligible||JSON.stringify(r.reference)!==JSON.stringify(selected.reference)){setShowPreview(false);setResult(null);setNotice('The function changed or is unavailable. Reopen the saved version.');return false;}setShowPreview(true);setNotice('Private composition prepared. Nothing was added to public app configuration.');return true;})}/>
    <Button label="Revise these rules in the private experiment" disabled={pending} onPress={()=>{if(!current()||!sameApp)return false;setShowPreview(false);setResult(null);return (selected.artifact.spec.kind==='private-form'?onReopenForm?.(selected.artifact.spec):onReopenRule?.(selected.artifact.spec))===true;}}/>
    <Button label="Disable this private function" disabled={pending||!selected.eligible} onPress={()=>perform(async()=>{const r=await account.current.disable(selected.reference,{ownerApproved:true});if(current()){setShowPreview(false);setResult(null);setNotice(r.ok?'Function disabled. Historical versions are retained.':r.reason);if(r.ok){setSelected(r);await refresh();}}return r.ok;})}/>
    {showPreview&&sameApp&&current()?<View>
     {Surface?<Surface config={config}/>:null}
     <Card title={selected.artifact.spec.title} body="Private calculation section — indicative figures only. No order, inventory, quote, booking or payment action.">
      {selected.artifact.spec.kind==='private-form'?<PrivateFormPreview spec={selected.artifact.spec} values={values} setValues={change=>{setValues(change);setResult(null);}} result={result} disabled={pending} onEvaluate={()=>perform(async()=>{const r=await account.current.run(selected.reference,values);if(current()){setResult(r.ok?r:null);setNotice(r.ok?'Checked the exact freshly verified private form. Nothing was submitted.':r.reason);if(!r.ok)setShowPreview(false);}return r.ok;})}/>:<>
      {selected.artifact.spec.inputs.map(f=>f.type==='number'?<Field key={f.id} label={f.label+' ('+f.unit+')'} value={values[f.id]} maxLength={32} keyboardType="decimal-pad" onChangeText={v=>{setValues(old=>({...old,[f.id]:v}));setResult(null);}}/>:<Button key={f.id} label={f.label+': '+(values[f.id]?'Yes':'No')} onPress={()=>{setValues(old=>({...old,[f.id]:!old[f.id]}));setResult(null);}}/>)}
      <Button label="Calculate with the verified saved version" disabled={pending} onPress={()=>perform(async()=>{const input={};for(const f of selected.artifact.spec.inputs){if(f.type==='boolean')input[f.id]=values[f.id];else{if(!/^-?\d+(?:\.\d{1,6})?$/.test(values[f.id]||'')){setNotice('Use complete numbers. Your test values are kept.');return false;}input[f.id]=Number(values[f.id]);}}const r=await account.current.run(selected.reference,input);if(current()){setResult(r.ok?r:null);setNotice(r.ok?'Calculated using the freshly verified private version.':r.reason);if(!r.ok)setShowPreview(false);}return r.ok;})}/>
      {result?selected.artifact.spec.outputs.map(o=><Text key={o.id} style={styles.cardBody}>{o.label+': '+result.outputs[o.id]+(o.unit?' '+o.unit:'')}</Text>):null}
      </>}

     </Card>
    </View>:null}
   </>:null}
  </>}
  {notice?<Text accessibilityLiveRegion="polite" style={styles.cardBody}>{notice}</Text>:null}
 </Card></Details>;
}
