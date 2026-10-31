import {stableJson} from '../core/stableJson.mjs';
import {buildContentBrandSnapshot} from '../core/businessBrandDnaV3195.mjs';
import {resolveQuoteEnquiryReference} from '../core/quoteEnquiryReference.mjs';
// Read-only finite projections over original sources. Never a prospect/CRM store.
const text=(v,n=160)=>typeof v==='string'&&v.length<=n&&!/[<>\u0000-\u001f\u007f]/.test(v)?v.trim():'';
const own=(v,b)=>v&&![v.businessId,v.business_id].some(id=>id&&id!==b);
const unique=(rows,id)=>rows.filter(row=>row?.id===id).length===1;
export function growthOpportunityInput(s){return {ownerId:s.ownerSession?.userId,businessId:s.cloudWorkspace?.businessId,role:s.cloudWorkspace?.role,revision:s.cloudRevision,customers:s.customers,inboxItems:s.inboxItems,actions:s.replyActions,website:s.websiteDraft,app:s.miniAppsStatus?.app,approvedProfile:s.businessCreationIntelligence?.sharedProfile};}
export function buildGrowthOpportunities({ownerId,businessId,role,revision,customers=[],inboxItems=[],actions={},website,app,approvedProfile}={}){
 if(!ownerId||!businessId||!['owner','admin'].includes(role)||!Array.isArray(customers)||!Array.isArray(inboxItems))return [];
 const profile=buildContentBrandSnapshot({businessId,approvedProfile,sourceMode:'approved-profile'}),result=[];
 const scope=stableJson([ownerId,businessId,role]);
 const originalServices=Array.isArray(approvedProfile?.services)?approvedProfile.services:[];
 const services=profile.ok?profile.services.filter(s=>s.name&&(!s.id||originalServices.filter(row=>text(row?.id,128)===s.id).length===1)&&originalServices.filter(row=>text(row?.name,120).toLocaleLowerCase('en')===s.name.toLocaleLowerCase('en')).length===1):[];
 for(const item of inboxItems.slice(0,100)){
  if(!text(item?.id,180)||!text(item?.filedCustomerId,180)||!unique(inboxItems,item.id)||item.status!=='Filed'||!own(item,businessId)||!Number.isSafeInteger(revision)||revision<1)continue;
  const matches=customers.filter(c=>c?.id===item.filedCustomerId);if(matches.length!==1||!own(matches[0],businessId))continue;
  const customer=matches[0],service=text(item.parsed?.service),supported=services.find(s=>s.name.toLocaleLowerCase('en')===service.toLocaleLowerCase('en'));
  const restricted=customer.contactOk===false;
  const action=actions?.[customer.id],ref=action?.details?.enquiryReference;
  const quote=own(action,businessId)&&action?.type==='quote'&&resolveQuoteEnquiryReference(ref,{businessId,customerId:customer.id,inboxItems,revision})===item;
  const stamp=stableJson([scope,revision,item,customer,action,profile.source]);
  result.push({id:'enquiry:'+item.id,stamp,kind:'existing_enquiry',businessId,ownerId,sourceId:item.id,customerId:customer.id,serviceName:supported?.name||'',title:'Review existing enquiry'+(service?' · '+service:''),priority:restricted?'restricted':quote?'review':'attention',why:restricted?'This customer record restricts contact. No approach is prepared.':quote?'An original linked private quote is recorded; review its current evidence before deciding what to do.':'A genuine Filed enquiry is associated with one existing customer. Review the request before preparing a private reply.',known:['Original Filed enquiry '+item.id,'Exact existing customer relationship',...(supported?['Requested service matches the approved business profile']:[])],uncertain:['Current customer need, availability and geographic suitability are not independently established.','A contact detail is not marketing consent.'],contact:restricted?'restricted':'permission_not_established',observedAt:typeof item.reviewedAt==='string'&&Number.isFinite(Date.parse(item.reviewedAt))?item.reviewedAt:null,observationMeaning:'Original filing review time, not a new discovery or customer response time',next:restricted?'none':'enquiry_review',outcomes:{enquiry:'recorded',quotation:quote?'private_prepared_record':'not_established',outreach:'not_established',response:'not_established',wonWork:'not_established',payment:'not_established'}});
 }
 // An absent entry in the current private Services section is a source gap, not a live SEO audit.
 const siteOwned=website&&(website.businessId===businessId||website.business_id===businessId)&&own(website,businessId)&&website.id&&Array.isArray(website.sections)&&website.sections.every(s=>s&&typeof s==='object'&&!Array.isArray(s)&&text(s.id,180)&&text(s.type,180));
 if(profile.ok&&siteOwned){
  const sections=website.sections.filter(s=>s?.id==='services'||s?.type==='services');
  if(sections.length<=1&&(!sections.length||Array.isArray(sections[0].items)&&sections[0].items.every(row=>row&&typeof row==='object'&&!Array.isArray(row)&&text(row.title||row.name,140)))){
   const section=sections[0],rows=section?.enabled===false?[]:section?.items||[];
   for(const service of services){
    if(rows.some(row=>text(row.title||row.name).toLocaleLowerCase('en')===service.name.toLocaleLowerCase('en')))continue;
    result.push({id:'website-service:'+JSON.stringify([website.id,service.id||service.name]),stamp:stableJson([scope,website,profile.source]),kind:'website_service_gap',businessId,ownerId,sourceId:website.id,sourceRevision:{websiteGeneration:website.generation,profileFingerprint:approvedProfile.fingerprint},serviceName:service.name,title:'Explain '+service.name,priority:'preparation',why:'This approved service has no matching entry in the current private website Services section. A factual explanation could help visitors understand your business; no demand or conversion benefit is verified.',known:['Current approved service: '+service.name,'Private website draft '+website.id+' · generation '+website.generation],uncertain:['This is not a live-site inspection, search-ranking result or discovered customer.','The service may be described elsewhere; review the page before changing it.','Business capacity and audience demand are not established.'],contact:'no_recipient_or_contact_permission',observedAt:null,observationMeaning:'Current source inspection; no external observation timestamp',next:'creator_service',outcomes:{enquiry:'not_established',quotation:'not_established',outreach:'not_established',response:'not_established',wonWork:'not_established',payment:'not_established'}});
   }
  }
 }
 return result.sort((a,b)=>['attention','review','preparation','restricted'].indexOf(a.priority)-['attention','review','preparation','restricted'].indexOf(b.priority)||a.id.localeCompare(b.id));
}
export function currentGrowthOpportunity(input,evidence){return evidence&&buildGrowthOpportunities(input).find(row=>row.id===evidence.id&&row.stamp===evidence.stamp)||null;}
// Creator receives a private source reference, never customer words or contact details.
export function currentGrowthContentOrigin(context,origin){
 if(origin?.kind!=='website_service_gap'||origin.businessId!==context.businessId||origin.ownerId!==context.ownerId)return null;
 const rows=buildGrowthOpportunities({...context,ownerId:context.ownerId,role:context.role});
 return rows.find(row=>row.id===origin.id&&row.stamp===origin.stamp&&row.sourceId===origin.sourceId&&row.serviceName===origin.serviceName&&row.next==='creator_service')||null;
}

