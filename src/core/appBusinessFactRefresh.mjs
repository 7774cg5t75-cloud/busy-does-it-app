import {privateAppEditSource,bindPrivateAppProposal} from './privateAppEditSession.mjs';
import {proposeCoordinatedAppChanges} from './appCoordinatedStudio.mjs';
import {validatePrivateAppServices} from './appServiceCollection.mjs';
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const name=s=>s.trim().normalize('NFKC').toLocaleLowerCase('en');
function reviewAppBusinessFactRefresh({businessId,app,profileRecord,selected=null}={}){
 const source=privateAppEditSource({businessId,app});
 const record=profileRecord,config=app?.draft_config;
 const fail=reason=>({ok:false,reason,rows:[],preview:null});
 if(!source||record?.business_id!==businessId||!Number.isSafeInteger(record.revision)||record.revision<1||
  record.revision<Number(config.sourceProfileRevision||0)||!record.profile||typeof record.profile!=='object'||Array.isArray(record.profile))
  return fail('Refresh the current business’s saved public profile before comparing facts.');
 if(selected!==null&&(!Array.isArray(selected)||selected.length>37||selected.some(x=>typeof x!=='string')))return fail('Choose supported fact changes.');
 const rows=[],textOps=[],old=config.publicProfile||{},fresh=record.profile;
 for(const field of ['tagline','about','description']){
  const value=fresh[field];if(typeof value!=='string'||!value.trim()||value===old[field])continue;
  const op={kind:'text',field,value},checked=proposeCoordinatedAppChanges(config,[op]);
  rows.push({id:'text:'+field,label:field,before:old[field]??'',after:value,conflict:!!old[field],
   allowed:checked.ok,reason:checked.ok?'':checked.reason,op});
 }
 for(const field of ['phone','email','openingHours']){
  const value=fresh.contact?.[field],previous=old.contact?.[field];
  if(typeof value!=='string'||!value.trim()||value===previous)continue;
  const op={kind:'contact',field,value},checked=proposeCoordinatedAppChanges(config,[op]);
  rows.push({id:'contact:'+field,label:field,before:previous??'',after:value,conflict:!!previous,
   allowed:checked.ok,reason:checked.ok?'':checked.reason,op});
 }
 const prior=Array.isArray(old.services)?old.services:[];
 const offered=Array.isArray(fresh.services)?fresh.services:[];
 if(offered.length&&!validatePrivateAppServices(offered).ok)return fail('Review invalid or duplicate saved services before importing them.');
 if(!validatePrivateAppServices(prior).ok)return fail('Review the app’s current services before importing facts.');
 const seen=new Set();
 for(const item of prior){if(typeof item?.name!=='string'||seen.has(name(item.name)))return fail('Review the app’s current service names before importing facts.');seen.add(name(item.name));}
 const offeredNames=new Set();
 for(const item of offered){
  const key=name(item.name);if(offeredNames.has(key))return fail('Review duplicate normalised saved service names.');offeredNames.add(key);
  const at=prior.findIndex(x=>name(x.name)===name(item.name));
  const next={...item};
  if(at>=0&&same({name:prior[at].name,description:prior[at].description||''},{name:item.name,description:item.description||''}))continue;
  const candidate=prior.map(x=>({...x}));
  if(at>=0)candidate[at]={...item,...prior[at].id?{id:prior[at].id}:{}};else candidate.push(item);
  const checked=proposeCoordinatedAppChanges(config,[{kind:'services',value:candidate}]);
  rows.push({id:'service:'+name(item.name),label:item.name,before:at>=0?prior[at].description||'':'',
   after:item.description||'',conflict:at>=0,allowed:checked.ok,reason:checked.ok?'':checked.reason,service:next,index:at});
 }
 const ids=selected??rows.filter(r=>!r.conflict&&r.allowed).map(r=>r.id);
 if(ids.some(id=>!rows.some(r=>r.id===id)))return fail('The saved facts changed. Review the new comparison.');
 let services=prior.map(x=>({...x})),servicesChanged=false;
 for(const row of rows.filter(r=>ids.includes(r.id)&&r.allowed)){
  if(row.op)textOps.push(row.op);
  else{if(row.index>=0)services[row.index]={...row.service,...prior[row.index].id?{id:prior[row.index].id}:{}};else services.push(row.service);servicesChanged=true;}
 }
 const operations=[...textOps,...servicesChanged?[{kind:'services',value:services}]:[]];
 const prepared=operations.length?proposeCoordinatedAppChanges(config,operations):null;
 return {ok:true,source:{...source,profileRevision:record.revision,profileStamp:JSON.stringify(record.profile)},
  rows:rows.map(({op,service,index,...row})=>row),selected:ids,
  preview:prepared?.ok?bindPrivateAppProposal(prepared,{businessId,app}):null,
  reason:prepared&&!prepared.ok?prepared.reason:operations.length?'Compare these changes in the original Studio before approving.':'Existing wording is kept. Select any replacement explicitly.',
  preservesExistingServices:true,removesServices:false,importsMedia:false,automaticSave:false};
}
function currentAppBusinessFactReview(review,{businessId,app,profileRecord}={}){
 const source=privateAppEditSource({businessId,app});
 return !!review?.ok&&!!source&&Object.entries(source).every(([key,value])=>review.source[key]===value)&&
  profileRecord?.business_id===businessId&&profileRecord.revision===review.source.profileRevision&&
  JSON.stringify(profileRecord.profile)===review.source.profileStamp;
}
export {reviewAppBusinessFactRefresh,currentAppBusinessFactReview};
