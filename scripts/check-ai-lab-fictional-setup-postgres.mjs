import assert from 'node:assert/strict';
import {execFileSync,execFile} from 'node:child_process';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createHash,randomUUID} from 'node:crypto';
import {aiLabRunnerFoundationPackage,runnerExecutionDerivative} from './lib/ai-lab-runner-foundation-package.mjs';
import {aiLabFictionalSetupTemplate,bindAiLabFictionalSetup,fictionalSetupExecutionDerivative,readOnlyFictionalSetupVerification,AI_LAB_SETUP_EMAIL,AI_LAB_SETUP_MIGRATION} from './lib/ai-lab-fictional-setup-package.mjs';

// Disposable PostgreSQL only: this approximates native Auth metadata. It neither
// creates a real Auth user nor proves native authentication or hosted readiness.
const bin=process.env.BUSY_LOCAL_PG_BIN||'/workspace/pg17-disposable/root/usr/lib/postgresql/17/bin/psql';
const socket=process.env.BUSY_LOCAL_PG_SOCKET||'/workspace/pg17-disposable/socket';
const data=process.env.BUSY_LOCAL_PG_DATA||'/workspace/pg17-disposable/data';
const db='busy_ai_lab_fictional_setup_disposable',root=process.cwd();
const foundation=aiLabRunnerFoundationPackage(root),foundationBody=runnerExecutionDerivative(foundation.sql);
const template=aiLabFictionalSetupTemplate(root),owner=randomUUID(),results=[];
const q=v=>"'"+String(v).replaceAll("'","''")+"'";
const sql=(s,d=db,atomic=true)=>execFileSync(bin,['-X','-h',socket,'-U','postgres','-v','ON_ERROR_STOP=1','-qAt','-d',d],{input:atomic?'BEGIN;\n'+s+';\nCOMMIT;\n':s,encoding:'utf8',stdio:['pipe','pipe','pipe'],maxBuffer:32*1024*1024}).trim();
const json=s=>JSON.parse(sql(s));
const denied=(s,re)=>assert.throws(()=>sql(s),e=>re.test(String(e.stderr||e)));
const stage=async(id,fn)=>{try{await fn();results.push({id,passed:true});}catch(e){results.push({id,passed:false,error:String(e.stderr||e.stack).slice(-3000)});throw e;}};
const observation=id=>({projectRef:template.targetProject,organizationId:template.targetOrganization,region:'eu-west-1',plan:'free',foundation:{version:'20261106221950',name:'mission18_ai_lab_foundation',statementCount:1,executionSha256:foundation.executionDerivativeSha256},user:{id,email:AI_LAB_SETUP_EMAIL,emailConfirmedAt:'2026-11-06T22:00:00.000Z',isAnonymous:false,role:'authenticated',aud:'authenticated',deletedAt:null,bannedUntil:null,identityProvider:'email'},authUserCount:1,identityCount:1,observedAt:'2026-11-06T22:00:01.000Z'});
const bound=bindAiLabFictionalSetup(root,observation(owner)),body=fictionalSetupExecutionDerivative(bound.sql,root);
const history=(name=AI_LAB_SETUP_MIGRATION,version='20261106009901',statement=body)=>'INSERT INTO supabase_migrations.schema_migrations(version,name,statements) VALUES('+[version,name].map(q).join(',')+',ARRAY['+q(statement)+']);';
const batch=()=>body+'\n'+history();
const securityQuery=`SELECT jsonb_build_object(
 'tables',(SELECT jsonb_agg(jsonb_build_object('schema',n.nspname,'name',c.relname,'owner',c.relowner,'rls',c.relrowsecurity,'force',c.relforcerowsecurity,'acl',c.relacl) ORDER BY n.nspname,c.relname) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE(n.nspname='public' OR left(n.nspname,5)='busy_') AND c.relkind IN('r','S')),
 'functions',(SELECT jsonb_agg(jsonb_build_object('signature',p.oid::regprocedure::text,'owner',p.proowner,'acl',p.proacl,'definition',pg_get_functiondef(p.oid)) ORDER BY n.nspname,p.oid::regprocedure::text) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' OR left(n.nspname,5)='busy_'),
 'defaults',(SELECT coalesce(jsonb_agg(to_jsonb(d) ORDER BY d.oid),'[]') FROM pg_default_acl d),
 'events',(SELECT jsonb_agg(to_jsonb(e) ORDER BY evtname) FROM pg_event_trigger e),
 'schemas',(SELECT jsonb_agg(jsonb_build_object('name',nspname,'owner',nspowner,'acl',nspacl) ORDER BY nspname) FROM pg_namespace WHERE nspname='public' OR left(nspname,5)='busy_'))`;
