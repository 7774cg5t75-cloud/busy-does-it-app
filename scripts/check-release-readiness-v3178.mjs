import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {REQUIRED,auditIsolatedStagingInstall}
 from "../supabase/functions/busy-mini-apps/stagingInstallAudit.mjs";
import {GATES,TABLE_IDS,evaluateReleaseReadiness}
 from "../src/core/releaseReadinessIntelligence.mjs";
import {isolatedStagingGuard}
 from "../supabase/functions/busy-mini-apps/stagingConnectionGuard.mjs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const businessId="11111111-1111-4111-8111-111111111111";
const wrongBusiness="22222222-2222-4222-8222-222222222222";
const appId="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const anotherApp="bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const appForBusiness=async business=>business===businessId?
 {id:appId,draft_revision:9}:null;
const expected={appId,expectedRevision:9};
const makeDB=(unavailable=[])=>({
 from(name){
  assert.ok(REQUIRED.some(x=>x.table===name),
    "The install audit may only read fixed allowlisted tables");
  return {select(fields){
   assert.equal(fields,"id","No customer fields can be requested");
   return {async limit(n){
     assert.equal(n,1,"Read only one possible record");
     return {data:[],error:unavailable.includes(name)?
       {code:"42P01",message:"relation missing"}:null};
   }};
  }};
 }
});
assert.equal(REQUIRED.length,5);
assert.equal(TABLE_IDS.length,5);
await assert.rejects(
 ()=>auditIsolatedStagingInstall(makeDB(),appForBusiness,
  wrongBusiness,expected),/current private Business App/);
await assert.rejects(
 ()=>auditIsolatedStagingInstall(makeDB(),appForBusiness,
  businessId,{...expected,expectedRevision:8}),/current private Business App/);
await assert.rejects(
 ()=>auditIsolatedStagingInstall(makeDB(),appForBusiness,
  businessId,{...expected,appId:anotherApp}),/current private Business App/);
const none=await auditIsolatedStagingInstall(
 makeDB(REQUIRED.map(x=>x.table)),appForBusiness,businessId,expected);
assert.equal(none.missing.length,5);
assert.equal(none.reachableCount,0);
assert.equal(none.installationReadyForSyntheticTesting,false);
assert.equal(none.sourceRowsReturned,false);
assert.equal(none.readOnly,true);
assert.equal(none.rlsTenantIsolationVerified,false);
assert.equal(none.customerJourneyVerified,false);
assert.equal(none.releaseApproved,false);
const partial=await auditIsolatedStagingInstall(
 makeDB(["busy_website_brain_decisions","busy_staging_qa_runs"]),
 appForBusiness,businessId,expected);
assert.equal(partial.reachableCount,3);
assert.deepEqual(partial.missing,["website_owner_history","synthetic_qa"]);
assert.equal(partial.noRowsOrSecretsReturned,true);
const all=await auditIsolatedStagingInstall(
 makeDB(),appForBusiness,businessId,expected);
assert.equal(all.installationReadyForSyntheticTesting,true);
assert.equal(all.reachableCount,5);
assert.equal(all.checks.every(x=>x.status==="reachable"),true);
assert.equal(all.rlsTenantIsolationVerified,false);
assert.equal(all.customerJourneyVerified,false);
assert.equal(JSON.stringify(all).includes(businessId),false);
const stagingUrl="https://abcdefghijklmnopqrst.supabase.co";
assert.equal(isolatedStagingGuard({
 mode:"isolated",projectRef:"abcdefghijklmnopqrst",
 supabaseUrl:stagingUrl}).ok,true);
assert.equal(isolatedStagingGuard({
 mode:"production",projectRef:"abcdefghijklmnopqrst",
 supabaseUrl:stagingUrl}).ok,false);
assert.equal(isolatedStagingGuard({
 mode:"isolated",projectRef:"wrongstagingabcdefghi",
 supabaseUrl:stagingUrl}).ok,false);

const base={businessId,appId,draftRevision:9};
assert.equal(evaluateReleaseReadiness({}).ok,false);
assert.equal(evaluateReleaseReadiness({...base,appId:anotherApp}).ok,true);
const noAudit=evaluateReleaseReadiness(base);
assert.equal(noAudit.ok,true);
assert.equal(noAudit.releaseState,"not_ready");
assert.equal(noAudit.visibleStagingTables,0);
assert.equal(noAudit.unresolvedMandatoryGates,10);
assert.equal(noAudit.independentlyVerifiedGateCount,0);
assert.equal(noAudit.launchPermitted,false);
assert.equal(noAudit.noCustomerContact,true);
assert.equal(noAudit.ownerApprovalStillRequired,true);
assert.equal(noAudit.blockers.length>=3,true);
const scopedAudit={...all,ok:true,businessId,appId};
const reported=evaluateReleaseReadiness({
 ...base,installAudit:scopedAudit});
