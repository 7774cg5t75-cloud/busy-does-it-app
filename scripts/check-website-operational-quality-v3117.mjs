import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {validateDesignFeedback,designPreferenceSummary} from "../supabase/functions/busy-website-publish/designFeedback.mjs";
import {websiteDesignAlternative} from "../src/core/websiteDesignAlternatives.mjs";
import {founderOperationalPriorities} from "../src/core/founderOperationalPriorities.mjs";
import {websiteReleaseReadiness} from "../src/core/websiteReleaseReadiness.mjs";
import {websiteDesignDecision} from "../supabase/functions/busy-website-worker/websiteDesignDecision.mjs";
let n=0;
const eq=(a,b,m)=>{assert.deepEqual(a,b,m);n++;};
const ok=(x,m)=>{assert.ok(x,m);n++;};
const record={action:"design_feedback_record",businessId:"91edb6db-3a02-4de4-9ba8-5c93b4e790a1",
 family:"organic",choice:"kept",draftVersion:"2",requestKey:"design-20261010-abc123xyz123456"};
eq(validateDesignFeedback(record).ok,true,"Customer may explicitly report keeping a style");
eq(validateDesignFeedback({...record,choice:"reverted"}).ok,true,"Customer may explicitly report switching away");
eq(validateDesignFeedback({...record,choice:"conversion_increased"}).ok,false,
 "Never invent conversion outcome");
eq(validateDesignFeedback({...record,customerName:"Private customer"}).ok,false,
 "No identifying data in feedback");
eq(validateDesignFeedback({...record,photo:"private photo"}).ok,false,
 "No media in feedback");
const summary=designPreferenceSummary([
 {design_family:"organic",preference:"reverted"},
 {design_family:"organic",preference:"kept"},
 {design_family:"editorial",preference:"kept"},
 {design_family:"minimal",preference:"rejected"}]);
eq(summary.eventCount,4,"Recorded owner-reported events only");
eq(summary.ownerReportedOutcomeCount,3,"Count owner-reported change outcomes");
eq(summary.outcomeSource,"explicit_owner_report_not_traffic_analytics",
 "Do not describe human choices as telemetry");
eq(summary.measuredRevenueChange,null,"No invented revenue numbers");
eq(summary.measuredConversionLift,null,"No fabricated improved conversions");
eq(summary.likedFamilies,["editorial"],"Most recent explicit keep wins");
eq(summary.rejectedFamilies,["organic","minimal"],"Recent revert overrides old keep");
eq(summary.globalLearningEnabled,false,"Business data not cross-trained");
eq(summary.modelRetrained,false,"No automatic foundation model retraining");
const suggestion=websiteDesignAlternative({id:"draft",businessType:"Gardening",
 theme:{designFamily:"organic"},sections:[{id:"hero"}]},{
 likedFamilies:summary.likedFamilies,rejectedFamilies:summary.rejectedFamilies});
eq(suggestion.suggested.family,"editorial","Owners' kept styles influence safe next suggestion");
const sql=readFileSync(new URL("../supabase/migrations/20261010195000_v3117_website_design_owner_outcomes.sql",import.meta.url),"utf8");
ok(sql.includes("'kept','reverted'")&&sql.includes("drop constraint if exists"),
 "Migration adds outcomes without duplicating previous constraint");
const ui=readFileSync(new URL("../src/screens/websiteBuilder.js",import.meta.url),"utf8");
ok(ui.includes('sendDesignPreference("kept")')&&ui.includes('sendDesignPreference("reverted")'),
 "Optional outcomes captured only from customer clicks");
ok(ui.includes("These are your own choices, not measured visits"),
 "Honest, simple outcome explanation");
const app=readFileSync(new URL("../src/app/AppController.js",import.meta.url),"utf8");
ok(app.includes('"liked","rejected","kept","reverted"'),"App permissions recognize outcomes");
const knownQuality={version:1,assessedTextCount:12,unassessedContrastCount:0,
 lowContrastCount:0,smallBodyTextCount:0,smallTouchTargetCount:0,
 unnamedControlsCount:0,missingInputLabelCount:0,missingImageAltCount:0,
 headingLevelSkips:0,hasDocumentLanguage:true,hasMainLandmark:true};
const viewport=(q=knownQuality)=>({horizontalOverflowPixels:0,headingVisible:true,navigationFits:true,
 heroHeadingFontPx:40,qualityAudit:q});
const sample=(q=knownQuality)=>({mobileAudit:viewport(q),desktopAudit:viewport(q)});
const base=sample(), worse=sample({...knownQuality,smallTouchTargetCount:1});
eq(websiteDesignDecision({before:base,after:base}).status,"safe-alternative",
 "Unchanged measured quality does not imply improvement");
