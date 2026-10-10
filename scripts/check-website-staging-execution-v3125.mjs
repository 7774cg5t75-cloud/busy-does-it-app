import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {stagingEnvironmentGuard} from "../src/core/stagingEnvironmentGuard.mjs";
import {websiteStagingJourneyEvidence} from "../src/core/websiteStagingJourneyEvidence.mjs";
import {businessAppPreviewProof} from "../src/core/businessAppPreviewProof.mjs";
import {founderStagingSummary} from "../src/core/founderStagingSummary.mjs";
let n=0;
const equal=(actual,expected,message)=>{assert.deepEqual(actual,expected,message);n++;};
const truth=(actual,message)=>{assert.ok(actual,message);n++;};
const businessA="91edb6db-3a02-4de4-9ba8-5c93b4e790a1",
 businessB="d8836a0e-fbb0-4cb9-a613-509af50eb114",
 previewId="20f9279e-0dcf-4b1b-aad0-4952c4aab332";
const base={
 stagingSupabaseUrl:"https://abcdefghijklmnopqrst.supabase.co/",
 productionSupabaseUrl:"https://zyxwvutsrqponmlkjihg.supabase.co/",
 stagingHostingUrl:"https://staging.busydoesit.co.uk/",
 expectedHostingHost:"staging.busydoesit.co.uk",
 buildProfile:"preview",sourceCommit:"f".repeat(40),
 publicKeyKind:"sb_publishable",productionCredentialsPresent:false,
 customerDataPresent:false,productionWritesAllowed:false,paidProvidersEnabled:false
};
const blocked=stagingEnvironmentGuard();
equal(blocked.status,"blocked","Staging is blocked by default");
equal(blocked.passed,0,"No made-up environment evidence");
equal(blocked.actualCloudVerified,false,"Config never verifies cloud");
equal(blocked.canDeployAutomatically,false,"Cannot deploy");
equal(blocked.canRunSql,false,"Cannot run migrations");
equal(blocked.canSpendMoney,false,"Cannot pay providers");
const configured=stagingEnvironmentGuard(base);
equal(configured.passed,6,"All six config-only checks");
equal(configured.status,"configuration-review-only","Config isn't live staging");
equal(configured.actualCloudVerified,false,"Green config isn't proof of RLS");
equal(configured.founderApprovalStillRequired,true,"Approval remains separate");
equal(stagingEnvironmentGuard({...base,productionSupabaseUrl:base.stagingSupabaseUrl}).status,
 "blocked","Same Supabase project forbidden");
equal(stagingEnvironmentGuard({...base,stagingSupabaseUrl:"http://abcdefghijklmnopqrst.supabase.co/"}).status,
 "blocked","HTTP forbidden");
equal(stagingEnvironmentGuard({...base,stagingSupabaseUrl:"https://root:pass@abcdefghijklmnopqrst.supabase.co/"}).status,
 "blocked","Embedded credentials forbidden");
equal(stagingEnvironmentGuard({...base,stagingSupabaseUrl:"https://abcdefghijklmnopqrst.supabase.co/functions/v1"}).status,
 "blocked","Supabase base URL must be a plain project root");
equal(stagingEnvironmentGuard({...base,stagingHostingUrl:"https://busydoesit.co.uk/",expectedHostingHost:"busydoesit.co.uk"}).status,
 "blocked","Public website host isn't staging");
equal(stagingEnvironmentGuard({...base,stagingHostingUrl:"https://sites.busydoesit.co.uk/",expectedHostingHost:"sites.busydoesit.co.uk"}).status,
 "blocked","Public customer site host isn't staging");
equal(stagingEnvironmentGuard({...base,buildProfile:"production"}).status,
 "blocked","Production app build is prohibited");
equal(stagingEnvironmentGuard({...base,sourceCommit:"v3.125"}).status,
 "blocked","Unpinned version is insufficient");
equal(stagingEnvironmentGuard({...base,publicKeyKind:"service_role"}).status,
 "blocked","Privileged keys forbidden in mobile config");
equal(stagingEnvironmentGuard({...base,publicKeyKind:"sb_secret"}).status,
 "blocked","Server secret forbidden in mobile config");
