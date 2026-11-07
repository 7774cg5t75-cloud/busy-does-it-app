import assert from 'node:assert/strict';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {randomUUID} from 'node:crypto';
import {aiLabRunnerFoundationPackage,runnerExecutionDerivative} from './lib/ai-lab-runner-foundation-package.mjs';
import {AI_LAB_B3_SOURCE_PLAN as plan,AI_LAB_B3_SOURCE_PLAN_DIGEST,createAiLabB3SourceOrchestrator} from './lib/ai-lab-b3-source.mjs';
import {AI_LAB_B3_RUNTIME_VERSION,AI_LAB_B3_URL,AI_LAB_B3_SOURCE_STATE_RPC as STATE,AI_LAB_B3_SOURCE_STATE_VERSION,createAiLabB3Runtime} from './lib/ai-lab-b3-runtime.mjs';
import {startB3LocalPostgrest,quote as q} from './lib/ai-lab-b3-postgrest-local.mjs';
import {createConnectedBuilderSession} from '../src/staging/connectedBuilderSession.mjs';
import {privateWebsiteDraftAction} from '../supabase/functions/busy-website-publish/privateDraftService.mjs';
import {renderWebsiteHtml} from '../src/domain/websiteBuilder.js';

// Actual pinned PostgREST verifies real locally signed JWTs and executes original
// SQL/RLS. The native Auth HTTP facade, users, keys, passwords and auth.uid()
// compatibility fixture are synthetic. No hosted/native Auth acceptance follows.
const O=randomUUID(),B=randomUUID(),F=randomUUID(),OTHER=randomUUID(),results=[];
const clone=v=>JSON.parse(JSON.stringify(v));
const sourceContractManifest=JSON.parse(readFileSync('docs/sql-proposals/ai-lab-b3-empty-source/manifest.json','utf8'));
let local,lastHappy=null,preFix=null,faultEvidence={},fatal=null;
const stage=async(id,fn)=>{const start=performance.now();try{const detail=await fn();results.push({id,passed:true,elapsedMs:Math.round(performance.now()-start),...(detail?{detail}:{})});console.log('PASS '+id);}catch(error){const numeric=value=>['number','boolean'].includes(typeof value)?value:null;results.push({id,passed:false,elapsedMs:Math.round(performance.now()-start),error:error?.code==='ERR_ASSERTION'?'assertion_failed':'local_fixture_failed',actual:numeric(error?.actual),expected:numeric(error?.expected)});throw error;}};
const allowed=new Set([STATE,'busy_connected_workspaces_v1','busy_connected_initialize_v1','busy_connected_builder_read_v1','busy_connected_profile_write_v1','busy_connected_website_commit_v1','busy_connected_website_history_v1','busy_connected_website_transition_v1','busy_ai_context_v1']);
const rpc=async(name,args={},role='authenticated',actor=O,claims={})=>{assert.ok(allowed.has(name));return local.http('/rpc/'+name,{token:local.jwt(role,actor,claims),body:args});};
const value=async(name,args={},role='authenticated',actor=O)=>{const r=await rpc(name,args,role,actor);assert.equal(r.status,200,'Expected original RPC HTTP200 for '+name);return r.json;};
const read=()=>value('busy_connected_builder_read_v1',{p_business_id:B});
const reset=()=>local.sql('DELETE FROM public.busy_public_business_profiles;DELETE FROM public.busy_business_snapshots;');
const noSpending=()=>{assert.equal(local.sql('SELECT enabled OR monthly_hard_limit<>0 FROM busy_ai_private.policy'),'f');for(const name of ['accounts','periods','tariffs','operations','events'])assert.equal(local.sql('SELECT count(*) FROM busy_ai_private.'+name),'0');};
const unchangedEmpty=()=>{assert.equal(local.sql('SELECT count(*) FROM public.busy_business_snapshots'),'0');assert.equal(local.sql('SELECT count(*) FROM public.busy_public_business_profiles'),'0');};
const assertReviewedProbe=()=>{
 const definition=JSON.parse(local.sql(`SELECT jsonb_build_object('bodySha256',encode(sha256(convert_to(p.prosrc,'UTF8')),'hex'),'owner',pg_get_userbyid(p.proowner),'securityDefiner',p.prosecdef,'config',p.proconfig,'anonExecute',has_function_privilege('anon',p.oid,'EXECUTE'),'authenticatedExecute',has_function_privilege('authenticated',p.oid,'EXECUTE'),'serviceExecute',has_function_privilege('service_role',p.oid,'EXECUTE'),'publicExecute',EXISTS(SELECT 1 FROM aclexplode(coalesce(p.proacl,acldefault('f',p.proowner))) a WHERE a.grantee=0 AND a.privilege_type='EXECUTE')) FROM pg_proc p WHERE p.oid='public.busy_connected_builder_source_state_v1(uuid)'::regprocedure`));
 assert.deepEqual(definition,{bodySha256:sourceContractManifest.newFunctionBodySha256,owner:'postgres',securityDefiner:true,config:['search_path=pg_catalog, pg_temp','lock_timeout=2s'],anonExecute:false,authenticatedExecute:true,serviceExecute:false,publicExecute:false});return definition;
};
function fixture(options={}){
 const manifest={ownerId:O,businessId:B,executionId:randomUUID(),requestNonce:randomUUID(),sourcePlanDigest:AI_LAB_B3_SOURCE_PLAN_DIGEST};
 const publishableKey='sb_publishable_SYNTHETIC_LOCAL_ONLY_000000000000',serviceKey='sb_secret_SYNTHETIC_LOCAL_ONLY_000000000000000',password='SYNTHETIC_LOCAL_ONLY_PASSWORD';
 const ownerToken=local.jwt('authenticated',options.foreignOwner?F:O),serviceToken=local.jwt('service_role');
 const nativeOwner={id:options.foreignOwner?F:O,email:'quiet-light-owner@busy-ai-lab.invalid',role:'authenticated',aud:'authenticated',is_anonymous:false,email_confirmed_at:'2026-11-06T22:00:00Z',deleted_at:null,banned_until:null,identities:[{provider:'email',user_id:options.foreignOwner?F:O}]};
 const trace=[],writes=[],commitArgs=[];let approvals=0,consumed=false,lose=options.lose,staleProfile=options.staleProfile,staleCommit=options.staleCommit,withdraw=options.withdraw;
 const response=(body,status=200,headers={})=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json',...headers}});
 const runtime=createAiLabB3Runtime({version:AI_LAB_B3_RUNTIME_VERSION,projectId:'sbvkrvksnruiclcvclbd',organizationId:'wrjfgasxtlznzfzmfrif',region:'eu-west-1',...manifest,approval:{status:'owner-approved',manifestDigest:'d'.repeat(64),expiresAt:new Date(Date.now()+600000).toISOString()}},{requestTimeoutMs:4000,credentialReader:async()=>({publishableKey,serviceKey}),ownerPasswordReader:async()=>password,consumeDispatchPermit:async b=>({status:'consumed',executionId:b.executionId,requestNonce:b.requestNonce,manifestDigest:b.manifestDigest}),fetchImpl:async(url,init)=>{
  const parsed=new URL(url);assert.equal(parsed.origin,AI_LAB_B3_URL);const headers=new Headers(init.headers);trace.push({path:parsed.pathname,method:init.method});
  if(parsed.pathname==='/auth/v1/token'){assert.equal(parsed.search,'?grant_type=password');assert.equal(headers.get('apikey'),publishableKey);assert.deepEqual(JSON.parse(init.body),{email:nativeOwner.email,password});return response({access_token:ownerToken,token_type:'bearer',expires_in:3600,user:nativeOwner});}
  if(parsed.pathname==='/auth/v1/user'){assert.equal(headers.get('authorization'),'Bearer '+ownerToken);return response(nativeOwner);}
  assert.ok(parsed.pathname.startsWith('/rest/v1/rpc/'));assert.equal(parsed.search,'');const name=parsed.pathname.slice('/rest/v1/rpc/'.length);assert.ok(allowed.has(name));const args=JSON.parse(init.body),service=headers.get('apikey')===serviceKey;
  if(service){assert.equal(headers.get('authorization'),null);assert.equal(name,'busy_connected_website_commit_v1');commitArgs.push(clone(args));}else{assert.equal(headers.get('apikey'),publishableKey);assert.equal(headers.get('authorization'),'Bearer '+ownerToken);}
  if(staleProfile&&name==='busy_connected_profile_write_v1'){staleProfile=false;await value(name,{...args,p_profile:{...clone(plan.profile),description:'Concurrent fictional owner wording'}});}
  if(staleCommit&&name==='busy_connected_website_commit_v1'){staleCommit=false;args.p_expected_revision++;}
  if(withdraw&&name==='busy_connected_profile_write_v1'){withdraw=false;local.sql('DELETE FROM public.busy_business_memberships WHERE business_id='+q(B));}
  if(['busy_connected_initialize_v1','busy_connected_profile_write_v1','busy_connected_website_commit_v1'].includes(name))writes.push(name);
  // This is the only network remapping. No arbitrary URL or fallback to the
  // real Lab exists; JWT verification and every RPC response come from HTTP.
  const r=await local.http('/rpc/'+name,{token:service?serviceToken:ownerToken,body:args,deadlineMs:4500});
  trace.at(-1).status=r.status;
  if(lose===name&&r.status===200){lose=null;throw Error('Local transport dropped acknowledgement after verified HTTP200');}
  return response(r.json,r.status,{'Content-Type':r.headers.get('content-type')||'application/json'});
 }});
 const runner=createAiLabB3SourceOrchestrator({manifest,authenticatedRpc:runtime.ownerRpc,serviceRpc:runtime.serviceRpc,readAuthenticatedOwner:runtime.verifyOwner,verifySourceEmpty:()=>runtime.probeEmptySource(),consumeApproval:async b=>{approvals++;if(consumed)return {consumed:false};consumed=true;return {...b,consumed:true};}});
 return {runner,runtime,trace,writes,commitArgs,get approvals(){return approvals;}};
}
try{
 await stage('pinned-postgrest-and-self-owned-loopback-pg17-cluster',async()=>{local=await startB3LocalPostgrest();assert.equal(local.sql('SHOW data_directory').includes('busy-b3-pgrst-'),true);assert.equal(local.sql('SHOW listen_addresses'),'127.0.0.1');return local.binary;});
 await stage('original-foundation-and-synthetic-native-prerequisites',()=>{
  local.sql(readFileSync('scripts/fixtures/ai-lab/empty-native.sql','utf8'));
  local.sql(`CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$SELECT coalesce(nullif(current_setting('request.jwt.claim.sub',true),''),nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'sub')::uuid$$;`);
  local.sql(runnerExecutionDerivative(aiLabRunnerFoundationPackage(process.cwd()).sql));
  local.sql('INSERT INTO auth.users(id) VALUES('+q(O)+');INSERT INTO public.busy_businesses(id,name,created_by) VALUES('+[B,plan.profile.businessName,O].map(q).join(',')+');INSERT INTO public.busy_business_memberships(business_id,user_id,role) VALUES('+[B,O,'owner'].map(q).join(',')+');CREATE SCHEMA supabase_migrations;CREATE TABLE supabase_migrations.schema_migrations(version text PRIMARY KEY,name text,statements text[]);INSERT INTO supabase_migrations.schema_migrations(version,name) VALUES(\'20261106221950\',\'mission18_ai_lab_foundation\'),(\'20261107000304\',\'ai_lab_quiet_light_owner_setup_v1\');');noSpending();unchangedEmpty();
 });
 await stage('pre-fix-real-http-40001-retry-reproduction-has-client-deadline',async()=>{
  await local.startHttp();const before=(local.log().match(/Workspace unavailable/g)||[]).length,started=performance.now();let timedOut=false;
  try{await local.http('/rpc/busy_connected_builder_read_v1',{token:local.jwt('authenticated',O),body:{p_business_id:B},deadlineMs:450});}catch(error){timedOut=error.name==='AbortError';}
  const elapsedMs=Math.round(performance.now()-started);await local.stopHttp();const engineErrors=(local.log().match(/Workspace unavailable/g)||[]).length-before;
  assert.equal(timedOut,true);assert.ok(elapsedMs<1800);assert.ok(engineErrors>=2,'PostgreSQL must observe repeated genuine 40001 failures');unchangedEmpty();preFix={clientDeadlineMs:450,elapsedMs,engine40001Errors:engineErrors,responseReceived:false,cleanup:'Owned local PostgREST child and its private-cluster backends stopped'};return preFix;
 });
 await stage('reviewed-nonretry-source-contract-installs-locally-only',async()=>{
  const {aiLabB3SourceContractPackage,sourceContractExecutionDerivative}=await import('./lib/ai-lab-b3-source-contract-package.mjs');const contract=aiLabB3SourceContractPackage(process.cwd());local.sql(sourceContractExecutionDerivative(contract.sql));
  assert.equal(local.sql("SELECT encode(sha256(convert_to(prosrc,'UTF8')),'hex') FROM pg_proc WHERE oid='public.busy_connected_builder_source_state_v1(uuid)'::regprocedure"),contract.newFunctionBodySha256);
  local.sql('INSERT INTO auth.users(id) VALUES('+q(F)+');INSERT INTO public.busy_businesses(id,name,created_by) VALUES('+[OTHER,'Other fictional business',F].map(q).join(',')+');');await local.startHttp();return {sqlSha256:contract.sha256,executionSha256:contract.executionDerivativeSha256};
 });
 await stage('empty-source-is-exact-bounded-http200-and-legacy-read-terminates',async()=>{
  const r=await rpc(STATE,{p_business_id:B});faultEvidence.emptySource={status:r.status,elapsedMs:r.elapsedMs,keys:Object.keys(r.json||{}).sort()};assert.equal(r.status,200);assert.deepEqual(r.json,{version:AI_LAB_B3_SOURCE_STATE_VERSION,actorId:O,businessId:B,snapshotExists:false,profileExists:false,empty:true});assert.ok(r.elapsedMs<1500);
  // PostgREST 14.18 maps P0002 to HTTP500. It terminates promptly and is a
  // fatal reader failure; only the separate typed HTTP200 can prove absence.
  const legacy=await rpc('busy_connected_builder_read_v1',{p_business_id:B});faultEvidence.legacyMissing={status:legacy.status,code:/^[A-Z0-9]{5}$/.test(legacy.json?.code)?legacy.json.code:null,elapsedMs:legacy.elapsedMs,keys:Object.keys(legacy.json||{}).sort()};assert.equal(legacy.status,500);assert.equal(legacy.json.code,'P0002');assert.ok(legacy.elapsedMs<1500);unchangedEmpty();return {sourceStateStatus:r.status,sourceStateMs:r.elapsedMs,legacyStatus:legacy.status,legacyMs:legacy.elapsedMs};
 });
 await stage('existing-snapshot-and-profile-only-including-disabled-never-authorise-writes',async()=>{
  for(const kind of ['snapshot','profile','disabled-profile']){
   reset();if(kind==='snapshot')await value('busy_connected_initialize_v1',{p_business_id:B});else{await value('busy_connected_profile_write_v1',{p_business_id:B,p_expected_revision:0,p_expected_profile:null,p_profile:plan.profile,p_owner_approved:true});if(kind==='disabled-profile')local.sql("UPDATE public.busy_public_business_profiles SET status='disabled'");}
   const state=await rpc(STATE,{p_business_id:B});assert.equal(state.status,200);assert.equal(state.json.empty,false);assert.equal(state.json.snapshotExists,kind==='snapshot');assert.equal(state.json.profileExists,kind!=='snapshot');
   const f=fixture(),r=await f.runner.run();assert.equal(r.ok,false);assert.equal(r.writesAttempted,0);assert.equal(f.approvals,0);assert.equal(f.writes.length,0);f.runtime.close();
  }reset();
 });
 await stage('jwt-signature-role-foreign-business-revoked-owner-and-rls-denials',async()=>{
  const token=local.jwt('authenticated',O),bad=token.slice(0,-12)+'AAAAAAAAAAAA';const denied=await local.http('/rpc/'+STATE,{token:bad,body:{p_business_id:B}});assert.equal(denied.status,401);
  for(const [role,actor,business] of [['anon',null,B],['service_role',null,B],['authenticated',F,B],['authenticated',O,OTHER]]){const r=await rpc(STATE,{p_business_id:business},role,actor);assert.ok([401,403].includes(r.status));assert.notEqual(r.json?.empty,true);}
  local.sql('DELETE FROM public.busy_business_memberships WHERE business_id='+q(B));const revoked=await rpc(STATE,{p_business_id:B});assert.equal(revoked.status,403);const f=fixture(),r=await f.runner.run();assert.equal(r.writesAttempted,0);assert.equal(f.approvals,0);f.runtime.close();
  local.sql('INSERT INTO public.busy_business_memberships(business_id,user_id,role) VALUES('+[B,O,'owner'].map(q).join(',')+');');
  for(const role of ['anon','authenticated','service_role']){const rr=await local.http('/busy_business_snapshots?select=*',{token:local.jwt(role,O),method:'GET'});assert.ok([401,403].includes(rr.status));assert.equal(local.sql('SELECT has_table_privilege('+q(role)+',\'public.busy_business_snapshots\',\'INSERT,UPDATE,DELETE\')'),'f');}
  const foreign=fixture({foreignOwner:true});assert.equal((await foreign.runner.run()).writesAttempted,0);assert.equal(foreign.writes.length,0);foreign.runtime.close();unchangedEmpty();
 });
 await stage('probe-membership-lock-timeout-is-terminal-and-never-empty',async()=>{
  const session=local.session('b3_probe_blocker');try{session.write('BEGIN;SELECT 1 FROM public.busy_business_memberships WHERE business_id='+q(B)+' FOR UPDATE');await local.waitSql("SELECT EXISTS(SELECT 1 FROM pg_stat_activity WHERE application_name='b3_probe_blocker' AND state='idle in transaction')");const r=await rpc(STATE,{p_business_id:B});assert.equal(r.json.code,'55P03');assert.equal(r.status,500);assert.ok(r.elapsedMs>=1700&&r.elapsedMs<3500);assert.notEqual(r.json.empty,true);faultEvidence.lockTimeout={status:r.status,code:r.json.code,elapsedMs:r.elapsedMs};}finally{await session.finish();}unchangedEmpty();return faultEvidence.lockTimeout;
 });
 await stage('actual-engine-deadlock-is-caught-as-terminal-http503',async()=>{
  // Fault injection is confined to the explicitly synthetic auth.uid fixture.
  // No SQLSTATE is manufactured: PostgreSQL itself detects a real lock cycle.
  local.sql(`CREATE SCHEMA b3_http_fixture;CREATE TABLE b3_http_fixture.serialization_row(id integer PRIMARY KEY,n integer NOT NULL);INSERT INTO b3_http_fixture.serialization_row VALUES(1,0);
   CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $fixture$
   DECLARE claims jsonb:=nullif(current_setting('request.jwt.claims',true),'')::jsonb;fault text;
   BEGIN
    fault:=claims->>'b3_test_fault';
    IF fault='deadlock' THEN
     PERFORM pg_advisory_xact_lock(73171);PERFORM pg_advisory_xact_lock(73172);
    ELSIF fault='serialization' THEN
     IF current_setting('transaction_isolation')<>'repeatable read' THEN RAISE EXCEPTION 'Local repeatable-read fixture setup required' USING ERRCODE='22023';END IF;
     PERFORM n FROM b3_http_fixture.serialization_row WHERE id=1;
     PERFORM pg_advisory_xact_lock(73173);
     UPDATE b3_http_fixture.serialization_row SET n=n+1 WHERE id=1;
    END IF;
    RETURN coalesce(nullif(current_setting('request.jwt.claim.sub',true),''),claims->>'sub')::uuid;
   EXCEPTION WHEN serialization_failure OR deadlock_detected THEN
    RAISE WARNING 'B3 local fixture observed actual engine SQLSTATE %',SQLSTATE;RAISE;
   END $fixture$;`);
  const before=(local.log().match(/B3 local fixture observed actual engine SQLSTATE 40P01/g)||[]).length,session=local.session('b3_real_deadlock');
  try{
   session.write("BEGIN;SET LOCAL deadlock_timeout='10s';SELECT pg_advisory_xact_lock(73172)");
   await local.waitSql("SELECT EXISTS(SELECT 1 FROM pg_stat_activity WHERE application_name='b3_real_deadlock' AND state='idle in transaction')");
   const pending=rpc(STATE,{p_business_id:B},'authenticated',O,{b3_test_fault:'deadlock'});void pending.catch(()=>{});
   await local.waitSql("SELECT EXISTS(SELECT 1 FROM pg_locks l JOIN pg_stat_activity a USING(pid) WHERE a.usename='b3_authenticator' AND l.locktype='advisory' AND NOT l.granted AND l.objid=73172)");
   session.write('SELECT pg_advisory_xact_lock(73171)');const r=await pending;
   assert.equal(r.status,503);assert.equal(r.json.code,'PT503');assert.notEqual(r.json.empty,true);assert.ok(r.elapsedMs<3000);
   const engineFailures=(local.log().match(/B3 local fixture observed actual engine SQLSTATE 40P01/g)||[]).length-before;assert.equal(engineFailures,1);
   const definition=assertReviewedProbe();faultEvidence.deadlock={actualEngineSqlstate:'40P01',engineFailures,status:r.status,responseCode:r.json.code,elapsedMs:r.elapsedMs,sourceBodySha256:definition.bodySha256,sourceBodyChanged:definition.bodySha256!==sourceContractManifest.newFunctionBodySha256,reviewedDefinitionVerified:true};
  }finally{await session.finish();}unchangedEmpty();return faultEvidence.deadlock;
 });
 await stage('actual-engine-serialization-is-caught-as-terminal-http503',async()=>{
  // PostgREST honours function default_transaction_isolation when opening the
  // HTTP transaction. This local-only setting creates a deterministic engine
  // collision; the reviewed source body and ACL remain byte-identical.
  local.sql("ALTER FUNCTION public.busy_connected_builder_source_state_v1(uuid) SET default_transaction_isolation='repeatable read'");await local.stopHttp();await local.startHttp();
  const before=(local.log().match(/B3 local fixture observed actual engine SQLSTATE 40001/g)||[]).length,session=local.session('b3_real_serialization');
  try{
   session.write('BEGIN;SELECT pg_advisory_xact_lock(73173)');await local.waitSql("SELECT EXISTS(SELECT 1 FROM pg_stat_activity WHERE application_name='b3_real_serialization' AND state='idle in transaction')");
   const pending=rpc(STATE,{p_business_id:B},'authenticated',O,{b3_test_fault:'serialization'});void pending.catch(()=>{});
   await local.waitSql("SELECT EXISTS(SELECT 1 FROM pg_locks l JOIN pg_stat_activity a USING(pid) WHERE a.usename='b3_authenticator' AND l.locktype='advisory' AND NOT l.granted AND l.objid=73173)");
   session.write('UPDATE b3_http_fixture.serialization_row SET n=n+1 WHERE id=1;COMMIT');const r=await pending;
   assert.equal(r.status,503);assert.equal(r.json.code,'PT503');assert.notEqual(r.json.empty,true);assert.ok(r.elapsedMs<3000);
   const engineFailures=(local.log().match(/B3 local fixture observed actual engine SQLSTATE 40001/g)||[]).length-before;assert.equal(engineFailures,1);
   faultEvidence.serialization={actualEngineSqlstate:'40001',engineFailures,status:r.status,responseCode:r.json.code,elapsedMs:r.elapsedMs};
  }finally{
   await session.finish();local.sql('ALTER FUNCTION public.busy_connected_builder_source_state_v1(uuid) RESET default_transaction_isolation');
   local.sql(`CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$SELECT coalesce(nullif(current_setting('request.jwt.claim.sub',true),''),nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'sub')::uuid$$;DROP SCHEMA b3_http_fixture CASCADE;`);
   await local.stopHttp();await local.startHttp();
  }
  const definition=assertReviewedProbe();Object.assign(faultEvidence.serialization,{sourceBodySha256:definition.bodySha256,sourceBodyChanged:definition.bodySha256!==sourceContractManifest.newFunctionBodySha256,reviewedDefinitionVerified:true,isolationConfigRestored:!definition.config.some(v=>v.startsWith('default_transaction_isolation='))});
  unchangedEmpty();return faultEvidence.serialization;
 });
 await stage('six-real-http-writes-use-original-handler-session-and-full-readback',async()=>{
  const f=fixture(),r=await f.runner.run();assert.equal(r.ok,true);assert.equal(r.writesAttempted,6);assert.equal(f.writes.length,6);assert.equal(f.approvals,1);assert.deepEqual(r.completedSteps,plan.operations.map(v=>v.id));assert.equal(r.receipts.length,5);
  const basis=await read();assert.deepEqual(basis,r.observed);assert.deepEqual(basis.profile,plan.profile);assert.deepEqual(basis.websiteDraft.pages.map(v=>v.id),plan.pageIds);assert.equal(basis.websiteDraft.sections.find(v=>v.id===r.source.storySectionId).body,plan.story.body);assert.equal(basis.websiteDraft.sections.find(v=>v.id==='hero').cta,plan.action.wording);assert.equal(basis.websiteDraft.sections.find(v=>v.id==='hero').ctaHref,plan.action.destination);assert.equal(basis.websiteUndoCount,3);assert.equal(basis.websiteRedoCount,0);
  const context=await value('busy_ai_context_v1',{p_actor:O,p_business:B,p_binding:r.binding},'service_role');assert.deepEqual(context.project,basis.websiteDraft);assert.deepEqual(context.profile,basis.profile);
  for(const page of basis.websiteDraft.pages){const html=renderWebsiteHtml(basis.websiteDraft,page.id,{standalone:true});assert.ok(html.startsWith('<!doctype html>'));assert.equal((html.match(/<h1\b/g)||[]).length,1);assert.ok(!/<img\b|<script\b|<iframe\b/i.test(html));}
  const count=f.trace.length;assert.equal((await f.runner.run()).status,'already-used');assert.equal(f.trace.length,count);lastHappy={writes:6,originalWriteNames:f.writes,runtimeCounters:f.runtime.inspect().counts,runtimeWriteCounts:f.runtime.inspect().writes,snapshotRevision:basis.revision,profileRevision:basis.profileRevision,websiteGeneration:basis.websiteDraft.generation,undoCount:basis.websiteUndoCount,realHttp:true};f.runtime.close();noSpending();return lastHappy;
 });
 await stage('original-studio-undo-and-redo-persist-through-real-http',async()=>{
  const session=createConnectedBuilderSession({request:async(action,body)=>action==='builder_read'?read():privateWebsiteDraftAction({action,body,userId:O,read,commit:args=>value('busy_connected_website_commit_v1',args,'service_role'),history:(business,revision,digest,direction)=>value('busy_connected_website_history_v1',{p_business_id:business,p_expected_revision:revision,p_expected_hash:digest,p_direction:direction}),transition:args=>value('busy_connected_website_transition_v1',args,'service_role')})});
  const before=await session.open(B),undo=await session.website({basis:before,action:'undo',ownerApproved:true});assert.equal(undo.ok,true);assert.equal(undo.observed.websiteUndoCount,2);assert.equal(undo.observed.websiteRedoCount,1);assert.notEqual(undo.observed.websiteDraft.sections.find(v=>v.id==='hero').cta,plan.action.wording);
  const redo=await session.website({basis:undo.observed,action:'redo',ownerApproved:true});assert.equal(redo.ok,true);assert.equal(redo.observed.websiteUndoCount,3);assert.equal(redo.observed.websiteRedoCount,0);assert.equal(redo.observed.websiteDraft.sections.find(v=>v.id==='hero').cta,plan.action.wording);assert.deepEqual(redo.observed.profile,plan.profile);
 });
 await stage('stale-cas-and-history-conflicts-return-bounded-http409',async()=>{
  const basis=await read();const calls=[['busy_connected_profile_write_v1',{p_business_id:B,p_expected_revision:0,p_expected_profile:null,p_profile:plan.profile,p_owner_approved:true},'authenticated'],['busy_connected_website_commit_v1',{p_business_id:B,p_actor_id:O,p_expected_revision:basis.revision+1,p_expected_draft:basis.websiteDraft,p_candidate:{...basis.websiteDraft,generation:basis.websiteDraft.generation+1},p_profile_revision:basis.profileRevision},'service_role'],['busy_connected_website_history_v1',{p_business_id:B,p_expected_revision:basis.revision+1,p_expected_hash:basis.websiteDraftHash,p_direction:'undo'},'authenticated']];
  const evidence=[];for(const [name,args,role]of calls){const r=await rpc(name,args,role);assert.equal(r.status,409);assert.equal(r.json.code,'PT409');assert.ok(r.elapsedMs<1500);evidence.push({name,status:r.status,elapsedMs:r.elapsedMs});}assert.deepEqual(await read(),basis);return evidence;
 });
 for(const option of ['staleProfile','staleCommit','withdraw'])await stage(option+'-stops-original-runtime-without-replay',async()=>{
  reset();const f=fixture({[option]:true}),r=await f.runner.run();assert.equal(r.ok,false);assert.equal(r.mayReplay,false);assert.ok(r.writesAttempted<=3);const trace=f.trace.length;assert.equal((await f.runner.run()).status,'already-used');assert.equal(f.trace.length,trace);assert.equal(f.runtime.inspect().state,'stopped');
  if(option==='withdraw')local.sql('INSERT INTO public.busy_business_memberships(business_id,user_id,role) VALUES('+[B,O,'owner'].map(q).join(',')+');');const observed=await read();assert.equal(observed.websiteDraft,null);if(option==='staleProfile')assert.equal(observed.profile.description,'Concurrent fictional owner wording');f.runtime.close();noSpending();
 });
 for(const [name,phase,writes] of [['busy_connected_initialize_v1','initialize',1],['busy_connected_profile_write_v1','profile',2],['busy_connected_website_commit_v1','create',3]])await stage('lost-'+phase+'-http-acknowledgement-never-replays-actual-committed-write',async()=>{
  reset();const f=fixture({lose:name}),r=await f.runner.run();assert.equal(r.ok,false);assert.equal(r.phase,phase);assert.equal(r.status,'unknown-outcome');assert.equal(r.mayReplay,false);assert.equal(r.requiresIndependentInspection,true);assert.equal(r.writesAttempted,writes);assert.equal(f.writes.length,writes);const observed=await read();assert.equal(observed.businessId,B);assert.equal(local.sql('SELECT count(*) FROM public.busy_business_snapshots'),'1');if(phase==='create')assert.ok(observed.websiteDraft);if(phase!=='initialize')assert.deepEqual(observed.profile,plan.profile);const trace=f.trace.length;assert.equal((await f.runner.run()).status,'already-used');assert.equal(f.trace.length,trace);assert.equal(f.writes.length,writes);f.runtime.close();noSpending();
 });
 await stage('original-table-counts-private-defaults-and-zero-spending-remain',()=>{noSpending();assert.equal(local.sql("SELECT count(*) FROM pg_tables WHERE schemaname='public'"),'28');assert.equal(local.sql("SELECT count(*) FROM pg_tables WHERE schemaname='busy_ai_private'"),'6');for(const role of ['anon','authenticated','service_role'])assert.equal(local.sql('SELECT has_schema_privilege('+q(role)+',\'busy_ai_private\',\'USAGE,CREATE\')'),'f');return {reviewedProbeDefinition:assertReviewedProbe()};});
}catch(error){fatal=error;}
finally{
 if(local){try{await local.cleanup();}catch{results.push({id:'owned-local-process-and-cluster-cleanup',passed:false,error:'local_cleanup_failed'});fatal||=Error('local_cleanup_failed');}}
 const receipt={version:1,transport:'Actual PostgREST HTTP',postgrest:local?.binary||null,hosted:false,hostedMutations:0,nativeAuthAcceptance:false,syntheticDataOnly:true,authFixture:'Synthetic native Auth facade and auth.uid compatibility fixture; real locally signed HS256 JWT verification, roles, original SQL/RLS/CAS and HTTP.',providerCalls:0,spendingGBP:0,sourcePlanDigest:AI_LAB_B3_SOURCE_PLAN_DIGEST,sourcePlanWrites:6,preFix,faultEvidence,lastHappy,cleanupCompleted:!results.some(v=>v.id==='owned-local-process-and-cluster-cleanup'&&!v.passed),results,summary:{passed:results.filter(v=>v.passed).length,failed:results.filter(v=>!v.passed).length}};
 const serialized=JSON.stringify(receipt,null,2)+'\n';assert.ok(!/sb_publishable_|sb_secret_|Bearer |SYNTHETIC_LOCAL_ONLY_PASSWORD|eyJ[A-Za-z0-9_-]+\./.test(serialized),'Receipt must contain no credentials');mkdirSync('.test-artifacts/ai-lab-b3',{recursive:true});writeFileSync('.test-artifacts/ai-lab-b3/postgrest.json',serialized);console.log(JSON.stringify({receipt:'.test-artifacts/ai-lab-b3/postgrest.json',summary:receipt.summary,cleanupCompleted:receipt.cleanupCompleted}));
}
if(fatal){console.error('Local PostgREST regression failed; sanitized stage evidence is in .test-artifacts/ai-lab-b3/postgrest.json');process.exitCode=1;}
