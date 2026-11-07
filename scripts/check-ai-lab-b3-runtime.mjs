import assert from 'node:assert/strict';
import {createAiLabB3Runtime,AiLabB3RuntimeError,AI_LAB_B3_RUNTIME_VERSION,AI_LAB_B3_URL} from './lib/ai-lab-b3-runtime.mjs';

// Entirely synthetic native/API responses. No real UUID, credential, login,
// transport, hosted RPC, provider request or billing is used by this script.
const OWNER='7bc96e34-9f6b-4e1d-aaf0-54ab89a97643',BUSINESS='8c74809f-bf57-4cb5-a748-c96e09fc3c29';
const EXECUTION='ccf3db6f-0a1e-40a2-a6f7-d7d80b43bf01',NONCE='36d3f2aa-5c86-4733-bd75-97036a409d61';
const FOREIGN='d3f09e6c-4440-4a7c-a169-1bdbecc14b1b',HASH='a'.repeat(64);
const KEY='sb_publishable_'+'P'.repeat(32),SERVICE='sb_secret_'+'S'.repeat(32),PASSWORD='SyntheticOnlyPassword!27';
const TOKEN='syntheticheader.syntheticpayload.syntheticsignature',REFRESH='SYNTHETIC_REFRESH_NEVER_RETURNED';
const EPOCH=Date.parse('2026-11-07T08:00:00.000Z');
const clone=v=>JSON.parse(JSON.stringify(v));
const gate=()=>({version:AI_LAB_B3_RUNTIME_VERSION,projectId:'sbvkrvksnruiclcvclbd',organizationId:'wrjfgasxtlznzfzmfrif',region:'eu-west-1',ownerId:OWNER,businessId:BUSINESS,executionId:EXECUTION,requestNonce:NONCE,sourcePlanDigest:'b'.repeat(64),approval:{status:'owner-approved',manifestDigest:HASH,expiresAt:new Date(EPOCH+600000).toISOString()}});
const nativeOwner=()=>({id:OWNER,email:'quiet-light-owner@busy-ai-lab.invalid',email_confirmed_at:'2026-11-07T07:00:00.000Z',role:'authenticated',aud:'authenticated',is_anonymous:false,identities:[{provider:'email',user_id:OWNER}],user_metadata:{role:'service_role',ownerId:FOREIGN}});
const member=()=>({actorId:OWNER,items:[{businessId:BUSINESS,businessName:'Quiet Light Studio',role:'owner'}]});
const emptyBuilder=()=>({actorId:OWNER,businessId:BUSINESS,revision:1,websiteUndoCount:0,websiteRedoCount:0,websiteHistoryHash:null,websiteDraft:null,websiteDraftHash:null,profileRevision:null,profileHash:null,profile:null});
const response=(data,status=200,headers={})=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json',...headers}});
const profileArgs=()=>({p_business_id:BUSINESS,p_expected_revision:0,p_expected_profile:null,p_profile:{businessName:'Quiet Light Studio'},p_owner_approved:true});
const commitArgs=(generation=1)=>({p_business_id:BUSINESS,p_actor_id:OWNER,p_expected_revision:generation,p_expected_draft:generation===1?null:{businessId:BUSINESS,id:'website-synthetic',generation:generation-1},p_candidate:{id:'website-synthetic',businessId:BUSINESS,status:'Draft',publicStatus:'Not published',generation,sections:[]},p_profile_revision:1});
function harness({manifest=gate(),intercept,permit,credentials,password,timeout=10000}={}){
 const calls=[],events=[],clock={value:EPOCH};let credentialReads=0,passwordReads=0,permitReads=0;
 const options={
  now:()=>clock.value,requestTimeoutMs:timeout,
  credentialReader:async()=>{credentialReads++;events.push('credentials');return credentials?credentials():{publishableKey:KEY,serviceKey:SERVICE};},
  ownerPasswordReader:async()=>{passwordReads++;events.push('password');return password?password():PASSWORD;},
  consumeDispatchPermit:async expected=>{permitReads++;events.push('permit');return permit?permit(expected):{status:'consumed',executionId:expected.executionId,requestNonce:expected.requestNonce,manifestDigest:expected.manifestDigest};},
  fetchImpl:async(url,options)=>{
   const call={url,options,body:options.body?JSON.parse(options.body):null};calls.push(call);events.push(url.includes('/token?')?'sign-in':url.includes('/auth/')?'get-user':'rpc');
   if(intercept){const custom=await intercept(call,calls);if(custom!==undefined)return custom;}
   if(url===AI_LAB_B3_URL+'/auth/v1/token?grant_type=password')return response({access_token:TOKEN,token_type:'bearer',expires_in:3600,refresh_token:REFRESH,user:nativeOwner()});
   if(url===AI_LAB_B3_URL+'/auth/v1/user')return response(nativeOwner());
   const rpc=url.slice((AI_LAB_B3_URL+'/rest/v1/rpc/').length),a=call.body;
   if(rpc==='busy_connected_workspaces_v1')return response(member());
   if(rpc==='busy_connected_initialize_v1'||rpc==='busy_connected_builder_read_v1')return response(emptyBuilder());
   if(rpc==='busy_connected_profile_write_v1')return response({businessId:BUSINESS,actorId:OWNER,profileRevision:a.p_expected_revision+1,profile:a.p_profile,privateOnly:true,publicationChanged:false,recordHash:HASH});
   if(rpc==='busy_connected_website_commit_v1')return response({ok:true,businessId:BUSINESS,actorId:OWNER,previousRevision:a.p_expected_revision,revision:a.p_expected_revision+1,draftId:a.p_candidate.id,generation:a.p_candidate.generation,recordHash:HASH,privateOnly:true,operation:'edit',undoCount:a.p_expected_draft===null?0:1,redoCount:0,historyHash:HASH});
   throw Error('Synthetic transport does not implement that path');
  }
 };
 return {runtime:createAiLabB3Runtime(manifest,options),calls,events,clock,options,reads:()=>({credentialReads,passwordReads,permitReads})};
}
let passed=0;const test=async(id,run)=>{await run();passed++;console.log('PASS '+id);};
const denied=(promise,code,unknown)=>assert.rejects(promise,e=>e instanceof AiLabB3RuntimeError&&(!code||e.code===code)&&(unknown===undefined||e.unknownOutcome===unknown)&&e.mayReplay===false&&![KEY,SERVICE,PASSWORD,TOKEN,REFRESH,'SYNTHETIC_PRIVATE_ERROR'].some(s=>(e.message+e.stack).includes(s)));

