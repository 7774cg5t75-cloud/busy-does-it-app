import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {websitePublishApprovalGuide} from "../src/core/websitePublishApprovalGuide.mjs";
import {websiteRecoveryCoach} from "../src/core/websiteRecoveryCoach.mjs";
import {websiteOnboardingCoach} from "../src/core/websiteOnboardingCoach.mjs";
import {founderRecoveryReview} from "../src/core/founderRecoveryReview.mjs";
import {founderOperationalPriorities} from "../src/core/founderOperationalPriorities.mjs";
import {founderRehearsalGuidance} from "../src/core/founderRehearsalGuidance.mjs";
import {websitePilotReadiness} from "../src/core/websitePilotReadiness.mjs";
import {websiteReleaseReadiness} from "../src/core/websiteReleaseReadiness.mjs";
let n=0;
const eq=(actual,expected,msg)=>{assert.deepEqual(actual,expected,msg);n++};
const ok=(value,msg)=>{assert.ok(value,msg);n++};
const approved={id:"preview-001",content_hash:"hash-preview-001"};
const live={id:"live-001",content_hash:"hash-live-001"};
const view={draftChangedSinceHosted:false,canPublish:true,
  previewDeployment:approved,liveDeployment:live};
const ready=(overrides={})=>websitePublishApprovalGuide({preview:approved,live,
  view:{...view,...overrides},openedId:approved.id,reviewedId:approved.id});
eq(websitePublishApprovalGuide().status,"blocked","Absent preview is denied");
eq(websitePublishApprovalGuide().readyForOwnerClick,false,"No implicit consent");
eq(ready().status,"ready-for-owner-click","Exact hosted version needs owner click");
eq(ready().readyForOwnerClick,true,"All exact-version client preflights passed");
eq(ready().serverAuthorized,false,"Client result never claims server permission token");
eq(ready().autoPublish,false,"Even ready does not publish itself");
eq(ready().published,false,"No publication happens by inspecting the UI");
eq(ready().exactHostedId,approved.id,"Version identifier is preserved for server");
eq(ready({draftChangedSinceHosted:true}).readyForOwnerClick,false,
 "A new private edit invalidates old preview approval");
eq(ready({draftChangedSinceHosted:undefined}).readyForOwnerClick,false,
 "Unknown draft/hosted freshness fails closed");
eq(ready({canPublish:false}).readyForOwnerClick,false,
 "A client must honour the server's publication permission");
eq(ready({activeJob:{status:"processing"}}).readyForOwnerClick,false,
 "In-flight publish blocks duplicate approval");
eq(ready({activeJob:{status:"retry_wait"}}).readyForOwnerClick,false,
 "Bounded retry stage blocks duplicate publish");
eq(websitePublishApprovalGuide({preview:approved,live:{id:approved.id},
 view}).readyForOwnerClick,false,"Current live version is not publishable again");
eq(websitePublishApprovalGuide({preview:approved,live,view,
 openedId:"preview-other",reviewedId:approved.id}).readyForOwnerClick,false,
 "Review confirmation without opening the same version is denied");
eq(websitePublishApprovalGuide({preview:approved,live,view,
 openedId:approved.id,reviewedId:"preview-other"}).readyForOwnerClick,false,
 "Review consent for another hosted version is denied");
eq(websitePublishApprovalGuide({preview:{...approved,id:"preview-002"},
 live,view,openedId:approved.id,reviewedId:approved.id}).readyForOwnerClick,false,
 "New preview requires fresh open and approval");
ok(ready({draftChangedSinceHosted:true}).next.includes("new hosted preview"),
 "Stale draft explanation is actionable without technical language");
eq(ready().ownerApprovalRequired,true,"Go Live always needs human approval");
const noRecovery=websiteRecoveryCoach();
eq(noRecovery.status,"verify","No report is not healthy");
eq(noRecovery.action,"refresh","No speculative provider action");
eq(noRecovery.verifiedPublicDelivery,false,"Never claim public HTTPS based on metadata");
eq(noRecovery.canChangeDns,false,"No DNS modifications");
eq(noRecovery.canRollbackWithoutOwner,false,"No silent rollback");
const stopped={liveDeployment:{id:"live-001"},healthStatus:"down",
 recoveryState:{healthy:false},canRetrySafeRecovery:true};
eq(websiteRecoveryCoach(stopped).status,"manual-recovery",
 "Server-permitted bounded retry can be surfaced");
eq(websiteRecoveryCoach(stopped).retryAvailable,true,
 "Manual retry remains a user action");
eq(websiteRecoveryCoach({...stopped,canRetrySafeRecovery:false}).retryAvailable,false,
 "Server denial cannot be overridden in the client");
eq(websiteRecoveryCoach({...stopped,activeJob:{status:"processing"}}).status,
 "in-progress","Active provider job must not be duplicated");
eq(websiteRecoveryCoach({...stopped,activeJob:{status:"processing"}}).retryAvailable,
 false,"No retry while a job is running");
eq(websiteRecoveryCoach({...stopped,recoveryState:{healthy:false,ownerActionRequired:true}})
 .status,"owner-dns","DNS owner action gets a distinct path");
eq(websiteRecoveryCoach({...stopped,recoveryState:{healthy:false,ownerActionRequired:true}})
 .retryAvailable,false,"Owner DNS action not confused with server retry");
const automatic={...stopped,recoveryState:{healthy:false,automatic:true,
 nextRetryAt:"2026-10-10T22:00:00Z"}};
eq(websiteRecoveryCoach(automatic).status,"automatic","Bounded automatic recovery flagged");
eq(websiteRecoveryCoach(automatic).retryAvailable,false,
 "Avoid duplicate manual recovery during automatic retry");
