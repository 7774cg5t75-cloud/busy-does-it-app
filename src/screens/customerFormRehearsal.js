import React from 'react';
import {Text} from 'react-native';
import {Card,Button,Field,Details} from '../components/ui';
import {styles} from '../theme/styles';
import {PrivateFormPreview} from './privateFormPreview';
import {validatePublicFormProjection,publicFormStartingValues,validatePublicAnswers,createCustomerFormReview} from '../core/publicFormDisclosure.mjs';
import {stableJson} from '../core/stableJson.mjs';
export function CustomerFormRehearsal({projection,review,isCurrent,interest=null}){
 const scope=stableJson([projection?.id,projection?.revision,projection?.appId,projection?.appVersionId]),initial=React.useRef(scope),live=React.useRef(null);live.current={scope,isCurrent};const current=()=>initial.current===live.current.scope&&live.current.isCurrent?.()===true;
 const checked=validatePublicFormProjection(projection),[values,setValues]=React.useState(()=>checked.ok?publicFormStartingValues(projection):{}),[contact,setContact]=React.useState({name:'',email:'',phone:'',message:''}),[consent,setConsent]=React.useState(false),[result,setResult]=React.useState(null),[notice,setNotice]=React.useState(''),[busy,setBusy]=React.useState(false);
 const fingerprint=stableJson([projection,values,contact,consent,interest]),latest=React.useRef('');latest.current=fingerprint;
 if(!checked.ok||!current())return null;
 const view={...projection,calculation:projection.outputs.length?{outputs:projection.outputs}:null},change=fn=>{if(!current())return;setValues(fn);setResult(null);setNotice('Your values stay in this rehearsal. Review them again after changes.');};
 return <Card title={projection.title} body={projection.explanation}>
  <Text style={styles.cardBody}>Customer-safe rehearsal • nothing has been submitted.</Text>
  <PrivateFormPreview spec={view} values={values} setValues={change} customerRehearsal startingValues={publicFormStartingValues} result={result?.fingerprint===fingerprint?result.value:null} disabled={busy} onEvaluate={async()=>{
   if(busy||!current())return false;const valid=validatePublicAnswers(projection,values);if(!valid.valid){setResult({fingerprint,value:valid});setNotice(valid.reason||'Please check the highlighted answers.');return false;}setBusy(true);const stamp=fingerprint;
   try{const api=createCustomerFormReview({projection,review,isCurrent:()=>current()&&latest.current===stamp}),r=await api.prepare({values,contact,consent,interest});if(current()&&latest.current===stamp){setResult({fingerprint:stamp,value:r});setNotice(r.ok?'Your answers are prepared for review. No request or customer record has been created.':r.reason);}return r.ok===true;}finally{if(current())setBusy(false);}
  }}/>
  {['name','email','phone','message'].map(k=><Field key={k} label={k==='message'?'Your question':k==='name'?'Your name':k==='email'?'Your email':'Your phone (optional)'} value={contact[k]} maxLength={k==='message'?1000:k==='phone'?80:160} editable={!busy} onChangeText={v=>{if(current()){setContact(old=>({...old,[k]:v}));setResult(null);}}}/>)}
  <Details label="How this information would be used"><Text style={styles.cardBody}>{projection.privacy.notice}</Text><Text style={styles.cardBody}>{'Reviewed enquiry retention policy: '+projection.privacy.retentionDays+' days. Actual retention enforcement is a separate activation requirement.'}</Text></Details>
  <Button label={projection.privacy.consentText+(consent?' ✓':'')} disabled={busy} onPress={()=>{if(current()){setConsent(!consent);setResult(null);}}}/>
  {result?.fingerprint===fingerprint&&result.value.ok?<Details label="Review your prepared enquiry">{result.value.source?<Text style={styles.cardBody}>{'About: '+result.value.source.name+(result.value.source.optionLabel?' — '+result.value.source.optionLabel:'')}</Text>:null}{projection.fields.filter(f=>Object.hasOwn(result.value.answers,f.id)).map(f=><Text key={f.id} selectable style={styles.cardBody}>{f.label+': '+(f.type==='choice'?f.options.find(o=>o.value===result.value.answers[f.id])?.label:String(result.value.answers[f.id]))}</Text>)}<Text selectable style={styles.cardBody}>{Object.values(result.value.contact).filter(Boolean).join('\n')}</Text><Text style={styles.cardBody}>Review prepared. Submission, receipt, booking and payment remain unavailable in this customer-style rehearsal.</Text></Details>:null}
  {notice?<Text accessibilityLiveRegion="polite" style={styles.cardBody}>{notice}</Text>:null}
 </Card>;
}
