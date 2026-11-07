import assert from 'node:assert/strict';
import {execFileSync,spawn} from 'node:child_process';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {randomUUID} from 'node:crypto';
import {aiLabRunnerFoundationPackage,runnerExecutionDerivative} from './lib/ai-lab-runner-foundation-package.mjs';
import {aiLabB3SourceContractPackage,sourceContractExecutionDerivative} from './lib/ai-lab-b3-source-contract-package.mjs';

// Only an owner-authorised disposable local database. No hosted connection,
// genuine Auth, credential reads, model activity or automatic B3 execution.
const bin=process.env.BUSY_LOCAL_PG_BIN||'/workspace/pg17-disposable/root/usr/lib/postgresql/17/bin/psql';
const socket=process.env.BUSY_LOCAL_PG_SOCKET||'/workspace/pg17-disposable/socket';
const data=process.env.BUSY_LOCAL_PG_DATA||'/workspace/pg17-disposable/data';
const port=process.env.BUSY_LOCAL_PG_PORT||'5432';
const db='busy_b3_source_contract_disposable',O=randomUUID(),B=randomUUID(),F=randomUUID(),FB=randomUUID(),results=[];
const pkg=aiLabB3SourceContractPackage(process.cwd());
const q=v=>v==null?'NULL':"'"+(typeof v==='object'?JSON.stringify(v):String(v)).replaceAll("'","''")+"'";
const args=(d=db)=>['-X','-h',socket,'-p',port,'-U','postgres','-v','ON_ERROR_STOP=1','-v','VERBOSITY=verbose','-qAt','-d',d];
const sql=(s,d=db,atomic=true)=>execFileSync(bin,args(d),{input:atomic?'BEGIN;\n'+s+';\nCOMMIT;\n':s,encoding:'utf8',stdio:['pipe','pipe','pipe'],maxBuffer:32*1024*1024}).trim();
const json=s=>JSON.parse(sql(s));
const stage=async(id,fn)=>{try{await fn();results.push({id,passed:true});}catch(e){results.push({id,passed:false,error:String(e.stderr||e.stack).slice(-4500)});throw e;}};
const invoke=(signature,params=[],role='authenticated',actor=O)=>json('SET LOCAL ROLE '+role+';SET LOCAL request.jwt.claim.sub='+q(actor??'')+';SELECT '+signature+'('+params.map(q).join(',')+');');
const probe=(business=B,role='authenticated',actor=O)=>invoke('public.busy_connected_builder_source_state_v1',[business],role,actor);
const read=(business=B)=>invoke('public.busy_connected_builder_read_v1',[business]);
const sourceCounts=()=>json("SELECT jsonb_build_object('snapshots',(SELECT count(*) FROM public.busy_business_snapshots),'profiles',(SELECT count(*) FROM public.busy_public_business_profiles))");
const expectError=(fn,code)=>assert.throws(fn,e=>new RegExp('\\b'+code+':').test(String(e.stderr||e)));
const reset=()=>sql('DELETE FROM public.busy_public_business_profiles;DELETE FROM public.busy_business_snapshots;');
const noSpending=()=>{assert.equal(sql('SELECT enabled FROM busy_ai_private.policy'),'f');assert.equal(sql('SELECT monthly_hard_limit FROM busy_ai_private.policy'),'0');for(const t of ['accounts','periods','tariffs','operations','events'])assert.equal(sql('SELECT count(*) FROM busy_ai_private.'+t),'0');};
const tableDataFingerprints=()=>{
 const tables=json("SELECT jsonb_agg(quote_ident(n.nspname)||'.'||quote_ident(c.relname) ORDER BY n.nspname,c.relname) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relkind IN ('r','p') AND (n.nspname='public' OR n.nspname LIKE 'busy_%')");
 return json('SELECT jsonb_object_agg(table_name,row_hash) FROM ('+tables.map(name=>"SELECT "+q(name)+" AS table_name,encode(sha256(convert_to(coalesce(jsonb_agg(to_jsonb(t) ORDER BY to_jsonb(t)::text)::text,'[]'),'UTF8')),'hex') AS row_hash FROM "+name+' t').join(' UNION ALL ')+') fingerprint');
};
const catalog=()=>json(`SELECT jsonb_build_object(
 'relations',(SELECT jsonb_agg(jsonb_build_object('schema',n.nspname,'name',c.relname,'kind',c.relkind,'owner',c.relowner,'acl',c.relacl::text,'rls',c.relrowsecurity,'force',c.relforcerowsecurity) ORDER BY n.nspname,c.relname) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' OR n.nspname LIKE 'busy_%'),
 'functions',(SELECT jsonb_agg(jsonb_build_object('identity',n.nspname||'.'||p.proname||'('||oidvectortypes(p.proargtypes)||')','owner',p.proowner,'acl',p.proacl::text,'config',p.proconfig,'definer',p.prosecdef,'volatility',p.provolatile,'lang',p.prolang,'returns',p.prorettype,'bodyHash',encode(sha256(convert_to(p.prosrc,'UTF8')),'hex')) ORDER BY n.nspname,p.proname,p.proargtypes::text) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' OR n.nspname LIKE 'busy_%'),
 'defaults',(SELECT jsonb_agg(jsonb_build_object('role',defaclrole,'namespace',defaclnamespace,'type',defaclobjtype,'acl',defaclacl::text) ORDER BY oid) FROM pg_default_acl),
 'events',(SELECT jsonb_agg(jsonb_build_object('name',evtname,'event',evtevent,'enabled',evtenabled,'function',evtfoid,'owner',evtowner,'tags',evttags) ORDER BY evtname) FROM pg_event_trigger),
 'policies',(SELECT jsonb_agg(jsonb_build_object('schema',schemaname,'table',tablename,'name',policyname,'roles',roles,'command',cmd,'qual',qual,'check',with_check) ORDER BY schemaname,tablename,policyname) FROM pg_policies WHERE schemaname='public' OR schemaname LIKE 'busy_%'))`);