eq(websiteRecoveryCoach(automatic).nextScheduledRetry,
 "2026-10-10T22:00:00Z","Scheduled retry time preserved without inventing");
eq(websiteRecoveryCoach({...stopped,healthStatus:"healthy",
 recoveryState:{healthy:true}}).status,"healthy",
 "Recorded healthy service controls can show health without claiming public URL verified");
const kept=websiteRecoveryCoach({...stopped,
 recoveryState:{healthy:false,lastKnownGoodDeployment:{id:"safe-old"}}});
eq(kept.originalDeploymentRetained,true,"Last known good version stays distinct");
eq(kept.retainedDeploymentId,"safe-old","Exact safe reference is returned");
eq(kept.canRollbackWithoutOwner,false,"Retained version is not auto-restored");
const incomplete=websiteOnboardingCoach({brand:{websiteReady:false},
 journey:{missingCoreFacts:["businessName","services","email","unknown"]}});
eq(incomplete.stage,"confirm-details","Missing facts first, not template polish");
ok(incomplete.message.includes("business name"),"Human language for needed business facts");
ok(incomplete.message.includes("services"),"Owner can identify missing services");
ok(!incomplete.message.includes("unknown"),"Unknown internal field names not shown");
eq(incomplete.automaticBuild,false,"No implicit AI cost or public side effect");
eq(websiteOnboardingCoach({brand:{websiteReady:true},draft:null}).stage,
 "private-draft","Complete brief leads to private first design");
eq(websiteOnboardingCoach({brand:{websiteReady:true},draft:{id:"draft"}}).stage,
 "ready-to-edit","Existing private draft never mislabeled public");
eq(websiteOnboardingCoach({brand:{websiteReady:false}}).websitePublished,false,
 "Onboarding never publishes a website");
const report={scope:"platform_aggregate",privacy:"aggregate_only",status:"read_only",
 checkedAt:"2026-10-10T14:00:00Z",
 metrics:{failedWebsiteJobs:3,failedSocialPosts:1,failedBusinessApps:0,
 pendingWebsiteJobs:0},reliability:{monitoringIsVerified:true}};
const priorities=(r=report,time="2026-10-10T14:15:00Z")=>
 founderOperationalPriorities(r,{nowISO:time});
const review=(r=priorities())=>founderRecoveryReview({priorities:r,rehearsal:{
 next:"Review the local rehearsal checklist."}});
eq(review().status,"review-incidents","Measured incident counts require manual review");
eq(review().items.length,2,"Only failed categories displayed");
eq(review().items[0].key,"website","Website issue before social issue");
eq(review().canFixAutomatically,false,"Aggregate incidents cannot authorize repairs");
eq(review().sentAlerts,false,"No invented push/email alert");
eq(review(priorities(report,"2026-10-12T14:15:00Z")).status,
 "refresh-first","Stale counts cannot drive incident actions");
eq(review(priorities({...report,checkedAt:"unknown"})).status,
 "refresh-first","Unparseable timestamp cannot prove current issues");
const clear={...report,metrics:{failedWebsiteJobs:0,failedSocialPosts:0,
 failedBusinessApps:0,pendingWebsiteJobs:0}};
eq(review(priorities(clear)).status,"prepare-test",
 "A verified clean report can prepare a separate pilot");
eq(review(priorities(clear)).providerBillingVerified,false,
 "Missing vendor bills never imply free operation");
eq(founderRecoveryReview().status,"unavailable","No founder report is not healthy");
const rehearsal=founderRehearsalGuidance({
 priorities:priorities(clear),pilot:websitePilotReadiness(),release:websiteReleaseReadiness()});
eq(rehearsal.stage,"prepare-sandbox","Pilots still require sandbox evidence");
eq(websiteReleaseReadiness().status,"blocked","Release remains blocked");
const publishSource=readFileSync(new URL("../src/screens/websitePublishing.js",import.meta.url),"utf8");
ok(publishSource.includes("websitePublishApprovalGuide({"),
 "Production owner screen derives a safety preflight");
ok(publishSource.includes("!approvalGuide.readyForOwnerClick"),
 "Go Live button fails closed even if old review state is retained");
ok(publishSource.includes("[preview?.id,preview?.content_hash,view.draftChangedSinceHosted]"),
 "New preview content or draft edit clears existing review confirmation");
ok(publishSource.includes("!recoveryCoach.retryAvailable"),
 "Recovery button respects bounded retry guidance as well as server permission");
ok(publishSource.includes("websiteRecoveryCoach(view)"),
 "Production recovery screen has evidence-based explanation");
const websiteSource=readFileSync(new URL("../src/screens/websiteBuilder.js",import.meta.url),"utf8");
ok(websiteSource.includes("websiteOnboardingCoach({brand,journey,draft})"),
 "Actual customer builder shows factual onboarding guidance");
ok(websiteSource.includes("View previous hosted version (not latest)"),
 "Superseded preview is labelled as old");
const founderSource=readFileSync(new URL("../src/screens/founderOperations.js",import.meta.url),"utf8");
ok(founderSource.includes("founderRecoveryReview({"),
 "Founder dashboard shows aggregate incident review guidance");
ok(founderSource.includes("Recovery evidence:")&&
 founderSource.includes("Why is this my next priority?"),
 "Founder can inspect recovery evidence behind an optional Why control");
const workflow=readFileSync(new URL("../.github/workflows/production-check.yml",import.meta.url),"utf8");
ok(workflow.includes("check-website-resilience-v3121.mjs"),
 "Normal production regression workflow runs all customer-recovery tests");
console.log("V3.121 PASS: "+n+" website onboarding, exact approvals, retries and founder safety checks.");
