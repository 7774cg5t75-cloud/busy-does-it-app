import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parse} from '@babel/parser';
import {reviewAppGoalDesignV3240 as review} from '../src/core/appGoalDesignReviewV3240.mjs';
import {proposeCoordinatedAppChanges as propose} from '../src/core/appCoordinatedStudio.mjs';
import {previewPrivateAppAppearance} from '../src/core/appAppearanceEditing.mjs';
const businessId='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const keys=['business_profile','services','gallery','enquiry','contact','booking_request'];
const config={modules:keys.map(key=>({key,enabled:true})),navigation:keys,
 presentation:{navigationStyle:'tabs',layoutDensity:'compact',imageScale:'large',galleryLayout:'grid'},
 publicProfile:{services:[{name:'Approved service'}],assets:{gallery:[1,2,3].map(i=>({uri:'https://example.test/'+i+'.jpg',approved:true}))}}};
const app={id:'cccccccc-cccc-4ccc-8ccc-cccccccccccc',business_id:businessId,draft_revision:3,draft_config:config};
let r=review({businessId,app,goal:'book'});assert.ok(r.ok);assert.equal(r.taskNavigationProposed,true);assert.equal(r.operations.length,3);
const proposed=propose(config,r.operations);assert.ok(proposed.ok);assert.equal(proposed.nextConfig.navigation[0],'business_profile');assert.equal(proposed.nextConfig.navigation[1],'booking_request');
assert.deepEqual(proposed.nextConfig.publicProfile,config.publicProfile);assert.deepEqual(proposed.nextConfig.modules,config.modules);
const service=review({businessId,app,goal:'services'});assert.equal(service.taskNavigationProposed,false);
const missing=review({businessId,app:{...app,draft_config:{...config,modules:config.modules.filter(x=>x.key!=='booking_request'),navigation:keys.filter(x=>x!=='booking_request')}},goal:'book'});assert.equal(missing.proposedChangeCount,0);assert.equal(missing.task.needsSetup,true);
const locked={...config,presentation:{...config.presentation,ownerLockedElements:['navigation','navigationStyle','layoutDensity','galleryLayout']}};
r=review({businessId,app:{...app,draft_config:locked},goal:'book'});assert.ok(r.ok);assert.equal(r.proposedChangeCount,0);
assert.equal(propose(locked,[{kind:'first',moduleKey:'booking_request'}]).ok,false);
assert.equal(previewPrivateAppAppearance(locked,{field:'layoutDensity',value:'airy'}).ok,false);
assert.equal(propose(locked,[{kind:'text',field:'tagline',value:'Owner text'}]).ok,true);
for(const ownerLockedElements of ['navigation',Array(31).fill('x'),['navigation','navigation']])assert.equal(propose({...config,presentation:{...config.presentation,ownerLockedElements}},[{kind:'text',field:'tagline',value:'text'}]).ok,false);
for(const file of ['appOwnerLocks.mjs','appAppearanceEditing.mjs','appCoordinatedStudio.mjs'])assert.equal(readFileSync('src/core/'+file,'utf8'),readFileSync('supabase/functions/busy-mini-apps/'+file,'utf8'));
const source=readFileSync('src/screens/appStudioComparison.js','utf8');parse(source,{sourceType:'module',plugins:['jsx']});
assert.ok(source.includes('SAMPLE_WIDTHS.map'));assert.ok(source.includes('renderSurface(side==='));
assert.ok(readFileSync('src/screens/miniApps.js','utf8').includes('renderSurface={config=><MiniAppSurface config={config}/>}'));
console.log('PASS: task-aware bounded editing, unavailable-task suppression, owner locks, shared server parity and preview component wiring/syntax. No real devices tested.');
