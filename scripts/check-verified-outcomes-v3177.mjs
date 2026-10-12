import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {currentPreparedWebsite,readWebsiteBrainHistory,
 recordWebsiteBrainChoice,clearWebsiteBrainHistory}
 from "../supabase/functions/busy-website-publish/websiteBrainChoicesService.mjs";
import {runSyntheticStagingProbe}
 from "../supabase/functions/busy-mini-apps/stagingSyntheticService.mjs";
import {currentPreparedWebsiteRevision,validateWebsiteBrainChoice,
 normalizeWebsiteBrainHistory}
 from "../src/core/websiteBrainChoiceContract.mjs";
import {assessBrainOutcomeEvidence}
 from "../src/core/businessBrainOutcomeEvidence.mjs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const b="11111111-1111-4111-8111-111111111111";
const other="22222222-2222-4222-8222-222222222222";
const u="33333333-3333-4333-8333-333333333333";
const another="44444444-4444-4444-8444-444444444444";
const siteId="55555555-5555-4555-8555-555555555555";
const depId="66666666-6666-4666-8666-666666666666";
const appId="77777777-7777-4777-8777-777777777777";
const prepared={id:depId,website_id:siteId,business_id:b,
 source_generation:7,source_draft:{id:"website-private",generation:7},
 version_no:5};
let rows=[prepared], history=[], staging=[], active=prepared;
const db={from(table){
 const fields=table==="busy_website_deployments"?()=>rows:
  table==="busy_website_brain_decisions"?()=>history:
  table==="busy_staging_qa_runs"?()=>staging:
  ()=>{throw Error("Unexpected table "+table)};
 let conditions=[],kind="select",insertData=null,desc=true,take=100;
 const api={
  select(){return this},
  eq(k,v){conditions.push([k,v]);return this},
  order(k,v){if(!this.sortKey){desc=v?.ascending===false;this.sortKey=k;}return this},
  limit(n){take=n;return this},
  insert(v){kind="insert";insertData=v;return this},
  delete(){kind="delete";return this},
  single(){return this.resolve(true)},
  maybeSingle(){return this.resolve(true)},
  async resolve(single=false){
   let collection=fields();
   if(kind==="insert"){
    if(collection.some(r=>r.business_id===insertData.business_id&&
      r.owner_user_id===insertData.owner_user_id&&
      r.request_key===insertData.request_key))
     return {data:null,error:{code:"23505"}};
    const row={...insertData,id:"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
     created_at:collection.length+1};
    collection.push(row);return {data:{id:row.id},error:null};
   }
   let found=collection.filter(r=>conditions.every(([k,v])=>r[k]===v));
   if(kind==="delete"){
    if(table==="busy_website_brain_decisions")
     history=history.filter(r=>!found.includes(r));
    return {data:found.map(x=>({id:x.id})),error:null};
   }
   if(this.sortKey)found.sort((a,b)=>{
    let va=a[this.sortKey],vb=b[this.sortKey];
    return (va<vb?-1:va>vb?1:0)*(desc?-1:1);
   });
   const picked=found.slice(0,take);
   return {data:single?picked[0]||null:picked,error:null};
  },
  then(resolve,reject){return this.resolve().then(resolve,reject)}
 };
 return api;
}};
const websiteForBusiness=async businessId=>businessId===b?{id:siteId}:null;
const appForBusiness=async businessId=>businessId===b?
 {id:appId,draft_revision:6}:null;
const body={deploymentId:depId,draftId:"website-private",expectedGeneration:7};
const current=await currentPreparedWebsite(db,websiteForBusiness,b,body);
assert.equal(current.website.id,siteId);
assert.equal(current.deployment.id,depId);
await assert.rejects(()=>currentPreparedWebsite(db,websiteForBusiness,other,body),/Prepare/);
await assert.rejects(()=>currentPreparedWebsite(db,websiteForBusiness,b,{
 ...body,expectedGeneration:8}),/changed/);
await assert.rejects(()=>currentPreparedWebsite(db,websiteForBusiness,b,{
 ...body,draftId:"other-draft"}),/changed/);
await assert.rejects(()=>currentPreparedWebsite(db,websiteForBusiness,b,{
 ...body,deploymentId:appId}),/changed/);
const revision=currentPreparedWebsiteRevision({
 draft:{id:"website-private",generation:7},
 hostedPreview:{id:depId,source_generation:7}
});
assert.equal(revision.ok,true);
assert.equal(currentPreparedWebsiteRevision({
 draft:{id:"website-private",generation:8},
 hostedPreview:{id:depId,source_generation:7}}).ok,false);
