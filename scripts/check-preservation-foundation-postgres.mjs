import assert from 'node:assert/strict';
import {createConnectedBuilderSession} from '../src/staging/connectedBuilderSession.mjs';
import {privateWebsiteDraftAction} from '../supabase/functions/busy-website-publish/privateDraftService.mjs';
import {connectedAccountRoutes} from '../src/staging/connectedAccountRoutes.mjs';
import {execFileSync,execFile} from 'node:child_process';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createHash,randomUUID} from 'node:crypto';
import {preservationFoundationPackage} from './lib/preservation-foundation-package.mjs';
import {wholeAppStagingPackage} from './lib/whole-app-staging-package.mjs';
import {stagingPreservation} from './lib/staging-preservation.mjs';
import {sqlStatements} from './lib/owner-status-schema.mjs';
const bin=process.env.BUSY_LOCAL_PG_BIN||'/workspace/pg17-disposable/root/usr/lib/postgresql/17/bin/psql',socket=process.env.BUSY_LOCAL_PG_SOCKET||'/workspace/pg17-disposable/socket',data=process.env.BUSY_LOCAL_PG_DATA||'/workspace/pg17-disposable/data',db='busy_preservation_disposable';
const sql=(s,d=db)=>execFileSync(bin,['-X','-h',socket,'-U','postgres','-v','ON_ERROR_STOP=1','-qAt','-d',d],{input:s,encoding:'utf8',stdio:['pipe','pipe','pipe']}).trim(),json=s=>JSON.parse(sql(s)),q=v=>v==null?'NULL':"'"+(typeof v==='object'?JSON.stringify(v):String(v)).replaceAll("'","''")+"'",hash=s=>createHash('sha256').update(s).digest('hex');
const p=preservationFoundationPackage(process.cwd()),guard=stagingPreservation(process.cwd()),snapshot=readFileSync('scripts/lib/onboarding-preservation-snapshot.sql','utf8'),expected=JSON.parse(readFileSync('docs/sql-proposals/preservation-foundation/onboarding-baseline.json'));
const unfuse=s=>s.replace(/^DO \$\$ BEGIN RAISE EXCEPTION '(?:PRESERVATION FOUNDATION|PRESERVATION ROLLBACK|WHOLE APP STAGING) REVIEW FUSE:[^\n]+\n/m,'');
const body=s=>sqlStatements(unfuse(s)).filter(x=>! /^(BEGIN|COMMIT);$/i.test(x.replace(/--[^\n]*/g,'').trim())).join('\n');
const A='10000000-0000-4000-8000-000000000041',B='10000000-0000-4000-8000-000000000042',business='10000000-0000-4000-8000-000000000043',foreign='10000000-0000-4000-8000-000000000044';
const results=[];let preservedRows,sequence,finalRowsHash=null;
const denied=(statement,pattern)=>assert.throws(()=>sql(statement),e=>pattern.test(String(e.stderr||e)));
const rows=()=>sql("SELECT jsonb_build_object('waitlist',(SELECT jsonb_agg(to_jsonb(t) ORDER BY id) FROM public.busy_marketing_waitlist t),'canary',(SELECT jsonb_agg(to_jsonb(t) ORDER BY id) FROM public.busy_staging_rls_canary t))");
const actor=(role,user,statement)=>sql('BEGIN;SET LOCAL ROLE '+role+';SET LOCAL request.jwt.claim.sub='+q(user)+';'+statement+';ROLLBACK;');
const stage=async(id,fn)=>{try{await fn();results.push({id,passed:true});}catch(e){results.push({id,passed:false,error:String(e.stderr||e.stack).slice(-2500)});throw e;}};
function behaviours(){
 assert.equal(actor('authenticated',A,'SELECT count(*) FROM public.busy_staging_rls_canary'),'1');
 assert.equal(actor('authenticated',B,'SELECT count(*) FROM public.busy_staging_rls_canary'),'1');
 assert.equal(actor('authenticated',A,'SELECT marker FROM public.busy_staging_rls_canary'),'synthetic-owner-A');assert.equal(actor('authenticated',B,'SELECT marker FROM public.busy_staging_rls_canary'),'synthetic-owner-B');assert.equal(actor('authenticated',A,'SELECT count(*) FROM public.busy_staging_rls_canary WHERE owner_id='+q(B)),'0');
 assert.throws(()=>actor('anon',A,'SELECT * FROM public.busy_marketing_waitlist'));
 assert.throws(()=>actor('authenticated',A,'SELECT * FROM public.busy_marketing_waitlist'));
 assert.throws(()=>actor('service_role',A,'SELECT * FROM public.busy_staging_rls_canary'));
 assert.equal(actor('service_role',A,'SELECT count(*) FROM public.busy_marketing_waitlist'),'2');
 assert.throws(()=>actor('service_role',A,'DELETE FROM public.busy_marketing_waitlist'));
 assert.throws(()=>actor('authenticated',A,"UPDATE public.busy_staging_rls_canary SET marker='changed-test'"));
 assert.throws(()=>actor('service_role',A,"UPDATE public.busy_marketing_waitlist SET email='INVALID'"));
 assert.throws(()=>actor('service_role',A,"UPDATE public.busy_marketing_waitlist SET status='invented'"));
 assert.throws(()=>actor('service_role',A,"UPDATE public.busy_marketing_waitlist SET token_hash='bad'"));
 assert.throws(()=>actor('service_role',A,"UPDATE public.busy_marketing_waitlist SET email='one@example.invalid'"));
 assert.equal(actor('service_role',A,"UPDATE public.busy_marketing_waitlist SET status='confirmed' WHERE email='one@example.invalid';SELECT status FROM public.busy_marketing_waitlist WHERE email='one@example.invalid'"),'confirmed');
}
try{
 await stage('isolated-unix-only-postgres-and-exact-hosted-catalogue-fixture',()=>{
  assert.equal(sql('SHOW listen_addresses','postgres'),'');assert.equal(sql('SHOW data_directory','postgres'),data);sql('DROP DATABASE IF EXISTS '+db,'postgres');sql('CREATE DATABASE '+db,'postgres');sql(readFileSync('scripts/fixtures/preservation/onboarding.sql','utf8'));assert.deepEqual(json(snapshot),expected);
  sql('INSERT INTO auth.users VALUES('+q(A)+'),('+q(B)+");INSERT INTO public.busy_staging_rls_canary VALUES('20000000-0000-4000-8000-000000000041',"+q(A)+",'synthetic-owner-A'),('20000000-0000-4000-8000-000000000042',"+q(B)+",'synthetic-owner-B');INSERT INTO public.busy_marketing_waitlist(email,consent_version,token_hash) VALUES('one@example.invalid','synthetic-v1','"+'a'.repeat(64)+"'),('two@example.invalid','synthetic-v1','"+'b'.repeat(64)+"');");preservedRows=hash(rows());sequence=sql('SELECT last_value::text||is_called::text FROM public.busy_marketing_waitlist_id_seq');behaviours();
 });
 await stage('original-fresh-package-still-refuses-and-review-fuses-deny',()=>{denied(unfuse(wholeAppStagingPackage(process.cwd()).sql),/Fresh reviewed staging only/);denied(p.sql,/REVIEW FUSE/);assert.equal(sql("SELECT to_regclass('public.busy_businesses') IS NULL"),'t');assert.equal(hash(rows()),preservedRows);assert.deepEqual(json(snapshot),expected);});
 await stage('permission-schema-policy-sequence-and-unexpected-object-drift-denied',()=>{
  for(const change of ["GRANT SELECT ON public.busy_marketing_waitlist TO anon;","GRANT SELECT(email) ON public.busy_marketing_waitlist TO authenticated;","DROP POLICY busy_staging_canary_owner_read ON public.busy_staging_rls_canary;","ALTER EVENT TRIGGER ensure_rls DISABLE;","ALTER TABLE public.busy_staging_rls_canary NO FORCE ROW LEVEL SECURITY;","DROP INDEX public.busy_marketing_waitlist_pending_expiry_idx;","GRANT UPDATE ON SEQUENCE public.busy_marketing_waitlist_id_seq TO service_role;","CREATE TABLE public.unreviewed_source(id integer);","CREATE SCHEMA busy_ai_private;","CREATE FUNCTION public.unreviewed_source() RETURNS int LANGUAGE sql AS $$SELECT 1$$;"]){denied('BEGIN;'+change+body(p.sql)+'COMMIT;',/drift|Fresh reviewed staging only/);assert.deepEqual(json(snapshot),expected);assert.equal(hash(rows()),preservedRows);}
 });
 await stage('mid-install-data-and-catalogue-damage-rolls-back-everything',()=>{
  const after=guard.after,at=unfuse(p.sql).lastIndexOf(after);assert.ok(at>0);
  for(const damage of ["ALTER TABLE public.busy_marketing_waitlist DISABLE ROW LEVEL SECURITY;","TRUNCATE public.busy_marketing_waitlist;","UPDATE public.busy_marketing_waitlist SET status='unsubscribed';"]){
   // Sequence increments are non-transactional: no production generator statement
   // may consume it. Test the hash refusal, retain the advanced synthetic state; never rewind an existing sequence.
   const changed=unfuse(p.sql).slice(0,at)+damage+unfuse(p.sql).slice(at);denied(changed,/Preserved onboarding/);
   assert.equal(sql("SELECT to_regclass('public.busy_businesses') IS NULL"),'t');assert.deepEqual(json(snapshot),expected);assert.equal(hash(rows()),preservedRows);
  }
 });
 await stage('nontransactional-sequence-drift-is-denied-and-never-rewound',()=>{
  const plain=unfuse(p.sql),at=plain.lastIndexOf(guard.after);denied(plain.slice(0,at)+"SELECT nextval('public.busy_marketing_waitlist_id_seq');"+plain.slice(at),/Preserved onboarding data or sequence state/);
  // PostgreSQL nextval is nontransactional. Retain the advanced synthetic state:
  // neither the real proposal nor its rollback contains a sequence rewind.
  sequence=sql('SELECT last_value::text||is_called::text FROM public.busy_marketing_waitlist_id_seq');assert.equal(sequence,'3true');assert.equal(hash(rows()),preservedRows);assert.equal(sql("SELECT to_regclass('public.busy_businesses') IS NULL"),'t');
 });
 await stage('atomic-original-foundation-ai-and-receipt-install-preserves-state',()=>{sql(unfuse(p.sql));assert.deepEqual(json(snapshot),expected);assert.equal(hash(rows()),preservedRows);assert.equal(sql('SELECT last_value::text||is_called::text FROM public.busy_marketing_waitlist_id_seq'),sequence);behaviours();assert.equal(sql('SELECT enabled FROM busy_ai_private.policy'),'f');assert.equal(sql('SELECT count(*) FROM busy_ai_private.accounts'),'0');assert.equal(sql('SELECT count(*) FROM busy_ai_private.tariffs'),'0');assert.throws(()=>sql(unfuse(p.sql)));});
 let binding,operation,nonce,basis;
 const svc=(name,args)=>json('BEGIN;SET LOCAL ROLE service_role;SELECT public.'+name+'('+args.map(q).join(',')+');COMMIT;');
 const rpc=(name,args)=>json('BEGIN;SET LOCAL ROLE authenticated;SET LOCAL request.jwt.claim.sub='+q(A)+';SELECT public.'+name+'('+args.map(q).join(',')+');COMMIT;');
 await stage('original-owner-profile-website-save-readback-and-source-bindings',async()=>{
  sql('INSERT INTO public.busy_businesses(id,name,created_by) VALUES('+q(business)+",'Fictional Quiet Light acceptance',"+q(A)+'),('+q(foreign)+",'Fictional other business',"+q(B)+');INSERT INTO public.busy_business_memberships(business_id,user_id,role) VALUES('+q(business)+','+q(A)+",'owner'),("+q(foreign)+','+q(B)+",'owner');");
  rpc('busy_connected_initialize_v1',[business]);
  const request=async(action,p={})=>{if(action==='builder_read')return rpc('busy_connected_builder_read_v1',[p.businessId||business]);if(action.startsWith('website_'))return privateWebsiteDraftAction({action,body:p,userId:A,read:id=>rpc('busy_connected_builder_read_v1',[id]),commit:a=>svc('busy_connected_website_commit_v1',Object.values(a)),history:(...a)=>rpc('busy_connected_website_history_v1',a),transition:a=>svc('busy_connected_website_transition_v1',Object.values(a))});const route=connectedAccountRoutes[action];return rpc(route[0],route[1].map(k=>p[k]??(k==='businessId'?business:null)));};
  const session=createConnectedBuilderSession({request});basis=await session.open(business);const saved=await session.profile({basis,ownerApproved:true,profile:{businessName:'Quiet Light Studio',businessType:'Creative studio',description:'Approved fictional words and design.',services:[{id:'direction',name:'Creative direction',description:'A considered fictional creative brief.'}],contact:{email:'quiet-light@example.invalid'}}});assert.equal(saved.ok,true);basis=saved.observed;
  const created=await session.website({basis,action:'create',sourceRevision:basis.profileRevision,ownerApproved:true});assert.equal(created.ok,true,created.reason);basis=created.observed;
  const changed=await session.website({basis,action:'edit_instruction',ownerApproved:true,patch:{pageId:'home',generation:basis.websiteDraft.generation,instruction:'change the hero heading to "Make room for a clearer idea"'}});assert.equal(changed.ok,true);basis=changed.observed;assert.equal((await session.read()).websiteDraft.sections.find(s=>s.id==='hero').title,'Make room for a clearer idea');
  const undone=await session.website({basis,action:'undo',ownerApproved:true});assert.equal(undone.ok,true);basis=undone.observed;const redone=await session.website({basis,action:'redo',ownerApproved:true});assert.equal(redone.ok,true);basis=redone.observed;
  binding={surface:'website',projectId:basis.websiteDraft.id,sourceRevision:basis.websiteDraft.generation,profileRevision:basis.profileRevision,snapshotRevision:basis.revision,pageId:'home'};assert.equal(svc('busy_ai_context_v1',[A,business,binding]).ownerId,A);
 });
 await stage('service-only-current-membership-and-stale-source-denial',()=>{
  assert.throws(()=>rpc('busy_ai_context_v1',[A,business,binding]));assert.throws(()=>svc('busy_ai_context_v1',[B,business,binding]));
  for(const b of [{...binding,sourceRevision:binding.sourceRevision+1},{...binding,profileRevision:binding.profileRevision+1},{...binding,projectId:'foreign-original-project'}])assert.throws(()=>svc('busy_ai_context_v1',[A,business,b]));
  assert.throws(()=>sql('BEGIN;DELETE FROM public.busy_business_memberships WHERE business_id='+q(business)+';SET LOCAL ROLE service_role;SELECT public.busy_ai_context_v1('+[A,business,binding].map(q).join(',')+');COMMIT;'));
 });
 const reserve=(op,n)=>svc('busy_ai_reserve_v1',[A,business,op,'offline-website-v1','website-design',binding,'c'.repeat(64),n]);
 await stage('default-off-then-explicit-disposable-offline-allocation-not-real-entitlement',()=>{
  assert.throws(()=>reserve(randomUUID(),randomUUID()));
  sql("UPDATE busy_ai_private.policy SET enabled=true,monthly_hard_limit=100000;INSERT INTO busy_ai_private.accounts(business_id,period,verified_entitlement_reference,entitlement_verified,active_until,monthly_limit,expensive_limit,feature_limits,concurrent_limit)VALUES("+q(business)+",date_trunc('month',now() AT TIME ZONE 'UTC')::date,'synthetic-disposable-test-allocation-NOT-hosted-entitlement',true,now()+interval '1 day',100000,0,'{\"website-design\":100000}',1);INSERT INTO busy_ai_private.tariffs VALUES('offline-website-v1',1,'website-design',true,now()+interval '1 day',4000,1000,100,200,1000000,0,false,'GBP','synthetic-offline-NOT-OpenAI-pricing');");
 });
 await stage('actual-concurrent-reserve-one-winner-immutable-nonce-and-one-dispatch',async()=>{
  operation=randomUUID();const nonces=[randomUUID(),randomUUID()];
  const parallel=s=>new Promise((resolve,reject)=>{const c=execFile(bin,['-X','-h',socket,'-U','postgres','-v','ON_ERROR_STOP=1','-qAt','-d',db],{encoding:'utf8'},(e,out)=>e?reject(e):resolve(JSON.parse(out.trim())));c.stdin.end(s);});
  const returns=await Promise.all(nonces.map(n=>parallel('BEGIN;SET LOCAL ROLE service_role;SELECT public.busy_ai_reserve_v1('+[A,business,operation,'offline-website-v1','website-design',binding,'c'.repeat(64),n].map(q).join(',')+');COMMIT;')));assert.equal(returns.filter(x=>x.fresh).length,1);nonce=nonces[returns.findIndex(x=>x.fresh)];
  assert.throws(()=>svc('busy_ai_dispatch_v1',[A,business,operation,nonces.find(n=>n!==nonce)]));svc('busy_ai_dispatch_v1',[A,business,operation,nonce]);assert.throws(()=>svc('busy_ai_dispatch_v1',[A,business,operation,nonce]));assert.equal(svc('busy_ai_operation_read_v1',[A,business,operation,nonce]).attempts,1);
 });
 await stage('unknown-outcome-retains-liability-and-cannot-replay-or-release',()=>{
  svc('busy_ai_finish_v1',[A,business,operation,'unknown',null,null,null,nonce]);const receipt=svc('busy_ai_operation_read_v1',[A,business,operation,nonce]);assert.equal(receipt.state,'unknown');assert.ok(receipt.maximumMicroGBP>0);assert.equal(receipt.actualMicroGBP,null);assert.equal(reserve(operation,randomUUID()).fresh,false);assert.throws(()=>reserve(randomUUID(),randomUUID()));assert.throws(()=>svc('busy_ai_finish_v1',[A,business,operation,'released',null,null,null,nonce]));
 });
 await stage('fused-retaining-rollback-keeps-existing-state-and-cost-readback',()=>{
  assert.throws(()=>sql(p.rollback));sql(unfuse(p.rollback));assert.deepEqual(json(snapshot),expected);assert.equal(hash(rows()),preservedRows);assert.equal(sql('SELECT last_value::text||is_called::text FROM public.busy_marketing_waitlist_id_seq'),sequence);behaviours();
  assert.equal(sql('SELECT enabled FROM busy_ai_private.policy'),'f');assert.throws(()=>reserve(randomUUID(),randomUUID()));assert.equal(svc('busy_ai_operation_read_v1',[A,business,operation,nonce]).state,'unknown');assert.equal(sql('SELECT count(*) FROM public.busy_business_snapshots WHERE business_id='+q(business)),'1');
 });
 await stage('known-zero-offline-settlement-retains-audit-no-fake-provider-receipt',()=>{
  svc('busy_ai_finish_v1',[A,business,operation,'settled',0,0,'offline:preservation-rehearsal-'+operation,nonce]);const receipt=svc('busy_ai_operation_read_v1',[A,business,operation,nonce]);assert.equal(receipt.state,'settled');assert.equal(receipt.actualMicroGBP,0);assert.ok(receipt.providerReceipt.startsWith('offline:'));assert.ok(Number(sql('SELECT count(*) FROM busy_ai_private.events'))>=3);assert.equal(hash(rows()),preservedRows);assert.deepEqual(json(snapshot),expected);finalRowsHash=hash(rows());denied(unfuse(p.sql),/Fresh reviewed staging only/);assert.equal(svc('busy_ai_operation_read_v1',[A,business,operation,nonce]).state,'settled');
 });
}finally{
 mkdirSync('.test-artifacts/preservation-foundation',{recursive:true});writeFileSync('.test-artifacts/preservation-foundation/postgres.json',JSON.stringify({database:db,hosted:false,syntheticRowsOnly:true,realProviderReceiptsCreated:false,realEntitlementsAsserted:false,baselineSha256:p.preservation.baselineSha256,preservedSyntheticRowsHash:preservedRows,finalSyntheticRowsHash:finalRowsHash,nontransactionalSequenceNeverRewound:true,installSha256:p.sha256,rollbackSha256:p.rollbackSha256,results,summary:{passed:results.filter(r=>r.passed).length,failed:results.filter(r=>!r.passed).length}},null,2));console.log(JSON.stringify(results));
}
