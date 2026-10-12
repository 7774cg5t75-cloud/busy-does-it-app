import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {readOwnerBrainDecisions,recordOwnerBrainDecision,
 clearOwnerBrainDecisions}
 from "../supabase/functions/busy-mini-apps/brainOwnerDecisionsService.mjs";
import {isolatedStagingGuard}
 from "../supabase/functions/busy-mini-apps/stagingConnectionGuard.mjs";
import {validateOwnerBrainWrite,normalizeOwnerBrainHistory}
 from "../src/core/brainOwnerDecisionsContract.mjs";

const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const business="11111111-1111-4111-8111-111111111111";
const other="22222222-2222-4222-8222-222222222222";
const appId="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const anotherApp="bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const owner="cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const stranger="dddddddd-dddd-4ddd-8ddd-dddddddddddd";
let latestApp={id:appId,draft_revision:6};
const appForBusiness=async id=>id===business?latestApp:null;
let rows=[];
const fake={
 from(table){
  assert.equal(table,"busy_brain_owner_decisions");
  let operation="read",toInsert=null,filters=[],limit=80,descending=true;
  const builder={
   select(_fields){return this;},
   eq(k,v){filters.push([k,v]);return this;},
   order(_k,settings){descending=settings?.ascending===false;return this;},
   limit(n){limit=n;return this.execute();},
   insert(value){operation="insert";toInsert=value;return this;},
   delete(){operation="delete";return this;},
   single(){return this.execute(true);},
   maybeSingle(){return this.execute(true);},
   async execute(single=false){
    if(operation==="insert"){
     if(rows.some(r=>r.business_id===toInsert.business_id&&
       r.owner_user_id===toInsert.owner_user_id&&
       r.request_key===toInsert.request_key))
      return {data:null,error:{code:"23505"}};
     const row={...toInsert,created_at:rows.length+1,id:"row"+rows.length};
     rows.push(row);
     return {data:{id:row.id},error:null};
    }
    const matching=rows.filter(r=>filters.every(([k,v])=>r[k]===v));
    if(operation==="delete"){
     rows=rows.filter(r=>!matching.includes(r));
     return {data:matching.map(r=>({id:r.id})),error:null};
    }
    matching.sort((a,b)=>descending?b.created_at-a.created_at:a.created_at-b.created_at);
    return {data:single?matching[0]||null:matching.slice(0,limit),error:null};
   },
   then(resolve,reject){return this.execute().then(resolve,reject);}
  };
  return builder;
 }
};

const base={appId,expectedRevision:6,goal:"book",
 actionId:"verify_customer_path",decision:"rejected",surface:"app",
 ownerApproved:true};
assert.equal(validateOwnerBrainWrite(base).ok,true);
assert.equal(validateOwnerBrainWrite({...base,appId:anotherApp}).ok,true);
assert.equal(validateOwnerBrainWrite({...base,decision:"publish"}).ok,false);
assert.equal(validateOwnerBrainWrite({...base,ownerApproved:false}).ok,false);
assert.equal(validateOwnerBrainWrite({...base,surface:"website"}).ok,false);
assert.equal(validateOwnerBrainWrite({...base,expectedRevision:0}).ok,false);
await assert.rejects(()=>recordOwnerBrainDecision(
 fake,appForBusiness,business,owner,{...base,ownerApproved:false},
 "request-unique-123"),/Review a supported/);
await assert.rejects(()=>recordOwnerBrainDecision(
 fake,appForBusiness,business,owner,{...base,appId:anotherApp},
 "request-unique-123"),/changed/);
await assert.rejects(()=>recordOwnerBrainDecision(
 fake,appForBusiness,business,owner,{...base,expectedRevision:5},
 "request-unique-123"),/changed/);
const inserted=await recordOwnerBrainDecision(fake,appForBusiness,
 business,owner,base,"request-unique-123");
assert.equal(inserted.ownerDecisionRecorded,true);
assert.equal(inserted.workItemNotExecuted,true);
assert.equal(inserted.publishedAppUnchanged,true);
assert.equal(rows.length,1);
await recordOwnerBrainDecision(fake,appForBusiness,
 business,owner,base,"request-unique-123");
assert.equal(rows.length,1,"Same request key must be idempotent");
await assert.rejects(()=>recordOwnerBrainDecision(fake,appForBusiness,
 business,owner,{...base,decision:"approved"},"request-unique-123"),
 /different decision/);
await recordOwnerBrainDecision(fake,appForBusiness,business,owner,
 {...base,decision:"approved"},"request-unique-456");
await recordOwnerBrainDecision(fake,appForBusiness,business,stranger,
 base,"request-stranger-999");
const history=await readOwnerBrainDecisions(fake,appForBusiness,
 business,owner,{appId,expectedRevision:6});
assert.equal(history.records.length,2);
assert.equal(history.records[0].decision,"rejected");
assert.equal(history.records[1].decision,"approved");
assert.equal(history.records.every(r=>r.businessId===business),true);
assert.equal(history.records.every(r=>r.websiteRevision===0),true);
assert.equal(JSON.stringify(history).includes(owner),false);
assert.equal(JSON.stringify(history).includes(stranger),false);
const normal=normalizeOwnerBrainHistory({
 records:history.records,businessId:business,appId,appRevision:6});
