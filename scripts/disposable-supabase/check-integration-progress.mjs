// Offline diagnostics tests. Child fetch is entirely replaced by inert test responses.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {createProgress,safeFailure} from './integration-progress.mjs';
const here=path.dirname(fileURLToPath(import.meta.url)),root=path.resolve(here,'../..');
const temporary=fs.mkdtempSync(path.join(os.tmpdir(),'busy-integration-progress-'));
const canary='PRIVATE_TOKEN_PASSWORD_CUSTOMER_CANARY';
let checks=0;
try{
 const preload=path.join(temporary,'stub-fetch.mjs');
 fs.writeFileSync(preload,[
  "const mode=process.env.TEST_FAILURE;let created=0;",
  "globalThis.fetch=async(url,options={})=>{",
  "const pathname=new URL(url).pathname;",
  "const reply=(status,body)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json'}});",
  "if(mode==='fetch-rejected')throw Object.assign(new TypeError('CANARY'),{cause:{code:'ECONNREFUSED',message:'CANARY'}});",
  "if(pathname==='/auth/v1/admin/users'){created++;if(mode==='admin-error'||mode==='second-account-error'&&created===2)return reply(503,{error_code:'unexpected_failure',message:'CANARY',token:'CANARY'});return reply(200,{id:'user-'+created,email:'CANARY'});}",
  "if(pathname==='/auth/v1/token'){if(mode==='signin-error')return reply(400,{error_code:'invalid_credentials',message:'CANARY'});return reply(200,{access_token:'CANARY-token-'+created});}",
  "if(pathname==='/auth/v1/user'){const match=/token-([123])$/.exec(options.headers.Authorization);if(mode==='guard-error'||!match)return reply(401,{error_code:'bad_jwt',message:'CANARY'});return reply(200,{id:mode==='identity-assertion'?'different-user':'user-'+match[1]});}",
  "if(pathname==='/rest/v1/busy_businesses'&&mode==='fixture-error')return reply(403,{code:'42501',message:'CANARY'});",
  "throw Error('Unexpected inert request CANARY');};"
 ].join('\n').replaceAll('CANARY',canary));
 const scenarios=[
  ['admin-error','auth-create-a',503,'unexpected_failure','assertion'],
  ['signin-error','auth-signin-a',400,'invalid_credentials','assertion'],
  ['guard-error','auth-require-user-a',401,'bad_jwt','unclassified'],
  ['identity-assertion','auth-require-user-a',200,null,'assertion'],
  ['second-account-error','auth-create-b',503,'unexpected_failure','assertion'],
  ['fetch-rejected','auth-create-a',null,null,'local-connection'],
  ['fixture-error','business-fixture-insert',403,'42501','assertion'],
  ['malformed-json','read-local-credentials',null,null,'script-or-source-syntax'],
  ['external-url','validate-local-endpoint',null,null,'assertion'],
  ['missing-module','application-module-import',null,null,'module-initialisation'],
  ['guard-source','source-guard-extraction',null,null,'assertion']
 ];
 for(const [mode,operation,status,code,category] of scenarios){
  const directory=path.join(temporary,mode);fs.mkdirSync(directory);
  const credentials=path.join(directory,'local-status.json');
  fs.writeFileSync(credentials,mode==='malformed-json'?canary:JSON.stringify({API_URL:mode==='external-url'?'https://private.supabase.co':'http://127.0.0.1:54321',ANON_KEY:canary,SERVICE_ROLE_KEY:canary}));
  let script=path.join(here,'integration.mjs');
  if(mode==='missing-module'||mode==='guard-source'){
   const isolated=path.join(directory,'scripts/disposable-supabase');fs.mkdirSync(isolated,{recursive:true});
   for(const file of ['integration.mjs','integration-progress.mjs'])fs.copyFileSync(path.join(here,file),path.join(isolated,file));
   script=path.join(isolated,'integration.mjs');
   if(mode==='guard-source'){
    const shared=path.join(directory,'supabase/functions/_shared');fs.mkdirSync(shared,{recursive:true});
    for(const file of ['businessContentStore.mjs','businessContentRecords.mjs'])fs.copyFileSync(path.join(root,'supabase/functions/_shared',file),path.join(shared,file));
    const guards=path.join(directory,'supabase/functions/busy-mini-apps');fs.mkdirSync(guards);
    fs.writeFileSync(path.join(guards,'index.ts'),'// absent source boundary');
   }
  }
  const child=spawnSync(process.execPath,['--import',preload,script,credentials],{encoding:'utf8',env:{...process.env,TEST_FAILURE:mode,NODE_NO_WARNINGS:'1'},timeout:10000});
  assert.equal(child.status,1,mode+': process must fail, never fake success');
  const text=fs.readFileSync(path.join(directory,'integration-progress-public.json'),'utf8'),progress=JSON.parse(text);
  assert.equal(progress.result,'failed',mode);assert.equal(progress.currentOperation,operation,mode);
  assert.equal(progress.failure.category,category,mode);
  assert.equal(progress.lastRequest?.status??null,status,mode);assert.equal(progress.lastRequest?.errorCode??null,code,mode);
  assert.ok(!text.includes(canary)&&!text.includes('private.supabase.co'),mode);
  assert.ok(!(child.stdout+child.stderr).includes(canary),mode);
  assert.equal(progress.completedChecks.length,mode==='fixture-error'?2:0,mode);
  assert.ok(!progress.completedOperations.includes(operation),mode+' failed operation cannot be completed');
  if(mode==='second-account-error')assert.ok(progress.completedOperations.includes('auth-require-user-a'));
  if(mode==='admin-error')for(const op of ['application-module-import','source-guard-type-stripping','source-guard-evaluation'])assert.ok(progress.completedOperations.includes(op));
  if(mode==='identity-assertion')assert.ok(Number.isInteger(progress.failure.sourceLine)&&progress.failure.sourceLine>0);
  checks++;
 }
 const credentials=path.join(temporary,'local-status.json'),progress=createProgress(credentials);
 progress.begin('auth-create-a');
 const first=progress.request(new URL('http://127.0.0.1:54321/auth/v1/admin/users?token='+canary),'POST');
 const second=progress.request(new URL('http://127.0.0.1:54321/auth/v1/user'),'GET');
 progress.response(first,503,{error_code:'unexpected_failure',message:canary});
 assert.equal(progress.state.lastRequest.status,null);
 progress.response(second,401,{error_code:canary,message:canary});
 assert.equal(progress.state.lastRequest.status,401);assert.equal(progress.state.lastRequest.errorCode,null);
 assert.throws(()=>progress.begin(canary));assert.throws(()=>progress.pass(canary));
 progress.fail(Object.assign(new Error(canary),{actual:canary,expected:canary}));
 progress.response(second,200,{token:canary});
 assert.equal(progress.state.lastRequest.status,401);
 assert.ok(!fs.readFileSync(path.join(temporary,'integration-progress-public.json'),'utf8').includes(canary));
 assert.equal(safeFailure({name:canary,code:canary,message:canary,stack:canary}).category,'unclassified');
 checks++;
 console.log('PASS '+checks+' offline integration progress/privacy scenarios; actual imports and guards execute with test-only inert fetch. No real Auth/PostgREST or database claim.');
}finally{fs.rmSync(temporary,{recursive:true,force:true});}
