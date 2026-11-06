import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {wholeAppStagingPackage} from './lib/whole-app-staging-package.mjs';
import {createConnectedBuilderSession} from '../src/staging/connectedBuilderSession.mjs';
import {connectedAccountRoutes} from '../src/staging/connectedAccountRoutes.mjs';
import {privateWebsiteDraftAction} from '../supabase/functions/busy-website-publish/privateDraftService.mjs';
import {applyWebsitePageChange,renderWebsiteHtml} from '../src/domain/websiteBuilder.js';
import {prepareWholeWebsite,prepareWholeWebsiteRefinement,keepWholeWebsite} from '../src/core/wholeWebsitePlan.mjs';
import {websiteRequestContent} from '../src/core/websiteRequestPlan.mjs';
// Original canonical authorities on a guarded disposable local database only.
// This does not read, unfuse, install or change the reviewed AI Lab SQL artifact.
const bin=process.env.BUSY_LOCAL_PG_BIN||'/workspace/pg17-disposable/root/usr/lib/postgresql/17/bin/psql';
const socket=process.env.BUSY_LOCAL_PG_SOCKET||'/workspace/pg17-disposable/socket';
const data=process.env.BUSY_LOCAL_PG_DATA||'/workspace/pg17-disposable/data';
const db='busy_mission16_disposable',results=[];
const sql=(s,d=db)=>execFileSync(bin,['-X','-h',socket,'-U','postgres','-v','ON_ERROR_STOP=1','-qAt','-d',d],{input:s,encoding:'utf8',stdio:['pipe','pipe','pipe']}).trim();
const q=v=>v==null?'NULL':"'"+(typeof v==='object'?JSON.stringify(v):String(v)).replaceAll("'","''")+"'";
const json=s=>JSON.parse(sql(s).split('\n').find(x=>x.startsWith('{')));
const O='16000000-0000-4000-8000-000000000001',P='16000000-0000-4000-8000-000000000002',B='16000000-0000-4000-8000-000000000003',F='16000000-0000-4000-8000-000000000004';
let actor=O,basis,session,writeCalls=0,loseAck=false,wholeSiteSourceCasReady=false,beforeCommit=null,guardSha256=null;
const rpc=(name,args)=>json('BEGIN;SET LOCAL ROLE authenticated;SET LOCAL request.jwt.claim.sub='+q(actor)+';SELECT public.'+name+'('+args.map(q).join(',')+');COMMIT;');
const svc=(name,args)=>json('BEGIN;SET LOCAL ROLE service_role;SELECT public.'+name+'('+args.map(q).join(',')+');COMMIT;');
const commit=args=>{if(beforeCommit){const hook=beforeCommit;beforeCommit=null;hook();}writeCalls++;return svc('busy_connected_website_commit_v1',Object.values(args));};
const direct=payload=>privateWebsiteDraftAction({action:'website_edit_page',body:payload,userId:actor,wholeSiteSourceCasReady,read:id=>rpc('busy_connected_builder_read_v1',[id]),commit,history:(id,revision,hash,direction)=>rpc('busy_connected_website_history_v1',[id,revision,hash,direction]),transition:args=>svc('busy_connected_website_transition_v1',Object.values(args))});
const request=async(action,payload={})=>{
 if(action==='builder_read')return rpc('busy_connected_builder_read_v1',[payload.businessId||B]);
 if(action.startsWith('website_')){
  const result=await privateWebsiteDraftAction({action,body:payload,userId:actor,wholeSiteSourceCasReady,read:id=>rpc('busy_connected_builder_read_v1',[id]),commit,history:(id,revision,hash,direction)=>rpc('busy_connected_website_history_v1',[id,revision,hash,direction]),transition:args=>svc('busy_connected_website_transition_v1',Object.values(args))});
  if(loseAck&&action==='website_edit_page')throw Error('Synthetic lost acknowledgement AFTER actual SQL commit');return result;
 }
 const route=connectedAccountRoutes[action];if(!route)throw Error('Unsupported original route '+action);return rpc(route[0],route[1].map(k=>payload[k]??(k==='businessId'?B:null)));
};
const stage=async(id,fn)=>{try{await fn();results.push({id,passed:true,exitCode:0});}catch(e){results.push({id,passed:false,error:String(e.stderr||e.stack).slice(-5000)});throw e;}};
const context=()=>({website:basis.websiteDraft,ownerId:O,businessId:B,profileRevision:basis.profileRevision,goal:'I run a landscaping business in Devon. I need a professional website.'});
const deps={pageEdit:applyWebsitePageChange,renderPage:renderWebsiteHtml};
const snapshots=d=>Object.fromEntries(d.pages.map(p=>[p.id,renderWebsiteHtml(d,p.id,{standalone:true})]));
const hashes=pages=>Object.fromEntries(Object.entries(pages).map(([k,v])=>[k,createHash('sha256').update(v).digest('hex')]));
const body=patch=>({businessId:B,expectedRevision:basis.revision,expectedDraft:basis.websiteDraft,ownerApproved:true,patch});
let originalModel,approvedPages,approvedHashes,review;
const profile={businessName:'Devon Fieldcraft',businessType:'Landscaping',tagline:'Gardens planned around the way you live.',description:'A fictional owner-approved landscaping business offering garden planning, maintenance and planting.',serviceArea:'Devon',services:[
 ['maintenance','Garden maintenance','We look at the areas of the garden you want to care for and discuss an appropriate maintenance scope.','Tell us about access, the garden condition and the tasks you want to prioritise before we discuss the next step.'],
 ['planting','Seasonal planting','We discuss the plants, colours and garden spaces you want to develop through the seasons.','Share the conditions and preferences you know so a planting conversation can begin with useful information.'],
 ['planning','Garden planning','We help you describe how you want to use the space and the practical changes you are considering.','An initial project conversation covers your priorities, existing features and the decisions still to be made.'],
 ['paths','Paths and outdoor layouts','Discuss the routes through your garden and the outdoor areas that would benefit from a clearer layout.','Tell us which parts of the garden need to connect and any access requirements before discussing a project scope.'],
 ['care','Plant care reviews','Bring the plant-care questions and garden observations you want to discuss in a focused review.','Recommendations require the actual conditions to be considered; this fictional description promises no outcome.']
].map(([id,name,a,b])=>({id,name,description:a+'\n\n'+b})),contact:{email:'hello@devon-fieldcraft.example.invalid'}};
try{
 await stage('guarded-local-pg17-original-fresh-authorities-only',()=>{
  assert.ok(socket.startsWith('/')&&data.startsWith('/'));assert.equal(sql('SHOW listen_addresses','postgres'),'');assert.equal(sql('SHOW data_directory','postgres'),data);const v=Number(sql('SHOW server_version_num','postgres'));assert.ok(v>=170000&&v<180000);
  sql('DROP DATABASE IF EXISTS '+db,'postgres');sql('CREATE DATABASE '+db,'postgres');
  sql("CREATE SCHEMA auth;CREATE TABLE auth.users(id uuid PRIMARY KEY);CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;GRANT USAGE ON SCHEMA auth TO authenticated;INSERT INTO auth.users VALUES("+q(O)+'),('+q(P)+');');
  const p=wholeAppStagingPackage(process.cwd());assert.throws(()=>sql(p.sql));sql(p.sql.replace(/^DO \$\$ BEGIN RAISE EXCEPTION 'WHOLE APP STAGING REVIEW FUSE:.*?\n/m,''));
  sql('INSERT INTO public.busy_businesses(id,name,created_by)VALUES('+[B,profile.businessName,O].map(q).join(',')+'),('+[F,'Foreign fictional business',P].map(q).join(',')+');INSERT INTO public.busy_business_memberships(business_id,user_id,role)VALUES('+[B,O,'owner'].map(q).join(',')+'),('+[F,P,'owner'].map(q).join(',')+');');
  rpc('busy_connected_initialize_v1',[B]);
 });
 await stage('separate-profile-cas-proposal-fuse-definition-and-acl-preservation',()=>{
  const source=readFileSync('docs/sql-proposals/mission16-website-profile-cas.sql','utf8');guardSha256=createHash('sha256').update(source).digest('hex');
  const metadata=()=>sql("SELECT jsonb_build_object('owner',proowner,'acl',proacl,'source',prosrc,'language',prolang,'securityDefiner',prosecdef,'config',proconfig) FROM pg_proc WHERE oid='public.busy_connected_website_commit_v1(uuid,uuid,bigint,jsonb,jsonb,bigint)'::regprocedure");
  const before=metadata();assert.throws(()=>sql(source));assert.equal(metadata(),before);
  const fuse=/^DO \$\$ BEGIN RAISE EXCEPTION 'MISSION16 WEBSITE PROFILE CAS REVIEW FUSE:[^\n]+\n/m;assert.equal((source.match(new RegExp(fuse.source,'gm'))||[]).length,1);
  sql(source.replace(fuse,''));const after=JSON.parse(metadata()),original=JSON.parse(before);assert.equal(after.owner,original.owner);assert.deepEqual(after.acl,original.acl);assert.deepEqual(after.config,original.config);assert.equal(after.securityDefiner,true);assert.match(after.source,/FOR SHARE/);assert.match(after.source,/siteComposition/);
  assert.equal(sql("SELECT has_function_privilege('service_role','public.busy_connected_website_commit_v1(uuid,uuid,bigint,jsonb,jsonb,bigint)','EXECUTE') AND NOT has_function_privilege('authenticated','public.busy_connected_website_commit_v1(uuid,uuid,bigint,jsonb,jsonb,bigint)','EXECUTE') AND NOT has_function_privilege('anon','public.busy_connected_website_commit_v1(uuid,uuid,bigint,jsonb,jsonb,bigint)','EXECUTE')"),'t');
  const installed=metadata();assert.throws(()=>sql(source.replace(fuse,'')));assert.equal(metadata(),installed,'The proposal must not silently overwrite a changed wrapper');
  // Trusted synthetic bootstrap only AFTER independently checking the actual SQL.
  // The unchanged public gateway has no client property that can set this flag.
  wholeSiteSourceCasReady=true;
 });
 await stage('original-approved-profile-and-website-create-independent-readback',async()=>{
  session=createConnectedBuilderSession({request});basis=await session.open(B);const r=await session.profile({basis,profile,ownerApproved:true});assert.equal(r.ok,true);basis=r.observed;const created=await session.website({basis,action:'create',sourceRevision:basis.profileRevision,ownerApproved:true});assert.equal(created.ok,true,created.reason);basis=created.observed;
  assert.deepEqual((await createConnectedBuilderSession({request}).open(B)).profile,profile);assert.equal(basis.websiteDraft.pages.length,3);
 });
 await stage('owner-authored-source-pages-preserved-for-ten-page-scope',async()=>{
  // These two pages are explicitly supplied fixture copy, not model-generated facts.
  for(const [title,copy] of [['Working together','We begin with the priorities you bring to the conversation. Existing garden information and practical requirements help define the next step.'],['Planning your garden','Tell us how you use your outdoor space and what you want to change. We can then discuss which service information is relevant.']]){
   const r=await session.website({basis,action:'edit_page',ownerApproved:true,patch:{action:'create-page',title,body:copy}});assert.equal(r.ok,true,r.reason);basis=r.observed;
  }
  originalModel=basis.websiteDraft;assert.equal(originalModel.pages.length,5);
 });
 await stage('whole-site-source-plan-original-transaction-and-exact-fresh-reopen',async()=>{
  review=prepareWholeWebsite(context(),deps);assert.equal(review.ok,true,review.reason);assert.equal(review.candidate.pages.length,10);assert.equal(review.operation.serviceIds.length,5);assert.equal(review.candidate.sitePresentation,'purposeful-v1');
  const before=writeCalls;const kept=await keepWholeWebsite(review,{getContext:context,apply:async patch=>{const r=await session.website({basis,action:'edit_page',patch,ownerApproved:true});if(!r.ok)return {applied:false,reason:r.reason};basis=r.observed;return {applied:true,verifiedPrivateReadback:{ownerId:basis.actorId,businessId:basis.businessId,websiteDraft:basis.websiteDraft,recordHash:r.receipt.recordHash}};}});
  assert.equal(kept.ok,true,kept.reason);assert.equal(kept.accountSaved,true);assert.equal(writeCalls,before+1);assert.equal(basis.websiteDraft.generation,originalModel.generation+1);assert.equal(basis.websiteUndoCount,3);
  const fresh=await createConnectedBuilderSession({request}).open(B);assert.equal(websiteRequestContent(fresh.websiteDraft),websiteRequestContent(review.candidate));assert.deepEqual(fresh.websiteDraft.customPages.slice(0,2),originalModel.customPages);approvedPages=snapshots(fresh.websiteDraft);approvedHashes=hashes(approvedPages);assert.equal(Object.keys(approvedPages).length,10);assert.equal(fresh.websiteDraft.sitePresentation,'purposeful-v1');
  const duplicate=await keepWholeWebsite(review,{getContext:context,apply:()=>{throw Error('Must not replay');}});assert.equal(duplicate.ok,false);assert.equal(writeCalls,before+1);
 });
 await stage('single-original-studio-undo-redo-restores-all-page-html',async()=>{
  const fresh=createConnectedBuilderSession({request});let now=await fresh.open(B);const undo=await fresh.website({basis:now,action:'undo',ownerApproved:true});assert.equal(undo.ok,true,undo.reason);assert.equal(websiteRequestContent(undo.observed.websiteDraft),websiteRequestContent(originalModel));assert.equal(undo.observed.websiteDraft.pages.length,5);assert.equal(undo.observed.websiteDraft.sitePresentation,undefined);
  const redo=await fresh.website({basis:undo.observed,action:'redo',ownerApproved:true});assert.equal(redo.ok,true,redo.reason);assert.deepEqual(hashes(snapshots(redo.observed.websiteDraft)),approvedHashes);basis=await session.open(B);
 });
 await stage('foreign-revoked-stale-generation-invalid-service-and-operation-denials',async()=>{
  const before=writeCalls,good={action:'refine-site-pages',direction:'mobile',expectedWebsiteId:basis.websiteDraft.id,expectedGeneration:basis.websiteDraft.generation,expectedBusinessId:B,expectedProfileRevision:basis.profileRevision};
  for(const patch of [{...good,expectedBusinessId:F},{...good,expectedGeneration:good.expectedGeneration-1},{...good,script:'publish now'},{...good,sitePresentation:'unreviewed-client-override'},{action:'compose-service-pages',serviceIds:['foreign-service'],expectedWebsiteId:good.expectedWebsiteId,expectedGeneration:good.expectedGeneration,expectedBusinessId:B,expectedProfileRevision:basis.profileRevision}])await assert.rejects(()=>direct(body(patch)));
  await assert.rejects(()=>direct({...body(good),ownerApproved:false}));await assert.rejects(()=>direct({...body(good),expectedRevision:basis.revision-1}));
  actor=P;await assert.rejects(()=>direct(body(good)));actor=O;
  sql('DELETE FROM public.busy_business_memberships WHERE business_id='+q(B)+' AND user_id='+q(O));await assert.rejects(()=>direct(body(good)));sql('INSERT INTO public.busy_business_memberships(business_id,user_id,role)VALUES('+[B,O,'owner'].map(q).join(',')+');');
  assert.equal(writeCalls,before);assert.deepEqual(hashes(snapshots((await session.read()).websiteDraft)),approvedHashes);
 });
 await stage('owner-wording-and-profile-revision-preserved-or-re-reviewed',async()=>{
  const target=basis.websiteDraft.customPages.find(p=>p.sourceServiceId==='maintenance').sectionIds[0],words='My exact owner correction stays on this garden maintenance page.';
  let r=await session.website({basis,action:'edit_text',patch:{sectionId:target,field:'body',value:words},ownerApproved:true});assert.equal(r.ok,true,r.reason);basis=r.observed;
  const stale=prepareWholeWebsiteRefinement(context(),'Make the service pages more interesting',deps);assert.equal(stale.ok,true,stale.reason);
  r=await session.profile({basis,profile:{...profile,tagline:'A newly approved fictional headline'},ownerApproved:true});assert.equal(r.ok,true);basis=r.observed;
  const before=writeCalls;const blocked=await keepWholeWebsite(stale,{getContext:context,apply:()=>{throw Error('Stale review cannot write');}});assert.equal(blocked.ok,false);assert.equal(writeCalls,before);
  await assert.rejects(()=>direct(body(stale.operation)));assert.equal(writeCalls,before,'The original gateway must independently deny the old reviewed profile revision');
  const current=prepareWholeWebsiteRefinement(context(),'Make the service pages more interesting',deps);assert.equal(current.ok,true,current.reason);const saved=await session.website({basis,action:'edit_page',patch:current.operation,ownerApproved:true});assert.equal(saved.ok,true,saved.reason);basis=saved.observed;assert.equal(basis.websiteDraft.sections.find(s=>s.id===target).body,words);
 });
 await stage('actual-profile-write-after-gateway-read-denies-atomic-commit-and-replay',async()=>{
  const reviewed=prepareWholeWebsiteRefinement(context(),'Make the website feel more premium',deps);assert.equal(reviewed.ok,true,reviewed.reason);
  const snapshot=()=>sql('SELECT jsonb_build_object(\'revision\',revision,\'payload\',payload) FROM public.busy_business_snapshots WHERE business_id='+q(B));
  const original=snapshot(),revision=basis.profileRevision,before=writeCalls;
  // Executes a genuine authenticated original profile RPC after the gateway's
  // approved-source read but immediately before its original service-only commit.
  beforeCommit=()=>{const receipt=rpc('busy_connected_profile_write_v1',[B,revision,basis.profile,{...basis.profile,tagline:'A real concurrent synthetic profile correction.'},true]);assert.equal(receipt.profileRevision,revision+1);};
  const denied=await keepWholeWebsite(reviewed,{getContext:context,apply:async patch=>{const saved=await session.website({basis,action:'edit_page',patch,ownerApproved:true});return {applied:saved.ok};}});
  assert.equal(denied.ok,false);assert.equal(denied.unknown,true);assert.equal(denied.mayReplay,false);assert.equal(writeCalls,before+1);assert.equal(snapshot(),original,'A stale profile must change neither website, workspace revision nor history');assert.equal(session.uncertain,true);
  const again=await keepWholeWebsite(reviewed,{getContext:context,apply:()=>{throw Error('No stale write replay');}});assert.equal(again.ok,false);assert.equal(writeCalls,before+1);
  await assert.rejects(()=>session.website({basis,action:'edit_page',patch:reviewed.operation,ownerApproved:true}));assert.equal(writeCalls,before+1);
  session=createConnectedBuilderSession({request});basis=await session.open(B);assert.equal(basis.profileRevision,revision+1);
  const fresh=prepareWholeWebsiteRefinement(context(),'Make the website feel more premium',deps);assert.equal(fresh.ok,true,fresh.reason);const saved=await session.website({basis,action:'edit_page',patch:fresh.operation,ownerApproved:true});assert.equal(saved.ok,true,saved.reason);basis=saved.observed;assert.equal(websiteRequestContent(basis.websiteDraft),websiteRequestContent(fresh.candidate));
  const undo=await session.website({basis,action:'undo',ownerApproved:true});assert.equal(undo.ok,true,undo.reason);const redo=await session.website({basis:undo.observed,action:'redo',ownerApproved:true});assert.equal(redo.ok,true,redo.reason);assert.equal(websiteRequestContent(redo.observed.websiteDraft),websiteRequestContent(fresh.candidate));basis=redo.observed;
 });
 await stage('lost-acknowledgement-after-real-commit-is-not-replayed',async()=>{
  const r=prepareWholeWebsiteRefinement(context(),'Make the mobile layout easier to use',deps);assert.equal(r.ok,true,r.reason);const before=writeCalls;loseAck=true;
  const unknown=await keepWholeWebsite(r,{getContext:context,apply:async patch=>{const saved=await session.website({basis,action:'edit_page',patch,ownerApproved:true});return {applied:saved.ok};}});assert.equal(unknown.ok,false);assert.equal(unknown.unknown,true);assert.equal(unknown.mayReplay,false);assert.equal(writeCalls,before+1);assert.equal(session.uncertain,true);
  const again=await keepWholeWebsite(r,{getContext:context,apply:()=>{throw Error('Must not replay uncertain operation');}});assert.equal(again.ok,false);assert.equal(writeCalls,before+1);
  await assert.rejects(()=>session.website({basis,action:'edit_page',patch:r.operation,ownerApproved:true}));assert.equal(writeCalls,before+1);loseAck=false;
  const observed=await createConnectedBuilderSession({request}).open(B);assert.equal(websiteRequestContent(observed.websiteDraft),websiteRequestContent(r.candidate));assert.equal(observed.websiteDraft.pages.length,10);basis=observed;
 });
 await stage('mission17-reviewed-legacy-upgrade-keeps-words-through-real-save-reopen-undo-redo',async()=>{
  // Explicit historical-model fixture only: the original service writer seeds
  // the same owner-reviewed site without the later presentation marker. This
  // is not a fabricated UI approval or evidence of a hosted legacy migration.
  session=createConnectedBuilderSession({request});basis=await session.open(B);
  const current=basis.websiteDraft,legacy=JSON.parse(JSON.stringify(current));delete legacy.sitePresentation;delete legacy.html;legacy.generation=current.generation+1;
  const seed=svc('busy_connected_website_commit_v1',[B,O,basis.revision,current,legacy,basis.profileRevision]);assert.equal(seed.ok,true);basis=await session.open(B);assert.equal(basis.websiteDraft.sitePresentation,undefined);assert.equal(basis.websiteDraft.pages.length,10);
  const exactWords=JSON.stringify(basis.websiteDraft.sections.map(s=>[s.id,s.title,s.body,s.items,s.asset])),exactPages=JSON.stringify(basis.websiteDraft.customPages),legacyHtml=hashes(snapshots(basis.websiteDraft));
  const patch={action:'refine-site-pages',direction:'purposeful',expectedWebsiteId:basis.websiteDraft.id,expectedGeneration:basis.websiteDraft.generation,expectedBusinessId:B,expectedProfileRevision:basis.profileRevision};
  const preview=applyWebsitePageChange(basis.websiteDraft,patch);assert.equal(preview.applied,true,preview.reason);assert.equal(preview.draft.sitePresentation,'purposeful-v1');
  const before=writeCalls,saved=await session.website({basis,action:'edit_page',patch,ownerApproved:true});assert.equal(saved.ok,true,saved.reason);assert.equal(writeCalls,before+1);basis=saved.observed;
  assert.equal(basis.websiteDraft.sitePresentation,'purposeful-v1');assert.equal(JSON.stringify(basis.websiteDraft.sections.map(s=>[s.id,s.title,s.body,s.items,s.asset])),exactWords);assert.equal(JSON.stringify(basis.websiteDraft.customPages),exactPages);
  const expected=hashes(snapshots(preview.draft)),fresh=createConnectedBuilderSession({request});let observed=await fresh.open(B);assert.deepEqual(hashes(snapshots(observed.websiteDraft)),expected);assert.equal(observed.websiteDraft.sitePresentation,'purposeful-v1');
  const undo=await fresh.website({basis:observed,action:'undo',ownerApproved:true});assert.equal(undo.ok,true,undo.reason);assert.equal(undo.observed.websiteDraft.sitePresentation,undefined);assert.deepEqual(hashes(snapshots(undo.observed.websiteDraft)),legacyHtml);
  const redo=await fresh.website({basis:undo.observed,action:'redo',ownerApproved:true});assert.equal(redo.ok,true,redo.reason);assert.equal(redo.observed.websiteDraft.sitePresentation,'purposeful-v1');assert.deepEqual(hashes(snapshots(redo.observed.websiteDraft)),expected);basis=await session.open(B);
 });
 await stage('mission18-creative-specification-original-private-authority-save-reopen-undo-redo-and-denials',async()=>{
  session=createConnectedBuilderSession({request});basis=await session.open(B);
  const beforeModel=basis.websiteDraft,beforeHashes=hashes(snapshots(beforeModel)),sourceWords=JSON.stringify(beforeModel.sections),oldGeneration=beforeModel.generation;
  const creative=prepareWholeWebsiteRefinement(context(),'Keep my words but redesign the website',deps);assert.equal(creative.ok,true,creative.reason);assert.equal(creative.operation.action,'apply-site-creative-specification');
  const expected=hashes(snapshots(creative.candidate)),calls=writeCalls;
  wholeSiteSourceCasReady=false;await assert.rejects(()=>direct(body(creative.operation)));wholeSiteSourceCasReady=true;
  for(const patch of [{...creative.operation,expectedBusinessId:F},{...creative.operation,expectedProfileRevision:basis.profileRevision-1},{...creative.operation,publish:true},{...creative.operation,specification:{...creative.operation.specification,script:'untrusted'}}])await assert.rejects(()=>direct(body(patch)));
  await assert.rejects(()=>direct({...body(creative.operation),ownerApproved:false}));assert.equal(writeCalls,calls);
  const kept=await keepWholeWebsite(creative,{getContext:context,apply:async patch=>{const result=await session.website({basis,action:'edit_page',patch,ownerApproved:true});assert.equal(result.ok,true,result.reason);basis=result.observed;return {applied:true,verifiedPrivateReadback:{ownerId:basis.actorId,businessId:basis.businessId,recordHash:result.receipt.recordHash,websiteDraft:basis.websiteDraft}};}});
  assert.equal(kept.ok,true,kept.reason);assert.equal(kept.accountSaved,true);assert.equal(writeCalls,calls+1);assert.equal(basis.websiteDraft.generation,oldGeneration+1);assert.equal(JSON.stringify(basis.websiteDraft.sections),sourceWords);
  const fresh=createConnectedBuilderSession({request});const observed=await fresh.open(B);assert.deepEqual(hashes(snapshots(observed.websiteDraft)),expected);assert.deepEqual(observed.websiteDraft.creativeSpecification,creative.candidate.creativeSpecification);
  assert.equal((await keepWholeWebsite(creative,{getContext:context,apply:()=>{throw Error('Never replay accepted creative specification');}})).ok,false);assert.equal(writeCalls,calls+1);
  const undo=await fresh.website({basis:observed,action:'undo',ownerApproved:true});assert.equal(undo.ok,true,undo.reason);assert.deepEqual(hashes(snapshots(undo.observed.websiteDraft)),beforeHashes);assert.equal(undo.observed.websiteDraft.creativeSpecification,undefined);
  const redo=await fresh.website({basis:undo.observed,action:'redo',ownerApproved:true});assert.equal(redo.ok,true,redo.reason);assert.deepEqual(hashes(snapshots(redo.observed.websiteDraft)),expected);assert.equal(JSON.stringify(redo.observed.websiteDraft.sections),sourceWords);basis=await session.open(B);
 });
 await stage('no-publication-provider-financial-or-foreign-record-mutation',()=>{
  assert.equal(sql('SELECT count(*) FROM public.busy_website_deployments'),'0');assert.equal(sql('SELECT count(*) FROM public.busy_websites'),'0');assert.equal(sql('SELECT count(*) FROM public.busy_mini_app_requests'),'0');assert.equal(sql('SELECT count(*) FROM public.business_work_quote_references'),'0');assert.equal(sql('SELECT count(*) FROM public.busy_business_snapshots WHERE business_id='+q(F)),'0');
 });
}finally{
 mkdirSync('.test-artifacts/mission16-whole-site',{recursive:true});const report={database:db,hosted:false,syntheticDataOnly:true,authShimNotHostedAuth:true,aiLabArtifactUsed:false,separateProfileCasProposalSha256:guardSha256,separateSqlAndBootstrapApprovalRequired:true,providerCalls:0,paidUsage:0,websitePublished:false,explicitOwnerFixturePages:2,sourceDerivedServicePages:5,results,summary:{passed:results.filter(r=>r.passed).length,failed:results.filter(r=>!r.passed).length},finalPageCount:basis?.websiteDraft?.pages?.length||0,presentationVersion:basis?.websiteDraft?.sitePresentation??null,mission17LegacyFixture:'One explicit historical model seeded through the original service-only writer; subsequent upgrade uses the original authenticated private gateway and real transactional readback/history',approvedPageHtmlHashes:approvedHashes||null};writeFileSync('.test-artifacts/mission16-whole-site/postgres.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
}