let before,sourceBefore,dataBefore,uidDdl;
const revisedFingerprint=original=>{
 const c=structuredClone(original);
 for(const f of c.functions){const change=pkg.originalFunctionChanges.find(e=>e.signature.replaceAll(' ','')===f.identity.replaceAll(' ',''));if(change)f.bodyHash=change.revisedBodySha256;}
 return c;
};
const withoutProbe=c=>({...c,functions:c.functions.filter(f=>!f.identity.startsWith('public.busy_connected_builder_source_state_v1('))});
try{
 await stage('dedicated-pg17-original-foundation-and-fictional-source-only',()=>{
  assert.ok(socket.startsWith('/')&&data.startsWith('/')&&/^\d+$/.test(port));
  assert.ok(['','127.0.0.1','localhost'].includes(sql('SHOW listen_addresses','postgres')));
  assert.equal(sql('SHOW data_directory','postgres'),data);
  assert.ok(Number(sql('SHOW server_version_num','postgres'))>=170000&&Number(sql('SHOW server_version_num','postgres'))<180000);
  assert.equal(sql("SELECT count(*) FROM pg_roles WHERE rolname IN ('anon','authenticated','service_role')",'postgres'),'3');
  sql('DROP DATABASE IF EXISTS '+db,'postgres',false);sql('CREATE DATABASE '+db,'postgres',false);
  sql(readFileSync('scripts/fixtures/ai-lab/empty-native.sql','utf8'));
  const f=aiLabRunnerFoundationPackage(process.cwd());assert.equal(f.sha256,'b825989b37e2fef0f874ccdb03405a6650f8dc6ddfe27f94086952cc1cec225d');sql(runnerExecutionDerivative(f.sql));
  sql('INSERT INTO auth.users(id) VALUES('+q(O)+');INSERT INTO public.busy_businesses(id,name,created_by) VALUES('+[B,'Quiet Light Studio',O].map(q).join(',')+');INSERT INTO public.busy_business_memberships(business_id,user_id,role) VALUES('+[B,O,'owner'].map(q).join(',')+');CREATE SCHEMA supabase_migrations;CREATE TABLE supabase_migrations.schema_migrations(version text PRIMARY KEY,statements text[] DEFAULT ARRAY[]::text[],name text NOT NULL);INSERT INTO supabase_migrations.schema_migrations(version,name) VALUES(\'20261106221950\',\'mission18_ai_lab_foundation\'),(\'20261107000304\',\'ai_lab_quiet_light_owner_setup_v1\');');
  // These native history labels are synthetic fixtures, not hosted installation receipts.
  before=catalog();sourceBefore=sourceCounts();dataBefore=tableDataFingerprints();uidDdl=sql("SELECT pg_get_functiondef('auth.uid()'::regprocedure)");noSpending();
  const pre=JSON.parse(sql(pkg.preflight,db,false));assert.equal(pre.transactionReadOnly,'on');assert.equal(pre.publicTableCount,28);assert.equal(pre.privateAiTableCount,6);assert.equal(pre.authUserCount,1);assert.equal(pre.businessCount,1);assert.equal(pre.ownerMembershipCount,1);assert.equal(pre.otherMembershipCount,0);assert.equal(pre.snapshotCount,0);assert.equal(pre.profileCount,0);assert.equal(pre.sourceProjection,null);assert.equal(pre.originalFunctions.length,5);assert.ok(pre.originalFunctions.every(x=>x.exists&&x.bodyMatches&&x.owner==='postgres'&&x.securityDefiner));assert.equal(pre.nativeReceipts.length,2);
 });
 await stage('outer-review-fuse-denies-without-partial-definition-changes',()=>{
  expectError(()=>sql(pkg.sql),'P0001');assert.deepEqual(catalog(),before);assert.deepEqual(sourceCounts(),sourceBefore);assert.deepEqual(tableDataFingerprints(),dataBefore);
 });
 await stage('migration-and-native-history-failure-roll-back-together',()=>{
  expectError(()=>sql(sourceContractExecutionDerivative(pkg.sql)+"\nINSERT INTO supabase_migrations.schema_migrations(version,name) VALUES('20261106221950','forced-history-conflict');"),'23505');
  assert.deepEqual(catalog(),before);assert.deepEqual(sourceCounts(),sourceBefore);assert.deepEqual(tableDataFingerprints(),dataBefore);assert.equal(sql("SELECT count(*) FROM supabase_migrations.schema_migrations"),'2');
 });
 await stage('wrong-current-owner-state-denies-install-before-ddl',()=>{
  sql('INSERT INTO auth.users(id) VALUES('+q(F)+');');expectError(()=>sql(sourceContractExecutionDerivative(pkg.sql)),'P0001');sql('DELETE FROM auth.users WHERE id='+q(F));assert.deepEqual(catalog(),before);
 });
 await stage('exact-old-body-drift-denies-install-without-partial-change',()=>{
  const signature=pkg.originalFunctionChanges[0].signature,ddl=sql('SELECT pg_get_functiondef('+q(signature)+'::regprocedure)');
  const source=sql('SELECT prosrc FROM pg_proc WHERE oid='+q(signature)+'::regprocedure');sql(ddl.replace(source,source+'\n-- SYNTHETIC LOCAL DEFINITION DRIFT\n'));
  expectError(()=>sql(sourceContractExecutionDerivative(pkg.sql)),'P0001');sql(ddl);assert.deepEqual(catalog(),before);
 });
 await stage('exact-successful-migration-preserves-all-catalog-and-data-except-reviewed-functions',()=>{
  sql(sourceContractExecutionDerivative(pkg.sql)+"\nINSERT INTO supabase_migrations.schema_migrations(version,name,statements) VALUES('20261107120000','"+pkg.migrationName+"',ARRAY["+q(sourceContractExecutionDerivative(pkg.sql))+"]);" );
  const actual=catalog();assert.deepEqual(withoutProbe(actual),revisedFingerprint(before));assert.equal(actual.functions.length,before.functions.length+1);
  assert.deepEqual(sourceCounts(),sourceBefore);assert.deepEqual(tableDataFingerprints(),dataBefore);assert.equal(sql("SELECT count(*) FROM pg_tables WHERE schemaname='public'"),'28');assert.equal(sql("SELECT count(*) FROM pg_tables WHERE schemaname='busy_ai_private'"),'6');noSpending();
  const post=JSON.parse(sql(pkg.verification,db,false));assert.equal(post.transactionReadOnly,'on');assert.equal(post.publicTableCount,28);assert.equal(post.privateAiTableCount,6);assert.ok(post.originalFunctions.every(x=>x.bodyMatches));assert.equal(post.sourceProjection.bodyMatches,true);assert.equal(post.sourceProjection.owner,'postgres');assert.equal(post.sourceProjection.authenticatedExec,true);assert.equal(post.sourceProjection.anonExec,false);assert.equal(post.sourceProjection.serviceExec,false);assert.deepEqual(post.sourceProjection.config,['search_path=pg_catalog, pg_temp','lock_timeout=2s']);const receipt=post.nativeReceipts.find(x=>x.name===pkg.migrationName);assert.equal(receipt.statementCount,1);assert.equal(receipt.executionSha256,pkg.executionDerivativeSha256);
 });
 await stage('typed-empty-read-is-source-bound-and-does-not-create-any-record',()=>{
  assert.deepEqual(probe(),{version:'busy.connected-builder-source-state.v1',actorId:O,businessId:B,snapshotExists:false,profileExists:false,empty:true});assert.deepEqual(sourceCounts(),{snapshots:0,profiles:0});
 });
 await stage('existing-workspace-is-existing-and-original-readback-shape-survives',()=>{
  invoke('public.busy_connected_initialize_v1',[B]);assert.deepEqual(probe(),{version:'busy.connected-builder-source-state.v1',actorId:O,businessId:B,snapshotExists:true,profileExists:false,empty:false});const b=read();assert.equal(b.revision,1);assert.equal(b.businessId,B);assert.equal(b.actorId,O);assert.equal(b.profile,null);assert.equal(b.websiteDraft,null);reset();
 });
 await stage('profile-without-workspace-and-disabled-profile-are-never-empty',()=>{
  invoke('public.busy_connected_profile_write_v1',[B,0,null,{businessName:'Quiet Light Studio'},true]);assert.equal(probe().empty,false);assert.equal(probe().profileExists,true);assert.equal(probe().snapshotExists,false);
  sql('UPDATE public.busy_public_business_profiles SET status=\'disabled\' WHERE business_id='+q(B));assert.equal(probe().empty,false);assert.equal(probe().profileExists,true);assert.deepEqual(sourceCounts(),{snapshots:0,profiles:1});reset();
 });
 await stage('revoked-admin-foreign-business-foreign-owner-anonymous-and-api-role-denials',()=>{
  sql('DELETE FROM public.busy_business_memberships WHERE business_id='+q(B));expectError(()=>probe(),'42501');sql('INSERT INTO public.busy_business_memberships(business_id,user_id,role) VALUES('+[B,O,'admin'].map(q).join(',')+');');expectError(()=>probe(),'42501');sql('UPDATE public.busy_business_memberships SET role=\'owner\' WHERE business_id='+q(B));
  sql('INSERT INTO auth.users(id) VALUES('+q(F)+');INSERT INTO public.busy_businesses(id,name,created_by) VALUES('+[FB,'Fictional foreign business',F].map(q).join(',')+');INSERT INTO public.busy_business_memberships(business_id,user_id,role) VALUES('+[FB,F,'owner'].map(q).join(',')+');');
  expectError(()=>probe(FB),'42501');expectError(()=>probe(B,'authenticated',F),'42501');expectError(()=>probe(B,'authenticated',null),'42501');expectError(()=>probe(B,'anon'),'42501');expectError(()=>probe(B,'service_role'),'42501');
  sql('DELETE FROM public.busy_businesses WHERE id='+q(FB)+';DELETE FROM auth.users WHERE id='+q(F));assert.deepEqual(sourceCounts(),{snapshots:0,profiles:0});
 });
 await stage('controlled-postgresql-sqlstate-injections-in-owner-helper-become-fatal-not-empty',()=>{
  for(const code of ['40001','40P01']){
   sql("CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid LANGUAGE plpgsql STABLE AS $$BEGIN RAISE EXCEPTION 'SYNTHETIC LOCAL ENGINE FAULT' USING ERRCODE='"+code+"';END $$");
   expectError(()=>probe(),'PT503');assert.deepEqual(sourceCounts(),{snapshots:0,profiles:0});
  }
  sql(uidDdl);
 });
 await stage('unrelated-genuine-database-errors-propagate-and-never-mean-empty',()=>{
  sql("CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid LANGUAGE plpgsql STABLE AS $$BEGIN PERFORM 1/0; RETURN NULL; END $$");expectError(()=>probe(),'22012');sql(uidDdl);assert.equal(probe().empty,true);
 });
 await stage('genuine-concurrent-membership-lock-is-bounded-and-fatal',async()=>{
  const holder=spawn(bin,args(),{stdio:['pipe','pipe','pipe']});let text='',err='';holder.stderr.on('data',x=>{err+=x;});
  const done=new Promise(resolve=>holder.once('exit',code=>resolve(code)));
  const ready=new Promise((resolve,reject)=>{const t=setTimeout(()=>reject(Error('Local holder readiness timeout')),5000);holder.stdout.on('data',chunk=>{text+=chunk;if(text.includes('B3_HOLDER_READY')){clearTimeout(t);resolve();}});holder.once('error',reject);});
  holder.stdin.end('BEGIN;SELECT role FROM public.busy_business_memberships WHERE business_id='+q(B)+' FOR UPDATE;\n\\echo B3_HOLDER_READY\nSELECT pg_sleep(4);ROLLBACK;\n');
  try{await ready;const start=Date.now();expectError(()=>probe(),'55P03');const elapsed=Date.now()-start;assert.ok(elapsed>=1500&&elapsed<4500,'Unexpected bounded lock duration: '+elapsed);assert.equal(await done,0,err);}finally{if(holder.exitCode===null)holder.kill('SIGTERM');}
 });
 await stage('legacy-missing-workspace-is-nonretry-and-original-invalid-state-constraints-remain',()=>{
  reset();expectError(()=>read(),'P0002');invoke('public.busy_connected_initialize_v1',[B]);expectError(()=>sql('UPDATE public.busy_business_snapshots SET schema_version=2 WHERE business_id='+q(B)),'23514');expectError(()=>sql('UPDATE public.busy_business_snapshots SET revision=0 WHERE business_id='+q(B)),'23514');assert.equal(read().revision,1);reset();
 });
 await stage('all-eight-original-deterministic-cas-history-guards-remain-PT409-errors',()=>{
  // First-profile stale CAS, then existing-profile stale CAS.
  expectError(()=>invoke('public.busy_connected_profile_write_v1',[B,1,null,{businessName:'Quiet Light Studio'},true]),'PT409');
  invoke('public.busy_connected_profile_write_v1',[B,0,null,{businessName:'Quiet Light Studio'},true]);expectError(()=>invoke('public.busy_connected_profile_write_v1',[B,0,null,{businessName:'Changed'},true]),'PT409');
  // The original private writer remains service-inaccessible; trusted local fixture tests its two guards.
  expectError(()=>json('SELECT busy_snapshot_private.website_commit_original('+[B,O,1,null,{},999].map(q).join(',')+')'),'PT409');
  expectError(()=>json('SELECT busy_snapshot_private.website_commit_original('+[B,O,1,null,{},1].map(q).join(',')+')'),'PT409');
  // Public finite transition: stale snapshot, missing current website, changed history target.
  expectError(()=>invoke('public.busy_connected_website_transition_v1',[B,O,1,null,{},1,'edit'],'service_role'),'PT409');
  invoke('public.busy_connected_initialize_v1',[B]);expectError(()=>invoke('public.busy_connected_website_transition_v1',[B,O,1,null,{},1,'undo'],'service_role'),'PT409');
  const draft={id:'synthetic-existing',businessId:B,generation:1};sql('UPDATE public.busy_business_snapshots SET payload=jsonb_set(payload,\'{websiteDraft}\','+q(draft)+'::jsonb) WHERE business_id='+q(B));
  expectError(()=>invoke('public.busy_connected_website_transition_v1',[B,O,1,draft,draft,1,'undo'],'service_role'),'PT409');expectError(()=>invoke('public.busy_connected_website_history_v1',[B,99,'0'.repeat(64),'undo']),'PT409');reset();
 });
 await stage('duplicate-or-partial-installation-is-denied-without-changing-existing-data',()=>{const c=catalog();expectError(()=>sql(sourceContractExecutionDerivative(pkg.sql)),'P0001');assert.deepEqual(catalog(),c);assert.deepEqual(sourceCounts(),{snapshots:0,profiles:0});noSpending();});
 await stage('retaining-rollback-fuse-and-rollback-preserve-corrected-original-authorities',()=>{
  const c=catalog();expectError(()=>sql(pkg.rollback),'P0001');assert.deepEqual(catalog(),c);
  const data=tableDataFingerprints();sql(sourceContractExecutionDerivative(pkg.rollback,'ROLLBACK'));expectError(()=>probe(),'42501');expectError(()=>read(),'P0002');assert.deepEqual(withoutProbe(catalog()),revisedFingerprint(before));assert.deepEqual(sourceCounts(),{snapshots:0,profiles:0});assert.deepEqual(tableDataFingerprints(),data);noSpending();const retired=JSON.parse(sql(pkg.verification,db,false));assert.ok(retired.originalFunctions.every(x=>x.bodyMatches));assert.equal(retired.sourceProjection.bodyMatches,true);assert.equal(retired.sourceProjection.authenticatedExec,false);assert.equal(retired.sourceProjection.anonExec,false);assert.equal(retired.sourceProjection.serviceExec,false);
 });
}finally{
 const receipt={version:1,database:db,hosted:false,postgresMajor:17,auth:'Synthetic auth.uid/identities; actual original PostgreSQL role, membership, RLS and persistence authorities.',nativeHistory:'Synthetic local fixture labels; no claim of hosted receipt installation.',retryableFaults:'Controlled SQLSTATE40001/40P01 injections; actual division-by-zero and concurrent membership-lock failures are separate stages. Genuine concurrent serialization/deadlock HTTP evidence belongs to the PostgREST harness.',providerCalls:0,spendingGbp:0,hostedMutations:0,installSha256:pkg.sha256,executionSha256:pkg.executionDerivativeSha256,rollbackSha256:pkg.rollbackSha256,results,summary:{passed:results.filter(x=>x.passed).length,failed:results.filter(x=>!x.passed).length}};
 mkdirSync('.test-artifacts/ai-lab-b3-source-contract',{recursive:true});writeFileSync('.test-artifacts/ai-lab-b3-source-contract/postgres.json',JSON.stringify(receipt,null,2)+'\n');console.log(JSON.stringify(receipt));
}
