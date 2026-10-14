/**
 * V3.235. Non-executable continuation of the original staging acceptance
 * register. No fake signed-in tests can count as live JWT/RLS evidence.
 */
import {readFileSync,writeFileSync,mkdirSync} from "node:fs";
import {execFileSync} from "node:child_process";
import {createHash} from "node:crypto";
const read=p=>readFileSync(p,"utf8");
execFileSync(process.execPath,["scripts/prepare-followup-staging-v3234.mjs"],{stdio:"pipe"});
const prior=JSON.parse(read("/tmp/bdi-v3234-followup-stage/review.json"));
if(prior.stagingProjectRef!=="pnjdlogwegnqbsfpcofw"||
 prior.inheritedOriginalJWTScenarios.length!==11||
 prior.inheritedBookingScenarios.length!==11||
 prior.extraFollowupScenarios.length!==12||
 prior.ownerApprovedInstallation!==false||
 prior.realJWTVerified!==false||prior.hostedSqlApplied!==false||
 prior.countVersionedMigrations!==69)
 throw Error("Hosted staging source-review prerequisites changed. Stop.");
const scope=[
 "supabase/functions/busy-mini-apps/index.ts",
 "supabase/functions/busy-mini-apps/ownerFollowupReadbackV3235.mjs",
 "supabase/functions/busy-mini-apps/ownerOutcomeEvidenceV3235.mjs",
 "src/core/ownerOutcomeProofV3235.mjs",
 "src/core/followupProofV3207.mjs",
 "src/screens/miniApps.js"
].map(path=>({path,sha256:createHash("sha256").update(read(path)).digest("hex")}));
const steps=[
 ["saved_not_delivered","Owner's saved reply never counts as a delivered notification or read message"],
 ["closed_not_success","Closed/declined request remains NOT independently verified as a customer success"],
 ["accepted_not_booked","Accepted request cannot infer real Work appointment, calendar delivery or customer confirmation"],
 ["guest_contact_uncertain","Guest web enquiry must not be treated as reachable by in-app customer message"],
 ["foreign_tenant","Real business B Auth/JWT cannot view A's saved follow-up or outcome evidence"],
 ["stale_outcome","Newer customer message invalidates the previously reviewed sourceStamp"],
 ["read_failure","Database unavailable/malformed response fails closed, no automatic retry/send"],
 ["learning_consent","No cross-business learning, accuracy claims, training updates or unapproved feedback persistence"]
].map(([id,description])=>({id,description,status:"not_verified",liveOwnerApprovalNeeded:true}));
const plan={
 kind:"v3235_source_only_customer_outcome_staging_review",
 stagingProjectRef:prior.stagingProjectRef,
 priorRealJWTScenarios:prior.inheritedOriginalJWTScenarios,
 priorBookingScenarios:prior.inheritedBookingScenarios,
 priorFollowupScenarios:prior.extraFollowupScenarios,
 realOutcomeScenarios:steps,
 sourceHashes:scope,versionedSqlMigrations:69,
 canInstall:false,ownerApproved:false,
 hostedSqlExecuted:false,realAuthJWTTested:false,
 backupRestoreProved:false,providerContacted:false,
 paidBuildUsed:false,productionTouched:false,
 actualUserOutcomeVerified:false,realCustomerContacted:false,
 readyForApproval:false,
 needed:"Fresh staging identity/catalog, backup+real restore, separate owner phase approval, genuine Auth/JWT users and browser customer journey"
};
mkdirSync("/tmp/bdi-v3235-outcome-stage",{recursive:true});
writeFileSync("/tmp/bdi-v3235-outcome-stage/review.json",
 JSON.stringify(plan,null,2)+"\n");
console.log("V3.235 staging outcome acceptance: 42 genuine scenarios still NOT VERIFIED. Zero hosted actions.");
