/**
 * V3.173: private service and business-information clarity review.
 * Reuses owner-authored facts. No AI generation, new prices, testimonial
 * claims, contact details, identity data, network writes or publication.
 * Cross-surface comparisons are blocked unless a trusted caller supplies
 * matching, already-authenticated business scope. That scope is not itself
 * an authentication mechanism.
 */
import {enquiryQuestionKinds} from './ownerConversationPreparation.mjs';
const clean=x=>typeof x==="string"?x.trim():"";
const capped=x=>Array.isArray(x)?x.slice(0,30):[];
function inspectServices(services,surface){
 const rows=capped(services),issues=[],names=new Map();
 for(let i=0;i<rows.length;i++){
  const name=clean(rows[i]?.name),desc=clean(rows[i]?.description);
  if(!name)issues.push({id:"unnamed_service",surface,position:i+1,priority:"important",
    title:"A service needs a name",
    ownerAction:"Add an accurate owner-approved service name."});
  if(!desc)issues.push({id:"missing_service_description",surface,position:i+1,
    priority:"review",title:"Explain what this service includes",
    ownerAction:"Write a clear description in the existing private service editor."});
  if(name){
   const key=name.toLocaleLowerCase("en");
   if(names.has(key))issues.push({id:"duplicate_service_name",surface,position:i+1,
    priority:"review",title:"Services have the same name",
    ownerAction:"Review duplicate names; only merge them if they truly describe the same service."});
   names.set(key,true);
  }
 }
 if(!rows.length)issues.push({id:"no_services",surface,position:null,
  priority:"important",title:"No services are described",
  ownerAction:"Add the services your business actually provides."});
 if(Array.isArray(services)&&services.length>30)issues.push({
  id:"needs_full_list_review",surface,position:null,priority:"review",
  title:"More services need checking",
  ownerAction:"Review the full services list in the editor. BUSY only examines the first 30 in this preview."
 });
 return {count:Array.isArray(services)?services.length:0,
  issues:issues.slice(0,40),completeServiceDescriptions:rows.filter(x=>
   clean(x?.name)&&clean(x?.description)).length,
  // Service names are NEVER returned; they remain only in local comparison state.
  identifiersReturned:false};
}
function reviewBusinessInformation({
 websiteDraft=null,brandBrain={},appConfig=null,scope=null
}={}){
 const website=websiteDraft&&Array.isArray(websiteDraft.sections)&&
  typeof websiteDraft.id==="string"&&!!websiteDraft.id;
 const app=appConfig&&Array.isArray(appConfig.modules);
 if(!website&&!app)return {ok:false,
  reason:"Choose a current website or app private draft first."};
 if(website&&app&&!(
  typeof scope?.authorizedBusinessId==="string"&&!!scope.authorizedBusinessId&&
  scope.websiteBusinessId===scope.authorizedBusinessId&&
  scope.appBusinessId===scope.authorizedBusinessId)){
  return {ok:false,reason:"Website and app data must come from the same authenticated business."};
 }
 const webBrief=brandBrain?.websiteBrief||{};
 const websiteInfo=website?inspectServices(webBrief.services,"website"):null;
 const appServices=appConfig?.publicProfile?.services;
 const appServicesEnabled=app&&appConfig.modules.some(m=>
  m?.key==="services"&&m?.enabled===true);
 const appInfo=appServicesEnabled?inspectServices(appServices,"app"):null;
 const issues=[
  ...(websiteInfo?.issues||[]),...(appInfo?.issues||[])
 ];
 // V3.179 — compare normalized, already-approved facts IN MEMORY.
 // Return only counts/flags: never copy owner service lists or names to findings.
 const normaliseName=value=>clean(value).replace(/\s+/g," ").toLocaleLowerCase("en");
 const websiteNames=new Set(capped(webBrief.services)
   .map(x=>normaliseName(x?.name)).filter(Boolean));
 const appNames=new Set(capped(appServices)
   .map(x=>normaliseName(x?.name)).filter(Boolean));
 const matchingServices=websiteInfo&&appInfo?
   [...websiteNames].filter(n=>appNames.has(n)).length:null;
 const websiteOnly=websiteInfo&&appInfo?
   [...websiteNames].filter(n=>!appNames.has(n)).length:null;
 const appOnly=websiteInfo&&appInfo?
   [...appNames].filter(n=>!websiteNames.has(n)).length:null;
 if(websiteInfo&&appInfo&&websiteInfo.count===appInfo.count&&
    (websiteOnly>0||appOnly>0))issues.push({
   id:"different_service_sets",surface:"both",position:null,priority:"review",
   title:"Website and app list different services",
   ownerAction:"Compare the approved service lists. Different selections may be intentional."});
 const webName=website?normaliseName(websiteDraft.businessName||webBrief.businessName):"";
 const appName=app?normaliseName(appConfig.publicProfile?.businessName||
   appConfig.publicProfile?.name):"";
 if(website&&app&&webName&&appName&&webName!==appName)issues.push({
   id:"different_business_names",surface:"both",position:null,priority:"review",
   title:"Business names differ between website and app",
   ownerAction:"Check the owner's approved public name in both private editors."});
 if(website){
  const name=clean(websiteDraft.businessName)||clean(webBrief.businessName);
  if(!name)issues.push({id:"missing_business_name",surface:"website",
   priority:"important",position:null,title:"Check your business name",
   ownerAction:"Enter your real business name in Business Identity."});
  if(!clean(webBrief.description))issues.push({
   id:"missing_business_description",surface:"website",priority:"review",position:null,
   title:"Tell customers what the business does",
   ownerAction:"Write a factual introduction in the website's content editor."});
 }
 if(app){
  if(!clean(appConfig.publicProfile?.businessName)&&
     !clean(appConfig.publicProfile?.name)){
    issues.push({id:"missing_app_business_name",surface:"app",priority:"important",
      position:null,title:"Check the business name shown in the app",
      ownerAction:"Confirm the Business Brain name and refresh the private app draft."});
  }
 }
 if(websiteInfo&&appInfo){
  // Compare counts only; website may deliberately show a different subset.
  // We do not report missing service names because private service wording
  // is not allowed into this review output.
  if(websiteInfo.count!==appInfo.count)issues.push({
   id:"different_service_counts",surface:"both",position:null,priority:"review",
   title:"Website and app show different service counts",
   ownerAction:"Compare approved services in both editors. A shorter website list may be intentional."});
 }
 issues.sort((a,b)=>Number(b.priority==="important")-Number(a.priority==="important"));
 return {ok:true,kind:"business_service_clarity_v3173",
  websitePresent:!!website,appPresent:!!app,
  websiteServiceCount:websiteInfo?.count??null,
  appServiceCount:appInfo?.count??null,
  appServicesEnabled:!!appServicesEnabled,
  websiteCompleteDescriptions:websiteInfo?.completeServiceDescriptions??null,
  appCompleteDescriptions:appInfo?.completeServiceDescriptions??null,
  matchingServiceNamesCount:matchingServices,
  websiteOnlyServiceNamesCount:websiteOnly,
  appOnlyServiceNamesCount:appOnly,
  sharedBusinessNameAgrees:webName&&appName?webName===appName:null,
  comparisonsArePrivateAndNotAutomaticSynchronisation:true,
  importantCount:issues.filter(i=>i.priority==="important").length,
  totalIssueCount:issues.length,issues:issues.slice(0,24),
  ownerEditsRequired:true,verifiedCustomerCopy:false,
  unchangedSource:true,noPrivateNamesOrDescriptionsReturned:true,
  noGeneratedClaims:true,noAutomaticRewriting:true,
  noPricesInvented:true,noCustomerRecordsRead:true,
  noCrossTenantLearning:true,noPublishing:true,noCharges:true};
}
export {inspectServices,reviewBusinessInformation};

