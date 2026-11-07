import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {randomUUID} from 'node:crypto';
import {aiLabRunnerFoundationPackage,runnerExecutionDerivative} from './lib/ai-lab-runner-foundation-package.mjs';
import {aiLabB3SourceContractPackage,sourceContractExecutionDerivative} from './lib/ai-lab-b3-source-contract-package.mjs';
import {AI_LAB_B3_SOURCE_PLAN as plan,AI_LAB_B3_SOURCE_PLAN_DIGEST,createAiLabB3SourceOrchestrator} from './lib/ai-lab-b3-source.mjs';
import {AI_LAB_B3_RUNTIME_VERSION,AI_LAB_B3_URL,createAiLabB3Runtime} from './lib/ai-lab-b3-runtime.mjs';
import {renderWebsiteHtml} from '../src/domain/websiteBuilder.js';

// Actual original PostgreSQL RPCs in one Unix-only disposable database. The
// auth.uid() fixture and readAuthenticatedOwner callback are synthetic; neither
// establishes native hosted Auth, deployment, approval or provider acceptance.
const bin=process.env.BUSY_LOCAL_PG_BIN||'/workspace/pg17-disposable/root/usr/lib/postgresql/17/bin/psql';
const socket=process.env.BUSY_LOCAL_PG_SOCKET||'/workspace/pg17-disposable/socket';
const data=process.env.BUSY_LOCAL_PG_DATA||'/workspace/pg17-disposable/data';
const port=process.env.BUSY_LOCAL_PG_PORT||'5432';
const db='busy_ai_lab_b3_source_disposable',O=randomUUID(),B=randomUUID(),F=randomUUID(),results=[];
const q=v=>v==null?'NULL':"'"+(typeof v==='object'?JSON.stringify(v):String(v)).replaceAll("'","''")+"'";
const sql=(s,d=db,atomic=true)=>execFileSync(bin,['-X','-h',socket,'-p',port,'-U','postgres','-v','ON_ERROR_STOP=1','-v','VERBOSITY=verbose','-qAt','-d',d],{input:atomic?'BEGIN;\n'+s+';\nCOMMIT;\n':s,encoding:'utf8',stdio:['pipe','pipe','pipe'],maxBuffer:32*1024*1024}).trim();
const json=s=>JSON.parse(sql(s)),clone=v=>JSON.parse(JSON.stringify(v));
const stage=async(id,fn)=>{try{await fn();results.push({id,passed:true});}catch(e){results.push({id,passed:false,error:String(e.stderr||e.stack).slice(-3000)});throw e;}};
const signatures={
 busy_connected_workspaces_v1:[],busy_connected_initialize_v1:['p_business_id'],busy_connected_builder_read_v1:['p_business_id'],busy_connected_builder_source_state_v1:['p_business_id'],
 busy_connected_profile_write_v1:['p_business_id','p_expected_revision','p_expected_profile','p_profile','p_owner_approved'],
 busy_connected_website_commit_v1:['p_business_id','p_actor_id','p_expected_revision','p_expected_draft','p_candidate','p_profile_revision'],
 busy_ai_context_v1:['p_actor','p_business','p_binding'],
 busy_connected_website_history_v1:['p_business_id','p_expected_revision','p_expected_hash','p_direction']
};
let actor=O,lastHappy=null;
function invoke(role,name,params){
 const keys=signatures[name];assert.ok(keys,'Unexpected RPC');assert.deepEqual(Object.keys(params).sort(),[...keys].sort());
 const call='SELECT public.'+name+'('+keys.map(k=>k+'=>'+q(params[k])).join(',')+');';
 return json('SET LOCAL ROLE '+role+';'+(role==='authenticated'?'SET LOCAL request.jwt.claim.sub='+q(actor)+';':'')+call);
}
const ownerRpc=(name,params)=>invoke('authenticated',name,params);
const read=()=>ownerRpc('busy_connected_builder_read_v1',{p_business_id:B});
function resetSource(){actor=O;sql('DELETE FROM public.busy_public_business_profiles;DELETE FROM public.busy_business_snapshots;');assert.equal(sql('SELECT count(*) FROM public.busy_businesses'),'1');assert.equal(sql('SELECT count(*) FROM public.busy_business_memberships'),'1');}
function fixture(options={}){
 const calls=[],writes=[];let approvals=0,approvalUsed=false,staleProfile=options.staleProfile===true,staleCommit=options.staleCommit===true,lose=options.lose||null;
 const manifest={ownerId:O,businessId:B,executionId:randomUUID(),requestNonce:randomUUID(),sourcePlanDigest:AI_LAB_B3_SOURCE_PLAN_DIGEST};
 const authenticatedRpc=async(name,args)=>{
  calls.push({role:'authenticated',name});
  if(staleProfile&&name==='busy_connected_profile_write_v1'){
   staleProfile=false;ownerRpc(name,{...args,p_profile:{...clone(plan.profile),description:'Concurrent approved fictional wording'}});
  }
  if(['busy_connected_initialize_v1','busy_connected_profile_write_v1'].includes(name))writes.push(name);
  const r=ownerRpc(name,args);if(lose===name){lose=null;throw Error('Synthetic lost acknowledgement after actual original PostgreSQL write');}return r;
 };
 const serviceRpc=async(name,args)=>{
  calls.push({role:'service',name});assert.equal(name,'busy_connected_website_commit_v1');writes.push(name);
  const actual=staleCommit?(staleCommit=false,{...args,p_expected_revision:args.p_expected_revision+1}):args;
  const r=invoke('service_role',name,actual);if(lose===name){lose=null;throw Error('Synthetic lost acknowledgement after actual original PostgreSQL commit');}return r;
 };
 const absentCounts=()=>sql('SELECT NOT EXISTS(SELECT 1 FROM public.busy_business_snapshots WHERE business_id='+q(B)+') AND NOT EXISTS(SELECT 1 FROM public.busy_public_business_profiles WHERE business_id='+q(B)+')')==='t';
 let runtime=null;const bridgeTrace=[];
 let ownerPort=authenticatedRpc,servicePort=serviceRpc,verifyOwner=async()=>({id:options.foreignOwner?F:O,anonymous:false,emailConfirmed:true});
 let verifySourceEmpty=async binding=>{
  assert.equal(binding.ownerId,O);assert.equal(binding.businessId,B);
  const state=ownerRpc('busy_connected_builder_source_state_v1',{p_business_id:B});
  assert.equal(state.version,'busy.connected-builder-source-state.v1');assert.equal(state.actorId,O);assert.equal(state.businessId,B);
  return {empty:state.empty===true&&state.snapshotExists===false&&state.profileExists===false&&absentCounts()};
 };
 if(options.runtimeBridge){
  const now=Date.parse('2026-11-07T12:00:00Z'),publishableKey='sb_publishable_SYNTHETIC_ONLY_0000000000000000',serviceKey='sb_secret_SYNTHETIC_ONLY_000000000000000000',password='SYNTHETIC_NOT_A_REAL_PASSWORD_000000',token='synthetic_header.synthetic_payload.synthetic_signature';
  const nativeOwner={id:O,email:'quiet-light-owner@busy-ai-lab.invalid',role:'authenticated',aud:'authenticated',is_anonymous:false,email_confirmed_at:'2026-11-06T22:00:00Z',deleted_at:null,banned_until:null,is_super_admin:false,is_sso_user:false,identities:[{provider:'email',user_id:O}]};
  const response=(value,status=200)=>new Response(JSON.stringify(value),{status,headers:{'Content-Type':'application/json'}});
  runtime=createAiLabB3Runtime({version:AI_LAB_B3_RUNTIME_VERSION,projectId:'sbvkrvksnruiclcvclbd',organizationId:'wrjfgasxtlznzfzmfrif',region:'eu-west-1',...manifest,approval:{status:'owner-approved',manifestDigest:'d'.repeat(64),expiresAt:new Date(now+600000).toISOString()}},{now:()=>now,credentialReader:async()=>({publishableKey,serviceKey}),ownerPasswordReader:async()=>password,consumeDispatchPermit:async binding=>({status:'consumed',executionId:binding.executionId,requestNonce:binding.requestNonce,manifestDigest:binding.manifestDigest}),fetchImpl:async(url,init)=>{
   assert.ok(url.startsWith(AI_LAB_B3_URL+'/'));const parsed=new URL(url),headers=new Headers(init.headers);bridgeTrace.push({path:parsed.pathname,method:init.method});
   if(parsed.pathname==='/auth/v1/token'){assert.equal(headers.get('apikey'),publishableKey);assert.equal(parsed.search,'?grant_type=password');assert.deepEqual(JSON.parse(init.body),{email:nativeOwner.email,password});return response({access_token:token,token_type:'bearer',expires_in:3600,user:nativeOwner});}
   if(parsed.pathname==='/auth/v1/user'){assert.equal(headers.get('apikey'),publishableKey);assert.equal(headers.get('authorization'),'Bearer '+token);return response(nativeOwner);}
   assert.ok(parsed.pathname.startsWith('/rest/v1/rpc/'));const name=parsed.pathname.slice('/rest/v1/rpc/'.length),args=JSON.parse(init.body);let value;
   try{
    if(headers.get('apikey')===serviceKey){assert.equal(headers.get('authorization'),null);value=await serviceRpc(name,args);}else{assert.equal(headers.get('apikey'),publishableKey);assert.equal(headers.get('authorization'),'Bearer '+token);value=await authenticatedRpc(name,args);}
   }catch(e){const error=String(e.stderr||e).match(/\b(?:ERROR|FATAL):\s+([A-Z0-9]{5}):\s+([^\n]+)/);if(!error)throw e;const code=error[1],status=code.startsWith('PT')?Number(code.slice(2)):({P0002:500,'42501':403,'22023':400,'23505':409,'55P03':500,'40001':500}[code]);if(!Number.isInteger(status))throw e;return response({code,message:error[2],details:null,hint:null},status);}
   bridgeTrace.at(-1).responseKeys=Object.keys(value).sort();return response(value);
  }});
  ownerPort=runtime.ownerRpc;servicePort=runtime.serviceRpc;verifyOwner=runtime.verifyOwner;verifySourceEmpty=async binding=>{assert.equal(binding.ownerId,O);assert.equal(binding.businessId,B);const result=await runtime.probeEmptySource();assert.equal(absentCounts(),true);return result;};
 }
 const runner=createAiLabB3SourceOrchestrator({manifest,authenticatedRpc:ownerPort,serviceRpc:servicePort,readAuthenticatedOwner:verifyOwner,verifySourceEmpty,consumeApproval:async binding=>{approvals++;if(approvalUsed)return {consumed:false};approvalUsed=true;return {...binding,consumed:true};}});
 return {runner,calls,writes,bridgeTrace,runtime,get approvals(){return approvals;}};
}
function noSpending(){assert.equal(sql('SELECT enabled FROM busy_ai_private.policy'),'f');assert.equal(sql('SELECT monthly_hard_limit FROM busy_ai_private.policy'),'0');for(const t of ['accounts','periods','tariffs','operations','events'])assert.equal(sql('SELECT count(*) FROM busy_ai_private.'+t),'0');}
try{
 await stage('dedicated-unix-only-pg17-original-foundation-and-fictional-owner-fixture',()=>{
  assert.ok(socket.startsWith('/')&&data.startsWith('/'));assert.equal(sql('SHOW listen_addresses','postgres'),'');assert.equal(sql('SHOW data_directory','postgres'),data);const version=Number(sql('SHOW server_version_num','postgres'));assert.ok(version>=170000&&version<180000);
  sql('DROP DATABASE IF EXISTS '+db,'postgres',false);sql('CREATE DATABASE '+db,'postgres',false);sql(readFileSync('scripts/fixtures/ai-lab/empty-native.sql','utf8'));
  const foundation=aiLabRunnerFoundationPackage(process.cwd());assert.equal(foundation.sha256,'b825989b37e2fef0f874ccdb03405a6650f8dc6ddfe27f94086952cc1cec225d');sql(runnerExecutionDerivative(foundation.sql));
  sql('INSERT INTO auth.users(id) VALUES('+q(O)+');INSERT INTO public.busy_businesses(id,name,created_by) VALUES('+[B,plan.profile.businessName,O].map(q).join(',')+');INSERT INTO public.busy_business_memberships(business_id,user_id,role) VALUES('+[B,O,'owner'].map(q).join(',')+');CREATE SCHEMA supabase_migrations;CREATE TABLE supabase_migrations.schema_migrations(version text PRIMARY KEY,statements text[] DEFAULT ARRAY[]::text[],name text NOT NULL);INSERT INTO supabase_migrations.schema_migrations(version,name) VALUES(\'20261106221950\',\'mission18_ai_lab_foundation\'),(\'20261107000304\',\'ai_lab_quiet_light_owner_setup_v1\');');
  // Synthetic local native-history labels, never hosted installation evidence.
  const contract=aiLabB3SourceContractPackage(process.cwd());sql(sourceContractExecutionDerivative(contract.sql));
  sql('INSERT INTO auth.users(id) VALUES('+q(F)+');');
  assert.equal(sql('SELECT count(*) FROM public.busy_business_snapshots'),'0');assert.equal(sql('SELECT count(*) FROM public.busy_public_business_profiles'),'0');noSpending();
 });
 await stage('new-orchestrator-six-real-original-writes-exact-source-pages-history-and-readback',async()=>{
  const f=fixture({runtimeBridge:true}),r=await f.runner.run();assert.equal(r.ok,true,JSON.stringify({result:r,transport:f.bridgeTrace,runtime:f.runtime.inspect()}));assert.equal(r.writesAttempted,6);assert.equal(f.writes.length,6);assert.equal(f.approvals,1);assert.deepEqual(r.completedSteps,plan.operations.map(x=>x.id));assert.equal(r.receipts.length,5);assert.equal(f.runtime.inspect().counts.authSignIns,1);assert.equal(f.runtime.inspect().writes.busy_connected_initialize_v1,1);assert.equal(f.runtime.inspect().writes.busy_connected_profile_write_v1,1);assert.equal(f.runtime.inspect().writes.busy_connected_website_commit_v1,4);assert.ok(f.bridgeTrace.some(t=>t.path==='/auth/v1/user'));assert.ok(f.bridgeTrace.some(t=>t.path==='/rest/v1/rpc/busy_connected_builder_read_v1'));
  const basis=read();assert.deepEqual(basis,r.observed);assert.deepEqual(basis.profile,plan.profile);assert.equal(basis.profileRevision,1);assert.deepEqual(basis.websiteDraft.pages.map(p=>p.id),plan.pageIds);assert.equal(basis.websiteDraft.sections.find(s=>s.id===r.source.storySectionId).body,plan.story.body);assert.equal(basis.websiteDraft.sections.find(s=>s.id==='hero').cta,plan.action.wording);assert.equal(basis.websiteDraft.sections.find(s=>s.id==='hero').ctaHref,plan.action.destination);assert.equal(basis.websiteUndoCount,3);assert.equal(basis.websiteRedoCount,0);
  // The original history reader binds the CURRENT DRAFT hash, independently
  // of the history hash returned for save/readback bookkeeping.
  const history=ownerRpc('busy_connected_website_history_v1',{p_business_id:B,p_expected_revision:basis.revision,p_expected_hash:basis.websiteDraftHash,p_direction:'undo'});assert.equal(history.businessId,B);assert.equal(history.actorId,O);assert.equal(history.direction,'undo');assert.ok(history.target);
  const context=invoke('service_role','busy_ai_context_v1',{p_actor:O,p_business:B,p_binding:r.binding});assert.equal(context.ownerId,O);assert.equal(context.businessId,B);assert.deepEqual(context.project,basis.websiteDraft);assert.deepEqual(context.profile,basis.profile);
  for(const page of basis.websiteDraft.pages){const html=renderWebsiteHtml(basis.websiteDraft,page.id,{standalone:true});assert.ok(html.startsWith('<!doctype html>'));assert.equal((html.match(/<h1\b/g)||[]).length,1);assert.ok(!/<img\b|<script\b|<iframe\b/i.test(html));}
  const calls=f.calls.length;assert.equal((await f.runner.run()).status,'already-used');assert.equal(f.calls.length,calls);assert.equal(f.writes.length,6);lastHappy={snapshotRevision:basis.revision,profileRevision:basis.profileRevision,websiteGeneration:basis.websiteDraft.generation,undoCount:basis.websiteUndoCount,sourcePlanDigest:r.source.sourcePlanDigest,actualOriginalWriteNames:f.writes,runtimeCounters:f.runtime.inspect().counts,runtimeWriteCounts:f.runtime.inspect().writes,syntheticHttpTransportToActualPostgres:true};f.runtime.close();noSpending();
 });
 await stage('foreign-authenticated-owner-denies-new-orchestrator-before-any-source-write',async()=>{
  resetSource();const f=fixture({foreignOwner:true}),r=await f.runner.run();assert.equal(r.ok,false);assert.equal(r.writesAttempted,0);assert.equal(f.approvals,0);assert.equal(f.calls.length,0);assert.equal(sql('SELECT count(*) FROM public.busy_business_snapshots'),'0');
  actor=F;assert.throws(()=>read(),e=>/Owner required|Not authorised/.test(String(e.stderr||e)));actor=O;
 });
 await stage('revoked-real-postgresql-membership-denies-before-approval',async()=>{
  resetSource();sql('DELETE FROM public.busy_business_memberships WHERE business_id='+q(B));const f=fixture(),r=await f.runner.run();assert.equal(r.ok,false);assert.equal(r.writesAttempted,0);assert.equal(f.approvals,0);assert.equal(f.writes.length,0);assert.equal(sql('SELECT count(*) FROM public.busy_business_snapshots'),'0');sql('INSERT INTO public.busy_business_memberships(business_id,user_id,role) VALUES('+[B,O,'owner'].map(q).join(',')+');');
  resetSource();ownerRpc('busy_connected_initialize_v1',{p_business_id:B});const existing=fixture(),denied=await existing.runner.run();assert.equal(denied.ok,false);assert.equal(denied.writesAttempted,0);assert.equal(existing.approvals,0);assert.equal(existing.writes.length,0);assert.equal(read().revision,1);assert.equal(read().websiteDraft,null);
 });
 await stage('stale-original-profile-cas-preserves-concurrent-owner-wording-and-stops',async()=>{
  resetSource();const f=fixture({staleProfile:true}),r=await f.runner.run();assert.equal(r.ok,false);assert.equal(r.phase,'profile');assert.equal(r.mayReplay,false);assert.equal(r.writesAttempted,2);const observed=read();assert.equal(observed.profile.description,'Concurrent approved fictional wording');assert.equal(observed.profileRevision,1);assert.equal(observed.websiteDraft,null);const n=f.calls.length;assert.equal((await f.runner.run()).status,'already-used');assert.equal(f.calls.length,n);
 });
 await stage('stale-original-website-cas-denies-commit-and-preserves-profile-source',async()=>{
  resetSource();const f=fixture({staleCommit:true}),r=await f.runner.run();assert.equal(r.ok,false);assert.equal(r.phase,'create');assert.equal(r.mayReplay,false);assert.equal(r.writesAttempted,3);const observed=read();assert.deepEqual(observed.profile,plan.profile);assert.equal(observed.websiteDraft,null);assert.equal(observed.websiteUndoCount,0);const n=f.calls.length;assert.equal((await f.runner.run()).status,'already-used');assert.equal(f.calls.length,n);
 });
 for(const [rpc,phase,attempts] of [['busy_connected_initialize_v1','initialize',1],['busy_connected_profile_write_v1','profile',2],['busy_connected_website_commit_v1','create',3]])await stage('lost-'+phase+'-acknowledgement-after-real-write-is-inspected-without-replay',async()=>{
  resetSource();const f=fixture({lose:rpc}),r=await f.runner.run();assert.equal(r.ok,false);assert.equal(r.phase,phase);assert.equal(r.status,'unknown-outcome');assert.equal(r.writesAttempted,attempts);assert.equal(f.writes.length,attempts);assert.equal(r.mayReplay,false);assert.equal(r.requiresIndependentInspection,true);
  const observed=read();assert.equal(observed.businessId,B);assert.equal(sql('SELECT count(*) FROM public.busy_business_snapshots'),'1');if(phase==='initialize'){assert.equal(observed.profile,null);assert.equal(observed.websiteDraft,null);}else{assert.deepEqual(observed.profile,plan.profile);assert.equal(observed.profileRevision,1);if(phase==='create'){assert.ok(observed.websiteDraft);assert.equal(observed.websiteDraft.sections.some(s=>s.type==='text'),false);}else assert.equal(observed.websiteDraft,null);}
  const n=f.calls.length;assert.equal((await f.runner.run()).status,'already-used');assert.equal(f.calls.length,n);assert.equal(f.writes.length,attempts);noSpending();
 });
 await stage('default-off-ai-and-original-api-write-boundaries-remain-enforced',()=>{
  noSpending();assert.equal(sql('SELECT count(*) FROM public.busy_businesses'),'1');assert.equal(sql('SELECT count(*) FROM public.busy_business_memberships'),'1');for(const role of ['anon','authenticated','service_role']){assert.equal(sql("SELECT has_table_privilege("+q(role)+",'public.busy_business_snapshots','INSERT,UPDATE,DELETE')"),'f');assert.equal(sql("SELECT has_schema_privilege("+q(role)+",'busy_ai_private','USAGE,CREATE')"),'f');}assert.equal(sql("SELECT count(*) FROM pg_tables WHERE schemaname='public'"),'28');assert.equal(sql("SELECT count(*) FROM pg_tables WHERE schemaname='busy_ai_private'"),'6');
 });
}finally{
 const receipt={version:1,database:db,hosted:false,nativeAuthAcceptance:false,authFixture:'Synthetic auth.uid and authenticated-owner callback; real original SQL authorisation, CAS and persistence.',syntheticDataOnly:true,providerCalls:0,spendingGBP:0,hostedMutations:0,sourcePlanDigest:AI_LAB_B3_SOURCE_PLAN_DIGEST,sourcePlanWrites:6,lastHappy,results,summary:{passed:results.filter(r=>r.passed).length,failed:results.filter(r=>!r.passed).length}};
 mkdirSync('.test-artifacts/ai-lab-b3',{recursive:true});writeFileSync('.test-artifacts/ai-lab-b3/postgres.json',JSON.stringify(receipt,null,2)+'\n');console.log(JSON.stringify(receipt));
}
