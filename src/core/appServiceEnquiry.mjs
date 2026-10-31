import {proposeCoordinatedAppChanges} from './appCoordinatedStudio.mjs';
import {validatePrivateAppServices} from './appServiceCollection.mjs';
import {appRuntimeScreenSchema} from './appRuntimeScreenSchema.mjs';
import {bindPrivateAppProposal,privateAppEditSource} from './privateAppEditSession.mjs';
import {validServiceActionLabel} from './appServicePresentation.mjs';
export function serviceEnquiryContext({businessId,app,catalog}={}){
 const source=privateAppEditSource({businessId,app}),config=app?.draft_config;
 if(!source||!appRuntimeScreenSchema(config,catalog).ok||!validatePrivateAppServices(config.publicProfile?.services||[]).ok)return null;
 for(const key of ['services','enquiry'])if(config.modules.filter(m=>m.key===key).length!==1||!config.modules.find(m=>m.key===key)?.enabled||catalog.filter(m=>m.module_key===key&&m.status==='available').length!==1)return null;
 return {source,services:config.publicProfile?.services||[],config};
}
export function approvedServiceChoices(profile,businessId){
 if(profile?.businessId&&profile.businessId!==businessId||typeof profile?.fingerprint!=='string'||!Array.isArray(profile.services))return [];
 return profile.services.filter(row=>typeof row?.id==='string'&&/^[A-Za-z0-9_-]{1,80}$/.test(row.id)&&typeof row.name==='string'&&row.name.trim()&&profile.services.filter(x=>x?.id===row.id).length===1&&profile.services.filter(x=>typeof x?.name==='string'&&x.name.trim().toLocaleLowerCase('en')===row.name.trim().toLocaleLowerCase('en')).length===1&&validatePrivateAppServices([{id:row.id,name:row.name,description:row.description||''}]).ok);
}
export function prepareServiceEnquiry({businessId,app,catalog,serviceId,fields,label,approvedProfile,importApproved=false}={}){
 const context=serviceEnquiryContext({businessId,app,catalog});if(!context||typeof serviceId!=='string'||!fields||!Object.hasOwn(fields,'name')||!Object.hasOwn(fields,'description')||Object.keys(fields).some(k=>!['name','description','category','priceLabel','durationLabel'].includes(k))||!validServiceActionLabel(label,'enquiry'))return {ok:false,reason:'Review one supported service, its exact wording and enquiry button.'};
 const rows=context.services,matches=rows.filter(r=>r.id===serviceId);
 if(matches.length>1)return {ok:false,reason:'The selected service is ambiguous.'};
 const approved=approvedServiceChoices(approvedProfile,businessId).find(r=>r.id===serviceId);
 if(importApproved&&(!approved||matches.length)||!importApproved&&matches.length!==1)return {ok:false,reason:'The original selected service changed or its approved import is unavailable.'};
 const service={...(matches[0]||{id:serviceId}),name:fields.name,description:fields.description};
 for(const key of ['category','priceLabel','durationLabel'])if(Object.hasOwn(fields,key)){if(typeof fields[key]!=='string')return {ok:false,reason:'Use exact owner-written service labels.'};if(fields[key].trim())service[key]=fields[key];else delete service[key];}
 const services=importApproved?[...rows,service]:rows.map(r=>r.id===serviceId?service:r);
 const operations=[];
 if(JSON.stringify(rows)!==JSON.stringify(services))operations.push({kind:'services',value:services});
 if(context.config.presentation?.servicePresentation?.[serviceId]?.enquiryLabel!==label)operations.push({kind:'service_presentation',field:serviceId,value:{enquiryLabel:label}});
 if(!operations.length)return {ok:false,reason:'This service and enquiry button already match the draft.'};
 const plan=proposeCoordinatedAppChanges(context.config,operations);
 return plan.ok?bindPrivateAppProposal(plan,{businessId,app}):plan;
}

// One original services operation. No new fields, modules, prices or request authority.
export function prepareApprovedAppServices({businessId,app,catalog,approvedProfile,selectedIds}={}){
 const context=serviceEnquiryContext({businessId,app,catalog});
 if(!context||!Array.isArray(selectedIds)||!selectedIds.length||new Set(selectedIds).size!==selectedIds.length)return {ok:false,reason:'Choose distinct approved services to add.'};
 const candidates=approvedServiceChoices(approvedProfile,businessId).filter(r=>!context.services.some(s=>s.id===r.id||s.name.trim().toLocaleLowerCase('en')===r.name.trim().toLocaleLowerCase('en')));
 const added=selectedIds.map(id=>candidates.find(r=>r.id===id));if(added.some(x=>!x))return {ok:false,reason:'An approved service changed or already exists. Review its current identity.'};
 const services=[...context.services,...added.map(r=>({id:r.id,name:r.name,description:r.description||''}))];
 const plan=proposeCoordinatedAppChanges(context.config,[{kind:'services',value:services}]);return plan.ok?bindPrivateAppProposal(plan,{businessId,app}):plan;
}

// Review several existing service/enquiry edits as one original Studio batch.
// Six rows plus the original services and navigation operations fit its eight-change bound.
export function prepareAppEnquiryJourney({businessId,app,catalog,rows,navigationLabel,approvedProfile}={}){
 const context=serviceEnquiryContext({businessId,app,catalog});
 if(!context||!Array.isArray(rows)||!rows.length||rows.length>6||new Set(rows.map(r=>r?.id)).size!==rows.length)return {ok:false,reason:'Review one to six distinct existing services together.'};
 let working=app;const labelOperations=[];
 for(const row of rows){
  if(!row||Object.keys(row).some(k=>!['id','fields','label','importApproved'].includes(k)))return {ok:false,reason:'Use only the original service fields and enquiry action.'};
  const existing=context.services.find(s=>s.id===row.id),importing=row.importApproved===true;
  if(Object.hasOwn(row,'importApproved')&&typeof row.importApproved!=='boolean')return {ok:false,reason:'Review a deliberate approved-service import.'};
  if(!existing&&!importing)return {ok:false,reason:'A selected service is no longer in this app.'};
  // Validate even unchanged rows through the original service contract.
  const part=prepareServiceEnquiry({businessId,app:working,catalog,serviceId:row.id,fields:row.fields,label:row.label,importApproved:importing,approvedProfile});
  if(!part.ok&&part.reason!=='This service and enquiry button already match the draft.')return part;
  if(part.ok){working={...working,draft_config:part.nextConfig};for(const op of part.operations)if(op.kind==='service_presentation')labelOperations.push(op);}
 }
 const operations=[];
 if(JSON.stringify(context.services)!==JSON.stringify(working.draft_config.publicProfile.services))operations.push({kind:'services',value:working.draft_config.publicProfile.services});
 operations.push(...labelOperations);
 if(navigationLabel!==undefined&&navigationLabel!==context.config.modules.find(m=>m.key==='services')?.label)operations.push({kind:'navigation_label',moduleKey:'services',value:navigationLabel});
 if(!operations.length)return {ok:false,reason:'The reviewed service journey already matches the app.'};
 const plan=proposeCoordinatedAppChanges(context.config,operations);return plan.ok?bindPrivateAppProposal(plan,{businessId,app}):plan;
}
