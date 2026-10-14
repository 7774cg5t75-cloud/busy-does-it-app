/**
 * V3.233 SOURCE-ONLY staging acceptance handoff, not an installer.
 * Extends the original 11 genuine two-tenant Auth/JWT scenarios with
 * concrete booking recovery and owner-visible Work cancellation checks.
 * No network, API keys, user creation, SQL execution or provider calls.
 */
import {readFileSync,writeFileSync,mkdirSync} from "node:fs";
import {execFileSync} from "node:child_process";
import {createHash} from "node:crypto";
const read=p=>readFileSync(p,"utf8");
execFileSync(process.execPath,["scripts/prepare-two-business-auth-v3231.mjs"],{stdio:"pipe"});
const old=JSON.parse(read("/tmp/bdi-v3231-real-auth-review/two-business-plan.json"));
if(old.expectedProjectRef!=="pnjdlogwegnqbsfpcofw"||
 old.versionedMigrationCount!==69||old.scenarios.length!==11||
 old.realJwtTested!==false||old.approvedForInstall!==false)
 throw Error("The original staging tenant/auth inventory changed: stop.");
const files=[
 "supabase/migrations/20261014225500_v3_232_scoped_booking_close_revision.sql",
 "supabase/functions/busy-mini-apps/index.ts",
 "supabase/functions/busy-mini-apps/ownerBookingRevisionV3233.mjs",
 "src/app/AppController.js",
 "src/core/bookingCancelReadbackV3233.mjs",
 "src/screens/miniApps.js",
 "staging/ci-linked-booking-close-v3232.sql"
].map(path=>({path,sha256:createHash("sha256").update(read(path)).digest("hex")}));
const cases=[
 ["backup_restore","Prove fresh hosted staging backup restored in a separate disposable project"],
 ["owner_a_signin","Sign in a real staging owner A with actual JWT and save a fictional booking draft"],
 ["owner_b_denied","Business B genuine user cannot view or cancel owner A request/Work row"],
 ["owner_membership_revoked","Owner A revoked/staff JWT cannot invoke current booking revision or cancellation"],
 ["owner_confirm","Approved confirmed booking has exactly one durable BUSY Work row"],
 ["work_cancel","Cancel from original Work UI; saved request, link, event and Work row change atomically"],
 ["stale_work_ui","Owner B or competing device changes request; earlier Work screen cannot cancel it"],
 ["timeout_reconcile","After ambiguous HTTP response, read-only original request/Work status, never auto-repeat"],
 ["injected_failure","Independently prove a failed Work-row update leaves original request open"],
 ["no_provider_claims","Local Work record does not prove Apple/Google calendar sync or a delivered push"],
 ["post_install_no_workers","Keep notification dispatch and receipt check disabled, never schedule them implicitly"]
].map(([id,check])=>({id,check,status:"not_verified",
  dependsOnRealAuthJwt:true,approvalRequired:true}));
const packet={kind:"v3233_staging_booking_journey_review_only",
 expectedProjectRef:old.expectedProjectRef,
 originalRealTenantScenarios:old.scenarios.map(({id,status})=>({id,status})),
 sourceHashes:files,additionalScenarios:cases,
 sourceOnly:true,remoteProjectContacted:false,
 ownerApprovedInstall:false,actualJwtTested:false,
 realBackupRestored:false,hostedSqlExecuted:false,
 providerNotified:false,paidBuildTriggered:false,
 mayDeploy:false,maySend:false,
 nextStep:"Owner must separately approve exact isolated staging phase after fresh catalog/ledger, SQL risk and real backup+restore proof."
};
const target="/tmp/bdi-v3233-booking-stage";
mkdirSync(target,{recursive:true});
writeFileSync(target+"/review.json",JSON.stringify(packet,null,2)+"\n");
console.log("V3.233: staged booking acceptance prepared with "+cases.length+" unverified real-world scenarios. No remote writes.");
