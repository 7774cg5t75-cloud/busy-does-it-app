import assert from "node:assert/strict";
import {readdirSync,readFileSync} from "node:fs";
import {join} from "node:path";
import {fileURLToPath} from "node:url";
import {analyseStagingMigrations} from "../src/core/stagingMigrationPlan.mjs";
import {founderReadinessTriage} from "../src/core/founderReadinessTriage.mjs";
import {preflightRequestBridge,validBookingDate}
 from "../supabase/functions/busy-mini-apps/requestBridgePreflight.mjs";
import {summarizeStoredCustomerJourneys} from "../src/core/storedCustomerJourneys.mjs";
import {reviewBusinessInformation} from "../src/core/businessInfoClarity.mjs";
let checks=0;
const ok=(x)=>{assert.ok(x);checks++;};
const eq=(a,b)=>{assert.deepEqual(a,b);checks++;};
const business="11111111-1111-4111-8111-111111111111";
const appid="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const requestid="cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const dir=fileURLToPath(new URL("../supabase/migrations/",import.meta.url));
const migrations=readdirSync(dir).filter(n=>n.endsWith(".sql")).map(name=>
 ({name,sql:readFileSync(join(dir,name),"utf8")}));
const report=analyseStagingMigrations(migrations);
ok(report.ok);ok(report.migrationCount>=20);ok(report.requiresPriorSchemaReview);
eq(report.sqlApplied,false);eq(report.safeToApplyAutomatically,false);
ok(report.sequence.every(x=>x.name.endsWith(".sql")));
ok(!analyseStagingMigrations([{name:"oops.sql",sql:""}]).ok);
ok(!analyseStagingMigrations([migrations[0],migrations[0]]).ok);
const missing=analyseStagingMigrations([
 {name:"20261001000000_test.sql",sql:"create table public.a(id uuid references public.base(id));"},
 {name:"20261002000000_test.sql",sql:"alter table public.a add column nice text;"}
]);
eq(missing.missingBaseline,["base"]);
eq(missing.orderingIssues.length,0);
eq(analyseStagingMigrations([
 {name:"20261001000000_first.sql",sql:"alter table public.later add column test text;"},
 {name:"20261002000000_second.sql",sql:"create table public.later(id uuid);"}
]).orderingIssues.length,1);
eq(analyseStagingMigrations([
 {name:"20261001000000_first.sql",sql:"alter table public.ready add column test text;"}
],{existingTables:["ready"]}).violations.length,0);
const initial=founderReadinessTriage();
ok(initial.ok);eq(initial.unresolved,7);eq(initial.releaseAuthorized,false);
ok(!founderReadinessTriage({environment:"production"}).ok);
ok(!founderReadinessTriage({observations:[
 {asset:"edge",state:"verified"},{asset:"edge",state:"failed"}]}).ok);
const founder=founderReadinessTriage({observations:[
 {asset:"edge",state:"verified"},{asset:"database",state:"failed"}]});
eq(founder.nextSafeReview,"database");eq(founder.items[0].state,"failed");
eq(founder.unresolved,6);eq(founder.noAutomaticRemediation,true);
const request={status:"received",request_type:"booking_request"};
const base={request,bridgeState:"booking_draft",customerRecordId:"customer-1",
 actionRecordId:"action-1"};
ok(preflightRequestBridge(base).ok);
ok(!preflightRequestBridge({...base,bridgeState:"enquiry_linked"}).ok);
ok(!preflightRequestBridge({...base,customerRecordId:""}).ok);
ok(!preflightRequestBridge({...base,request:{...request,status:"closed"}}).ok);
const existing={bridge_state:"booking_draft",customer_record_id:"customer-1",
 action_record_id:"action-1",metadata:{}};
ok(preflightRequestBridge({...base,existing}).ok);
ok(!preflightRequestBridge({...base,existing,customerRecordId:"someone-else"}).ok);
ok(!preflightRequestBridge({...base,existing,bridgeState:"linked"}).ok);
const confirmation={...base,existing,bridgeState:"booking_confirmed",
 ownerApproved:true,metadata:{bookingDate:"2026-11-12",bookingTime:"14:30"}};
const reviewed=preflightRequestBridge(confirmation);
ok(reviewed.ok);eq(reviewed.nextStatus,"accepted");
eq(reviewed.independentDiaryReceiptVerified,false);
ok(!preflightRequestBridge({...confirmation,ownerApproved:false}).ok);
ok(!preflightRequestBridge({...confirmation,metadata:{
 bookingDate:"2026-02-31",bookingTime:"14:30"}}).ok);
