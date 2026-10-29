// Actual original-function/SQL bridge on the existing approved disposable socket.
// Mock auth.uid claims, inert external transport; never hosted JWT acceptance.
import assert from 'node:assert/strict';import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';import {execFileSync,spawnSync} from 'node:child_process';
import {privateWebsiteDraftAction} from '../supabase/functions/busy-website-publish/privateDraftService.mjs';
import {createConnectedBuilderSession} from '../src/staging/connectedBuilderSession.mjs';
import {proposeCoordinatedAppChanges} from '../src/core/appCoordinatedStudio.mjs';
import {createRequire} from 'node:module';
const {requireTools}=await import('./testing/tooling.mjs');
const bin='/workspace/pg17-disposable/root/usr/lib/postgresql/17/bin/psql',socket='/workspace/pg17-disposable/socket',db='busy_connected_builders_disposable';
const base=['-X','-h',socket,'-U','postgres','-v','ON_ERROR_STOP=1','-At'],q=x=>x==null?'NULL':"'"+(typeof x==='object'?JSON.stringify(x):String(x)).replaceAll("'","''")+"'",read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const sql=(s,d=db)=>execFileSync(bin,[...base,'-d',d],{input:s,encoding:'utf8',stdio:['pipe','pipe','pipe']}).trim();
assert.equal(sql('SHOW listen_addresses','postgres'),'');assert.equal(sql('SHOW data_directory','postgres'),'/workspace/pg17-disposable/data');
let actor='cccccccc-cccc-4ccc-8ccc-cccccccccccc',B='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',D='dddddddd-dddd-4ddd-8ddd-dddddddddddd',F='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const results=[];async function stage(id,run){try{await run();results.push({id,passed:true,exitCode:0});}catch(e){results.push({id,passed:false,error:String(e.stderr||e.message).slice(0,1000)});throw e;}}
const auth=s=>`BEGIN;SET LOCAL ROLE authenticated;SET LOCAL request.jwt.claim.sub=${q(actor)};${s};COMMIT;`,service=s=>`BEGIN;SET LOCAL ROLE service_role;${s};COMMIT;`;
const packet=s=>JSON.parse(sql(s).split('\n').find(l=>l.startsWith('{'))),deny=s=>assert.throws(()=>sql(s));
let calls=0;const rpc=(name,args,role='owner')=>{calls++;return packet((role==='service'?service:auth)('SELECT public.'+name+'('+args.map(q).join(',')+')'));};
try{
 await stage('create-isolated-database',()=>{sql('DROP DATABASE IF EXISTS '+db,'postgres');sql('CREATE DATABASE '+db,'postgres');});
 await stage('original-membership-and-snapshot-fixture',()=>{
  let fixture=read('staging/phase58-snapshot/fixture.sql');fixture=fixture.slice(fixture.indexOf('CREATE SCHEMA auth;'),fixture.indexOf('-- Original live design finding'));sql(fixture);
  sql("CREATE TABLE auth.users(id uuid PRIMARY KEY);INSERT INTO auth.users VALUES('"+actor+"'),('"+D+"');CREATE TABLE public.busy_websites(id uuid PRIMARY KEY);CREATE TABLE public.busy_website_deployments(id uuid PRIMARY KEY);");
  const profile=read('supabase/migrations/20261007070450_v3_37_live_website_management_foundation.sql');sql(profile.slice(profile.indexOf('create table if not exists public.busy_public_business_profiles ('),profile.indexOf('create table if not exists public.busy_website_health_checks')));
  sql('ALTER TABLE public.busy_public_business_profiles ENABLE ROW LEVEL SECURITY;REVOKE ALL ON public.busy_public_business_profiles FROM PUBLIC,anon,authenticated;');
  sql(read('docs/sql-proposals/phase58-snapshot/writer.sql'));
  const fence=read('docs/sql-proposals/phase58-snapshot/fence.sql');sql(fence.replace(/^DO \$\$ BEGIN RAISE EXCEPTION 'PHASE58 REVIEW FUSE:.*?\n/m,''));
 });
 await stage('proposal-aborts-with-fuse',()=>deny(read('docs/sql-proposals/connected-builders/contracts.sql')));
 await stage('disposable-only-contract-install',()=>sql(read('docs/sql-proposals/connected-builders/contracts.sql').replace(/^DO \$\$ BEGIN RAISE EXCEPTION 'CONNECTED BUILDERS REVIEW FUSE:.*?\n/m,'')));
 const profile={businessName:'Fictional Hillside Gardens',businessType:'Gardening',services:[{id:'lawns',name:'Lawn care',description:'Cut and tidy lawns.'},{id:'hedges',name:'Hedge trimming',description:'Trim hedges and clear cuttings.'}],contact:{email:'garden@example.invalid'}};
 sql('INSERT INTO public.busy_public_business_profiles(business_id,public_slug,display_name,profile,updated_by)VALUES('+[B,'fictional-garden',profile.businessName,profile,actor].map(q).join(',')+')');
 const before=sql('SELECT (payload-\'websiteDraft\')::text FROM public.busy_business_snapshots WHERE business_id='+q(B));
 let lost=false,writes=0;const request=async(action,payload)=>{
  if(action==='builder_read')return rpc('busy_connected_builder_read_v1',[payload.businessId]);
  return privateWebsiteDraftAction({action,body:payload,userId:actor,read:async id=>rpc('busy_connected_builder_read_v1',[id]),commit:async p=>{writes++;const result=rpc('busy_connected_website_commit_v1',Object.values(p),'service');if(lost)throw Error('Lost acknowledgement after real PostgreSQL COMMIT');return result;}});
 };
 const session=createConnectedBuilderSession({request});let basis;
 await stage('owner-discovers-only-owned-business',()=>{const r=rpc('busy_connected_workspaces_v1',[]);assert.deepEqual(r.items.map(s=>s.businessId),[B]);});
 await stage('owner-create-original-website-save-readback',async()=>{basis=await session.open(B);const r=await session.website({basis,action:'create',sourceRevision:1,ownerApproved:true});assert.equal(r.ok,true);basis=r.observed;assert.equal(basis.websiteDraft.businessName,profile.businessName);assert.equal(basis.websiteDraft.sections.find(s=>s.id==='services').items.length,2);});
 await stage('fresh-client-reopens-persisted-website',async()=>{const fresh=createConnectedBuilderSession({request});const r=await fresh.open(B);assert.deepEqual(r.websiteDraft,basis.websiteDraft);});
 await stage('original-wording-edit-real-cas-readback',async()=>{const r=await session.website({basis,action:'edit_text',patch:{sectionId:'hero',field:'title',value:'Owner corrected garden headline'},ownerApproved:true});assert.equal(r.ok,true);basis=r.observed;assert.equal(basis.websiteDraft.sections[0].title,'Owner corrected garden headline');});
 await stage('unrelated-private-records-unchanged',()=>assert.equal(sql('SELECT (payload-\'websiteDraft\')::text FROM public.busy_business_snapshots WHERE business_id='+q(B)),before));
 await stage('stale-revision-and-target-denied',()=>deny(service('SELECT public.busy_connected_website_commit_v1('+[B,actor,1,null,basis.websiteDraft,1].map(q).join(',')+')')));
 await stage('lost-ack-observed-not-own-receipt-no-replay',async()=>{lost=true;const r=await session.website({basis,action:'edit_text',patch:{sectionId:'hero',field:'body',value:'Unfinished owner wording preserved'},ownerApproved:true});assert.equal(r.unknown,true);assert.equal(r.observed.websiteDraft.sections[0].body,'Unfinished owner wording preserved');const count=writes;await assert.rejects(()=>session.website({basis,action:'create',ownerApproved:true}));assert.equal(writes,count);const fresh=await session.reconcile();assert.equal(fresh.notOwnReceipt,true);basis=fresh.observed;lost=false;});
 await stage('foreign-owner-and-anonymous-denied',()=>{actor=D;deny(auth('SELECT public.busy_connected_builder_read_v1('+q(B)+')'));assert.deepEqual(rpc('busy_connected_workspaces_v1',[]).items.map(s=>s.businessId),[F]);actor='cccccccc-cccc-4ccc-8ccc-cccccccccccc';deny('SET ROLE anon;SELECT public.busy_connected_builder_read_v1('+q(B)+')');});
 await stage('direct-privileged-write-and-ownership-transfer-denied',()=>{deny(auth('SELECT public.busy_connected_website_commit_v1('+[B,actor,basis.revision,basis.websiteDraft,basis.websiteDraft,1].map(q).join(',')+')'));deny(auth("UPDATE public.busy_business_snapshots SET business_id="+q(F)+" WHERE business_id="+q(B)));});
 await stage('revoked-membership-denies-old-session',()=>{sql('DELETE FROM public.busy_business_memberships WHERE business_id='+q(B)+' AND user_id='+q(actor));deny(auth('SELECT public.busy_connected_builder_read_v1('+q(B)+')'));deny(service('SELECT public.busy_connected_website_commit_v1('+[B,actor,basis.revision,basis.websiteDraft,basis.websiteDraft,1].map(q).join(',')+')'));sql('INSERT INTO public.busy_business_memberships(business_id,user_id,role)VALUES('+[B,actor,'owner'].map(q).join(',')+')');});
 // Original app tables and atomic first-draft routine, without schedulers/workers.
 await stage('original-mini-app-contracts',()=>{const original=read('supabase/migrations/20261007082234_v3_39_busy_apps_marketplace_foundation.sql');sql(original.slice(0,original.indexOf('insert into public.busy_mini_app_module_catalog')));for(const t of ['busy_mini_apps','busy_mini_app_versions','busy_mini_app_requests','busy_mini_app_module_catalog'])sql('ALTER TABLE public.'+t+' ENABLE ROW LEVEL SECURITY;REVOKE ALL ON public.'+t+' FROM PUBLIC,anon,authenticated;GRANT SELECT,INSERT,UPDATE,DELETE ON public.'+t+' TO service_role;');sql(read('supabase/migrations/20261013081000_v3199_atomic_first_private_app.sql'));});
 let app;const config={surface:'busy_mini_app',display:{name:profile.businessName},publicProfile:basis.profile,modules:[{key:'business_profile',enabled:true,status:'available',version:1},{key:'services',enabled:true,status:'available',version:1},{key:'enquiry',enabled:true,status:'available',version:1}],navigation:['business_profile','services','enquiry']};
 await stage('original-atomic-private-app-create-real-postgres',()=>{const r=rpc('busy_create_first_mini_app_draft_v3199',[B,actor,'fictional-garden',profile.businessName,'Gardening','',1,config],'service');assert.equal(r.created,true);app=r.app;assert.equal(app.discoverable,false);assert.equal(app.status,'draft');assert.deepEqual(app.draft_config.publicProfile.services,basis.profile.services);});
 await stage('original-duplicate-first-app-does-not-overwrite',()=>{const r=rpc('busy_create_first_mini_app_draft_v3199',[B,actor,'different-name','Different','Gardening','',1,{...config,display:{name:'Different'}}],'service');assert.equal(r.created,false);});
 // Execute actual ORIGINAL Edge Studio function body; its finite query builder
 // is mapped to real PostgreSQL CAS, not an in-memory success response.
 const source=read('supabase/functions/busy-mini-apps/index.ts'),part=source.slice(source.indexOf('async function applyCoordinatedPrivateAppEdits('),source.indexOf('async function setPrivateAppAppearance('));
 const code=requireTools('@babel/core').transformSync(part,{configFile:false,babelrc:false,plugins:[requireTools('@babel/plugin-transform-typescript')],filename:'original.ts'}).code;
 const appForBusiness=async id=>{const value=sql(service('SELECT row_to_json(a) FROM public.busy_mini_apps a WHERE business_id='+q(id)));return JSON.parse(value.split('\n').find(l=>l.startsWith('{')));};
 const transport={from:table=>{assert.equal(table,'busy_mini_apps');let update,filters=[];const chain={update:v=>{update=v;return chain;},eq:(k,v)=>{assert.ok(['id','business_id','draft_revision'].includes(k));filters.push([k,v]);return chain;},select:()=>chain,maybeSingle:async()=>{try{const row=sql(service('UPDATE public.busy_mini_apps SET '+Object.entries(update).map(([k,v])=>k+'='+q(v)).join(',')+' WHERE '+filters.map(([k,v])=>k+'='+q(v)).join(' AND ')+' RETURNING row_to_json(busy_mini_apps)'));return {data:JSON.parse(row.split('\n').find(l=>l.startsWith('{'))||'null')};}catch(e){return {error:e};}}};return chain;}};
 const edit=new Function('appForBusiness','supabase','proposeCoordinatedAppChanges',code+';return applyCoordinatedPrivateAppEdits;')(appForBusiness,transport,proposeCoordinatedAppChanges);
 let undo;
 await stage('actual-original-studio-save-reopen',async()=>{const r=await edit(B,{appId:app.id,expectedRevision:app.draft_revision,ownerApproved:true,operations:[{kind:'text',field:'tagline',value:'Owner approved garden care'}]});undo=r.undoOperations;app=r.app;assert.equal((await appForBusiness(B)).draft_config.publicProfile.tagline,'Owner approved garden care');});
 await stage('actual-original-studio-stale-denied',()=>assert.rejects(()=>edit(B,{appId:app.id,expectedRevision:1,ownerApproved:true,operations:undo})));
 await stage('actual-original-studio-undo-preserves-website',async()=>{const r=await edit(B,{appId:app.id,expectedRevision:app.draft_revision,ownerApproved:true,operations:undo});assert.deepEqual(r.app.draft_config,config);assert.deepEqual(rpc('busy_connected_builder_read_v1',[B]).websiteDraft,basis.websiteDraft);});
 await stage('app-raw-cross-tenant-and-anon-denied',()=>{deny(auth('SELECT * FROM public.busy_mini_apps'));deny('SET ROLE anon;SELECT * FROM public.busy_mini_apps');});
}finally{
 const out={source:'actual local PostgreSQL17 original functions and CAS; synthetic auth.uid only',database:db,results,successfulRpcCalls:calls,summary:{passed:results.filter(r=>r.passed).length,failed:results.filter(r=>!r.passed).length},hosted:false};mkdirSync('.test-artifacts/connected-builders',{recursive:true});writeFileSync('.test-artifacts/connected-builders/postgres.json',JSON.stringify(out,null,2));console.log(JSON.stringify(out.summary));if(out.summary.failed)process.exitCode=1;
}
