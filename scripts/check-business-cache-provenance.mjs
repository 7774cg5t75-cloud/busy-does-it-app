import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {businessCacheKey as key,encodeBusinessCache as encode,decodeBusinessCache as decode,selectBusinessCache as select,completeBusinessSnapshot as complete} from '../src/core/businessCache.mjs';
import {enqueuePrivateCheckpoint as queue} from '../src/core/privateCheckpointQueue.mjs';
const ownerId='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',businessId='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',foreign='cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const args={ownerId,businessId},payload={businessName:'Private',customers:[{id:'owner-record'}],websiteDraft:{businessId}},raw=encode({...args,revision:4,payload});
assert.notEqual(key('owner',businessId),key('owner',foreign));assert.equal(decode(raw,args).payload.customers[0].id,'owner-record');
for(const scope of [{...args,ownerId:foreign},{...args,businessId:foreign}])assert.equal(decode(raw,scope),null);
assert.equal(decode(JSON.stringify(payload),args),null);assert.equal(decode('{broken',args),null);assert.throws(()=>encode({...args,revision:4,payload:{websiteDraft:{business_id:foreign}}}));
const cache=decode(raw,args);assert.equal(select(cache,{revision:4,payload:{businessName:'Cloud'}}).local,true);assert.equal(select(cache,{revision:5,payload:{businessName:'Cloud'}}).preserve,true);
const sparse=complete({businessName:'Other business'});for(const field of ['customers','inboxItems','socialDrafts','businessBrainRules','businessMemoryHistory'])assert.deepEqual(sparse[field],[]);assert.equal(sparse.websiteDraft,null);assert.equal(sparse.busyOperatorSnapshot,null);
let release,events=[];const first=queue('cache-fixture',async()=>{events.push(1);await new Promise(r=>release=r);events.push(2);});const second=queue('cache-fixture',()=>events.push(3));await new Promise(r=>setImmediate(r));assert.deepEqual(events,[1]);release();await Promise.all([first,second]);assert.deepEqual(events,[1,2,3]);
const source=readFileSync(new URL('../src/app/AppController.js',import.meta.url),'utf8');assert.doesNotMatch(source,/getItem\(LEGACY_STORAGE_KEY\)/);assert.doesNotMatch(source,/applyCloudSnapshot\(JSON.parse\(cached\)\)/);assert.match(source,/businessCacheScopeRef.current\?\.ownerScope!==cloudOwnerScopeRef.current/);
console.log('PASS: account/business cache provenance, rejected legacy/foreign/corrupt copies, same-revision local continuity, preserved revision conflicts, sparse-state clearing and reused serial storage queue.');
assert.equal(select({...cache,payload:{businessName:'Owner',brandProfile:{a:1,b:2},diaryEventMap:{local:'preference'}}},{revision:5,payload:{brandProfile:{b:2,a:1},businessName:'Owner'}}).preserve,false,'key order and device-only preferences are not a business-content conflict');
assert.equal(select({...cache,payload:{services:[{name:'A'},{name:'B'}]}},{revision:5,payload:{services:[{name:'B'},{name:'A'}]}}).preserve,true,'array ordering remains meaningful');

assert.deepEqual(select({...cache,payload:{businessName:'Owner',diaryEventMap:{local:'preference'}}},{revision:5,payload:{businessName:'Owner'}}).payload.diaryEventMap,{local:'preference'},'verified device preferences survive an advanced cloud revision');
