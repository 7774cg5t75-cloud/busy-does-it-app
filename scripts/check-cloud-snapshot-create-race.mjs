import {businessCacheKey,decodeBusinessCache,selectBusinessCache,completeBusinessSnapshot} from '../src/core/businessCache.mjs';
import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {parse} from '@babel/parser';
const source=readFileSync('src/app/AppController.js','utf8');let code;
function walk(n){if(!n||typeof n!=='object')return;if(n.type==='VariableDeclarator'&&n.id?.name==='initialiseBusinessCloud')code=source.slice(n.init.start,n.init.end);for(const[k,v]of Object.entries(n))if(!['loc','start','end'].includes(k)){if(Array.isArray(v))v.forEach(walk);else if(v&&typeof v==='object')walk(v);}}walk(parse(source,{sourceType:'module',plugins:['jsx']}));
const businessId='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',noop=()=>{};let reads=0,posts=0,applied,revision;
const env={setBusinessCacheRecovery:noop,businessCacheKey,decodeBusinessCache,selectBusinessCache,completeBusinessSnapshot,businessCacheScopeRef:{current:null},preservedBusinessCacheRef:{current:null},snapshotContextRef:{current:{getPayload:()=>({businessName:"Local copy"})}},cloudOwnerScopeRef:{current:{userId:'owner-a'}},ownerSession:{userId:'owner-a',accessToken:'fixture'},cloudInitialising:false,setCloudInitialising:noop,setCloudAttempted:noop,setCloudConflict:noop,setCloudSyncError:noop,setCloudSyncStatus:noop,storageKeyForUser:()=>'',ownerAccessToken:async()=>'fixture',businessName:'Fixture',setCloudWorkspace:noop,setCloudRevision:x=>revision=x,setCloudLastSyncedAt:noop,setCloudInitialised:noop,buildPersistentSnapshot:()=>({businessName:'Local copy'}),CLOUD_SCHEMA_VERSION:1,applyCloudSnapshot:x=>applied=x,busyDataRequest:async(path,options)=>{
 if(path.startsWith('rpc/'))return [{business_id:businessId}];
 if(options.method==='POST'){posts++;assert.equal(options.prefer,'resolution=ignore-duplicates,return=representation');return [];}
 reads++;return reads===1?[]:[{business_id:businessId,revision:8,schema_version:1,payload:{businessName:'Another device owner copy'}}];
}};
const init=Function(...Object.keys(env),'return '+code)(...Object.values(env));assert.equal(await init(),true);assert.equal(posts,1);assert.equal(reads,2);assert.equal(revision,8);assert.equal(applied.businessName,'Another device owner copy');
console.log('PASS: actual first snapshot creation ignores a concurrent row and restores its authoritative revision rather than merging over it. Fake REST only.');
