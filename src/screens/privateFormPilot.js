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
export function PrivateFormPilot({context,isCurrent,onApprovedRule,onReopenRequest=null}){
 const [goal,setGoal]=React.useState(''),[candidate,setCandidate]=React.useState(null),[values,setValues]=React.useState({}),[result,setResult]=React.useState(null),[notice,setNotice]=React.useState(''),[accepted,setAccepted]=React.useState(false);
 const live=React.useRef(null);live.current={context,isCurrent};const reviewed=React.useRef('');
 React.useEffect(()=>{if(onReopenRequest){setCandidate(onReopenRequest);setGoal(onReopenRequest.purpose);setValues(privateFormDefaults(onReopenRequest));setAccepted(false);setResult(null);reviewed.current='';onApprovedRule(null);setNotice('Saved form reopened as a new draft. Review it again before saving a successor.');}},[onReopenRequest]);
 const edit=fn=>{setCandidate(old=>fn(JSON.parse(stableJson(old))));setAccepted(false);setResult(null);reviewed.current='';onApprovedRule(null);};
 const current=()=>live.current.isCurrent?.()===true&&candidate&&stableJson(candidate.scope)===stableJson(calculationScope(live.current.context))&&reviewed.current===stableJson(candidate);
 return <Details label="Private forms made for your business"><Card title="Prepare a useful private form" body="Review its questions, fixed options and local checks. This does not collect or submit customer information.">
  <Field label="What should this private form help you check?" value={goal} maxLength={240} onChangeText={v=>{setGoal(v);setCandidate(null);setAccepted(false);onApprovedRule(null);}}/>
  <Button label="Prepare my private form" onPress={()=>{if(isCurrent?.()!==true)return false;const r=proposePrivateForm(context,goal);setAccepted(false);onApprovedRule(null);setResult(null);if(!r.ok){setNotice(r.reason);return false;}reviewed.current=stableJson(r.spec);setCandidate(r.spec);setValues(privateFormDefaults(r.spec));setNotice('Review these questions and examples. No external actions are available.');return true;}}/>
  {candidate?<>
   <Text style={styles.sectionLabel}>{candidate.title}</Text>
   <Details label="Review the form and its examples">{candidate.fields.map(f=><Text key={f.id} style={styles.cardBody}>{f.label+(f.required?' — required':' — optional')+(f.type==='number'?' • '+f.min+' to '+f.max+' '+f.unit:f.type==='text'?' • up to '+f.maxLength+' characters':f.type==='choice'?' • '+f.options.map(o=>o.label).join(', '):' • yes/no')+(f.when?' • shown when '+candidate.fields.find(p=>p.id===f.when.field).label+' is '+f.when.equals:'')}</Text>)}{candidate.calculation?.outputs.map(o=><Text key={o.id} style={styles.cardBody}>{o.label+': '+explainCalculation(o.expression,candidate.calculation.inputs)}</Text>)}{candidate.cases.map(c=><Text key={c.label} style={styles.cardBody}>{c.label+': '+(c.valid?'passes':'needs correction')+(c.outputs?' • '+JSON.stringify(c.outputs):'')}</Text>)}</Details>
   <Details label="Refine the questions and fixed choices">{candidate.fields.map(f=><React.Fragment key={f.id}><Field label={'Question wording: '+f.label} value={f.label} maxLength={80} onChangeText={value=>edit(next=>{next.fields.find(x=>x.id===f.id).label=value;return next;})}/>{f.type==='choice'?f.options.map(o=><Field key={o.value} label={'Choice wording: '+o.label} value={o.label} maxLength={80} onChangeText={value=>edit(next=>{next.fields.find(x=>x.id===f.id).options.find(x=>x.value===o.value).label=value;return next;})}/>):null}</React.Fragment>)}</Details>
   <Button label="Review this exact form draft" onPress={()=>{if(isCurrent?.()!==true)return false;const r=validatePrivateForm(candidate);if(!r.ok){setNotice(r.reason);return false;}if(stableJson(r.spec.scope)!==stableJson(calculationScope(context)))return false;reviewed.current=stableJson(r.spec);setNotice('The exact questions, choices, calculation rules and examples are ready for approval.');return true;}}/>
   <PrivateFormPreview spec={candidate} values={values} setValues={change=>{setValues(change);setResult(null);}} result={result} onEvaluate={()=>{if(!current())return false;const r=evaluatePrivateForm(candidate,values);setResult(r);return r.ok;}}/>
   <Button label="Accept this exact form for private saving" disabled={accepted} onPress={()=>{if(!current())return false;setAccepted(true);onApprovedRule(candidate);setNotice('Accepted in this session. Use the separate private save, then independently reopen it.');return true;}}/>
   <Button label="Discard this private form" onPress={()=>{setCandidate(null);setResult(null);setAccepted(false);onApprovedRule(null);}}/>
  </>:null}
  {notice?<Text style={styles.cardBody}>{notice}</Text>:null}
 </Card></Details>;
}
