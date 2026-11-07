// Preparation only: real hosted-source evidence enters the ORIGINAL creative
// review/projection and renderer. There is no provider, Auth, save or budget port.
import assert from 'node:assert/strict';
import {stableJson} from '../../src/core/stableJson.mjs';
import {renderWebsiteHtml} from '../../src/domain/websiteBuilder.js';
import {prepareWebsiteCreativeDocument} from '../../src/core/websiteCreativeDocumentReview.mjs';
import {projectWebsiteCreativeDocumentProviderRequest} from '../../supabase/functions/busy-builder-proposals/websiteIntelligenceProviderProjection.mjs';
import {CREATIVE_DOCUMENT_REVISED_PROFILE} from '../../supabase/functions/busy-builder-proposals/creativeDocumentPilotProfiles.mjs';
import {websiteCreativeCopyCatalog} from '../../supabase/functions/busy-website-worker/websiteCreativeCopy.mjs';
import {validateHostedBaselineSource,baselineHash} from './hosted-website-baseline.mjs';
import {quietLightV2DeterministicReview} from './quiet-light-v2-pilot.mjs';

export const HOSTED_CREATIVE_PILOT_VERSION='busy.hosted-source-creative-preparation.v1';
export const HOSTED_CREATIVE_PILOT_MODEL='gpt-6.1-sol';
export const HOSTED_CREATIVE_COMPARISON_VERSION='busy.hosted-source-creative-comparison-preparation.v1';
export const HOSTED_CREATIVE_COMPARISON_MODELS=Object.freeze(['gpt-6.1-sol','gpt-6-astra']);
// This is exactly the request understood by the existing deterministic helper.
// Both candidates therefore receive the same goal and actual approved source.
export const HOSTED_CREATIVE_PILOT_GOAL='Give my website a more premium creative direction';
export const HOSTED_CREATIVE_PROPOSED_INTENT=Object.freeze({version:'busy.website-creative-intent.v1',allowCopySuggestions:true,allowBrandChange:true,allowNewPages:false,allowRetireAiPages:false,ownerRewriteSourceIds:Object.freeze([])});
const clone=x=>JSON.parse(JSON.stringify(x));
const size=value=>Buffer.byteLength(typeof value==='string'?value:stableJson(value),'utf8');
const must=result=>{if(!result?.ok)throw Error(result?.reason||'The original preparation authority refused this source.');return result;};

export function hostedCreativeContext(envelope){
 const {draft,binding,source}=validateHostedBaselineSource(envelope);
 return {ownerId:binding.ownerId,businessId:binding.businessId,website:clone(draft),profile:clone(envelope.readback.packet.profile),profileRevision:source.profileRevision,goal:HOSTED_CREATIVE_PILOT_GOAL,sourcePhotos:[],synthetic:true};
}

