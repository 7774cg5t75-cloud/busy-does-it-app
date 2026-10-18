import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';
import {editingQualityDecision} from '../src/core/builderQualityPolicy.mjs';
import {reviewWebsiteEditingQuality,websiteEditingRegression} from '../supabase/functions/busy-website-worker/websiteEditingQuality.mjs';
import {checkPrivateWebsiteDraftCommit} from '../src/core/privateWebsiteDraftCommit.mjs';
import {reviewAppEditingQuality,previewPrivateAppAppearance} from '../src/core/appAppearanceEditing.mjs';
import {amendAppQualityProposal,proposeCoordinatedAppChanges} from '../src/core/appCoordinatedStudio.mjs';
const web={id:'web',businessId:'business',generation:1,sections:[{id:'hero',type:'hero',title:'Fictional workshop',cta:'Ask us',ctaHref:'#contact'},{id:'contact',type:'contact',body:'Ask a question',email:'owner@example.test'}],pages:[{id:'home',sectionIds:['hero','contact']}],theme:{},publicStatus:'Not published'};
assert.equal(reviewWebsiteEditingQuality(web).level,'safe');
const bold={...web,sections:web.sections.map(s=>s.id==='hero'?{...s,appearance:{headingScale:'large'}}:s),generation:2};
assert.equal(reviewWebsiteEditingQuality(bold).level,'advisory');
assert.ok(checkPrivateWebsiteDraftCommit({current:web,candidate:bold,live:web,scopeCurrent:true,businessId:'business'}).applied,'Creative but usable choice remains permitted');
const broken={...bold,sections:bold.sections.map(s=>s.id==='hero'?{...s,ctaHref:'#missing'}:s)};
assert.equal(reviewWebsiteEditingQuality(broken).mayCommit,false);
assert.equal(checkPrivateWebsiteDraftCommit({current:web,candidate:broken,live:web,scopeCurrent:true,businessId:'business'}).applied,false);
assert.equal(checkPrivateWebsiteDraftCommit({current:web,candidate:bold,live:{...web},scopeCurrent:true}).applied,false,'Stale source remains blocked');
assert.equal(checkPrivateWebsiteDraftCommit({current:web,candidate:{...bold,businessId:'foreign'},live:web,scopeCurrent:true,businessId:'business'}).applied,false);
const locks={...web,theme:{lockedSections:['hero']}};
assert.equal(checkPrivateWebsiteDraftCommit({current:locks,candidate:{...bold,theme:locks.theme},live:locks,scopeCurrent:true}).applied,false);
assert.equal(editingQualityDecision([{id:'opinion',level:'critical',message:'Unusual style',evidence:'heuristic'}]).mayCommit,true,'Subjective opinion cannot become a hard gate');
assert.equal(websiteEditingRegression(broken,{...broken,generation:3}).mayCommit,true,'Existing issue may remain during unrelated private repair; publication still blocked');
const app={modules:['business_profile','services','enquiry'].map(key=>({key,enabled:true})),navigation:['business_profile','services','enquiry'],presentation:{typeStyle:'impact',headerStyle:'bold'}};
assert.equal(reviewAppEditingQuality(app).level,'advisory');
const proposal=proposeCoordinatedAppChanges(app,[{kind:'appearance',field:'layoutDensity',value:'airy'}]);assert.ok(proposal.ok);assert.equal(proposal.quality.level,'advisory');
const repaired=amendAppQualityProposal(app,proposal,proposal.quality.findings[0].repair);assert.ok(repaired.ok);assert.equal(repaired.nextConfig.presentation.headerStyle,'refined');assert.equal(repaired.nextConfig.presentation.layoutDensity,'airy');assert.ok(repaired.undoOperations.length);
assert.deepEqual(proposal.nextConfig.modules,app.modules,'Appearance preserves real action modules');assert.deepEqual(proposal.nextConfig.navigation,app.navigation);
assert.equal(reviewAppEditingQuality({...app,navigation:['business_profile','services']}).mayCommit,false);
assert.equal(previewPrivateAppAppearance({...app,navigation:[]},{field:'layoutDensity',value:'airy'}).ok,false);
// Execute exact checked-in trusted functions with Node's built-in TypeScript
// erasure and explicit inert IO sentinels. No Babel, Deno or hosted execution.
function original(path,name,next,deps){
 const s=readFileSync(path,'utf8'),marker='async function '+name+'(',endMarker='async function '+next+'(';
 assert.equal(s.split(marker).length,2);assert.equal(s.split(endMarker).length,2);
 const start=s.indexOf(marker),end=s.indexOf(endMarker,start);assert.ok(end>start);
 return Function(...Object.keys(deps),stripTypeScriptTypes(s.slice(start,end))+';return '+name+';')(...Object.values(deps));
}
let calls=0;const sentinel=()=>{calls++;throw Error('INERT_IO_BOUNDARY');};
const deps={reviewWebsiteEditingQuality,ensureBuckets:sentinel};
const worker='supabase/functions/busy-website-worker/index.ts';
for(const [name,next]of [['prepareDeployment','publishDeployment'],['publishDeployment','rollbackDeployment']]){
 const fn=original(worker,name,next,deps);calls=0;
 await assert.rejects(fn({}, {source_draft:broken},{}),/Design quality:/);assert.equal(calls,0,'Critical rejection precedes external IO');
 if(name==='prepareDeployment')await assert.rejects(fn({}, {source_draft:bold},{}),/INERT_IO_BOUNDARY/);
}
const publish=original('supabase/functions/busy-mini-apps/index.ts','publishMiniAppWebArtifact','publishVersion',{reviewAppEditingQuality,ensureMiniAppPublicBucket:sentinel});
calls=0;await assert.rejects(publish({}, {config:{...app,navigation:[]}}),/navigation/);assert.equal(calls,0);
await assert.rejects(publish({}, {config:app}),/INERT_IO_BOUNDARY/);
for(const p of ['supabase/functions/_shared/builderQualityPolicy.mjs','supabase/functions/busy-mini-apps/builderQualityPolicy.mjs'])assert.equal(readFileSync(p,'utf8'),readFileSync('src/core/builderQualityPolicy.mjs','utf8'));
for(const p of ['appAppearanceEditing.mjs','appCoordinatedStudio.mjs'])assert.equal(readFileSync('src/core/'+p,'utf8'),readFileSync('supabase/functions/busy-mini-apps/'+p,'utf8'));
console.log('PASS safe/advisory/critical distinctions, nonblocking owner preference, actual private commit scope/locks, shared app plans and trusted website/app pre-publication rejection before inert IO. No geometry/device/hosted claim.');
