// Executes actual source guards and record adapter against LOCAL Auth/PostgREST.
// Not the Deno Edge HTTP runtime, browser UI, or a hosted Supabase project.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as nodeModule from 'node:module';
import {createProgress} from './integration-progress.mjs';
let progress;
try {
progress=createProgress(process.argv[2]);
progress.begin('read-local-credentials');
const local=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));
progress.complete();progress.begin('validate-local-endpoint');
const base=new URL(local.API_URL);assert.equal(base.protocol,'http:');assert.ok(['localhost','127.0.0.1'].includes(base.hostname));assert.equal(base.port,'54321');
progress.complete();progress.begin('application-module-import');
const {manageBusinessContent,readBusinessContent}=await import('../../supabase/functions/_shared/businessContentStore.mjs');
progress.complete();
const done=progress.state.completedChecks;const pass=name=>progress.pass(name);
async function api(path,{token=local.SERVICE_ROLE_KEY,method='GET',body,extra={}}={}){
 const url=new URL(path,base);const requestSequence=progress.request(url,method);
 const r=await fetch(url,{method,headers:{apikey:local.ANON_KEY,Authorization:'Bearer '+token,'Content-Type':'application/json',...extra},body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(15000)});
 let data;try{data=await r.json();}catch{data=null;}progress.response(requestSequence,r.status,data);return {status:r.status,ok:r.ok,data};
}
// Minimal real REST boundary; no mocked rows or simulated successful writes.
class Query{
 constructor(table){assert.match(table,/^busy_[a-z_]+$/);this.table=table;this.q=new URLSearchParams();this.method='GET';this.body=undefined;this.one=false;}
 select(columns){this.q.set('select',columns);return this;}eq(k,v){this.q.append(k,'eq.'+v);return this;}
 limit(n){this.q.set('limit',String(n));return this;}order(k,{ascending=true}={}){this.q.set('order',k+'.'+(ascending?'asc':'desc'));return this;}
 insert(body){this.method='POST';this.body=body;return this;}update(body){this.method='PATCH';this.body=body;return this;}
 maybeSingle(){this.one=true;return this;}single(){this.one=true;this.required=true;return this;}
 async execute(){const r=await api('/rest/v1/'+this.table+'?'+this.q,{method:this.method,body:this.body,extra:{Prefer:'return=representation'}});if(!r.ok)return {data:null,error:{message:'Local PostgREST rejected '+this.table,code:r.data?.code}};
  if(this.one){if(!Array.isArray(r.data)||r.data.length>1||this.required&&r.data.length!==1)return {data:null,error:{message:'Unexpected local row cardinality'}};return {data:r.data[0]||null,error:null};}return {data:r.data,error:null};}
 then(a,b){return this.execute().then(a,b);}
}
const db={from:table=>new Query(table),auth:{getUser:async token=>{const r=await api('/auth/v1/user',{token});return r.ok?{data:{user:r.data},error:null}:{data:null,error:{message:'Local Auth denied JWT'}};}}};
// Execute the exact existing guards, stripping TS syntax only. Fail if source boundary changes.
progress.begin('source-guard-extraction');
const source=fs.readFileSync(new URL('../../supabase/functions/busy-mini-apps/index.ts',import.meta.url),'utf8');
const start=source.indexOf('async function requireUser(request: Request)'),end=source.indexOf('const EXPO_PUSH_URL',start);
assert.ok(start>=0&&end>start);const guardSource=source.slice(start,end);
assert.equal((guardSource.match(/async function /g)||[]).length,2);
progress.complete();progress.begin('source-guard-type-stripping');
assert.equal(typeof nodeModule.stripTypeScriptTypes,'function');
const strippedGuards=nodeModule.stripTypeScriptTypes(guardSource);
progress.complete();progress.begin('source-guard-evaluation');
const guards=new Function('supabase',strippedGuards+';return {requireUser,membership};')(db);
progress.complete();
const businessA='11111111-1111-4111-8111-111111111111',businessB='22222222-2222-4222-8222-222222222222',businessC='33333333-3333-4333-8333-333333333333';
const accounts=[];
for(const who of ['a','b','staff']){
 const email='fictional-'+who+'@example.invalid',password='DisposableOnly!26-'+who;
 progress.begin('auth-create-'+who);
 const created=await api('/auth/v1/admin/users',{method:'POST',body:{email,password,email_confirm:true,user_metadata:{role:'owner',business_id:businessA}}});assert.equal(created.status,200);
 progress.complete();progress.begin('auth-signin-'+who);
 const session=await api('/auth/v1/token?grant_type=password',{token:local.ANON_KEY,method:'POST',body:{email,password}});assert.equal(session.status,200);assert.ok(session.data.access_token);
 progress.complete();progress.begin('auth-require-user-'+who);
 const token=session.data.access_token,user=await guards.requireUser(new Request(base,{headers:{Authorization:'Bearer '+token}}));assert.equal(user.id,created.data.id);accounts.push({id:user.id,token});progress.complete();
}
pass('real-local-Auth-creation-password-signin-and-current-requireUser');
progress.begin('jwt-rejection');
for(const token of ['', 'not-a-jwt', accounts[0].token.slice(0,-8)+'forgedxx'])await assert.rejects(()=>guards.requireUser(new Request(base,{headers:{Authorization:'Bearer '+token}})));
pass('missing-malformed-and-tampered-JWT-rejected-by-real-Auth');
progress.begin('business-fixture-insert');
let r=await db.from('busy_businesses').insert([{id:businessA,name:'Fictional business A',created_by:accounts[0].id},{id:businessB,name:'Fictional business B',created_by:accounts[1].id},{id:businessC,name:'Fictional capacity fixture',created_by:accounts[0].id}]).select('*');assert.equal(r.error,null);
progress.complete();progress.begin('membership-fixture-insert');
r=await db.from('busy_business_memberships').insert([{business_id:businessA,user_id:accounts[0].id,role:'owner'},{business_id:businessB,user_id:accounts[1].id,role:'owner'},{business_id:businessA,user_id:accounts[2].id,role:'staff'}]).select('*');assert.equal(r.error,null);
async function scope(account,businessId){const u=await guards.requireUser(new Request(base,{headers:{Authorization:'Bearer '+account.token}}));const m=await guards.membership(u.id,businessId,false);return {businessId:m.business_id,actorId:u.id,role:m.role};}
progress.complete();progress.begin('membership-and-role-enforcement');
const owner=await scope(accounts[0],businessA),other=await scope(accounts[1],businessB);
await assert.rejects(()=>scope(accounts[1],businessA));await assert.rejects(()=>guards.membership(accounts[2].id,businessA,true));
await assert.rejects(()=>manageBusinessContent(db,{...owner,role:'staff'},{action:'content_list'}));
pass('exact-current-membership-guard-and-role-enforcement-ignore-user-metadata');
const product={name:'Fictional bowl',description:'Disposable product',category:'Test',image:null,status:'active',amountMinor:2450,currency:'GBP',availability:'not_tracked'};
const save=(s,id,expectedRevision,data=product)=>manageBusinessContent(db,s,{action:'content_save',id,expectedRevision,kind:'product',data,ownerApproved:true});
const publish=(s,row)=>manageBusinessContent(db,s,{action:'content_publish',id:row.id,expectedRevision:row.revision,ownerApproved:true});
progress.begin('record-store-cas-undo-and-tenant-scope');
let row=(await save(owner,'product_fixture_a',0)).record;assert.equal(row.can_undo,false);
assert.equal((await readBusinessContent(db,businessA,{publicOnly:true})).records.length,0);
row=(await publish(owner,row)).record;assert.equal(row.id,'product_fixture_a');assert.equal(row.published_revision,2);
const attempts=await Promise.allSettled([save(owner,row.id,2,{...product,name:'Revision one'}),save(owner,row.id,2,{...product,name:'Revision two'})]);
assert.equal(attempts.filter(x=>x.status==='fulfilled').length,1);assert.equal(attempts.filter(x=>x.status==='rejected').length,1);
row=attempts.find(x=>x.status==='fulfilled').value.record;assert.equal(row.revision,3);assert.equal(row.can_undo,true);
const undone=await manageBusinessContent(db,owner,{action:'content_undo',id:row.id,expectedRevision:3,ownerApproved:true});assert.equal(undone.record.draft.name,product.name);assert.equal(undone.record.revision,4);
await assert.rejects(()=>save(owner,row.id,0));await assert.rejects(()=>save(other,row.id,4));
assert.equal((await readBusinessContent(db,businessB,{publicOnly:true})).records.length,0);
assert.equal((await readBusinessContent(db,businessA,{publicOnly:true})).records[0].data.name,product.name);
pass('actual-store-create-private-approval-generated-column-CAS-race-Undo-and-tenant-scope');
// Real Data API role/grant tests. Owners cannot bypass the Edge-only contract.
progress.begin('direct-crud-denial');
for(const token of [local.ANON_KEY,...accounts.map(a=>a.token)]){
 for(const [method,body] of [['GET',undefined],['POST',{id:'forbidden_record',business_id:businessA,kind:'product',revision:1,draft:product}],['PATCH',{revision:99}],['DELETE',undefined]]){
  const denied=await api('/rest/v1/busy_business_content?id=eq.product_fixture_a',{token,method,body});assert.ok([401,403].includes(denied.status),'Direct data access must fail by permissions/RLS');
 }
}
pass('real-PostgREST-anon-and-authenticated-direct-CRUD-denied');
// Real SQL constraint errors must be specific, not a generic network failure.
progress.begin('sql-constraints');
for(const [changes,code] of [[{revision:0},'23514'],[{published:product,published_revision:null},'23514'],[{can_undo:true},'428C9'],[{history:Array(9).fill(product)},'23514']]){
 const bad=await db.from('busy_business_content').update(changes).eq('business_id',businessA).eq('id',row.id).select('*');assert.equal(bad.error?.code,code);
}
pass('real-generated-column-revision-history-and-public-version-constraints');
// Same ID in a second tenant is legitimate; never a global identity collision.
progress.begin('same-id-other-tenant');
await save(other,'product_fixture_a',0);assert.equal((await readBusinessContent(db,businessB)).length,1);
progress.complete();progress.begin('event-cancellation');
const event={name:'Fictional workshop',description:'Disposable event',category:'Test',image:null,status:'scheduled',startsAt:'2030-01-01T10:00:00.000Z',endsAt:'2030-01-01T11:00:00.000Z',timeZone:'Europe/London',location:'Fictional studio',onlineUrl:''};
let ev=(await manageBusinessContent(db,owner,{action:'content_save',id:'event_fixture_a',kind:'event',expectedRevision:0,data:event,ownerApproved:true})).record;ev=(await publish(owner,ev)).record;
ev=(await manageBusinessContent(db,owner,{action:'content_save',id:ev.id,expectedRevision:ev.revision,data:{...event,status:'cancelled'},ownerApproved:true})).record;await publish(owner,ev);
assert.equal((await readBusinessContent(db,businessA,{publicOnly:true})).records.find(x=>x.id===ev.id).data.status,'cancelled');pass('real-event-approved-cancellation-projection');
progress.begin('capacity-seed');
const many=Array.from({length:199},(_,i)=>({id:'capacity_seed_'+String(i).padStart(4,'0'),business_id:businessC,kind:'product',revision:1,draft:product,history:[]}));
r=await db.from('busy_business_content').insert(many).select('id');assert.equal(r.error,null);
progress.complete();progress.begin('capacity-race');
const cap=await Promise.all([db.from('busy_business_content').insert({...many[0],id:'capacity_race_one'}).select('id').execute(),db.from('busy_business_content').insert({...many[0],id:'capacity_race_two'}).select('id').execute()]);
assert.equal(cap.filter(x=>!x.error).length,1);assert.equal(cap.filter(x=>x.error?.code==='P0001').length,1);assert.equal((await readBusinessContent(db,businessC)).length,200);pass('real-concurrent-insert-cap-serialisation');
// Active ownership is checked from records every time, not cached JWT metadata.
progress.begin('membership-revocation');
r=await db.from('busy_business_memberships').update({role:'viewer'}).eq('business_id',businessA).eq('user_id',accounts[0].id).select('*');assert.equal(r.error,null);
await assert.rejects(()=>guards.membership(accounts[0].id,businessA,true));await assert.rejects(()=>manageBusinessContent(db,{...owner,role:'viewer'},{action:'content_list'}));pass('current-membership-revocation-despite-valid-Auth-token');
progress.begin('final-report');
progress.success();
console.log(JSON.stringify({result:'passed',checks:done,evidence:'Real local Supabase Auth/PostgREST/Postgres; exact source guard bodies and trusted record adapter executed in Node. Not hosted or full Edge HTTP runtime.'}));

} catch(error) {
 if(progress)progress.fail(error);
 else console.error('{"result":"failed","category":"progress-initialisation"}');
 process.exitCode=1;
}
