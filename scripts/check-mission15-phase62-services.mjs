import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {createRequire} from 'node:module';import vm from 'node:vm';
const require=createRequire(import.meta.url),babel=require('@babel/core'),{parse}=require('@babel/parser');
function load(path,names,fetch){
 let source=readFileSync(path,'utf8');const ast=parse(source,{sourceType:'module',plugins:['typescript']});
 for(const n of ast.program.body.filter(n=>n.type==='ImportDeclaration').reverse())source=source.slice(0,n.start)+source.slice(n.end);
 assert.match(source,/TRUSTED_SNAPSHOT_PROJECTIONS_ENABLED = false/);source=source.replace('TRUSTED_SNAPSHOT_PROJECTIONS_ENABLED = false','TRUSTED_SNAPSHOT_PROJECTIONS_ENABLED = true');
 source+='\n'+names.map(n=>'exports.'+n+'='+n+';').join('\n');const exports={};
 const code=babel.transformSync(source,{filename:path,babelrc:false,configFile:false,plugins:[[require('@babel/plugin-transform-typescript'),{allowDeclareFields:true}]]}).code;
 vm.runInNewContext(code,{exports,fetch,Date,Intl,URLSearchParams,AbortSignal,Response,Deno:{env:{get:k=>k==='SUPABASE_URL'?'https://inert.invalid':k==='SUPABASE_SERVICE_ROLE_KEY'?'inert-service-key':''},serve:()=>{}}},{timeout:10000});return exports;
}
const calls=[];let denied=false;
const watch=load('supabase/functions/busy-production-watch/index.ts',['runWatch','candidateAlerts'],async(url,o)=>{calls.push([url,o]);assert.ok(!url.includes('expo.host'));if(url.includes('busy_push_devices'))return new Response(JSON.stringify([{user_id:'owner',business_id:'business',expo_push_token:'inert'}]));assert.ok(url.endsWith('/rpc/busy_service_alert_facts_v1'));assert.deepEqual(JSON.parse(o.body),{p_business_id:'business',p_recipient_id:'owner'});return new Response(JSON.stringify(denied?{message:'Owner recipient required'}:{customers:[],replyActions:{}}),{status:denied?403:200});});
await watch.runWatch();assert.equal(calls.length,2);denied=true;await assert.rejects(()=>watch.runWatch(),/Owner recipient/);assert.equal(calls.length,4);assert.ok(calls.every(([url])=>!url.includes('busy_business_snapshots')));
let countCalls=0,value={activeWorkspaces7d:7};const founder=load('supabase/functions/busy-founder-ops/index.ts',['snapshotActivityCount'],async(url,o)=>{countCalls++;assert.ok(url.endsWith('/rpc/busy_service_snapshot_count_v1'));assert.equal(o.method,'POST');return new Response(JSON.stringify(value));});
assert.equal(await founder.snapshotActivityCount(),7);for(const bad of [{activeWorkspaces7d:7,payload:{}},{activeWorkspaces7d:-1},{activeWorkspaces7d:'7'},null]){value=bad;await assert.rejects(()=>founder.snapshotActivityCount());}assert.equal(countCalls,5);
console.log('PASS actual Edge watcher parent uses finite owner-recipient alert RPC and never falls back after denial; actual founder counter uses aggregate-only RPC, validates shape and rejects malformed results. No provider IO, notifications or hosted access.');
