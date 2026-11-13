import React from 'react';
import {Text} from 'react-native';
import {Button,Card,Details,Field} from '../components/ui';
import {styles} from '../theme/styles';
import {createPrivateFormEnquiryPreparation} from '../core/privateFormEnquiry.mjs';
import {stableJson} from '../core/stableJson.mjs';
// Original private screen -> original enquiry preparation, deliberately no writer.
export function PrivateFormEnquiryPreview({context,isCurrent,screens,artifacts,integrity,opened,values,feed=null,cache=null}){
 const scope=stableJson([context.scope,opened.placement.record?.digest,opened.screenId,opened.artifact.reference]),live=React.useRef(null);live.current={context,isCurrent,scope};
 const current=()=>live.current.scope===scope&&live.current.isCurrent?.()===true;
 const key=opened.key+':enquiry',stored=cache?.[key],initial=React.useRef(scope);
 const [contact,setContact]=React.useState(stored?.contact||{name:'',email:'',phone:'',message:''}),[selection,setSelection]=React.useState(stored?.selection||null),[review,setReview]=React.useState(null),[prepared,setPrepared]=React.useState(null),[notice,setNotice]=React.useState(''),[busy,setBusy]=React.useState(false);
 const api=React.useRef(null);if(!api.current)api.current=createPrivateFormEnquiryPreparation({getCurrent:()=>live.current.context,isCurrent:current,screens,artifacts,integrity});
 const fingerprint=stableJson([scope,values,contact,selection,feed]),latest=React.useRef('');latest.current=fingerprint;
 const app=context.anchor.project,choices=app.draft_config.publicProfile?.services||[],records=feed?.businessId===context.scope.businessId?feed.records||[]:[];
 const run=async fn=>{if(busy||!current())return false;setBusy(true);try{return await fn();}catch{if(current())setNotice('Preparation could not be checked. Your answers are kept; nothing was sent.');return false;}finally{if(current())setBusy(false);}};
 const change=(field,value)=>{if(!current())return;setContact(old=>{const next={...old,[field]:value};if(cache)cache[key]={contact:next,selection};return next;});setReview(null);setPrepared(null);};
 const select=value=>{if(!current())return;setSelection(value);if(cache)cache[key]={contact,selection:value};setReview(null);setPrepared(null);};
 if(initial.current!==scope||!current()||opened.artifact.artifact.spec.kind!=='private-form')return null;
 return <Card title="Prepare an example customer enquiry" body="Private rehearsal using fictional details only. Review the form answers and contact details together. This does not submit a request or create a customer.">
  <Details label="What is this enquiry about?">
   <Button label="General enquiry about this app" onPress={()=>select(null)}/>
   {choices.map(s=><Button key={s.id} label={'Ask about '+s.name} onPress={()=>select({kind:'service',serviceId:s.id,appRevision:app.draft_revision})}/>)}
   {records.filter(r=>['product','event'].includes(r.kind)).map(r=><React.Fragment key={r.id}><Button label={'Ask about '+r.data.name} onPress={()=>select({kind:'listing',recordId:r.id,revision:r.revision})}/>{r.kind==='product'?(r.data.variants||[]).map(v=><Button key={v.id} label={r.data.name+' — '+v.label} onPress={()=>select({kind:'listing',recordId:r.id,revision:r.revision,variantId:v.id})}/>):null}</React.Fragment>)}
  </Details>
  {['name','email','phone','message'].map(k=><Field key={k} label={k==='name'?'Example customer name':k==='message'?'Their own question':k==='email'?'Example email':'Example phone (optional)'} value={contact[k]} maxLength={k==='message'?1000:160} editable={!busy} onChangeText={v=>change(k,v)}/>)}
  <Button label="Review these answers as an enquiry" disabled={busy} onPress={()=>run(async()=>{const f=fingerprint,r=await api.current.review({screenId:opened.screenId,expected:opened.placement,values,customer:contact,catalog:context.anchor.catalog,feed,selection});if(current()&&latest.current===f){setReview(r.ok?{fingerprint:f,value:r}:null);setPrepared(null);setNotice(r.ok?'Review every active answer below. Inactive questions stay local and are excluded. Nothing was sent.':r.reason);}return r.ok;})}/>
  {review?.fingerprint===fingerprint?<><Text style={styles.sectionLabel}>{review.value.review.title}</Text>{review.value.review.fields.map(f=><Text key={f.id} style={styles.cardBody}>{f.label+': '+(f.type==='choice'?f.options.find(o=>o.value===review.value.review.answers[f.id])?.label:String(review.value.review.answers[f.id]))+(f.unit?' '+f.unit:'')}</Text>)}<Text selectable style={styles.cardBody}>{'Customer-supplied contact and wording:\n'+Object.entries(review.value.payload).filter(([k])=>['name','email','phone','service','message'].includes(k)).map(([k,v])=>k+': '+v).join('\n')}</Text>{review.value.review.outputs?<Text style={styles.cardBody}>{'Indicative calculated values, not customer assertions or commitments: '+JSON.stringify(review.value.review.outputs)}</Text>:null}<Button label="Prepare this reviewed example — do not send" disabled={busy} onPress={()=>run(async()=>{const f=fingerprint,r=await api.current.accept(review.value.ticket,{ownerApproved:true});if(current()&&latest.current===f){setPrepared(r.ok?{fingerprint:f,value:r}:null);setNotice(r.ok?'Example enquiry prepared locally. Public submission is disabled. No request, customer, booking or message was created.':r.reason);}return r.ok;})}/></>:null}
  {prepared?.fingerprint===fingerprint?<Details label="Prepared original enquiry and exact form context"><Text selectable style={styles.cardBody}>{JSON.stringify(prepared.value.payload,null,2)}</Text></Details>:null}
  {notice?<Text accessibilityLiveRegion="polite" style={styles.cardBody}>{notice}</Text>:null}
 </Card>;
}
