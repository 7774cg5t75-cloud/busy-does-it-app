import assert from 'node:assert/strict';
import {createDisabledCreativeDocumentSmoke,DISABLED_CREATIVE_SMOKE_VERSION,DISABLED_CREATIVE_SMOKE_URL} from './lib/disabled-creative-document-smoke.mjs';

const now=Date.parse('2026-11-07T00:00:00Z'),digest='a'.repeat(64),executionId='10101010-1010-4101-8101-000000000001';
let passed=0;
async function test(name,run){await run();passed++;console.log('PASS '+name);}
function fixture(){
 const approval={version:DISABLED_CREATIVE_SMOKE_VERSION,status:'owner-approved',executionId,projectId:'sbvkrvksnruiclcvclbd',functionName:'busy-creative-document-pilot',deploymentFilesDigest:digest,expiresAt:new Date(now+60000).toISOString(),maximumRequests:3,protectedRuntimeVerified:true};
 let keyReads=0,claims=0,calls=0,claimed=false;
 const options={expectedFilesDigest:digest,clock:()=>now,readServerApproval:async()=>approval,claimOneUseIntent:async a=>{claims++;if(claimed)throw Error('used');claimed=true;return {consumed:true,executionId:a.executionId,deploymentFilesDigest:a.deploymentFilesDigest};},readLabPublishableKey:async()=>{keyReads++;return 'sb_publishable_synthetic_test_only_123456789';},fetchImpl:async(url,request)=>{
  calls++;assert.equal(url,DISABLED_CREATIVE_SMOKE_URL);assert.equal(request.method,'POST');assert.equal(request.body,'{}');assert.equal(request.redirect,'error');assert.equal(request.headers['content-type'],'application/json');assert.ok(request.signal instanceof AbortSignal);
  if(calls===1){assert.deepEqual(request.headers,{'content-type':'application/json'});return new Response('{}',{status:401});}
  if(calls===2){assert.equal(request.headers.Authorization,'Bearer synthetic-invalid-token-only');assert.equal(request.headers.apikey,undefined);return new Response('{}',{status:401});}
  assert.equal(calls,3);assert.equal(request.headers.apikey,'sb_publishable_synthetic_test_only_123456789');assert.equal(request.headers.Authorization,undefined);
  return new Response('Creative document pilot disabled',{status:503,headers:{'cache-control':'no-store','x-content-type-options':'nosniff'}});
 }};
 return {approval,options,get keyReads(){return keyReads;},get claims(){return claims;},get calls(){return calls;}};
}
await test('default factory has no network or credential capability',async()=>assert.equal((await createDisabledCreativeDocumentSmoke()()).status,'denied'));
await test('exact future protected approval performs only three fixed no-call HTTP requests',async()=>{
 const f=fixture(),run=createDisabledCreativeDocumentSmoke(f.options),r=await run();assert.equal(r.status,'disabled-route-verified');assert.equal(r.requestsAttempted,3);assert.equal(r.publishableKeyReads,1);assert.equal(r.ownerAuthenticationProven,false);assert.deepEqual(r.results.map(x=>x.status),[401,401,503]);assert.equal(f.claims,1);assert.equal(f.calls,3);assert.ok(!JSON.stringify(r).includes('sb_publishable_'));assert.equal((await run()).status,'already-used');
});
for(const kind of ['pending','expired','unbounded','foreign-project','foreign-function','wrong-digest','unprotected','extra-property'])await test('denies '+kind+' before intent, credential or HTTP',async()=>{
 const f=fixture();if(kind==='pending')f.approval.status='not-authorized';if(kind==='expired')f.approval.expiresAt=new Date(now).toISOString();if(kind==='unbounded')f.approval.expiresAt=new Date(now+3600001).toISOString();if(kind==='foreign-project')f.approval.projectId='other';if(kind==='foreign-function')f.approval.functionName='other';if(kind==='wrong-digest')f.approval.deploymentFilesDigest='b'.repeat(64);if(kind==='unprotected')f.approval.protectedRuntimeVerified=false;if(kind==='extra-property')f.approval.key='synthetic-not-a-key';assert.equal((await createDisabledCreativeDocumentSmoke(f.options)()).status,'denied');assert.equal(f.claims,0);assert.equal(f.keyReads,0);assert.equal(f.calls,0);
});
await test('intent denial or lost acknowledgement reads no credential and never dispatches',async()=>{
 for(const kind of ['denied','lost']){const f=fixture();f.options.claimOneUseIntent=async()=>{if(kind==='lost')throw Error('lost');return {consumed:false};};const r=await createDisabledCreativeDocumentSmoke(f.options)();assert.equal(r.status,'intent-unconfirmed');assert.equal(f.keyReads,0);assert.equal(f.calls,0);}
});
await test('simultaneous entry and a second factory cannot reuse one durable intent',async()=>{
 const f=fixture(),one=createDisabledCreativeDocumentSmoke(f.options),two=createDisabledCreativeDocumentSmoke(f.options);const results=await Promise.all([one(),one(),two()]);assert.equal(results.filter(r=>r.status==='disabled-route-verified').length,1);assert.equal(f.calls,3);assert.equal(f.keyReads,1);
});
await test('unexpected gateway or handler response stops without retry or leaking its body',async()=>{
 for(const at of [1,2,3]){const f=fixture(),fetch=f.options.fetchImpl;f.options.fetchImpl=async(...args)=>{if(f.calls+1===at){await fetch(...args);return new Response('private synthetic body',{status:200});}return fetch(...args);};const run=createDisabledCreativeDocumentSmoke(f.options),r=await run();assert.equal(r.status,'stopped-inspect-only');assert.equal(f.calls,at);assert.ok(!JSON.stringify(r).includes('private synthetic'));assert.equal((await run()).status,'already-used');}
});
await test('provider, server, legacy or missing credentials cannot replace the publishable key',async()=>{
 for(const key of [null,'sb_secret_synthetic_123456789','eyJsynthetic.jwt.token','sk-synthetic-provider-key']){const f=fixture();f.options.readLabPublishableKey=async()=>key;const r=await createDisabledCreativeDocumentSmoke(f.options)();assert.equal(r.status,'stopped-inspect-only');assert.equal(f.calls,2);assert.ok(!JSON.stringify(r).includes(String(key)));}
});
await test('revoked approval after intent or before the key denies all later requests',async()=>{
 const f=fixture(),claim=f.options.claimOneUseIntent;f.options.claimOneUseIntent=async a=>{const r=await claim(a);f.approval.status='not-authorized';return r;};const r=await createDisabledCreativeDocumentSmoke(f.options)();assert.equal(r.status,'intent-unconfirmed');assert.equal(f.calls,0);assert.equal(f.keyReads,0);
});
await test('network uncertainty is terminal and never replayed',async()=>{
 const f=fixture();let calls=0;f.options.fetchImpl=async()=>{calls++;throw Error('Synthetic network uncertainty');};const run=createDisabledCreativeDocumentSmoke(f.options),r=await run();assert.equal(r.status,'stopped-inspect-only');assert.equal(calls,1);assert.equal((await run()).status,'already-used');assert.equal(calls,1);
});
await test('oversized, invalid UTF-8 and redirected responses stop without retaining raw data',async()=>{
 for(const kind of ['oversized','utf8','redirect']){
  const f=fixture();f.options.fetchImpl=async()=>{if(kind==='oversized')return new Response('x'.repeat(4097),{status:401});if(kind==='utf8')return new Response(new Uint8Array([255]),{status:401});const r=new Response('{}',{status:401});Object.defineProperty(r,'url',{value:'https://foreign.invalid/response'});return r;};
  const result=await createDisabledCreativeDocumentSmoke(f.options)();assert.equal(result.status,'stopped-inspect-only');assert.equal(result.requestsAttempted,1);assert.equal(f.keyReads,0);
 }
});
await test('503 body and security headers must identify the exact disabled entry',async()=>{
 for(const kind of ['body','headers','key-echo']){const f=fixture(),fetch=f.options.fetchImpl;f.options.fetchImpl=async(...args)=>{const r=await fetch(...args);if(f.calls!==3)return r;return new Response(kind==='body'?'other route':kind==='key-echo'?'sb_publishable_synthetic_test_only_123456789':'Creative document pilot disabled',{status:503,headers:kind==='headers'?{}:{'cache-control':'no-store','x-content-type-options':'nosniff'}});};const result=await createDisabledCreativeDocumentSmoke(f.options)();assert.equal(result.status,'stopped-inspect-only');assert.equal(f.calls,3);assert.ok(!JSON.stringify(result).includes('sb_publishable_'));}
});
async function virtualDeadline(run){
 const originalSet=globalThis.setTimeout,originalClear=globalThis.clearTimeout;let callback=null;
 globalThis.setTimeout=(fn,delay)=>{assert.equal(delay,10000);callback=fn;return {syntheticDeadline:true};};
 globalThis.clearTimeout=()=>{};
 try{return await run(()=>{assert.equal(typeof callback,'function');callback();});}finally{globalThis.setTimeout=originalSet;globalThis.clearTimeout=originalClear;}
}
for(const kind of ['headers','body'])await test('10-second deadline covers stalled '+kind+' without retry',async()=>virtualDeadline(async fire=>{
 const f=fixture();let started,signal;const ready=new Promise(resolve=>{started=resolve;});
 f.options.fetchImpl=async(_url,options)=>{signal=options.signal;started();if(kind==='headers')return new Promise((_,reject)=>signal.addEventListener('abort',()=>reject(Error('synthetic timeout')),{once:true}));return new Response(new ReadableStream({start(controller){signal.addEventListener('abort',()=>controller.error(Error('synthetic timeout')),{once:true});}}),{status:401});};
 const run=createDisabledCreativeDocumentSmoke(f.options),pending=run();await ready;fire();const result=await pending;assert.equal(signal.aborted,true);assert.equal(result.status,'stopped-inspect-only');assert.equal(result.requestsAttempted,1);assert.equal((await run()).status,'already-used');assert.equal(f.keyReads,0);
}));
console.log(JSON.stringify({passed,failed:0,syntheticTransportsOnly:true,hostedRequests:0,realSecretsRead:0,nativeSignIns:0,applicationWrites:0,providerCalls:0,spendingGBP:0}));
