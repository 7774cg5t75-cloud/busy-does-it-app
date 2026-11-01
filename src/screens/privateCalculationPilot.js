import React from 'react';
import {Text,View} from 'react-native';
import {Card,Button,Field,Details} from '../components/ui';
import {styles} from '../theme/styles';
import {createPrivateCalculationPilot,proposePrivateCalculation,revisePrivateCalculation} from '../core/privateCalculationPilot.mjs';
import {explainCalculation} from '../core/privateCalculation.mjs';
export function PrivateCalculationPilot({enabled=false,context,isCurrent,initialGoal='',onRetainRequirement,onApprovedRule,onReopenRequest=null,onDraftChange=()=>{}}){
 const [goal,setGoal]=React.useState(initialGoal.slice(0,240)),[candidate,setCandidate]=React.useState(null),[review,setReview]=React.useState(null),[accepted,setAccepted]=React.useState(false),[values,setValues]=React.useState({}),[result,setResult]=React.useState(null),[notice,setNotice]=React.useState(''),[correction,setCorrection]=React.useState('');
 const authored=React.useRef(false);React.useEffect(()=>{if(!authored.current&&!candidate)setGoal(initialGoal.slice(0,240));},[initialGoal,candidate]);
 const live=React.useRef(null);live.current={context,isCurrent};const session=React.useRef(null);if(!session.current)session.current=createPrivateCalculationPilot({getCurrent:()=>live.current.context,isCurrent:()=>live.current.isCurrent?.()===true});
 React.useEffect(()=>{if(onReopenRequest){authored.current=true;setGoal(onReopenRequest.purpose);setCandidate({ok:true,spec:onReopenRequest});setValues(Object.fromEntries(onReopenRequest.inputs.map(f=>[f.id,f.type==='boolean'?f.default:String(f.default)])));setReview(null);setAccepted(false);setResult(null);onApprovedRule?.(null);}},[onReopenRequest]);
 const reset=()=>{onApprovedRule?.(null);if(review)session.current.discard(review.ticket);setReview(null);setAccepted(false);setResult(null);onDraftChange(true);};
 const reviewCurrent=!review||['ownerId','businessId','projectId','sourceRevision'].every(k=>review.spec.scope[k]===context?.scope?.[k])&&review.pilotEpoch===context?.pilotEpoch;
 const active=()=>live.current.isCurrent?.()===true&&live.current.context?.ok===true;
 const parse=()=>{const data={};for(const f of candidate.spec.inputs){if(f.type==='boolean')data[f.id]=values[f.id]===true;else{const v=values[f.id];if(typeof v!=='string'||!/^[-]?\d+(?:\.\d{1,6})?$/.test(v)||v.length>32)return null;data[f.id]=Number(v);}}return data;};
 if(enabled!==true)return null;
 return <Details label="Private calculation experiment">
  <Card title="Try a calculation made for your business" body="A private, offline experiment. It calculates numbers only; it cannot order, quote, promise capacity, manage stock, send messages or change your app.">
   <Field label="What would you like to calculate?" value={goal} maxLength={240} onChangeText={v=>{authored.current=true;reset();setGoal(v);setCandidate(null);}}/>
   <Button label="Example: plan catering portions" onPress={()=>{authored.current=true;reset();setGoal('Create a private portions planner for guests, rolls and bowls');setCandidate(null);}}/>
   <Button label="Example: plan garden materials" onPress={()=>{authored.current=true;reset();setGoal('Create a private materials planner for area and coverage');setCandidate(null);}}/>
   <Button label="Prepare my private calculation" onPress={()=>{if(!active())return false;authored.current=true;reset();const proposed=proposePrivateCalculation(live.current.context,goal);if(!proposed.ok){setNotice(proposed.reason);return false;}setCandidate(proposed);setValues(Object.fromEntries(proposed.spec.inputs.map(f=>[f.id,f.type==='boolean'?f.default:String(f.default)])));setNotice('Review these inputs and rules. The examples are fictional arithmetic checks, not business guarantees.');return true;}}/>
   {candidate?<>
    <Text style={styles.sectionLabel}>{candidate.spec.title}</Text>
    {!reviewCurrent?<Text style={styles.cardBody}>Your app or account changed. Your test values are kept; prepare a fresh review before calculating again.</Text>:null}
    {candidate.spec.inputs.some(f=>f.id==='coverage')?<Button label={candidate.spec.inputs.some(f=>f.id==='spare')?'Use area and coverage only':'Include an extra-material allowance'} onPress={()=>{if(!active())return false;reset();const next=proposePrivateCalculation(live.current.context,goal,{includeAllowance:!candidate.spec.inputs.some(f=>f.id==='spare')});if(!next.ok){setNotice(next.reason);return false;}setCandidate(next);setValues(Object.fromEntries(next.spec.inputs.map(f=>[f.id,String(f.default)])));setNotice('The calculation rule changed. Review its new examples before accepting.');return true;}}/>:null}
    <Field label="Change one calculation assumption" value={correction} maxLength={160} onChangeText={setCorrection}/>
    <Button label="Prepare revised calculation rules" onPress={()=>{if(!active())return false;const changed=revisePrivateCalculation(candidate.spec,correction,live.current.context);if(!changed.ok){setNotice(changed.reason);return false;}reset();setCandidate(changed);setValues(Object.fromEntries(changed.spec.inputs.map(f=>[f.id,f.type==='boolean'?f.default:String(f.default)])));setNotice('A new rule draft is prepared. Review its examples before accepting; saved versions are unchanged.');return true;}}/>
    <Text style={styles.cardBody}>What it needs</Text>
    {candidate.spec.inputs.map(f=><Text key={f.id} style={styles.cardBody}>{f.label+(f.type==='number'?' ('+f.unit+'), '+f.min+' to '+f.max:' — yes or no')}</Text>)}
    <Details label="How the calculation works">{candidate.spec.outputs.map(o=><Text key={o.id} style={styles.cardBody}>{o.label+': '+explainCalculation(o.expression,candidate.spec.inputs)+(o.type==='number'?' — '+o.unit:'')}</Text>)}</Details>
    <Text style={styles.cardBody}>Amounts use six decimal places internally, with half values rounded away from zero. These are planning figures, not professional, food-safety, engineering or financial advice.</Text>
    <Button label="Check the examples and review" onPress={()=>{if(!active())return false;reset();const r=session.current.review(candidate.spec);setReview(r.ok?{...r,pilotEpoch:context.pilotEpoch}:null);setNotice(r.ok?'Each fictional example matches its stated expected result. Review the rules, then accept for this private session.':r.reason);return r.ok;}}/>
    {review?<>
     <Details label="Verified fictional examples">{review.examples.map((sample,i)=><View key={i}><Text style={styles.cardBody}>{sample.label}</Text>{candidate.spec.outputs.map(o=><Text key={o.id} style={styles.cardBody}>{o.label+': expected '+sample.expected[o.id]+', calculated '+sample.actual[o.id]}</Text>)}</View>)}</Details>
     <Button label="Accept for this private experiment" disabled={accepted} onPress={()=>{if(!active())return false;const r=session.current.accept(review.ticket,{ownerApproved:true,spec:candidate.spec});setAccepted(r.ok);if(r.ok)onApprovedRule?.(candidate.spec);setNotice(r.ok?'Accepted in this session only. You can now try values; no rules were stored or published.':r.reason);return r.ok;}}/>
    </>:null}
    {accepted&&reviewCurrent&&active()?<>
     {candidate.spec.inputs.map(f=>f.type==='number'?<Field key={f.id} label={f.label+' ('+f.unit+')'} value={values[f.id]} maxLength={32} keyboardType="decimal-pad" onChangeText={v=>{setValues(old=>({...old,[f.id]:v}));setResult(null);}}/>:<Button key={f.id} label={f.label+': '+(values[f.id]?'Yes':'No')} onPress={()=>{setValues(old=>({...old,[f.id]:!old[f.id]}));setResult(null);}}/>)}
     <Button label="Calculate with these test values" onPress={()=>{if(!active())return false;const input=parse();if(!input){setResult(null);setNotice('Use complete numbers with up to six decimal places. Your values are kept.');return false;}const r=session.current.run(review.ticket,input);setResult(r.ok?r:null);setNotice(r.ok?'Calculated privately. Nothing was ordered, quoted, booked or saved.':r.reason);return r.ok;}}/>
     {result?candidate.spec.outputs.map(o=><Text key={o.id} style={styles.cardBody}>{o.label+': '+String(result.outputs[o.id])+(o.type==='number'?' '+o.unit:'')}</Text>):null}
    </>:null}
    {typeof onRetainRequirement==='function'?<Button label="Keep this request in my private app idea" onPress={()=>{if(!active())return false;const ok=onRetainRequirement(goal)===true;setNotice(ok?'Descriptive request prepared in your original app idea. Use its existing reviewed save. Calculation rules and results are not saved.':'Your current app idea needs review first.');return ok;}}/>:null}
   </>:null}
   <Button label="Discard private experiment" onPress={()=>{reset();setCandidate(null);setNotice('Private experiment discarded. Your saved app and original requirements are unchanged.');}}/>
   {notice?<Text accessibilityLiveRegion="polite" style={styles.cardBody}>{notice}</Text>:null}
   <Details label="Experiment limits"><Text style={styles.cardBody}>Finite interpreter, not a general code sandbox. No customer data, network, database, filesystem, provider, publication or payment connection. Accepted rules disappear when this session closes.</Text></Details>
  </Card>
 </Details>;
}
