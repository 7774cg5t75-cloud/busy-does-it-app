import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {legacyAiAdmissionStatus,requireCentralAiAdmission} from '../supabase/functions/_shared/legacyAiAdmission.mjs';
assert.equal(legacyAiAdmissionStatus().allowed,false);assert.throws(()=>requireCentralAiAdmission(),e=>e.name==='CentralAiAdmissionRequired');
const worker=readFileSync('cloudflare/busy-website-screenshot/worker.js','utf8');
const selected='https://capture.example.invalid/storage/v1/object/sign/busy-website-preview/business/deployments/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/home.html?token=fictional';
let final=selected,screenshots=0,closed=0,intercept;
const page={setViewport:async()=>{},setRequestInterception:async()=>{},on:(_,fn)=>{intercept=fn;},setJavaScriptEnabled:async()=>{},goto:async()=>{},url:()=>final,screenshot:async()=>{screenshots++;return new Uint8Array([1]);}};
globalThis.__busyHistoricalBrowser={launch:async()=>({newPage:async()=>page,close:async()=>{closed++;}})};
try{
 const source=worker.replace('import puppeteer from "@cloudflare/puppeteer";','const puppeteer=globalThis.__busyHistoricalBrowser;');
 const {default:runtime}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
 const env={BUSY_SCREENSHOT_SECRET:'inert-fixture-only',BUSY_SUPABASE_HOST:'capture.example.invalid',BROWSER:{}};
 const req=()=>new Request('https://local.invalid',{method:'POST',headers:{authorization:'Bearer inert-fixture-only','content-type':'application/json'},body:JSON.stringify({url:selected,expectedDeployment:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',viewport:{width:390,height:844}})});
 final=selected.replace('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb');
 assert.equal((await runtime.fetch(req(),env)).status,403,'Capture must remain bound to the selected immutable document');assert.equal(screenshots,0);assert.equal(closed,1);
 final=selected;assert.equal((await runtime.fetch(req(),env)).status,200);assert.equal(screenshots,1);let result='';intercept({url:()=>selected.replace('home.html','other.html'),resourceType:()=> 'document',continue:()=>{result='continued';},abort:()=>{result='aborted';}});assert.equal(result,'aborted');
}finally{delete globalThis.__busyHistoricalBrowser;}
const command=readFileSync('supabase/functions/busy-command/index.ts','utf8');assert.ok(!command.includes(String.raw`.replace(/^Bearer\\s+/i,"")`),'Voice route must parse the actual HTTP Bearer scheme');
console.log('PASS historical security boundaries: legacy admission closed; original capture target/navigation scope enforced; voice scheme parse corrected. Browser/transport inert; no rendered visual evidence.');
const {matchesConfiguredPrototypeOwner}=await import('../supabase/functions/_shared/legacyWorkspaceIdentity.mjs');
const ownerId='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';assert.equal(matchesConfiguredPrototypeOwner({id:ownerId},ownerId),true);assert.equal(matchesConfiguredPrototypeOwner({id:'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',email:'owner@example.invalid'},ownerId),false);assert.equal(matchesConfiguredPrototypeOwner({id:ownerId},''),false);assert.equal(matchesConfiguredPrototypeOwner({user_metadata:{owner:true}},ownerId),false);
const publishing=readFileSync('supabase/functions/busy-social-publish/index.ts','utf8');assert.ok(publishing.includes('const owner = await requireOwner(request);'));assert.ok(!publishing.includes('action === "process_due" ? null'));assert.ok(publishing.includes('matchesConfiguredPrototypeOwner(user,'));
console.log('PASS original legacy provider identity: verified server ID required, no email/metadata grant, no owner-authentication exception for batch actions.');
const {providerMessagePage}=await import('../supabase/functions/_shared/providerMessagePage.mjs');
const message=providerMessagePage(400,'<unsafe-heading>','<img src=x onerror="unsafe()"> & private words');const markup=await message.text();assert.ok(!markup.includes('<img'));assert.ok(!markup.includes('<unsafe-heading>'));assert.ok(markup.includes('&lt;img'));assert.ok(message.headers.get('content-security-policy').includes("default-src 'none'"));assert.equal(message.headers.get('cache-control'),'no-store');assert.ok(publishing.includes('return providerMessagePage(status,title,body);'));
console.log('PASS shared provider-message rendering escapes untrusted text and denies script/frame/form capabilities.');
const {matchesConfiguredProviderSubject,providerEventAppliesToConnection}=await import('../supabase/functions/_shared/legacyWorkspaceIdentity.mjs');
const providerEvent={algorithm:'HMAC-SHA256',user_id:'123456',issued_at:1800000000},connection={id:'original',provider_subject_id:'123456',connected_at:new Date(1799999900000).toISOString(),updated_at:new Date(1799999950000).toISOString()};assert.equal(matchesConfiguredProviderSubject(providerEvent,''),false);assert.equal(matchesConfiguredProviderSubject({...providerEvent,user_id:'654321'},'123456'),false);assert.equal(providerEventAppliesToConnection(providerEvent,'123456',connection,1800000001000),true);assert.equal(providerEventAppliesToConnection(providerEvent,'123456',{...connection,connected_at:new Date(1800000001000).toISOString()},1800000002000),false);assert.equal(providerEventAppliesToConnection({...providerEvent,issued_at:1800001000},'123456',connection,1800000001000),false);assert.ok(!publishing.includes('BUSY data deletion complete'));
console.log('PASS callback subject, stale-event and source-version boundaries; no unverified deletion-complete claim.');

assert.equal(providerEventAppliesToConnection(providerEvent,'123456',{...connection,provider_subject_id:undefined},1800000001000),false,'Unmapped legacy connections must remain unchanged');
const guarded={"busy-ai-intake":['analyseWithOpenAI'],"busy-social-content":['createContent'],"busy-command":['transcribeAudio','routeOperator','interpretWebsitePageLanguage'],"busy-website-design-review":['runVision','compareVision'],"busy-mini-apps":['reviewAppDesignScreenshot']};
const {requireTools}=await import('./testing/tooling.mjs'),{parse}=requireTools('@babel/parser');
for(const [area,names]of Object.entries(guarded)){
 const source=readFileSync('supabase/functions/'+area+'/index.ts','utf8'),ast=parse(source,{sourceType:'module',plugins:['typescript']});
 for(const name of names){const fn=ast.program.body.find(n=>n.type==='FunctionDeclaration'&&n.id.name===name);assert.equal(fn?.body.body[0]?.expression?.callee?.name,'requireCentralAiAdmission','Legacy inference must fail closed before provider or quota side effects: '+name);}
}
const mini=readFileSync('supabase/functions/busy-mini-apps/index.ts','utf8');assert.ok(mini.includes('if(!legacyAiAdmissionStatus().allowed)return fallback;'));assert.ok(readFileSync('supabase/functions/busy-conversation-extract/index.ts','utf8').includes('if(!legacyAiAdmissionStatus().allowed)return reply('));assert.equal(legacyAiAdmissionStatus({enabled:true,reservation:'forged'}).allowed,false);
console.log('PASS all10 legacy direct-inference paths are denied or use original deterministic fallback; environment keys cannot grant admission.');
// Find direct model HTTP calls across every original Edge entry, not just the
// recently touched files. This is a finite source regression, not taint analysis.
const {readdirSync}=await import('node:fs');const direct=[];
for(const area of readdirSync('supabase/functions',{withFileTypes:true}).filter(x=>x.isDirectory()&&x.name!=='_shared')){
 let source;try{source=readFileSync('supabase/functions/'+area.name+'/index.ts','utf8');}catch{continue;}
 const ast=parse(source,{sourceType:'module',plugins:['typescript']}),constants=new Map();
 for(const node of ast.program.body)if(node.type==='VariableDeclaration')for(const d of node.declarations)if(d.id?.type==='Identifier'&&d.init?.type==='StringLiteral')constants.set(d.id.name,d.init.value);
 const walk=(node,scope='<handler>')=>{if(!node||typeof node!=='object')return;if(node.type==='FunctionDeclaration')scope=node.id.name;if(node.type==='CallExpression'&&node.callee?.name==='fetch'){const arg=node.arguments[0],url=arg?.type==='StringLiteral'?arg.value:arg?.type==='Identifier'?constants.get(arg.name):'';if(typeof url==='string'&&/^https:\/\/(?:api\.openai\.com|api\.anthropic\.com|generativelanguage\.googleapis\.com)\//.test(url))direct.push(area.name+':'+scope);}for(const [key,value]of Object.entries(node))if(!['loc','comments','tokens','start','end'].includes(key)){if(Array.isArray(value))value.forEach(x=>walk(x,scope));else if(value&&typeof value==='object')walk(value,scope);}};walk(ast);
}
const approvedLegacy=['busy-ai-intake:analyseWithOpenAI','busy-social-content:createContent','busy-command:transcribeAudio','busy-command:routeOperator','busy-command:interpretWebsitePageLanguage','busy-website-design-review:runVision','busy-website-design-review:compareVision','busy-mini-apps:aiAppPlan','busy-mini-apps:reviewAppDesignScreenshot','busy-conversation-extract:<handler>'];assert.deepEqual(direct.sort(),approvedLegacy.sort(),'New direct model calls need explicit central admission integration and review');
console.log('PASS repository Edge-entry direct-inference census matches the denied legacy inventory; no new uncatalogued model endpoint.');
for(const area of ['busy-ai-intake','busy-social-content','busy-command']){const source=readFileSync('supabase/functions/'+area+'/index.ts','utf8'),entry=source.slice(source.indexOf('Deno.serve('));assert.ok(entry.indexOf('if(!legacyAiAdmissionStatus().allowed)return json(503')<entry.indexOf('  try {'),'Disabled inference-only entries refuse before reading/parsing uploaded content');}
