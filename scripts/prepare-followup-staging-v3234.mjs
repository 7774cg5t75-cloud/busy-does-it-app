/**
 * V3.234 staging customer-follow-up acceptance PREPARATION only.
 * Adds realistic owner/customer conversations to the existing V3.233
 * two-business Auth/JWT/booking gate. Nothing here uses provider secrets,
 * creates users or runs SQL. No source test can approve hosted installation.
 */
import {readFileSync,writeFileSync,mkdirSync} from "node:fs";
import {execFileSync} from "node:child_process";
import {createHash} from "node:crypto";
const read=p=>readFileSync(p,"utf8");
execFileSync(process.execPath,["scripts/prepare-booking-staging-v3233.mjs"],{stdio:"pipe"});
const base=JSON.parse(read("/tmp/bdi-v3233-booking-stage/review.json"));
if(base.expectedProjectRef!=="pnjdlogwegnqbsfpcofw"||
 base.additionalScenarios.length!==11||base.ownerApprovedInstall!==false||
 base.actualJwtTested!==false||base.hostedSqlExecuted!==false)
 throw Error("The V3.233 unapproved staging/auth review changed.");
const files=[
 "supabase/functions/busy-mini-apps/freshOwnerFollowupV3207.mjs",
 "supabase/functions/busy-mini-apps/ownerConversationActionV3234.mjs",
 "supabase/functions/busy-mini-apps/index.ts",
 "src/core/followupNextActionV3234.mjs",
 "src/core/followupProofV3207.mjs",
 "src/screens/miniApps.js"
].map(path=>({path,sha256:createHash("sha256").update(read(path)).digest("hex")}));
const scenarios=[
 ["owner_a_reply","Authenticated owner A sees one signed-in customer waiting and an editable reply draft"],
 ["owner_b_denied","Owner B cannot read A's customer thread or next-step guidance"],
 ["guest_handoff","Guest enquiry warns that in-app messaging cannot reach receipt holder"],
 ["booking_not_confirmed","Booking request cannot be called an appointment without durable Work proof"],
 ["owner_sent_last","If owner last replied, BUSY must not chase customer automatically"],
 ["stale_draft","Customer replied during review; previously proposed draft no longer matches stamp"],
 ["timestamps_tied","Same-time customer/business messages require manual review, never fake reply certainty"],
 ["old_message","Follow-up urgency uses last recorded conversation activity, not status/read update"],
 ["no_provider_receipt","Saved owner reply does not prove push delivery or customer read"],
 ["reply_approval","Only explicit signed-in owner approval can commit a reviewed message"],
 ["network_timeout","Uncertain message send uses original idempotency/receipt, never an unreviewed resend"],
 ["disable_auto_execution","No scheduled sends, paid AI jobs, publishing or external provider calls are triggered"]
].map(([id,description])=>({id,description,status:"not_verified",
 ownerApprovalForLiveScenarioRequired:true}));
const packet={
 kind:"v3234_followup_auth_customer_journey_review",
 stagingProjectRef:base.expectedProjectRef,
 inheritedOriginalJWTScenarios:base.originalRealTenantScenarios,
 inheritedBookingScenarios:base.additionalScenarios.map(x=>({id:x.id,status:x.status})),
 extraFollowupScenarios:scenarios,sourceHashes:files,
 countVersionedMigrations:69,stagingIsOnlyCanary:true,
 ownerApprovedInstallation:false,realJWTVerified:false,
 realBackupsRestored:false,realBrowserJourneyVerified:false,
 hostedSqlApplied:false,externalProviderCalled:false,
 realCustomersContacted:false,paidBuildTriggered:false,
 mayDeploy:false,mayAutoSend:false,
 status:"NOT_READY_FOR_HOSTED_TEST_WITHOUT_SEPARATE_APPROVAL"
};
mkdirSync("/tmp/bdi-v3234-followup-stage",{recursive:true});
writeFileSync("/tmp/bdi-v3234-followup-stage/review.json",
 JSON.stringify(packet,null,2)+"\n");
console.log("V3.234: 12 additional owner/customer follow-up acceptance cases prepared; NONE executed remotely.");
