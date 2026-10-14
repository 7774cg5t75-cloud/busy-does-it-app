/**
 * V3.221 read-only bootstrap + SQL side-effects + Business Brain regression.
 * Includes all 64 actual migration files, never runs SQL or sends providers.
 */
import assert from "node:assert/strict";
import {readFileSync,readdirSync} from "node:fs";
import {join} from "node:path";
import {fileURLToPath} from "node:url";
import {reviewStagingBusinessBaselineV3221}
 from "../src/core/stagingFirstPhaseSafetyV3221.mjs";
import {reviewStagingSqlSideEffectsV3221}
 from "../src/core/stagingSqlSideEffectGateV3221.mjs";
import {chooseBusinessJourneyDecisionV3221}
 from "../src/core/businessJourneyDecisionV3221.mjs";
import {canonicalWebsiteHandoffUrl}
 from "../src/core/websiteAppHandoffV3214.mjs";
const ROOT=fileURLToPath(new URL("../",import.meta.url));
const read=p=>readFileSync(join(ROOT,p),"utf8");
let checks=0;
const ok=(x,msg)=>{assert.ok(x,msg);checks++;};
const eq=(a,b,msg)=>{assert.deepEqual(a,b,msg);checks++;};
const project="pnjdlogwegnqbsfpcofw";
const path="staging/ISOLATED_ONLY_business_core_v3180.sql";
const sql=read(path);
const valid=()=>reviewStagingBusinessBaselineV3221({
 filePath:path,stagingProjectRef:project,sql,observedCanary:true});
const baseline=valid();
ok(baseline.ok,baseline.reason);
eq(baseline.sourceAppearsCompatible,true);
eq(baseline.missing.length,0);
eq(baseline.dangerousSourceSignals.length,0);
eq(baseline.requiredChecks.length,13);
eq(baseline.productionSchemaIdentityUnknown,true);
eq(baseline.memberRlsRequiresAuthenticatedTwoTenantProof,true);
eq(baseline.executeAllowed,false);
eq(baseline.approvedToInstall,false);
eq(baseline.tenantIsolationVerified,false);
eq(baseline.realStagingApplied,false);
eq(reviewStagingBusinessBaselineV3221({
 filePath:path,stagingProjectRef:"production",sql}).ok,false);
eq(reviewStagingBusinessBaselineV3221({
 filePath:"supabase/migrations/test.sql",stagingProjectRef:project,sql}).ok,false);
eq(reviewStagingBusinessBaselineV3221({
 filePath:path,stagingProjectRef:project,sql:""}).ok,false);
const absent=reviewStagingBusinessBaselineV3221({
 filePath:path,stagingProjectRef:project,
 sql:sql.replace("force row level security","row level security")});
ok(absent.ok);
eq(absent.sourceAppearsCompatible,false);
ok(absent.missing.includes("business_forced_rls"));
const hostile=reviewStagingBusinessBaselineV3221({
 filePath:path,stagingProjectRef:project,
 sql:sql+"\nselect cron.schedule('job','* * * * *','select 1');\nselect net.http_post('https://provider.test');\n"});
ok(hostile.ok);
eq(hostile.sourceAppearsCompatible,false);
ok(hostile.dangerousSourceSignals.includes("scheduled_workers"));
ok(hostile.dangerousSourceSignals.includes("external_network"));
eq(hostile.executeAllowed,false);
const badGrant=reviewStagingBusinessBaselineV3221({
 filePath:path,stagingProjectRef:project,
 sql:sql+"\ngrant all on public.busy_business_memberships to anon;"});
ok(badGrant.dangerousSourceSignals.includes("public_open_grants"));
eq(badGrant.approvedToInstall,false);
const names=readdirSync(join(ROOT,"supabase/migrations"))
 .filter(x=>x.endsWith(".sql")).sort();
eq(names.length,64);
const migrations=names.map(name=>({name,sql:read("supabase/migrations/"+name)}));
const report=reviewStagingSqlSideEffectsV3221(migrations);
ok(report.ok,report.reason);
eq(report.migrationCount,64);
ok(report.sideEffectReviewFileCount>25);
ok(report.sourceRiskFindingCount>40);
ok(report.categories.privileged_function>0);
ok(report.categories.cron_schedule>0);
ok(report.categories.external_http>0);
ok(report.categories.table_grant>0);
ok(report.categories.sql_extension>0);
ok(report.filesNeedingReview.every(x=>x.mayExecuteUnattended===false));
eq(report.unattendedMigrationAllowed,false);
eq(report.migrationApproved,false);
eq(report.stagingDbChanged,false);
eq(report.noSideEffectsExecuted,true);
eq(report.automaticProviderIsolationProven,false);
eq(report.noScheduledTasksProven,false);
const injected=reviewStagingSqlSideEffectsV3221([
 {name:"20261014000000_test.sql",
 sql:"-- net.http_post fake comment\nselect cron.schedule('x','* * * * *','select 1');\ncreate extension pg_net;\nselect net.http_post('https://example.test');"}]);
