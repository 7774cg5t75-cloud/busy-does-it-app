import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createStagingCreativeExecutionHandler,disabledCreativeExecution,CREATIVE_STAGING_URL} from '../supabase/functions/busy-builder-proposals/executionBootstrap.mjs';
import {createLiveCreativeAdapter} from '../supabase/functions/busy-builder-proposals/liveCreativeAdapter.mjs';
import {prepareCreativeApprovalPacket} from '../supabase/functions/busy-builder-proposals/approvalPacket.mjs';
import {prepareCreativeComparison} from '../src/core/websiteCreativeComparison.mjs';
import {websiteCreativeInstructions} from '../src/core/websiteCreativeBrief.mjs';
import {prepareWebsiteRequest} from '../src/core/websiteRequestPlan.mjs';
import {WEBSITE_ART_STORY_VERSION} from '../src/core/governedBuilderProposal.mjs';
process.env.BUSY_CREATIVE_IMPORTED='1';const {creativeFixture}=await import('./check-website-creative-comparison.mjs');delete process.env.BUSY_CREATIVE_IMPORTED;
process.env.BUSY_STORY_IMPORTED='1';const {storyDeps}=await import('./check-website-authentic-story.mjs');delete process.env.BUSY_STORY_IMPORTED;
const now=Date.parse('2026-11-05T23:00:00Z'),integrity={sha256:async s=>createHash('sha256').update(s).digest('hex')};
assert.match(readFileSync('supabase/config.toml','utf8'),/\[functions\.busy-creative-pilot\]\s*verify_jwt = true/);
async function fixture(){
 const c=creativeFixture(2,true),goal='Keep my words but propose a distinctive complete website',operationId='10000000-0000-4000-8000-000000000030',requestNonce='10000000-0000-4000-8000-000000000031';
 const p=await prepareCreativeApprovalPacket({context:c,goal,operationId,requestNonce,integrity});
 const binding={surface:'website',projectId:c.website.id,sourceRevision:c.website.generation,profileRevision:c.profileRevision,snapshotRevision:2,pageId:'home'},model='gpt-6.1-sol';
 const e={ownerId:c.ownerId,businessId:c.businessId,operationId,requestNonce,binding,goal,provider:'openai-responses',model,inputDigest:p.envelopeDigest,wireDigest:p.wireDigest,approvalReceipt:'synthetic-owner-approved-server-artifact',
 approval:{authenticated:true,founder:true,syntheticOnly:true,ownerId:c.ownerId,businessId:c.businessId,operationId,inputDigest:p.envelopeDigest,wireDigest:p.wireDigest,provider:'openai-responses',model,spendingCeilingGBP:.10,expiresAt:now+60000,receipt:'synthetic-owner-approved-server-artifact'},
 tariff:{provider:'openai-responses',model,currency:'GBP',modelAvailable:true,availabilityVerified:true,independentlyVerified:true,allFeesIncluded:true,fixedRequestGBP:0,checkedAt:now,inputGBPPerMillion:1,outputGBPPerMillion:2,revision:'1'},tokenEvidence:{independentlyVerified:true,reference:'synthetic exact count only',wireDigest:p.wireDigest,checkedAt:now,tokens:3000}};
 let manifest={version:1,projectUrl:CREATIVE_STAGING_URL,enabled:true,executionEnabled:true,execution:e},record=null,calls=0,secrets=0,auths=0,sourceReads=0;
 const proposal={version:WEBSITE_ART_STORY_VERSION,scope:prepareCreativeComparison(c,goal).source.scope,kind:'website-design',explanation:'Synthetic fixture, never real model evidence.',objectives:['professional-presentation'],app:null,art:{direction:'expressive',family:c.website.theme.heroComposition,photos:[],contentPhotos:[],services:'cards',story:null,customerAction:'unchanged',copy:'unchanged',composition:{pageDirection:'studio-index',moves:[],mobileDensity:'preserve'}}};
 const deps={projectUrl:CREATIVE_STAGING_URL,readManifest:async()=>manifest,clock:()=>now,integrity,planner:storyDeps,
 authenticate:async()=>{auths++;return {id:c.ownerId};},
 rpc:async(name,args)=>{
  assert.equal(args.p_actor,c.ownerId);assert.equal(args.p_business,c.businessId);
  if(name==='busy_ai_context_v1'){sourceReads++;assert.deepEqual(args.p_binding,binding);return {ownerId:c.ownerId,businessId:c.businessId,project:c.website,profile:c.profile,catalog:[]};}
  assert.equal(args.p_operation,operationId);assert.equal(args.p_request_nonce,requestNonce);
  if(name==='busy_ai_reserve_v1'){if(record)return {fresh:false};record={operationId,state:'reserved',attempts:0,goalHash:args.p_goal_hash,model,tariffRevision:1,maximumMicroGBP:5000,actualMicroGBP:null,pricing:{max_input:4000,max_output:1000},binding,createdAt:new Date(now).toISOString()};return {fresh:true};}
  if(name==='busy_ai_operation_read_v1')return {...record};
  if(name==='busy_ai_dispatch_v1'){if(record.state!=='reserved'||record.attempts!==0||Date.parse(record.createdAt)+30000<=now)throw Error('No replay');record.state='dispatched';record.attempts=1;return {};}
  if(name==='busy_ai_finish_v1'){if(args.p_outcome==='released'&&record?.state!=='reserved')throw Error('Retain liability');if(record?.state==='settled')return {};if(args.p_outcome==='settled')Object.assign(record,{state:'settled',inputTokens:args.p_input,outputTokens:args.p_output,providerReceipt:args.p_receipt,actualMicroGBP:4000});else record.state=args.p_outcome;return {};}
  throw Error('Unexpected RPC');
 },adapterFactory:ports=>createLiveCreativeAdapter({...ports,readCredential:async()=>{secrets++;return 'synthetic-test-credential-not-real';}}),
 transport:async()=>{calls++;return new Response(JSON.stringify({id:'resp_synthetic_bootstrap',model,status:'completed',usage:{input_tokens:3000,output_tokens:500},output:[{type:'message',role:'assistant',content:[{type:'output_text',text:JSON.stringify(proposal)}]}]}),{headers:{'content-type':'application/json'}});}};
 const request=(patch={},body={version:1,operationId})=>new Request('https://local.invalid/pilot',{method:'POST',headers:{'content-type':'application/json',authorization:'Bearer synthetic-authentication-token-only'},body:JSON.stringify(body),...patch});
 return {c,e,deps,request,handler:()=>createStagingCreativeExecutionHandler(deps),get record(){return record;},get calls(){return calls;},get secrets(){return secrets;},get auths(){return auths;},get sourceReads(){return sourceReads;},set manifest(v){manifest=v;}};
}
const valid=await fixture(),h=valid.handler(),r=await h(valid.request());assert.equal(r.status,200,await r.clone().text());const out=await r.json();assert.equal(out.code,'review_required');assert.equal(out.maySave,false);assert.equal(out.mayRetry,false);assert.equal(valid.calls,1);assert.equal(valid.record.state,'settled');assert.ok(!JSON.stringify(out).includes('synthetic-test-credential'));
assert.notEqual((await h(valid.request())).status,200);assert.notEqual((await valid.handler()(valid.request())).status,200);assert.equal(valid.calls,1,'durable ledger fences a new handler/cold start');
const simultaneous=await fixture(),parallel=await Promise.all([simultaneous.handler()(simultaneous.request()),simultaneous.handler()(simultaneous.request())]);assert.equal(parallel.filter(r=>r.status===200).length,1);assert.equal(simultaneous.calls,1);assert.equal(simultaneous.record.state,'settled','duplicate cleanup must not release another request reservation');
const disabled=await fixture();disabled.manifest=disabledCreativeExecution;assert.equal((await disabled.handler()(disabled.request())).status,503);assert.equal(disabled.auths,0);assert.equal(disabled.secrets,0);
for(const kind of ['missing-auth','wrong-owner','anonymous','no-approval','expired-approval','wrong-source','expired-reservation','wrong-tariff','wrong-token-digest','malicious-body','foreign-operation','revoked-policy']){
 const f=await fixture();let req=f.request();
 if(kind==='missing-auth')req=f.request({headers:{'content-type':'application/json'}});
 if(kind==='wrong-owner')f.deps.authenticate=async()=>({id:'20000000-0000-4000-8000-000000000030'});
 if(kind==='anonymous')f.deps.authenticate=async()=>({id:f.c.ownerId,anonymous:true});
 if(kind==='no-approval')f.e.approval=null;
 if(kind==='expired-approval')f.e.approval.expiresAt=now-1;
 if(kind==='wrong-source'){const rpc=f.deps.rpc;f.deps.rpc=async(n,a)=>n==='busy_ai_context_v1'?{...await rpc(n,a),businessId:'foreign'}:rpc(n,a);}
 if(kind==='expired-reservation'){const rpc=f.deps.rpc;f.deps.rpc=async(n,a)=>{const r=await rpc(n,a);return n==='busy_ai_operation_read_v1'?{...r,createdAt:new Date(now-31000).toISOString()}:r;};}
 if(kind==='wrong-tariff')f.e.tariff.currency='USD';
 if(kind==='wrong-token-digest')f.e.tokenEvidence.wireDigest='a'.repeat(64);
 if(kind==='malicious-body')req=f.request({}, {version:1,operationId:f.e.operationId,approval:{founder:true},key:'synthetic'});
 if(kind==='foreign-operation')req=f.request({}, {version:1,operationId:'20000000-0000-4000-8000-000000000030'});
 if(kind==='revoked-policy'){const read=f.deps.readManifest;let count=0;f.deps.readManifest=async()=>++count>2?disabledCreativeExecution:read();}
 assert.notEqual((await f.handler()(req)).status,200,kind);assert.equal(f.calls,0,kind);assert.equal(f.secrets,0,kind);
}
const lostReserve=await fixture(),originalRpc=lostReserve.deps.rpc;lostReserve.deps.rpc=async(n,a)=>{const r=await originalRpc(n,a);if(n==='busy_ai_reserve_v1'&&r.fresh)throw Error('Lost reserve acknowledgement');return r;};
const reserveUnknown=await lostReserve.handler()(lostReserve.request());assert.equal((await reserveUnknown.json()).inspectOriginalReceipt,true);assert.equal(lostReserve.calls,0);assert.equal(lostReserve.record.state,'reserved');assert.notEqual((await lostReserve.handler()(lostReserve.request())).status,200);assert.equal(lostReserve.calls,0);
const lost=await fixture();lost.deps.transport=async()=>{throw Error('synthetic lost response');};const unknown=await lost.handler()(lost.request());assert.equal((await unknown.json()).code,'unknown-outcome');assert.equal(lost.record.state,'unknown');assert.notEqual((await lost.handler()(lost.request())).status,200);assert.equal(lost.record.attempts,1);
console.log('PASS actual staging bootstrap, original ledger and live adapter with synthetic transports only: authenticated scope, server-only manifest, missing/expired approval, stale reservation, wrong source/count/tariff, policy revocation, cold-start duplicate fencing, settled and unknown outcomes. No network or paid request.');