assert.equal(currentPreparedWebsiteRevision({
 draft:{id:"website-private",generation:7},
 hostedPreview:{id:depId,source_generation:7},
 draftChangedSinceHosted:true}).ok,false);
assert.equal(validateWebsiteBrainChoice({
 draft:{id:"website-private",generation:7},
 hostedPreview:{id:depId,source_generation:7},
 ownerApproved:false,goal:"book",actionId:"verify_customer_path",
 decision:"rejected"}).ok,false);
const choice={...body,goal:"book",actionId:"verify_customer_path",
 decision:"rejected",surface:"website",ownerApproved:true};
const stored=await recordWebsiteBrainChoice(db,websiteForBusiness,b,u,
 choice,"req-website-01");
assert.equal(stored.saved,true);
assert.equal(stored.publicWebsiteUnchanged,true);
assert.equal(history.length,1);
await recordWebsiteBrainChoice(db,websiteForBusiness,b,u,
 choice,"req-website-01");
assert.equal(history.length,1);
await assert.rejects(()=>recordWebsiteBrainChoice(db,websiteForBusiness,b,u,
 {...choice,decision:"approved"},"req-website-01"),/different/);
await recordWebsiteBrainChoice(db,websiteForBusiness,b,u,
 {...choice,decision:"approved"},"req-website-02");
await recordWebsiteBrainChoice(db,websiteForBusiness,b,another,
 choice,"other-owner-01");
const readHistory=await readWebsiteBrainHistory(db,websiteForBusiness,b,u,body);
assert.equal(readHistory.records.length,2);
assert.deepEqual(readHistory.records.map(x=>x.decision),["rejected","approved"]);
assert.equal(JSON.stringify(readHistory).includes(another),false);
const normal=normalizeWebsiteBrainHistory({
 history:readHistory,businessId:b,
 draft:{id:"website-private",generation:7},
 hostedPreview:{id:depId,source_generation:7}});
assert.equal(normal.ok,true);
assert.equal(normal.records.length,2);
assert.equal(normalizeWebsiteBrainHistory({
 history:{...readHistory,records:[{...normal.records[0],businessId:other}]},
 businessId:b,draft:{id:"website-private",generation:7},
 hostedPreview:{id:depId,source_generation:7}}).ok,false);
await assert.rejects(()=>clearWebsiteBrainHistory(
 db,websiteForBusiness,b,u,{...body,ownerApproved:false}),/confirmation/);
const clear=await clearWebsiteBrainHistory(
 db,websiteForBusiness,b,u,{...body,ownerApproved:true});
assert.equal(clear.cleared,true);
assert.equal(clear.removedCount,2);
assert.equal(history.length,1);
assert.equal(history[0].owner_user_id,another);
rows.push({...prepared,id:"88888888-8888-4888-8888-888888888888",
 version_no:6,source_generation:8,
 source_draft:{id:"website-private",generation:8}});
await assert.rejects(()=>recordWebsiteBrainChoice(
 db,websiteForBusiness,b,u,choice,"req-website-03"),/changed/);
rows=[prepared]; // reset for test-only fixtures, no real mutation

const params={appId,expectedRevision:6,journeyKind:"booking_request",
 channel:"busy_marketplace",ownerApproved:true};
await assert.rejects(()=>runSyntheticStagingProbe(
 db,appForBusiness,b,u,{...params,ownerApproved:false},"qa-request-01"),
 /approve/);
await assert.rejects(()=>runSyntheticStagingProbe(
 db,appForBusiness,b,u,{...params,channel:"production"},"qa-request-01"),
 /permitted/);
await assert.rejects(()=>runSyntheticStagingProbe(
 db,appForBusiness,b,u,{...params,expectedRevision:5},"qa-request-01"),
 /changed/);
const probe=await runSyntheticStagingProbe(
 db,appForBusiness,b,u,params,"qa-request-01");
assert.equal(probe.syntheticDatabaseRoundTripVerified,true);
assert.equal(probe.serverReadBackVerified,true);
assert.equal(probe.noCustomerRequestCreated,true);
assert.equal(probe.noCustomerMessagesSent,true);
assert.equal(probe.notProductionReleaseProof,true);
assert.equal(staging.length,1);
const retry=await runSyntheticStagingProbe(
 db,appForBusiness,b,u,params,"qa-request-01");