ok(injected.ok);
eq(injected.sideEffectReviewFileCount,1);
ok(injected.filesNeedingReview[0].categories.some(x=>x.category==="cron_schedule"));
ok(injected.filesNeedingReview[0].categories.some(x=>x.category==="external_http"));
eq(injected.unattendedMigrationAllowed,false);
eq(reviewStagingSqlSideEffectsV3221([{name:"malicious",sql:"select 1;"}]).ok,false);
const BID="11111111-1111-4111-8111-111111111111";
const OTHER="99999999-9999-4999-8999-999999999999";
const APP="22222222-2222-4222-8222-222222222222";
const VER="33333333-3333-4333-8333-333333333333";
const ENDPOINT="https://abcdefghijklmnopqrst.supabase.co/functions/v1/busy-mini-app-link";
const app=()=>({id:APP,business_id:BID,status:"live",public_slug:"florist",
 current_live_version_id:VER});
const v=()=>({id:VER,mini_app_id:APP,state:"live",config:{
 modules:[{key:"enquiry",enabled:true}],publicProfile:{services:[]}}});
const link=()=>({ownerApproved:true,intent:"enquiry",
 appId:APP,liveVersionId:VER,slug:"florist",
 url:canonicalWebsiteHandoffUrl({endpoint:ENDPOINT,slug:"florist",
  kind:"enquiry",appId:APP,liveVersionId:VER})});
const website=()=>({id:"website",businessId:BID,generation:4,
 theme:{appRequestLinks:{enquiry:link()}},
 sections:[{id:"contact",type:"contact",enabled:true,
 email:"owner@example.test"}]});
const args=()=>({businessId:BID,website:website(),app:app(),
 liveVersion:v(),endpoint:ENDPOINT,description:"Owner wants enquiries",
 businessType:"Unusual museum",catalog:[{module_key:"enquiry",
 status:"available",capabilities:{customer_action:true}}]});
const suggested=chooseBusinessJourneyDecisionV3221(args());
ok(suggested.ok,suggested.reason);
eq(suggested.action,"review_existing_capability");
eq(suggested.savedRequestVerified,false);
eq(suggested.publicationAllowed,false);
eq(suggested.providerActionAllowed,false);
eq(suggested.noCustomerInfoReturned,true);
eq(suggested.industryNeutral,true);
const unknown=chooseBusinessJourneyDecisionV3221({...args(),
 pendingWrite:"unknown"});
eq(unknown.action,"verify_receipt_first");
eq(unknown.savedRequestVerified,false);
const stale=chooseBusinessJourneyDecisionV3221({...args(),
 website:{...website(),theme:{appRequestLinks:{enquiry:{
 ...link(),liveVersionId:OTHER}}}}});
eq(stale.action,"review_version_change");
eq(stale.publicationAllowed,false);
const cross=chooseBusinessJourneyDecisionV3221({...args(),
 app:{...app(),business_id:OTHER}});
eq(cross.ok,false);
eq(cross.providerActionAllowed,false);
const missing=chooseBusinessJourneyDecisionV3221({...args(),
 app:null,liveVersion:null,catalog:[]});
ok(missing.ok,missing.reason);
eq(missing.action,"prepare_supported_module");
eq(missing.availableCapabilityOnlyWhenVerified,false);
eq(missing.publicationAllowed,false);
const screen=read("src/screens/websiteAppHandoffReview.js");
ok(screen.includes("chooseOwnerNextActionV3222"));
ok(screen.includes("BUSY recommends: "));
ok(screen.includes("showConnectedPlan&&connectedPlan.ok"));
const source=read("scripts/snack-source.mjs");
ok(source.includes("supabase/functions/busy-mini-app-guest/requestReceiptProofV3213.mjs"));
const legacy=read("scripts/check-major-builders-v3191.mjs");
ok(legacy.includes("canonicalWebsiteHandoffUrl"));
const oldFlow=read(".github/workflows/builders-major-v3209.yml");
ok(oldFlow.includes('name: "V3.209 Builders: Industry'));
ok(oldFlow.includes('run: |\n          echo "V3.209'));
console.log("V3.221 verified worktree source suite: "+checks+
 " assertions passed; all "+names.length+" historical SQL files audited; no SQL executed.");
