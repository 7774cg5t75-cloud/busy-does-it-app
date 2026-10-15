import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {transformSync} from '@babel/core';
import ts from '@babel/plugin-transform-typescript';
import {createAppStudioSession as session} from '../src/core/appStudioSession.mjs';
import {proposeCoordinatedAppChanges as plan} from '../src/core/appCoordinatedStudio.mjs';
import {proposeAppModuleToggle} from '../src/core/appDraftComposition.mjs';
const businessId='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',id='cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const config={modules:['business_profile','services','contact'].map(key=>({key,enabled:true,status:'available'})),navigation:['business_profile','services','contact'],publicProfile:{about:'Owner copy'},presentation:{layoutDensity:'compact'}};
const app={id,business_id:businessId,draft_revision:4,draft_config:config};
let failures=0;async function check(label,run){try{await run();console.log('PASS '+label);}catch(e){failures++;console.error('FAIL '+label+': '+e.message);}}
await check('uncertain undo cannot be revived by clearing its preview',async()=>{
 const s=session();s.setContext({businessId,ownerId:'owner',app});const proposal=plan(config,[{kind:'appearance',field:'layoutDensity',value:'airy'}]);s.prepare(proposal);
 const saved={...app,draft_revision:5,draft_config:proposal.nextConfig};await s.approve(async()=>({ok:true,status:{app:saved},newRevision:5,undoOperations:proposal.undoOperations}));s.setContext({businessId,ownerId:'owner',app:saved});
 await s.undo(async()=>{throw Error('lost confirmation');});s.prepare(null);assert.equal(s.snapshot().canUndo,false);
});
await check('business-profile lock protects Studio copy',()=>{assert.equal(plan({...config,presentation:{ownerLockedElements:['business_profile']}},[{kind:'text',field:'about',value:'Changed'}]).ok,false);});
await check('copy lock protects owner-written services',()=>{assert.equal(plan({...config,presentation:{ownerLockedElements:['copy']}},[{kind:'services',value:[{name:'Changed',description:'Owner wording'}]}]).ok,false);});
await check('trusted module route rejects an omitted enable decision',async()=>{
 const edge=readFileSync('supabase/functions/busy-mini-apps/index.ts','utf8'),a=edge.indexOf('function requireAppDraftRevision('),b=edge.indexOf('async function movePrivateAppModule(',a);
 const code=transformSync(edge.slice(a,b),{filename:'edge.ts',plugins:[ts],configFile:false,babelrc:false}).code;let writes=0;
 const db={from:()=>({update:()=>{writes++;return db;}}),eq:()=>db,select:()=>db,single:async()=>({data:app})};
 const set=Function('appForBusiness','moduleCatalog','loyaltyReady','proposeAppModuleToggle','supabase',code+';return setModule;')(async()=>app,async()=>config.modules.map(x=>({module_key:x.key,status:'available'})),()=>true,proposeAppModuleToggle,db);
 await assert.rejects(set(businessId,'contact',false,{appId:id,expectedRevision:4}),/explicit|enabled|decision/);assert.equal(writes,0);
});
await check('first-plan creation refuses an app created concurrently',async()=>{
 const edge=readFileSync('supabase/functions/busy-mini-apps/index.ts','utf8'),a=edge.indexOf('async function ensureApp('),b=edge.indexOf('// V3.181 durable',a);
 const code=transformSync(edge.slice(a,b),{filename:'edge.ts',plugins:[ts],configFile:false,babelrc:false}).code;
 const ensure=Function('appForBusiness','slugify','clean','supabase',code+';return ensureApp;')(async()=>app,x=>x,x=>x,{});
 await assert.rejects(ensure(businessId,'owner',{}, {requireNew:true}),/created|existing|elsewhere/);
});
if(failures)process.exitCode=1;
