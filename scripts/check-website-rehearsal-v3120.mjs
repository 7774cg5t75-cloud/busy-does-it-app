import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {websiteRehearsalTimeline} from "../src/core/websiteRehearsalTimeline.mjs";
import {founderRehearsalGuidance} from "../src/core/founderRehearsalGuidance.mjs";
import {founderOperationalPriorities} from "../src/core/founderOperationalPriorities.mjs";
import {websitePilotReadiness} from "../src/core/websitePilotReadiness.mjs";
import {websiteReleaseReadiness} from "../src/core/websiteReleaseReadiness.mjs";
import {websiteReviewAdvice} from "../supabase/functions/busy-website-worker/websiteReviewAdvice.mjs";
let n=0;const eq=(a,b,m)=>{assert.deepEqual(a,b,m);n++};
const yes=(a,m)=>{assert.ok(a,m);n++};
const tenant="91edb6db-3a02-4de4-9ba8-5c93b4e790a1";
const other="d8836a0e-fbb0-4cb9-a613-509af50eb114";
const context={businessId:tenant,ownerBusinessId:tenant,role:"owner",
 environment:"sandbox",productionCredentialsPresent:false,
 fictionalDataOnly:true,tenantIsolationVerified:true,dryRun:true,
 allowExternalWrites:false,allowPaidCalls:false,rollbackTested:true,
 testDataDeletionReviewed:true,founderApproved:true};
const e=(type,props={})=>({type,businessId:tenant,...props});
const start=e("draft_created",{hash:"private-v1"});
const preview=e("preview_prepared",{hash:"private-v1",previewId:"preview-1"});
const approval=e("owner_approved",{hash:"private-v1",actorRole:"owner",explicitApproval:true});
const publish=e("deployment_recorded",{hash:"private-v1",
 previewId:"preview-1",deploymentId:"deploy-1"});
const observed=e("delivery_observed",{hash:"private-v1",deploymentId:"deploy-1",
 httpsHealthy:true});
const first=[start,preview,approval,publish,observed];
const run=(events=first,options=context)=>websiteRehearsalTimeline({context:options,events});
eq(run().status,"simulated","All phases exercised with fictional data");
eq(run().simulatedDeliveryMatched,true,"Simulated exact-version delivery matched");
eq(run().liveWebsiteVerified,false,"Synthetic probes never verify real websites");
eq(run().publishedToInternet,false,"No real website published");
eq(run().proofForActualProduction,false,"Rehearsal evidence cannot be promoted to production");
eq(run().chargedProvider,false,"No provider billing");
eq(run().steps.length,5,"All lifecycle phases recorded");
eq(run([]).status,"awaiting-events","No events means no claimed progress");
const edit=e("draft_edited",{hash:"private-v2"});
const newPreview=e("preview_prepared",{hash:"private-v2",previewId:"preview-2"});
const newApproval=e("owner_approved",{hash:"private-v2",actorRole:"owner",explicitApproval:true});
const newPublish=e("deployment_recorded",{hash:"private-v2",
 previewId:"preview-2",deploymentId:"deploy-2"});
const newObserved=e("delivery_observed",{hash:"private-v2",deploymentId:"deploy-2",
 httpsHealthy:true});
const rollbackApproval=e("rollback_approved",{actorRole:"owner",explicitApproval:true,
 hash:"private-v1"});
const rollback=e("rollback_recorded",{hash:"private-v1",deploymentId:"rollback-1"});
const rollbackObserved=e("delivery_observed",{hash:"private-v1",
 deploymentId:"rollback-1",httpsHealthy:true});
const twice=[...first,edit,newPreview,newApproval,newPublish,newObserved];
const reversed=[...twice,rollbackApproval,rollback,rollbackObserved];
eq(run(reversed).status,"simulated","Second version and manual rollback simulated");
eq(run(reversed).simulatedPublishedHash,"private-v1",
 "Rollback targets explicitly approved original content");
eq(run(reversed).simulatedDeliveryMatched,true,
 "Rollback also needs matching delivery observation");
