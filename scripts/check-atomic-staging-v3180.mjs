import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {reviewBusinessBrainObservedOutcomes}
 from "../src/core/businessBrainMeasuredOutcomes.mjs";
import {prepareCoordinatedBuilderReview}
 from "../src/core/coordinatedBuilderReviewV3180.mjs";
import {analyseStagingMigrations} from "../src/core/stagingMigrationPlan.mjs";
import {readdirSync} from "node:fs";
import {fileURLToPath} from "node:url";
import {join} from "node:path";
let checks=0;
const eq=(a,b)=>{assert.deepEqual(a,b);checks++;};
const ok=v=>{assert.ok(v);checks++;};
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const business="11111111-1111-4111-8111-111111111111",
 app="33333333-3333-4333-8333-333333333333",
 other="22222222-2222-4222-8222-222222222222",
 id="44444444-4444-4444-8444-444444444444";
const request={id,business_id:business,mini_app_id:app,
 request_type:"booking_request",request_origin:"signed_in",
 status:"accepted",created_at:"2026-10-08T00:00:00Z",
 payload:{name:"PRIVATE_CUSTOMER_NEVER_RETURN"}};
const records=reviewBusinessBrainObservedOutcomes({
 businessId:business,appId:app,requests:[
  request,{...request,id:"55555555-5555-4555-8555-555555555555",
   status:"received",created_at:"2026-10-08T00:00:00Z"},
  {...request,business_id:other}
 ],links:[{request_id:id,business_id:business,
 bridge_state:"booking_confirmed"}],nowISO:"2026-10-12T00:00:00Z"
});
ok(records.ok);eq(records.metrics.requests,2);
eq(records.metrics.awaitingOwner,1);
eq(records.metrics.awaitingOver48Hours,1);
eq(records.metrics.ownerMarkedBookings,1);
eq(records.metrics.conflictingBookingStates,0);
eq(records.excludedOtherBusinessOrApp,1);
eq(records.nextOwnerReview.id,"review_waiting_customers");
eq(records.measuredCustomerConversion,false);
eq(records.measuredExternalDelivery,false);
ok(!JSON.stringify(records).includes("PRIVATE_CUSTOMER"));
const broken=reviewBusinessBrainObservedOutcomes({businessId:business,
 appId:app,requests:[request],links:[]});
eq(broken.metrics.conflictingBookingStates,1);
eq(broken.nextOwnerReview.id,"review_conflicting_bookings");
ok(!reviewBusinessBrainObservedOutcomes({businessId:other,appId:"",requests:[]}).ok);
const website={id:"website-1",generation:5,sections:[],businessName:"Private Business A"};
const brandBrain={websiteBrief:{businessName:"Private Business A",
 services:[{name:"Private Service A",description:"No leak"}]}};
const appDraft={modules:[{key:"services",enabled:true}],
 publicProfile:{businessName:"Private Business B",
 services:[{name:"Private Service B",description:"No leak"}]}};
const scope={businessId:business,appBusinessId:business,
 websiteBusinessId:business,websiteDraft:website,
 brandBrain,appConfig:appDraft,websiteRevision:5,appRevision:10};
const synced=prepareCoordinatedBuilderReview(scope);
ok(synced.ok);ok(synced.unresolvedFactChecks>=1);
eq(synced.sharedServiceOverlapCount,0);
eq(synced.preserveIndependentLayouts,true);
eq(synced.noUnapprovedCopying,true);
ok(!JSON.stringify(synced).includes("Private Service A"));
ok(!JSON.stringify(synced).includes("Private Business B"));
ok(!prepareCoordinatedBuilderReview({...scope,websiteBusinessId:other}).ok);
ok(!prepareCoordinatedBuilderReview({...scope,websiteRevision:4}).ok);
const baseline=read("staging/ISOLATED_ONLY_business_core_v3180.sql");
for(const key of ["create table if not exists public.busy_businesses",
 "create table if not exists public.busy_business_memberships",
 "force row level security","revoke all","to service_role"]){
 ok(baseline.includes(key));
}
const dir=fileURLToPath(new URL("../supabase/migrations/",import.meta.url));
const migrations=readdirSync(dir).filter(n=>n.endsWith(".sql"))
 .map(name=>({name,sql:readFileSync(join(dir,name),"utf8")}));
const plan=analyseStagingMigrations(migrations,{
 existingTables:["busy_businesses","busy_business_memberships"]});
ok(plan.ok);eq(plan.missingBaseline,[]);
eq(plan.orderingIssues,[]);
ok(migrations.some(x=>x.name.includes("v3_180_atomic_business_app_handoff")));
const sql=read("supabase/migrations/20261012183000_v3_180_atomic_business_app_handoff.sql");
for(const key of ["security definer","for update",
 "busy_business_memberships","busy_mini_app_request_links",
 "busy_mini_app_request_events","busy_mini_app_requests",
 "customer_unread_count","from public,anon,authenticated",
 "to service_role","changed',false"]){
 ok(sql.toLowerCase().includes(key.toLowerCase()));
}
const ci=read("staging/ci-atomic-handoff-v3180.sql");
for(const key of ["postgres","ci_handoff_failure_v3180",
 "PARTIAL COMMIT","Cross-tenant write was accepted",
 "Idempotent replay failed"]){
 ok(ci.toLowerCase().includes(key.toLowerCase()));
}
const edge=read("supabase/functions/busy-mini-apps/index.ts");
const start=edge.indexOf("async function markRequestLinked("),
 end=edge.indexOf("/**\n * V3.159:",start);
ok(start>0&&end>start);
const handoff=edge.slice(start,end);
ok(handoff.includes('supabase.rpc("busy_mark_mini_app_request_link_v3181"'));
ok(handoff.includes("result.notificationPending"));
ok(!handoff.includes(".upsert("));
ok(!handoff.includes("busy_mini_app_request_events"));
ok(!handoff.includes("bumpUnread("));
ok(edge.includes('writeActions.has(action)'));
const appController=read("src/app/AppController.js");
const booking=appController.slice(appController.indexOf("  const setBookingStatus = async ("),
 appController.indexOf("  const markBookingCompleted =",appController.indexOf("  const setBookingStatus = async (")));
ok(booking.indexOf('miniAppsRequest("mark_request_linked"')>=0);
ok(booking.indexOf('miniAppsRequest("mark_request_linked"')<
   booking.indexOf("updateReplyAction(customerId"));
ok(booking.includes("return false"));
const appUi=read("src/screens/miniApps.js");
ok(appUi.includes("V3.180 • What recorded requests tell Busy"));
ok(appUi.includes("V3.180 • Keep website and app facts coordinated"));
const domain=read("src/domain/miniApps.js");
ok(domain.includes("reviewBusinessBrainObservedOutcomes"));
const workflow=read(".github/workflows/transactional-staging-v3180.yml");
ok(workflow.includes("ci-atomic-handoff-v3180.sql"));
ok(workflow.includes("postgres:17"));
console.log("V3.180 "+checks+" focused assertions PASS (real SQL separately tested by CI Postgres).");