// Fixed, server-reviewed comparison preparation only. The two independently
// hashed requests share one actual source, intent, goal, schema and renderer.
// No operation identity, account entitlement, token count, tariff or execution
// approval can be supplied here. The prior deterministic candidate renders
// once; there is no fabricated model response or second Website Builder.
export async function prepareHostedCreativeComparison(envelope,options={}){
 assert.ok(options&&typeof options==='object'&&!Array.isArray(options)&&Object.keys(options).length===0,'Comparison preparation cannot accept model, financial, action or credential overrides');
 const before=stableJson(envelope),base=await prepareHostedCreativePilot(envelope),contextBefore=stableJson(base.context),proposals=[];
 const comparisonLimits=[{inputTokens:8000,outputTokens:12000,maximumGBP:.25,requests:1,retries:0},{inputTokens:8000,outputTokens:12000,maximumGBP:1,requests:1,retries:0}];
 for(const [index,model] of HOSTED_CREATIVE_COMPARISON_MODELS.entries()){
  const projection=must(await projectWebsiteCreativeDocumentProviderRequest(base.prepared,base.context,{model,budgetProfile:CREATIVE_DOCUMENT_REVISED_PROFILE,digestBytes:async bytes=>baselineHash(bytes)}));
  assert.equal(projection.budgetProfile,CREATIVE_DOCUMENT_REVISED_PROFILE);
  assert.deepEqual(projection.limits,comparisonLimits[index]);
  assert.equal(projection.wire.reasoning.effort,'medium');
  assert.equal(projection.dispatchAllowed,false);assert.equal(projection.maySave,false);assert.equal(projection.mayPublish,false);
  assert.equal(projection.inputDigest,base.projection.inputDigest,'Both models require the same complete approved business information');
  assert.equal(projection.schemaDigest,base.projection.schemaDigest,'Both models require the same renderer grammar/schema');
  const wire=stableJson(projection.wire),contact=base.context.profile.contact||{};
  for(const value of [contact.email,contact.phone,envelope.approvedBinding.executionId,envelope.approvedBinding.requestNonce].filter(Boolean))assert.ok(!wire.includes(value),'Raw contacts, credentials and consumed B3 permits must not enter a model request');
  const input=stableJson(base.prepared.input),schema=stableJson(projection.wire.text.format.schema);
  proposals.push({order:index+1,model,budgetProfile:CREATIVE_DOCUMENT_REVISED_PROFILE,status:'proposal-only-not-authorized',projection,measuredBytes:{kind:'Measured UTF-8 bytes only; never provider token counts',input:{bytes:size(input),sha256:baselineHash(input)},strictSchema:{bytes:size(schema),sha256:baselineHash(schema)},completeWire:{bytes:size(wire),sha256:baselineHash(wire)},compatibleCompleteRequestTokens:null,providerOutputTokens:null,completeInputFit:'not-established',completeThreePageOutputFit:'not-established'},liveCandidate:null,providerCalls:0,sourceWrites:0,accountSaved:false,publication:false});
 }
 assert.ok(stableJson(base.context)===contextBefore,'Comparison preparation changed the approved source');
 assert.ok(stableJson(envelope)===before,'Comparison preparation changed the original read-only export');
 assert.notEqual(proposals[0].projection.requestDigest,proposals[1].projection.requestDigest,'Separate model requests require separate immutable wire identities');
 return {version:HOSTED_CREATIVE_COMPARISON_VERSION,origin:'verified-hosted-source-sol-first-astra-comparison-preparation',source:base.source,context:base.context,prepared:base.prepared,proposedIntent:base.proposedIntent,proposals,deterministic:base.deterministic,
  budgetProposal:{status:'owner-approved-ceilings-only-not-execution',firstModel:HOSTED_CREATIVE_COMPARISON_MODELS[0],laterModel:HOSTED_CREATIVE_COMPARISON_MODELS[1],firstSolMaximumGBP:.25,astraMaximumGBP:1,cumulativeComparisonMaximumGBP:3,maximumInferenceRequests:2,inferenceRequestsPerModel:1,firstSolIncludedInAggregate:true,astraIncludedInAggregate:true,paidInvalidOrInferiorResultsConsumeAttempt:true,retries:0,fallbacks:0,tools:0,accountOrCountingRequestsAuthorized:false},
  liveCandidates:{sol:null,astra:null},dispatchAllowed:false,providerCalls:0,providerTokens:null,providerCostGBP:0,nativeSignIns:0,sourceWrites:0,accountSaved:false,publication:false,privacy:base.privacy,
  requiresSeparateOwnerApproval:true,originalBudgetAdmissionRequired:true,independentUsageSettlementRequired:true,originalStudioSaveAuthorityRequired:true,
  limitations:[...base.limitations,'The revised per-model limits are source preparation only. Current hosted policy remains disabled/zero; original tariff compatibility, account access, complete counting, all-in GBP pricing and separately reviewed execution are still required.','The first Sol and later Astra requests each need their own immutable operation, nonce, reservation/readback and short-lived approval. No reserved, dispatched or unknown liability can be discarded to fund the other arm.','The same explicit reasoning setting is proposed for both models, not proof of equal internal computation or complete useful output fit.']};
}

