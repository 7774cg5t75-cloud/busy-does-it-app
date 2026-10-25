import {buildContentBrandSnapshot} from '../core/businessBrandDnaV3195.mjs';
import {stableJson} from '../core/stableJson.mjs';
// Finite running-session intake, not a lead, customer, enquiry or account record.
const clean=(s,n)=>typeof s==='string'&&s.trim()&&s.length<=n&&!/[<>\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(s);
export function ownerOpportunityServices({businessId,approvedProfile}={}){
 const source=buildContentBrandSnapshot({businessId,approvedProfile,sourceMode:'approved-profile'});
 if(!source.ok)return [];
 const original=approvedProfile?.services||[];
 return source.services.filter(row=>row.id&&original.filter(s=>s?.id===row.id).length===1&&original.filter(s=>typeof s?.name==='string'&&s.name.trim().toLocaleLowerCase('en')===row.name.toLocaleLowerCase('en')).length===1);
}
export function reviewOwnerOpportunity({ownerId,businessId,role,scope,approvedProfile},input){
 if(!ownerId||!businessId||!scope||!['owner','admin'].includes(role)||!input||Object.keys(input).sort().join('|')!=='description|permission|serviceId|source|title'||!clean(input.title,100)||!clean(input.description,600)||!clean(input.source,300)||!['unknown','permitted','restricted'].includes(input.permission))return {ok:false,reason:'Review a title, the exact owner report, its source and whether you may use it. No customer need or contact permission is inferred.'};
 const service=ownerOpportunityServices({businessId,approvedProfile}).find(s=>s.id===input.serviceId);
 if(!service)return {ok:false,reason:'Choose one unambiguous current approved service. Similar wording cannot establish a service identity.'};
 const facts='PRIVATE OPPORTUNITY PREPARATION — not outreach or a verified customer need.\n\nOwner-reported opportunity: '+input.title.trim()+'\nOwner account: '+input.description.trim()+'\nOwner-reported source: '+input.source.trim()+'\nUse of information: '+input.permission+' (owner report, not independently verified).\n\nRelevant approved service: '+service.name+(service.description?' — '+service.description:'')+'\nWhy review: the owner selected this supported service; actual demand, prospect identity, location, budget and availability are not established.\nContact permission: not established. No cold marketing or customer-service authority is inferred.\n\nProposed next step: check the source and whether a lawful, appropriate conversation is possible. A possible general service introduction to review separately: We offer '+service.name+'. Please ask us about the scope and current availability.\n\nNo contact, reply, enquiry, quotation, job or payment is established. Retain only information you are authorised to use; remove unnecessary personal details before saving.';
 if(facts.length>3000)return {ok:false,reason:'Shorten the owner report before preparing it in Creator.'};
 return {ok:true,stamp:stableJson([ownerId,businessId,role,scope,approvedProfile,input]),service,ownerFacts:facts,mayPrepare:input.permission==='permitted',provenance:'owner_reported',contact:'not_established',outcome:'not_established'};
}
