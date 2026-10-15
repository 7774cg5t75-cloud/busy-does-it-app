import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parse} from '@babel/parser';
import {reviewAppBusinessFactRefresh as review,currentAppBusinessFactReview as current} from '../src/core/appBusinessFactRefresh.mjs';
import {proposeCoordinatedAppChanges as plan} from '../src/core/appCoordinatedStudio.mjs';
const businessId='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',config={modules:['business_profile','services'].map(key=>({key,enabled:true})),navigation:['business_profile','services'],sourceProfileRevision:3,publicProfile:{about:'Custom app wording',services:[{id:'one',name:'Gardening',description:'Custom service'}]},presentation:{brandPalette:'forest'}};
const app={id:'cccccccc-cccc-4ccc-8ccc-cccccccccccc',business_id:businessId,draft_revision:4,draft_config:config};
const profileRecord={business_id:businessId,revision:5,profile:{about:'New source wording',tagline:'New tagline',services:[{name:'Gardening',description:'New source service'},{id:'two',name:'Mowing',description:'Owner supplied'}]}};
const ctx={businessId,app,profileRecord},r=review(ctx);assert.equal(r.ok,true);assert.equal(r.rows.length,4);assert.equal(r.preview.nextConfig.publicProfile.about,'Custom app wording');assert.equal(r.preview.nextConfig.publicProfile.services[0].description,'Custom service');assert.equal(r.preview.nextConfig.publicProfile.services[1].name,'Mowing');assert.equal(r.preview.nextConfig.presentation,config.presentation);assert.equal(current(r,ctx),true);
const chosen=review({...ctx,selected:r.rows.map(x=>x.id)});assert.equal(chosen.preview.nextConfig.publicProfile.about,'New source wording');assert.equal(chosen.preview.nextConfig.publicProfile.services[0].id,'one');assert.deepEqual(plan(chosen.preview.nextConfig,chosen.preview.undoOperations).nextConfig,config);
assert.equal(review({...ctx,selected:[]}).preview,null);
for(const changed of [{businessId:'other'},{profileRecord:{...profileRecord,business_id:'other'}},{profileRecord:{...profileRecord,revision:2}}])assert.equal(review({...ctx,...changed}).ok,false);
assert.equal(current(r,{...ctx,profileRecord:{...profileRecord,revision:6}}),false);assert.equal(current(r,{...ctx,app:{...app,draft_revision:5}}),false);
const locked=review({...ctx,app:{...app,draft_config:{...config,presentation:{ownerLockedElements:['copy']}}}});assert.equal(locked.preview,null);assert.equal(locked.rows.every(x=>!x.allowed),true);
parse(readFileSync('src/screens/appBusinessFactRefresh.js','utf8'),{sourceType:'module',plugins:['jsx']});
console.log('PASS: scoped saved-fact comparison, safe additions, explicit conflict replacement, exact inverse, retained identity/settings, stale source/tenant/lock rejection and UI syntax. Fixture facts only.');

assert.equal(review({...ctx,profileRecord:{...profileRecord,profile:{services:[{name:"Mowing"},{name:"Ｍｏｗｉｎｇ"}]}}}).ok,false);
