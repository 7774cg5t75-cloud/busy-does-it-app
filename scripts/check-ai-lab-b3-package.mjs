import assert from 'node:assert/strict';
import {mkdtempSync,readFileSync,lstatSync,writeFileSync,mkdirSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {b3CodeFiles,prepareB3Manifest,pendingB3Approval,validateB3Execution,b3Digest,B3_REPOSITORY,B3_REF,B3_WORKFLOW,B3_MANIFEST_VERSION,B3_APPROVAL_VERSION,B3_MARKER_VERSION,B3_DATABASE_REQUIREMENTS} from './lib/ai-lab-b3-package.mjs';
import {prepareB3Packet} from './prepare-ai-lab-b3.mjs';
import {runApprovedB3Job,b3FailedReceipt} from './run-ai-lab-b3.mjs';
const root=process.cwd(),clone=x=>JSON.parse(JSON.stringify(x)),now=Date.parse('2026-11-07T12:00:00Z');
const b2={projectId:'sbvkrvksnruiclcvclbd',organizationId:'wrjfgasxtlznzfzmfrif',region:'eu-west-1',ownerId:'b3000000-0000-4000-8000-000000000001',businessId:'b3000000-0000-4000-8000-000000000002',ownerEmail:'quiet-light-owner@busy-ai-lab.invalid',businessName:'Quiet Light Studio',b2Version:'20261107000304',b2Name:'ai_lab_quiet_light_owner_setup_v1',b2StatementSha256:'865e2acdb036691a0e907bcdfbc0737b5bb403005880cd9c218ceafc047e77bc',evidenceSha256:'1'.repeat(64)};
// Fictional receipt metadata tests the contract, never claims a hosted install.
const sourceContract={...B3_DATABASE_REQUIREMENTS,migrationVersion:'20261107120000',verificationSha256:b2.evidenceSha256};
const verifiedSource={verifiedB2:b2,verifiedSourceContract:sourceContract};
const manifest=prepareB3Manifest({root,...verifiedSource,sourceCommit:'a'.repeat(40),sourceTree:'b'.repeat(40),createdAt:new Date(now).toISOString(),executionId:'b3000000-0000-4000-8000-000000000003',requestNonce:'b3000000-0000-4000-8000-000000000004'});
const approval={...pendingB3Approval(manifest),status:'owner-approved',runId:'1234567',eventSha:'c'.repeat(40),actor:'fictional-owner',expiresAt:new Date(now+30*60*1000).toISOString(),environmentProtectionIndependentlyReviewed:true,standardRunnerZeroCostConfirmed:true};
const environment={GITHUB_ACTIONS:'true',GITHUB_EVENT_NAME:'push',GITHUB_REPOSITORY:B3_REPOSITORY,GITHUB_REF:B3_REF,GITHUB_RUN_ATTEMPT:'1',GITHUB_RUN_ID:approval.runId,GITHUB_SHA:approval.eventSha,GITHUB_ACTOR:approval.actor,GITHUB_WORKFLOW_REF:B3_REPOSITORY+'/'+B3_WORKFLOW+'@'+B3_REF};
const marker={version:B3_MARKER_VERSION,manifestDigest:approval.manifestDigest,executionId:approval.executionId};
const validate=(changes={})=>validateB3Execution({root,manifest,approval,environment,marker,now,...changes});
const results=[];async function test(name,fn){try{await fn();results.push({name,passed:true});console.log('PASS '+name);}catch(e){results.push({name,passed:false});throw e;}}
try{
 await test('private prepared packet does not authorise a job',()=>{assert.equal(manifest.status,'prepared-not-authorized');assert.equal(pendingB3Approval(manifest).status,'not-authorized');assert.throws(()=>validate({approval:pendingB3Approval(manifest)}));});
 await test('exact separately approved synthetic job projects one scoped runtime gate',()=>{const g=validate();assert.equal(g.ownerId,b2.ownerId);assert.equal(g.businessId,b2.businessId);assert.equal(g.approval.manifestDigest,b3Digest(manifest));assert.equal(g.projectId,b2.projectId);});
 await test('v2 source contract rejects every historical packet version before credentials or intent',async()=>{
  assert.equal(manifest.version,'busy.ai-lab-b3-manifest.v2');assert.equal(approval.version,'busy.ai-lab-b3-owner-approval.v2');assert.equal(marker.version,'busy.ai-lab-b3-execution-request.v2');assert.equal(validate().version,'busy.ai-lab-b3-runtime.v2');
  for(const part of ['manifest','approval','marker']){
   const values={manifest:clone(manifest),approval:clone(approval),marker:clone(marker)};
   values[part].version=values[part].version.replace(/v2$/,'v1');
   if(part==='manifest'){values.approval.manifestDigest=b3Digest(values.manifest);values.marker.manifestDigest=b3Digest(values.manifest);}
   let calls=0;const blocked=()=>{calls++;throw Error('must-not-read-credentials');};
   const r=await runApprovedB3Job({root,...values,environment,now:()=>now,fetchImpl:blocked,credentialReader:blocked,ownerPasswordReader:blocked,claimIntent:blocked,writeSafeReceipt:()=>{}});
   assert.equal(r.ok,false);assert.equal(calls,0);assert.equal(r.mayReplay,false);
  }
 });
 await test('immutable source includes complete story services and three purposeful pages',()=>{assert.deepEqual(manifest.sourcePlan.pageIds,['home','services','contact']);assert.equal(manifest.sourcePlan.profile.services.length,3);assert.ok(manifest.sourcePlan.story.body.includes('\n\n'));assert.equal(manifest.sourcePlan.action.wording,'Discuss your project');assert.equal(manifest.sourcePlan.operations.length,6);});
 await test('complete reviewed import closure pins original authorities and workflow',()=>{const f=b3CodeFiles(root);for(const p of ['scripts/run-ai-lab-b3.mjs','scripts/lib/ai-lab-b3-runtime.mjs','scripts/lib/ai-lab-b3-source.mjs','src/staging/connectedBuilderSession.mjs','supabase/functions/busy-website-publish/privateDraftService.mjs','src/domain/websiteBuilder.js',B3_WORKFLOW])assert.match(f[p],/^[0-9a-f]{64}$/);assert.ok(Object.keys(f).length>=30);});
 await test('foreign project organization region native owner or original B2 receipt denied',()=>{for(const patch of [{projectId:'pnjdlogwegnqbsfpcofw'},{organizationId:'foreign'},{region:'eu-west-2'},{ownerEmail:'foreign@example.invalid'},{b2Version:'20261106221950'},{b2StatementSha256:'0'.repeat(64)},{extra:'credential'}])assert.throws(()=>prepareB3Manifest({root,verifiedB2:{...b2,...patch},verifiedSourceContract:sourceContract,sourceCommit:'a'.repeat(40),sourceTree:'b'.repeat(40)}));});
 await test('B2 alone cannot prepare or authorise the new source contract',async()=>{
  const prepare=value=>prepareB3Manifest({root,verifiedB2:b2,verifiedSourceContract:value,sourceCommit:'a'.repeat(40),sourceTree:'b'.repeat(40)});
  for(const value of [undefined,{},...['migrationName','executionSha256','sourceStateBodySha256','revisedFunctionsSha256','verificationSha256','migrationVersion'].map(key=>({...sourceContract,[key]:'wrong'}))])assert.throws(()=>prepare(value));
  assert.deepEqual(manifest.databaseContract,sourceContract);
  for(const patch of [{executionSha256:'0'.repeat(64)},{sourceStateVersion:'old'},{migrationVersion:null},{verificationSha256:'2'.repeat(64)}]){
   const m=clone(manifest);Object.assign(m.databaseContract,patch);const digest=b3Digest(m);let calls=0;
   const blocked=()=>{calls++;throw Error('no credential access');};
   const r=await runApprovedB3Job({root,manifest:m,approval:{...approval,manifestDigest:digest},marker:{...marker,manifestDigest:digest},environment,now:()=>now,fetchImpl:blocked,credentialReader:blocked,ownerPasswordReader:blocked,claimIntent:blocked,writeSafeReceipt:()=>{}});
   assert.equal(r.ok,false);assert.equal(calls,0);
  }
 });
 await test('source facts owner identity limits and code cannot drift after review',()=>{for(const change of [m=>m.sourcePlan.profile.businessName='Invented',m=>m.binding.ownerId=b2.businessId,m=>m.limits.sourceWrites=7,m=>m.code.files['scripts/run-ai-lab-b3.mjs']='0'.repeat(64),m=>m.execution.ref='main']){const m=clone(manifest);change(m);assert.throws(()=>validate({manifest:m}));}});
 await test('wrong digest nonce count and unsupported approval fields denied',()=>{for(const patch of [{manifestDigest:'0'.repeat(64)},{requestNonce:manifest.binding.executionId},{maxExecutionCount:2},{tools:true},{status:'fixture'}])assert.throws(()=>validate({approval:{...approval,...patch}}));});
 await test('expired and unbounded approval never dispatches',()=>{for(const expiry of [new Date(now-1).toISOString(),new Date(now+61*60*1000).toISOString(),null,'invalid'])assert.throws(()=>validate({approval:{...approval,expiresAt:expiry}}));});
 await test('actual protected runtime and zero additional runner cost are prerequisite evidence',()=>{for(const field of ['environmentProtectionIndependentlyReviewed','standardRunnerZeroCostConfirmed'])assert.throws(()=>validate({approval:{...approval,[field]:false}}));});
 await test('re-run fresh run wrong actor branch event and workflow refused',()=>{for(const patch of [{GITHUB_RUN_ATTEMPT:'2'},{GITHUB_RUN_ID:'99999'},{GITHUB_ACTOR:'foreign'},{GITHUB_REF:'refs/heads/main'},{GITHUB_EVENT_NAME:'pull_request'},{GITHUB_WORKFLOW_REF:'foreign'},{GITHUB_ACTIONS:'false'},{GITHUB_SHA:'d'.repeat(40)}])assert.throws(()=>validate({environment:{...environment,...patch}}));});
 await test('marker carries no executable or discretionary source data',()=>{for(const patch of [{manifestDigest:'0'.repeat(64)},{executionId:manifest.binding.requestNonce},{command:'execute'},{version:'real-model-output'}])assert.throws(()=>validate({marker:{...marker,...patch}}));});
 await test('failed authority cannot read credentials call native Auth or claim an intent',async()=>{let calls=0;const fail=()=>{calls++;throw Error('synthetic-private-value');};const r=await runApprovedB3Job({root,manifest,approval:pendingB3Approval(manifest),environment,marker,now:()=>now,fetchImpl:fail,credentialReader:fail,ownerPasswordReader:fail,claimIntent:fail,writeSafeReceipt:()=>{}});assert.equal(r.ok,false);assert.equal(calls,0);assert.ok(!JSON.stringify(r).includes('synthetic-private-value'));});
 await test('lost final receipt cannot relabel confirmed or uncertain source writes as a clean denial',()=>{for(const status of ['source-prepared','unknown-outcome','stopped-partial']){const r=b3FailedReceipt({safe:{status,sourceWritesAttempted:6},intentAttempted:true,sourceOutcome:status,native:{permitAttempted:true,counts:{authSignIns:1}}});assert.notEqual(r.status,'denied');assert.equal(r.sourceOutcome,status);assert.equal(r.requiresIndependentInspection,true);assert.equal(r.ok,false);assert.equal(r.sourceWritesAttempted,6);}assert.equal(b3FailedReceipt({safe:{},intentAttempted:false}).status,'denied');});
 await test('actual preparation entry writes exclusive private non-executable packets',()=>{const dir=mkdtempSync(join(tmpdir(),'busy-b3-package-'));try{const f=join(dir,'source.json');writeFileSync(f,JSON.stringify(verifiedSource));const out=join(dir,'private');const args=['--verified-source',f,'--source-commit','a'.repeat(40),'--source-tree','b'.repeat(40),'--new-private-output',out];const r=prepareB3Packet({root,args});assert.equal(r.hostedExecution,false);assert.equal(lstatSync(out).mode&0o777,0o700);for(const n of ['manifest.json','PENDING-approval.json','NOT-AUTHORIZED-request-marker.json'])assert.equal(lstatSync(join(out,n)).mode&0o777,0o600);assert.equal(JSON.parse(readFileSync(join(out,'PENDING-approval.json'))).status,'not-authorized');assert.throws(()=>prepareB3Packet({root,args}));writeFileSync(f,JSON.stringify(b2));assert.throws(()=>prepareB3Packet({root,args:[...args.slice(0,7),join(dir,'legacy-refused')]}));}finally{rmSync(dir,{recursive:true,force:true});}});
 await test('no execution option credentials or public-repository packet destination accepted',()=>{assert.throws(()=>prepareB3Packet({root,args:['--execute']}));const dir=mkdtempSync(join(tmpdir(),'busy-b3-public-denial-'));try{const f=join(dir,'source.json');writeFileSync(f,JSON.stringify(verifiedSource));assert.throws(()=>prepareB3Packet({root,args:['--verified-source',f,'--source-commit','a'.repeat(40),'--source-tree','b'.repeat(40),'--new-private-output',join(root,'must-not-create-b3-private')]}));}finally{rmSync(dir,{recursive:true,force:true});}});
 await test('one-purpose workflow remains marker-only with protected review and v2 gates before credentials',()=>{const w=readFileSync(B3_WORKFLOW,'utf8');assert.match(w,/paths: \['\.github\/ai-lab-b3-execution-request\.json'\]/);assert.match(w,/environment: busy-ai-lab-b3-source/);assert.match(w,/cancel-in-progress: false/);assert.match(w,/github.run_attempt == 1/);assert.match(w,/persist-credentials: false/);assert.match(w,/Verify reviewed code before making Lab credentials available/);assert.ok(w.indexOf('PRIVATE_MANIFEST:')<w.indexOf('BUSY_AI_LAB_B3_OWNER_PASSWORD:'));for(const version of [B3_MANIFEST_VERSION,B3_APPROVAL_VERSION,B3_MARKER_VERSION])assert.ok(w.includes(version));assert.match(w,/now<expiry<=now\+datetime.timedelta\(hours=1\)/);assert.doesNotMatch(w,/pull_request:|workflow_dispatch:|BUSY_OPENAI|SUPABASE_SERVICE_ROLE_KEY|npx|npm install/);});
 await test('actual Python pre-secret gate accepts only reviewed v2 files and the exact bounded synthetic run',()=>{
  const workflow=readFileSync(B3_WORKFLOW,'utf8').split('name: Verify reviewed code before making Lab credentials available')[1];
  const match=workflow.match(/python3 - <<'PY'\n([\s\S]*?)\n          PY/);assert.ok(match);
  const python=match[1].split('\n').map(line=>line.replace(/^          /,'')).join('\n');
  const dir=mkdtempSync(join(tmpdir(),'busy-b3-python-gate-'));
  try{
   for(const file of Object.keys(manifest.code.files)){const dest=join(dir,file);mkdirSync(join(dest,'..'),{recursive:true});writeFileSync(dest,readFileSync(join(root,file)));}
   const packet=clone(approval);packet.expiresAt=new Date(Date.now()+30*60*1000).toISOString();
   const run=(m=manifest,a=packet,k=marker,e={})=>{
    writeFileSync(join(dir,'.github/ai-lab-b3-execution-request.json'),JSON.stringify(k));
    return spawnSync('python3',['-c',python],{cwd:dir,encoding:'utf8',env:{...process.env,...environment,...e,PRIVATE_MANIFEST:JSON.stringify(m),PRIVATE_APPROVAL:JSON.stringify(a)}});
   };
   const good=run();assert.equal(good.status,0,good.stderr);
   const oldManifest={...clone(manifest),version:'busy.ai-lab-b3-manifest.v1'},oldDigest=b3Digest(oldManifest);
   const bad=[run(oldManifest,{...packet,manifestDigest:oldDigest},{...marker,manifestDigest:oldDigest}),run(manifest,{...packet,version:'busy.ai-lab-b3-owner-approval.v1'}),run(manifest,packet,{...marker,version:'busy.ai-lab-b3-execution-request.v1'}),run(manifest,{...packet,maxExecutionCount:2}),run(manifest,{...packet,expiresAt:new Date(Date.now()+61*60*1000).toISOString()}),run(manifest,packet,marker,{GITHUB_ACTOR:'wrong-actor'})];
   for(const patch of [{executionSha256:'0'.repeat(64)},{verificationSha256:'2'.repeat(64)}]){const m=clone(manifest);Object.assign(m.databaseContract,patch);const digest=b3Digest(m);bad.push(run(m,{...packet,manifestDigest:digest},{...marker,manifestDigest:digest}));}
   writeFileSync(join(dir,'scripts/run-ai-lab-b3.mjs'),'// altered reviewed code\n');bad.push(run());
   for(const result of bad){assert.notEqual(result.status,0);assert.match(result.stderr,/B3 pre-secret validation refused; no private values logged/);}
  }finally{rmSync(dir,{recursive:true,force:true});}
 });
 await test('runtime execution code exposes no CLI source override public gateway or raw response logging',()=>{const s=readFileSync('scripts/run-ai-lab-b3.mjs','utf8');assert.ok(!s.includes('console.error(error'));assert.ok(!s.includes('console.log(env'));assert.ok(!s.includes('Deno.serve'));assert.ok(!s.includes('createServer'));assert.match(s,/mayReplay:false/);assert.match(s,/O_EXCL/);});
}finally{
 const receipt={version:1,kind:'synthetic-B3-package-job-boundary',hosted:false,credentials:'synthetic only',providerCalls:0,spendingGbp:0,results,summary:{passed:results.filter(x=>x.passed).length,failed:results.filter(x=>!x.passed).length}};mkdirSync('.test-artifacts/ai-lab-b3',{recursive:true});writeFileSync('.test-artifacts/ai-lab-b3/package.json',JSON.stringify(receipt,null,2)+'\n');console.log(JSON.stringify(receipt.summary));
}