await test('default/pending/foreign/expired/extra-field gates read no credentials and make no request',async()=>{
 const bad=[undefined,{}, {...gate(),enabled:true},{...gate(),projectId:'pnjdlogwegnqbsfpcofw'},{...gate(),region:'eu-west-2'},{...gate(),organizationId:'foreign'},{...gate(),ownerId:BUSINESS},{...gate(),approval:{...gate().approval,status:'pending'}},{...gate(),approval:{...gate().approval,expiresAt:new Date(EPOCH).toISOString()}}];
 for(const manifest of bad){const h=harness({manifest:manifest??null});await denied(h.runtime.verifyOwner(),'disabled');assert.deepEqual(h.reads(),{credentialReads:0,passwordReads:0,permitReads:0});assert.equal(h.calls.length,0);}
});
await test('missing server dependencies remain disabled without implicit global fetch',async()=>{const r=createAiLabB3Runtime(gate());await denied(r.verifyOwner(),'disabled');});
await test('private one-use permit is consumed before credentials and native sign-in',async()=>{
 const h=harness(),owner=await h.runtime.verifyOwner();assert.deepEqual(owner,{id:OWNER,anonymous:false,emailConfirmed:true});assert.deepEqual(h.events.slice(0,4),['permit','credentials','password','sign-in']);assert.equal(h.calls.filter(c=>c.url.includes('/token?')).length,1);assert.equal(h.calls.filter(c=>c.url.endsWith('/auth/v1/user')).length,1);assert.equal(h.calls.filter(c=>c.url.endsWith('/busy_connected_workspaces_v1')).length,1);assert.ok(Object.isFrozen(owner));assert.deepEqual(h.reads(),{credentialReads:1,passwordReads:1,permitReads:1});
});
await test('permit denial, forged binding and callback failure read zero secrets and never sign in',async()=>{
 for(const permit of [()=>null,()=>({status:'consumed',executionId:FOREIGN,requestNonce:NONCE,manifestDigest:HASH}),()=>{throw Error('SYNTHETIC_PRIVATE_ERROR');}]){const h=harness({permit});await denied(h.runtime.verifyOwner());assert.deepEqual(h.reads(),{credentialReads:0,passwordReads:0,permitReads:1});assert.equal(h.calls.length,0);await denied(h.runtime.verifyOwner(),'already_stopped');}
});
await test('lost permit acknowledgement is not interpreted as an unused durable nonce',async()=>{let consumed=false;const h=harness({permit:()=>{consumed=true;throw Error('SYNTHETIC_PRIVATE_ERROR');}});await denied(h.runtime.verifyOwner(),'dispatch_permit_unavailable');assert.equal(consumed,true);assert.equal(h.runtime.inspect().permitAttempted,true);assert.equal(h.runtime.inspect().permitConsumed,false);assert.equal(h.runtime.inspect().mayReplay,false);assert.deepEqual(h.reads(),{credentialReads:0,passwordReads:0,permitReads:1});assert.equal(h.calls.length,0);await denied(h.runtime.verifyOwner(),'already_stopped');});
await test('expired approval during permit consumption prevents credential reads',async()=>{let h;h=harness({permit:expected=>{h.clock.value=EPOCH+700000;return {status:'consumed',executionId:expected.executionId,requestNonce:expected.requestNonce,manifestDigest:expected.manifestDigest};}});await denied(h.runtime.verifyOwner(),'approval_expired');assert.equal(h.reads().credentialReads,0);assert.equal(h.calls.length,0);});
await test('invalid/missing/legacy/swapped credential types stop after consumption without exposing values',async()=>{
 for(const credentials of [()=>null,()=>({publishableKey:SERVICE,serviceKey:KEY}),()=>({publishableKey:'legacy.jwt.key',serviceKey:SERVICE}),()=>{throw Error('SYNTHETIC_PRIVATE_ERROR');}]){const h=harness({credentials});await denied(h.runtime.verifyOwner());assert.equal(h.reads().permitReads,1);assert.equal(h.calls.length,0);await denied(h.runtime.verifyOwner(),'already_stopped');}
 const h=harness({password:()=>''});await denied(h.runtime.verifyOwner(),'credentials_invalid');assert.equal(h.calls.length,0);
});
await test('fixed Auth endpoint uses native password grant and current getUser; no token decoded as authority',async()=>{
 const h=harness();await h.runtime.verifyOwner();assert.equal(h.calls[0].url,AI_LAB_B3_URL+'/auth/v1/token?grant_type=password');assert.deepEqual(h.calls[0].body,{email:'quiet-light-owner@busy-ai-lab.invalid',password:PASSWORD});assert.equal(h.calls[0].options.headers.apikey,KEY);assert.equal(h.calls[0].options.headers.Authorization,undefined);assert.equal(h.calls[1].options.headers.Authorization,'Bearer '+TOKEN);assert.equal(h.calls[1].options.headers.apikey,KEY);assert.equal(h.calls[1].options.method,'GET');
});
await test('native wrong/deleted/banned/SSO/anonymous/unconfirmed owner and changed identities fail closed',async()=>{
 for(const patch of [{id:FOREIGN},{email:'foreign@example.invalid'},{is_anonymous:true},{email_confirmed_at:null},{role:'service_role'},{aud:'foreign'},{deleted_at:'2026-11-07T00:00:00Z'},{banned_until:'2026-11-08T00:00:00Z'},{is_sso_user:true},{is_super_admin:true},{identities:[{provider:'github',user_id:OWNER}]}]){const h=harness({intercept:c=>c.url.endsWith('/auth/v1/user')?response({...nativeOwner(),...patch}):undefined});await denied(h.runtime.verifyOwner(),'native_identity_changed');assert.equal(h.calls.filter(c=>c.url.includes('/rest/')).length,0);}
});
await test('user metadata never authorises another actor; original membership supplies scope',async()=>{
 const h=harness();assert.equal((await h.runtime.verifyOwner()).id,OWNER);const call=h.calls.find(c=>c.url.endsWith('/busy_connected_workspaces_v1'));assert.deepEqual(call.body,{});assert.ok(!call.options.body.includes(FOREIGN));
});
await test('foreign/missing/staff/extra membership denies all source writes',async()=>{
 const packets=[{actorId:FOREIGN,items:member().items},{actorId:OWNER,items:[]},{actorId:OWNER,items:[{...member().items[0],role:'staff'}]},{actorId:OWNER,items:[{...member().items[0],businessId:FOREIGN}]},{actorId:OWNER,items:[...member().items,...member().items]}];
 for(const packet of packets){const h=harness({intercept:c=>c.url.endsWith('/busy_connected_workspaces_v1')?response(packet):undefined});await denied(h.runtime.ownerRpc('busy_connected_initialize_v1',{p_business_id:BUSINESS}),'rpc_response');assert.equal(h.calls.filter(c=>c.url.endsWith('/busy_connected_initialize_v1')).length,0);}
});
await test('native identity and current membership are independently checked before every RPC',async()=>{
 const h=harness();await h.runtime.ownerRpc('busy_connected_initialize_v1',{p_business_id:BUSINESS});await h.runtime.ownerRpc('busy_connected_builder_read_v1',{p_business_id:BUSINESS});assert.equal(h.calls.filter(c=>c.url.includes('/token?')).length,1);assert.equal(h.calls.filter(c=>c.url.endsWith('/auth/v1/user')).length,2);assert.equal(h.calls.filter(c=>c.url.endsWith('/busy_connected_workspaces_v1')).length,2);assert.equal(h.reads().passwordReads,1);
});
await test('owner/native bearer and backend modern secret stay in separate approved RPC paths',async()=>{
 const h=harness();await h.runtime.ownerRpc('busy_connected_profile_write_v1',profileArgs());await h.runtime.serviceRpc('busy_connected_website_commit_v1',commitArgs());
 const owner=h.calls.find(c=>c.url.endsWith('/busy_connected_profile_write_v1')),service=h.calls.find(c=>c.url.endsWith('/busy_connected_website_commit_v1'));
 assert.equal(owner.options.headers.apikey,KEY);assert.equal(owner.options.headers.Authorization,'Bearer '+TOKEN);assert.equal(service.options.headers.apikey,SERVICE);assert.equal(service.options.headers.Authorization,undefined);assert.equal(service.body.p_actor_id,OWNER);assert.equal(service.body.p_business_id,BUSINESS);
 for(const c of h.calls){assert.equal(c.options.redirect,'error');assert.equal(c.options.cache,'no-store');assert.equal(c.options.credentials,'omit');assert.equal(c.options.referrerPolicy,'no-referrer');assert.ok(c.url.startsWith(AI_LAB_B3_URL+'/'));assert.ok(!c.url.includes('/functions/'));}
});
await test('wrong RPC authority, unknown/prototype methods and extra params are denied before sign-in',async()=>{
 for(const [kind,name,args] of [['ownerRpc','busy_connected_website_commit_v1',commitArgs()],['serviceRpc','busy_connected_profile_write_v1',profileArgs()],['serviceRpc','busy_ai_reserve_v1',{}],['serviceRpc','busy_connected_website_transition_v1',{}],['ownerRpc','busy_connected_website_history_v1',{}],['ownerRpc','toString',{}],['ownerRpc','../auth/v1/user',{}],['ownerRpc','busy_connected_builder_read_v1',{p_business_id:BUSINESS,execute:true}]]){const h=harness();await denied(h.runtime[kind](name,args),'rpc_scope');assert.equal(h.calls.length,0);assert.equal(h.reads().permitReads,0);}
});
await test('foreign source/actor, missing owner approval and invalid/private-draft inputs fail before reads',async()=>{
 const attempts=[['ownerRpc','busy_connected_builder_read_v1',{p_business_id:FOREIGN}],['ownerRpc','busy_connected_profile_write_v1',{...profileArgs(),p_owner_approved:false}],['serviceRpc','busy_connected_website_commit_v1',{...commitArgs(),p_actor_id:FOREIGN}],['serviceRpc','busy_connected_website_commit_v1',{...commitArgs(),p_candidate:{...commitArgs().p_candidate,publicStatus:'Published'}}],['serviceRpc','busy_connected_website_commit_v1',{...commitArgs(),p_expected_revision:0}]];
 for(const [kind,name,args] of attempts){const h=harness();await denied(h.runtime[kind](name,args));assert.equal(h.calls.length,0);}
});
await test('cyclic/getter/executable/oversized arguments are refused without executing data or touching secrets',async()=>{
 let ran=false;const cyclic={p_business_id:BUSINESS};cyclic.self=cyclic;const getter={};Object.defineProperty(getter,'p_business_id',{enumerable:true,get(){ran=true;return BUSINESS;}});
 const large=profileArgs();large.p_profile.description='x'.repeat(650001);
 for(const a of [cyclic,getter,{p_business_id:()=>BUSINESS},large]){const h=harness();await denied(h.runtime.ownerRpc('busy_connected_profile_write_v1',a));assert.equal(h.calls.length,0);}assert.equal(ran,false);
});
await test('strict scoped builder/profile/commit receipts reject wrong actor and acknowledgements',async()=>{
 for(const kind of ['builder','profile','commit']){const endpoint={builder:'busy_connected_builder_read_v1',profile:'busy_connected_profile_write_v1',commit:'busy_connected_website_commit_v1'}[kind];const h=harness({intercept:c=>c.url.endsWith('/'+endpoint)?response({...emptyBuilder(),actorId:FOREIGN}):undefined});const method=kind==='commit'?'serviceRpc':'ownerRpc',args=kind==='profile'?profileArgs():kind==='commit'?commitArgs():{p_business_id:BUSINESS};await denied(h.runtime[method](endpoint,args),'rpc_response',kind!=='builder');await denied(h.runtime.verifyOwner(),'already_stopped');}
});
await test('at most one initializer, one profile write and four original Website commits',async()=>{
 const h=harness();for(let i=1;i<=4;i++)await h.runtime.serviceRpc('busy_connected_website_commit_v1',commitArgs(i));await denied(h.runtime.serviceRpc('busy_connected_website_commit_v1',commitArgs(5)),'write_limit');assert.equal(h.calls.filter(c=>c.url.endsWith('/busy_connected_website_commit_v1')).length,4);
 for(const [name,args] of [['busy_connected_initialize_v1',{p_business_id:BUSINESS}],['busy_connected_profile_write_v1',profileArgs()]]){const h=harness();await h.runtime.ownerRpc(name,args);await denied(h.runtime.ownerRpc(name,args),'write_limit');assert.equal(h.calls.filter(c=>c.url.endsWith('/'+name)).length,1);}
});
await test('network timeout/failed acknowledgement for a source write is unknown and never replayed',async()=>{
 const h=harness({intercept:c=>{if(c.url.endsWith('/busy_connected_website_commit_v1'))throw Error('SYNTHETIC_PRIVATE_ERROR');}});await denied(h.runtime.serviceRpc('busy_connected_website_commit_v1',commitArgs()),'transport_unavailable',true);await denied(h.runtime.serviceRpc('busy_connected_website_commit_v1',commitArgs()),'already_stopped');assert.equal(h.calls.filter(c=>c.url.endsWith('/busy_connected_website_commit_v1')).length,1);assert.equal(h.runtime.inspect().mayReplay,false);
});
await test('native sign-in unknown outcome consumes one dispatch permit and never retries',async()=>{
 const h=harness({intercept:c=>{if(c.url.includes('/token?'))throw Error(PASSWORD);}});await denied(h.runtime.verifyOwner(),'transport_unavailable',true);await denied(h.runtime.verifyOwner(),'already_stopped');assert.equal(h.calls.length,1);assert.equal(h.reads().permitReads,1);assert.equal(h.runtime.inspect().counts.authSignIns,1);
});
await test('HTTP denial and private error bodies are never returned or logged',async()=>{
 const h=harness({intercept:c=>c.url.endsWith('/busy_connected_profile_write_v1')?response({message:'SYNTHETIC_PRIVATE_ERROR '+PASSWORD,apikey:SERVICE},403):undefined});await denied(h.runtime.ownerRpc('busy_connected_profile_write_v1',profileArgs()),'access_denied',false);await denied(h.runtime.verifyOwner(),'already_stopped');
});
await test('malformed/native and malformed RPC output have sanitized permanent stop classifications',async()=>{
 const token=harness({intercept:c=>c.url.includes('/token?')?response({access_token:TOKEN,token_type:5,expires_in:3600,user:nativeOwner()}):undefined});await denied(token.runtime.verifyOwner(),'native_sign_in_response',true);
 const h=harness({intercept:c=>c.url.endsWith('/busy_connected_website_commit_v1')?new Response('SYNTHETIC_PRIVATE_ERROR '+PASSWORD,{headers:{'Content-Type':'application/json'}}):undefined});await denied(h.runtime.serviceRpc('busy_connected_website_commit_v1',commitArgs()),'response_json',true);
});
await test('response type/advertised length/actual stream size and invalid UTF-8 are bounded',async()=>{
 const oversized=JSON.stringify({value:'x'.repeat(32769)}),cases=[()=>new Response('{}',{headers:{'Content-Type':'text/html'}}),()=>new Response('{}',{headers:{'Content-Type':'application/json','Content-Length':'32769'}}),()=>new Response(oversized,{headers:{'Content-Type':'application/json'}}),()=>new Response(new Uint8Array([0xff,0xfe]),{headers:{'Content-Type':'application/json'}})];
 for(const bad of cases){const h=harness({intercept:c=>c.url.endsWith('/auth/v1/user')?bad():undefined});await denied(h.runtime.verifyOwner());assert.equal(h.calls.filter(c=>c.url.includes('/rest/')).length,0);}
});
await test('RPC credential echoes are rejected without returning secret material',async()=>{
 const h=harness({intercept:c=>c.url.endsWith('/busy_connected_profile_write_v1')?response({businessId:BUSINESS,actorId:OWNER,profileRevision:1,profile:{description:SERVICE},privateOnly:true,publicationChanged:false,recordHash:HASH}):undefined});await denied(h.runtime.ownerRpc('busy_connected_profile_write_v1',profileArgs()),'credential_in_rpc_response',true);
});
await test('cross-origin response is refused despite a successful synthetic HTTP status',async()=>{
 const h=harness({intercept:c=>{if(c.url.includes('/token?')){const r=response({});Object.defineProperty(r,'url',{value:'https://foreign.example.invalid/auth/v1/token'});return r;}}});await denied(h.runtime.verifyOwner(),'response_origin',true);
});
await test('deadline covers a never-completing provider-independent native transport',async()=>{
 const h=harness({timeout:10,intercept:c=>c.url.includes('/token?')?new Promise(()=>{}):undefined});await denied(h.runtime.verifyOwner(),'request_timeout',true);assert.equal(h.calls.length,1);await denied(h.runtime.verifyOwner(),'already_stopped');
});
await test('native session expiry never refreshes a token or repeats password login',async()=>{
 const h=harness({intercept:c=>c.url.includes('/token?')?response({access_token:TOKEN,token_type:'bearer',expires_in:1,user:nativeOwner()}):undefined});await h.runtime.verifyOwner();h.clock.value+=2000;await denied(h.runtime.verifyOwner(),'native_session_expired');assert.equal(h.calls.filter(c=>c.url.includes('/token?')).length,1);assert.ok(h.calls.every(c=>!c.url.includes('refresh_token')));
});
await test('concurrent entry and external gate mutation cannot create duplicate native dispatch',async()=>{
 const m=gate();let release;const h=harness({manifest:m,permit:async e=>{await new Promise(r=>release=r);return {status:'consumed',executionId:e.executionId,requestNonce:e.requestNonce,manifestDigest:e.manifestDigest};}});const first=h.runtime.verifyOwner();await Promise.resolve();await denied(h.runtime.verifyOwner(),'in_flight');m.ownerId=FOREIGN;m.approval.status='pending';release();assert.equal((await first).id,OWNER);assert.equal(h.calls.filter(c=>c.url.includes('/token?')).length,1);
});
await test('only exact read-only missing-workspace error permits empty source preparation',async()=>{
 const h=harness({intercept:c=>c.url.endsWith('/busy_connected_builder_read_v1')?response({code:'40001',message:'Workspace unavailable',details:null,hint:null},500):undefined});assert.deepEqual(await h.runtime.probeEmptySource(),{empty:true});await h.runtime.ownerRpc('busy_connected_initialize_v1',{p_business_id:BUSINESS});assert.equal(h.calls.filter(c=>c.url.endsWith('/busy_connected_initialize_v1')).length,1);
});
await test('existing revision-one empty source is not mistaken for absence',async()=>{const h=harness();await denied(h.runtime.probeEmptySource(),'source_already_exists_or_unverified');assert.equal(h.calls.filter(c=>c.url.endsWith('/busy_connected_initialize_v1')).length,0);});
await test('wrong status/code/text/extra error data cannot masquerade as missing source',async()=>{
 const good={code:'40001',message:'Workspace unavailable',details:null,hint:null};
 for(const [body,status] of [[good,409],[good,200],[{...good,code:'42501'},500],[{...good,message:'Workspace unavailable '},500],[{...good,hint:'try again'},500],[{...good,execute:true},500],[{...good,details:PASSWORD},500]]){const h=harness({intercept:c=>c.url.endsWith('/busy_connected_builder_read_v1')?response(body,status):undefined});await denied(h.runtime.probeEmptySource());assert.equal(h.calls.filter(c=>c.url.endsWith('/busy_connected_initialize_v1')).length,0);}
});
await test('missing-source error body is itself type/size/JSON bounded',async()=>{
 for(const make of [()=>response({code:'40001',message:'Workspace unavailable',details:'x'.repeat(2049),hint:null},500),()=>new Response('SYNTHETIC_PRIVATE_ERROR',{status:500,headers:{'Content-Type':'application/json'}})]){const h=harness({intercept:c=>c.url.endsWith('/busy_connected_builder_read_v1')?make():undefined});await denied(h.runtime.probeEmptySource());}
});
await test('safe diagnostics and close expose no secrets or native refresh tokens',async()=>{
 const h=harness();await h.runtime.verifyOwner();const output=JSON.stringify({owner:await h.runtime.verifyOwner(),inspect:h.runtime.inspect()});for(const secret of [KEY,SERVICE,PASSWORD,TOKEN,REFRESH])assert.ok(!output.includes(secret));h.runtime.close();assert.equal(h.runtime.inspect().authenticated,false);await denied(h.runtime.verifyOwner(),'already_stopped');assert.equal(h.runtime.inspect().providerCalls,0);
});
console.log(JSON.stringify({passed,failed:0,hosted:false,nativeAuthCreated:false,nativeSignIn:false,syntheticTransportsOnly:true,realSecretsRead:0,providerCalls:0,spendGBP:0}));
