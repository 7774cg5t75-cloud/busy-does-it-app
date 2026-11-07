import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdirSync,writeFileSync} from 'node:fs';
import {stableJson} from '../src/core/stableJson.mjs';
import {renderWebsiteHtml} from '../src/domain/websiteBuilder.js';
import {mission16Businesses} from './lib/mission16-site-fixtures.mjs';
import {AI_LAB_B3_SOURCE_PLAN as plan,AI_LAB_B3_SOURCE_PLAN_DIGEST,aiLabB3SourcePlanDigest,createAiLabB3SourceOrchestrator} from './lib/ai-lab-b3-source.mjs';

// Synthetic transport tests over actual original source/session/handler modules.
// No fetch, environment, native Auth claim, provider transport or hosted write.
const O='b3b30000-0000-4000-8000-000000000101',B='b3b30000-0000-4000-8000-000000000102',E='b3b30000-0000-4000-8000-000000000103',N='b3b30000-0000-4000-8000-000000000104',F='b3b30000-0000-4000-8000-000000000105';
const clone=value=>JSON.parse(JSON.stringify(value)),hash=value=>createHash('sha256').update(stableJson(value)).digest('hex');
let cases=0,assertions=0;const results=[];
const check=new Proxy(assert,{get(object,key){return typeof object[key]==='function'?(...args)=>{assertions++;return object[key](...args);}:object[key];}});
const test=async(id,run)=>{try{await run();cases++;results.push({id,passed:true});console.log('PASS '+id);}catch(error){results.push({id,passed:false,error:String(error.stack||error)});throw error;}};

function fixture(options={}){
 const manifest={ownerId:O,businessId:B,executionId:E,requestNonce:N,sourcePlanDigest:AI_LAB_B3_SOURCE_PLAN_DIGEST};
 let packet={actorId:O,businessId:B,revision:1,profile:null,profileRevision:0,websiteDraft:null,websiteUndoCount:0,websiteRedoCount:0,websiteHistoryHash:null},nativeReads=0,approvals=0,sourceTokenConsumed=false,snapshot=options.preExistingSnapshot===true,serviceWrites=0;
 const calls=[],writes=[],undo=[],redo=[];
 const readAuthenticatedOwner=async()=>{nativeReads++;if(options.ownerError)throw options.ownerError;return options.owner?clone(options.owner):{id:O,anonymous:false,emailConfirmed:true};};
 const authenticatedRpc=async(name,args)=>{
  calls.push({role:'authenticated',name,args:clone(args)});
  if(name==='busy_connected_workspaces_v1')return {actorId:O,items:options.workspaces||[{businessId:B,businessName:'Quiet Light Studio',role:'owner'}]};
  check.equal(args.p_business_id,B);
  if(name==='busy_connected_initialize_v1'){
   writes.push(name);snapshot=true;
   if(options.failure==='initialize')throw Error('Private token and server details must never escape');
   return options.partialInitial?{...clone(packet),profile:{businessName:'Already saved'},profileRevision:1}:clone(packet);
  }
  if(!snapshot)throw Error('Workspace unavailable');
  if(name==='busy_connected_builder_read_v1')return clone(packet);
  if(name==='busy_connected_profile_write_v1'){
   check.equal(args.p_expected_revision,packet.profileRevision);check.deepEqual(args.p_expected_profile,packet.profile);check.equal(args.p_owner_approved,true);
   writes.push(name);packet.profile=clone(args.p_profile);packet.profileRevision++;packet.profileHash=hash(packet.profile);
   if(options.failure==='profile')throw Error('Synthetic lost profile acknowledgement');
   return {actorId:O,businessId:B,profileRevision:packet.profileRevision,profile:clone(packet.profile),recordHash:packet.profileHash,privateOnly:true,publicationChanged:false};
  }
  throw Error('Unexpected original authenticated RPC');
 };
 const serviceRpc=async(name,args)=>{
  calls.push({role:'service',name,args:clone(args)});check.equal(name,'busy_connected_website_commit_v1');check.equal(args.p_business_id,B);check.equal(args.p_actor_id,O);check.equal(args.p_expected_revision,packet.revision);check.deepEqual(args.p_expected_draft,packet.websiteDraft);check.equal(args.p_profile_revision,packet.profileRevision);
  writes.push(name);serviceWrites++;if(packet.websiteDraft)undo.push(clone(packet.websiteDraft));redo.length=0;
  const previousRevision=packet.revision;packet={...packet,revision:packet.revision+1,websiteDraft:clone(args.p_candidate),websiteDraftHash:hash(args.p_candidate),websiteHistoryHash:hash({undo,redo}),websiteUndoCount:undo.length,websiteRedoCount:0};
  if(options.failure==='website-'+serviceWrites)throw Error('Synthetic lost Website acknowledgement');
  if(options.finalMutation&&serviceWrites===4)options.finalMutation(packet);
  return {ok:true,businessId:B,actorId:O,previousRevision,revision:packet.revision,draftId:packet.websiteDraft.id,generation:packet.websiteDraft.generation,recordHash:packet.websiteDraftHash,historyHash:packet.websiteHistoryHash,undoCount:packet.websiteUndoCount,redoCount:0,privateOnly:true};
 };
 const consumeApproval=async binding=>{
  approvals++;if(sourceTokenConsumed||options.missingApproval)return {consumed:false};sourceTokenConsumed=true;
  if(options.mutateManifest)manifest.businessId=F;
  return {...binding,consumed:true,...options.approvalChanges};
 };
 const verifySourceEmpty=async()=>options.noEmptyProof?{}:{empty:!snapshot};
 const deps={manifest,authenticatedRpc,serviceRpc,readAuthenticatedOwner,verifySourceEmpty,consumeApproval};
 return {manifest,deps,runner:createAiLabB3SourceOrchestrator(deps),calls,writes,get packet(){return clone(packet);},get counters(){return {nativeReads,approvals,serviceWrites};}};
}

