import React from 'react';
import {Text,Alert} from 'react-native';
import {Card,Button,Field} from '../components/ui';
import {styles} from '../theme/styles';
import {serviceEnquiryContext,prepareAppEnquiryJourney} from '../core/appServiceEnquiry.mjs';
import {ENQUIRY_REQUIREMENTS} from '../core/customerEnquiryRequirements.mjs';
import {stableJson} from '../core/stableJson.mjs';
// One original coordinated proposal; the parent Studio owns save, receipts and Undo.
export function AppEnquiryJourneyEditor({businessId,ownerId,app,catalog,busy=false,onPreview,onDraftChange,Surface}){
 const [rows,setRows]=React.useState([]),[baseline,setBaseline]=React.useState(null),[heading,setHeading]=React.useState(''),[notice,setNotice]=React.useState('');
 const initial=React.useRef([ownerId,businessId,app?.id]);
 const visible=initial.current[0]===ownerId&&initial.current[1]===businessId&&initial.current[2]===app?.id;
 const decision=React.useRef(null),live=React.useRef(null),epoch=React.useRef(0),alive=React.useRef(true);
 React.useEffect(()=>{alive.current=true;return()=>{alive.current=false;};},[]);
 const context=serviceEnquiryContext({businessId,app,catalog}),stamp=stableJson([ownerId,businessId,context?.source,catalog]);
 live.current={stamp,busy,rows,heading,app,businessId,ownerId,catalog};
 const current=()=>alive.current&&visible&&!!ownerId&&!live.current.busy&&live.current.stamp===stamp&&stableJson([live.current.ownerId,live.current.businessId,serviceEnquiryContext(live.current)?.source,live.current.catalog])===stamp;
 const change=run=>{if(!current())return false;epoch.current++;onPreview?.(null);onDraftChange?.(true);run();return true;};
 const capture=epoch.current,stale=baseline!==null&&baseline!==stamp;
 const choose=row=>{if(!current()||stale)return false;if(rows.some(r=>r.id===row.id)){const ticket={},e=epoch.current;decision.current=ticket;let used=false;Alert.alert('Keep this service wording?','Removing this service from the unsaved review discards only its current proposed edits. Saved app services stay unchanged.',[{text:'Keep my wording',style:'cancel',onPress:()=>{used=true;}},{text:'Remove unsaved service',onPress:()=>{if(used||decision.current!==ticket||!current()||epoch.current!==e)return false;used=true;return change(()=>setRows(old=>old.filter(r=>r.id!==row.id)));}}]);return false;}return change(()=>{setBaseline(stamp);setHeading(heading||context.config.modules.find(m=>m.key==='services')?.label||'Services');setRows(old=>old.some(r=>r.id===row.id)?old.filter(r=>r.id!==row.id):old.length<6?[...old,{id:row.id,fields:{name:row.name,description:row.description||'',...Object.fromEntries(['category','priceLabel','durationLabel'].filter(k=>Object.hasOwn(row,k)).map(k=>[k,row[k]]))},label:context.config.presentation?.servicePresentation?.[row.id]?.enquiryLabel||'Ask about this service'}]:old);});};
 const plan=!stale&&rows.length?prepareAppEnquiryJourney({businessId,app,catalog,rows,navigationLabel:heading}):null;
 if(!visible||!ownerId||!context)return null;
 return <Card eyebrow="Guided App Builder" title="Review the complete service enquiry journey" body="Configure several existing services together, compare the customer view, then approve one Studio change. Original required customer fields stay unchanged.">
  {context.services.map(row=><Button key={row.id} label={(rows.some(r=>r.id===row.id)?'Remove from unsaved review: ':'Include service: ')+row.name} disabled={busy||stale||rows.length>=6&&!rows.some(r=>r.id===row.id)} onPress={()=>choose(row)}/>)}
  {rows.length?<>
   {stale?<Text style={styles.cardBody}>The app source changed. Your words are kept; clear this unsaved review before selecting current services.</Text>:null}
   <Field label="Services navigation label" value={heading} maxLength={36} editable={!busy&&!stale} onChangeText={value=>change(()=>setHeading(value))}/>
   {rows.map(row=><React.Fragment key={row.id}>
    <Field label={'Service heading: '+context.services.find(s=>s.id===row.id)?.name} value={row.fields.name} editable={!busy&&!stale} onChangeText={value=>change(()=>setRows(old=>old.map(r=>r.id===row.id?{...r,fields:{...r.fields,name:value}}:r)))}/>
    <Field label={'Enquiry information: '+context.services.find(s=>s.id===row.id)?.name} value={row.fields.description} multiline editable={!busy&&!stale} onChangeText={value=>change(()=>setRows(old=>old.map(r=>r.id===row.id?{...r,fields:{...r.fields,description:value}}:r)))}/>
    {[['category','Service category',80],['priceLabel','Informational price wording',120],['durationLabel','Informational duration wording',80]].map(([key,title,max])=><Field key={key} label={title+': '+context.services.find(s=>s.id===row.id)?.name} value={row.fields[key]||''} maxLength={max} editable={!busy&&!stale} onChangeText={value=>change(()=>setRows(old=>old.map(r=>r.id===row.id?{...r,fields:{...r.fields,[key]:value}}:r)))}/>)}
    {['Ask about this service','Request a quote','Request more information','Contact us'].map(label=><Button key={label} label={row.fields.name+': '+label+(row.label===label?' · selected':'')} disabled={busy||stale} onPress={()=>change(()=>setRows(old=>old.map(r=>r.id===row.id?{...r,label}:r)))}/>)}
   </React.Fragment>)}
   <Text style={styles.cardBody}>Customers provide their name, email or phone, and a message. The original optional requirements below are customer-entered preferences; they do not confirm timing, prices or bookings.</Text>
   {ENQUIRY_REQUIREMENTS.map(field=><Text key={field.key} style={styles.cardBody}>{field.label+' — up to '+field.max+' characters'}</Text>)}
   {plan?.ok&&Surface?<Surface config={plan.nextConfig} interactive={false} catalogueContextKey={'enquiry-journey:'+app.id+':'+app.draft_revision}/>:null}
   {!plan?.ok&&plan?.reason?<Text style={styles.cardBody}>{plan.reason}</Text>:null}
   <Button label="Review complete enquiry journey in Studio" disabled={busy||stale||!plan?.ok} onPress={()=>{if(!current()||capture!==epoch.current||stale||!plan?.ok)return false;setNotice('Prepared for Studio review only. Nothing is saved or sent.');return onPreview?.(plan)!==false;}}/>
  </>:null}
  {rows.length||baseline!==null?<Button label="Clear unsaved enquiry journey" disabled={busy} onPress={()=>{if(!current())return false;epoch.current++;setRows([]);setHeading('');setBaseline(null);setNotice('Unsaved review cleared. Saved services were not changed.');onPreview?.(null);onDraftChange?.(false);return true;}}/>:null}
  {notice?<Text style={styles.cardBody}>{notice}</Text>:null}
 </Card>;
}
