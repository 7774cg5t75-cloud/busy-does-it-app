import assert from 'node:assert/strict';
import {createCreativeDocumentLabAuthorities,CREATIVE_DOCUMENT_LAB_RPCS} from '../supabase/functions/busy-creative-document-pilot/labAuthorityHttp.mjs';

const key='sb_secret_synthetic_Lab_only_key_1234567890',ownerToken='synthetic.header.owner-token-only',legacy='synthetic.header.service-token-only';
const id='00000000-0000-4000-8000-000000000001',origin='https://sbvkrvksnruiclcvclbd.supabase.co';
const owner=()=>({id,is_anonymous:false,role:'authenticated',aud:'authenticated'});
const json=value=>new Response(JSON.stringify(value),{headers:{'Content-Type':'application/json'}});
let passed=0;
async function test(name,run){await run();passed++;console.log('PASS '+name);}
function setup(respond=()=>json({ok:true}),options={}){
 const calls=[];const authority=createCreativeDocumentLabAuthorities({serviceKey:key,fetchImpl:async(url,request)=>{calls.push({url,request});return respond(url,request);},...options});
 return {calls,authority};
}
const denied=async fn=>assert.rejects(fn,/Original Lab authority unavailable; no automatic replay/);

await test('only fixed native identity and original five RPC bindings are exposed',async()=>{
 const {authority}=setup();assert.ok(Object.isFrozen(authority));assert.deepEqual(Object.keys(authority),['authenticate','rpc']);
 assert.deepEqual(CREATIVE_DOCUMENT_LAB_RPCS,['busy_ai_context_v1','busy_ai_reserve_v1','busy_ai_dispatch_v1','busy_ai_finish_v1','busy_ai_operation_read_v1']);
 for(const serviceKey of ['',undefined,'not-a-key','sb_secret_\r\nInjected: value'])assert.throws(()=>createCreativeDocumentLabAuthorities({serviceKey,fetchImpl:()=>{throw Error('must not dispatch');}}));
 assert.throws(()=>createCreativeDocumentLabAuthorities({serviceKey:key,fetchImpl:null}));
 for(const requestTimeoutMs of [0,10001,Infinity])assert.throws(()=>createCreativeDocumentLabAuthorities({serviceKey:key,fetchImpl:()=>{},requestTimeoutMs}));
});
await test('native owner token is verified only with the exact Lab Auth user endpoint',async()=>{
 const {authority,calls}=setup(()=>json(owner()));assert.deepEqual(await authority.authenticate(ownerToken),{id});assert.equal(calls.length,1);
 const {url,request}=calls[0];assert.equal(url,origin+'/auth/v1/user');assert.equal(request.method,'GET');assert.equal(request.headers.apikey,key);assert.equal(request.headers.Authorization,'Bearer '+ownerToken);assert.equal(request.body,undefined);
 assert.equal(request.redirect,'error');assert.equal(request.credentials,'omit');assert.equal(request.cache,'no-store');assert.equal(request.referrerPolicy,'no-referrer');assert.ok(request.signal instanceof AbortSignal);
});
await test('anonymous, malformed and non-authenticated identities are denied',async()=>{
 for(const value of [{...owner(),is_anonymous:true},{...owner(),role:'service_role'},{...owner(),aud:'anon'},{...owner(),id:'not-a-uuid'},{id},null,[]]){
  const {authority,calls}=setup(()=>json(value));await denied(()=>authority.authenticate(ownerToken));assert.equal(calls.length,1);
 }
});
await test('missing, malformed and service-identity tokens are denied before any HTTP',async()=>{
 const {authority,calls}=setup(()=>json(owner()));for(const value of ['',null,'broken token','synthetic.header.\nvalue',legacy]){
  const target=value===legacy?setup(()=>json(owner()),{serviceKey:legacy}):{authority,calls};await denied(()=>target.authority.authenticate(value));assert.equal(target.calls.length,0);
 }
});
await test('all five RPCs use fixed Lab POST and original public schema contracts',async()=>{
 const {authority,calls}=setup((_url,request)=>json({echo:JSON.parse(request.body)}));
 for(const name of CREATIVE_DOCUMENT_LAB_RPCS){const args={p_actor:id,p_business:id};assert.deepEqual(await authority.rpc(name,args),{echo:args});}
 assert.equal(calls.length,5);
 for(let i=0;i<calls.length;i++){const {url,request}=calls[i];assert.equal(url,origin+'/rest/v1/rpc/'+CREATIVE_DOCUMENT_LAB_RPCS[i]);assert.equal(request.method,'POST');assert.equal(request.headers.apikey,key);assert.equal(request.headers.Authorization,undefined);assert.equal(request.headers['Content-Profile'],'public');assert.equal(request.headers['Accept-Profile'],'public');assert.equal(request.redirect,'error');}
});
await test('legacy native server JWT retains original SDK RPC authorization semantics',async()=>{
 const {authority,calls}=setup(()=>json({ok:true}),{serviceKey:legacy});await authority.rpc('busy_ai_context_v1',{});assert.equal(calls[0].request.headers.Authorization,'Bearer '+legacy);assert.equal(calls[0].request.headers.apikey,legacy);
});
await test('unsupported names and path or SQL injection never reach a transport',async()=>{
 const {authority,calls}=setup();for(const name of ['busy_connected_website_commit_v1','busy_ai_finish_v1/extra','../user','busy_ai_finish_v1?key=value','https://synthetic.invalid','DROP TABLE','BUSY_AI_CONTEXT_V1',null])await denied(()=>authority.rpc(name,{}));assert.equal(calls.length,0);
});
await test('getters, custom serialization, cycles and non-JSON request values are denied before HTTP',async()=>{
 const cyclic={};cyclic.self=cyclic;let getterCalls=0;const getter={get unsafe(){getterCalls++;return true;}};
 const {authority,calls}=setup();for(const value of [getter,{toJSON(){throw Error('must not call');}},cyclic,[],null,{missing:undefined},{value:()=>{}},{value:Infinity}])await denied(()=>authority.rpc('busy_ai_context_v1',value));assert.equal(getterCalls,0);assert.equal(calls.length,0);
});
await test('oversized and excessively deep requests are denied before HTTP',async()=>{
 const {authority,calls}=setup();let deep={};for(let i=0;i<42;i++)deep={child:deep};for(const value of [{text:'x'.repeat(650001)},deep])await denied(()=>authority.rpc('busy_ai_context_v1',value));assert.equal(calls.length,0);
});
await test('native HTTP denials and genuine database failures are not retried or interpreted as data',async()=>{
 for(const status of [401,403,409,429,500,503]){const {authority,calls}=setup(()=>new Response('sensitive synthetic error',{status,headers:{'Content-Type':'application/json'}}));await denied(()=>authority.rpc('busy_ai_reserve_v1',{}));assert.equal(calls.length,1);}
});
await test('redirect and foreign response identities are terminal',async()=>{
 for(const patch of [{url:'https://synthetic.invalid/elsewhere'},{redirected:true}]){const {authority,calls}=setup(()=>{const r=json({ok:true});for(const [key,value] of Object.entries(patch))Object.defineProperty(r,key,{value});return r;});await denied(()=>authority.rpc('busy_ai_context_v1',{}));assert.equal(calls.length,1);}
});
await test('invalid JSON, non-JSON and malformed content lengths are denied without private diagnostics',async()=>{
 for(const make of [()=>new Response('not json',{headers:{'Content-Type':'application/json'}}),()=>new Response('{}',{headers:{'Content-Type':'text/html'}}),()=>new Response('{}',{headers:{'Content-Type':'application/json','Content-Length':'-1'}}),()=>new Response('{}',{headers:{'Content-Type':'application/json','Content-Length':'650001'}})]){const {authority,calls}=setup(make);await denied(()=>authority.rpc('busy_ai_context_v1',{}));assert.equal(calls.length,1);}
});
await test('streamed byte limits and invalid UTF-8 fail closed',async()=>{
 for(const bytes of [new TextEncoder().encode('x'.repeat(650001)),new Uint8Array([0xff,0xfe])]){const {authority,calls}=setup(()=>new Response(bytes,{headers:{'Content-Type':'application/json'}}));await denied(()=>authority.rpc('busy_ai_context_v1',{}));assert.equal(calls.length,1);}
});
await test('Auth identity response has a separate small bound',async()=>{
 const {authority,calls}=setup(()=>json({...owner(),padding:'x'.repeat(32769)}));await denied(()=>authority.authenticate(ownerToken));assert.equal(calls.length,1);
});
await test('credential echoes are rejected and never returned or copied into exceptions',async()=>{
 for(const value of [key,legacy,ownerToken]){const {authority,calls}=setup(()=>json({...owner(),unexpected:value}),{serviceKey:value===legacy?legacy:key});await denied(()=>authority.authenticate(ownerToken));assert.equal(calls.length,1);}
 const {authority}=setup(()=>json({value:key}));await denied(()=>authority.rpc('busy_ai_finish_v1',{}));
});
await test('transport exception with private text becomes only a constant safe error',async()=>{
 const {authority,calls}=setup(()=>{throw Error('synthetic secret text '+key);});await assert.rejects(()=>authority.rpc('busy_ai_dispatch_v1',{}),error=>error.message==='Original Lab authority unavailable; no automatic replay'&&!error.message.includes(key)&&error.cause===undefined);assert.equal(calls.length,1);
});
await test('header timeout is bounded, aborts once and never retries',async()=>{
 let signal;const {authority,calls}=setup((_url,request)=>{signal=request.signal;return new Promise(()=>{});},{requestTimeoutMs:5});await denied(()=>authority.rpc('busy_ai_dispatch_v1',{}));assert.equal(calls.length,1);assert.equal(signal.aborted,true);
});
await test('body timeout covers stalled responses and leaves uncertain writes unreplayed',async()=>{
 let cancelled=false;const stream=new ReadableStream({start(controller){controller.enqueue(new TextEncoder().encode('{'));},cancel(){cancelled=true;}});
 const {authority,calls}=setup(()=>new Response(stream,{headers:{'Content-Type':'application/json'}}),{requestTimeoutMs:5});await denied(()=>authority.rpc('busy_ai_finish_v1',{}));assert.equal(calls.length,1);assert.equal(cancelled,true);
});
console.log(JSON.stringify({passed,failed:0,networkRequests:0,providerCalls:0,nativeSignIns:0,hostedWrites:0,credentials:'synthetic-only',source:'original native Auth and five original central AI RPC contracts'}));