assert.equal(reported.receivedStagingServerAudit,true);
assert.equal(reported.stagingInstallReported,true);
assert.equal(reported.visibleStagingTables,5);
assert.equal(reported.releaseState,"not_ready");
assert.equal(reported.unresolvedMandatoryGates,10);
assert.equal(reported.launchPermitted,false);
assert.equal(reported.gates.some(x=>x.id==="tenant_isolation"&&
 x.independentlyVerified===true),false);
const fakeAudit=evaluateReleaseReadiness({
 ...base,installAudit:{...scopedAudit,businessId:wrongBusiness,
  installationReadyForSyntheticTesting:true}});
assert.equal(fakeAudit.receivedStagingServerAudit,false);
assert.equal(fakeAudit.stagingInstallReported,false);
const fakeRows=evaluateReleaseReadiness({
 ...base,installAudit:{...scopedAudit,
  checks:[...scopedAudit.checks.slice(0,4),
   {id:"apps",status:"reachable"}]}});
assert.equal(fakeRows.stagingInstallReported,false);
const partialEval=evaluateReleaseReadiness({
 ...base,installAudit:{...partial,ok:true,businessId,appId}});
assert.equal(partialEval.visibleStagingTables,3);
assert.equal(partialEval.stagingInstallReported,false);
const synthetic={ok:true,businessId,appId,draftRevision:9,
 syntheticDatabaseRoundTripVerified:true,
 evidenceType:"isolated_staging_synthetic_db_round_trip",
 serverReadBackVerified:true,noCustomerRequestCreated:true};
const untrusted=evaluateReleaseReadiness({
 ...base,installAudit:scopedAudit,syntheticEvidence:synthetic,
 independentProofs:[
  {id:"tenant_isolation",verified:true},
  {id:"customer_booking",verified:true},
  {id:"release_owner_approval",verified:true}
 ]});
assert.equal(untrusted.syntheticDbRoundTripReported,true);
assert.equal(untrusted.independentProofItemsIgnored,3);
assert.equal(untrusted.independentlyVerifiedGateCount,0);
assert.equal(untrusted.releaseState,"not_ready");
assert.equal(untrusted.launchPermitted,false);
assert.equal(untrusted.gates.every(x=>x.releaseBlocking&&
  x.independentlyVerified===false),true);
const wrongRevision=evaluateReleaseReadiness({
 ...base,syntheticEvidence:{...synthetic,draftRevision:8}});
assert.equal(wrongRevision.syntheticDbRoundTripReported,false);
assert.equal(evaluateReleaseReadiness({
 ...base,independentProofs:Array(31).fill({})
}).ok,false);

const edge=read("supabase/functions/busy-mini-apps/index.ts");
for(const phrase of [
 'import {auditIsolatedStagingInstall}',
 '"staging_install_audit"',
 'if(action==="staging_install_audit")',
 'isolatedStagingGuard({',
 'resolvedBusinessId,body',
 'writeActions.has(action)',
 'member.business_id'
])assert.ok(edge.includes(phrase),"Edge missing "+phrase);
const native=read("src/app/AppController.js");
for(const phrase of [
 "const checkIsolatedAppInstallAudit=",
 'miniAppsRequest("staging_install_audit"',
 "checkIsolatedAppInstallAudit,",
 "response?.businessId!==businessId",
 "response?.readOnly!==true"
])assert.ok(native.includes(phrase),"App controller missing "+phrase);
const appUI=read("src/screens/miniApps.js");
for(const phrase of [
 "evaluateReleaseReadiness({",
 "V3.178 • Launch-readiness checks",
 "Check staging installation (read only)",
 "unresolvedMandatoryGates",
 "RELEASE"
].filter(x=>x!=="RELEASE"))
 assert.ok(appUI.includes(phrase),"App Studio missing "+phrase);
const workflow=read(".github/workflows/release-readiness-v3178.yml");
for(const phrase of [
 "node scripts/check-release-readiness-v3178.mjs",
 "node scripts/check-verified-outcomes-v3177.mjs",
 "node scripts/check-authenticated-brain-staging-v3176.mjs",
 "expo export --platform ios",
 "expo export --platform android",
 "prepare-standalone-prototype-v3154.mjs"
])assert.ok(workflow.includes(phrase),"CI missing "+phrase);
console.log("V3.178 PASS: staging schema/membership scope, no row leakage, production refusal, ten blocked gates even with forged evidence, native integration and inherited CI coverage.");
