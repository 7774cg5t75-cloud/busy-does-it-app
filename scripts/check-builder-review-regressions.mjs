import assert from 'node:assert/strict';
import {proposeCoordinatedAppChanges as propose} from '../src/core/appCoordinatedStudio.mjs';
import {proposeAppSectionMove as move} from '../src/core/appSectionOrder.mjs';
import {currentWebsiteDesignCandidate as current} from '../src/core/privateWebsiteReviewProgress.mjs';
const keys=['business_profile','services','gallery','enquiry'];
const base={modules:keys.map(key=>({key,enabled:true})),navigation:keys,publicProfile:{businessName:'Fixture'}};
const locked={...base,presentation:{ownerLockedElements:['services']}};
const cases=[
 ['navigation permutation cannot shift locked section',()=>assert.equal(propose(locked,[{kind:'navigation',value:['business_profile','gallery','services','enquiry']}]).ok,false)],
 ['adjacent unlocked move cannot shift locked section',()=>assert.equal(move(locked,{moduleKey:'gallery',direction:'up'}).ok,false)],
 ['first operation cannot shift locked section',()=>assert.equal(propose(locked,[{kind:'first',moduleKey:'enquiry'}]).ok,false)],
 ['header alias protects header style',()=>assert.equal(propose({...base,presentation:{ownerLockedElements:['header']}},[{kind:'appearance',field:'headerStyle',value:'bold'}]).ok,false)],
 ['appearance undo restores absent presentation exactly',()=>{const forward=propose(base,[{kind:'appearance',field:'layoutDensity',value:'airy'}]);assert.ok(forward.ok);const undo=propose(forward.nextConfig,forward.undoOperations);assert.ok(undo.ok);assert.deepEqual(undo.nextConfig,base);}],
 ['restore cannot remove locks',()=>assert.equal(propose(locked,[{kind:'restore_appearance',value:{layoutDensity:'airy'}}]).ok,false)],
 ['restore cannot smuggle arbitrary properties',()=>assert.equal(propose(base,[{kind:'restore_appearance',value:{javascript:'bad'}}]).ok,false)],
 ['restore cannot alter a locked header',()=>assert.equal(propose({...base,presentation:{headerStyle:'quiet',ownerLockedElements:['header']}},[{kind:'restore_appearance',value:{headerStyle:'bold',ownerLockedElements:['header']}}]).ok,false)],
 ['appearance undo restores empty presentation exactly',()=>{const original={...base,presentation:{}};const f=propose(original,[{kind:'appearance',field:'layoutDensity',value:'airy'}]);assert.deepEqual(propose(f.nextConfig,f.undoOperations).nextConfig,original);}],
 ['website candidate is bound to signed-in owner',()=>assert.equal(current({id:'candidate',businessId:'b',websiteId:'w',baseGeneration:1,pageId:'home',ownerId:'owner-a'},{businessId:'b',website:{id:'w',generation:1},pageId:'home',ownerId:'owner-b'}),false)]
];
let failures=0;
for(const [name,test] of cases){try{test();console.log('PASS',name);}catch(error){failures++;console.log('FAIL',name,error.message.slice(0,180));}}
assert.equal(failures,0,'Review regressions must all be corrected');
