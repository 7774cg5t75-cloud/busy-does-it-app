/**
 * V3.220 actual-worktree SQL migration source reconciliation + focused
 * advisory and recovery regressions. Does NOT connect to Supabase or run SQL.
 */
import assert from "node:assert/strict";
import {readFileSync,readdirSync,existsSync} from "node:fs";
import {join} from "node:path";
import {fileURLToPath} from "node:url";
import {reconcileStagingBootstrapV3220}
 from "../src/core/stagingBootstrapReconcileV3220.mjs";
import {reviewStagingPhaseV3220}
 from "../src/core/stagingPhaseReadinessV3220.mjs";
import {adviseConnectedCustomerJourneyV3220}
 from "../src/core/connectedJourneyAdviceV3220.mjs";
import {reviewOwnerRequestDeliveryV3220}
 from "../src/core/ownerRequestDeliveryPriorityV3220.mjs";
import {canonicalWebsiteHandoffUrl}
 from "../src/core/websiteAppHandoffV3214.mjs";
const root=fileURLToPath(new URL("../",import.meta.url));
const read=p=>readFileSync(join(root,p),"utf8");
const rdir=p=>readdirSync(join(root,p));
let count=0;
const ok=(v,msg)=>{assert.ok(v,msg);count++;};
const eq=(a,b,msg)=>{assert.deepEqual(a,b,msg);count++;};
const snapshot=JSON.parse(read("staging/recorded-readonly-observation-v3220.json"));
const filename="staging/ISOLATED_ONLY_business_core_v3180.sql";
const base=read(filename);
const names=rdir("supabase/migrations").filter(n=>n.endsWith(".sql")).sort();
eq(names.length,65);
ok(names.includes("20261007082234_v3_39_busy_apps_marketplace_foundation.sql"));
ok(names.includes("20261007161000_v3_45_guest_mini_app_requests.sql"));
ok(names.includes("20261012211000_v3_185_durable_message_delivery_intent.sql"));
const migrations=names.map(name=>({name,sql:read("supabase/migrations/"+name)}));
const arg=()=>({...snapshot,baseSchemaSql:base,migrationFiles:migrations});
const plan=reconcileStagingBootstrapV3220(arg());
ok(plan.ok,plan.reason);
eq(plan.sourceMigrationCount,65);
eq(plan.sourceDependencyCount,0);
eq(plan.canaryCompatible,true);
eq(plan.baseSchemaFile,filename);
eq(plan.stagedBaseMissing,true);
eq(plan.approvedToApply,false);
eq(plan.mayExecuteSql,false);
eq(plan.stagingInstalled,false);
eq(plan.websiteFormEnabled,false);
eq(plan.productionTouched,false);
eq(plan.liveProjectIntrospectionByThisModule,false);
eq(plan.phases.length,5);
eq(plan.phases.reduce((s,x)=>s+x.fileCount,0),66);
ok(plan.phases.every(x=>x.applied===false&&x.canApplyAutomatically===false));
ok(plan.phases.some(x=>x.id==="04_guest_requests"&&x.fileCount===3));
ok(plan.phases.some(x=>x.id==="01_baseline"&&x.paths[0]===filename));
ok(plan.sourceFilesRequiringReview>25);
ok(plan.filesWithPotentialExternalOrPrivilegedSideEffects>0);
ok(plan.riskCategoryCounts.cron_schedule>0);
ok(plan.riskCategoryCounts.external_http>0);
ok(plan.riskCategoryCounts.privileged_function>0);
ok(plan.missingExtensions.includes("pgmq"));
ok(plan.missingExtensions.includes("pg_cron"));
ok(plan.missingExtensions.includes("pg_net"));
eq(plan.unexpectedPublicTables.length,0);
eq(plan.unexpectedMigrationVersions.length,0);
const denied=(mutator,label)=>{
 const data=arg();
 mutator(data);
 const x=reconcileStagingBootstrapV3220(data);
 eq(x.ok,false,label);
 eq(x.approvedToApply,false,label+" must never approve");
 eq(x.mayExecuteSql,false,label+" never executes");
};
denied(x=>x.projectRef="not-staging","reject wrong project");
denied(x=>x.projectName="Busy Does It Production","reject prod label");
denied(x=>x.source="browser_approval","reject browser authority");
denied(x=>x.migrationFiles=[],"reject incomplete migrations");
denied(x=>x.baseSchemaSql="create table foo","reject missing base");
denied(x=>x.migrationFiles=[...migrations,migrations[0]],"reject duplicate migration");
denied(x=>x.appliedMigrations=["not-a-version"],"reject unrecognised ledger shape");
const changed=reconcileStagingBootstrapV3220({...arg(),
 publicTables:["busy_staging_rls_canary","unexpected_table"]});
