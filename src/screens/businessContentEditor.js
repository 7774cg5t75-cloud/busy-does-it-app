import {prepareBusinessContentInstruction} from '../core/universalBuilderPlanV3210.mjs';
import React from 'react';
import {View,Text} from 'react-native';
import {Card,Button,Field} from '../components/ui';
import {styles} from '../theme/styles';
import {localEventInstant,validateBusinessContent,parseContentPrice,eventLocalFields,contentPrice,publicBusinessContent} from '../core/businessContentRecords.mjs';
function priceText(amount,currency){try{return String(amount/10**new Intl.NumberFormat('en',{style:'currency',currency}).resolvedOptions().maximumFractionDigits);}catch{return '';}}
function BusinessContentEditor({request,businessId,onCompose}){
 const [open,setOpen]=React.useState(false),[records,setRecords]=React.useState([]),[kind,setKind]=React.useState('product'),[id,setId]=React.useState('');
 const [form,setForm]=React.useState({}),[busy,setBusy]=React.useState(false),[notice,setNotice]=React.useState(''),[review,setReview]=React.useState(null),[images,setImages]=React.useState([]),[layout,setLayout]=React.useState('cards'),[featuredId,setFeaturedId]=React.useState(''),[words,setWords]=React.useState(''),[uncertain,setUncertain]=React.useState(false),[optionCurrencyApproved,setOptionCurrencyApproved]=React.useState(false);
 const live=React.useRef(null),pending=React.useRef(false),alive=React.useRef(true);live.current={businessId,id,form};
 React.useEffect(()=>{alive.current=true;return()=>{alive.current=false;};},[]);
 const current=records.find(r=>r.id===id),set=(key,value)=>{if(key==='currency')setOptionCurrencyApproved(false);setForm(x=>({...x,[key]:value}));setReview(null);};
 const select=row=>{setOptionCurrencyApproved(false);setKind(row.kind);setId(row.id);setForm({...row.draft,...row.kind==='event'?eventLocalFields(row.draft):{priceText:String(row.draft.amountMinor/10**new Intl.NumberFormat('en',{style:'currency',currency:row.draft.currency}).resolvedOptions().maximumFractionDigits)}});setReview(null);};
 const fresh=type=>{setOptionCurrencyApproved(false);setKind(type);setId(type+'_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,10));setForm(type==='product'?{name:'',description:'',category:'',image:null,status:'active',amountMinor:0,currency:'GBP',priceText:'',availability:'not_tracked'}:{name:'',description:'',category:'',image:null,status:'scheduled',startsAt:'',endsAt:'',timeZone:Intl.DateTimeFormat().resolvedOptions().timeZone||'UTC',location:'',onlineUrl:''});setReview(null);};
 async function run(action,payload={}){
  if(pending.current||action!=='content_list'&&uncertain||typeof request!=='function'){setNotice('Connect the supported business records service first.');return false;}
  const scope=live.current;pending.current=true;setBusy(true);setNotice('');
  try{
   const result=await request(action,payload);
   if(!alive.current||live.current.businessId!==scope.businessId)return false;
   if(result?.ok!==true||result.businessId!==businessId)throw Error('The record response did not match this business.');
   if(result.records){setRecords(result.records);setUncertain(false);}if(result.images)setImages(result.images);
   if(result.record)setRecords(old=>[...old.filter(r=>r.id!==result.record.id),result.record]);
   setNotice(action==='content_publish'?'Shared record approved. Public views use its approved revision when refreshed.':action==='content_list'?'Current business records loaded.':'Private record saved. Public information is unchanged.');setReview(null);return true;
  }catch(e){if(alive.current&&live.current.businessId===scope.businessId){if(action!=='content_list')setUncertain(true);setNotice((e?.message||'Record action failed')+' Reload before repeating an uncertain write.');}return false;}
  finally{pending.current=false;if(alive.current&&live.current.businessId===scope.businessId)setBusy(false);}
 }
 function prepare(){
  let data={...form,...form.variants?{variants:form.variants.map(v=>({...v}))}:{}};delete data.localDate;delete data.localStart;delete data.localEnd;delete data.localEndDate;delete data.priceText;delete data.variantPriceTexts;
  const changingOptionCurrency=kind==='product'&&current?.draft.variants?.length&&current.draft.currency!==form.currency;
  if(changingOptionCurrency&&(!optionCurrencyApproved||form.variants?.some(v=>!Object.hasOwn(form.variantPriceTexts||{},v.id)))){setNotice('Enter every option price in the new currency and confirm that review.');return;}
  if(kind==='product'&&data.variants){for(const variant of data.variants){const raw=form.variantPriceTexts?.[variant.id]??(variant.amountMinor===null?'':priceText(variant.amountMinor,form.currency));const price=parseContentPrice(raw,form.currency);if(!price.ok){setNotice('Review the option price: '+price.reason);return;}variant.amountMinor=price.amountMinor;}}
  if(kind==='product'){const price=parseContentPrice(form.priceText??'',form.currency);if(!price.ok){setNotice(price.reason);return;}data.amountMinor=price.amountMinor;}
  if(kind==='event'&&form.localDate){
   const old=current?.draft,original=eventLocalFields(old),unchanged=old?.timeZone===form.timeZone&&Object.keys(original).length&&Object.keys(original).every(k=>original[k]===form[k]);
   if(unchanged){data.startsAt=old.startsAt;data.endsAt=old.endsAt;}else{const start=localEventInstant(form.localDate,form.localStart||'',form.timeZone),end=localEventInstant(form.localEndDate||form.localDate,form.localEnd||'',form.timeZone);if(!start.ok||!end.ok){setNotice(start.reason||end.reason);return;}data.startsAt=start.value;data.endsAt=end.value;}
  }
  const checked=validateBusinessContent(kind,data);if(!checked.ok){setNotice(checked.reason);return;}setReview({id,kind,expectedRevision:current?.revision||0,data:checked.data,...changingOptionCurrency?{confirmOptionCurrencyChange:true}:{}});
 }
 return <Card title="Products and events" body="Create once for your website and app. Private edits and approved public records are separate. Approving a shared record updates connected views when refreshed. Layout locks protect layouts; they do not pin shared record facts. No checkout, stock ledger, tickets or attendance confirmation.">
  <Button label={open?'Hide products and events':'Manage products and events'} onPress={()=>{setOpen(x=>!x);}}/>
  {open?<View>
   <Button label="Load current business records" disabled={busy} onPress={()=>run('content_list')}/>
   <Button label="Create a product" disabled={busy||uncertain} onPress={()=>fresh('product')}/><Button label="Create an event" disabled={busy||uncertain} onPress={()=>fresh('event')}/>
   <Field label="Tell BUSY what to prepare" value={words} onChangeText={setWords} placeholder={'create product "Handmade bowl" for 24.50 GBP'}/>
   <Button label="Prepare record instruction" disabled={busy||uncertain} onPress={()=>{
    const plan=prepareBusinessContentInstruction(words,current);if(!plan.ok){setNotice(plan.reason);return;}
    if(plan.create)fresh(plan.kind);setKind(plan.kind);setForm({...plan.data,...plan.kind==='event'?eventLocalFields(plan.data):{priceText:String(plan.data.amountMinor/10**new Intl.NumberFormat('en',{style:'currency',currency:plan.data.currency}).resolvedOptions().maximumFractionDigits)}});setReview(null);setNotice('Record prepared in the fields. Review before saving; nothing is published.');
   }}/>
   {records.map(row=><Button key={row.id} label={row.draft.name+' • '+row.kind+' • draft '+row.revision+(row.published_revision?' • approved '+row.published_revision:' • private')} disabled={busy} onPress={()=>select(row)}/>)}
   {id?<>
    {['name','description','category'].map(key=><Field key={key} label={key} value={form[key]||''} onChangeText={v=>set(key,v)}/>)}
    {kind==='product'?<>
     <Field label="Currency code" value={form.currency||''} onChangeText={v=>set('currency',v.toUpperCase())}/>
     <Field label="Price" value={form.priceText||''} onChangeText={v=>set('priceText',v)} placeholder="For example 24.50"/>
     {current?.draft.variants?.length&&current.draft.currency!==form.currency?<Button label={(optionCurrencyApproved?'✓ ':'')+'I have reviewed every option price in the new currency'} onPress={()=>{setOptionCurrencyApproved(x=>!x);setReview(null);}}/>:null}
     <Text style={styles.cardBody}>Product options share this currency. They do not track inventory.</Text>
     {(form.variants||[]).map((variant,index)=><View key={variant.id}>
      {['label','sku'].map(key=><Field key={key} label={'Option '+(index+1)+' '+key} value={variant[key]} onChangeText={v=>{setForm(x=>({...x,variants:x.variants.map(row=>row.id===variant.id?{...row,[key]:v}:row)}));setReview(null);}}/>)}
      <Field label={'Option '+(index+1)+' price'} value={form.variantPriceTexts?.[variant.id]??(variant.amountMinor===null?'':priceText(variant.amountMinor,form.currency))} onChangeText={v=>{setForm(x=>({...x,variantPriceTexts:{...x.variantPriceTexts,[variant.id]:v}}));setReview(null);}}/>
      <Button label={'Remove option '+(index+1)} disabled={busy} onPress={()=>{setForm(x=>({...x,variants:x.variants.filter(row=>row.id!==variant.id)}));setReview(null);}}/>
     </View>)}
     <Button label="Add product option" disabled={busy||(form.variants||[]).length>=12} onPress={()=>{setForm(x=>({...x,variants:[...(x.variants||[]),{id:'variant_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,8),label:'',sku:'',amountMinor:null}]}));setReview(null);}}/>
     {['not_tracked','owner_available','owner_unavailable'].map(value=><Button key={value} label={(form.availability===value?'✓ ':'')+value.replaceAll('_',' ')} disabled={busy} onPress={()=>set('availability',value)}/>)}
    </>:<>
     <Field label="Date (YYYY-MM-DD)" value={form.localDate||form.startsAt?.slice(0,10)||''} onChangeText={v=>set('localDate',v)}/>
     <Field label="Start time (HH:MM in event time zone)" value={form.localStart||''} onChangeText={v=>set('localStart',v)}/>
     <Field label="End date (YYYY-MM-DD)" value={form.localEndDate||form.localDate||''} onChangeText={v=>set('localEndDate',v)}/>
     <Field label="End time (HH:MM)" value={form.localEnd||''} onChangeText={v=>set('localEnd',v)}/>
     {['timeZone','location','onlineUrl'].map(key=><Field key={key} label={({timeZone:'Event time zone',location:'Venue or location',onlineUrl:'Public event information link (optional)'})[key]} value={form[key]||''} onChangeText={v=>set(key,v)}/>)}
     <Button label="Mark event cancelled in private draft" disabled={busy} onPress={()=>set('status','cancelled')}/>
    </>}
    {images.map((image,index)=><Button key={image.uri} label={'Use approved photograph '+(index+1)} disabled={busy} onPress={()=>set('image',image)}/>)}
    {form.image?<><Field label="Image description" value={form.image.alt} onChangeText={v=>set('image',{...form.image,alt:v})}/><Button label="Remove record image" onPress={()=>set('image',null)}/></>:null}
    <Button label={kind==='product'?'Set product active in private draft':'Set event scheduled in private draft'} disabled={busy} onPress={()=>set('status',kind==='product'?'active':'scheduled')}/>
    <Button label="Archive in private draft" disabled={busy} onPress={()=>set('status','archived')}/>
    <Button label="Review private record change" disabled={busy} onPress={prepare}/>
    {review?<><Text style={styles.cardBody}>{review.data.name+' • '+review.data.description+' • '+(review.kind==='product'?contentPrice(review.data.amountMinor,review.data.currency):review.data.startsAt+' to '+review.data.endsAt+' • '+review.data.timeZone)+' • '+review.data.status}</Text><Button label="Approve and save private record" disabled={busy} onPress={()=>run('content_save',{...review,ownerApproved:true})}/></>:null}
    {current?<><Button label="Approve current saved record for shared public display" disabled={busy||!!review} onPress={()=>run('content_publish',{id:current.id,expectedRevision:current.revision,ownerApproved:true})}/>
     {current.canUndo?<Button label="Undo last private record edit" disabled={busy} onPress={()=>run('content_undo',{id:current.id,expectedRevision:current.revision,ownerApproved:true})}/>:null}</>:null}
   </>:null}
   {onCompose?<>
    <Button label={'Use '+(layout==='cards'?'rows':'cards')+' for this collection'} onPress={()=>setLayout(x=>x==='cards'?'rows':'cards')}/>
    <Button label="Use ordinary date/name ordering" onPress={()=>setFeaturedId('')}/>
    {records.filter(r=>r.kind===kind&&r.published).map(r=><Button key={'feature'+r.id} label={'Feature '+r.published.name+' first'} onPress={()=>setFeaturedId(r.id)}/>)}
    <Button label={'Remove '+(kind==='product'?'products':'events')+' from this builder — keep records'} disabled={busy} onPress={()=>{if(alive.current&&live.current.businessId===businessId)onCompose(records,{kind,remove:true});}}/>
    <Button label={'Prepare '+(kind==='product'?'products':'events')+' in this builder'} disabled={busy} onPress={()=>{if(alive.current&&live.current.businessId===businessId)onCompose(records,{kind,layout,featuredId,previewFeed:publicBusinessContent(records,businessId)});}}/>
   </>:null}
  </View>:null}
  {notice?<Text style={styles.cardBody}>{notice}</Text>:null}
 </Card>;
}
export {BusinessContentEditor};