assert.equal(retry.idempotentRepeat,true);
assert.equal(staging.length,1);
await assert.rejects(()=>runSyntheticStagingProbe(
 db,appForBusiness,b,u,{...params,channel:"standalone"},"qa-request-01"),
 /did not match/);
await runSyntheticStagingProbe(db,appForBusiness,b,another,
 {...params,journeyKind:"enquiry",channel:"guest_web"},"qa-request-02");
assert.equal(staging.length,2);
assert.equal(staging[0].owner_user_id,u);
assert.equal(staging[1].owner_user_id,another);
const proof=assessBrainOutcomeEvidence({
 businessId:b,appId,revision:6,
 evidence:{...probe,businessId:b},
 routeKind:"booking_request",channel:"busy_marketplace"});
assert.equal(proof.ok,true);
assert.equal(proof.syntheticStagingEvidencePresented,true);
assert.equal(proof.canClaimRealBookings,false);
assert.equal(proof.canClaimActualMessageDelivery,false);
assert.equal(proof.canClaimSalesLift,false);
assert.equal(proof.notReleaseApproval,true);
assert.equal(assessBrainOutcomeEvidence({
 businessId:other,appId,revision:6,
 evidence:{...probe,businessId:b},
 routeKind:"booking_request",channel:"busy_marketplace"
}).syntheticStagingEvidencePresented,false);
assert.equal(assessBrainOutcomeEvidence({
 businessId:b,appId,revision:7,
 evidence:{...probe,businessId:b},
 routeKind:"booking_request",channel:"busy_marketplace"
}).syntheticStagingEvidencePresented,false);

const migration=read("supabase/migrations/20261012154500_v3_177_website_brain_staging_qa.sql");
for(const pattern of ["busy_website_brain_decisions","busy_staging_qa_runs",
 "enable row level security","revoke all","from public,anon,authenticated",
 "grant select,insert,delete","to service_role",
 "unique (business_id,owner_user_id,request_key)"])
 assert.ok(migration.includes(pattern),"Migration missing "+pattern);
const websiteEdge=read("supabase/functions/busy-website-publish/index.ts");
for(const pattern of ["readWebsiteBrainHistory","recordWebsiteBrainChoice",
 "clearWebsiteBrainHistory","member.business_id",
 '"website_brain_owner_decisions"','"record_website_brain_decision"',
 '"clear_website_brain_decisions"'])
 assert.ok(websiteEdge.includes(pattern),"Website edge missing "+pattern);
const appEdge=read("supabase/functions/busy-mini-apps/index.ts");
for(const pattern of ["isolatedStagingGuard","runSyntheticStagingProbe",
 '"staging_synthetic_round_trip"','"BUSY_STAGING_MODE"',
 "resolvedBusinessId,user.id"])
 assert.ok(appEdge.includes(pattern),"Staging Edge missing "+pattern);
const controller=read("src/app/AppController.js");
for(const pattern of ["getWebsiteBrainOwnerDecisions","recordWebsiteBrainOwnerDecision",
 "clearWebsiteBrainOwnerDecisions","runIsolatedSyntheticAppJourney",
 '"staging_synthetic_round_trip"'])
 assert.ok(controller.includes(pattern),"Controller missing "+pattern);
const webUi=read("src/screens/websiteBuilder.js");
for(const pattern of ["currentPreparedWebsiteRevision",
 "Not useful — remember this","Clear saved website decisions",
 "webBrainHistory.records"])
 assert.ok(webUi.includes(pattern),"Website UI missing "+pattern);
const appUi=read("src/screens/miniApps.js");
for(const pattern of ["assessBrainOutcomeEvidence",
 "Run isolated synthetic database check",
 "This does NOT verify customer bookings"])
 assert.ok(appUi.includes(pattern),"App UI missing "+pattern);
const workflow=read(".github/workflows/verified-outcomes-v3177.yml");
for(const pattern of ["node scripts/check-verified-outcomes-v3177.mjs",
 "node scripts/check-authenticated-brain-staging-v3176.mjs",
 "expo export --platform ios","expo export --platform android",
 "prepare-standalone-prototype-v3154.mjs"])
 assert.ok(workflow.includes(pattern),"Workflow missing "+pattern);
console.log("V3.177 PASS: private website memory anchored to server deployment, owner tenancy/clear/idempotency, isolated staging synthetic DB round-trip, bounded outcome proof and both builders.");
