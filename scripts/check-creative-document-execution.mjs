import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {prepareQuietLightV2Pilot} from './lib/quiet-light-v2-pilot.mjs';
import {applyWebsitePageChange,renderWebsiteHtml} from '../src/domain/websiteBuilder.js';
import {keepWholeWebsite,isCurrentWholeWebsite} from '../src/core/wholeWebsitePlan.mjs';
import {reviewWebsiteCreativeDocumentProposal,reviewSettledWebsiteCreativeDocumentProposal} from '../src/core/websiteCreativeDocumentReview.mjs';
import {createLabCreativeDocumentExecutionHandler,disabledCreativeDocumentExecution} from '../supabase/functions/busy-builder-proposals/creativeDocumentExecutionBootstrap.mjs';
import {createLiveCreativeDocumentAdapter,createDenoLiveCreativeDocumentAdapter,CREATIVE_DOCUMENT_LAB_URL,CREATIVE_DOCUMENT_LAB_KEY} from '../supabase/functions/busy-builder-proposals/creativeDocumentExecution.mjs';
import {WEBSITE_CREATIVE_DOCUMENT_PROVIDER_VERSION} from '../supabase/functions/busy-builder-proposals/websiteIntelligenceProviderProjection.mjs';
import {createOriginalCreativeLedger,createOriginalCreativeDocumentLedger} from '../supabase/functions/busy-builder-proposals/creativeLedger.mjs';
import {createLiveCreativeAdapter} from '../supabase/functions/busy-builder-proposals/liveCreativeAdapter.mjs';
import {prepareCreativeComparison} from '../src/core/websiteCreativeComparison.mjs';

// Entirely synthetic ports and credentials. No environment read, real HTTP,
// token endpoint, account, provider usage, central hosted reservation or save.
const now=Date.parse('2026-11-06T18:00:00Z');
const integrity={sha256:async value=>createHash('sha256').update(value).digest('hex')};
const clone=value=>JSON.parse(JSON.stringify(value));
const planner={pageEdit:applyWebsitePageChange,renderPage:renderWebsiteHtml};
let passed=0;
async function test(name,run){await run();passed++;console.log('PASS '+name);}
// Advance only the private provider deadlines. Body parsing and the original
// source/budget ports keep their real implementation; no 60-second test sleep.
async function virtualProviderClock(run){
 const originalSetTimeout=globalThis.setTimeout,originalClearTimeout=globalThis.clearTimeout;
 let elapsed=0;const timers=new Map(),scheduled=[];
 globalThis.setTimeout=(callback,delay,...args)=>{
  if(![15000,60000].includes(delay))return originalSetTimeout(callback,delay,...args);
  const id={providerTimer:true};timers.set(id,{callback:()=>callback(...args),deadline:elapsed+delay});scheduled.push(delay);return id;
 };
 globalThis.clearTimeout=id=>timers.has(id)?timers.delete(id):originalClearTimeout(id);
 const clock={scheduled,get elapsed(){return elapsed;},advanceTo(value){assert.ok(value>=elapsed);elapsed=value;for(const [id,timer] of [...timers])if(timer.deadline<=elapsed){timers.delete(id);timer.callback();}}};
 try{return await run(clock);}finally{globalThis.setTimeout=originalSetTimeout;globalThis.clearTimeout=originalClearTimeout;}
}

