import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {parse} from '@babel/parser';
import {businessCacheKey,encodeBusinessCache,decodeBusinessCache,selectBusinessCache,completeBusinessSnapshot} from '../src/core/businessCache.mjs';
import {bindWebsiteDraftScope} from '../src/core/websiteDraftScope.mjs';
import {enqueuePrivateCheckpoint} from '../src/core/privateCheckpointQueue.mjs';
const source=readFileSync(new URL('../src/app/AppController.js',import.meta.url),'utf8'),functions={};
function walk(n){if(!n||typeof n!=='object')return;if(n.type==='VariableDeclarator'&&['initialiseBusinessCloud','applyCloudSnapshot'].includes(n.id?.name))functions[n.id.name]=source.slice(n.init.start,n.init.end);for(const[k,v]of Object.entries(n))if(!['loc','start','end'].includes(k)){if(Array.isArray(v))v.forEach(walk);else if(v&&typeof v==='object')walk(v);}}walk(parse(source,{sourceType:'module',plugins:['jsx']}));
const businessId='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',ownerId='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',noop=()=>{};
for(const revision of [4,5,6]){
 let ensured=false,applied,recovery,posts=0,scope;
 const ownerScope={userId:ownerId},cache={ownerId,businessId,revision:4,payload:{businessName:'Unsaved device copy',customers:[{id:'private'}]}};
 const env={businessCacheKey,decodeBusinessCache,selectBusinessCache,completeBusinessSnapshot,enqueuePrivateCheckpoint,CLOUD_SCHEMA_VERSION:1,
 cloudOwnerScopeRef:{current:ownerScope},businessCacheScopeRef:{current:null},preservedBusinessCacheRef:{current:null},snapshotContextRef:{current:{getPayload:()=>({businessName:'Initial'})}},
 ownerSession:{userId:ownerId,accessToken:'fixture'},cloudInitialising:false,businessName:'Fixture',ownerAccessToken:async()=>'fixture',storageKeyForUser:()=> 'owner-cache',
 AsyncStorage:{getItem:async key=>{assert.equal(ensured,true,'discover the authorised business before reading its cache');assert.equal(key,businessCacheKey('owner-cache',businessId));return revision===6?"corrupt retained bytes":encodeBusinessCache(cache);}},
 busyDataRequest:async(path,options)=>{if(path.startsWith('rpc/')){ensured=true;return [{business_id:businessId}];}if(options.method)posts++;return [{business_id:businessId,revision,schema_version:1,payload:{businessName:'Cloud copy'}}];},
 applyCloudSnapshot:(data,id)=>{assert.equal(id,businessId);applied=data;},setCloudWorkspace:x=>scope=x,setBusinessCacheRecovery:x=>recovery=x};
 for(const name of ['setCloudInitialising','setCloudAttempted','setCloudConflict','setCloudSyncError','setCloudSyncStatus','setCloudRevision','setCloudLastSyncedAt','setCloudInitialised'])env[name]=noop;
 const init=Function(...Object.keys(env),'return '+functions.initialiseBusinessCloud)(...Object.values(env));assert.equal(await init(),true);assert.equal(posts,0);assert.equal(scope.businessId,businessId);
 assert.equal(applied.businessName,revision===4?'Unsaved device copy':'Cloud copy');assert.equal(!!recovery,revision===5);assert.equal(!!env.preservedBusinessCacheRef.current,revision===5);assert.equal(env.businessCacheScopeRef.current.blocked,revision===6);
}
// Execute the original selective state application and confirm absent private
// collections and approval/recovery state cannot survive a business switch.
let values={};const setters=[...new Set(functions.applyCloudSnapshot.match(/\bset[A-Z]\w+(?=\()/g))];const env={bindWebsiteDraftScope,completeBusinessSnapshot,BRAND_PROFILE_SEED:{},connectionSeed:{},getVerticalPack:()=>({services:[],defaultRepeatMonths:6})};
for(const name of setters)env[name]=v=>values[name]=v;
const apply=Function(...Object.keys(env),'return '+functions.applyCloudSnapshot)(...Object.values(env));apply({businessName:'Second business'},businessId);
assert.deepEqual(values.setCustomers,[]);assert.deepEqual(values.setInboxItems,[]);assert.equal(values.setWebsiteDraft,null);assert.equal(values.setBusyOperatorSnapshot,null);assert.equal(values.setBusinessMemoryLastReviewAt,'');
apply({customers:null,inboxItems:null,businessBrainRules:null},businessId);assert.deepEqual(values.setCustomers,[]);assert.deepEqual(values.setInboxItems,[]);assert.deepEqual(values.setBusinessBrainRules,[]);
values={};assert.throws(()=>apply({customers:[{id:'foreign'}],websiteDraft:{businessId:ownerId}},businessId));assert.deepEqual(values,{},'reject nested foreign scope before any setter');
console.log('PASS: actual cloud initializer discovers business before cache, recovers matching-base edits, preserves conflicts without writes; actual sparse snapshot application clears private state and validates before mutation.');
