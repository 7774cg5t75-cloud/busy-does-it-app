import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {websitePilotReadiness} from "../src/core/websitePilotReadiness.mjs";
import {founderOperationalPriorities} from "../src/core/founderOperationalPriorities.mjs";
import {websiteOutcomeGuidance} from "../src/core/websiteOutcomeGuidance.mjs";
import {websiteOutcomeEvidence} from "../supabase/functions/busy-website-worker/websiteOutcomeEvidence.mjs";
import {designPreferenceSummary} from "../supabase/functions/busy-website-publish/designFeedback.mjs";
import {websiteReleaseReadiness} from "../src/core/websiteReleaseReadiness.mjs";
let n=0;const eq=(a,b,m)=>{assert.deepEqual(a,b,m);n++};
const ok=(a,m)=>{assert.ok(a,m);n++};
const t1="91edb6db-3a02-4de4-9ba8-5c93b4e790a1";
const t2="d8836a0e-fbb0-4cb9-a613-509af50eb114";
const base={
 businessId:t1,ownerBusinessId:t1,role:"owner",
 environment:"sandbox",productionCredentialsPresent:false,
 fictionalDataOnly:true,tenantIsolationVerified:true,dryRun:true,
 allowExternalWrites:false,allowPaidCalls:false,
 rollbackTested:true,testDataDeletionReviewed:true,founderApproved:true
};
const missing=websitePilotReadiness();
eq(missing.status,"blocked","No implied owner approval");
eq(missing.passed,0,"No imaginary sandbox proof");
eq(missing.total,7,"Seven independent safety gates");
eq(missing.canRunAutomatically,false,"No silent staging tests");
eq(missing.canUseProduction,false,"Production always excluded");
eq(missing.canSpendMoney,false,"No paid calls");
eq(missing.canPublishWebsite,false,"No public publishing");
eq(missing.canContactCustomers,false,"No real emails or messages");
eq(missing.testBusinessId,null,"Do not invent a test tenant");
const ready=websitePilotReadiness(base);
eq(ready.status,"ready-for-manual-sandbox-rehearsal","Exact, evidenced test may be manually rehearsed");
eq(ready.canRunAutomatically,false,"Readiness cannot execute code");
eq(ready.testBusinessId,t1,"Only exact sandbox business allowed");
for(const [change,label] of [
 [{businessId:t2},"cross business"],
 [{ownerBusinessId:t2},"unauthorised tenant"],
 [{role:"viewer"},"read only role"],
 [{environment:"production"},"live environment"],
 [{productionCredentialsPresent:true},"production keys"],
 [{fictionalDataOnly:false},"real customer content"],
 [{tenantIsolationVerified:false},"unverified isolation"],
 [{dryRun:false},"not a dry run"],
 [{allowExternalWrites:true},"real writes"],
 [{allowPaidCalls:true},"paid calls"],
 [{rollbackTested:false},"no rollback"],
 [{testDataDeletionReviewed:false},"undeleted test data"],
 [{founderApproved:false},"no explicit approval"]
 ])eq(websitePilotReadiness({...base,...change}).status,"blocked",
    "Pilot denied for "+label);
ok(websitePilotReadiness({...base,businessId:"invalid"}).testBusinessId===null,
 "Invalid UUID never becomes a test tenant");
const feedback=designPreferenceSummary([
 {design_family:"editorial",preference:"kept",draft_version:"7"},
 {design_family:"editorial",preference:"reverted",draft_version:"6"},
 {design_family:"minimal",preference:"rejected",draft_version:"2"}]);
eq(feedback.latestOwnerDecision?.family,"editorial","Most recent owner outcome returned");
eq(feedback.latestOwnerDecision?.draftVersion,"7","Exact design revision recorded");
eq(feedback.latestOwnerDecision?.choice,"kept","Recent keep overrides previous revert");
eq(feedback.measuredRevenueChange,null,"No made-up customer revenue");
const current=websiteOutcomeGuidance(feedback,{currentFamily:"editorial",currentRevision:"7"});
eq(current.status,"owner-reported-choice","Show matching explicit owner feedback");
eq(current.ownerSaidKept,true,"Owner choice survives");
eq(current.websitePerformanceMeasured,false,"Owner choice not analytics");
eq(current.observedConversionImprovement,null,"No conversion assumptions");
eq(current.sharedBetweenBusinesses,false,"No platform-wide pattern sharing");
eq(current.trainedAiModel,false,"No self training");
eq(websiteOutcomeGuidance(feedback,{currentFamily:"editorial",currentRevision:"8"}).status,
 "preference-only","Old design revision never reported as current");
eq(websiteOutcomeGuidance({...feedback,scope:"other_tenant"},{currentFamily:"editorial",
 currentRevision:"7"}).status,"unavailable","Foreign tenant evidence rejected");
const q={version:1,assessedTextCount:12,unassessedContrastCount:0,
 lowContrastCount:0,smallBodyTextCount:0,smallTouchTargetCount:0,
 unnamedControlsCount:0,missingInputLabelCount:0,missingImageAltCount:0,
 headingLevelSkips:0,hasDocumentLanguage:true,hasMainLandmark:true};
