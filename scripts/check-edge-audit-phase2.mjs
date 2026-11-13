import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';
import {legacyProviderAdmission} from '../supabase/functions/_shared/legacyProviderAdmission.mjs';
import {providerMessagePage} from '../supabase/functions/_shared/providerMessagePage.mjs';
import * as identity from '../supabase/functions/_shared/legacyWorkspaceIdentity.mjs';
const boundedSource=stripTypeScriptTypes(readFileSync('supabase/functions/_shared/boundedRequest.ts','utf8'),{mode:'transform'}).replaceAll('export ','');
const {boundedJson,BoundedRequestError}=Function(boundedSource+';return {boundedJson,BoundedRequestError};')();
assert.equal(legacyProviderAdmission({enabled:true,ownerApproved:true}).allowed,false);
const request=(body,headers={})=>new Request('https://local.invalid',{method:'POST',body,headers});
assert.deepEqual(await boundedJson(request('{"safe":true}'),32),{safe:true});
for(const headers of [{},{'content-length':'1'},{'content-length':'99999'}])await assert.rejects(()=>boundedJson(request('x'.repeat(33),headers),32),e=>e.status===413);
let cancelled=0,reads=0;const stream=new ReadableStream({pull(c){reads++;c.enqueue(new Uint8Array(17));},cancel(){cancelled++;}});
await assert.rejects(()=>boundedJson(new Request('https://local.invalid',{method:'POST',body:stream,duplex:'half'}),32),e=>e.status===413);assert.equal(cancelled,1);assert.ok(reads<=4);
await assert.rejects(()=>boundedJson(request('{'),32),e=>e.status===400);
await assert.rejects(()=>boundedJson(request(new Uint8Array([255])),32),e=>e.status===400);
const stalled=new ReadableStream({pull(){},cancel(){cancelled++;}});await assert.rejects(()=>boundedJson(new Request('https://local.invalid',{method:'POST',body:stalled,duplex:'half'}),32,10),e=>e.status===408);
// Execute original checked-in handlers with inert Auth/DB/provider dependencies.
// No process environment/credential values, external network or model execution.
const store=new Proxy({}, {get:()=>()=>store});
function load(area,{fetch=()=>{throw Error('Unexpected network');},env={}}={}){
 let handle;const source=readFileSync('supabase/functions/'+area+'/index.ts','utf8').replace(/^import[\s\S]*?from\s+['"][^'"]+['"];\s*/gm,'');
 const code=stripTypeScriptTypes(source,{mode:'transform'});
 const deno={env:{get:k=>env[k]??({SUPABASE_URL:'https://example.invalid',SUPABASE_SERVICE_ROLE_KEY:'fixture-service',SUPABASE_ANON_KEY:'fixture-public'}[k])},serve:fn=>{handle=fn;}};
 Function('Deno','fetch','createClient','legacyProviderAdmission','providerMessagePage','matchesConfiguredPrototypeOwner','matchesConfiguredProviderSubject','providerEventAppliesToConnection','boundedJson','BoundedRequestError',code)(deno,fetch,()=>store,legacyProviderAdmission,providerMessagePage,identity.matchesConfiguredPrototypeOwner,identity.matchesConfiguredProviderSubject,identity.providerEventAppliesToConnection,boundedJson,BoundedRequestError);
 return handle;
}
let calls=0;const never=()=>{calls++;throw Error('Provider must remain closed');};
for(const area of ['busy-calendar-oauth','busy-calendar-sync']){
 const handle=load(area,{fetch:never});
 const req=area.endsWith('oauth')?new Request('https://local.invalid/?code=fixture&state=fixture'):request('{"action":"sync"}');
 assert.equal((await handle(req)).status,503);assert.equal(calls,0);
}
const social=load('busy-social-publish',{fetch:never});
for(const url of ['https://local.invalid/callback/meta?code=fixture&state=fixture','https://local.invalid/?action=callback&provider=meta&code=fixture&state=fixture','https://local.invalid/?action=deauthorize','https://local.invalid/?action=data_delete']){
 const method=url.includes('deauthorize')||url.includes('data_delete')?'POST':'GET';assert.equal((await social(new Request(url,{method}))).status,503);assert.equal(calls,0);
}
const guest=load('busy-mini-app-guest',{fetch:never});assert.equal((await guest(request(' '.repeat(33000)+'{\"action\":\"unsupported\"}'))).status,413);assert.equal(calls,0);
const guestSource=readFileSync('supabase/functions/busy-mini-app-guest/index.ts','utf8');assert.ok(guestSource.includes('await boundedJson(req,32768)'));
for(const area of ['busy-website-health','busy-website-signals','busy-website-provider','busy-website-worker'])assert.ok(readFileSync('supabase/functions/'+area+'/index.ts','utf8').includes('SERVICE_ROLE_KEY && authorization ==='));
const health=readFileSync('supabase/functions/busy-website-health/index.ts','utf8');assert.ok(health.includes('redirect: "error"'));assert.ok(!health.includes('await response.text()'));assert.ok(health.includes('bytes>500000'));
console.log('PASS phase2: actual OAuth/provider callbacks closed before external access; byte-bounded/chunked/UTF8/deadline parsing; private service-auth empty configuration denied; health redirect/body bounds. Inert external dependencies, no hosted acceptance.');