let security;
const emptyPair=()=>{assert.equal(sql('SELECT count(*) FROM public.busy_businesses'),'0');assert.equal(sql('SELECT count(*) FROM public.busy_business_memberships'),'0');assert.equal(sql('SELECT count(*) FROM auth.users'),'1');assert.equal(sql('SELECT count(*) FROM auth.identities'),'1');assert.equal(sql('SELECT count(*) FROM supabase_migrations.schema_migrations'),'1');assert.deepEqual(json(securityQuery),security);};
const noSpending=()=>{assert.equal(sql('SELECT enabled FROM busy_ai_private.policy'),'f');assert.equal(sql('SELECT monthly_hard_limit FROM busy_ai_private.policy'),'0');for(const t of ['accounts','periods','tariffs','operations','events'])assert.equal(sql('SELECT count(*) FROM busy_ai_private.'+t),'0');};
const parallel=s=>new Promise((resolve,reject)=>{const c=execFile(bin,['-X','-h',socket,'-U','postgres','-v','ON_ERROR_STOP=1','-qAt','-d',db],{encoding:'utf8',maxBuffer:32*1024*1024},(e,out)=>e?reject(e):resolve(out.trim()));c.stdin.on('error',e=>{if(e.code!=='EPIPE')reject(e);});c.stdin.end('BEGIN;\n'+s+';\nCOMMIT;\n');});
try{
 await stage('dedicated-unix-only-postgres17-and-unchanged-foundation',()=>{
  assert.ok(socket.startsWith('/')&&data.startsWith('/'));assert.equal(sql('SHOW listen_addresses','postgres'),'');assert.equal(sql('SHOW data_directory','postgres'),data);const v=Number(sql('SHOW server_version_num','postgres'));assert.ok(v>=170000&&v<180000);
  assert.equal(createHash('sha256').update(readFileSync('docs/sql-proposals/ai-lab-runner-foundation/install.sql')).digest('hex'),foundation.sha256);
  sql('DROP DATABASE IF EXISTS '+db,'postgres',false);sql('CREATE DATABASE '+db,'postgres',false);sql(readFileSync('scripts/fixtures/ai-lab/empty-native.sql','utf8'));
  sql('CREATE SCHEMA supabase_migrations;CREATE TABLE supabase_migrations.schema_migrations(version text PRIMARY KEY,statements text[],name text);REVOKE ALL ON SCHEMA supabase_migrations FROM PUBLIC,anon,authenticated,service_role;REVOKE ALL ON supabase_migrations.schema_migrations FROM PUBLIC,anon,authenticated,service_role;');
  sql(foundationBody+history('mission18_ai_lab_foundation','20261106221950',foundationBody));
  sql(`ALTER TABLE auth.users ADD COLUMN email text,ADD COLUMN email_confirmed_at timestamptz,ADD COLUMN is_anonymous boolean DEFAULT false,ADD COLUMN role text DEFAULT 'authenticated',ADD COLUMN aud text DEFAULT 'authenticated',ADD COLUMN deleted_at timestamptz,ADD COLUMN banned_until timestamptz,ADD COLUMN is_super_admin boolean DEFAULT false,ADD COLUMN is_sso_user boolean DEFAULT false;CREATE TABLE auth.identities(user_id uuid REFERENCES auth.users(id),provider text,provider_id text);INSERT INTO auth.users(id,email,email_confirmed_at) VALUES(${q(owner)},${q(AI_LAB_SETUP_EMAIL)},'2026-11-06T22:00:00Z');INSERT INTO auth.identities VALUES(${q(owner)},'email',${q(owner)});`);
  security=json(securityQuery);emptyPair();noSpending();
 });
 await stage('fused-and-unbound-proposals-deny-without-side-effects',()=>{denied(bound.sql+history(),/FICTIONAL SETUP REVIEW FUSE/);denied(template.sql+history(),/FICTIONAL SETUP REVIEW FUSE/);emptyPair();});
 await stage('incorrect-native-owner-uuid-denied',()=>{const wrong=bindAiLabFictionalSetup(root,observation(randomUUID()));denied(fictionalSetupExecutionDerivative(wrong.sql,root)+history(),/query returned no rows|native laboratory owner/);emptyPair();});
 await stage('native-owner-email-confirmation-anonymous-role-and-account-state-denied',()=>{
  for(const change of ["email='foreign@example.invalid'",'email_confirmed_at=NULL','is_anonymous=true',"role='service_role'","aud='foreign'",'banned_until=now()+interval \'1 day\'','deleted_at=now()','is_super_admin=true','is_sso_user=true']){denied('UPDATE auth.users SET '+change+' WHERE id='+q(owner)+';'+batch(),/native laboratory owner/);emptyPair();}
 });
 await stage('missing-foreign-and-duplicate-native-identities-denied',()=>{
  for(const prefix of ['DELETE FROM auth.identities;',"UPDATE auth.identities SET provider='phone';",`INSERT INTO auth.identities VALUES(${q(owner)},'email','duplicate');`,`INSERT INTO auth.users(id,email,email_confirmed_at) VALUES(${q(randomUUID())},'other@example.invalid',now());`]){denied(prefix+batch(),/native email identity|one separately approved native/);emptyPair();}
 });
 await stage('partial-business-state-never-overwritten',()=>{denied(`INSERT INTO public.busy_businesses(name,created_by) VALUES('Existing fictional business',${q(owner)});`+batch(),/Fresh fictional business setup/);emptyPair();});
 await stage('disabled-policy-and-original-receipt-drift-denied',()=>{
  for(const prefix of ["UPDATE busy_ai_private.policy SET enabled=true;","UPDATE busy_ai_private.policy SET monthly_hard_limit=1;","UPDATE supabase_migrations.schema_migrations SET name='wrong';","UPDATE supabase_migrations.schema_migrations SET statements=ARRAY['SELECT 1'];"]){denied(prefix+batch(),/disabled zero and empty|installed foundation receipt/);emptyPair();noSpending();}
 });
 await stage('role-column-dml-and-force-rls-drift-denied-and-rolled-back',()=>{
  for(const prefix of ['SET LOCAL ROLE service_role;',"GRANT INSERT(name) ON public.busy_businesses TO authenticated;",'ALTER TABLE public.busy_businesses NO FORCE ROW LEVEL SECURITY;','ALTER TABLE public.busy_websites FORCE ROW LEVEL SECURITY;','ALTER EVENT TRIGGER ensure_rls DISABLE;']){denied(prefix+batch(),/permission denied|postgres setup runner|security boundary|FORCE|ownership or RLS|automatic RLS/);emptyPair();}
 });
 await stage('late-error-rolls-back-both-canonical-inserts-retains-native-owner',()=>{denied(body+"DO $$ BEGIN RAISE EXCEPTION 'Synthetic late setup failure';END $$;"+history(),/Synthetic late setup failure/);emptyPair();});
 await stage('native-history-write-failure-rolls-back-both-records',()=>{
  sql("ALTER TABLE supabase_migrations.schema_migrations ADD CONSTRAINT synthetic_setup_history_denial CHECK(name<>"+q(AI_LAB_SETUP_MIGRATION)+');');
  denied(batch(),/synthetic_setup_history_denial/);emptyPair();sql('ALTER TABLE supabase_migrations.schema_migrations DROP CONSTRAINT synthetic_setup_history_denial;');
 });
 await stage('deferred-native-history-failure-rolls-back-at-commit',()=>{
  sql("CREATE FUNCTION supabase_migrations.synthetic_setup_deferred_failure() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.name="+q(AI_LAB_SETUP_MIGRATION)+" THEN RAISE EXCEPTION 'Synthetic setup deferred history failure';END IF;RETURN NEW;END $$;CREATE CONSTRAINT TRIGGER synthetic_setup_history_commit_failure AFTER INSERT ON supabase_migrations.schema_migrations DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION supabase_migrations.synthetic_setup_deferred_failure();");
  denied(batch(),/Synthetic setup deferred history failure/);emptyPair();sql('DROP TRIGGER synthetic_setup_history_commit_failure ON supabase_migrations.schema_migrations;DROP FUNCTION supabase_migrations.synthetic_setup_deferred_failure();');
 });
 await stage('concurrent-identical-setup-has-one-winner-and-one-receipt',async()=>{
  const r=await Promise.allSettled([parallel(batch()),parallel(batch())]);assert.equal(r.filter(x=>x.status==='fulfilled').length,1);assert.equal(r.filter(x=>x.status==='rejected').length,1);assert.equal(sql('SELECT count(*) FROM public.busy_businesses'),'1');assert.equal(sql('SELECT count(*) FROM public.busy_business_memberships'),'1');assert.equal(sql('SELECT count(*) FROM supabase_migrations.schema_migrations'),'2');
  const receipt=json('SELECT jsonb_build_object(\'name\',name,\'statements\',statements) FROM supabase_migrations.schema_migrations WHERE name='+q(AI_LAB_SETUP_MIGRATION));assert.equal(receipt.name,AI_LAB_SETUP_MIGRATION);assert.deepEqual(receipt.statements,[body]);
 });
 await stage('exact-original-membership-and-unchanged-security-spending',()=>{
  const r=json('SELECT jsonb_build_object(\'name\',b.name,\'createdBy\',b.created_by,\'userId\',m.user_id,\'role\',m.role) FROM public.busy_businesses b JOIN public.busy_business_memberships m ON m.business_id=b.id');assert.deepEqual(r,{name:'Quiet Light Studio',createdBy:owner,userId:owner,role:'owner'});assert.deepEqual(json(securityQuery),security);noSpending();assert.equal(sql('SELECT count(*) FROM public.busy_business_snapshots'),'0');assert.equal(sql('SELECT count(*) FROM public.busy_public_business_profiles'),'0');
 });
 await stage('unknown-acknowledgement-resolved-by-read-only-original-receipts',()=>{
  const r=JSON.parse(sql(readOnlyFictionalSetupVerification(),db,false));assert.equal(r.readOnly,'on');assert.equal(r.authUserCount,1);assert.equal(r.identityCount,1);assert.equal(r.businessCount,1);assert.equal(r.membershipCount,1);assert.equal(r.profiles,0);assert.equal(r.snapshots,0);assert.deepEqual(r.policy,{enabled:false,monthlyHardLimit:0});assert.equal(r.nativeReceipts.length,2);assert.equal(r.nativeReceipts.find(x=>x.name===AI_LAB_SETUP_MIGRATION).executionSha256,bound.executionDerivativeSha256);
 });
 await stage('duplicate-dispatch-denied-with-original-records-and-receipts-retained',()=>{const before=json('SELECT jsonb_build_object(\'businesses\',(SELECT jsonb_agg(to_jsonb(b)) FROM public.busy_businesses b),\'memberships\',(SELECT jsonb_agg(to_jsonb(m)) FROM public.busy_business_memberships m))');denied(batch(),/installed foundation receipt|Fresh fictional business setup/);assert.deepEqual(json('SELECT jsonb_build_object(\'businesses\',(SELECT jsonb_agg(to_jsonb(b)) FROM public.busy_businesses b),\'memberships\',(SELECT jsonb_agg(to_jsonb(m)) FROM public.busy_business_memberships m))'),before);assert.equal(sql('SELECT count(*) FROM supabase_migrations.schema_migrations'),'2');});
 await stage('api-roles-cannot-write-memberships-or-enable-ai',()=>{
  for(const role of ['anon','authenticated','service_role']){denied('SET LOCAL ROLE '+role+`;INSERT INTO public.busy_businesses(name,created_by) VALUES('Forbidden',${q(owner)});`,/permission denied/);denied('SET LOCAL ROLE '+role+';UPDATE busy_ai_private.policy SET enabled=true;',/permission denied/);}
  assert.deepEqual(json(securityQuery),security);noSpending();assert.equal(sql('SELECT count(*) FROM auth.users'),'1');
 });
}finally{
 mkdirSync('.test-artifacts/ai-lab-fictional-setup',{recursive:true});const report={database:db,hosted:false,syntheticDataOnly:true,nativeAuthFixtureOnly:true,actualNativeAuthCreated:false,fixture:'Original approved foundation + native history shape + minimal synthetic native Auth metadata; not real Auth API or private managed-runner proof.',providerCalls:0,hostedMutations:0,foundationFusedSha256:foundation.sha256,foundationExecutionSha256:foundation.executionDerivativeSha256,setupTemplateSha256:template.templateSha256,syntheticOwnerBoundSha256:bound.sha256,syntheticExecutionSha256:bound.executionDerivativeSha256,originalFoundationUnchanged:true,results,summary:{passed:results.filter(r=>r.passed).length,failed:results.filter(r=>!r.passed).length}};
 writeFileSync('.test-artifacts/ai-lab-fictional-setup/postgres.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
}