export async function prepareHostedCreativePilot(envelope,options={}){
 assert.ok(options&&typeof options==='object'&&!Array.isArray(options),'Preparation options must be an object');
 assert.ok(Object.keys(options).every(k=>k==='model'),'Preparation cannot accept actions, credentials, new goals or financial limits');
 const model=options.model??HOSTED_CREATIVE_PILOT_MODEL;
 assert.ok(model===HOSTED_CREATIVE_PILOT_MODEL,'A different model needs its own reviewed experiment');
 const before=stableJson(envelope),validated=validateHostedBaselineSource(envelope),context=hostedCreativeContext(envelope),sourceBefore=stableJson(context);
 const proposedIntent=clone(HOSTED_CREATIVE_PROPOSED_INTENT);
 const prepared=must(await prepareWebsiteCreativeDocument(context,{goal:context.goal,approvedIntent:proposedIntent,digestBytes:async bytes=>baselineHash(bytes)}));
 const projection=must(await projectWebsiteCreativeDocumentProviderRequest(prepared,context,{model,digestBytes:async bytes=>baselineHash(bytes)}));
 assert.deepEqual(projection.limits,{inputTokens:4000,outputTokens:4000,maximumGBP:.10,requests:1,retries:0});
 assert.equal(projection.dispatchAllowed,false);assert.equal(projection.maySave,false);assert.equal(projection.mayPublish,false);
 const input=stableJson(prepared.input),schema=stableJson(projection.wire.text.format.schema),wire=stableJson(projection.wire);
 const contact=context.profile.contact||{};
 for(const value of [contact.email,contact.phone].filter(Boolean))assert.ok(!wire.includes(value),'Raw contact values must remain local');
 for(const value of [validated.binding.executionId,validated.binding.requestNonce])assert.ok(!wire.includes(value),'B3 execution permits must never enter a model request');
 const catalogue=must(websiteCreativeCopyCatalog(context.website));
 const protectedSources=catalogue.sources.filter(x=>x.ownerProtected===true);
 assert.ok(protectedSources.length>=2);
 assert.ok(prepared.input.approved.copyCatalog.sources.some(x=>x.id==='section:hero:cta'&&x.ownerProtected===true));
 assert.ok(protectedSources.every(x=>prepared.input.approved.copyCatalog.sources.some(y=>y.id===x.id&&y.text===x.text&&y.ownerProtected===true)));
 // This existing finite recommendation runs against context.website. No
 // fixture factory, authored model response, Keep or hosted save is invoked.
 const review=quietLightV2DeterministicReview(context);
 assert.equal(review.creativeDirection.origin,'deterministic-recommendation');
 assert.equal(review.accountSaved,false);assert.equal(review.neverPublishes,true);
 const candidate=review.candidate,pages=[];
 for(const page of candidate.pages){
  const html=renderWebsiteHtml(candidate,page.id,{standalone:true});
  assert.ok(![validated.binding.ownerId,validated.binding.businessId,validated.binding.executionId,validated.binding.requestNonce].some(value=>html.includes(value)),'Private native binding in rendered candidate');
  const requiredVisibleText=[];
  for(const id of page.sectionIds){const section=candidate.sections.find(x=>x.id===id);if(!section)continue;
   if(section.type==='services')for(const item of section.items)requiredVisibleText.push(item.title,item.body);
   else {if(section.title)requiredVisibleText.push(section.title);if(section.body)requiredVisibleText.push(section.body);}
  }
  pages.push({id:page.id,title:page.title,path:page.path,outputPath:page.outputPath,html,htmlSha256:baselineHash(html),bytes:size(html),requiredVisibleText});
 }
 assert.deepEqual(pages.map(x=>x.id),['home','services','contact']);
 for(const item of protectedSources){const check=must(websiteCreativeCopyCatalog(candidate)).sources.find(x=>x.id===item.id);assert.ok(check&&check.text===item.text&&check.ownerProtected===true,'Deterministic candidate changed protected wording');}
 assert.ok(stableJson(context)===sourceBefore,'Preparation or recommendation changed the source context');
 assert.ok(stableJson(envelope)===before,'Preparation changed the original read-only export');
 const measuredBytes={kind:'Measured UTF-8 bytes only; never provider token counts',input:{bytes:size(input),sha256:baselineHash(input)},strictSchema:{bytes:size(schema),sha256:baselineHash(schema)},completeWire:{bytes:size(wire),sha256:baselineHash(wire)},compatibleCompleteRequestTokens:null,providerOutputTokens:null,completeInputFit:'not-established',completeThreePageOutputFit:'not-established'};
 return {version:HOSTED_CREATIVE_PILOT_VERSION,origin:'verified-hosted-source-original-v2-preparation',source:validated.source,context,proposedIntent,prepared,projection,measuredBytes,
  deterministic:{origin:'deterministic-recommendation-from-verified-hosted-source',goal:context.goal,requiresOwnerReview:true,reviewedPreviewProposal:true,accountSaved:false,liveModelExecuted:false,candidate,pages,operation:review.operation,sourceStamp:review.sourceStamp},
  liveCandidate:null,dispatchAllowed:false,providerCalls:0,providerTokens:null,providerCostGBP:0,nativeSignIns:0,sourceWrites:0,accountSaved:false,publication:false,
  privacy:{rawContactValuesProjected:false,credentialsProjected:false,b3ExecutionPermitProjected:false,nativeOwnerBusinessAndWebsiteScopeProjected:true,nativeScopeRequiresSeparateExternalInputReview:true},
  requiresSeparateOwnerApproval:true,originalBudgetAdmissionRequired:true,independentUsageSettlementRequired:true,originalStudioSaveAuthorityRequired:true,
  limitations:['This private preparation does not prove provider account/model eligibility, token fit, an applicable all-in GBP tariff or central reservation.','The proposed copy/brand intent needs separate owner approval; protected story and action rewrite permissions remain empty.','The original model schema currently carries native owner/business/Website scope. That exact external input needs explicit review before any provider request.','Serialized preparation files are evidence only; the live server must rebuild its original sealed request from a fresh authenticated source.','The deterministic candidate is an unsaved proposal; there is no model candidate or model-quality claim.']};
}
