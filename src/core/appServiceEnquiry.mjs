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
