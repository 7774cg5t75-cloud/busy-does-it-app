import assert from 'node:assert/strict';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {randomUUID,createHash} from 'node:crypto';
import {aiLabRunnerFoundationPackage,runnerExecutionDerivative} from './lib/ai-lab-runner-foundation-package.mjs';
import {aiLabBudgetCompatibilityPackage} from './lib/ai-lab-budget-compatibility-package.mjs';
import {startB3LocalPostgrest,quote as q} from './lib/ai-lab-b3-postgrest-local.mjs';
import {createOriginalCreativeDocumentLedger} from '../supabase/functions/busy-builder-proposals/creativeLedger.mjs';
import {CREATIVE_DOCUMENT_REVISED_PROFILE} from '../supabase/functions/busy-builder-proposals/creativeDocumentPilotProfiles.mjs';
import {createConnectedBuilderSession} from '../src/staging/connectedBuilderSession.mjs';
import {privateWebsiteDraftAction} from '../supabase/functions/busy-website-publish/privateDraftService.mjs';
import {AI_LAB_B3_SOURCE_PLAN} from './lib/ai-lab-b3-source.mjs';

// Real loopback HTTP -> pinned PostgREST -> self-owned PostgreSQL 17 -> original
// canonical functions. Native Auth, entitlements, tariff and usage receipts are
// explicitly synthetic; this never proves provider access, pricing or spending.
// No hosted target, provider transport, API credential or endpoint is accepted.
const OWNER=randomUUID(),BUSINESS=randomUUID(),FOREIGN_OWNER=randomUUID(),FOREIGN_BUSINESS=randomUUID();
const MODEL='synthetic-http-creative-document-v2',MAXIMUM=52800,results=[],trace=[];
let local,basis,binding,session,fatal=null,cleanupCompleted=false,localOutputCompatibility=null,solProfileEvidence=null;
const clone=x=>JSON.parse(JSON.stringify(x));
const digest=x=>createHash('sha256').update(x).digest('hex');
const stage=async(id,fn)=>{const start=performance.now();try{const detail=await fn();results.push({id,passed:true,elapsedMs:Math.round(performance.now()-start),...(detail?{detail}:{})});console.log('PASS '+id);}catch(error){results.push({id,passed:false,elapsedMs:Math.round(performance.now()-start),error:error?.code==='ERR_ASSERTION'?'assertion_failed':'local_http_fixture_failed'});throw error;}};
const allowed=new Set(['busy_connected_initialize_v1','busy_connected_builder_read_v1','busy_connected_profile_write_v1','busy_connected_website_commit_v1','busy_connected_website_transition_v1','busy_connected_website_history_v1','busy_ai_context_v1','busy_ai_reserve_v1','busy_ai_dispatch_v1','busy_ai_finish_v1','busy_ai_operation_read_v1']);
const rpc=async(name,body,{role='service_role',actor=OWNER,token,deadlineMs=6000}={})=>{
 assert.ok(allowed.has(name));trace.push({name,role});
 return local.http('/rpc/'+name,{token:token??local.jwt(role,role==='authenticated'?actor:undefined),body,deadlineMs});
};
const success=async(name,args,options)=>{const r=await rpc(name,args,options);assert.equal(r.status,200,'Original RPC HTTP200 required: '+name);assert.ok(r.json&&typeof r.json==='object');return r.json;};
const denied=async(name,args,options)=>{const r=await rpc(name,args,options);assert.ok(r.status>=400&&r.status<600,'Original RPC must refuse: '+name);assert.notEqual(r.json?.state,'dispatched');return {status:r.status,code:r.json?.code||null};};
const argsFor=(operation,nonce,extra={})=>({p_actor:OWNER,p_business:BUSINESS,p_operation:operation,p_request_nonce:nonce,...extra});
const reserveArgs=(operation,nonce,extra={})=>argsFor(operation,nonce,{p_model:MODEL,p_feature:'website-design',p_binding:clone(binding),p_goal_hash:'a'.repeat(64),...extra});
const finishArgs=(operation,nonce,outcome='released',extra={})=>argsFor(operation,nonce,{p_outcome:outcome,p_input:null,p_output:null,p_receipt:null,...extra});
const receipt=(operation,nonce)=>success('busy_ai_operation_read_v1',argsFor(operation,nonce));
const release=(operation,nonce)=>success('busy_ai_finish_v1',finishArgs(operation,nonce));
const resetLimits=()=>local.sql("UPDATE busy_ai_private.policy SET enabled=true,monthly_hard_limit=10000000;UPDATE busy_ai_private.accounts SET monthly_limit=1000000,expensive_limit=0,feature_limits='{\"website-design\":1000000}',concurrent_limit=4,blocked=false WHERE business_id="+q(BUSINESS));
const fresh=async(extra={})=>{const operation=randomUUID(),nonce=randomUUID();const ack=await success('busy_ai_reserve_v1',reserveArgs(operation,nonce,extra));assert.equal(ack.fresh,true);return {operation,nonce};};
const bridge=({operation=randomUUID(),nonce=randomUUID(),clock,dropDispatch=false,dropSettlement=false}={})=>{
 let droppedDispatch=false,droppedSettlement=false;
 const ledger=createOriginalCreativeDocumentLedger({actor:OWNER,business:BUSINESS,binding:clone(binding),operationId:operation,requestNonce:nonce,integrity:{sha256:async x=>digest(x)},...(clock?{clock}:{}),rpc:async(name,args)=>{
  const r=await success(name,args);
  if(name==='busy_ai_dispatch_v1'&&dropDispatch&&!droppedDispatch){droppedDispatch=true;throw Error('Synthetic lost acknowledgement after actual HTTP200');}
  if(name==='busy_ai_finish_v1'&&args.p_outcome==='settled'&&dropSettlement&&!droppedSettlement){droppedSettlement=true;throw Error('Synthetic lost settlement acknowledgement after actual HTTP200');}
  return r;
 }});
 const request={operationId:operation,scope:{ownerId:OWNER,businessId:BUSINESS,projectId:binding.projectId,sourceRevision:binding.sourceRevision,profileRevision:binding.profileRevision,surface:'website',pageId:'home'},digest:'a'.repeat(64),requestDigest:'b'.repeat(64),provider:'openai-responses',model:MODEL,tariffRevision:'1',inputTokens:1000,maxOutputTokens:4000,estimatedGBP:MAXIMUM/1e6,tariffInputGBPPerMillion:2,tariffOutputGBPPerMillion:10};
 return {ledger,request,operation,nonce};
};
try{
 await stage('pinned-real-postgrest-and-owned-loopback-postgresql17',async()=>{local=await startB3LocalPostgrest();assert.equal(local.sql('SHOW listen_addresses'),'127.0.0.1');assert.ok(local.sql('SHOW data_directory').includes('busy-b3-pgrst-'));return local.binary;});
 await stage('canonical-foundation-service-only-budget-and-disabled-default',async()=>{
  local.sql(readFileSync('scripts/fixtures/ai-lab/empty-native.sql','utf8'));
  local.sql(`CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$SELECT coalesce(nullif(current_setting('request.jwt.claim.sub',true),''),nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'sub')::uuid$$;`);
  local.sql(runnerExecutionDerivative(aiLabRunnerFoundationPackage(process.cwd()).sql));
  // Configure ONLY this newly owned disposable fixture with the exact reviewed
  // output CHECK statements. This is not the full managed/native installation:
  // no fake migration receipts are created and no hosted target is available.
  const compatibility=aiLabBudgetCompatibilityPackage(process.cwd());
  assert.equal(compatibility.sha256,'920e52c9bf0e527ef4ba4ed1bb554497c6aaa5af4c57dfc65e9eb3a1e2ca08e8');
  assert.equal(compatibility.executionDerivativeSha256,'901a4a22978d3cf42446874cc0fcd8896e8f6c14a38957fe97e35700932cace1');
  const fragment=compatibility.install.match(/ ALTER TABLE busy_ai_private\.tariffs DROP CONSTRAINT tariffs_max_output_check;\n ALTER TABLE busy_ai_private\.tariffs ADD CONSTRAINT tariffs_max_output_check CHECK\(max_output BETWEEN 1 AND 12000\);/);
  assert.ok(fragment,'Reviewed local output-constraint fragment required');
  const functionFingerprint=()=>local.sql("SELECT encode(sha256(convert_to(coalesce(string_agg(pg_get_functiondef(p.oid),E'\\n' ORDER BY p.oid),''),'UTF8')),'hex') FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname IN('public','busy_ai_private','busy_snapshot_private','busy_creator_private','busy_growth_private','busy_work_private') AND p.prokind IN('f','p')");
  const beforeFunctions=functionFingerprint(),beforeInput=local.sql("SELECT pg_get_constraintdef(oid) FROM pg_constraint WHERE conrelid='busy_ai_private.tariffs'::regclass AND conname='tariffs_max_input_check'");
  assert.equal(beforeInput,'CHECK (((max_input >= 1) AND (max_input <= 8000)))');
  local.sql(fragment[0]);
  assert.equal(functionFingerprint(),beforeFunctions,'Local compatibility must not change original controller/function bodies');
  assert.equal(local.sql("SELECT pg_get_constraintdef(oid) FROM pg_constraint WHERE conrelid='busy_ai_private.tariffs'::regclass AND conname='tariffs_max_input_check'"),beforeInput);
  assert.equal(local.sql("SELECT pg_get_constraintdef(oid) FROM pg_constraint WHERE conrelid='busy_ai_private.tariffs'::regclass AND conname='tariffs_max_output_check'"),'CHECK (((max_output >= 1) AND (max_output <= 12000)))');
  localOutputCompatibility={fixtureOnly:true,fullManagedMigrationExecuted:false,nativeMigrationReceiptClaimed:false,reviewedFusedSHA256:compatibility.sha256,reviewedExecutionSHA256:compatibility.executionDerivativeSha256,originalFunctionsUnchanged:true,inputConstraintUnchanged:true,maxOutput:12000};
  local.sql('INSERT INTO auth.users(id)VALUES('+q(OWNER)+'),('+q(FOREIGN_OWNER)+');INSERT INTO public.busy_businesses(id,name,created_by)VALUES('+[BUSINESS,'Quiet Light Studio',OWNER].map(q).join(',')+'),('+[FOREIGN_BUSINESS,'Fictional other owner',FOREIGN_OWNER].map(q).join(',')+');INSERT INTO public.busy_business_memberships(business_id,user_id,role)VALUES('+[BUSINESS,OWNER,'owner'].map(q).join(',')+'),('+[FOREIGN_BUSINESS,FOREIGN_OWNER,'owner'].map(q).join(',')+');');
  assert.equal(local.sql('SELECT enabled OR monthly_hard_limit<>0 FROM busy_ai_private.policy'),'f');
  assert.equal(local.sql("SELECT bool_and(relrowsecurity AND relforcerowsecurity) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='busy_ai_private' AND c.relkind='r'"),'t');
  await local.startHttp();
 });
 await stage('authenticated-original-profile-studio-cas-save-and-independent-http-readback',async()=>{
  const owner=(n,a)=>success(n,a,{role:'authenticated'});
  await owner('busy_connected_initialize_v1',{p_business_id:BUSINESS});
  const read=()=>owner('busy_connected_builder_read_v1',{p_business_id:BUSINESS});
  session=createConnectedBuilderSession({request:async(action,body={})=>{
   if(action==='builder_read')return read();
   if(action==='profile_write')return owner('busy_connected_profile_write_v1',{p_business_id:BUSINESS,p_expected_revision:body.p_expected_revision,p_expected_profile:body.p_expected_profile,p_profile:body.p_profile,p_owner_approved:body.p_owner_approved});
   return privateWebsiteDraftAction({action,body,userId:OWNER,read,commit:args=>success('busy_connected_website_commit_v1',args)});
  }});
  basis=await session.open(BUSINESS);
  const profile=await session.profile({basis,profile:clone(AI_LAB_B3_SOURCE_PLAN.profile),ownerApproved:true});assert.equal(profile.ok,true);basis=profile.observed;
  const made=await session.website({basis,action:'create',sourceRevision:basis.profileRevision,ownerApproved:true});assert.equal(made.ok,true);basis=made.observed;
  binding={surface:'website',projectId:basis.websiteDraft.id,sourceRevision:basis.websiteDraft.generation,profileRevision:basis.profileRevision,snapshotRevision:basis.revision,pageId:'home'};
  assert.deepEqual((await read()).websiteDraft,basis.websiteDraft);
  assert.deepEqual(basis.websiteDraft.pages.map(p=>p.id),['home','services','contact']);
  assert.equal(basis.websiteDraft.publicStatus,'Not published');
 });
 await stage('real-jwt-authentication-and-service-only-http-permissions',async()=>{
  const ctx={p_actor:OWNER,p_business:BUSINESS,p_binding:binding};
  await denied('busy_ai_context_v1',ctx,{role:'anon'});await denied('busy_ai_context_v1',ctx,{role:'authenticated'});
  await denied('busy_ai_context_v1',ctx,{token:'invalid-local-fixture-jwt'});
  const context=await success('busy_ai_context_v1',ctx);assert.equal(context.ownerId,OWNER);assert.equal(context.businessId,BUSINESS);assert.deepEqual(context.profile,AI_LAB_B3_SOURCE_PLAN.profile);
  const table=await local.http('/busy_ai_private.accounts',{token:local.jwt('service_role'),method:'GET'});assert.ok(table.status>=400);
 });
 await stage('disabled-policy-missing-entitlement-and-missing-tariff-fail-closed-over-http',async()=>{
  let x={operation:randomUUID(),nonce:randomUUID()};await denied('busy_ai_reserve_v1',reserveArgs(x.operation,x.nonce));
  local.sql('UPDATE busy_ai_private.policy SET enabled=true,monthly_hard_limit=10000000');await denied('busy_ai_reserve_v1',reserveArgs(x.operation,x.nonce));
  local.sql("INSERT INTO busy_ai_private.accounts(business_id,period,verified_entitlement_reference,entitlement_verified,active_until,monthly_limit,expensive_limit,feature_limits,concurrent_limit)VALUES("+q(BUSINESS)+",date_trunc('month',now() at time zone 'UTC')::date,'SYNTHETIC_LOCAL_ONLY_NOT_A_SUBSCRIPTION',true,now()+interval '1 day',1000000,0,'{\"website-design\":1000000}',4)");
  await denied('busy_ai_reserve_v1',reserveArgs(x.operation,x.nonce));
  local.sql("INSERT INTO busy_ai_private.tariffs VALUES("+q(MODEL)+",1,'website-design',true,now()+interval '1 day',4000,4000,2000,10000,1000000,1000,false,'GBP','SYNTHETIC_LOCAL_ONLY_NOT_PROVIDER_PRICING')");
 });
 await stage('v2-original-ledger-reservation-authoritative-http-readback-and-known-usage-settlement',async()=>{
  const x=bridge(),admitted=await x.ledger.reserve(x.request),reserved=await x.ledger.readReservation(admitted);
  assert.equal(reserved.status,'reserved-undispatched');assert.equal(reserved.admittedGBP,.0528);assert.equal(reserved.authoritativeReadback,true);assert.equal(reserved.realUsageSettlementSupported,true);assert.equal(reserved.fresh,true);assert.equal(reserved.pricing,undefined);
  assert.equal(local.sql('SELECT reserved FROM busy_ai_private.accounts WHERE business_id='+q(BUSINESS)),String(MAXIMUM));
  await x.ledger.dispatch(admitted);assert.equal((await x.ledger.readReservation(admitted)).attempts,1);
  await x.ledger.finish(admitted,{outcome:'settled',inputTokens:1000,outputTokens:500,providerReceipt:'fixture_http_known_usage'});
  const actual=await x.ledger.readReceipt(admitted);assert.equal(actual.status,'settled');assert.equal(actual.actualGBP,.0077);assert.equal(actual.providerReceipt,'fixture_http_known_usage');assert.equal(actual.inputDigest,x.request.digest);
  const before=local.sql('SELECT spent FROM busy_ai_private.accounts WHERE business_id='+q(BUSINESS));
  await x.ledger.finish(admitted,{outcome:'settled',inputTokens:1000,outputTokens:500,providerReceipt:'fixture_http_known_usage'});assert.equal(local.sql('SELECT spent FROM busy_ai_private.accounts WHERE business_id='+q(BUSINESS)),before);
  return {maximumMicroGBP:MAXIMUM,actualSyntheticMicroGBP:7700,inputLimit:4000,outputLimit:4000,realProviderUsage:false};
 });
 await stage('malformed-or-conflicting-usage-receipts-denied-and-liability-retained',async()=>{
  const x=await fresh();await success('busy_ai_dispatch_v1',argsFor(x.operation,x.nonce));
  for(const usage of [{p_input:-1,p_output:0,p_receipt:'fixture_invalid'},{p_input:1,p_output:0,p_receipt:null},{p_input:1,p_output:0,p_receipt:'not a valid receipt'}])await denied('busy_ai_finish_v1',finishArgs(x.operation,x.nonce,'settled',usage));
  await denied('busy_ai_finish_v1',finishArgs(x.operation,x.nonce,'released'));
  await denied('busy_ai_finish_v1',finishArgs(x.operation,x.nonce,'unknown',{p_input:0,p_output:0,p_receipt:'fixture_contradiction'}));
  assert.equal((await receipt(x.operation,x.nonce)).state,'dispatched');
  await success('busy_ai_finish_v1',finishArgs(x.operation,x.nonce,'settled',{p_input:0,p_output:0,p_receipt:'fixture_http_zero_usage'}));
  await denied('busy_ai_finish_v1',finishArgs(x.operation,x.nonce,'settled',{p_input:1,p_output:0,p_receipt:'fixture_http_zero_usage'}));
 });
 await stage('concurrent-duplicate-http-admission-and-dispatch-never-charge-or-dispatch-twice',async()=>{
  const operation=randomUUID(),nonce=randomUUID();
  const requests=await Promise.all([rpc('busy_ai_reserve_v1',reserveArgs(operation,nonce)),rpc('busy_ai_reserve_v1',reserveArgs(operation,nonce))]);assert.ok(requests.every(r=>r.status===200));assert.equal(requests.filter(r=>r.json.fresh).length,1);
  assert.equal((await receipt(operation,nonce)).maximumMicroGBP,MAXIMUM);assert.equal(local.sql('SELECT count(*) FROM busy_ai_private.operations WHERE id='+q(operation)),'1');
  const dispatches=await Promise.all([rpc('busy_ai_dispatch_v1',argsFor(operation,nonce)),rpc('busy_ai_dispatch_v1',argsFor(operation,nonce))]);assert.equal(dispatches.filter(r=>r.status===200).length,1);assert.equal((await receipt(operation,nonce)).attempts,1);
  await success('busy_ai_finish_v1',finishArgs(operation,nonce,'settled',{p_input:0,p_output:0,p_receipt:'fixture_http_concurrent_once'}));
  return {reservationRequests:2,freshReservations:1,dispatchRequests:2,successfulDispatches:1};
 });
 await stage('forged-operation-nonce-foreign-tenant-and-stale-source-denied-over-http',async()=>{
  for(const extra of [{p_actor:FOREIGN_OWNER},{p_business:FOREIGN_BUSINESS},{p_binding:{...binding,projectId:'unknown'}},{p_binding:{...binding,sourceRevision:999}},{p_binding:{...binding,profileRevision:999}},{p_binding:{...binding,snapshotRevision:999}},{p_binding:{...binding,tool:'publish'}}])await denied('busy_ai_reserve_v1',reserveArgs(randomUUID(),randomUUID(),extra));
  const x=await fresh();for(const extra of [{p_actor:FOREIGN_OWNER},{p_business:FOREIGN_BUSINESS},{p_request_nonce:randomUUID()},{p_operation:randomUUID()}]){
   await denied('busy_ai_dispatch_v1',argsFor(x.operation,x.nonce,extra));await denied('busy_ai_operation_read_v1',argsFor(x.operation,x.nonce,extra));
  }
  assert.equal((await receipt(x.operation,x.nonce)).attempts,0);await release(x.operation,x.nonce);
 });
 await stage('wrong-tariff-and-admission-cost-bypass-rejected-by-original-v2-http-bridge',async()=>{
  for(const patch of [{tariffRevision:'999'},{estimatedGBP:.1},{inputTokens:4001},{maxOutputTokens:4001},{tariffInputGBPPerMillion:100},{tariffOutputGBPPerMillion:100}]){
   const x=bridge();await assert.rejects(x.ledger.reserve({...x.request,...patch}));
   const count=local.sql('SELECT count(*) FROM busy_ai_private.operations WHERE id='+q(x.operation));
   if(count==='1'){assert.equal((await receipt(x.operation,x.nonce)).attempts,0);await release(x.operation,x.nonce);}
  }
  local.sql("INSERT INTO busy_ai_private.tariffs VALUES('synthetic-http-axis-underpriced',1,'website-design',true,now()+interval '1 day',4000,4000,100,11900,1000000,1000,false,'GBP','SYNTHETIC_LOCAL_ONLY_WRONG_AXIS')");
  const x=bridge();await assert.rejects(x.ledger.reserve({...x.request,model:'synthetic-http-axis-underpriced'}));assert.equal((await receipt(x.operation,x.nonce)).attempts,0);await release(x.operation,x.nonce);
 });
 await stage('expired-reservation-denied-and-never-implicitly-dispatched',async()=>{
  const x=await fresh();local.sql("UPDATE busy_ai_private.operations SET created_at=now()-interval '31 seconds' WHERE id="+q(x.operation));
  await denied('busy_ai_dispatch_v1',argsFor(x.operation,x.nonce));assert.equal((await receipt(x.operation,x.nonce)).attempts,0);await release(x.operation,x.nonce);
 });
 await stage('global-cost-ceiling-serializes-concurrent-real-http-reservations',async()=>{
  const spent=Number(local.sql('SELECT spent FROM busy_ai_private.periods'));local.sql('UPDATE busy_ai_private.policy SET monthly_hard_limit='+String(spent+MAXIMUM));
  const xs=[{operation:randomUUID(),nonce:randomUUID()},{operation:randomUUID(),nonce:randomUUID()}];
  const outcomes=await Promise.all(xs.map(x=>rpc('busy_ai_reserve_v1',reserveArgs(x.operation,x.nonce))));assert.equal(outcomes.filter(r=>r.status===200).length,1);
  await release(xs[outcomes.findIndex(r=>r.status===200)].operation,xs[outcomes.findIndex(r=>r.status===200)].nonce);resetLimits();
 });
 await stage('lost-dispatch-acknowledgement-retains-unknown-liability-and-no-replay',async()=>{
  const x=bridge({dropDispatch:true}),a=await x.ledger.reserve(x.request);await assert.rejects(x.ledger.dispatch(a));
  assert.equal((await x.ledger.readReceipt(a)).status,'dispatched');await x.ledger.finish(a,{outcome:'unknown'});
  const unknown=await x.ledger.readReceipt(a);assert.equal(unknown.status,'unknown');assert.equal(unknown.attempts,1);assert.equal(local.sql('SELECT reserved FROM busy_ai_private.accounts WHERE business_id='+q(BUSINESS)),String(MAXIMUM));
  await assert.rejects(x.ledger.dispatch(a));await assert.rejects(x.ledger.finish(a,{outcome:'released'}));
  const duplicate=bridge({operation:x.operation,nonce:x.nonce});await assert.rejects(duplicate.ledger.reserve(duplicate.request),/Existing operation/);await assert.rejects(duplicate.ledger.finish(null,{outcome:'released'}),/No fresh reservation/);
  await x.ledger.finish(a,{outcome:'settled',inputTokens:500,outputTokens:500,providerReceipt:'fixture_http_reconciled_unknown'});assert.equal((await x.ledger.readReceipt(a)).status,'settled');
 });
 await stage('lost-settlement-acknowledgement-independently-reads-original-settled-receipt',async()=>{
  const x=bridge({dropSettlement:true}),a=await x.ledger.reserve(x.request);await x.ledger.dispatch(a);
  await assert.rejects(x.ledger.finish(a,{outcome:'settled',inputTokens:1000,outputTokens:500,providerReceipt:'fixture_http_lost_settlement_ack'}));
  const r=await x.ledger.readReceipt(a);assert.equal(r.status,'settled');assert.equal(r.actualGBP,.0077);assert.equal(r.providerReceipt,'fixture_http_lost_settlement_ack');
  await assert.rejects(x.ledger.dispatch(a));
 });
 await stage('real-http-client-timeout-inspects-without-redispatch-or-assuming-release',async()=>{
  const x=await fresh(),before=trace.filter(t=>t.name==='busy_ai_dispatch_v1').length,blocker=local.session('budget_http_policy_blocker');
  let timedOut=false;
  try{
   blocker.write('BEGIN;SELECT 1 FROM busy_ai_private.policy FOR UPDATE');await local.waitSql("SELECT EXISTS(SELECT 1 FROM pg_stat_activity WHERE application_name='budget_http_policy_blocker' AND state='idle in transaction')");
   try{await rpc('busy_ai_dispatch_v1',argsFor(x.operation,x.nonce),{deadlineMs:120});}catch(e){timedOut=e.name==='AbortError';}
  }finally{await blocker.finish();}
  assert.equal(timedOut,true);await local.waitSql("SELECT NOT EXISTS(SELECT 1 FROM pg_stat_activity WHERE application_name='b3_owned_postgrest' AND state='active' AND query ILIKE '%busy_ai_dispatch_v1%')");
  const observed=await receipt(x.operation,x.nonce);assert.ok(['reserved','dispatched'].includes(observed.state));assert.equal(trace.filter(t=>t.name==='busy_ai_dispatch_v1').length,before+1);
  if(observed.state==='reserved'){assert.equal(observed.attempts,0);await release(x.operation,x.nonce);}
  else {assert.equal(observed.attempts,1);await success('busy_ai_finish_v1',finishArgs(x.operation,x.nonce,'unknown'));assert.equal((await receipt(x.operation,x.nonce)).state,'unknown');await success('busy_ai_finish_v1',finishArgs(x.operation,x.nonce,'settled',{p_input:0,p_output:0,p_receipt:'fixture_http_timeout_reconciled'}));}
  return {clientTimedOut:true,independentState:observed.state,dispatchHttpRequests:1,automaticRedispatches:0};
 });
 await stage('membership-revocation-prevents-dispatch-and-receipt-content-but-retains-finish-authority',async()=>{
  const x=await fresh();local.sql('DELETE FROM public.busy_business_memberships WHERE business_id='+q(BUSINESS));
  await denied('busy_ai_dispatch_v1',argsFor(x.operation,x.nonce));await denied('busy_ai_operation_read_v1',argsFor(x.operation,x.nonce));
  await release(x.operation,x.nonce);assert.equal(local.sql('SELECT attempts FROM busy_ai_private.operations WHERE id='+q(x.operation)),'0');
  local.sql('INSERT INTO public.busy_business_memberships(business_id,user_id,role)VALUES('+[BUSINESS,OWNER,'owner'].map(q).join(',')+')');
 });
 await stage('approved-owner-edit-invalidates-reservation-source-without-losing-historical-receipt',async()=>{
  const x=await fresh();const current=await session.read();const edited=await session.website({basis:current,action:'edit_instruction',ownerApproved:true,patch:{pageId:'home',generation:current.websiteDraft.generation,instruction:'set the hero button text to "Discuss your project"'}});assert.equal(edited.ok,true);
  await denied('busy_ai_dispatch_v1',argsFor(x.operation,x.nonce));assert.equal((await receipt(x.operation,x.nonce)).attempts,0);await release(x.operation,x.nonce);
  basis=edited.observed;binding={...binding,sourceRevision:basis.websiteDraft.generation,snapshotRevision:basis.revision};
 });
 await stage('revised-Sol-8000-12000-one-pound-original-controller-reserves-settles-and-retains-unknown-over-real-http',async()=>{
  const SOL='gpt-6.1-sol',FULL=246400,INPUT=2649,OUTPUT=5000,ACTUAL=Math.ceil((INPUT*7700+OUTPUT*15400)/1000);
  assert.equal(local.sql("SELECT count(*) FROM busy_ai_private.operations WHERE state IN('reserved','dispatched','unknown')"),'0');
  const historicalOperations=Number(local.sql('SELECT count(*) FROM busy_ai_private.operations'));
  local.sql("UPDATE busy_ai_private.policy SET enabled=true,monthly_hard_limit=1000000;UPDATE busy_ai_private.accounts SET monthly_limit=1000000,expensive_limit=0,feature_limits='{\"website-design\":1000000}',concurrent_limit=1,blocked=false,active_until=now()+interval '48 hours' WHERE business_id="+q(BUSINESS));
  local.sql("INSERT INTO busy_ai_private.tariffs VALUES("+q(SOL)+",2,'website-design',true,now()+interval '48 hours',8000,12000,7700,15400,1000000,0,false,'GBP','SYNTHETIC_LOCAL_ONLY_APPROVED_USAGE_VALUATION_RATES')");
  local.sql("INSERT INTO busy_ai_private.tariffs VALUES('gpt-6-astra',1,'website-design',true,now()+interval '48 hours',8000,12000,7700,15400,1000000,0,true,'GBP','SYNTHETIC_LOCAL_ONLY_ZERO_ASTRA_ADMISSION_TEST')");
  const sol=({dropDispatch=false}={})=>{
   const operation=randomUUID(),nonce=randomUUID();let dropped=false;
   const ledger=createOriginalCreativeDocumentLedger({actor:OWNER,business:BUSINESS,binding:clone(binding),operationId:operation,requestNonce:nonce,model:SOL,budgetProfile:CREATIVE_DOCUMENT_REVISED_PROFILE,integrity:{sha256:async x=>digest(x)},rpc:async(name,args)=>{
    const value=await success(name,args);
    if(name==='busy_ai_dispatch_v1'&&dropDispatch&&!dropped){dropped=true;throw Error('Synthetic local lost Sol dispatch acknowledgement after actual HTTP200');}
    return value;
   }});
   const request={operationId:operation,scope:{ownerId:OWNER,businessId:BUSINESS,projectId:binding.projectId,sourceRevision:binding.sourceRevision,profileRevision:binding.profileRevision,surface:'website',pageId:'home'},digest:'c'.repeat(64),requestDigest:'d'.repeat(64),provider:'openai-responses',model:SOL,budgetProfile:CREATIVE_DOCUMENT_REVISED_PROFILE,tariffRevision:'2',inputTokens:INPUT,maxOutputTokens:12000,estimatedGBP:FULL/1e6,tariffInputGBPPerMillion:7.7,tariffOutputGBPPerMillion:15.4};
   return {operation,nonce,ledger,request};
  };
  for(const patch of [{inputTokens:8001},{maxOutputTokens:12001},{estimatedGBP:1.000001},{budgetProfile:'unapproved-profile'}]){
   const x=sol(),before=trace.length;await assert.rejects(x.ledger.reserve({...x.request,...patch}));assert.equal(trace.length,before,'Invalid Sol limits must fail before HTTP');
  }
  const x=sol(),spentBefore=Number(local.sql('SELECT spent FROM busy_ai_private.accounts WHERE business_id='+q(BUSINESS))),admitted=await x.ledger.reserve(x.request),observed=await x.ledger.readReservation(admitted);
  assert.equal(observed.admittedGBP,.2464);assert.equal(observed.status,'reserved-undispatched');assert.equal(observed.realUsageSettlementSupported,true);assert.equal(observed.tariffRevision,'2');
  assert.equal(local.sql('SELECT reserved FROM busy_ai_private.accounts WHERE business_id='+q(BUSINESS)),String(FULL));
  assert.equal(local.sql('SELECT concurrent_limit FROM busy_ai_private.accounts WHERE business_id='+q(BUSINESS)),'1');
  const concurrent=sol();await assert.rejects(concurrent.ledger.reserve(concurrent.request));
  await x.ledger.dispatch(admitted);assert.equal((await x.ledger.readReceipt(admitted)).attempts,1);
  await x.ledger.finish(admitted,{outcome:'settled',inputTokens:INPUT,outputTokens:OUTPUT,providerReceipt:'fixture_http_sol_synthetic_usage'});
  const settled=await x.ledger.readReceipt(admitted);assert.equal(settled.status,'settled');assert.equal(settled.actualGBP,ACTUAL/1e6);
  assert.equal(Number(local.sql('SELECT spent FROM busy_ai_private.accounts WHERE business_id='+q(BUSINESS)))-spentBefore,ACTUAL);
  assert.equal(local.sql('SELECT reserved FROM busy_ai_private.accounts WHERE business_id='+q(BUSINESS)),'0');
  await denied('busy_ai_reserve_v1',reserveArgs(randomUUID(),randomUUID(),{p_model:'gpt-6-astra'}));
  assert.equal(local.sql("SELECT count(*) FROM busy_ai_private.operations WHERE model='gpt-6-astra'"),'0');
  const lost=sol({dropDispatch:true}),lostAdmission=await lost.ledger.reserve(lost.request);await assert.rejects(lost.ledger.dispatch(lostAdmission));
  assert.equal((await lost.ledger.readReceipt(lostAdmission)).status,'dispatched');
  await lost.ledger.finish(lostAdmission,{outcome:'unknown'});const unknown=await lost.ledger.readReceipt(lostAdmission);
  assert.equal(unknown.status,'unknown');assert.equal(unknown.attempts,1);assert.equal(local.sql('SELECT reserved FROM busy_ai_private.accounts WHERE business_id='+q(BUSINESS)),String(FULL));
  await assert.rejects(lost.ledger.dispatch(lostAdmission));await assert.rejects(lost.ledger.finish(lostAdmission,{outcome:'released'}));
  const blockedByUnknown=sol();await assert.rejects(blockedByUnknown.ledger.reserve(blockedByUnknown.request));
  assert.equal(local.sql('SELECT reserved FROM busy_ai_private.accounts WHERE business_id='+q(BUSINESS)),String(FULL));
  // Explicit known-usage reconciliation exists ONLY inside this synthetic
  // fixture. An actual uncertain provider outcome is never auto-released.
  await lost.ledger.finish(lostAdmission,{outcome:'settled',inputTokens:0,outputTokens:0,providerReceipt:'fixture_http_sol_synthetic_unknown_reconciliation'});
  assert.equal((await lost.ledger.readReceipt(lostAdmission)).status,'settled');assert.equal(local.sql('SELECT reserved FROM busy_ai_private.accounts WHERE business_id='+q(BUSINESS)),'0');
  assert.ok(Number(local.sql('SELECT count(*) FROM busy_ai_private.operations'))>historicalOperations,'Original local ledger history retained');
  solProfileEvidence={model:SOL,tariffRevision:2,inputLimit:8000,totalOutputIncludingReasoningLimit:12000,syntheticInputTokens:INPUT,syntheticOutputTokens:OUTPUT,fullBoundReservationMicroGBP:FULL,actualSyntheticUsageMicroGBP:ACTUAL,SolHardUsageAccountingMicroGBP:1000000,concurrency:1,AstraAllocationMicroGBP:0,originalControllerOverRealHTTP:true,unknownLiabilityRetained:true,unknownPreventsConcurrentAdmission:true,automaticRedispatches:0,providerRequests:0,realProviderUsageOrSpending:false};
  return solProfileEvidence;
 });
 await stage('real-usage-overrun-blocks-next-admission-and-preserves-authoritative-cost',async()=>{
  const x=await fresh();await success('busy_ai_dispatch_v1',argsFor(x.operation,x.nonce));
  const r=await success('busy_ai_finish_v1',finishArgs(x.operation,x.nonce,'settled',{p_input:8000,p_output:8000,p_receipt:'fixture_http_overrun'}));assert.equal(r.overrun,true);
  assert.equal(local.sql('SELECT enabled FROM busy_ai_private.policy'),'f');assert.equal(local.sql('SELECT blocked FROM busy_ai_private.accounts WHERE business_id='+q(BUSINESS)),'t');
  await denied('busy_ai_reserve_v1',reserveArgs(randomUUID(),randomUUID()));assert.ok((await receipt(x.operation,x.nonce)).actualMicroGBP>MAXIMUM);
  return {providerWasCalled:false,usageEvidence:'synthetic local only; actual original accounting over HTTP'};
 });
 await stage('final-source-still-private-ledger-history-retained-and-no-provider-transport',async()=>{
  assert.equal(local.sql('SELECT count(*) FROM public.busy_websites'),'0');assert.equal(local.sql('SELECT count(*) FROM public.busy_website_deployments'),'0');
  assert.equal(local.sql("SELECT count(*) FROM busy_ai_private.operations WHERE state IN('reserved','dispatched','unknown')"),'0');
  assert.equal(local.sql('SELECT reserved FROM busy_ai_private.accounts WHERE business_id='+q(BUSINESS)),'0');assert.ok(Number(local.sql('SELECT count(*) FROM busy_ai_private.events'))>20);
  assert.equal(trace.every(x=>allowed.has(x.name)),true);return {httpRpcRequests:trace.length,providerRequests:0,hostedWrites:0};
 });
}catch(error){fatal=error;}
finally{
 if(local)try{await local.cleanup();cleanupCompleted=true;results.push({id:'owned-local-process-and-cluster-cleanup',passed:true});}catch{results.push({id:'owned-local-process-and-cluster-cleanup',passed:false,error:'cleanup_failed'});fatal??=Error('cleanup_failed');}
 const receipt={version:1,kind:'Real loopback HTTP central v2 AI-budget verification',transport:'Pinned PostgREST 14.18 and original PostgreSQL17 authorities',postgrest:local?.binary||null,hosted:false,hostedMutations:0,nativeAuthAcceptance:false,syntheticNativeJwtAuth:true,syntheticEntitlements:true,syntheticTariffs:true,syntheticUsageReceipts:true,realProviderAvailabilityVerified:false,providerCalls:0,actualSpendingGBP:0,localSyntheticAdmissionMicroGBP:MAXIMUM,localOutputCompatibility,solProfileEvidence,policyEnabledOnlyInDisposableFixture:true,cleanupCompleted,results,summary:{passed:results.filter(r=>r.passed).length,failed:results.filter(r=>!r.passed).length}};
 const serialized=JSON.stringify(receipt,null,2)+'\n';assert.ok(!/sb_publishable_|sb_secret_|Bearer |eyJ[A-Za-z0-9_-]+\./.test(serialized),'No credentials may enter the receipt');mkdirSync('.test-artifacts/ai-budget-http',{recursive:true});writeFileSync('.test-artifacts/ai-budget-http/postgrest.json',serialized);console.log(JSON.stringify({receipt:'.test-artifacts/ai-budget-http/postgrest.json',summary:receipt.summary,cleanupCompleted}));
}
if(fatal){console.error('Local real-HTTP budget regression failed; inspect sanitised stage evidence. No hosted action was attempted.');process.exitCode=1;}
