import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createBusinessSnapshotSession as create} from '../src/core/businessSnapshotSession.mjs';
const businessId='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',ownerId='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const defer=()=>{let resolve;return {promise:new Promise(r=>resolve=r),resolve};};
function setup(){let payload={businessName:'Reviewed owner copy'},scope={identity:{},ownerId,businessId,revision:4,ready:true,getPayload:()=>payload};const session=create(),calls=[];
 const row={business_id:businessId,revision:5,schema_version:1,payload:{businessName:'Cloud copy',websiteDraft:{businessId}},updated_at:'now'};
 const args={getCurrent:()=>scope,ownerAccessToken:async()=>'fixture',schemaVersion:1,request:async(path,options)=>{calls.push({path,options});return [row];}};
 return {session,args,calls,row,ticket:()=>session.prepareRestore(args.getCurrent),edit(){payload={businessName:'New owner work'};},switch(){scope={...scope,identity:{},ownerId:'cccccccc-cccc-4ccc-8ccc-cccccccccccc'};},advance(){scope={...scope,revision:5,getPayload:()=>row.payload};}};
}
const s=setup(),ticket=s.ticket(),restored=await s.session.restore({...s.args,ticket});assert.equal(restored.ok,true);assert.match(s.calls[0].path,/business_id=eq.*select=business_id/);assert.equal(s.calls[0].options.method,undefined);assert.equal((await s.session.restore({...s.args,ticket})).ok,false);assert.equal(s.calls.length,1);s.advance();assert.equal((await s.session.save(s.args)).unchanged,true);assert.equal(s.calls.length,1);
for(const action of ['edit','switch']){
 const before=setup(),ticket=before.ticket();before[action]();assert.equal((await before.session.restore({...before.args,ticket})).ok,false);assert.equal(before.calls.length,0);
 const mid=setup(),wait=defer(),pending=mid.session.restore({...mid.args,ticket:mid.ticket(),request:()=>wait.promise});await new Promise(r=>setImmediate(r));mid[action]();wait.resolve([mid.row]);assert.equal((await pending).ok,false);
}
const lock=setup(),wait=defer(),pending=lock.session.restore({...lock.args,ticket:lock.ticket(),ownerAccessToken:()=>wait.promise});assert.equal((await lock.session.save(lock.args)).ok,false);assert.equal((await lock.session.restore({...lock.args,ticket:lock.ticket()})).ok,false);wait.resolve('fixture');assert.equal((await pending).ok,true);
for(const update of [{business_id:'foreign'},{revision:3},{schema_version:99},{payload:[]},{payload:{websiteDraft:{business_id:'foreign'}}}]){const v=setup();Object.assign(v.row,update);assert.equal((await v.session.restore({...v.args,ticket:v.ticket()})).ok,false);}
const source=readFileSync(new URL('../src/app/AppController.js',import.meta.url),'utf8');assert.match(source,/onPress: \(\) => restoreLatestCloudCopy\(ticket\)/);assert.match(source,/if\(snapshotIdentityRef.current!==identity\)return false;\n      if\(!result.ok\)/);
console.log('PASS: single-use restore approval, exact local source, tenant/schema/revision/media-scope validation, save/restore exclusion, no replay or stale replacement. Offline session execution.');
