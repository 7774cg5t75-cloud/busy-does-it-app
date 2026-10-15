import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parse} from '@babel/parser';
import {applyGoalOwnerMemory} from '../src/core/appGoalOwnerMemory.mjs';
import {normalizeDesignHistory} from '../src/core/appDesignLearning.mjs';
import {reviewAppGoalDesignV3240 as review} from '../src/core/appGoalDesignReviewV3240.mjs';
const businessId='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',appId='cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const keys=['business_profile','services','gallery','enquiry','contact'];
const config={modules:keys.map(key=>({key,enabled:true})),navigation:keys,presentation:{navigationStyle:'tabs',layoutDensity:'compact',galleryLayout:'grid',imageScale:'large'},publicProfile:{services:[{name:'Fixture'}],assets:{gallery:[1,2,3].map(i=>({uri:'https://example.test/'+i,approved:true}))}}};
const app={id:appId,business_id:businessId,draft_revision:4,draft_config:config};
const context={businessId,appId,ownerId:'owner-a',revision:4};
const snapshot={...context,ok:true,records:[{field:'navigationStyle',value:'list',verdict:'worse',context:'preview',draftRevision:3,source:'responsive'},{field:'galleryLayout',value:'grid',verdict:'better',context:'saved_revision',draftRevision:4,source:'manual'}]};
const r=review({businessId,app,ownerId:context.ownerId,ownerDesignHistory:snapshot,goal:'services'});assert.equal(r.ownerMemory.used,true);assert.equal(r.ownerMemory.suppressedCount,2);assert.equal(r.operations.some(x=>x.field==='navigationStyle'||x.field==='galleryLayout'),false);assert.equal(r.maySave,false);
for(const changed of [{...snapshot,ownerId:'other'},{...snapshot,businessId:'other'},{...snapshot,appId:'other'},{...snapshot,revision:3},{...snapshot,records:[{...snapshot.records[0],draftRevision:5}]},{...snapshot,records:[{field:'fake',draftRevision:2}]}]){
 const p=applyGoalOwnerMemory(config,[{field:'navigationStyle',value:'list'}],changed,context);assert.equal(p.used,false);assert.equal(p.choices.length,1);
}
const controller=readFileSync('src/app/AppController.js','utf8');const start=controller.indexOf('  const getAppDesignLearningStatus=async('),end=controller.indexOf('  const recordAppDesignPreference=',start);
const ref={current:{businessId,userId:'owner-a',app}};let complete;
const fn=Function('privateAppEditScopeRef','miniAppsRequest','normalizeDesignHistory',controller.slice(start,end).replace('  const getAppDesignLearningStatus=','return '))(ref,()=>new Promise(resolve=>{complete=resolve;}),normalizeDesignHistory);
const response={ok:true,businessId,history:{appId,records:snapshot.records}};
const good=fn({appId});complete(response);const result=await good;assert.equal(result.ok,true);assert.equal(result.ownerId,'owner-a');assert.equal(result.revision,4);
const old=fn({appId});ref.current={...ref.current,userId:'owner-b'};complete(response);assert.equal((await old).ok,false);
ref.current={businessId,userId:'owner-a',app};const stale=fn({appId});ref.current={...ref.current,app:{...app,draft_revision:5}};complete(response);assert.equal((await stale).ok,false);
parse(readFileSync('src/screens/useOwnerDesignMemory.js','utf8'),{sourceType:'module',plugins:['jsx']});
console.log('PASS: scoped owner preference suppression, preferred active settings, stale/foreign/future rejection and actual controller response guards with simulated transport.');
