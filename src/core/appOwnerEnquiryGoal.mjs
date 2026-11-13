import {inspectCapabilityIntent} from './universalBuilderPlanV3210.mjs';
import {appEnquirySetup} from './appEnquirySetup.mjs';
import {approvedServiceChoices,serviceEnquiryContext} from './appServiceEnquiry.mjs';
// Same original intent grammar, catalogue and service source as the builder.
// Owner request is planning input, never permission to activate a capability.
export function prepareOwnerEnquiryGoal({businessId,app,catalog,approvedProfile,goal}={}){
 if(typeof goal!=='string'||!goal.trim()||goal.length>600||/[<>\u0000-\u001f]/.test(goal))return {ok:false,reason:'Tell Busy briefly what customers should be able to do.'};
 const intent=inspectCapabilityIntent(goal),setup=appEnquirySetup({businessId,app,catalog});
 if(!intent.valid||intent.conflicts.length||!intent.requested.includes('enquiry')||intent.declined.some(k=>['services','enquiry'].includes(k)))return {ok:false,reason:'Review a clear request to show services and receive enquiries. Other actions remain separate.'};
 if(!setup)return {ok:false,reason:'This app is not ready for a supported enquiry setup.'};
 if(!setup.ready)return {ok:false,needsSetup:setup.steps.filter(s=>!s.enabled).map(s=>s.key),reason:'First review switching on service browsing and customer enquiries below. Nothing is enabled automatically.'};
 const context=serviceEnquiryContext({businessId,app,catalog}),approved=approvedServiceChoices(approvedProfile,businessId),existing=context.services;
 const additions=approved.filter(row=>!existing.some(s=>s.id===row.id||s.name.trim().toLocaleLowerCase('en')===row.name.trim().toLocaleLowerCase('en')));
 const services=[...existing.map(r=>({...r,importApproved:false})),...additions.map(r=>({...r,importApproved:true}))];
 if(!services.length)return {ok:false,reason:'Add the genuine services you offer to your business information first.'};
 if(services.length>6)return {ok:false,reason:'You have more services than one review can contain. Choose the services you want to prepare together below; none were omitted or changed.'};
 return {ok:true,goal,source:context.source,profileFingerprint:approvedProfile?.fingerprint||null,rows:services.map(r=>({id:r.id,...r.importApproved?{importApproved:true}:{},fields:{name:r.name,description:r.description||'',...Object.fromEntries(['category','priceLabel','durationLabel'].filter(k=>Object.hasOwn(r,k)).map(k=>[k,r[k]]))},label:/\bquotes?\b/i.test(goal)?'Request a quote':context.config.presentation?.servicePresentation?.[r.id]?.enquiryLabel||'Ask about this service'})),navigationLabel:context.config.modules.find(m=>m.key==='services')?.label||'Services',explanation:'Busy reused your current services and approved business information. Review the words, optional public answers and enquiry preview before saving.',bookingEnabled:false,executes:false};
}
