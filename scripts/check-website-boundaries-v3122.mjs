import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {websiteAutomationBoundary} from "../src/core/websiteAutomationBoundary.mjs";
import {founderSafeAutomationSummary} from "../src/core/founderSafeAutomationSummary.mjs";
import {websiteRecoveryCoach} from "../src/core/websiteRecoveryCoach.mjs";
import {websiteBrainCoaching} from "../src/core/websiteBrainCoaching.mjs";
import {websitePublishApprovalGuide} from "../src/core/websitePublishApprovalGuide.mjs";
import {websiteReviewAdvice} from "../supabase/functions/busy-website-worker/websiteReviewAdvice.mjs";
import {founderOperationalPriorities} from "../src/core/founderOperationalPriorities.mjs";
let n=0;const eq=(a,b,m)=>{assert.deepEqual(a,b,m);n++};const ok=(a,m)=>{assert.ok(a,m);n++};
const read=action=>websiteAutomationBoundary({action,attempt:1,httpStatus:503,tenantAuthorized:true});
for(const action of ["website_health_read","provider_status_read","founder_aggregate_read"]){
 eq(read(action).kind,"read","Known read "+action);
 eq(read(action).mayAutoRetryRead,true,"Read retry is bounded");
 eq(read(action).maxTotalReadAttempts,2,"Never poll indefinitely");
 eq(read(action).actionExecuted,false,"Evaluator has no side effects");
}
for(const action of ["website_publish","website_rollback","domain_dns_edit",
 "domain_purchase","social_post","business_data_write","provider_plan_change",
 "paid_ai_generate","customer_notification","booking_create"]){
 eq(read(action).kind,"write",action+" classification");
 eq(read(action).mayAutoRetryRead,false,"No autonomous write retries");
 eq(read(action).productionWriteAllowed,false,"No live mutation");
 eq(read(action).paidCallAllowed,false,"No paid calls");
}
for(const change of [{httpStatus:400},{httpStatus:429},{httpStatus:500},
 {httpStatus:200},{attempt:0},{attempt:2},{attempt:-1},
 {tenantAuthorized:false},{httpStatus:null}]){
 eq(websiteAutomationBoundary({action:"website_health_read",attempt:1,
 httpStatus:503,tenantAuthorized:true,...change}).mayAutoRetryRead,false,
 "Non-transient, unauthorized or exhausted attempt rejected");
}
eq(read("unknown_action").kind,"unknown","Unknown operation rejected");
eq(read("unknown_action").mayAutoRetryRead,false,"No unknown auto retry");
eq(read("website_publish").canPublish,false,"No automatic Go Live");
eq(read("domain_dns_edit").canChangeDns,false,"No DNS changes");
const preview={id:"hosted-v2",content_hash:"hash-v2"};
const view={draftChangedSinceHosted:false,canPublish:true};
const check=(x=view)=>websitePublishApprovalGuide({preview,view:x,
 openedId:preview.id,reviewedId:preview.id});
eq(check().readyForOwnerClick,true,"Current preview can be manually approved");
eq(check({...view,draftChangedSinceHosted:true}).readyForOwnerClick,false,
 "Editing draft blocks old preview");
eq(check({...view,canPublish:false}).readyForOwnerClick,false,
 "Core denial overrides customer state");
eq(check({...view,activeJob:{status:"processing"}}).readyForOwnerClick,false,
 "Active publication blocks duplicate");
eq(check().serverAuthorized,false,"UI check is not server consent");
const source=readFileSync(new URL("../src/domain/websitePublishing.js",import.meta.url),"utf8");
ok(source.includes('draftChangedSinceHosted === false &&\n      !activeJob,'),
 "Real core publish state blocks changed private draft");
ok(source.includes('!recoveryOwnerAction &&\n      !recoveryAutomatic &&\n      !!liveDeployment'),
 "Real core recovery denies competing automatic and manual retries");
const base={liveDeployment:{id:"live-1"},healthStatus:"down",
 recoveryState:{healthy:false},canRetrySafeRecovery:true};
eq(websiteRecoveryCoach(base).status,"manual-recovery","Manual retry path exists");
eq(websiteRecoveryCoach({...base,recoveryState:{automatic:true}}).retryAvailable,false,
 "Automatic recovery already running");
eq(websiteRecoveryCoach({...base,activeJob:{status:"processing"}}).retryAvailable,
 false,"No duplicate job");
eq(websiteRecoveryCoach({...base,activeJob:{status:"processing"},
 recoveryState:{healthy:true},healthStatus:"healthy"}).status,"in-progress",
 "In-progress status takes precedence");
eq(websiteRecoveryCoach({...base,healthStatus:"healthy",
 recoveryState:{healthy:true}}).retryAvailable,false,"Healthy means no retry");