eq(run(twice).simulatedPublishedHash,"private-v2","Updated revision after approval");
eq(run([...first,edit]).simulatedPublishedHash,"private-v1",
 "Private edit never changes existing public-version record");
eq(run([...first,edit]).simulatedDeliveryMatched,true,
 "New private edits preserve proof of old simulated delivery");
eq(run([...first,edit,newPreview]).simulatedPublishedHash,"private-v1",
 "Host new preview doesn't publish");
eq(run([...first,edit,newPreview]).simulatedDeliveryMatched,true,
 "No new proof replaces original delivery without new publish");
for(const [events,message] of [
 [[preview],"No draft"],
 [[start,publish],"No approval"],
 [[start,approval],"Approval without preview"],
 [[start,preview,{...approval,hash:"private-v2"}],"Approve stale hash"],
 [[start,preview,{...approval,explicitApproval:false}],"No explicit consent"],
 [[start,preview,{...approval,actorRole:"viewer"}],"Viewer approval"],
 [[start,preview,approval,{...publish,hash:"private-v2"}],"Publish unapproved hash"],
 [[start,preview,approval,{...publish,previewId:"wrong"}],"Publish wrong preview"],
 [[start,preview,approval,edit,publish],"Edit invalidates approval"],
 [[...first,{...observed,deploymentId:"incorrect"}],"Wrong delivery version"],
 [[...first,{...observed,httpsHealthy:false}],"No HTTPS proof"],
 [[...first,{...edit,businessId:other}],"Cross-tenant event"],
 [[...first,{...edit,paid:true}],"Paid provider call"],
 [[...first,{...edit,externalWrite:true}],"External service write"],
 [[...first,{...edit,production:true}],"Production action"],
 [[...first,rollbackApproval],"Rollback with no prior published version"],
 [[...twice,{...rollbackApproval,explicitApproval:false}],"No owner rollback consent"],
 [[...twice,{...rollbackApproval,actorRole:"viewer"}],"Viewer rollback"],
 [[...twice,{...rollbackApproval,hash:"private-v2"}],"Wrong rollback target"],
 [[...twice,rollback],"Rollback without approval"],
 [[...twice,rollbackApproval,{...rollback,hash:"private-v2"}],"Rollback altered hash"],
 [[...twice,rollbackApproval,rollback,{...rollbackObserved,hash:"private-v2"}],"Rollback mismatched proof"]
]){
 const result=run(events);
 eq(result.status,"rejected",message+" is rejected");
 eq(result.liveWebsiteVerified,false,message+" never marks a real website live");
}
eq(run(first,{...context,environment:"production"}).status,"blocked",
 "Production setting cannot rehearse");
eq(run(first,{...context,ownerBusinessId:other}).status,"blocked",
 "Wrong business cannot run test");
eq(run(first,{...context,allowPaidCalls:true}).status,"blocked",
 "Paid connection forbidden");
eq(run(first,{...context,founderApproved:false}).status,"blocked",
 "Owner approval not assumed");
eq(run(first,{...context,fictionalDataOnly:false}).status,"blocked",
 "Real customer data never admitted");
eq(run(new Array(25).fill(start)).status,"blocked",
 "Excessive sequences rejected");
eq(websitePilotReadiness().status,"blocked","Real sandbox is not provisioned by a unit test");
const q={version:1,assessedTextCount:12,unassessedContrastCount:0,
 lowContrastCount:0,smallBodyTextCount:0,smallTouchTargetCount:0,
 unnamedControlsCount:0,missingInputLabelCount:0,missingImageAltCount:0,
 headingLevelSkips:0,hasDocumentLanguage:true,hasMainLandmark:true};
const vp=x=>({horizontalOverflowPixels:0,headingVisible:true,
 navigationFits:true,heroHeadingFontPx:36,qualityAudit:x});
const qa=x=>({mobileAudit:vp(x),desktopAudit:vp(x)});
const good=qa(q),smallButtons=qa({...q,smallTouchTargetCount:5});
eq(websiteReviewAdvice({before:smallButtons,after:good}).status,
 "measured-improvement","Measured improvement distinguished");
