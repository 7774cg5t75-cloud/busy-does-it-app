import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {stableJson} from '../src/core/stableJson.mjs';
import {createCreativeInputCountPort,projectCreativeInputCountRequest,CREATIVE_INPUT_COUNT_ENDPOINT} from '../supabase/functions/busy-builder-proposals/creativeInputCountPort.mjs';
import {WEBSITE_CREATIVE_DOCUMENT_PROVIDER_VERSION} from '../supabase/functions/busy-builder-proposals/websiteIntelligenceProviderProjection.mjs';
import {CREATIVE_DOCUMENT_REVISED_PROFILE} from '../supabase/functions/busy-website-worker/websiteCreativePilotProfiles.mjs';

const hash=x=>createHash('sha256').update(x).digest('hex'),clone=x=>JSON.parse(JSON.stringify(x));
const secret='sk-synthetic-count-test-only-never-a-real-key';
function projection(){
 const input=stableJson({approved:{business:'Fictional image-free studio'},goal:'Propose three purposeful pages'}),schema={type:'object',additionalProperties:false,properties:{proposal:{type:'string'}},required:['proposal']};
 const wire={model:'gpt-6.1-sol',store:false,max_output_tokens:12000,reasoning:{effort:'medium'},service_tier:'default',tools:[],tool_choice:'none',input,text:{format:{type:'json_schema',name:'synthetic_count',strict:true,schema}}};
 return {ok:true,version:WEBSITE_CREATIVE_DOCUMENT_PROVIDER_VERSION,budgetProfile:CREATIVE_DOCUMENT_REVISED_PROFILE,model:wire.model,inputDigest:hash(input),schemaDigest:hash(stableJson(schema)),requestDigest:hash(stableJson(wire)),wire};
}
const json=(x={object:'response.input_tokens',input_tokens:4321},headers={})=>new Response(JSON.stringify(x),{status:200,headers:{'content-type':'application/json','x-request-id':'req_synthetic_only',...headers}});
function setup(overrides={}){
 const state={calls:0,keyReads:0,claims:0,requests:[]};
 const port=createCreativeInputCountPort({sha256:async x=>hash(x),clock:()=>1794120000000,claimApprovedCount:async()=>{state.claims++;return true;},readCredential:async()=>{state.keyReads++;return secret;},transport:async(url,options)=>{state.calls++;state.requests.push({url,options});return json();},...overrides});
 return {port,state};
}
let passed=0;
const test=async(name,fn)=>{await fn();passed++;console.log(JSON.stringify({name,status:'passed'}));};
const refused=async mutate=>{const p=projection();mutate(p);const {port,state}=setup();const r=await port(p);assert.equal(r.ok,false);assert.equal(state.calls,0);assert.equal(state.keyReads,0);assert.equal(state.claims,0);};
await test('count projection keeps exact message instructions/schema and omits only documented inference fields',async()=>{
 const p=projection(),before=stableJson(p),r=await projectCreativeInputCountRequest(p,async x=>hash(x)),body=JSON.parse(r.body);
 assert.deepEqual(Object.keys(body).sort(),['input','model','reasoning','text','tool_choice','tools']);assert.equal(body.input,p.wire.input);assert.deepEqual(body.text,p.wire.text);assert.equal(r.wireDigest,p.requestDigest);assert.equal(r.countBodyDigest,hash(r.body));assert.notEqual(r.wireDigest,r.countBodyDigest);assert.equal(stableJson(p),before);
});
await test('changed complete wire digest is denied before authority/key/HTTP',()=>refused(p=>p.requestDigest='0'.repeat(64)));
await test('changed original input digest is denied before authority/key/HTTP',()=>refused(p=>p.inputDigest='0'.repeat(64)));
await test('changed schema digest is denied before authority/key/HTTP',()=>refused(p=>p.schemaDigest='0'.repeat(64)));
await test('unknown inference field cannot silently disappear from counting',()=>refused(p=>{p.wire.instructions='unreviewed';p.requestDigest=hash(stableJson(p.wire));}));
await test('another model cannot reuse the first Sol count port',()=>refused(p=>{p.model=p.wire.model='gpt-6-astra';p.requestDigest=hash(stableJson(p.wire));}));
await test('legacy/unknown profile cannot reuse revised count evidence',()=>refused(p=>delete p.budgetProfile));
await test('tools cannot be introduced under an image-free no-tools approval',()=>refused(p=>{p.wire.tools=[{type:'web_search'}];p.requestDigest=hash(stableJson(p.wire));}));
await test('missing outer authority means no key read or HTTP',async()=>{let calls=0,keys=0;const p=createCreativeInputCountPort({sha256:async x=>hash(x),transport:async()=>{calls++;return json();},readCredential:async()=>{keys++;return secret;}});assert.equal((await p(projection())).ok,false);assert.equal(calls,0);assert.equal(keys,0);});
await test('denied exact protected approval means no key read or HTTP',async()=>{let calls=0,keys=0;const {port}=setup({claimApprovedCount:async()=>false,readCredential:async()=>{keys++;return secret;},transport:async()=>{calls++;return json();}});assert.equal((await port(projection())).ok,false);assert.equal(keys,0);assert.equal(calls,0);});
await test('uncertain one-use claim fails without secret or request',async()=>{let keys=0,calls=0;const {port}=setup({claimApprovedCount:async()=>{throw Error('lost-claim-ack');},readCredential:async()=>{keys++;return secret;},transport:async()=>{calls++;return json();}});const r=await port(projection());assert.equal(r.ok,false);assert.equal(r.mayReplay,false);assert.equal(keys,0);assert.equal(calls,0);});
await test('missing or malformed server credential cannot dispatch',async()=>{for(const key of [null,'short',secret+'\n']){let calls=0;const {port}=setup({readCredential:async()=>key,transport:async()=>{calls++;return json();}});assert.equal((await port(projection())).ok,false);assert.equal(calls,0);}});
await test('Supabase keys and JWT-shaped credentials never leave the server for OpenAI',async()=>{for(const key of ['sb_secret_'+'a'.repeat(64),'sb_publishable_'+'a'.repeat(64),'eyJ'+'.'+'a'.repeat(64)+'.'+'b'.repeat(64)]){let calls=0;const {port}=setup({readCredential:async()=>key,transport:async()=>{calls++;return json();}});const r=await port(projection());assert.equal(r.ok,false);assert.equal(calls,0);assert.equal(JSON.stringify(r).includes(key),false);}});
await test('one exact count returns digest-bound evidence without inference or self-verification',async()=>{
 const p=projection(),{port,state}=setup(),r=await port(p);assert.equal(r.ok,true);assert.equal(r.tokens,4321);assert.equal(r.fitsInputLimit,true);assert.equal(r.httpRequestsAttempted,1);assert.equal(r.inferenceCalls,0);assert.equal(r.independentlyVerified,false);assert.equal(r.completeRequest,true);assert.equal(r.mayReplay,false);assert.equal(r.wireDigest,p.requestDigest);assert.equal(r.responseDigest,hash(JSON.stringify({object:'response.input_tokens',input_tokens:4321})));assert.equal(state.keyReads,1);
 const {url,options}=state.requests[0];assert.equal(url,CREATIVE_INPUT_COUNT_ENDPOINT);assert.equal(options.method,'POST');assert.equal(options.redirect,'error');assert.equal(options.headers.Authorization,'Bearer '+secret);assert.equal(hash(options.body),r.countBodyDigest);assert.equal(JSON.stringify(r).includes(secret),false);
});
await test('valid count above8000 is retained and refuses inference fit without truncation/retry',async()=>{let calls=0;const {port}=setup({transport:async()=>{calls++;return json({object:'response.input_tokens',input_tokens:8001});}}),r=await port(projection());assert.equal(r.ok,false);assert.equal(r.status,'counted-input-limit-exceeded');assert.equal(r.tokens,8001);assert.equal(r.fitsInputLimit,false);assert.equal(r.mayReplay,false);assert.equal(calls,1);});
await test('duplicate and concurrent invocation cannot perform a second request',async()=>{const {port,state}=setup(),p=projection();const results=await Promise.all([port(p),port(p)]);assert.equal(results.filter(x=>x.ok).length,1);assert.equal(state.calls,1);assert.equal(state.keyReads,1);assert.equal((await port(p)).ok,false);assert.equal(state.calls,1);});
await test('non200 provider response is terminal without alternate endpoint or credential',async()=>{let calls=0;const {port}=setup({transport:async()=>{calls++;return new Response('denied',{status:403});}});const r=await port(projection());assert.equal(r.ok,false);assert.equal(r.httpStatus,403);assert.equal(calls,1);assert.equal(r.mayReplay,false);});
await test('malformed JSON response is rejected and cannot be replayed',async()=>{const {port}=setup({transport:async()=>new Response('{',{headers:{'content-type':'application/json'}})});const r=await port(projection());assert.equal(r.ok,false);assert.equal(r.status,'count-outcome-unconfirmed');assert.equal(r.mayReplay,false);});
await test('wrong response object, extra fields and invalid counts are rejected',async()=>{for(const value of [{object:'other',input_tokens:2},{object:'response.input_tokens',input_tokens:2,extra:true},...[-1,0,2.5,1000001].map(input_tokens=>({object:'response.input_tokens',input_tokens}))]){const {port}=setup({transport:async()=>json(value)});assert.equal((await port(projection())).ok,false);}});
await test('content-length and streamed-body oversize are independently bounded',async()=>{for(const response of [()=>json(undefined,{'content-length':'4097'}),()=>new Response(' '.repeat(4097),{headers:{'content-type':'application/json'}})]){const {port}=setup({transport:async()=>response()});assert.equal((await port(projection())).ok,false);}});
await test('nonJSON content type and malformed UTF8 are rejected',async()=>{for(const response of [()=>new Response('{}',{headers:{'content-type':'text/html'}}),()=>new Response(new Uint8Array([0xc3,0x28]),{headers:{'content-type':'application/json'}})]){const {port}=setup({transport:async()=>response()});assert.equal((await port(projection())).ok,false);}});
await test('redirects and changed effective response origins are refused',async()=>{for(const response of [()=>new Response('',{status:302,headers:{location:'https://example.invalid'}}),()=>{const r=json();Object.defineProperty(r,'url',{value:'https://example.invalid'});return r;}]){const {port}=setup({transport:async(_u,o)=>{assert.equal(o.redirect,'error');return response();}});assert.equal((await port(projection())).ok,false);}});
await test('redirected response is rejected even when a transport reports the fixed final URL',async()=>{const {port}=setup({transport:async()=>{const r=json();Object.defineProperty(r,'url',{value:CREATIVE_INPUT_COUNT_ENDPOINT});Object.defineProperty(r,'redirected',{value:true});return r;}});const r=await port(projection());assert.equal(r.ok,false);assert.equal(r.mayReplay,false);});
await test('transport error never exposes a synthetic secret',async()=>{const {port}=setup({transport:async()=>{throw Error(secret);}});const r=await port(projection());assert.equal(r.ok,false);assert.equal(JSON.stringify(r).includes(secret),false);});
await test('header timeout and stuck-body cleanup cannot wait indefinitely',async()=>{
 const original=globalThis.setTimeout;globalThis.setTimeout=(fn,ms)=>{assert.equal(ms,10000);queueMicrotask(fn);return 0;};
 try{for(const transport of [async()=>new Promise(()=>{}),async()=>new Response(new ReadableStream({pull:()=>new Promise(()=>{}),cancel:()=>new Promise(()=>{})}),{headers:{'content-type':'application/json'}})]){const {port}=setup({transport});const r=await port(projection());assert.equal(r.ok,false);assert.equal(r.httpRequestsAttempted,1);assert.equal(r.mayReplay,false);}}
 finally{globalThis.setTimeout=original;}
});
console.log(JSON.stringify({version:'busy.creative-input-count-port.check.v1',passed,failed:0,realProviderCalls:0,realCredentialsRead:0,hostedWrites:0,paidSpendingGBP:0}));
