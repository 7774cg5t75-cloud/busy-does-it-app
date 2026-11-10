// LOCAL tests: synthetic grants/native records/keys only. No real API key,
// native owner, provider, hosted call or actual approval is available here.
import assert from 'node:assert/strict';
import {generateKeyPairSync} from 'node:crypto';
import {createServer} from 'node:http';
import {once} from 'node:events';
import {syntheticProtectedSolFixture} from './fixtures/sol-protected-flow-synthetic.mjs';
import {runProtectedSolDesign,readSolDesignGrant,solDesignDigest,solDesignApprovalComment,verifyNativeSolDesignReview,reviewProtectedSolHeadroom,compareSolDesignReviewComment} from './lib/ai-lab-sol-design-handoff.mjs';
import {SOL_PRIVATE_CALL_TIMING,reviewSolPrivateCallHeadroom} from './lib/sol-private-call.mjs';
import {SOL_TIMING_POLICY_CANDIDATE} from './lib/sol-development-policy.mjs';
import {openSolPrivateResult} from './lib/sol-private-result.mjs';

const root=process.cwd(),pair=generateKeyPairSync('rsa',{modulusLength:3072,publicKeyEncoding:{type:'spki',format:'pem'},privateKeyEncoding:{type:'pkcs8',format:'pem'}});
const fixture=()=>syntheticProtectedSolFixture(root,{pair});
let passed=0,localHttpRequests=0;
async function test(name,fn){await fn();passed++;console.log('PASS '+name);}
function approved(f){return verifyNativeSolDesignReview({run:f.run,reviews:f.reviews,duplicates:f.duplicates,gate:{runId:f.options.environment.GITHUB_RUN_ID,eventSha:f.options.environment.GITHUB_SHA},now:f.state.clock});}
function grantRead(f){return readSolDesignGrant(JSON.stringify(f.envelope),f.marker,{runId:f.options.environment.GITHUB_RUN_ID,eventSha:f.options.environment.GITHUB_SHA},approved(f),f.state.clock);}
function assertNoSensitiveEffects(f){assert.equal(f.state.claims,0);assert.equal(f.state.credentialReads,0);assert.equal(f.state.requests.length,0);}