for(const key of ["productionCredentialsPresent","customerDataPresent",
 "productionWritesAllowed","paidProvidersEnabled"]){
 equal(stagingEnvironmentGuard({...base,[key]:true}).status,
 "blocked",key+" must be explicitly false");
}
const web={
 businessId:businessA,ownerBusinessId:businessA,
 draftGeneration:7,hostedGeneration:7,
 previewDeploymentId:previewId,ownerReviewedDeploymentId:previewId,
 artifactSha256:"a".repeat(64),independentlyObservedSha256:"a".repeat(64),
 hostedOrigin:"https://staging.busydoesit.co.uk/preview/fictional-one",
 expectedStagingOrigin:"https://staging.busydoesit.co.uk/",
 fictionalDataOnly:true,cssMobileReviewed:true,cssDesktopReviewed:true,
 recoveryReadOnly:true,unauthorisedWritesBlocked:true
};
const unfinished=websiteStagingJourneyEvidence();
equal(unfinished.status,"blocked","No fictional journey by default");
equal(unfinished.passed,0,"No imaginary hosted version");
const complete=websiteStagingJourneyEvidence(web);
equal(complete.total,8,"Eight evidence gates");
equal(complete.status,"ready-for-independent-staging-review","Manual review remains");
equal(complete.realHostedPreviewVerified,false,"Passing source inputs aren't real HTTPS");
equal(complete.canPublishPublic,false,"No public release authority");
equal(complete.automaticRollback,false,"Do not advertise automatic rollback");
equal(websiteStagingJourneyEvidence({...web,ownerBusinessId:businessB}).status,
 "blocked","Cross-tenant review is rejected");
equal(websiteStagingJourneyEvidence({...web,hostedGeneration:6}).status,
 "blocked","Old preview generation rejected");
equal(websiteStagingJourneyEvidence({...web,ownerReviewedDeploymentId:businessB}).status,
 "blocked","Approval of different version rejected");
equal(websiteStagingJourneyEvidence({...web,artifactSha256:"b".repeat(64)}).status,
 "blocked","Artifact mismatch rejected");
equal(websiteStagingJourneyEvidence({...web,hostedOrigin:"https://busydoesit.co.uk/preview/x"}).status,
 "blocked","Public origin never counts for rehearsal");
equal(websiteStagingJourneyEvidence({...web,cssMobileReviewed:false}).status,
 "blocked","Missing phone inspection fails");
equal(websiteStagingJourneyEvidence({...web,unauthorisedWritesBlocked:false}).status,
 "blocked","Unblocked writes fail");
equal(websiteStagingJourneyEvidence({...web,fictionalDataOnly:false}).status,
 "blocked","Real customer data fails");
const app={app:{draft_revision:7},preview:{id:previewId,version_no:4,source_draft_revision:7}};
const current=businessAppPreviewProof(app);
equal(current.matches,true,"Matching immutable Business App preview");
equal(current.canPublishAutomatically,false,"Builder cannot publish automatically");
equal(current.requiresServerScopeAndOwnerClick,true,"Server and owner still decide");
equal(businessAppPreviewProof({app:app.app,preview:{...app.preview,source_draft_revision:6}}).matches,
 false,"Stale Business App preview rejected");
equal(businessAppPreviewProof({app:{draft_revision:0},preview:{...app.preview,source_draft_revision:0}}).matches,
 false,"Empty unbuilt app not current");
equal(businessAppPreviewProof({app:app.app,preview:{...app.preview,id:"preview-latest"}}).matches,
 false,"Missing immutable version ID rejected");
equal(businessAppPreviewProof({app:app.app,preview:{...app.preview,version_no:0}}).matches,
 false,"Missing immutable version number rejected");
equal(businessAppPreviewProof({app:app.app,preview:{...app.preview,source_draft_revision:"7"}}).matches,
 false,"String-coerced revision refused");
const founder=founderStagingSummary();
equal(founder.status,"not-verified","Founder UI does not claim live staging");
equal(founder.environment.passed,0,"No keys/hosts inferred from production");
equal(founder.cloud.passed,0,"Twelve cloud gates remain unverified");
equal(founder.journey.passed,0,"Hosted canary unverified");
equal(founder.usesRealTelemetry,false,"Static founder plan isn't live telemetry");
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
truth(read("src/screens/miniApps.js").includes("businessAppPreviewProof({"),
 "Live Business App screen uses strict immutable preview check");
truth(read("src/screens/founderOperations.js").includes("founderStagingSummary()"),
 "Verified founder view includes truthful next staging action");
truth(read(".github/workflows/production-check.yml").includes(
 "check-website-staging-execution-v3125.mjs"),"New regression added to usual CI");
console.log("V3.125 PASS: "+n+" isolation, exact website and Business App version, founder and CI assertions.");