try{
 await test('immutable exact source facts and six-operation manifest reuse approved fixture',()=>{
  check.equal(aiLabB3SourcePlanDigest(),hash(plan));check.equal(plan.writes,6);check.equal(plan.operations.length,6);check.deepEqual(plan.operations.map(row=>row.id),['initialize','profile','create','story-add','story-complete','cta']);check.equal(plan.profile.description,mission16Businesses[2].description);check.equal(plan.story.body,mission16Businesses[2].story);check.deepEqual(plan.profile.services.map(row=>[row.name,row.description]),mission16Businesses[2].services);check.deepEqual(plan.pageIds,['home','services','contact']);check.equal(plan.media,0);check.equal(plan.providerCalls,0);check.equal(plan.publication,false);check.throws(()=>{plan.profile.businessName='Different';},TypeError);
 });
 await test('invalid source binding or absent original transport rejects before any execution',()=>{
  const f=fixture();for(const change of [{sourcePlanDigest:'0'.repeat(64)},{ownerId:'owner'},{businessId:O},{executionId:N},{requestNonce:'not-a-uuid'}])check.throws(()=>createAiLabB3SourceOrchestrator({...f.deps,manifest:{...f.manifest,...change}}),/invalid_source_binding/);
  check.throws(()=>createAiLabB3SourceOrchestrator({...f.deps,serviceRpc:null}),/ports/);check.throws(()=>createAiLabB3SourceOrchestrator({...f.deps,verifySourceEmpty:null}),/ports/);check.equal(f.calls.length,0);check.equal(f.writes.length,0);
 });
 await test('real original session and handler execute exactly six approved source writes with independent readback',async()=>{
  const f=fixture(),r=await f.runner.run();check.equal(r.ok,true);check.equal(r.status,'source-prepared');check.equal(r.writesAttempted,6);check.equal(f.writes.length,6);check.deepEqual(r.completedSteps,plan.operations.map(row=>row.id));check.equal(f.counters.approvals,1);check.equal(f.counters.serviceWrites,4);check.ok(f.counters.nativeReads>f.calls.length);check.equal(r.receipts.length,5);check.deepEqual(r.observed.profile,plan.profile);check.equal(r.observed.websiteDraft.publicStatus,'Not published');check.equal(r.observed.websiteDraft.sections.find(row=>row.id===r.source.storySectionId).body,plan.story.body);check.equal(r.observed.websiteDraft.sections.find(row=>row.id==='hero').cta,plan.action.wording);check.ok(r.source.sourceIds.includes('section:'+r.source.storySectionId+':body'));check.equal(r.observed.websiteUndoCount,3);check.equal(r.observed.websiteRedoCount,0);check.equal(r.providerCalls,0);check.equal(r.mayReplay,false);
  for(const page of r.observed.websiteDraft.pages){const html=renderWebsiteHtml(r.observed.websiteDraft,page.id,{standalone:true});check.ok(html.startsWith('<!doctype html>'));check.equal((html.match(/<h1\b/g)||[]).length,1);check.ok(!/<img\b|<script\b|<iframe\b/i.test(html));}
  check.equal(f.calls.some(row=>/dispatch|reserve|finish|transition|history|publish|auth/i.test(row.name)),false);
 });
 await test('missing or incorrectly bound one-use source approval denies initializer and all writes',async()=>{
  for(const options of [{missingApproval:true},{approvalChanges:{businessId:F}},{approvalChanges:{executionId:F}},{approvalChanges:{sourcePlanDigest:'f'.repeat(64)}}]){const f=fixture(options),r=await f.runner.run();check.equal(r.ok,false);check.equal(r.phase,'consume-source-approval');check.equal(r.writesAttempted,0);check.equal(f.writes.length,0);check.equal(r.mayReplay,false);}
 });
 await test('foreign anonymous or unconfirmed native owner denies before approval and writes',async()=>{
  for(const owner of [{id:F,anonymous:false,emailConfirmed:true},{id:O,anonymous:true,emailConfirmed:true},{id:O,anonymous:false,emailConfirmed:false}]){const f=fixture({owner}),r=await f.runner.run();check.equal(r.ok,false);check.equal(r.status,'denied');check.equal(r.requiresIndependentInspection,false);check.equal(r.writesAttempted,0);check.equal(f.counters.approvals,0);check.equal(f.calls.length,0);}
 });
 await test('uncertain native sign-in is preserved before any source write without leaking the error',async()=>{
  const error=Error('PRIVATE_AUTH_ERROR_SENTINEL');error.unknownOutcome=true;error.cause={privateToken:'PRIVATE_TOKEN_SENTINEL'};
  const f=fixture({ownerError:error}),r=await f.runner.run();check.equal(r.ok,false);check.equal(r.status,'unknown-outcome');check.equal(r.writesAttempted,0);check.equal(r.requiresIndependentInspection,true);check.equal(r.mayReplay,false);check.equal(f.counters.approvals,0);check.equal(f.calls.length,0);check.equal(f.writes.length,0);check.ok(!JSON.stringify(r).includes('PRIVATE_'));check.equal((await f.runner.run()).status,'already-used');check.equal(f.counters.nativeReads,1);check.equal(f.writes.length,0);
 });
 await test('foreign revoked wrong-role or unexpected workspace denies before source approval',async()=>{
  for(const workspaces of [[],[{businessId:F,businessName:plan.profile.businessName,role:'owner'}],[{businessId:B,businessName:plan.profile.businessName,role:'staff'}],[{businessId:B,businessName:'Different business',role:'owner'}],[{businessId:B,businessName:plan.profile.businessName,role:'owner'},{businessId:F,businessName:'Other',role:'owner'}]]){const f=fixture({workspaces}),r=await f.runner.run();check.equal(r.ok,false);check.equal(f.writes.length,0);check.equal(f.counters.approvals,0);}
 });
 await test('concurrent callbacks and completed executions cannot consume or dispatch twice',async()=>{
  const f=fixture(),rs=await Promise.all([f.runner.run(),f.runner.run()]);check.equal(rs.filter(row=>row.ok).length,1);check.equal(rs.filter(row=>row.status==='already-used').length,1);check.equal(f.writes.length,6);check.equal(f.counters.approvals,1);const calls=f.calls.length;check.equal((await f.runner.run()).status,'already-used');check.equal(f.calls.length,calls);check.equal(f.writes.length,6);
 });
 await test('changed execution identity after approval blocks every source write',async()=>{
  const f=fixture({mutateManifest:true}),r=await f.runner.run();check.equal(r.ok,false);check.equal(r.writesAttempted,0);check.equal(f.writes.length,0);check.equal(f.counters.approvals,1);
 });
 await test('pre-existing empty revision-one snapshot or missing empty proof denies before initializer',async()=>{
  for(const options of [{preExistingSnapshot:true},{noEmptyProof:true}]){const f=fixture(options),r=await f.runner.run();check.equal(r.ok,false);check.equal(r.phase,'verify-empty-source');check.equal(r.writesAttempted,0);check.equal(f.writes.length,0);check.equal(f.counters.approvals,0);check.equal((await f.runner.run()).status,'already-used');}
 });
 await test('partial pre-existing source is inspected without profile overwrite or continuation',async()=>{
  const f=fixture({partialInitial:true}),r=await f.runner.run();check.equal(r.ok,false);check.equal(r.status,'stopped-partial');check.equal(r.phase,'initialize');check.equal(f.writes.length,1);check.equal(f.counters.serviceWrites,0);check.equal((await f.runner.run()).status,'already-used');
 });
 for(const [failure,attempts] of [['initialize',1],['profile',2],['website-1',3],['website-2',4],['website-3',5],['website-4',6]])await test('lost '+failure+' acknowledgement stops and never replays',async()=>{
  const f=fixture({failure}),r=await f.runner.run();check.equal(r.ok,false);check.equal(r.status,'unknown-outcome');check.equal(r.writesAttempted,attempts);check.equal(f.writes.length,attempts);check.equal(r.requiresIndependentInspection,true);check.equal(r.mayReplay,false);check.ok(!JSON.stringify(r).includes('Private token'));const count=f.calls.length;check.equal((await f.runner.run()).status,'already-used');check.equal(f.calls.length,count);check.equal(f.writes.length,attempts);
 });
 await test('final owner wording or section structure drift cannot be reported complete',async()=>{
  for(const finalMutation of [packet=>{packet.websiteDraft.sections.find(row=>row.type==='text').body='Changed story';},packet=>{packet.websiteDraft.sections.find(row=>row.id==='hero').cta='Wrong action';},packet=>{packet.websiteDraft.pages.pop();}]){const f=fixture({finalMutation}),r=await f.runner.run();check.equal(r.ok,false);check.equal(r.status,'stopped-partial');check.equal(r.phase,'independent-readback');check.equal(r.requiresIndependentInspection,true);check.equal(f.writes.length,6);}
 });
}finally{
 const artifact={version:1,kind:'offline original-source orchestration; synthetic authenticated/service transports',nativeAuthAcceptance:false,hosted:false,providerCalls:0,sourcePlanDigest:AI_LAB_B3_SOURCE_PLAN_DIGEST,results,summary:{passed:results.filter(row=>row.passed).length,failed:results.filter(row=>!row.passed).length,cases,assertions}};mkdirSync('.test-artifacts/ai-lab-b3-source',{recursive:true});writeFileSync('.test-artifacts/ai-lab-b3-source/offline.json',JSON.stringify(artifact,null,2)+'\n');console.log(JSON.stringify(artifact));
}
