import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {evaluateLaunchPreflight} from "../supabase/functions/busy-website-publish/launchPreflight.mjs";

const launchSource=readFileSync(new URL("../src/core/websiteLaunchJourney.js",import.meta.url),"utf8");
const {buildWebsiteLaunchJourney}=await import("data:text/javascript,"+encodeURIComponent(launchSource));

const brandReady={websiteReady:true,completeness:{coreMissing:[]}};
const brandMissing={websiteReady:false,completeness:{coreMissing:["Business contact","Location"]}};
const draft={generation:1,businessName:"Example Trades"};
const versions=["Landscaping","Plumbing","Event catering","Pet grooming"];
for(const name of versions){
  const step=buildWebsiteLaunchJourney({brand:brandReady,draft:{...draft,businessName:name}});
  assert.equal(step.nextAction,"prepare");
  assert.equal(step.currentStatus,"needs_hosted_preview");
  assert.equal(step.isPublic,false);
  assert.equal(step.subscription.billingEnforced,false);
  assert.equal(step.subscription.suspensionEnabled,false);
}
const empty=buildWebsiteLaunchJourney();
assert.equal(empty.nextAction,"brand");
assert.equal(empty.currentStatus,"needs_draft");
assert.equal(empty.isVerified,false);
const needsFacts=buildWebsiteLaunchJourney({brand:brandMissing,draft});
assert.equal(needsFacts.nextAction,"brand");
assert.equal(needsFacts.missingCoreFacts.length,2);
assert.equal(needsFacts.stages[0].state,"needs_details");
assert.ok(!JSON.stringify(needsFacts).includes("£50")); // no fabricated charge.
const toBuild=buildWebsiteLaunchJourney({brand:brandReady});
assert.equal(toBuild.nextAction,"build");
const hosted=buildWebsiteLaunchJourney({brand:brandReady,draft,
 publishing:{previewDeployment:{id:"preview_1"},canPublish:true}});
assert.equal(hosted.nextAction,"review");
assert.equal(hosted.isPublic,false);
assert.equal(hosted.currentStatus,"awaiting_customer_approval");
const stale=buildWebsiteLaunchJourney({brand:brandReady,draft,
 publishing:{previewDeployment:{id:"preview_1"},canPublish:true,draftChangedSinceHosted:true}});
assert.equal(stale.nextAction,"prepare");
const liveNoProof=buildWebsiteLaunchJourney({brand:brandReady,draft,publishing:{
 liveDeployment:{id:"live1"},website:{current_live_deployment_id:"live1"},healthStatus:"healthy"}});
assert.equal(liveNoProof.currentStatus,"live_unverified");
assert.equal(liveNoProof.isVerified,false);
const mismatch=buildWebsiteLaunchJourney({brand:brandReady,draft,publishing:{
 liveDeployment:{id:"old"},website:{current_live_deployment_id:"other",last_health_check_at:"2026-10-09T08:00:00Z"},healthStatus:"healthy"}});
assert.equal(mismatch.isVerified,false);
// V3.93: a stale or self-reported healthy status never proves the
// public HTTPS address serves the approved deployment.
const weakEvidence={liveDeployment:{id:"live1"},
 website:{current_live_deployment_id:"live1",last_health_check_at:"2026-10-09T08:00:00Z"},
 healthStatus:"healthy"};
const notVerified=buildWebsiteLaunchJourney({brand:brandReady,draft,publishing:weakEvidence});
assert.equal(notVerified.currentStatus,"live_unverified");
assert.equal(notVerified.isVerified,false);
assert.equal(notVerified.isPublic,false);
assert.equal(notVerified.nextAction,"verify");
const verified=buildWebsiteLaunchJourney({brand:brandReady,draft,
 publishing:weakEvidence,deliveryProof:{verified:true}});
assert.equal(verified.currentStatus,"live_verified");
assert.equal(verified.isVerified,true);
assert.equal(verified.nextAction,"maintain");