const screen=quality=>({horizontalOverflowPixels:0,headingVisible:true,
 navigationFits:true,heroHeadingFontPx:35,qualityAudit:quality});
const audits=quality=>({mobileAudit:screen(quality),desktopAudit:screen(quality)});
const good=audits(q),bad=audits({...q,smallTouchTargetCount:2});
const verdict=websiteOutcomeEvidence({before:bad,after:good,
 businessId:t1,authorizedBusinessId:t1,family:"editorial",revision:"7",
 feedback});
eq(verdict.status,"owner-choice-and-browser-review","Browser and owner independent evidence");
eq(verdict.design.status,"measured-improvement","Measured quality improvement described correctly");
eq(verdict.ownerDecision?.choice,"kept","Matching revision preference grounded");
eq(verdict.published,false,"Review doesn't publish website");
eq(verdict.verifiedSalesLift,null,"Still no sales proof");
eq(verdict.verifiedConversionLift,null,"No traffic conversion proof");
eq(verdict.crossBusinessLearning,false,"Isolated business only");
eq(websiteOutcomeEvidence({before:bad,after:good,businessId:t2,
 authorizedBusinessId:t1,family:"editorial",revision:"7",feedback}).status,
 "not-authorized","Reject cross-business evaluator");
eq(websiteOutcomeEvidence({before:bad,after:good,businessId:t1,
 authorizedBusinessId:t1,family:"editorial",revision:"8",feedback}).ownerDecision,
 null,"Stale revision preference not reused");
eq(websiteOutcomeEvidence({before:bad,after:good,businessId:t1,
 authorizedBusinessId:t1,family:"editorial",revision:"7",
 feedback:{...feedback,scope:"foreign_business"}}).ownerDecision,null,
 "Unscoped feedback cannot be used");
eq(websiteOutcomeEvidence({before:good,after:bad,businessId:t1,
 authorizedBusinessId:t1,family:"editorial",revision:"7",feedback}).status,
 "regression","Owner liking a style cannot overrule worse accessibility");
const report={
 scope:"platform_aggregate",privacy:"aggregate_only",status:"read_only",
 checkedAt:"2026-10-01T14:00:00Z",
 metrics:{failedWebsiteJobs:0,failedSocialPosts:0,failedBusinessApps:0,
 pendingWebsiteJobs:0},
 reliability:{monitoringIsVerified:true}
};
const recent=founderOperationalPriorities({...report,checkedAt:"2026-10-10T14:00:00Z"},
 {nowISO:"2026-10-10T15:00:00Z"});
eq(recent.freshness,"recent","Recent time-bound report");
eq(recent.highPriorityCount,0,"Measured zero failures");
const stale=founderOperationalPriorities(report,{nowISO:"2026-10-10T15:00:00Z"});
eq(stale.freshness,"stale","Stale founder snapshot is recognised");
eq(stale.headline,"Founder snapshot needs refreshing","Stale zero cannot imply health");
eq(stale.items[0].key,"snapshot","Refresh before relying on old counts");
eq(stale.automaticRepairs,false,"No automatic code or provider changes");
const unknown=founderOperationalPriorities({...report,checkedAt:"invalid"},
 {nowISO:"2026-10-10T15:00:00Z"});
eq(unknown.freshness,"unverified","Missing timestamp is unverified");
eq(founderOperationalPriorities({...report,scope:"business_workspace"},
 {nowISO:"2026-10-10T15:00:00Z"}).status,"unavailable",
 "Cross-business detail must never become founder aggregate");
const release=websiteReleaseReadiness();
eq(release.status,"blocked","Staging readiness does not override global release gate");
eq(release.checks.some(x=>x.id==="global"),true,"International planning retained");
const code=readFileSync(new URL("../src/screens/founderOperations.js",import.meta.url),"utf8");
ok(code.includes("Safe pilot preparation"),"Founder sees actual pilot checklist");
ok(code.includes("websitePilotReadiness()"),"Pilot UI starts fail-closed");
ok(code.includes("nowISO:new Date().toISOString()"),"Founder triage uses current timestamp");
const mobile=readFileSync(new URL("../src/screens/websiteBuilder.js",import.meta.url),"utf8");
ok(mobile.includes("websiteOutcomeGuidance(savedStylePreferences"),"Actual builder explains owner evidence truthfully");
const route=readFileSync(new URL("../supabase/functions/busy-website-publish/index.ts",import.meta.url),"utf8");
ok(route.includes('.select("design_family,preference,draft_version,created_at")'),
 "Backend includes revision in private history");
ok(readFileSync(new URL("../.github/workflows/production-check.yml",import.meta.url),"utf8")
 .includes("check-website-safe-pilot-v3118.mjs"),"Normal CI includes independent pilot and evidence regression tests");
console.log("V3.118 PASS: "+n+" safe sandbox readiness, outcome evidence, freshness and release guard tests.");