async function fixture(){
 const pilot=await prepareQuietLightV2Pilot({model:'synthetic-v2-model-not-a-real-provider'}),context=pilot.context,projection=pilot.projection;
 const operationId='20202020-2020-4202-8202-000000000001',requestNonce='20202020-2020-4202-8202-000000000002';
 const binding={surface:'website',pageId:'home',projectId:context.website.id,sourceRevision:context.website.generation,profileRevision:context.profileRevision,snapshotRevision:1};
 const execution={ownerId:context.ownerId,businessId:context.businessId,operationId,requestNonce,binding,goal:context.goal,approvedIntent:clone(pilot.fixture.approvedIntent),expectedPageIds:['home','services','contact'],provider:'openai-responses',model:projection.model,inputDigest:projection.envelopeDigest,sourceInputDigest:projection.inputDigest,schemaDigest:projection.schemaDigest,wireDigest:projection.requestDigest,approvalReceipt:'synthetic-v2-owner-approved-artifact',
  approval:{protocol:WEBSITE_CREATIVE_DOCUMENT_PROVIDER_VERSION,authenticated:true,founder:true,syntheticOnly:true,ownerId:context.ownerId,businessId:context.businessId,operationId,inputDigest:projection.envelopeDigest,sourceInputDigest:projection.inputDigest,schemaDigest:projection.schemaDigest,wireDigest:projection.requestDigest,provider:'openai-responses',model:projection.model,inputTokenLimit:4000,totalOutputTokenLimit:4000,spendingCeilingGBP:.10,expiresAt:now+60000,receipt:'synthetic-v2-owner-approved-artifact'},
  tariff:{provider:'openai-responses',model:projection.model,currency:'GBP',independentlyVerified:true,allFeesIncluded:true,modelAvailable:true,availabilityVerified:true,serviceTier:'default',regionalProcessing:false,caching:false,rateBasis:'highest-applicable-all-in',rateEvidence:{independentlyVerified:true,coversCacheWrite:true,coversFXTaxAndFees:true,reference:'Synthetic all-in fee coverage; never evidence of a live account'},fixedRequestGBP:0,inputGBPPerMillion:1,outputGBPPerMillion:2,revision:'1',reference:'synthetic tariff for engineering tests only',checkedAt:now},
  tokenEvidence:{tokens:3000,independentlyVerified:true,reference:'synthetic complete-request counter for tests only',wireDigest:projection.requestDigest,model:projection.model,checkedAt:now,completeRequest:true,method:'responses-input-tokens'}};
 const payload={id:'resp_synthetic_v2_execution',model:projection.model,status:'completed',service_tier:'default',usage:{input_tokens:3000,output_tokens:3500,output_tokens_details:{reasoning_tokens:500}},output:[{type:'reasoning',id:'rs_synthetic_fixture',summary:[]},{type:'message',role:'assistant',content:[{type:'output_text',text:JSON.stringify(pilot.fixture.response)}]}]};
 let manifest={...disabledCreativeDocumentExecution,enabled:true,executionEnabled:true,execution},record=null,calls=0,secretReads=0,auths=0,receiptReads=0,lastResult=null;
 const deps={projectUrl:CREATIVE_DOCUMENT_LAB_URL,readManifest:async()=>manifest,clock:()=>now,integrity,planner,
  authenticate:async()=>{auths++;return {id:context.ownerId};},
  rpc:async(name,args)=>{
   assert.equal(args.p_actor,context.ownerId);assert.equal(args.p_business,context.businessId);
   if(name==='busy_ai_context_v1'){assert.deepEqual(args.p_binding,binding);return {ownerId:context.ownerId,businessId:context.businessId,project:context.website,profile:context.profile,catalog:[]};}
   assert.equal(args.p_operation,operationId);assert.equal(args.p_request_nonce,requestNonce);
   if(name==='busy_ai_reserve_v1'){
    if(record)return {fresh:false};
    record={operationId,state:'reserved',attempts:0,goalHash:args.p_goal_hash,model:execution.model,tariffRevision:1,maximumMicroGBP:12000,actualMicroGBP:null,pricing:{max_input:4000,max_output:4000,input_micro_per_1000:1000,output_micro_per_1000:2000,fx_gbp_ppm:1000000,buffer_bps:0},binding:clone(binding),createdAt:new Date(now).toISOString()};return {fresh:true};
   }
   if(name==='busy_ai_operation_read_v1'){receiptReads++;return clone(record);}
   if(name==='busy_ai_dispatch_v1'){if(record.state!=='reserved'||record.attempts!==0||Date.parse(record.createdAt)+30000<=now)throw Error('No replay');record.state='dispatched';record.attempts=1;return {};}
   if(name==='busy_ai_finish_v1'){
    if(record?.state==='settled')return {};
    if(args.p_outcome==='released'&&record?.state!=='reserved')throw Error('Retain liability');
    if(args.p_outcome==='settled')Object.assign(record,{state:'settled',inputTokens:args.p_input,outputTokens:args.p_output,providerReceipt:args.p_receipt,actualMicroGBP:args.p_input+2*args.p_output});else record.state=args.p_outcome;
    return {};
   }
   throw Error('Unexpected original RPC');
  },
  adapterFactory:ports=>{const adapter=createLiveCreativeDocumentAdapter({...ports,readCredential:async()=>{secretReads++;return 'synthetic-lab-v2-test-credential-only';}});return async prepared=>{lastResult=await adapter(prepared);return lastResult;};},
  transport:async(url,options)=>{calls++;assert.equal(url,'https://api.openai.com/v1/responses');assert.equal(options.redirect,'error');assert.equal(options.headers.Authorization,'Bearer synthetic-lab-v2-test-credential-only');const wire=JSON.parse(options.body);assert.equal(wire.max_output_tokens,4000);assert.deepEqual(wire.tools,[]);assert.equal(wire.tool_choice,'none');assert.equal(wire.store,false);assert.equal(wire.service_tier,'default');assert.equal(await integrity.sha256(options.body),execution.wireDigest);return new Response(JSON.stringify(payload),{headers:{'content-type':'application/json'}});}
 };
 const request=(patch={},body={version:2,operationId})=>new Request('https://local.invalid/creative-document-pilot',{method:'POST',headers:{'content-type':'application/json',authorization:'Bearer synthetic-authentication-token-only'},body:JSON.stringify(body),...patch});
 return {pilot,context,execution,deps,payload,request,handler:()=>createLabCreativeDocumentExecutionHandler(deps),get record(){return record;},get calls(){return calls;},get secretReads(){return secretReads;},get auths(){return auths;},get receiptReads(){return receiptReads;},get result(){return lastResult;},get manifest(){return manifest;},set manifest(value){manifest=value;}};
}
await test('v2 authenticated bootstrap uses original ledger, fixed Lab and total-usage settlement before original review',async()=>{
 const f=await fixture(),response=await f.handler()(f.request()),body=await response.json();
 assert.equal(response.status,200,JSON.stringify(body));assert.equal(body.protocol,WEBSITE_CREATIVE_DOCUMENT_PROVIDER_VERSION);assert.equal(body.origin,'real-model');assert.equal(body.maySave,false);assert.equal(body.mayPublish,false);assert.equal(body.mayRetry,false);assert.equal(f.calls,1);assert.equal(f.record.state,'settled');assert.equal(f.record.outputTokens,3500);assert.equal(body.receipt.outputTokens,3500,'Total output includes hidden reasoning, not visible-text estimates');assert.equal(body.review.creativeDirection.liveModelExecuted,true);assert.equal(body.review.stats.measuredTokenUsage.totalOutput,3500);assert.equal(f.receiptReads,5,'Reserve readback, admission, dispatch, settlement and independent review readback');assert.ok(!JSON.stringify(body).includes('synthetic-lab-v2-test-credential'));assert.equal(f.context.website.creativeDocumentPageModel,undefined,'A review must not change the owner website');
});
await test('default-disabled Lab rejects before authentication, environment reads or reservations',async()=>{
 const f=await fixture();f.manifest=disabledCreativeDocumentExecution;const r=await f.handler()(f.request());assert.equal(r.status,503);assert.equal(f.auths,0);assert.equal(f.secretReads,0);assert.equal(f.record,null);assert.equal(f.calls,0);
 assert.match(readFileSync('supabase/config.toml','utf8'),/\[functions\.busy-creative-document-pilot\]\s*verify_jwt = true/);
 assert.ok(!readFileSync('supabase/functions/busy-builder-proposals/index.ts','utf8').includes('creativeDocumentExecution'));
});
for(const kind of ['missing-auth','wrong-owner','anonymous','missing-approval','legacy-approval','expired-approval','wrong-approval-limit','wrong-approval-digest','wrong-wire','wrong-source','stale-profile','foreign-project','wrong-region','wrong-organisation','client-activation','legacy-body','foreign-operation','partial-token-count','forged-token-digest','input-4001','unverified-model-access','wrong-tariff','expensive-tariff','nonstandard-tier','regional-surcharge','expired-tariff','missing-token-evidence','missing-tariff','unproved-cache-cost'])await test('denies '+kind+' before a provider credential or dispatch',async()=>{
 const f=await fixture();let request=f.request();
 if(kind==='missing-auth')request=f.request({headers:{'content-type':'application/json'}});
 if(kind==='wrong-owner')f.deps.authenticate=async()=>({id:'20202020-2020-4202-8202-000000000003'});
 if(kind==='anonymous')f.deps.authenticate=async()=>({id:f.context.ownerId,anonymous:true});
 if(kind==='missing-approval')f.execution.approval=null;
 if(kind==='legacy-approval')f.execution.approval.protocol='busy.live-creative-pilot.v1';
 if(kind==='expired-approval')f.execution.approval.expiresAt=now-1;
 if(kind==='wrong-approval-limit')f.execution.approval.totalOutputTokenLimit=1000;
 if(kind==='wrong-approval-digest')f.execution.approval.sourceInputDigest='a'.repeat(64);
 if(kind==='wrong-wire')f.execution.wireDigest='a'.repeat(64);
 if(kind==='wrong-source'){const rpc=f.deps.rpc;f.deps.rpc=async(name,args)=>name==='busy_ai_context_v1'?{...await rpc(name,args),businessId:'foreign'}:rpc(name,args);}
 if(kind==='stale-profile')f.context.profile.toneOfVoice='Changed owner correction after review';
 if(kind==='foreign-project')f.deps.projectUrl='https://pnjdlogwegnqbsfpcofw.supabase.co';
 if(kind==='wrong-region')f.manifest.region='eu-west-2';
 if(kind==='wrong-organisation')f.manifest.organisationId='foreign';
 if(kind==='client-activation')request=f.request({}, {version:2,operationId:f.execution.operationId,enabled:true,key:'synthetic-attack'});
 if(kind==='legacy-body')request=f.request({}, {version:1,operationId:f.execution.operationId});
 if(kind==='foreign-operation')request=f.request({}, {version:2,operationId:'20202020-2020-4202-8202-000000000003'});
 if(kind==='partial-token-count')f.execution.tokenEvidence.completeRequest=false;
 if(kind==='forged-token-digest')f.execution.tokenEvidence.wireDigest='a'.repeat(64);
 if(kind==='input-4001')f.execution.tokenEvidence.tokens=4001;
 if(kind==='unverified-model-access')f.execution.tariff.availabilityVerified=false;
 if(kind==='wrong-tariff')f.execution.tariff.currency='USD';
 if(kind==='expensive-tariff')f.execution.tariff.outputGBPPerMillion=100;
 if(kind==='nonstandard-tier')f.execution.tariff.serviceTier='priority';
 if(kind==='regional-surcharge')f.execution.tariff.regionalProcessing=true;
 if(kind==='expired-tariff')f.execution.tariff.checkedAt=now-86400001;
 if(kind==='missing-token-evidence')f.execution.tokenEvidence=null;
 if(kind==='missing-tariff')f.execution.tariff=null;
 if(kind==='unproved-cache-cost')delete f.execution.tariff.rateEvidence;
 assert.notEqual((await f.handler()(request)).status,200);assert.equal(f.calls,0);assert.equal(f.secretReads,0);
});
await test('expired central reservation, wrong tariff bounds, altered goal hash and foreign receipt fail closed',async()=>{
 for(const kind of ['expired','legacy-output','input-bound','uncovered','goal-hash','foreign-binding','underpriced-input','underpriced-output']){
  const f=await fixture(),rpc=f.deps.rpc;
  f.deps.rpc=async(name,args)=>{const value=await rpc(name,args);if(name!=='busy_ai_operation_read_v1')return value;if(kind==='expired')value.createdAt=new Date(now-31000).toISOString();if(kind==='legacy-output')value.pricing.max_output=1000;if(kind==='input-bound')value.pricing.max_input=4001;if(kind==='uncovered')value.maximumMicroGBP=11999;if(kind==='goal-hash')value.goalHash='forged';if(kind==='foreign-binding')value.binding.projectId='foreign';if(kind==='underpriced-input')value.pricing.input_micro_per_1000=1;if(kind==='underpriced-output')value.pricing.output_micro_per_1000=1;return value;};
  assert.notEqual((await f.handler()(f.request())).status,200,kind);assert.equal(f.calls,0);assert.equal(f.secretReads,0);
 }
});
await test('concurrent handlers and cold starts cannot dispatch the same original operation twice',async()=>{
 const f=await fixture(),responses=await Promise.all([f.handler()(f.request()),f.handler()(f.request())]);assert.equal(responses.filter(response=>response.status===200).length,1);assert.equal(f.calls,1);assert.equal(f.record.attempts,1);assert.equal(f.record.state,'settled');assert.notEqual((await f.handler()(f.request())).status,200);assert.equal(f.calls,1);
});
await test('lost reserve or dispatch acknowledgement is never replayed',async()=>{
 for(const kind of ['reserve','dispatch']){
  const f=await fixture(),rpc=f.deps.rpc;f.deps.rpc=async(name,args)=>{const result=await rpc(name,args);if(name===(kind==='reserve'?'busy_ai_reserve_v1':'busy_ai_dispatch_v1'))throw Error('Synthetic lost acknowledgement');return result;};
  const response=await f.handler()(f.request()),body=await response.json();assert.notEqual(response.status,200);assert.equal(body.inspectOriginalReceipt,true);assert.equal(f.calls,0);assert.equal(f.record.state,kind==='reserve'?'reserved':'unknown');assert.notEqual((await f.handler()(f.request())).status,200);assert.equal(f.calls,0);
 }
});
await test('lost finish acknowledgement succeeds only through independent original settlement readback',async()=>{
 const f=await fixture(),rpc=f.deps.rpc;f.deps.rpc=async(name,args)=>{const result=await rpc(name,args);if(name==='busy_ai_finish_v1'&&args.p_outcome==='settled')throw Error('Synthetic lost finish acknowledgement');return result;};assert.equal((await f.handler()(f.request())).status,200);assert.equal(f.calls,1);assert.equal(f.record.state,'settled');
});
await test('central account denial and current membership revocation prevent dispatch',async()=>{
 for(const cutoff of ['admission','before-dispatch','after-dispatch']){
  const f=await fixture(),rpc=f.deps.rpc;let revoked=false;
  f.deps.rpc=async(name,args)=>{
   if(cutoff==='admission'&&name==='busy_ai_reserve_v1')throw Error('Original entitlement/account unavailable');
   if(name==='busy_ai_context_v1'&&revoked)throw Error('Original current membership revoked');
   const result=await rpc(name,args);
   if(cutoff==='before-dispatch'&&name==='busy_ai_operation_read_v1'&&result.state==='reserved')revoked=true;
   if(cutoff==='after-dispatch'&&name==='busy_ai_dispatch_v1')revoked=true;
   return result;
  };
  assert.notEqual((await f.handler()(f.request())).status,200,cutoff);assert.equal(f.calls,0,cutoff);if(cutoff!=='after-dispatch')assert.equal(f.secretReads,0,cutoff);
 }
});
await test('post-dispatch cancellation or manifest revocation retains unknown liability with no HTTP call',async()=>{
 for(const kind of ['abort','manifest']){
  const f=await fixture(),rpc=f.deps.rpc,controller=new AbortController();
  f.deps.rpc=async(name,args)=>{const result=await rpc(name,args);if(name==='busy_ai_dispatch_v1'){if(kind==='abort')controller.abort();else f.manifest=disabledCreativeDocumentExecution;}return result;};
  const response=await f.handler()(f.request({signal:controller.signal}));assert.equal((await response.json()).code,'unknown-outcome',kind);assert.equal(f.calls,0);assert.equal(f.record.state,'unknown');assert.equal(f.record.attempts,1);
 }
});
await test('non-Home service and contact corrections invalidate the full-page source seal',async()=>{
 for(const kind of ['service','contact']){
  const f=await fixture(),rpc=f.deps.rpc;let changed=false;
  f.deps.rpc=async(name,args)=>{const result=await rpc(name,args);if(!changed&&name==='busy_ai_operation_read_v1'&&result.state==='reserved'){changed=true;if(kind==='service')f.context.website.sections.find(section=>section.type==='services').items[0].body='New protected service words';else f.context.website.sections.find(section=>section.type==='contact').email='new-approval@example.invalid';}return result;};
  assert.notEqual((await f.handler()(f.request())).status,200,kind);assert.equal(f.calls,0);assert.equal(f.secretReads,0);
 }
});
await test('whole-site pilot requires all three purposeful proposal pages, not a Home-only valid document',async()=>{
 for(const kind of ['home-only','wrong-purpose']){
  const f=await fixture(),proposal=clone(f.pilot.fixture.response);
  if(kind==='home-only')proposal.document.pages=proposal.document.pages.slice(0,1);else proposal.document.pages[1].purpose='about';
  f.payload.output[1].content[0].text=JSON.stringify(proposal);
  const response=await f.handler()(f.request());assert.notEqual(response.status,200);assert.equal(f.calls,1);assert.equal(f.record.state,'settled');assert.equal(f.context.website.creativeDocumentPageModel,undefined);
 }
});
await test('legacy original ledger cannot admit the v2 4,000-output tariff',async()=>{
 const f=await fixture(),e=f.execution;
 const legacy=createOriginalCreativeLedger({rpc:f.deps.rpc,actor:e.ownerId,business:e.businessId,binding:e.binding,operationId:e.operationId,requestNonce:e.requestNonce,integrity,clock:()=>now});
 const request={operationId:e.operationId,scope:{ownerId:e.ownerId,businessId:e.businessId,projectId:e.binding.projectId,sourceRevision:e.binding.sourceRevision,profileRevision:e.binding.profileRevision,surface:'website',pageId:'home'},digest:e.inputDigest,requestDigest:e.wireDigest,provider:e.provider,model:e.model,inputTokens:3000,maxOutputTokens:1000,estimatedGBP:.005,tariffRevision:'1'};
 await assert.rejects(legacy.reserve(request),/Original admission/);assert.equal(f.calls,0);assert.equal(f.record.pricing.max_output,4000);
});
await test('original legacy bridge accepts its omitted output field only with independently read 1,000-output pricing',async()=>{
 const f=await fixture(),e=f.execution,rpc=f.deps.rpc;
 const legacy=createOriginalCreativeLedger({rpc:async(name,args)=>{const result=await rpc(name,args);if(name==='busy_ai_reserve_v1'){f.record.pricing.max_output=1000;f.record.maximumMicroGBP=6000;}return result;},actor:e.ownerId,business:e.businessId,binding:e.binding,operationId:e.operationId,requestNonce:e.requestNonce,integrity,clock:()=>now});
 const request={operationId:e.operationId,scope:{ownerId:e.ownerId,businessId:e.businessId,projectId:e.binding.projectId,sourceRevision:e.binding.sourceRevision,profileRevision:e.binding.profileRevision,surface:'website',pageId:'home'},digest:e.inputDigest,requestDigest:e.wireDigest,provider:e.provider,model:e.model,inputTokens:3000,estimatedGBP:.005,tariffRevision:'1'};
 assert.equal(Object.hasOwn(request,'maxOutputTokens'),false);const admitted=await legacy.reserve(request),readback=await legacy.readReservation(admitted);assert.equal(readback.status,'reserved-undispatched');assert.equal(readback.authoritativeReadback,true);assert.equal(f.record.pricing.max_output,1000);assert.equal(f.calls,0);
});
await test('legacy bridge rejects an explicit incompatible output allowance before any reservation',async()=>{
 for(const maxOutputTokens of [1001,4000,null,undefined]){
  const f=await fixture(),e=f.execution,legacy=createOriginalCreativeLedger({rpc:f.deps.rpc,actor:e.ownerId,business:e.businessId,binding:e.binding,operationId:e.operationId,requestNonce:e.requestNonce,integrity,clock:()=>now});
  const request={operationId:e.operationId,scope:{ownerId:e.ownerId,businessId:e.businessId,projectId:e.binding.projectId,sourceRevision:e.binding.sourceRevision,profileRevision:e.binding.profileRevision,surface:'website',pageId:'home'},digest:e.inputDigest,requestDigest:e.wireDigest,provider:e.provider,model:e.model,inputTokens:3000,estimatedGBP:.005,tariffRevision:'1',maxOutputTokens};
  await assert.rejects(legacy.reserve(request),/Foreign original source or protocol/);assert.equal(f.record,null);assert.equal(f.calls,0);
 }
});
await test('v2 bridge cannot default an omitted output allowance to the legacy contract',async()=>{
 const f=await fixture(),e=f.execution,ledger=createOriginalCreativeDocumentLedger({rpc:f.deps.rpc,actor:e.ownerId,business:e.businessId,binding:e.binding,operationId:e.operationId,requestNonce:e.requestNonce,integrity,clock:()=>now});
 const request={operationId:e.operationId,scope:{ownerId:e.ownerId,businessId:e.businessId,projectId:e.binding.projectId,sourceRevision:e.binding.sourceRevision,profileRevision:e.binding.profileRevision,surface:'website',pageId:'home'},digest:e.inputDigest,requestDigest:e.wireDigest,provider:e.provider,model:e.model,inputTokens:3000,estimatedGBP:.012,tariffRevision:'1',tariffInputGBPPerMillion:1,tariffOutputGBPPerMillion:2};
 await assert.rejects(ledger.reserve(request),/Foreign original source or protocol/);assert.equal(f.record,null);assert.equal(f.calls,0);
});
await test('network uncertainty retains liability and rejects all automatic replay',async()=>{
 const f=await fixture();f.deps.transport=async()=>{throw Error('Synthetic transport lost; no actual network');};const response=await f.handler()(f.request());assert.equal((await response.json()).code,'unknown-outcome');assert.equal(f.record.state,'unknown');assert.equal(f.record.attempts,1);assert.notEqual((await f.handler()(f.request())).status,200);assert.equal(f.record.attempts,1);
});
await test('v2 permits a 45-second complete response within its private 60-second deadline',async()=>virtualProviderClock(async clock=>{
 const f=await fixture(),transport=f.deps.transport;f.deps.clock=()=>now+clock.elapsed;
 let started,release,signal;const waiting=new Promise(resolve=>{started=resolve;});
 f.deps.transport=async(...args)=>{const response=await transport(...args);signal=args[1].signal;started();return new Promise(resolve=>{release=()=>resolve(response);});};
 const response=f.handler()(f.request());await Promise.race([waiting,response.then(()=>{throw Error('Provider did not start');})]);
 assert.deepEqual(clock.scheduled,[60000]);clock.advanceTo(45000);assert.equal(signal.aborted,false);release();assert.equal((await response).status,200);assert.equal(f.record.state,'settled');assert.equal(f.record.attempts,1);assert.equal(f.calls,1);
}));
await test('v2 60-second header timeout aborts once and retains unknown liability without replay',async()=>virtualProviderClock(async clock=>{
 const f=await fixture(),transport=f.deps.transport;let started,signal;const waiting=new Promise(resolve=>{started=resolve;});
 f.deps.transport=async(...args)=>{await transport(...args);signal=args[1].signal;started();return new Promise((_,reject)=>signal.addEventListener('abort',()=>reject(Error('Synthetic timeout abort')),{once:true}));};
 const response=f.handler()(f.request());await Promise.race([waiting,response.then(()=>{throw Error('Provider did not start');})]);assert.deepEqual(clock.scheduled,[60000]);clock.advanceTo(59999);assert.equal(signal.aborted,false);clock.advanceTo(60000);
 assert.equal((await (await response).json()).code,'unknown-outcome');assert.equal(signal.aborted,true);assert.equal(f.record.state,'unknown');assert.equal(f.record.attempts,1);assert.equal(f.calls,1);assert.notEqual((await f.handler()(f.request())).status,200);assert.equal(f.calls,1);
}));
await test('v2 deadline covers a stalled response body after successful HTTP headers',async()=>virtualProviderClock(async clock=>{
 const f=await fixture(),transport=f.deps.transport;let reading,signal,bodyAborted=false;const waiting=new Promise(resolve=>{reading=resolve;});
 f.deps.transport=async(...args)=>{await transport(...args);signal=args[1].signal;return new Response(new ReadableStream({start(controller){controller.enqueue(new TextEncoder().encode('{"id":"resp_unfinished'));signal.addEventListener('abort',()=>{bodyAborted=true;controller.error(Error('Synthetic stalled-body abort'));},{once:true});},pull(){reading();}}),{headers:{'content-type':'application/json'}});};
 const response=f.handler()(f.request());await Promise.race([waiting,response.then(()=>{throw Error('Provider body was not read');})]);assert.deepEqual(clock.scheduled,[60000]);clock.advanceTo(60000);
 assert.equal((await (await response).json()).code,'unknown-outcome');assert.equal(bodyAborted,true);assert.equal(signal.aborted,true);assert.equal(f.record.state,'unknown');assert.equal(f.record.attempts,1);assert.equal(f.calls,1);assert.notEqual((await f.handler()(f.request())).status,200);assert.equal(f.calls,1);
}));
await test('legacy Home protocol keeps its original private 15-second deadline',async()=>virtualProviderClock(async clock=>{
 const f=await fixture(),current=f.context,prepared=prepareCreativeComparison(current,'Keep my words but improve the complete website');assert.equal(prepared.ok,true,prepared.reason);
 const operationId=f.execution.operationId;let record=null,started,signal,calls=0;const waiting=new Promise(resolve=>{started=resolve;});
 const deps={clock:()=>now+clock.elapsed,integrity,readCurrent:async()=>current,readServerPolicy:async()=>({liveCreativeEnabled:true,pilotExecutionEnabled:true,provider:'openai-responses',model:f.execution.model}),
  verifyApproval:async digest=>({authenticated:true,founder:true,operationId,inputDigest:digest,ownerId:current.ownerId,businessId:current.businessId,syntheticOnly:true,provider:'openai-responses',model:f.execution.model,spendingCeilingGBP:.10,expiresAt:now+60000,receipt:'synthetic-owner-approved-legacy-timeout'}),
  readTariff:async()=>({...f.execution.tariff}),countRequestTokens:async wire=>{assert.equal(wire.max_output_tokens,1000);return 3000;},
  reserve:async request=>{if(record)throw Error('Original operation cannot replay');record={...request,operationId,inputDigest:request.digest,status:'reserved-undispatched',fresh:true,authoritativeReadback:true,realUsageSettlementSupported:true,expiresAt:now+30000,admittedGBP:request.estimatedGBP};return {operationId};},readReservation:async()=>record,dispatch:async()=>{record.status='dispatched';record.attempts=1;},finish:async(_operation,result)=>{record.status=result.outcome;},readReceipt:async()=>record,readCredential:async()=> 'synthetic-legacy-credential-only',
  transport:async(_url,options)=>{calls++;signal=options.signal;started();return new Promise((_,reject)=>signal.addEventListener('abort',()=>reject(Error('Synthetic legacy abort')),{once:true}));}
 };
 const adapter=createLiveCreativeAdapter(deps),response=adapter(prepared);await Promise.race([waiting,response.then(()=>{throw Error('Legacy provider did not start');})]);assert.deepEqual(clock.scheduled,[15000]);clock.advanceTo(14999);assert.equal(signal.aborted,false);clock.advanceTo(15000);assert.equal((await response).status,'unknown-outcome');assert.equal(signal.aborted,true);assert.equal(record.status,'unknown');assert.equal(calls,1);assert.equal((await adapter(prepared)).status,'disabled');assert.equal(calls,1);
}));
await test('malformed, oversized or unaccountable provider responses retain uncertainty and never replay',async()=>{
 for(const kind of ['malformed','oversized','foreign-model','missing-usage','different-tier','missing-tier']){
  const f=await fixture(),transport=f.deps.transport;
  if(kind==='foreign-model')f.payload.model='foreign-model';
  if(kind==='missing-usage')delete f.payload.usage;
  if(kind==='different-tier')f.payload.service_tier='priority';
  if(kind==='missing-tier')delete f.payload.service_tier;
  if(['malformed','oversized'].includes(kind))f.deps.transport=async(...args)=>{await transport(...args);return new Response(kind==='malformed'?'{malformed':'x'.repeat(98305),{headers:{'content-type':'application/json'}});};
  const response=await f.handler()(f.request());assert.equal((await response.json()).code,'unknown-outcome',kind);assert.equal(f.calls,1,kind);assert.equal(f.record.state,'unknown',kind);assert.notEqual((await f.handler()(f.request())).status,200);assert.equal(f.calls,1,kind);
 }
});
await test('invalid or incomplete provider output is settled truthfully, never retried or auto-saved',async()=>{
 for(const kind of ['invalid-document','incomplete','tool','overrun','changed-source','unknown-settlement','missing-independent-review']){
  const f=await fixture(),rpc=f.deps.rpc,transport=f.deps.transport;
  if(kind==='invalid-document'){const proposal=clone(f.pilot.fixture.response);proposal.document.pages[0].sections[0].css='unsafe';f.payload.output[1].content[0].text=JSON.stringify(proposal);}
  if(kind==='incomplete'){f.payload.status='incomplete';f.payload.output=[];}
  if(kind==='tool')f.payload.output=[{type:'function_call',name:'publish'}];
  if(kind==='overrun')f.payload.usage.output_tokens=4001;
  if(kind==='changed-source')f.deps.transport=async(...args)=>{const response=await transport(...args);f.context.website.sections.find(section=>section.type==='hero').body='New unsaved owner wording';return response;};
  if(kind==='unknown-settlement')f.deps.rpc=async(name,args)=>name==='busy_ai_finish_v1'?{}:rpc(name,args);
  if(kind==='missing-independent-review'){let reads=0;f.deps.rpc=async(name,args)=>{const value=await rpc(name,args);if(name==='busy_ai_operation_read_v1'&&++reads===5)throw Error('Independent receipt read unavailable');return value;};}
  const response=await f.handler()(f.request());assert.notEqual(response.status,200,kind);assert.equal(f.calls,1,kind);assert.equal(f.context.website.creativeDocumentPageModel,undefined,kind);assert.notEqual((await f.handler()(f.request())).status,200);assert.equal(f.calls,1,kind);assert.equal(f.record.state,kind==='unknown-settlement'?'dispatched':'settled',kind);
 }
});
await test('policy or source revocation after admission cannot read credentials or start inference',async()=>{
 for(const kind of ['policy','source']){
  const f=await fixture(),readManifest=f.deps.readManifest,rpc=f.deps.rpc;let checks=0;
  if(kind==='policy')f.deps.readManifest=async()=>++checks>3?disabledCreativeDocumentExecution:readManifest();
  else f.deps.rpc=async(name,args)=>{const value=await rpc(name,args);if(name==='busy_ai_operation_read_v1'&&value.state==='reserved')f.context.profile.description='Changed current approved facts';return value;};
  assert.notEqual((await f.handler()(f.request())).status,200);assert.equal(f.calls,0);assert.equal(f.secretReads,0);
 }
});
await test('a parsed provider ID or real-model label cannot bypass independent original receipt review',async()=>{
 const f=await fixture();assert.equal(reviewWebsiteCreativeDocumentProposal(f.pilot.prepared,JSON.stringify(f.pilot.fixture.response),f.context,planner,{origin:'real-model'}).ok,false);
 const result=await reviewSettledWebsiteCreativeDocumentProposal(f.pilot.prepared,JSON.stringify(f.pilot.fixture.response),f.context,planner,{expected:{sourceStamp:f.pilot.prepared.sourceStamp},readReceipt:async()=>({status:'settled',providerReceipt:'resp_forged'})});assert.equal(result.ok,false);assert.equal(f.calls,0);
});
await test('source changed during final independent receipt inspection is not offered as a current review',async()=>{
 const f=await fixture(),rpc=f.deps.rpc;let reads=0;
 f.deps.rpc=async(name,args)=>{const result=await rpc(name,args);if(name==='busy_ai_operation_read_v1'&&++reads===5)f.context.website.sections.find(section=>section.type==='services').items[0].body='Newer owner service wording during receipt readback';return result;};
 const response=await f.handler()(f.request()),body=await response.json();assert.equal(body.code,'source-changed-after-provider');assert.notEqual(response.status,200);assert.equal(f.calls,1);assert.equal(f.record.state,'settled');assert.equal(f.context.website.creativeDocumentPageModel,undefined);assert.notEqual((await f.handler()(f.request())).status,200);assert.equal(f.calls,1);
});
await test('settled result enters the same one-use Studio Keep, exact readback and owner-wording protections',async()=>{
 const f=await fixture();assert.equal((await f.handler()(f.request())).status,200);const review=f.result.review,before=clone(f.context.website);let writes=0;
 assert.equal(isCurrentWholeWebsite(review,f.context),true);assert.equal(isCurrentWholeWebsite(JSON.parse(JSON.stringify(review)),f.context),false,'Serialized server output cannot grant a client one-use save capability');
 const kept=await keepWholeWebsite(review,{getContext:()=>f.context,apply:async patch=>{writes++;const change=applyWebsitePageChange(f.context.website,patch);assert.equal(change.applied,true,change.reason);f.context.website=change.draft;return {applied:true,localPrivateReadback:{websiteDraft:clone(change.draft)}};}});
 assert.equal(kept.ok,true,kept.reason);assert.equal(kept.accountSaved,false);assert.equal(writes,1);assert.equal((await keepWholeWebsite(review,{getContext:()=>f.context,apply:async()=>{writes++;}})).ok,false);assert.equal(writes,1);assert.equal(f.context.website.sections.find(section=>section.id==='hero').cta,before.sections.find(section=>section.id==='hero').cta);assert.equal(f.context.website.publish.enabled,false);
 const stale=await fixture();assert.equal((await stale.handler()(stale.request())).status,200);stale.context.website.sections.find(section=>section.type==='hero').body='My newer unsaved owner words';assert.equal((await keepWholeWebsite(stale.result.review,{getContext:()=>stale.context,apply:async()=>{throw Error('Must not run');}})).ok,false);
});
await test('Lab credential binding is lazy, fixed and cannot reuse or fall back to staging secrets',async()=>{
 const descriptor=Object.getOwnPropertyDescriptor(globalThis,'Deno');let reads=0;
 try{
  Object.defineProperty(globalThis,'Deno',{configurable:true,value:{env:{get:name=>{reads++;assert.equal(name,CREATIVE_DOCUMENT_LAB_KEY);return 'synthetic-lab-v2-test-credential-only';}}}});
  const f=await fixture();f.deps.adapterFactory=ports=>createDenoLiveCreativeDocumentAdapter({...ports,readCredential:async()=>{throw Error('Untrusted override must never run');}});assert.equal(reads,0);assert.equal((await f.handler()(f.request())).status,200);assert.equal(reads,1);
  const disabled=await fixture();disabled.manifest=disabledCreativeDocumentExecution;disabled.deps.adapterFactory=ports=>createDenoLiveCreativeDocumentAdapter(ports);assert.equal((await disabled.handler()(disabled.request())).status,503);assert.equal(reads,1);
  Object.defineProperty(globalThis,'Deno',{configurable:true,value:{env:{get:name=>{reads++;assert.equal(name,CREATIVE_DOCUMENT_LAB_KEY);return undefined;}}}});
  const absent=await fixture();absent.deps.adapterFactory=ports=>createDenoLiveCreativeDocumentAdapter(ports);assert.notEqual((await absent.handler()(absent.request())).status,200);assert.equal(absent.calls,0);assert.equal(absent.record.state,'released');assert.equal(reads,2);
 }finally{if(descriptor)Object.defineProperty(globalThis,'Deno',descriptor);else delete globalThis.Deno;}
});
console.log(JSON.stringify({suite:'creative-document-execution-v2',passed,failed:0,realProviderCalls:0,hostedWrites:0,paidInference:false}));