eq(validBookingDate("2026-02-28","23:59"),true);
eq(validBookingDate("2026-02-30","23:59"),false);
eq(validBookingDate("2026-11-12","25:00"),false);
const again=preflightRequestBridge({
 ...confirmation,request:{...request,status:"accepted"},
 existing:{...existing,bridge_state:"booking_confirmed",metadata:confirmation.metadata}
});
ok(again.ok);eq(again.noChange,true);
ok(!preflightRequestBridge({...confirmation,existing:{
 ...existing,bridge_state:"closed"}}).ok);
const app={id:appid,business_id:business};
const req={id:requestid,mini_app_id:appid,business_id:business,
 request_type:"booking_request",status:"accepted",payload:{phone:"DO_NOT_LEAK"}};
const stats=summarizeStoredCustomerJourneys({app,requests:[req],links:[{
 request_id:requestid,business_id:business,bridge_state:"booking_confirmed"}]});
ok(stats.ok);eq(stats.bookingRequests,1);
eq(stats.ownerMarkedConfirmedBookings,1);eq(stats.inconsistentConfirmedStates,0);
eq(stats.diaryBookingIndependentlyVerified,false);
ok(!JSON.stringify(stats).includes("DO_NOT_LEAK"));
const wrong=summarizeStoredCustomerJourneys({app,requests:[
 {...req,business_id:"22222222-2222-4222-8222-222222222222"}],links:[]});
eq(wrong.scopedRequestCount,0);
const disagreement=summarizeStoredCustomerJourneys({app,requests:[req],links:[]});
eq(disagreement.inconsistentConfirmedStates,1);
eq(disagreement.unlinkedRequests,1);
ok(!summarizeStoredCustomerJourneys({app:null}).ok);
const source=readFileSync(new URL("../supabase/functions/busy-mini-apps/index.ts",import.meta.url),"utf8");
ok(source.includes('supabase.rpc("busy_mark_mini_app_request_link_v3181"'));
ok(source.includes("result.changed===true"));
ok(!source.slice(source.indexOf("async function markRequestLinked("),
 source.indexOf("/**\n * V3.159:")).includes(".upsert("));
const domain=readFileSync(new URL("../src/domain/miniApps.js",import.meta.url),"utf8");
ok(domain.includes("summarizeStoredCustomerJourneys({app,requests,links:requestLinks})"));
const ui=readFileSync(new URL("../src/screens/miniApps.js",import.meta.url),"utf8");
ok(ui.includes("Recorded customer requests"));
const founderUI=readFileSync(new URL("../src/screens/founderOperations.js",import.meta.url),"utf8");
ok(founderUI.includes("stagingObservations.unresolved"));
const cross=reviewBusinessInformation({
 websiteDraft:{id:"website-1",sections:[],businessName:"Example Website"},
 brandBrain:{websiteBrief:{businessName:"Example Website",description:"Private draft",
  services:[{name:"First Service",description:"Owner approved"}]}},
 appConfig:{modules:[{key:"services",enabled:true}],
  publicProfile:{businessName:"Example App",
   services:[{name:"Different Service",description:"Owner approved"}]}},
 scope:{authorizedBusinessId:business,websiteBusinessId:business,
  appBusinessId:business}
});
ok(cross.ok);eq(cross.matchingServiceNamesCount,0);
eq(cross.websiteOnlyServiceNamesCount,1);
eq(cross.appOnlyServiceNamesCount,1);
eq(cross.sharedBusinessNameAgrees,false);
ok(cross.issues.some(i=>i.id==="different_service_sets"));
ok(cross.issues.some(i=>i.id==="different_business_names"));
ok(!JSON.stringify(cross).includes("First Service"));
ok(!JSON.stringify(cross).includes("Example Website"));
ok(!reviewBusinessInformation({
 websiteDraft:{id:"website-1",sections:[]},
 appConfig:{modules:[]},scope:{authorizedBusinessId:business,
 websiteBusinessId:business,appBusinessId:"22222222-2222-4222-8222-222222222222"}
}).ok);
console.log("V3.179 "+checks+" assertions passed (pure logic, source wiring and static migrations only).");
console.log("Staging inventory: "+report.migrationCount+" migrations; "+
 report.missingBaseline.length+" unprovided baseline tables; "+
 report.orderingIssues.length+" ordering issues; no SQL executed.");