eq(websiteReviewAdvice({before:good,after:good}).status,
 "safe-alternative","Equal quality not called improvement");
const harm=websiteReviewAdvice({before:good,after:smallButtons});
eq(harm.status,"regression","Worsened touch targets rejected");
eq(harm.publishAllowed,false,"Even safe advice doesn't publish");
eq(harm.autoApply,false,"No automatic edits");
eq(harm.needsPaidAi,false,"Browser guidance has no paid AI dependency");
eq(harm.measuredSalesLift,null,"Visual score not revenue");
yes(harm.findings.some(x=>x.category==="buttons"),
 "Tappable-size regression produces an actionable recommendation");
eq(websiteReviewAdvice({before:null,after:good}).status,
 "needs-review","Missing before audit cannot prove improvement");
const original={id:"real-draft",sections:[{id:"facts",title:"Business prices"}],
 theme:{designFamily:"organic"}};
const changed={...original,sections:[{id:"facts",title:"Invented prices"}]};
eq(websiteReviewAdvice({before:good,after:good,
 originalDraft:original,candidateDraft:changed}).status,
 "regression","Changed customer facts rejected");
const platform={scope:"platform_aggregate",privacy:"aggregate_only",status:"read_only",
 checkedAt:"2026-10-10T10:00:00Z",
 metrics:{failedWebsiteJobs:0,failedSocialPosts:0,failedBusinessApps:0,
 pendingWebsiteJobs:0},reliability:{monitoringIsVerified:true}};
const priorities=(report=platform,nowISO="2026-10-10T10:01:00Z")=>
 founderOperationalPriorities(report,{nowISO});
const founder=(p=priorities(),pilot=websitePilotReadiness())=>
 founderRehearsalGuidance({priorities:p,pilot,release:websiteReleaseReadiness()});
eq(founder().stage,"prepare-sandbox","Recent clean aggregate requires sandbox evidence");
eq(founder().realCustomerPilotStarted,false,"No real pilot claimed");
eq(founder().liveDeployAllowed,false,"No automatic launch");
eq(founder().autonomousRepairAllowed,false,"No automatic retries");
eq(founder().publicReleaseReady,false,"Never certify commercial release");
eq(founder(priorities({...platform,
 metrics:{...platform.metrics,failedSocialPosts:2}})).stage,
 "review-incidents","Known failed social operations take priority");
eq(founder(priorities(platform,"2026-10-12T10:01:00Z")).stage,
 "verify-report","Outdated founder snapshot refreshed first");
eq(founder(priorities(platform,"2026-10-12T10:01:00Z")).monitoringFresh,
 false,"Old monitoring is not current");
eq(founder(null).stage,"verify-report","Missing founder report requires verification");
eq(founder(priorities(platform,"2026-10-10T10:01:00Z"),
 websitePilotReadiness(context)).stage,"manual-rehearsal",
 "Even all seven synthetic checks only recommend manual sandbox review");
const founderUI=readFileSync(new URL("../src/screens/founderOperations.js",import.meta.url),"utf8");
yes(founderUI.includes("founderRehearsalGuidance({"),"Actual founder page shows next safe preparation");
const siteUI=readFileSync(new URL("../src/screens/websiteBuilder.js",import.meta.url),"utf8");
yes(siteUI.includes("switch(assurance.action)"),"Live customer button follows truthfully displayed step");
yes(siteUI.includes("assurance.hostedPreviewReady&&hostedPreview?.id"),
 "Outdated hosted previews cannot be launched via main action");
const prod=readFileSync(new URL("../.github/workflows/production-check.yml",import.meta.url),"utf8");
yes(prod.includes("check-website-rehearsal-v3120.mjs"),
 "All offline privacy and rehearsal tests in production regression workflow");
console.log("V3.120 PASS: "+n+" lifecycle, rollback, browser review and founder readiness assertions.");
