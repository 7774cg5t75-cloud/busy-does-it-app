import {privateArtifactCrypto} from '../core/privateArtifactCrypto';
import {copyPrivateCalculationIntoForm} from '../core/privateFormEdit.mjs';
import {PrivateFormFieldsEditor} from './privateFormFieldsEditor';
import {validatePrivateForm} from '../core/privateForm.mjs';
import {explainCalculation} from '../core/privateCalculation.mjs';
import {calculationScope} from '../core/privateCalculationPilot.mjs';
import React from 'react';
import {Text} from 'react-native';
import {Button,Card,Details,Field} from '../components/ui';
import {styles} from '../theme/styles';
import {proposePrivateForm} from '../core/privateFormProposal.mjs';
import {privateFormDefaults,evaluatePrivateForm} from '../core/privateForm.mjs';
import {PrivateFormPreview} from './privateFormPreview';
import {stableJson} from '../core/stableJson.mjs';
export function PrivateFormPilot({context,isCurrent,onApprovedRule,onReopenRequest=null,onCalculationRequest=null,integrity=privateArtifactCrypto,onDraftChange=()=>{}}){
 const [goal,setGoal]=React.useState(''),[candidate,setCandidate]=React.useState(null),[values,setValues]=React.useState({}),[result,setResult]=React.useState(null),[notice,setNotice]=React.useState(''),[accepted,setAccepted]=React.useState(false),[history,setHistory]=React.useState([]);
 const live=React.useRef(null);live.current={context,isCurrent,candidate};const reviewed=React.useRef('');
 React.useEffect(()=>{if(onReopenRequest){setHistory([]);setCandidate(onReopenRequest);setGoal(onReopenRequest.purpose);setValues(privateFormDefaults(onReopenRequest));setAccepted(false);setResult(null);reviewed.current='';onApprovedRule(null);setNotice('Saved form reopened as a new draft. Review it again before saving a successor.');}},[onReopenRequest]);
 const prepared=next=>{if(isCurrent?.()!==true)return false;onDraftChange(true);setHistory(old=>[...old,{spec:candidate,values}].slice(-8));setCandidate(next);setValues(old=>Object.fromEntries(next.fields.map(f=>[f.id,Object.hasOwn(old,f.id)?old[f.id]:f.default])));setAccepted(false);setResult(null);reviewed.current='';onApprovedRule(null);return true;};
 React.useEffect(()=>{if(!onCalculationRequest)return;const captured=stableJson(context),original=candidate;let cancelled=false;(async()=>{if(!original){setNotice('Prepare or reopen a form first, then select the saved calculation again.');return;}const r=await copyPrivateCalculationIntoForm(original,onCalculationRequest,context,integrity);if(cancelled||live.current.isCurrent?.()!==true||stableJson(live.current.context)!==captured)return;if(stableJson(live.current.candidate)!==stableJson(original)){setNotice('Newer form edits were kept. Choose the saved calculation again to review a copy.');return;}if(r.ok){prepared(r.spec);setNotice(r.summary);}else setNotice(r.reason);})();return()=>{cancelled=true;};},[onCalculationRequest]);
 const edit=fn=>{if(!candidate||isCurrent?.()!==true)return false;return prepared(fn(JSON.parse(stableJson(candidate))));};
 const conditionLabel=f=>{if(!f.when)return '';const p=candidate.fields.find(p=>p.id===f.when.field),value=p?.type==='choice'?p.options.find(o=>o.value===f.when.equals)?.label:f.when.equals?'Yes':'No';return ' • shown when '+p.label+' is '+value;};
 const current=()=>live.current.isCurrent?.()===true&&candidate&&stableJson(candidate.scope)===stableJson(calculationScope(live.current.context))&&reviewed.current===stableJson(candidate);
 return <Details label="Private forms made for your business"><Card title="Prepare a useful private form" body="Review its questions, fixed options and local checks. This does not collect or submit customer information.">
  <Field label="What should this private form help you check?" value={goal} maxLength={240} onChangeText={v=>{onDraftChange(true);setGoal(v);setCandidate(null);setAccepted(false);onApprovedRule(null);}}/>
  <Button label="Prepare my private form" onPress={()=>{if(isCurrent?.()!==true)return false;const r=proposePrivateForm(context,goal);setAccepted(false);onApprovedRule(null);setResult(null);if(!r.ok){setNotice(r.reason);return false;}reviewed.current=stableJson(r.spec);setHistory([]);setCandidate(r.spec);setValues(privateFormDefaults(r.spec));setNotice('Review these questions and examples. No external actions are available.');return true;}}/>
  {candidate?<>
   <Text style={styles.sectionLabel}>{candidate.title}</Text>
   <Details label="Review the form and its examples">{candidate.fields.map(f=><Text key={f.id} style={styles.cardBody}>{f.label+(f.required?' — required':' — optional')+(f.type==='number'?' • '+f.min+' to '+f.max+' '+f.unit:f.type==='text'?' • up to '+f.maxLength+' characters':f.type==='choice'?' • '+f.options.map(o=>o.label).join(', '):' • yes/no')+conditionLabel(f)}</Text>)}{candidate.calculation?.outputs.map(o=><Text key={o.id} style={styles.cardBody}>{o.label+': '+explainCalculation(o.expression,candidate.calculation.inputs)}</Text>)}{candidate.cases.map(c=><Text key={c.label} style={styles.cardBody}>{c.label+': '+(c.valid?'passes':'needs correction')+(c.outputs?' • '+JSON.stringify(c.outputs):'')}</Text>)}</Details>
   <PrivateFormFieldsEditor spec={candidate} context={context} isCurrent={isCurrent} hasUndo={history.length>0} onPrepared={prepared} onUndo={()=>{if(isCurrent?.()!==true||!history.length)return false;setCandidate(history[history.length-1].spec);setValues(history[history.length-1].values);setHistory(old=>old.slice(0,-1));setAccepted(false);setResult(null);reviewed.current='';onApprovedRule(null);return true;}}/>
   <Details label="Refine the questions and fixed choices">{candidate.fields.map(f=><React.Fragment key={f.id}><Field label={'Question wording: '+f.label} value={f.label} maxLength={80} onChangeText={value=>edit(next=>{next.fields.find(x=>x.id===f.id).label=value;return next;})}/>{f.type==='choice'?f.options.map(o=><Field key={o.value} label={'Choice wording: '+o.label} value={o.label} maxLength={80} onChangeText={value=>edit(next=>{next.fields.find(x=>x.id===f.id).options.find(x=>x.value===o.value).label=value;return next;})}/>):null}</React.Fragment>)}</Details>
   <Button label="Review this exact form draft" onPress={()=>{if(isCurrent?.()!==true)return false;const r=validatePrivateForm(candidate);if(!r.ok){setNotice(r.reason);return false;}if(stableJson(r.spec.scope)!==stableJson(calculationScope(context)))return false;reviewed.current=stableJson(r.spec);setNotice('The exact questions, choices, calculation rules and examples are ready for approval.');return true;}}/>
   <PrivateFormPreview spec={candidate} values={values} setValues={change=>{setValues(change);setResult(null);}} result={result} onEvaluate={()=>{if(!current())return false;const r=evaluatePrivateForm(candidate,values);setResult(r);return r.ok;}}/>
   <Button label="Accept this exact form for private saving" disabled={accepted} onPress={()=>{if(!current())return false;setAccepted(true);onApprovedRule(candidate);setNotice('Accepted in this session. Use the separate private save, then independently reopen it.');return true;}}/>
   <Button label="Discard this private form" onPress={()=>{setCandidate(null);setResult(null);setAccepted(false);onApprovedRule(null);}}/>
  </>:null}
  {notice?<Text style={styles.cardBody}>{notice}</Text>:null}
 </Card></Details>;
}
