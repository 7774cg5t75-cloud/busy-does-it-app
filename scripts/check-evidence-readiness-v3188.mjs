import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {assessOwnerEvidenceCompleteness}
 from "../src/core/customerEvidenceCompletenessV3188.mjs";
import {assessIsolatedStagingSnapshot}
 from "../src/core/isolatedStagingPreflightV3188.mjs";
import {verifyStagingPackage}
 from "./verify-staging-install-v3186.mjs";
import {report as inventory} from "./track-intelligence-v3183.mjs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
let n=0;
const ok=x=>{assert.ok(x);n++};
const eq=(a,b)=>{assert.deepEqual(a,b);n++};
const counts={requests:4,acceptedBookingsWithWork:2,
 closedButWorkActive:1,acceptedWithoutConfirmedWork:1,
 requestsWithoutStoredOwnerReply:2};
const proof={ok:true,counts,coveragePartial:false,
 customer_private_name:"never expose this private person"};
const verified=assessOwnerEvidenceCompleteness({
 outcomeProof:proof,requestSnapshotLimit:30,
 messageSnapshot:{rows:[{privateContent:"never expose this message"}],truncated:false},
 workSnapshot:{rows:[],truncated:false}
});
ok(verified.ok);
eq(verified.requestSnapshotComplete,true);
eq(verified.messageSnapshotComplete,true);
eq(verified.workSnapshotComplete,true);
eq(verified.messageAbsenceReliable,false);
eq(verified.workAbsenceReliable,false);
eq(verified.observedClosedActiveConflicts,1);
eq(verified.possibleUnmatchedAccepted,1);
eq(verified.possibleUnansweredRequests,2);
eq(verified.reviewSignals[0].strength,"observed_conflict");
eq(verified.reviewSignals[1].strength,"needs_direct_lookup");
eq(verified.reviewSignals[2].strength,"needs_direct_lookup");
eq(verified.automaticOwnerActionsAllowed,false);
eq(verified.confirmedRevenue,null);
eq(verified.noInferredCustomerConversion,true);
ok(!JSON.stringify(verified).includes("never expose"));
const partial=assessOwnerEvidenceCompleteness({
 outcomeProof:{...proof,counts:{...counts,requests:30}},
 requestSnapshotLimit:30,
 messageSnapshot:{rows:Array.from({length:150},()=>({})) ,truncated:true},
 workSnapshot:{rows:Array.from({length:200},()=>({})),truncated:true}
});
ok(partial.ok);
eq(partial.requestSnapshotComplete,false);
eq(partial.messageSnapshotComplete,false);
eq(partial.workSnapshotComplete,false);
ok(partial.warnings.length>=3);
ok(!assessOwnerEvidenceCompleteness({outcomeProof:null}).ok);
ok(!assessOwnerEvidenceCompleteness({outcomeProof:proof,
 messageSnapshot:{rows:"no"}}).ok);
ok(!assessOwnerEvidenceCompleteness({outcomeProof:proof,
 requestSnapshotLimit:0}).ok);
const risk={ok:true,migrationCount:63,filesWithReviewSignals:43};
const stage=inputs=>assessIsolatedStagingSnapshot({
 projectRef:"pnjdlogwegnqbsfpcofw",health:"ACTIVE_HEALTHY",
 publicTables:["public.busy_staging_rls_canary"],
 migrationVersions:["20261010224121","20261010224205"],
 edgeFunctionNames:[],
 extensions:{pgcrypto:true,pgmq:false,pg_cron:false,pg_net:false},
 manifestIntegrity:true,sqlRiskReview:risk,...inputs
});
const prepared=stage();
ok(prepared.ok);
eq(prepared.projectMatches,true);
eq(prepared.onlyKnownCanaryPresent,true);
eq(prepared.expectedCanaryMigrationsPresent,true);
eq(prepared.appFunctionsAbsent,true);
eq(prepared.extensionsMissing,["pgmq","pg_cron","pg_net"]);
eq(prepared.riskFilesFlaggedForHumanReview,43);
eq(prepared.actualOwnerApprovalProven,false);
eq(prepared.canApplySql,false);
eq(prepared.canDeployEdge,false);
eq(prepared.installExecuted,false);
ok(prepared.blockers.includes("extension_install_and_permission_review"));
ok(prepared.blockers.includes("verified_backup_and_restore_test"));
ok(prepared.blockers.includes("explicit_separate_install_approval"));
eq(prepared.steps.length,8);
ok(!prepared.steps.find(x=>x.id==="install_one_reviewed_step_at_a_time").safeToRunNow);
const wrong=stage({projectRef:"production-ref"});
ok(wrong.blockers.includes("wrong_or_unverified_project"));
ok(!wrong.projectMatches);
const changed=stage({publicTables:["public.busy_staging_rls_canary","public.busy_businesses"],
 migrationVersions:["20261010224121"],edgeFunctionNames:["some-function"]});
ok(changed.blockers.includes("schema_diff_requires_reconciliation"));
ok(changed.blockers.includes("migration_ledger_diff_requires_reconciliation"));
ok(changed.blockers.includes("existing_functions_require_review"));
ok(!assessIsolatedStagingSnapshot({publicTables:"untrusted"}).ok);
const fullExt=stage({extensions:{pgcrypto:true,pgmq:true,pg_net:true,pg_cron:true}});
eq(fullExt.extensionsMissing,[]);
eq(fullExt.canApplySql,false);
const source=read("src/domain/miniApps.js");
const screen=read("src/screens/miniApps.js");
ok(source.includes("assessOwnerEvidenceCompleteness({"));
ok(source.includes("evidenceCompleteness,"));
ok(screen.includes("Busy\'s next check"));
ok(screen.includes("view.ownerNextAction.suggestions"));
const sql=read("staging/ci-tenant-role-revocation-v3188.sql");
for(const needle of ["ci-full-customer-journey-v3187.sql",
 "delete from public.busy_business_memberships",
 "insert into public.busy_business_memberships",
 "Revoked owner still sent a message",
 "has_function_privilege","busy_send_mini_app_message_v3185",
 "V3.188 POSTGRES TENANT REVOCATION AND PRIVATE RPC CONTRACT PASS"])
 ok(sql.includes(needle));
const offline=read("scripts/review-staging-preflight-v3188.mjs");
ok(offline.includes("mustRefreshHostedObservationsBeforeAnyInstall:true"));
ok(offline.includes("freshIndependentReadPerformedByThisScript:false"));
const packageResult=verifyStagingPackage();
ok(packageResult.ok);
eq(packageResult.installed,false);
ok(inventory.surveyedCapabilities.length>=21);
eq(inventory.surveyedCapabilities.length,inventory.wiredSourceCapabilities);
eq(inventory.surveyedCapabilities.length,inventory.testsPresentForSample);
eq(inventory.realCustomerJourneysProven,false);
console.log("V3.188 "+n+" focused evidence-completeness, staging and role-contract assertions PASS.");
