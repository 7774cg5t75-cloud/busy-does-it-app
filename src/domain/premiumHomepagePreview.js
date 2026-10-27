import {buildWebsiteDraft,renderWebsiteHtml,applyStructuredWebsiteEdit,applyWebsiteLayoutChange} from './websiteBuilder';
// Visitor-safe finite facts only. No owner workspace, CRM, private assets,
// account writer, external URL retrieval, model call or publishing authority.
export function preparePremiumHomepagePreview(facts,{now=Date.now()}={}){
 const limits={businessName:160,businessType:120,description:1000,serviceArea:200,email:200,phone:80};
 if(!facts||typeof facts!=='object'||Array.isArray(facts)||Object.keys(facts).some(k=>!Object.hasOwn(limits,k)&&k!=='services')||Object.entries(limits).some(([k,n])=>typeof facts[k]!=='string'||facts[k].length>n||/[<>\u0000-\u001f]/.test(facts[k]))||!facts.businessName.trim()||!facts.businessType.trim()||!facts.description.trim()||facts.email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(facts.email)||facts.phone&&!/^[+()0-9 .-]{7,80}$/.test(facts.phone)||!Array.isArray(facts.services)||!facts.services.length||facts.services.length>8)return {ok:false,reason:'Review your business name, type, short description, contact information and one to eight genuine services.'};
 const ids=new Set(),names=new Set();
 for(const [index,row]of facts.services.entries()){const id=row?.id??'preview-service-'+index;if(!row||Object.keys(row).some(k=>!['id','name','description'].includes(k))||typeof id!=='string'||!/^[A-Za-z0-9_-]{1,80}$/.test(id)||ids.has(id)||typeof row.name!=='string'||!row.name.trim()||row.name.length>160||names.has(row.name.trim().toLocaleLowerCase('en'))||typeof row.description!=='string'||!row.description.trim()||row.description.length>700||/[<>\u0000-\u001f]/.test(row.name+row.description))return {ok:false,reason:'Give each genuine service a distinct name and a short factual description.'};ids.add(id);names.add(row.name.trim().toLocaleLowerCase('en'));}
 const sourceFacts={...JSON.parse(JSON.stringify(facts)),services:facts.services.map((r,i)=>({...r,id:r.id??'preview-service-'+i}))},draft=buildWebsiteDraft({brandBrain:{websiteBrief:sourceFacts}}),quality=draft.designReview,html=renderWebsiteHtml(draft,'home');
 if(!quality||!['identity','main-heading','service-proof','no-empty-pages','photo-fallback'].every(id=>quality.checks.some(c=>c.id===id&&c.passed))||html.length>250000)return {ok:false,reason:'This sample needs a supported quality review before it can be shown.'};
 return {ok:true,revision:0,createdAt:now,expiresAt:now+30*60*1000,version:1,kind:'private_homepage_sample',sourceFacts,draft,html,quality,previewOnly:true,publicRouteEnabled:false,accountSaved:false,published:false,paidCalls:0,remoteRequests:0,sessionOnly:true,limitations:['Private session sample only; no public address or account save.','No live enquiry, domain, payment or publication.','No external images or invented reviews; supplied facts need owner review.','Visitor release still needs server-enforced cost/privacy/expiry and rendered quality acceptance.']};
}

// Local scope/expiry is a sample UX bound, never a server quota or entitlement.
export function inspectPremiumSample(sample,{now=Date.now()}={}){
 if(!sample?.ok||sample.kind!=='private_homepage_sample'||sample.publicRouteEnabled!==false||!Number.isSafeInteger(sample.revision)||sample.revision<0||!Number.isFinite(sample.createdAt)||!Number.isFinite(sample.expiresAt)||now<sample.createdAt||now>=sample.expiresAt)return {ok:false,reason:'This private sample has expired. Prepare a new sample from your current facts.'};
 const gaps=sample.draft.designPlan?.missing||[];
 return {ok:true,missing:gaps.map(id=>({id,message:{contact:'Add a genuine contact method before any live enquiry pathway.', 'approved-photos':'No approved photographs were supplied; Busy used its professional typographic layout.', 'business-description':'Supply your own short business description.',services:'Review your genuine services.'}[id]||'Review '+id})),visitorReady:false};
}
export function revisePremiumSample(sample,change,{expectedRevision,now=Date.now()}={}){
 const active=inspectPremiumSample(sample,{now});if(!active.ok)return active;
 if(expectedRevision!==sample.revision||sample.revision>=4)return {ok:false,reason:'Review the current sample. This session allows four deliberate revisions; your website is unchanged.'};
 if(!change||Object.keys(change).some(k=>!['kind','sectionId','itemId','field','value'].includes(k)))return {ok:false,reason:'Choose supported sample wording or appearance.'};
 let result;
 if(change.kind==='copy'){
  const hero=change.sectionId==='hero'&&['title','body'].includes(change.field)&&!change.itemId;
  const service=change.sectionId==='services'&&['title','body'].includes(change.field)&&typeof change.itemId==='string';
  if(!hero&&!service)return {ok:false,reason:'Edit your own headline, introduction or an exact existing service.'};
  result=applyStructuredWebsiteEdit(sample.draft,{sectionId:change.sectionId,field:change.field,value:change.value,...change.itemId?{itemId:change.itemId}:{}});
 }else if(change.kind==='appearance'&&['typography','spacing','heroLayout'].includes(change.field)&&!change.sectionId&&!change.itemId){
  result=applyWebsiteLayoutChange(sample.draft,{action:'style',field:change.field,value:change.value});
 }else return {ok:false,reason:'Choose supported sample wording or appearance.'};
 if(!result.applied)return {ok:false,reason:result.reason};
 const html=renderWebsiteHtml(result.draft,'home');if(html.length>250000)return {ok:false,reason:'This sample exceeds its local resource bound.'};
 return {...sample,draft:result.draft,html,quality:result.draft.designReview,revision:sample.revision+1,ownerRevised:true};
}