const website={id:"site_1",business_id:"business_1"};
const good={id:"deployment_1",business_id:"business_1",website_id:"site_1",
 state:"preview_ready",preview_storage_path:"bucket/preview.html",content_hash:"a".repeat(64)};
const valid=evaluateLaunchPreflight({website,deployment:good});
assert.equal(valid.status,"ready");
assert.equal(valid.canApprove,true);
assert.equal(valid.publicDeliveryVerified,false);
assert.equal(valid.approvalStillRequired,true);
assert.equal(evaluateLaunchPreflight().status,"blocked");
assert.equal(evaluateLaunchPreflight({website,deployment:{...good,website_id:"other"}}).canApprove,false);
assert.equal(evaluateLaunchPreflight({website,deployment:{...good,business_id:"other"}}).canApprove,false);
assert.equal(evaluateLaunchPreflight({website,deployment:{...good,state:"queued"}}).canApprove,false);
assert.equal(evaluateLaunchPreflight({website,deployment:{...good,preview_storage_path:""}}).canApprove,false);
assert.equal(evaluateLaunchPreflight({website,deployment:{...good,content_hash:"short"}}).canApprove,false);
const alreadyLive=evaluateLaunchPreflight({website,deployment:{...good,state:"live"}});
assert.equal(alreadyLive.alreadyLive,true);
assert.equal(alreadyLive.canApprove,false);
assert.equal(alreadyLive.publicDeliveryVerified,false);

const server=readFileSync(new URL("../supabase/functions/busy-website-publish/index.ts",import.meta.url),"utf8");
const controller=readFileSync(new URL("../src/app/AppController.js",import.meta.url),"utf8");
const publishing=readFileSync(new URL("../src/screens/websitePublishing.js",import.meta.url),"utf8");
const builder=readFileSync(new URL("../src/screens/websiteBuilder.js",import.meta.url),"utf8");
const workflow=readFileSync(new URL("../.github/workflows/production-check.yml",import.meta.url),"utf8");
assert.ok(server.includes('import {evaluateLaunchPreflight} from "./launchPreflight.mjs"'));
assert.ok(server.includes('"launch_preflight"'));
assert.ok(server.includes('if (action === "launch_preflight")'));
assert.ok(server.includes('const preflight=evaluateLaunchPreflight({website,deployment:deployment.data})'));
assert.ok(server.includes("if(!preflight.canApprove)"));
assert.ok(server.includes('if (body?.ownerApproved !== true)'));
assert.ok(server.includes('eq("website_id",website.id)'));
assert.ok(server.includes('deployment.data.website_id!==mainWebsite.id'));
assert.ok(server.includes('Only a previously published website version can be restored.'));
const controllerConfirm=controller.slice(controller.indexOf("const confirmPublishHostedWebsite"),controller.indexOf("const rollbackWebsite"));
assert.ok(controllerConfirm.includes('websitePublishingRequest("launch_preflight",{deploymentId})'));
assert.ok(controllerConfirm.indexOf('websitePublishingRequest("launch_preflight"')<controllerConfirm.indexOf("Alert.alert("));
assert.ok(controllerConfirm.includes("preflight?.canApprove!==true"));
assert.ok(publishing.includes('reviewedHostedPreview!==preview.id'));
assert.ok(publishing.includes('openedHostedPreview!==preview.id'));
assert.ok(publishing.includes("onPress={inspectHostedPreview}"));
assert.ok(publishing.includes('setReviewedHostedPreview("")'));
assert.ok(publishing.includes("Automatic cancellation suspension"));
assert.ok(builder.includes('eyebrow="Your website"'));
assert.ok(builder.includes("More website settings"));
assert.ok(builder.includes("buildWebsiteLaunchJourney"));
assert.ok(workflow.includes("node scripts/check-website-go-live-v377.mjs"));
console.log("V3.77 PASS: four business types, accurate launch stages, immutable hosted preflight, positive approval, cross-business isolation, no assumed public delivery, founder UX and CI");