eq(websiteRecoveryCoach({...base,liveDeployment:null}).retryAvailable,false,
 "Missing safe live target denies retry");
eq(websiteRecoveryCoach({...base,recoveryState:{ownerActionRequired:true}})
 .status,"owner-dns","Owner DNS case distinct from automation");
const summary={scope:"current_business_only",source:"owner_explicit_feedback",
 globalLearningEnabled:false,modelRetrained:false,
 likedFamilies:["minimal"],rejectedFamilies:["boutique"]};
const coach=family=>websiteBrainCoaching({summary,alternative:{suggested:{family}}});
ok(coach("minimal").explanation.includes("previously liked"),
 "Accepted choice explained without claiming retraining");
ok(coach("boutique").explanation.includes("previously rejected"),
 "Rejected choice not recommended dishonestly");
ok(!!coach("boutique").warning,"Owner warning retained");
eq(coach("minimal").privateDraftOnly,true,"Styles remain private");
eq(coach("minimal").needsOwnerApproval,true,"Customer approval required");
eq(coach("minimal").aiModelRetrained,false,"No false AI retraining");
eq(coach("minimal").measuredSalesChange,null,"No claimed sales uplift");
const unrelated=websiteBrainCoaching({summary:{...summary,scope:"other-business"},
 alternative:{suggested:{family:"minimal"}}});
eq(unrelated.scope,"general-business-context","No cross-business personalization");
const q={version:1,assessedTextCount:12,unassessedContrastCount:0,
 lowContrastCount:0,smallBodyTextCount:0,smallTouchTargetCount:0,
 unnamedControlsCount:0,missingInputLabelCount:0,missingImageAltCount:0,
 headingLevelSkips:0,hasDocumentLanguage:true,hasMainLandmark:true};
const vp=quality=>({horizontalOverflowPixels:0,headingVisible:true,
 navigationFits:true,heroHeadingFontPx:36,qualityAudit:quality});
const audits=quality=>({mobileAudit:vp(quality),desktopAudit:vp(quality)});
const safe=audits(q),broken=audits({...q,smallTouchTargetCount:8});
eq(websiteReviewAdvice({before:broken,after:safe}).status,
 "measured-improvement","Measured improvement distinguished from aesthetics");
eq(websiteReviewAdvice({before:safe,after:broken}).status,
 "regression","Broken touch controls rejected");
eq(websiteReviewAdvice({before:safe,after:broken}).safeToSuggestPrivateChange,
 false,"Regression cannot be suggested as safe");
ok(websiteReviewAdvice({before:safe,after:broken}).findings.some(x=>x.category==="buttons"),
 "Actionable button advice");
eq(websiteReviewAdvice().needsNewMeasurement,true,"Missing browser proof fails closed");
const report={scope:"platform_aggregate",privacy:"aggregate_only",status:"read_only",
 checkedAt:"2026-10-10T15:00:00Z",
 metrics:{failedWebsiteJobs:2,failedSocialPosts:0,failedBusinessApps:0,pendingWebsiteJobs:0},
 reliability:{monitoringIsVerified:true}};
const trusted=founderOperationalPriorities(report,{nowISO:"2026-10-10T15:15:00Z"});
eq(founderSafeAutomationSummary({priorities:trusted}).status,"review-only",
 "Fresh founder data supports review only");
eq(founderSafeAutomationSummary({priorities:trusted}).autoRepairEnabled,false,
 "No automatic repairs");
eq(founderSafeAutomationSummary({priorities:trusted}).automaticBillingEnabled,false,
 "No automatic bills");
eq(founderSafeAutomationSummary({priorities:founderOperationalPriorities(report,
 {nowISO:"2026-10-13T16:00:00Z"})}).status,"refresh-required",
 "Stale monitoring is not healthy");
eq(founderSafeAutomationSummary().status,"refresh-required",
 "Unknown founder scope blocked");
ok(readFileSync(new URL("../src/screens/websiteBuilder.js",import.meta.url),"utf8")
 .includes("{brainCoach.warning}"),"Customer sees rejected-style warning");
ok(readFileSync(new URL("../src/screens/founderOperations.js",import.meta.url),"utf8")
 .includes("founderSafeAutomationSummary({priorities:operational})"),
 "Founder view shows automation safety boundaries");
ok(readFileSync(new URL("../.github/workflows/production-check.yml",import.meta.url),"utf8")
 .includes("check-website-boundaries-v3122.mjs"),
 "Normal regression workflow runs V3.122 safety suite");
console.log("V3.122 PASS: "+n+" safe-read retries, customer approval, Business Brain and founder assertions.");
