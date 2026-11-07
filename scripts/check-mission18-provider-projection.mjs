import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {mission16Fixture} from './lib/mission16-site-fixtures.mjs';
import {prepareWholeWebsite} from '../src/core/wholeWebsitePlan.mjs';
import {applyWebsitePageChange,renderWebsiteHtml} from '../src/domain/websiteBuilder.js';
import {prepareWebsiteDesignIntelligence,WEBSITE_DESIGN_INTELLIGENCE_VERSION} from '../src/core/websiteDesignIntelligence.mjs';
import {WEBSITE_CREATIVE_SPECIFICATION_VERSION} from '../supabase/functions/busy-website-worker/websiteCreativeSpecification.mjs';
import {projectWebsiteIntelligenceProviderRequest,parseWebsiteIntelligenceProviderResponse} from '../supabase/functions/busy-builder-proposals/websiteIntelligenceProviderProjection.mjs';

const digestBytes=async bytes=>createHash('sha256').update(bytes).digest('hex'),model='synthetic-model-not-a-real-provider';
const context=mission16Fixture(2),whole=prepareWholeWebsite(context,{pageEdit:applyWebsitePageChange,renderPage:renderWebsiteHtml});
assert.equal(whole.ok,true,whole.reason);context.website=whole.candidate;
const prepared=await prepareWebsiteDesignIntelligence(context,{goal:'Keep my words but redesign the whole website',digestBytes});
assert.equal(prepared.ok,true,prepared.reason);
const projection=await projectWebsiteIntelligenceProviderRequest(prepared,context,{model,digestBytes});
assert.equal(projection.ok,true,projection.reason);
const proposal={version:WEBSITE_DESIGN_INTELLIGENCE_VERSION,scope:prepared.scope,explanation:'Synthetic provider transport fixture only. Not a real model result.',specification:{version:WEBSITE_CREATIVE_SPECIFICATION_VERSION,pages:context.website.pages.map(page=>({pageId:page.id,sectionOrder:[...page.sectionIds],opening:'display',measure:'focused',alignment:'offset',rhythm:'balanced',emphasis:'contrast'}))}};
const response={id:'resp_synthetic_intelligence_fixture',model,status:'completed',usage:{input_tokens:3000,output_tokens:900},output:[{type:'message',role:'assistant',content:[{type:'output_text',text:JSON.stringify(proposal)}]}]};
let passed=0;
const test=async(name,run)=>{await run();passed++;console.log('PASS '+name);};
const parse=(value=response,p=projection,c=context)=>parseWebsiteIntelligenceProviderResponse(typeof value==='string'?value:JSON.stringify(value),p,prepared,c,{digestBytes});

