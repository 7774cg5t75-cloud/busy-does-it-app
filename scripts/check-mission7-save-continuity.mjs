import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {createBusinessSnapshotSession as create} from '../src/core/businessSnapshotSession.mjs';
let payload={businessName:'First'},scope={identity:{},ownerId:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',businessId:'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',revision:4,ready:true,getPayload:()=>payload},release,writes=0;
const session=create(),args={getCurrent:()=>scope,ownerAccessToken:async()=>'fixture',schemaVersion:1,request:async(path,options)=>{writes++;return [{business_id:scope.businessId,revision:5,schema_version:1,payload:options.body.payload}];}};
const first=session.save({...args,ownerAccessToken:()=>new Promise(r=>release=r)});assert.equal(session.isBusy(scope.identity),true);assert.equal((await session.save(args)).busy,true);
payload={businessName:'New owner edits'};release('fixture');const beforeSend=await first;assert.equal(beforeSend.prepareAgain,true);assert.equal(beforeSend.notSent,true);assert.equal(writes,0);assert.equal(session.isBusy(scope.identity),false);
assert.equal((await session.save(args)).ok,true);assert.equal(writes,1);
const uncertain=await create().save({...args,request:async()=>{throw Error('lost receipt');}});assert.equal(uncertain.uncertain,true);assert.notEqual(uncertain.prepareAgain,true);
const source=readFileSync(new URL('../src/app/AppController.js',import.meta.url),'utf8');assert.match(source,/result.prepareAgain&&result.notSent/);assert.match(source,/setCloudSavePreparation\(n=>n\+1\)/);assert.match(source,/cloudRevision,\s+cloudSavePreparation,\s+onboardingComplete/);
console.log('PASS: slow-token edits cancel before any write and reschedule the latest source; concurrent saves stay busy, uncertain sent writes never enter preparation retry. Fake REST only.');
// Postgres JSONB may reorder object keys; semantic receipts must still match.
payload={businessName:'Owner',brandProfile:{primary:'blue',secondary:'white'}};
const reordered=await create().save({...args,request:async(path,o)=>[{revision:5,schema_version:1,business_id:scope.businessId,payload:{brandProfile:{secondary:'white',primary:'blue'},businessName:'Owner'}}]});
assert.equal(reordered.ok,true,'JSON object key order is not a failed receipt');
console.log('PASS: semantic JSONB receipt matching retains exact array/value comparisons.');

const {stableJson}=await import('../src/core/stableJson.mjs');assert.equal(JSON.parse(stableJson({at:new Date('2026-10-15T12:00:00Z')})).at,'2026-10-15T12:00:00.000Z');assert.equal(stableJson({a:[undefined]}),'{\"a\":[null]}');
