/**
 * V3.236 non-executable browser/device acceptance packet.
 * Extends original genuine Auth/JWT, Work and customer outcome scenarios;
 * no installs, account creations, provider calls or paid signing.
 */
import {readFileSync,writeFileSync,mkdirSync} from "node:fs";
import {execFileSync} from "node:child_process";
import {createHash} from "node:crypto";
const read=p=>readFileSync(p,"utf8");
execFileSync(process.execPath,["scripts/prepare-outcome-staging-v3235.mjs"],{stdio:"pipe"});
const previous=JSON.parse(read("/tmp/bdi-v3235-outcome-stage/review.json"));
if(previous.stagingProjectRef!=="pnjdlogwegnqbsfpcofw"||
 previous.priorRealJWTScenarios.length!==11||
 previous.priorBookingScenarios.length!==11||
 previous.priorFollowupScenarios.length!==12||
 previous.realOutcomeScenarios.length!==8||
 previous.versionedSqlMigrations!==69||
 previous.ownerApproved!==false||previous.hostedSqlExecuted!==false)
 throw Error("Real Auth/Work/Customer gates changed: do not imply approval.");
const paths=[
 "src/core/universalBuilderPlanV3210.mjs",
 "src/core/sharedBuilderNextStepV3236.mjs",
 "src/core/sharedBuilderDesignDirectionsV3236.mjs",
 "src/screens/universalBuilderPlanReview.js"
].map(path=>({path,sha256:createHash("sha256").update(read(path)).digest("hex")}));
const checks=[
 ["two_tenants","Actual signed-in businesses A and B cannot review or edit each other's app/site drafts"],
 ["stale_versions","Changing either draft revision invalidates the earlier comparison before any owner approval"],
 ["distinct_designs","Rendered phone/tablet/desktop design options are actually visually distinct, not two textual labels"],
 ["real_task","A booking or enquiry really saves an original request and resolves into the correct owner inbox"],
 ["customer_accessibility","Check keyboard/screen-reader/contrast and touch controls on actual phone, tablet and desktop"],
 ["owner_locked","Owner-locked components/manual edits are unchanged across proposed design directions"],
 ["dependency_truth","Unimplemented checkout, deposit and provider features never appear as live in previews"],
 ["brand_reuse","Approved design DNA may carry across surfaces without copying unrelated layouts or media"],
 ["rollback","Owner can reject, undo and recover from individual design changes and website/app saves"],
 ["costs","No AI credits, premium builds, provider spending or publication without an explicit price and approval"]
].map(([id,description])=>({id,description,status:"not_verified",ownerConsentBeforeLiveAction:true}));
const packet={kind:"v3236_universal_builder_journey_staging_review",
 projectRef:previous.stagingProjectRef,
 priorAuthCount:previous.priorRealJWTScenarios.length,
 priorBookingCount:previous.priorBookingScenarios.length,
 priorFollowupCount:previous.priorFollowupScenarios.length,
 priorOutcomeCount:previous.realOutcomeScenarios.length,
 additionalBuilderScenarios:checks,scenarioCount:52,
 versionedMigrations:69,sourceHashes:paths,
 ownerApproved:false,hostedSqlExecuted:false,actualJwtTested:false,
 screenshotsCaptured:false,realCustomerJourneyVerified:false,
 nativeDevicesTested:false,backupRestoreVerified:false,
 providerContacted:false,paidBuildUsed:false,
 editsApplied:false,websitePublished:false,appPublished:false,
 productionTouched:false,canExecute:false};
mkdirSync("/tmp/bdi-v3236-builder-review",{recursive:true});
writeFileSync("/tmp/bdi-v3236-builder-review/packet.json",JSON.stringify(packet,null,2)+"\n");
console.log("V3.236: 52 real acceptance cases still NOT VERIFIED, no hosted actions.");
