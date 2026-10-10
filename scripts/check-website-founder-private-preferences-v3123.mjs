import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {founderPrioritySummary} from "../src/core/founderPrioritySummary.mjs";
import {founderOperationalPriorities} from "../src/core/founderOperationalPriorities.mjs";
import {founderRecoveryReview} from "../src/core/founderRecoveryReview.mjs";
import {founderSafeAutomationSummary} from "../src/core/founderSafeAutomationSummary.mjs";
import {designPreferenceSummary} from "../supabase/functions/busy-website-publish/designFeedback.mjs";
import {websiteDesignAlternative} from "../src/core/websiteDesignAlternatives.mjs";
import {websiteBrainCoaching} from "../src/core/websiteBrainCoaching.mjs";
let count=0;const eq=(a,b,label)=>{assert.deepEqual(a,b,label);count++};
const ok=(x,label)=>{assert.ok(x,label);count++};
const unknown=founderPrioritySummary();
eq(unknown.status,"refresh","Without trusted data founder must refresh");
eq(unknown.count,null,"No fabricated zero-count from unavailable report");
eq(unknown.automaticRepair,false,"Read-only summary never repairs");
const report={scope:"platform_aggregate",privacy:"aggregate_only",
 status:"read_only",checkedAt:"2026-10-10T15:00:00Z",
 metrics:{failedWebsiteJobs:2,failedSocialPosts:0,
 failedBusinessApps:0,pendingWebsiteJobs:0},
 reliability:{monitoringIsVerified:true}};
const priorities=(r=report,at="2026-10-10T15:15:00Z")=>
 founderOperationalPriorities(r,{nowISO:at});
const joined=p=>founderPrioritySummary({priorities:p,
 incidentReview:founderRecoveryReview({priorities:p}),
 safeAutomation:founderSafeAutomationSummary({priorities:p})});
const alerts=joined(priorities());
eq(alerts.status,"review","Recorded jobs need manual review");
eq(alerts.count,1,"Counts affected categories not fabricated customer incidents");
ok(alerts.title.includes("website"),"Next founder issue is explicit");
eq(alerts.sentNotification,false,"No imaginary SMS or push alert");
eq(alerts.mayChangeCustomerData,false,"Founder summary never reads or writes tenant records");
const stale=joined(priorities(report,"2026-10-13T15:15:00Z"));
eq(stale.status,"refresh","Old founder snapshot cannot drive incident action");
eq(stale.count,null,"Old incident count is not trusted current state");
const missingMonitor=joined(priorities({...report,
 metrics:{failedWebsiteJobs:0,failedSocialPosts:0,failedBusinessApps:0,
 pendingWebsiteJobs:0},reliability:{monitoringIsVerified:false}}));
eq(missingMonitor.status,"verify","Unknown monitoring not healthy");
eq(missingMonitor.automaticRepair,false,"No privileged follow-up action");
const clear=joined(priorities({...report,
 metrics:{failedWebsiteJobs:0,failedSocialPosts:0,
 failedBusinessApps:0,pendingWebsiteJobs:0}}));
eq(clear.status,"routine","Only actually measured all-clear allows routine checks");
ok(clear.explanation.includes("not proof"),"Never promise all services healthy");
const draft={id:"d",businessType:"Gardening",
 theme:{designFamily:"organic"},sections:[{id:"hero"}]};
const preferences=designPreferenceSummary([
 {design_family:"minimal",preference:"rejected"},
 {design_family:"editorial",preference:"liked"},
 {design_family:"artisan",preference:"reverted"}
]);
const alternatives=websiteDesignAlternative(draft,{
 likedFamilies:preferences.likedFamilies,rejectedFamilies:preferences.rejectedFamilies
});
eq(alternatives.suggested.family,"editorial",
 "Preferred style wins when a private owner liked it");
ok(alternatives.options.find(x=>x.family==="minimal").previouslyRejected,
 "An explicit rejection remains recorded");
ok(!alternatives.options.find(x=>x.family==="minimal").recommended,
 "A rejected style cannot be an automatic recommendation");
ok(alternatives.options.find(x=>x.family==="minimal").ownerApprovalRequired,
 "Owner can still deliberately select any visual style");
const fullyRejected=websiteDesignAlternative(draft,{
 rejectedFamilies:["minimal","editorial","artisan","organic"]});
eq(fullyRejected.suggested,null,
 "When all alternatives rejected, BUSY doesn't suggest one against preferences");
ok(fullyRejected.options.length>0,
 "Every layout remains available for explicit customer choice");
ok(fullyRejected.reason.includes("previously rejected"),
 "BUSY explains why no design is recommended");
const coach=websiteBrainCoaching({summary:preferences,
 alternative:{suggested:alternatives.suggested}});
eq(coach.sharedLearningEnabled,false,"Per-business decisions never leave tenant");
eq(coach.measuredSalesChange,null,"No invented sales outcome");
const untrusted=websiteBrainCoaching({summary:{...preferences,scope:"another-business"},
 alternative:{suggested:alternatives.suggested}});
eq(untrusted.scope,"general-business-context",
 "Cross-tenant stored preferences are ignored");
const source=readFileSync(new URL("../src/screens/founderOperations.js",import.meta.url),"utf8");
ok(source.includes("founderPrioritySummary({"),"Founder UI shows joined priorities");
ok(source.includes("Why is this my next priority?"),"Founder can reveal justification on demand");
ok(source.includes("showOperatingEvidence?("),"Expert details are optional");
ok(source.includes('right={show(nextPriority.count)}'),
 "Missing incident counts are shown as not measured");
ok(readFileSync(new URL("../.github/workflows/production-check.yml",import.meta.url),"utf8")
 .includes("check-website-founder-private-preferences-v3123.mjs"),
 "Regular checks include founder and memory tests");
console.log("V3.123 PASS: "+count+" private Business Brain recommendations and founder simplicity assertions.");