const improved=websiteDesignDecision({before:worse,after:base});
eq(improved.status,"measured-improvement","Actual reduced problems can qualify");
eq(improved.measuredImprovement,true,"Improvement only in measured issues");
eq(improved.publishAllowed,false,"Never auto-publish measured improvements");
eq(improved.measuredRevenueLift,null,"No claim of sales uplift");
const broken=websiteDesignDecision({before:base,after:worse,ownerApproved:true});
eq(broken.status,"regression","Worsened accessibility is rejected");
eq(broken.publishAllowed,false,"Even owner flag alone cannot override guard");
eq(websiteDesignDecision({before:null,after:base}).status,"needs-review",
 "Missing original measurement cannot imply improvement");
const original={id:"draft-id",sections:[{id:"services",title:"Real prices"}],theme:{designFamily:"minimal"}};
const edited={...original,theme:{designFamily:"editorial"}};
eq(websiteDesignDecision({before:base,after:base,originalDraft:original,
 candidateDraft:edited}).status,"safe-alternative","Design-only change safe");
eq(websiteDesignDecision({before:base,after:base,originalDraft:original,
 candidateDraft:{...edited,sections:[{id:"services",title:"Fake prices"}]}}).status,
 "regression","Customer facts cannot change under design-only review");
const absent=founderOperationalPriorities();
eq(absent.status,"unavailable","No invented founder aggregate data");
eq(absent.highPriorityCount,null,"Missing signals never become zero problems");
const report={scope:"platform_aggregate",privacy:"aggregate_only",status:"read_only",
 checkedAt:"2026-10-10T15:00:00Z",metrics:{
 failedWebsiteJobs:2,failedSocialPosts:0,failedBusinessApps:null,pendingWebsiteJobs:3},
 reliability:{monitoringIsVerified:false}};
const triage=founderOperationalPriorities(report);
eq(triage.status,"available","Verified founder report accepted");
eq(triage.highPriorityCount,2,"Known website queue and failed jobs require review");
eq(triage.items[0].key,"monitor","Missing monitoring evidence highlighted first");
eq(triage.items[1].key,"website","Website failures outrank unknown counts");
eq(triage.items[2].key,"queue","Queued jobs follow failed jobs");
eq(triage.automaticRepairs,false,"No privileged autopilot repair");
eq(triage.externalAlertsSent,false,"Read-only display is not a delivered alert");
const clear=founderOperationalPriorities({...report,
 metrics:{failedWebsiteJobs:0,failedSocialPosts:0,failedBusinessApps:0,pendingWebsiteJobs:0},
 reliability:{monitoringIsVerified:true}});
eq(clear.headline,"No recorded failures in the measured counters","Zero only for actually measured rows");
eq(clear.highPriorityCount,0,"Measured zero failure count");
eq(founderOperationalPriorities({...report,scope:"customer_workspace"}).status,
 "unavailable","Reject cross-tenant founder input");
const release=websiteReleaseReadiness();
eq(release.status,"blocked","All release gates deny by default");
eq(release.total,11,"Global-ready architectural audit comprises eleven gates");
eq(release.passed,0,"No phantom production verification");
ok(release.checks.some(x=>x.id==="global"),"Global-ready architecture is included");
eq(release.mayDeployAutomatically,false,"No deployment possible from pure audit");
eq(release.canClaimProductionReady,false,"No unsupported production readiness claim");
const all=Object.fromEntries(release.checks.map(x=>[x.id,true]));
eq(websiteReleaseReadiness(all).status,"ready-for-manual-release-review",
 "Complete evidence is only ready for human signoff review");
eq(websiteReleaseReadiness({...all,billing:false}).status,"blocked",
 "Billing evidence cannot be skipped");
eq(websiteReleaseReadiness({...all,global:false}).status,"blocked",
 "Internationalisation architecture cannot be skipped");
eq(websiteReleaseReadiness(all).canClaimProductionReady,false,
 "Even checked boxes are not an independent production audit");
const operations=readFileSync(new URL("../src/screens/founderOperations.js",import.meta.url),"utf8");
ok(operations.includes("founderOperationalPriorities(report)")&&
 operations.includes("websiteReleaseReadiness()"),"Actual founder page shows triage and pre-release gates");
ok(readFileSync(new URL("../.github/workflows/production-check.yml",import.meta.url),"utf8")
 .includes("check-website-operational-quality-v3117.mjs"),"Test included in production regression checks");
console.log("V3.117 PASS: "+n+" explicit outcomes, measured design decisions, founder triage and global release gate tests.");