const menu=creativeFixture(0,true),home=menu.website.pages.find(p=>p.id==='home'),product=menu.website.sections.find(s=>s.type==='products');
assert.ok(product);const moved=storyDeps.layoutEdit(menu.website,{action:'move-relative',sectionId:product.id,targetSectionId:'about',position:'after',pageId:'home'});assert.equal(moved.applied,true);menu.website=moved.draft;menu.website.sections.find(s=>s.id===product.id).navigationLabel='Products';
const before=structuredClone(menu.website),goal=websiteCreativeInstructions(menu,'Make our menu easier to find');assert.equal(goal.ok,true);
const menuReview=prepareWebsiteRequest(before,{draftId:before.id,pageId:'home',generation:before.generation,instruction:goal.instruction},storyDeps);assert.equal(menuReview.ok,true,menuReview.reason);
const candidate=JSON.parse(menuReview.boundaries.at(-1));assert.equal(candidate.pages.find(p=>p.id==='home').sectionIds[1],product.id);assert.equal(candidate.sections.find(s=>s.id===product.id).navigationLabel,'Menu');
assert.deepEqual(candidate.sections.map(s=>[s.title,s.body,s.items]),before.sections.map(s=>[s.title,s.body,s.items]));assert.equal(candidate.publish.enabled,false);
assert.equal(websiteCreativeInstructions(creativeFixture(2,true),'Make our menu easier to find').ok,false);
console.log('PASS natural menu-discovery refinement prepares real original reviewed order/navigation changes, preserves wording/prices/media and denies a missing approved menu.');