assert.equal(normal.ok,true);
assert.equal(normal.records.length,2);
assert.equal(normalizeOwnerBrainHistory({
 records:[{...normal.records[0],businessId:other}],
 businessId:business,appId,appRevision:6}).ok,false);
assert.equal(normalizeOwnerBrainHistory({
 records:[{...normal.records[0],appRevision:7}],
 businessId:business,appId,appRevision:6}).ok,false);
await assert.rejects(()=>readOwnerBrainDecisions(fake,appForBusiness,
 other,owner,{appId,expectedRevision:6}),/changed/);
latestApp={...latestApp,draft_revision:7};
await assert.rejects(()=>readOwnerBrainDecisions(fake,appForBusiness,
 business,owner,{appId,expectedRevision:6}),/changed/);
latestApp={...latestApp,draft_revision:6};
await assert.rejects(()=>clearOwnerBrainDecisions(fake,appForBusiness,
 business,owner,{appId,expectedRevision:6,ownerApproved:false}),
 /Confirm/);
const cleared=await clearOwnerBrainDecisions(fake,appForBusiness,
 business,owner,{appId,expectedRevision:6,ownerApproved:true});
assert.equal(cleared.cleared,true);
assert.equal(cleared.removedCount,2);
assert.equal(rows.length,1,"Another owner's records must survive a clear");
assert.equal(rows[0].owner_user_id,stranger);
assert.equal((await readOwnerBrainDecisions(fake,appForBusiness,
 business,owner,{appId,expectedRevision:6})).records.length,0);

assert.equal(isolatedStagingGuard({
 mode:"isolated",projectRef:"abcdefghijklmnopqrst",
 supabaseUrl:"https://abcdefghijklmnopqrst.supabase.co"}).ok,true);
for(const entry of [
 {mode:"production",projectRef:"abcdefghijklmnopqrst",
  supabaseUrl:"https://abcdefghijklmnopqrst.supabase.co"},
 {mode:"isolated",projectRef:"productionrefabcdefghi",
  supabaseUrl:"https://abcdefghijklmnopqrst.supabase.co"},
 {mode:"isolated",projectRef:"abcdefghijklmnopqrst",
  supabaseUrl:"https://abcdefghijklmnopqrst.supabase.co.evil.com"},
 {mode:"isolated",projectRef:"abcdefghijklmnopqrst",
  supabaseUrl:"http://abcdefghijklmnopqrst.supabase.co"},
 {mode:"isolated",projectRef:"abcdefghijklmnopqrst",
  supabaseUrl:"https://other.abcdefghijklmnopqrst.supabase.co"}
 ])assert.equal(isolatedStagingGuard(entry).ok,false);

const migration=read("supabase/migrations/20261012150500_v3_176_business_brain_owner_decisions.sql");
for(const token of ["enable row level security","revoke all","from public,anon,authenticated",
 "grant select,insert,delete","to service_role",
 "unique (business_id,owner_user_id,request_key)"]){
 assert.ok(migration.includes(token),"Migration missing "+token);
}
const api=read("supabase/functions/busy-mini-apps/index.ts");
for(const token of [
 'import {readOwnerBrainDecisions,recordOwnerBrainDecision,clearOwnerBrainDecisions}',
 'import {isolatedStagingGuard}',
 '"record_brain_owner_decision"','"brain_owner_decisions"',
 '"clear_brain_owner_decisions"','"staging_connection_probe"',
 'member.business_id','writeActions.has(action)',
 'Deno.env.get("BUSY_STAGING_MODE")',
 'ownerMembershipVerified:true','noRequestsSubmitted:true'
 ])assert.ok(api.includes(token),"Authenticated Edge integration missing: "+token);
const controller=read("src/app/AppController.js");
for(const token of ["validateOwnerBrainWrite","normalizeOwnerBrainHistory",
 "miniAppsRequest(\"record_brain_owner_decision\"",
 "miniAppsRequest(\"brain_owner_decisions\"",
 "miniAppsRequest(\"clear_brain_owner_decisions\"",
 "miniAppsRequest(\"staging_connection_probe\"",
 "getAppBrainDecisions,","recordAppBrainOwnerDecision,",
 "clearAppBrainOwnerDecisions,","checkIsolatedAppStagingConnection,"]){
 assert.ok(controller.includes(token),"Native controller integration missing: "+token);
}
const ui=read("src/screens/miniApps.js");
for(const token of ["Not useful — remember my choice",
 "Clear my saved Business Brain choices",
 "Check isolated staging connection (read only)",
 "brainOwnerHistory.records",
 "getAppBrainDecisions({appId,expectedRevision:revision})"]){
 assert.ok(ui.includes(token),"Owner UI missing: "+token);
}
const workflow=read(".github/workflows/authenticated-brain-staging-v3176.yml");
for(const token of [
 "node scripts/check-authenticated-brain-staging-v3176.mjs",
 "node scripts/check-business-brain-staging-v3175.mjs",
 "expo export --platform ios","expo export --platform android",
 "prepare-standalone-prototype-v3154.mjs"
 ])assert.ok(workflow.includes(token),"CI missing "+token);
console.log("V3.176 PASS: scoped auth-backed owner decision persistence, idempotency, stale revisions, RLS service-only SQL, staging allowlist, native owner UI and CI.");
