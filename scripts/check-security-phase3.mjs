import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {stripTypeScriptTypes} from 'node:module';
import {publicMiniAppDestination} from '../supabase/functions/busy-mini-app-link/publicDestination.mjs';
import {createOfflineProviderConnections} from '../supabase/functions/_shared/offlineProviderConnections.mjs';
import {legacyProviderAdmission} from '../supabase/functions/_shared/legacyProviderAdmission.mjs';
import {legacyAiAdmissionStatus} from '../supabase/functions/_shared/legacyAiAdmission.mjs';
const root='https://pnjdlogwegnqbsfpcofw.supabase.co',B='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',A='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',V='cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const path=`/storage/v1/object/public/busy-mini-app-public/${B}/${A}/live/index.html`;
const app={id:A,business_id:B,current_live_version_id:V,status:'live',public_slug:'fixture',public_web_url:root+path,public_web_version_id:V,public_web_status:'ready'};
assert.equal(publicMiniAppDestination(app,root),root+path);
for(const url of ['https://foreign.invalid'+path,root+path+'?token=private',root+path+'#target',root+path.replace(B,A),'https://name:pass@pnjdlogwegnqbsfpcofw.supabase.co'+path,root+':444'+path])assert.equal(publicMiniAppDestination({...app,public_web_url:url},root),null);
assert.equal(publicMiniAppDestination({...app,public_web_version_id:A},root),null);
const code=stripTypeScriptTypes(readFileSync('supabase/functions/_shared/boundedRequest.ts','utf8'),{mode:'transform'}).replaceAll('export ','');const {boundedJson,BoundedRequestError}=Function(code+';return {boundedJson,BoundedRequestError};')();
function load(area,store){let handle;const text=readFileSync('supabase/functions/'+area+'/index.ts','utf8').replace(/^import[\s\S]*?from\s+['"][^'"]+['"];\s*/gm,'');Function('Deno','createClient','fetch','publicMiniAppDestination','boundedJson','BoundedRequestError',stripTypeScriptTypes(text,{mode:'transform'}))({env:{get:k=>k==='SUPABASE_URL'?root:k==='SUPABASE_SERVICE_ROLE_KEY'?'inert-service':''},serve:fn=>handle=fn},()=>store,()=>{throw Error('External network forbidden');},publicMiniAppDestination,boundedJson,BoundedRequestError);return handle;}
let row=app;const query={select(){return this;},eq(){return this;},in(){return this;},async maybeSingle(){return {data:row};}};const link=load('busy-mini-app-link',{from:()=>query,rpc:async()=>({error:null})});
let response=await link(new Request('https://local.invalid/?slug=fixture'));assert.equal(response.status,302);assert.ok(response.headers.get('location').startsWith(root+path+'?entry='));
row={...app,public_web_url:'https://foreign.invalid/'};response=await link(new Request('https://local.invalid/?slug=fixture'));assert.equal(response.status,200);assert.equal(response.headers.get('location'),null);
for(const area of ['busy-website-health','busy-website-signals','busy-website-provider','busy-website-worker']){
 const handler=load(area,{from(){throw Error('Privileged lookup forbidden before bounded parse');}});
 const r=await handler(new Request('https://local.invalid',{method:'POST',body:' '.repeat(16385)+'{}',headers:{Authorization:'Bearer inert-service'}}));assert.equal(r.status,413,area+' must reject an oversized authenticated request before privileged work');
}
assert.equal(legacyProviderAdmission().allowed,false);assert.equal(legacyAiAdmissionStatus().allowed,false);
assert.throws(()=>createOfflineProviderConnections({simulation:false}));let rpcs=0,exchanges=0;const session=createOfflineProviderConnections({simulation:true,authenticate:async()=>({id:A}),rpc:async()=>{rpcs++;throw Error('inert claim unavailable');},exchangeOffline:async()=>{exchanges++;}});
await assert.rejects(()=>session.callback(B,'meta','f'.repeat(64),'code','https://foreign.invalid/callback'));assert.equal(rpcs,0);assert.equal(exchanges,0);
assert.equal((await session.callback(B,'meta','f'.repeat(64),'code',root+'/functions/v1/busy-social-publish/callback/meta')).state,'unconfirmed');assert.equal(exchanges,0);
for(const [file,job,phrase] of [['apply-v13.yml','apply','APPROVE_LEGACY_SOURCE_SWEEP'],['eas-link.yml','link','APPROVE_EAS_PROJECT_LINK'],['publish-snack.yml','publish','APPROVE_EXTERNAL_SNACK_PREVIEW']]){
 const text=readFileSync('.github/workflows/'+file,'utf8');assert.ok(text.includes("github.event_name == 'workflow_dispatch' && inputs.approval_phrase == '"+phrase+"'"));assert.ok(text.includes('permissions:\n  contents: read'));assert.ok(text.includes('  '+job+':'));assert.ok(!/uses:\s*actions\/[\w-]+@v\d/.test(text));assert.ok(!/git (?:pull --rebase|rebase )/.test(text));
 if(file!=='apply-v13.yml')assert.ok(text.includes("vars.BUSY_LEGACY_TOOLCHAIN_REVIEWED == 'true'"));
}
const wf=readFileSync('.github/workflows/real-staging-auth-v3128.yml','utf8');assert.ok(wf.includes('persist-credentials: false'));assert.ok(wf.includes('npm ci --ignore-scripts'));assert.ok(!/uses:\s*actions\/[\w-]+@v\d/.test(wf));
console.log('PASS phase3 actual public-link redirect allowlist and four internal streamed request limits; offline-provider denial/no-replay; explicit manual workflow/immutable-action boundaries. No external provider, workflow, native or hosted acceptance.');
