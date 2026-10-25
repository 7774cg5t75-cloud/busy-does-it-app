import React from 'react';
import {Text,View} from 'react-native';
import {Button,Card,Field} from '../components/ui';
import {styles} from '../theme/styles';
import {serviceEnquiryContext,approvedServiceChoices,prepareServiceEnquiry} from '../core/appServiceEnquiry.mjs';
import {stableJson} from '../core/stableJson.mjs';
import {BusinessAppCustomerRequestFields} from './businessAppCustomerRequestFields';
import {emptyEnquiryRequirements,prepareCustomerEnquiry} from '../core/customerEnquiryRequirements.mjs';
import {validateNativeGuestRequest} from '../../standalone/template/nativeCustomerActions.mjs';
// Unsaved presentation only. Original Studio owns approval, CAS, save/readback and Undo.
export function AppServiceEnquiryEditor({businessId,ownerId,app,catalog,approvedProfile,Surface,busy=false,onPreview,onNotice,onDraftChange}){
 const [open,setOpen]=React.useState(false),[selected,setSelected]=React.useState(null),[name,setName]=React.useState(''),[description,setDescription]=React.useState(''),[label,setLabel]=React.useState('Ask about this service'),[category,setCategory]=React.useState(''),[price,setPrice]=React.useState(''),[duration,setDuration]=React.useState(''),[baseline,setBaseline]=React.useState(''),[pending,setPending]=React.useState(null),[showExample,setShowExample]=React.useState(false),[example,setExample]=React.useState({name:'',email:'',phone:'',message:''}),[requirements,setRequirements]=React.useState(emptyEnquiryRequirements),[payload,setPayload]=React.useState(null);
 const alive=React.useRef(true),epoch=React.useRef(0),pendingRef=React.useRef(null),selection=React.useRef(null),live=React.useRef(null),initial=React.useRef([ownerId,businessId,app?.id]);
 React.useEffect(()=>{alive.current=true;return()=>{alive.current=false;};},[]);
 const context=serviceEnquiryContext({businessId,app,catalog}),stamp=stableJson([context?.source||null,approvedProfile||null,catalog||null]);
 live.current={app,businessId,ownerId,busy,stamp};selection.current=selected;
 const visible=initial.current[0]===ownerId&&initial.current[1]===businessId&&initial.current[2]===app?.id;
 const current=()=>alive.current&&visible&&live.current.app===app&&live.current.businessId===businessId&&live.current.ownerId===ownerId&&!live.current.busy&&live.current.stamp===stamp&&stableJson([serviceEnquiryContext({businessId,app,catalog})?.source||null,approvedProfile||null,catalog||null])===stamp;
 const captured=epoch.current,dirty=selected&&JSON.stringify([name,description,label,category,price,duration])!==baseline,stale=selected?.stamp!==stamp;
 const mark=()=>{epoch.current++;pendingRef.current=null;setPending(null);setPayload(null);onPreview?.(null);onDraftChange?.(true);};
 const edit=setter=>value=>{if(!current()||selection.current!==selected)return false;mark();setter(value);return true;};
 const choose=(row,importApproved=false)=>{
  if(!current())return false;const e=epoch.current;
  const run=()=>{if(!current()||epoch.current!==e)return false;epoch.current++;const next={id:row.id,importApproved,stamp};selection.current=next;setSelected(next);setName(row.name);setDescription(row.description||'');setCategory(row.category||'');setPrice(row.priceLabel||'');setDuration(row.durationLabel||'');const button=app.draft_config.presentation?.servicePresentation?.[row.id]?.enquiryLabel||'Ask about this service';setLabel(button);setBaseline(JSON.stringify([row.name,row.description||'',button,row.category||'',row.priceLabel||'',row.durationLabel||'']));setPayload(null);setShowExample(false);onPreview?.(null);onDraftChange?.(false);return true;};
  if(dirty){const ticket={run,e};pendingRef.current=ticket;setPending(ticket);return false;}return run();
 };
 const plan=selected&&!stale?prepareServiceEnquiry({businessId,app,catalog,approvedProfile,serviceId:selected.id,fields:{name,description,category,priceLabel:price,durationLabel:duration},label,importApproved:selected.importApproved}):null;
 const previewConfig=plan?.ok?plan.nextConfig:app?.draft_config;
 const prepared=prepareCustomerEnquiry({message:example.message,requirements}),ready=prepared.ok?validateNativeGuestRequest('enquiry',{...example,service:name,message:prepared.message}):prepared;
 const reviewExample=()=>{if(!current()||captured!==epoch.current||stale||!ready.ok)return false;setPayload(ready.payload);return true;};
 const changeExample=field=>value=>{if(current()){epoch.current++;setPayload(null);setExample(old=>({...old,[field]:value}));}};
 if(!visible||!ownerId)return null;
 return <Card eyebrow="Connected App Builder" title="Configure a service and its enquiry journey" body="Use existing service information, review exact copy and enquiry wording, then compare and save through Studio. Custom form fields, booking confirmation and publication are not added here.">
  <Button label={open?'Hide service-and-enquiry setup':'Set up a service enquiry'} disabled={busy||!context} onPress={()=>{if(current())setOpen(v=>!v);}}/>
  {!context?<Text style={styles.cardBody}>This requires one supported enabled Services module and an enabled Enquiry module from the original capability catalogue. Nothing was enabled or invented.</Text>:null}
  {open&&context?<>
   {context.services.map(row=>row.id?<Button key={row.id} label={'Configure service enquiry: '+row.name} disabled={busy} onPress={()=>choose(row)}/>:null)}
   {approvedServiceChoices(approvedProfile,businessId).filter(row=>!context.services.some(s=>s.id===row.id||s.name.trim().toLocaleLowerCase('en')===row.name.trim().toLocaleLowerCase('en'))).map(row=><Button key={row.id} label={'Start with approved service: '+row.name} disabled={busy} onPress={()=>choose(row,true)}/>)}
   {pending?<View><Text style={styles.cardBody}>Your current service wording is unsaved.</Text><Button label="Keep this service wording" onPress={()=>{if(current()&&pendingRef.current===pending){pendingRef.current=null;setPending(null);}}}/><Button label="Discard this wording and choose service" onPress={()=>{if(!current()||pendingRef.current!==pending||epoch.current!==pending.e)return false;pendingRef.current=null;setPending(null);return pending.run();}}/></View>:null}
   {selected?<>
    {stale?<Text style={styles.cardBody}>The app or approved facts changed. Your inputs are kept. Re-select the exact current service after reviewing or discarding this wording; saving is unavailable.</Text>:null}
    <Field label="Service heading" value={name} editable={!busy} onChangeText={edit(setName)}/>
    <Field label="Service enquiry description" value={description} multiline editable={!busy} onChangeText={edit(setDescription)}/>
    <Field label="Service category for this enquiry (optional)" value={category} maxLength={80} editable={!busy} onChangeText={edit(setCategory)}/>
    <Field label="Informational price wording (optional)" value={price} maxLength={120} editable={!busy} onChangeText={edit(setPrice)}/>
    <Field label="Informational duration wording (optional)" value={duration} maxLength={80} editable={!busy} onChangeText={edit(setDuration)}/>
    <Text style={styles.cardBody}>These are your informational service labels. Busy does not infer quotation totals, VAT, checkout prices, availability or an appointment duration. Blank labels deliberately clear only this service's optional wording.</Text>
    {['Ask about this service','Request a quote','Request more information','Contact us'].map(value=><Button key={value} label={'Enquiry button: '+value+(label===value?' · selected':'')} disabled={busy} onPress={()=>edit(setLabel)(value)}/>)}
    <Text style={styles.cardBody}>The original enquiry requires a name, email or phone, and a message. Optional topic, quantity, timing, location and requirements use the original bounded contract. They are not prices, availability or bookings.</Text>
    <Button label="Preview service and enquiry configuration in Studio" disabled={busy||stale||!!pending||!plan?.ok} onPress={()=>{if(!current()||captured!==epoch.current||pendingRef.current||!plan?.ok)return false;return onPreview?.(plan)!==false;}}/>
    {!plan?.ok&&plan?.reason?<Text style={styles.cardBody}>{plan.reason}</Text>:null}
    {Surface?<Surface config={previewConfig} interactive={false} catalogueContextKey={'owner-service-enquiry:'+app.id+':'+app.draft_revision}/>:null}
    <Button label={showExample?'Hide example enquiry fields':'Try the original enquiry fields — no sending'} disabled={busy||stale} onPress={()=>{if(current())setShowExample(v=>!v);}}/>
    {showExample?<BusinessAppCustomerRequestFields previewOnly s={{ownerSession:{userId:ownerId},miniAppsAction:''}} form={{enabled:new Set(['enquiry']),requestKind:'enquiry',name:example.name,email:example.email,phone:example.phone,service:name,message:example.message,requirements,setRequirements:update=>{if(current()){epoch.current++;setPayload(null);setRequirements(update);}},serviceChoices:previewConfig.publicProfile.services,preferredDates:[],bookingReady:{ok:false},enquiryReady:ready,setName:changeExample('name'),setEmail:changeExample('email'),setPhone:changeExample('phone'),setMessage:changeExample('message'),reviewExample}}/>:null}
    {payload?<Text selectable style={styles.cardBody}>{'Example original payload only — no request, receipt or send:\n'+JSON.stringify(payload,null,2)}</Text>:null}
   </>:null}
  </>:null}
 </Card>;
}
