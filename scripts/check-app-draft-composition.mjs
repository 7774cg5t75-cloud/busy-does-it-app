import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {transformSync} from '@babel/core';
import ts from '@babel/plugin-transform-typescript';
import {retainAppDraftDesign as retain,proposeAppModuleToggle as toggle,appConfigLockReason} from '../src/core/appDraftComposition.mjs';
import {executeAppDraftMutation as mutate} from '../src/core/appDraftMutation.mjs';
const businessId='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',id='cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const config={schemaVersion:3,surface:'busy_business_app',modules:['business_profile','services','contact','gallery'].map(key=>({key,enabled:true,status:'available'})),navigation:['business_profile','gallery','services','contact'],presentation:{layoutDensity:'airy'},builderPlan:{summary:'Keep'},offers:[{title:'Owner offer'}],loyalty:{stampTarget:8},publicProfile:{about:'Owner copy'}};
const rebuilt={...config,schemaVersion:1,surface:'busy_mini_app',navigation:['business_profile','services','contact','gallery'],presentation:undefined,builderPlan:undefined,offers:undefined,loyalty:undefined};
const r=retain(config,rebuilt);assert.equal(r.ok,true);for(const k of ['schemaVersion','surface','navigation','presentation','builderPlan','offers','loyalty'])assert.deepEqual(r.nextConfig[k],config[k]);
const p=toggle(config,{moduleKey:'contact',enabled:false});assert.equal(p.ok,true);assert.deepEqual(p.nextConfig.navigation,['business_profile','gallery','services']);assert.equal(p.nextConfig.presentation,config.presentation);
const on=toggle(p.nextConfig,{moduleKey:'contact',enabled:true});assert.deepEqual(on.nextConfig.navigation,['business_profile','gallery','services','contact']);
const locked={...config,presentation:{...config.presentation,ownerLockedElements:['services']}};assert.equal(toggle(locked,{moduleKey:'gallery',enabled:false}).ok,false);assert.equal(toggle(locked,{moduleKey:'services',enabled:false}).ok,false);
assert.ok(appConfigLockReason({...config,presentation:{ownerLockedElements:['copy']}},{...config,publicProfile:{about:'Changed'},presentation:{ownerLockedElements:['copy']}}));
const app={id,business_id:businessId,draft_revision:4,draft_config:config},scope={userId:'owner',businessId,app};let current=true,calls=0;
const saved={...app,draft_revision:5,draft_config:p.nextConfig};
assert.equal((await mutate({action:'set_module',payload:{moduleKey:'contact',enabled:false},scope,isCurrent:()=>current,send:async(action,args)=>{calls++;assert.equal(args.expectedRevision,4);assert.equal(args.appId,id);return {ok:true,app:saved,status:{app:saved}};}})).app,saved);
await assert.rejects(mutate({action:'set_module',payload:{moduleKey:'contact',enabled:false},scope,isCurrent:()=>current,send:async()=>{current=false;return {ok:true,app:saved,status:{app:saved}};}}),/workspace changed/);current=true;
await assert.rejects(mutate({action:'set_module',payload:{moduleKey:'contact',enabled:false},scope,isCurrent:()=>true,send:async()=>({ok:true,app:{...saved,business_id:'other'},status:{app:saved}})}),/receipt/);
// First build inserts revision 1; applying the first reviewed plan performs
// the existing initial draft + conditional plan update and returns revision 2.
for(const [action,revision] of [['build_draft',1],['apply_app_plan',2]]){
 const first={...app,draft_revision:revision};
 assert.equal((await mutate({action,payload:{},scope:{...scope,app:null},isCurrent:()=>true,send:async()=>({ok:true,app:first,status:{app:first}})})).app.draft_revision,revision);
 const wrong={...first,draft_revision:revision+1};
 await assert.rejects(mutate({action,payload:{},scope:{...scope,app:null},isCurrent:()=>true,send:async()=>({ok:true,app:wrong,status:{app:wrong}})}),/receipt/);
}
// Execute the actual trusted setModule implementation with a fluent fake DB;
// verify its source-revision guard and exact conditional-write predicates.
const edge=readFileSync('supabase/functions/busy-mini-apps/index.ts','utf8');const start=edge.indexOf('function requireAppDraftRevision('),end=edge.indexOf('async function movePrivateAppModule(',start);
const code=transformSync(edge.slice(start,end),{filename:'edge.ts',plugins:[ts],configFile:false,babelrc:false}).code;
let filters=[],updates=0;
const db={from:()=>({update:()=>{updates++;return db;}}),eq:(...args)=>{filters.push(args);return db;},select:()=>db,single:async()=>({data:saved,error:null})};
const set=Function('appForBusiness','moduleCatalog','loyaltyReady','proposeAppModuleToggle','supabase',code+';return setModule;')(async()=>app,async()=>config.modules.map(x=>({module_key:x.key,status:x.status})),()=>true,toggle,db);
await assert.rejects(set(businessId,'contact',false,{appId:id,expectedRevision:3}),/private app changed/);assert.equal(updates,0);
await set(businessId,'contact',false,{appId:id,expectedRevision:4});assert.deepEqual(filters,[['id',id],['business_id',businessId],['draft_revision',4]]);
for(const name of ['appDraftComposition','appOwnerLocks'])assert.equal(readFileSync(`src/core/${name}.mjs`,'utf8'),readFileSync(`supabase/functions/busy-mini-apps/${name}.mjs`,'utf8'));
console.log('PASS: preserved Studio/plan state, stable toggle order, lock displacement, exact tenant/revision receipt, stale response rejection and actual Edge toggle CAS predicates. Fake transport/database only.');