// Optional provenance on the original Creator record. It is not current source authority.
export function growthDraftOrigin(value){
 if(!value||value.version!==undefined&&![1,2].includes(value.version)||value.kind!=='website_service_gap'||!text(value.ownerId,180)||!text(value.businessId,180)||!text(value.id,400)||!text(value.sourceId,180)||!text(value.serviceName,120))return null;
 const versioned=Number.isSafeInteger(value.sourceRevision?.websiteGeneration)&&value.sourceRevision.websiteGeneration>=1&&text(value.sourceRevision.profileFingerprint,128);
 if(value.version===2&&!versioned)return null;
 const sourceRevision=versioned?{websiteGeneration:value.sourceRevision.websiteGeneration,profileFingerprint:value.sourceRevision.profileFingerprint}:null;
 const feedback=value.feedback;
 const validFeedback=versioned&&feedback?.purpose==='opportunity_relevance'&&['useful','irrelevant','later','clear'].includes(feedback.choice)&&Number.isSafeInteger(feedback.revision)&&feedback.revision>=1&&feedback.sourceRevision&&stableJson(feedback.sourceRevision)===stableJson(sourceRevision);
 return {version:versioned?2:1,kind:'website_service_gap',ownerId:value.ownerId,businessId:value.businessId,id:value.id,sourceId:value.sourceId,serviceName:value.serviceName,referenceOnly:true,...versioned?{sourceRevision}:{},...validFeedback?{feedback:{purpose:'opportunity_relevance',choice:feedback.choice,revision:feedback.revision,sourceRevision}}:{}};
}

// Exact approved copy -> original Website Builder finite edit; no inferred SEO claim.
export function prepareGrowthWebsiteChange(input,evidence){
 const row=currentGrowthOpportunity(input,evidence);if(row?.kind!=='website_service_gap')return null;
 const snapshot=buildContentBrandSnapshot({businessId:input.businessId,approvedProfile:input.approvedProfile,sourceMode:'approved-profile'});
 const service=snapshot.ok&&snapshot.services.find(s=>s.name===row.serviceName);if(!service?.description)return null;
 const sections=input.website.sections.filter(s=>s.id==='services'||s.type==='services');
 if(sections.length===1&&(sections[0].id!=='services'||sections[0].type!=='services'||sections[0].enabled===false))return null;
 return {action:sections.length?'add-item':'create-collection',sectionId:'services',title:service.name,body:service.description};
}

// Shared finite website-source inspection for current suggestions and saved references.
export function growthWebsiteEvidence({website,businessId,approvedProfile}={}){
 const profile=buildContentBrandSnapshot({businessId,approvedProfile,sourceMode:'approved-profile'});
 if(!profile.ok||!website||website.id==null||!own(website,businessId)||![website.businessId,website.business_id].includes(businessId)||!Number.isSafeInteger(website.generation)||website.generation<1||!Array.isArray(website.sections)||website.sections.some(s=>!s||typeof s!=='object'||Array.isArray(s)||!text(s.id,180)||!text(s.type,180)))return {state:'unavailable'};
 const sections=website.sections.filter(s=>s.id==='services'||s.type==='services');
 if(sections.length>1)return {state:'ambiguous'};
 const section=sections[0];if(section&&(!Array.isArray(section.items)||section.items.some(r=>!r||typeof r!=='object'||Array.isArray(r)||!text(r.title||r.name,140))))return {state:'unavailable'};
 return {state:section?.enabled===false?'restricted':'supported',profile,section,rows:section?.items||[],website};
}