// Private recommendation over the existing bounded owner request sample. No
// customer wording/identity is copied into public drafts or a learning store.
function reviewEnquiryContentGaps({businessId,appId,requests=[],config={},now=Date.now()}={}){
 const deny=()=>({ok:false,suggestions:[],customerTextReturned:false});
 if(!businessId||!appId||!Number.isFinite(now)||!Array.isArray(requests)||requests.length>30||
  requests.some(r=>!r?.id||r.business_id!==businessId||r.mini_app_id!==appId)||new Set(requests.map(r=>r.id)).size!==requests.length)return deny();
 const counts=new Map();let sampled=0;
 for(const request of requests){
  const at=Date.parse(request.created_at||'');
  if(request.request_type!=='enquiry'||!Number.isFinite(at)||at>now||now-at>30*86400000)continue;
  sampled++;
  for(const {id}of enquiryQuestionKinds(request.payload?.message))counts.set(id,(counts.get(id)||0)+1);
 }
 const templates={price:'How are prices and quotations agreed?',availability:'How do I ask about availability?',location:'Where does the business provide its services?',accessibility:'How can I discuss accessibility requirements?',options:'How can I choose the right option?'};
 const faqs=Array.isArray(config.publicProfile?.faqs)?config.publicProfile.faqs:[];
 const covered=new Set(faqs.flatMap(f=>enquiryQuestionKinds(f.question).map(x=>x.id)));
 const suggestions=[...counts].filter(([id,count])=>count>=3&&!covered.has(id)).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0])).slice(0,3).map(([id,count])=>({id,count,question:templates[id],reason:count+' recent enquiry records mention '+id+'. Consider making this clearer in your app and website. No commercial outcome is inferred.'}));
 return {ok:true,suggestions,sampledRecords:sampled,coveragePartial:requests.length>=30,customerTextReturned:false,distinctCustomersVerified:false,privateRecommendationOnly:true,noAutomaticEdits:true};
}
export {reviewEnquiryContentGaps};