ok(changed.ok);
eq(changed.canaryCompatible,false);
eq(changed.mayExecuteSql,false);
ok(changed.unexpectedPublicTables.includes("unexpected_table"));
const ledger=reconcileStagingBootstrapV3220({...arg(),
 appliedMigrations:[...snapshot.appliedMigrations,"20261030120000"]});
ok(ledger.ok);
eq(ledger.canaryCompatible,false);
eq(ledger.unexpectedMigrationVersions.length,1);
const withoutCanary=reconcileStagingBootstrapV3220({...arg(),publicTables:[]});
ok(withoutCanary.ok);
eq(withoutCanary.canaryCompatible,false);
const missingLedger=reconcileStagingBootstrapV3220({...arg(),
 appliedMigrations:["20261010224121"]});
eq(missingLedger.canaryCompatible,false);
for(const phase of plan.phases){
 const noReview=reviewStagingPhaseV3220({plan,phaseId:phase.id,proof:{}});
 ok(noReview.ok);
 eq(noReview.phaseId,phase.id);
 eq(noReview.evidenceClaimsComplete,false);
 eq(noReview.mayApply,false);
 eq(noReview.installationVerified,false);
 eq(noReview.publicEndpointEnabled,false);
}
const claimed=Object.fromEntries([
 "matching_project","immutable_source","extension_review","side_effect_review",
 "migration_ledger","backup_restore","tenant_rls","approval"
].map(k=>[k,true]));
const self=reviewStagingPhaseV3220({plan,phaseId:"01_baseline",proof:{
 ...claimed,previouslyApplied:true}});
eq(self.evidenceClaimsComplete,true);
eq(self.selfReportedApplied,true);
eq(self.mayApply,false);
eq(self.installationVerified,false);
eq(self.ownerApprovalVerifiedByThisFunction,false);
eq(self.realRestoreVerifiedByThisFunction,false);
eq(self.tenantSecurityVerifiedByThisFunction,false);
eq(reviewStagingPhaseV3220({plan,phaseId:"unknown",proof:claimed}).ok,false);
eq(reviewStagingPhaseV3220({plan:changed,phaseId:"01_baseline",proof:claimed}).ok,false);
const contract=read("scripts/prepare-staging-bootstrap-v3220.mjs");
ok(contract.includes("TARGET=\"/tmp/bdi-v3220-staging-bootstrap\""));
ok(contract.includes("sourceFiles:files.length"));
ok(contract.includes("status:\"PREPARED_NOT_APPLIED\""));
ok(!contract.includes("supabase.rpc("));
const BID="11111111-1111-4111-8111-111111111111";
const OTHER="99999999-9999-4999-8999-999999999999";
const APP="22222222-2222-4222-8222-222222222222";
const VER="33333333-3333-4333-8333-333333333333";
const REQ="44444444-4444-4444-8444-444444444444";
const EVENT="miniapp:guest-request:received";
const ENDPOINT="https://abcdefghijklmnopqrst.supabase.co/functions/v1/busy-mini-app-link";
const app=()=>({id:APP,business_id:BID,current_live_version_id:VER,
 status:"live",public_slug:"my-cafe"});
const version=()=>({id:VER,mini_app_id:APP,state:"live",
 config:{modules:[{key:"enquiry",enabled:true}],
 publicProfile:{services:[]}}});
const catalog=()=>[{module_key:"enquiry",status:"available",
 capabilities:{customer_action:true}}];
