// Coordinates existing planners; no new content, renderer, publisher or AI engine.
import {buildBusinessBrandDnaSnapshot} from './businessBrandDnaV3195.mjs';
import {planUniversalBuilderRequest} from './universalBuilderPlanV3210.mjs';
import {planAppToWebsiteDesign} from './appToWebsiteBrandTransferV3196.mjs';
import {websiteDraftHasScope} from './websiteDraftScope.mjs';
const fail=reason=>({ok:false,reason,neverPublishes:true});
function planReviewedWebsiteComposition({website,app,businessId,pageId='home',request='',brandSource='website'}={}){
 if(!websiteDraftHasScope(website,businessId)||!['website','app'].includes(brandSource)||typeof request!=='string'||!request.trim()||request.length>400||
  !website.pages?.some(p=>p.id===pageId&&p.enabled!==false))return fail('Choose this business’s current page, a short customer goal and a branding source.');
 const dna=buildBusinessBrandDnaSnapshot({website,app,businessId});if(!dna.ok)return fail(dna.reason);
 const universal=planUniversalBuilderRequest({website,app,businessId,request,businessType:website.businessType||'',catalog:[]});
 if(!universal.ok||!universal.sectionPlan?.ok)return fail(universal.reason||'Review the existing page structure first.');
 const operations=[],changes=[],section=universal.sectionPlan;
 if(section.changesSuggested){operations.push({action:'apply-reviewed-composition',websiteId:website.id,expectedGeneration:website.generation,
  expectedBusinessId:businessId,before:section.before,proposed:section.proposed});changes.push('Section order: '+section.proposed.join(' → '));}
 if(brandSource==='app'){
  const brand=planAppToWebsiteDesign({website,app,businessId,mode:'adapt',includeDesign:true,allowUnchanged:true});
  if(!brand.ok)return fail(brand.reason);operations.push(...brand.operations);changes.push(...brand.changes);
 }
 const source={businessId,websiteId:website.id,websiteGeneration:website.generation,appId:app.id,appRevision:app.draft_revision};
 const exactReview=JSON.stringify({source,pageId,request:request.trim(),brandSource,dna,operations,websiteTheme:website.theme||{}});
 return {ok:true,kind:'reviewed_website_composition_v1',...source,pageId,request:request.trim(),brandSource,
  evidence:{kind:'reviewed_website_composition_v1',...source,pageId,request:request.trim(),brandSource,exactReview},
  operations,changes,canPrepare:operations.length>0,ownerOrderPreserved:section.ownerOrderPreserved===true,
  conflicts:dna.conflicts,missingContent:section.contentNotYetReady||[],unimplemented:universal.requestedFeaturesNeedingReview,
  explanation:section.reason,brandExplanation:brandSource==='website'?'Retain this website’s colours, typography and destination choices.':'Adapt the current app colour, typography and service layout; website content and approved media remain unchanged.',
  ownerApprovalRequired:true,neverPublishes:true,noVisualQualityProof:true};
}
function reviewedWebsiteCompositionCurrent(evidence,input){
 if(evidence?.kind!=='reviewed_website_composition_v1')return false;
 const plan=planReviewedWebsiteComposition({...input,pageId:evidence.pageId,request:evidence.request,brandSource:evidence.brandSource});
 return plan.ok&&plan.evidence.exactReview===evidence.exactReview;
}
function prepareReviewedWebsiteComposition(evidence,input,{layoutEdit}={}){
 if(!reviewedWebsiteCompositionCurrent(evidence,input)||typeof layoutEdit!=='function')return fail('The app, website, branding or goal changed. Review the complete design again.');
 const plan=planReviewedWebsiteComposition({...input,pageId:evidence.pageId,request:evidence.request,brandSource:evidence.brandSource});
 if(!plan.canPrepare)return fail('No supported change is needed. Keep the current design.');
 let draft=input.website;
 for(const operation of plan.operations){const result=layoutEdit(draft,operation);if(!result?.applied)return fail(result?.reason||'A locked or unsupported change stopped this proposal.');draft=result.draft;}
 return {...plan,draft,id:'reviewed-whole-page',label:'Reviewed whole-page composition',
  compositionEvidence:plan.evidence,explanation:plan.explanation+' '+plan.brandExplanation,
  tradeoff:'Reordering is shared across pages; branding changes affect the website theme. Measure every relevant width and inspect other pages before keeping it.'};
}
export {planReviewedWebsiteComposition,reviewedWebsiteCompositionCurrent,prepareReviewedWebsiteComposition};