await test('conditional artifact4h is separate from an actual exact-run issued lease<=1h',async()=>{
 const f=fixture();assert.ok(f.readback.conditionalDExpiresAt-f.readback.conditionalDIssuedAt>3600000);assert.equal(grantRead(f).grant.issuedAt,f.grant.issuedAt);
 const r=await runProtectedSolDesign(f.options);assert.equal(r.status,'private-response-retained');assert.equal(f.state.claims,1);assert.equal(f.state.requests.length,3);
});
await test('old v1 grant and envelope cannot carry historical authority into revised source',async()=>{
 const f=fixture();f.grant.version='busy.sol-private-call-grant.v1';delete f.grant.issuedAt;f.envelope.version='busy.sol-design-private-envelope.v1';f.refresh();
 assert.throws(()=>grantRead(f));const r=await runProtectedSolDesign(f.options);assert.equal(r.status,'denied');assertNoSensitiveEffects(f);
});
await test('a4h-issued grant cannot age3h and pass a remaining1h-only test',async()=>{
 const f=fixture(),now=f.state.clock;f.readback.conditionalDIssuedAt=now-13800000;f.readback.conditionalDExpiresAt=now+600000;f.grant.issuedAt=now-10800000;f.refresh();
 assert.equal(f.grant.expiresAt-now,600000);assert.ok(f.grant.expiresAt-f.grant.issuedAt>3600000);assert.throws(()=>grantRead(f));const r=await runProtectedSolDesign(f.options);assert.equal(r.status,'denied');assertNoSensitiveEffects(f);
});
for(const [name,edit]of [
 ['missing issuance',f=>delete f.grant.issuedAt],
 ['future issuance',f=>f.grant.issuedAt=f.state.clock+1],
 ['unbounded issued duration',f=>f.grant.issuedAt=f.grant.expiresAt-3600001],
 ['grant starts before conditional D',f=>f.grant.issuedAt=f.readback.conditionalDIssuedAt-1],
 ['grant expires after conditional D',f=>f.readback.conditionalDExpiresAt=f.grant.expiresAt-1],
 ['grant expires after original supporting ceiling',f=>f.readback.supportingEvidenceUntil=f.grant.expiresAt-1],
 ['unapproved timing identity',f=>f.readback.timingPolicyDigest='0'.repeat(64)],
 ['artificial readback deadline',f=>f.readback.readbackValidUntil++],
 ['old readback schema',f=>f.readback.version='busy.sol-c2-independent-readback.v1']
])await test(name+' denies before consuming inference intent or credentials',async()=>{
 const f=fixture();edit(f);f.refresh();const r=await runProtectedSolDesign(f.options);assert.equal(r.status,'denied');assertNoSensitiveEffects(f);
});
await test('exactrun timeouts and5min pre-intent headroom derive from the complete phase budget',()=>{
 const p=SOL_TIMING_POLICY_CANDIDATE;
 const budget=p.nativeReviewStages*p.nativeReviewRequestsPerStage*p.nativeMetadataRequestTimeoutMs+2*p.nativeAuthRequestTimeoutMs+p.functionRequestTimeoutMs+p.exactRunSafetyAllowanceMs;
 assert.equal(budget,300000);assert.equal(p.exactRunMinimumRemainingMs,budget);assert.equal(SOL_PRIVATE_CALL_TIMING.minimumIntentHeadroomMs,budget);assert.equal(SOL_PRIVATE_CALL_TIMING.minimumFunctionHeadroomMs,p.functionRequestTimeoutMs+p.functionSafetyAllowanceMs);
 assert.equal(SOL_PRIVATE_CALL_TIMING.minimumCredentialHeadroomMs,270000);assert.equal(SOL_PRIVATE_CALL_TIMING.minimumSignInHeadroomMs,240000);assert.equal(SOL_PRIVATE_CALL_TIMING.minimumUserHeadroomMs,200000);
});
await test('grant with less than5min remaining is rejected before consuming intent',async()=>{
 const f=fixture();f.grant.expiresAt=f.state.clock+299000;f.refresh();const r=await runProtectedSolDesign(f.options);assert.equal(r.status,'denied');assert.equal(r.failedPredicate,'EXACT_RUN_INTENT_HEADROOM');assertNoSensitiveEffects(f);
});
await test('a currently valid readback with less than5min remaining is rejected before intent',async()=>{
 const f=fixture();f.readback.conditionalDIssuedAt=f.state.clock-3600000;f.readback.conditionalDExpiresAt=f.readback.conditionalDIssuedAt+14400000;f.readback.checkedAt=f.state.clock-600001;f.readback.readbackValidUntil=f.readback.checkedAt+900000;f.refresh();
 grantRead(f);const r=await runProtectedSolDesign(f.options);assert.equal(r.status,'denied');assert.equal(r.failedPredicate,'C2_READBACK_INTENT_HEADROOM');assertNoSensitiveEffects(f);
});
await test('slow native checks are admitted using their actual final clock before durable intent',async()=>{
 const f=fixture(),get=f.options.readGitHubJson;f.options.readGitHubJson=async url=>{f.state.clock+=60000;return get(url);};const r=await runProtectedSolDesign(f.options);
 assert.equal(r.failedPredicate,'EXACT_RUN_INTENT_HEADROOM');assertNoSensitiveEffects(f);assert.equal(r.mayReplay,false);
});
await test('time lost after intent refuses credentials before native sign-in without a retry',async()=>{
 const f=fixture(),claim=f.options.claimOneUseIntent;f.options.claimOneUseIntent=async x=>{const result=await claim(x);f.state.clock+=500000;return result;};const r=await runProtectedSolDesign(f.options);
 assert.equal(f.state.claims,1);assert.equal(f.state.credentialReads,0);assert.equal(f.state.requests.length,0);assert.equal(r.status,'stopped-inspect-only');assert.equal(r.failedPredicate,'EXACT_RUN_CREDENTIALS_HEADROOM');assert.equal(r.mayReplay,false);
});
await test('late time change after nativeUser permits no function or provider dispatch',async()=>{
 const f=fixture(),transport=f.options.transport;f.options.transport=async(url,o)=>{const response=await transport(url,o);if(url.endsWith('/auth/v1/user'))f.state.clock+=500000;return response;};const r=await runProtectedSolDesign(f.options);
 assert.equal(r.failedPredicate,'EXACT_RUN_FUNCTION_HEADROOM');assert.equal(r.functionRequestsAttempted,0);assert.equal(f.state.requests.length,2);assert.equal(f.state.claims,1);assert.equal(f.state.packets.length,1);
});
await test('native checks complete outside10s HTTP deadline, then expiry is rechecked before the request',async()=>{
 const f=fixture(),get=f.options.readGitHubJson,original=globalThis.setTimeout;
 f.options.readGitHubJson=async url=>{await new Promise(resolve=>original(resolve,4));return get(url);};
 // A1ms substitute for the original10s transport deadline makes the old
 // arrangement fail: its3 awaited native reads were inside this timer.
 globalThis.setTimeout=(callback,ms,...args)=>original(callback,ms===10000?1:ms,...args);
 try{const r=await runProtectedSolDesign(f.options);assert.equal(r.status,'private-response-retained');assert.equal(f.state.requests.length,3);assert.equal(f.state.metadata,18);}finally{globalThis.setTimeout=original;}
});
await test('headroom diagnostics reject unknown stage objects without executing coercion',()=>{
 let invoked=false;const stage={[Symbol.toPrimitive](){invoked=true;throw Error('SYNTHETIC_PRIVATE');}};
 const r=reviewSolPrivateCallHeadroom(1,1,stage);assert.equal(r.ok,false);assert.equal(invoked,false);assert.equal(r.failedPredicate,'EXACT_RUN_HEADROOM_INVALID_STAGE');assert.equal(JSON.stringify(r).includes('SYNTHETIC_PRIVATE'),false);
});
await test('review comment comparison is exact UTF8 bytes and never repairs a pasted URL',()=>{
 const f=fixture(),comment=f.reviews[0].comment;
 assert.equal(compareSolDesignReviewComment(comment,comment).match,true);
 for(const entered of [comment+'\n',' '+comment,comment.replace('attempt=1','attempt=2'),'https://github.com/7774cg5t75-cloud/busy-does-it-app/actions/runs/98765432101'])assert.equal(compareSolDesignReviewComment(comment,entered).match,false);
 assert.equal(compareSolDesignReviewComment(comment,comment).nativeBrowserOrAPIReadback,false);
});