await test('complete source/schema/request digests with no dispatch or admitted cost',async()=>{
 assert.equal(projection.inputDigest,prepared.inputDigest);assert.ok(/^[a-f0-9]{64}$/.test(projection.requestDigest));assert.equal(projection.dispatchAllowed,false);assert.equal(projection.tokenCount,null);assert.equal(projection.estimatedGBP,null);assert.equal(projection.providerCalls,0);assert.equal(projection.originalBudgetAdmissionRequired,true);
 assert.equal(projection.wire.store,false);assert.equal(projection.wire.max_output_tokens,1000);assert.equal(projection.wire.service_tier,'default');assert.equal(projection.wire.tool_choice,'none');assert.deepEqual(projection.wire.tools,[]);assert.equal(projection.wire.text.format.strict,true);
});
await test('synthetic response remains unverified, never real-model or save authority',async()=>{
 const result=await parse();assert.equal(result.ok,true,result.reason);assert.equal(result.origin,'unverified-provider-response');assert.equal(result.mayReview,false);assert.equal(result.maySave,false);assert.equal(result.mayPublish,false);assert.equal(result.providerCalls,0);assert.equal(result.accounting.providerReceipt,response.id);assert.equal(result.proposal.specification.pages.length,context.website.pages.length);assert.match(result.receiptStatus,/service-only/);
});
await test('no network, secret or new ledger path',async()=>{
 const source=readFileSync('supabase/functions/busy-builder-proposals/websiteIntelligenceProviderProjection.mjs','utf8');assert.doesNotMatch(source,/\b(?:fetch|transport|readCredential|reserve|dispatch|finish)\s*\(|Deno\.env|process\.env|BUSY_OPENAI_CREATIVE_PILOT_KEY/);
 assert.ok(!readFileSync('supabase/functions/busy-creative-pilot/index.ts','utf8').includes('websiteIntelligenceProviderProjection'));
 assert.match(readFileSync('supabase/functions/busy-builder-proposals/executionBootstrap.mjs','utf8'),/pnjdlogwegnqbsfpcofw/);
});
for(const [name,value] of [['empty',''],['malformed','{oops'],['oversized','x'.repeat(32769)],['wrong-model',{...response,model:'foreign-model'}],['missing-receipt',{...response,id:null}],['invalid-receipt',{...response,id:'arbitrary request'}],['incomplete',{...response,status:'incomplete'}],['tool-output',{...response,output:[{type:'function_call',name:'publish'}]}],['duplicate-message',{...response,output:[response.output[0],response.output[0]]}],['missing-usage',{...response,usage:null}],['negative-usage',{...response,usage:{input_tokens:-1,output_tokens:2}}]])await test(name+' fails closed',async()=>assert.equal((await parse(value)).ok,false));
for(const field of ['input_tokens','output_tokens'])await test(field+' overrun retains actual accounting for original reconciliation',async()=>{
 const result=await parse({...response,usage:{...response.usage,[field]:4001}});assert.equal(result.ok,false);assert.equal(result.accounting[field==='input_tokens'?'inputTokens':'outputTokens'],4001);assert.equal(result.mayReview,false);
});
await test('reasoning item without tools remains parseable',async()=>assert.equal((await parse({...response,output:[{type:'reasoning',summary:[]},response.output[0]]})).ok,true));
for(const [name,change] of [['generation',c=>c.website.generation++],['owner',c=>c.ownerId='foreign-owner'],['business',c=>c.businessId='foreign-business'],['profile-revision',c=>c.profileRevision++],['unsaved-profile',c=>c.profile.description='New unsaved private owner correction'],['owner-wording',c=>c.website.sections.find(s=>s.body).body+=' Changed owner words.']])await test('stale '+name+' denied before accepting output',async()=>{const next=structuredClone(context);change(next);assert.equal((await parse(response,projection,next)).ok,false);assert.equal((await projectWebsiteIntelligenceProviderRequest(prepared,next,{model,digestBytes})).ok,false);});
await test('a copied preparation cannot mint the original sealed creative source',async()=>assert.equal((await projectWebsiteIntelligenceProviderRequest(structuredClone(prepared),context,{model,digestBytes})).ok,false));
for(const [name,change] of [['wire-output-cap',p=>p.wire.max_output_tokens=4000],['wire-tool',p=>p.wire.tools.push({type:'web_search'})],['envelope-digest',p=>p.envelopeDigest='a'.repeat(64)],['source-stamp',p=>p.sourceStamp+='changed'],['forged-cost',p=>p.estimatedGBP=.01]])await test('altered '+name+' denied',async()=>{const p=structuredClone(projection);change(p);assert.equal((await parse(response,p)).ok,false);});
await test('extra executable proposal fields denied after structured response parsing',async()=>{
 const bad=structuredClone(response),proposed=structuredClone(proposal);proposed.specification.pages[0].css='body{display:none}';bad.output[0].content[0].text=JSON.stringify(proposed);assert.equal((await parse(bad)).ok,false);
});
await test('foreign page IDs denied',async()=>{const bad=structuredClone(response),p=structuredClone(proposal);p.specification.pages[0].pageId='foreign-page';bad.output[0].content[0].text=JSON.stringify(p);assert.equal((await parse(bad)).ok,false);});
await test('invalid integrity result denied',async()=>assert.equal((await projectWebsiteIntelligenceProviderRequest(prepared,context,{model,digestBytes:async()=>'-'})).ok,false));
console.log(JSON.stringify({suite:'mission18-provider-projection',passed,failed:0,providerCalls:0,liveModelQualityProven:false,requestBytes:projection.requestBytes,inputDigest:projection.inputDigest,requestDigest:projection.requestDigest}));