const linked=()=>({ownerApproved:true,appId:APP,liveVersionId:VER,
 slug:"my-cafe",intent:"enquiry",
 url:canonicalWebsiteHandoffUrl({endpoint:ENDPOINT,slug:"my-cafe",
  kind:"enquiry",appId:APP,liveVersionId:VER})});
const website=()=>({id:"owner-site",businessId:BID,generation:6,
 theme:{appRequestLinks:{enquiry:linked()}},
 sections:[{id:"contact",type:"contact",enabled:true,email:"contact@example.test"}]});
const spec=()=>({businessId:BID,website:website(),app:app(),
 liveVersion:version(),catalog:catalog(),endpoint:ENDPOINT,
 description:"We would like customer enquiries",businessType:"Rare craft museum"});
const useful=adviseConnectedCustomerJourneyV3220(spec());
ok(useful.ok,useful.reason);
eq(useful.publicCustomerRequestFormActive,false);
eq(useful.realRequestSaved,false);
eq(useful.bookingConfirmed,false);
eq(useful.mayAutoRepublish,false);
eq(useful.noAppIndustryExclusions,true);
eq(useful.plannedSteps.length,4);
eq(useful.currentDraftHandoffIndicated,true);
eq(useful.currentPublishedAppCapabilityIndicated,true);
eq(adviseConnectedCustomerJourneyV3220({...spec(),
 website:{...website(),businessId:OTHER}}).ok,false);
const stale=adviseConnectedCustomerJourneyV3220({...spec(),
 website:{...website(),theme:{appRequestLinks:{enquiry:{
 ...linked(),liveVersionId:OTHER}}}}});
eq(stale.highlightedIssue,"stale_website_app_version");
eq(stale.mayAutoReconnect,false);
const pending=adviseConnectedCustomerJourneyV3220({...spec(),pendingWrite:"unknown"});
eq(pending.highlightedIssue,"possible_saved_request");
eq(pending.realRequestSaved,false);
const scope={businessId:BID,appId:APP,requestId:REQ};
const row={id:REQ,business_id:BID,mini_app_id:APP,request_type:"enquiry",
 status:"received",request_origin:"guest_web"};
const ownerArgs=()=>({businessId:BID,appId:APP,requestId:REQ,writeState:"unknown"});
const unknown=reviewOwnerRequestDeliveryV3220(ownerArgs());
ok(unknown.ok);
eq(unknown.action,"check_original_request");
eq(unknown.newRequestRecommended,false);
eq(unknown.sendAllowed,false);
const saved=reviewOwnerRequestDeliveryV3220({...ownerArgs(),
 request:row,requestReadbackAuthorized:true});
eq(saved.action,"refresh_owner_inbox");
eq(saved.requestSavedInApp,true);
eq(saved.providerDelivered,false);
const failed=reviewOwnerRequestDeliveryV3220({...ownerArgs(),
 request:row,requestReadbackAuthorized:true,
 inbox:{request_id:REQ,business_id:BID,authorizedServerReadback:true},
 eventKey:EVENT,outbox:{id:OTHER,business_id:BID,
 request_id:REQ,event_key:EVENT,state:"dead_letter"},
 outboxReadbackAuthorized:true});
eq(failed.action,"review_failed_notifications");
eq(failed.requeueAutomatically,false);
eq(failed.independentlyVerifiedDelivery,false);
const opposite=reviewOwnerRequestDeliveryV3220({...ownerArgs(),
 request:{...row,business_id:OTHER},requestReadbackAuthorized:true});
eq(opposite.requestSavedInApp,false);
eq(opposite.action,"check_original_request");
const screen=read("src/screens/websiteAppHandoffReview.js");
ok(screen.includes("adviseConnectedCustomerJourneyV3220"));
ok(screen.includes("BUSY recommends: "));
ok(screen.includes("showConnectedPlan&&connectedPlan.ok"));
ok(screen.includes("BUSY's suggested action: "));
console.log("V3.220 worktree regression: "+count+
 " assertions passed, all 65 real SQL migration sources inspected locally, no database operation performed.");