async function localServer(mode,run){
 const events=[];const server=createServer(async(req,res)=>{try{const chunks=[];for await(const c of req)chunks.push(c);const body=Buffer.concat(chunks);events.push({path:req.url,method:req.method,bodyBytes:body.length});localHttpRequests++;await run(req,res,body);}catch{res.destroy();}});
 server.listen(0,'127.0.0.1');await once(server,'listening');const endpoint='http://127.0.0.1:'+server.address().port;
 try{await mode(endpoint,events);}finally{server.closeAllConnections?.();await new Promise(resolve=>server.close(resolve));}
}
await test('real localHTTP Auth/User/C2 facades exercise the protected caller and exact encrypted bytes',async()=>{
 const f=fixture();await localServer(async(endpoint,events)=>{
  f.options.transport=async(url,o)=>{assert.ok(url.startsWith('https://sbvkrvksnruiclcvclbd.supabase.co/'));assert.equal(o.redirect,'error');const route=new URL(url).pathname+new URL(url).search;const response=await fetch(endpoint+route,o);return {status:response.status,url,redirected:response.redirected,headers:response.headers,body:response.body};};
  const r=await runProtectedSolDesign(f.options);assert.equal(r.status,'private-response-retained');assert.equal(f.state.claims,1);assert.equal(events.length,3);assert.deepEqual(events.map(x=>x.method),['POST','GET','POST']);assert.equal(f.state.packets.length,1);
  const outcome=JSON.parse(openSolPrivateResult(f.state.packets[0],f.binding,pair.privateKey));assert.equal(outcome.httpStatus,200);assert.equal(JSON.parse(Buffer.from(outcome.rawBodyBase64,'base64')).evidence,'SYNTHETIC_LOCAL_HTTP_NO_PROVIDER');assert.equal(r.actualProviderCalls,null);assert.equal(r.actualPaidCostGBP,null);
 },(req,res,body)=>{res.setHeader('content-type','application/json');if(req.url.startsWith('/auth/v1/token?')){assert.equal(JSON.parse(body).password,f.credentials.ownerPassword);res.end(JSON.stringify({access_token:f.token,token_type:'bearer',expires_in:3600,user:f.user()}));}else if(req.url==='/auth/v1/user')res.end(JSON.stringify(f.user()));else{assert.equal(req.url,'/functions/v1/busy-creative-document-pilot');assert.equal(JSON.parse(body).operationId,f.ids.operation);res.end(JSON.stringify({evidence:'SYNTHETIC_LOCAL_HTTP_NO_PROVIDER'}));}});
});
await test('lost localHTTP function acknowledgement retains encrypted unknown and never replays',async()=>{
 const f=fixture();await localServer(async(endpoint,events)=>{
  f.options.transport=async(url,o)=>{const u=new URL(url),response=await fetch(endpoint+u.pathname+u.search,o);return {status:response.status,url,redirected:response.redirected,headers:response.headers,body:response.body};};
  const r=await runProtectedSolDesign(f.options);assert.equal(r.status,'stopped-inspect-only');assert.equal(r.requiresIndependentOriginalReceiptReadback,true);assert.equal(events.length,3);assert.equal(f.state.packets.length,1);assert.equal(JSON.parse(openSolPrivateResult(f.state.packets[0],f.binding,pair.privateKey)).status,'unconfirmed');
  await runProtectedSolDesign(f.options);assert.equal(events.length,3);assert.equal(f.state.claims,2);assert.equal(r.mayReplay,false);
 },(req,res)=>{if(req.url.includes('/functions/')){res.destroy();return;}res.setHeader('content-type','application/json');res.end(JSON.stringify(req.url.includes('/token?')?{access_token:f.token,token_type:'bearer',expires_in:3600,user:f.user()}:f.user()));});
});
console.log(JSON.stringify({passed,failed:0,fixtureBasis:'SYNTHETIC_GITHUB_AUTH_C2_AND_RECIPIENT',realLocalHttpRequests:localHttpRequests,realHostedCalls:0,providerCalls:0,ownerKeyOrCredentialReads:0,actualApprovalOrDRecords:0,hostedWrites:0,spendingGBP:0}));
