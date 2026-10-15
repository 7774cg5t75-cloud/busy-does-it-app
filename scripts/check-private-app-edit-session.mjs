import assert from 'node:assert/strict';
import {proposeCoordinatedAppChanges as propose} from '../src/core/appCoordinatedStudio.mjs';
import {privateAppEditSource,bindPrivateAppProposal,currentPrivateAppProposal,executePrivateAppBatch as execute} from '../src/core/privateAppEditSession.mjs';
const businessId='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',other='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const config={modules:[{key:'business_profile',enabled:true},{key:'services',enabled:true}],navigation:['business_profile','services'],presentation:{layoutDensity:'compact'},publicProfile:{businessName:'Private fixture',services:[{name:'Service'}]}};
const app={id:'cccccccc-cccc-4ccc-8ccc-cccccccccccc',business_id:businessId,draft_revision:7,draft_config:config};
const operations=[{kind:'appearance',field:'layoutDensity',value:'comfortable'}];
const plan=propose(config,operations),context={businessId,app,config};
const bound=bindPrivateAppProposal(plan,context);assert.ok(bound);
assert.ok(currentPrivateAppProposal(bound,context));
for(const c of [{...context,businessId:other},{...context,app:{...app,draft_revision:8}},{...context,config:{...config,navigation:['services','business_profile']}},{...context,app:{...app,business_id:other}}])assert.equal(currentPrivateAppProposal(bound,c),false);
assert.equal(bindPrivateAppProposal({...plan,nextConfig:config},context),null);
const saved={...app,draft_revision:8,draft_config:plan.nextConfig};
const receipt=()=>({ok:true,privateOnly:true,neverPublishes:true,chargesCreated:false,app:saved,status:{app:saved,role:'owner'},appliedChangeCount:1,undoOperations:plan.undoOperations});
let writes=0,reads=0,current=true;
const args={businessId,app,operations,source:bound.source,isCurrent:()=>current,write:async()=>{writes++;return receipt();},readStatus:async()=>{reads++;return {app:saved};}};
let r=await execute(args);assert.equal(r.ok,true);assert.equal(reads,0);assert.deepEqual(propose(saved.draft_config,r.undoOperations).nextConfig,config);
for(const change of [r=>({...r,app:{...saved,business_id:other}}),r=>({...r,status:{app:{...saved,business_id:other}}}),r=>({...r,undoOperations:operations}),r=>({...r,app:{...saved,draft_config:config}}),r=>({...r,status:{app:{...saved,draft_revision:9}}}),r=>({...r,privateOnly:false}),r=>({...r,chargesCreated:true})]){
 const before=writes;r=await execute({...args,write:async()=>{writes++;return change(receipt());}});
 assert.equal(r.ok,false);assert.equal(r.outcome,'matching_draft_observed');assert.equal(r.undoOperations,null);assert.equal(writes,before+1);
}
for(const [observed,outcome] of [[saved,'matching_draft_observed'],[app,'original_draft_observed'],[{...saved,draft_revision:10},'different_draft_observed']]){
 const before=writes;r=await execute({...args,write:async()=>{writes++;throw Error('connection lost');},readStatus:async()=>({app:observed})});
 assert.equal(r.ok,false);assert.equal(r.mayRetry,false);assert.equal(r.outcome,outcome);assert.equal(writes,before+1);
}
r=await execute({...args,write:async()=>{throw Error('lost');},readStatus:async()=>({app:{...saved,business_id:other}})});assert.equal(r.status,undefined);
r=await execute({...args,write:async()=>{throw Error('lost');},readStatus:async()=>{throw Error('offline');}});assert.equal(r.ok,false);assert.equal(r.status,undefined);
const before=writes;r=await execute({...args,source:{...bound.source,revision:6}});assert.equal(r.ok,false);assert.equal(writes,before);
current=false;r=await execute(args);assert.equal(r.ok,false);assert.equal(writes,before);
current=true;const priorReads=reads;r=await execute({...args,write:async()=>{current=false;return receipt();}});assert.equal(r.ok,false);assert.equal(r.status,undefined);assert.equal(reads,priorReads);
current=true;r=await execute({...args,write:async()=>{throw Error('lost');},readStatus:async()=>{current=false;return {app:saved};}});assert.equal(r.status,undefined);
assert.equal(app.draft_revision,7);assert.equal(app.draft_config,config);
assert.equal(privateAppEditSource({...context,businessId:other}),null);
console.log('PASS: scoped preview binding, exact save and inverse receipt, readback recovery, no replay, tenant/session changes and undo. Simulated transport only.');
