import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {websiteJourneyAssurance} from "../src/core/websiteJourneyAssurance.mjs";
import {websiteBrainCoaching} from "../src/core/websiteBrainCoaching.mjs";
import {founderNextSafeAction} from "../src/core/founderNextSafeAction.mjs";
import {founderOperationalPriorities} from "../src/core/founderOperationalPriorities.mjs";
import {websiteReleaseReadiness} from "../src/core/websiteReleaseReadiness.mjs";
import {websitePilotReadiness} from "../src/core/websitePilotReadiness.mjs";
import {websiteDesignAlternative} from "../src/core/websiteDesignAlternatives.mjs";
import {designPreferenceSummary} from "../supabase/functions/busy-website-publish/designFeedback.mjs";
import {websiteDesignDecision} from "../supabase/functions/busy-website-worker/websiteDesignDecision.mjs";
import {buildWebsiteLaunchJourney} from "../src/core/websiteLaunchJourney.js";
import {websiteOutcomeEvidence} from "../supabase/functions/busy-website-worker/websiteOutcomeEvidence.mjs";
let count=0;
const eq=(a,b,msg)=>{assert.deepEqual(a,b,msg);count++;};
const yes=(a,msg)=>{assert.ok(a,msg);count++;};
const p={previewDeployment:{id:"preview-a"},canPublish:true,draftChangedSinceHosted:false};
const brand={websiteReady:true,completeness:{coreMissing:[]}};
const draft={id:"draft-1",businessType:"Gardening",theme:{designFamily:"organic"},
 generation:7,sections:[{id:"hero"}]};
const assure=(j,pub,proof,hasDraft)=>websiteJourneyAssurance({
 journey:j,publishing:pub,proof,hasDraft
});
const journey=(b=brand,d=draft,pub=p,proof={verified:false})=>
 buildWebsiteLaunchJourney({brand:b,draft:d,publishing:pub,deliveryProof:proof});
const missing=journey({websiteReady:false,completeness:{coreMissing:["phone","name"]}},
 null,{},null);
let a=assure(missing,{},null,false);
eq(a.action,"brand","Missing business facts sent to simple brief");
eq(a.publicWebsiteVerified,false,"Missing website cannot be publicly verified");
const toBuild=journey(brand,null,{},null);
eq(assure(toBuild,{},null,false).action,"build","Next move is build a private draft");
let pre=journey(brand,draft,{},null);
eq(assure(pre,{},null,true).action,"prepare","Fresh hosted preview needed");
let working={activeJob:{status:"processing"}};
eq(assure(journey(brand,draft,working,null),working,null,true).action,"wait",
 "A running job suppresses duplicate publishing actions");
const review=journey(brand,draft,p,{verified:false});
a=assure(review,p,{verified:false},true);
eq(a.action,"review","Hosted version requires explicit approval");
eq(a.hostedPreviewReady,true,"Hosted revision is current");
eq(a.automaticPublication,false,"Never publish automatically");
eq(a.explicitOwnerGoLiveRequired,true,"Go Live always owner initiated");
let changed={...p,draftChangedSinceHosted:true};
eq(assure(journey(brand,draft,changed,null),changed,null,true).action,"prepare",
 "Draft changes invalidate previous hosted preview");
const live={...p,liveDeployment:{id:"live-a"}};
eq(assure(journey(brand,draft,live,{verified:false}),live,{verified:false},true).action,
 "verify","Published record still needs real HTTPS delivery");
const newVersion={...p,previewDeployment:{id:"preview-b",content_hash:"new-hash"},
 liveDeployment:{id:"live-a",content_hash:"old-hash"}};
eq(assure(journey(brand,draft,newVersion,{verified:true}),newVersion,
 {verified:true},true).action,"review",
 "New content hash requires explicit review while old website stays public");
const proved=journey(brand,draft,live,{verified:true});
eq(assure(proved,live,{verified:true},true).action,"maintain",
 "Matching real live delivery proof permits verified label");
eq(assure(proved,live,{verified:false},true).publicWebsiteVerified,false,
 "Disagreeing proof sources fail closed");
eq(assure(proved,live,{verified:true},true).automaticDomainPurchase,false,
 "Publishing readiness never registers domains");
yes(assure(proved,live,{verified:true},true).progress.total>0,
 "Progress driven by actual six-stage website journey");
const feedback=designPreferenceSummary([
 {design_family:"editorial",preference:"kept",draft_version:"7"},
 {design_family:"minimal",preference:"rejected",draft_version:"6"}
]);
const recommended=websiteDesignAlternative(draft,{
 likedFamilies:feedback.likedFamilies,rejectedFamilies:feedback.rejectedFamilies
});
const coaching=websiteBrainCoaching({summary:feedback,alternative:recommended,
 quality:{priority:[{title:"Check your business details",detail:"Confirm your contact number"}]}});
eq(recommended.suggested.family,"editorial","Business Brain reuses actual owner preference");
eq(coaching.scope,"current-business","Feedback never used outside current business");
yes(coaching.explanation.includes("previously"),"Plain language explains the recommendation");
eq(coaching.next.title,"Check your business details","Real facts outrank visual polish");
eq(coaching.aiModelRetrained,false,"No fake AI retraining");
const anotherSuggestion=websiteBrainCoaching({summary:feedback,
 alternative:{suggested:{family:"minimal"}}});
yes(!anotherSuggestion.explanation.includes("previously"),
 "Feedback rationale follows selected style, not first style in carousel");
eq(coaching.measuredSalesChange,null,"No invented sales lift");
eq(coaching.sharedLearningEnabled,false,"Global memory remains disabled");
const publicCoach=websiteBrainCoaching({summary:{...feedback,scope:"another-business"},
 alternative:recommended});
eq(publicCoach.scope,"general-business-context","Cross-tenant summaries ignored");
yes(!publicCoach.explanation.includes("previously"),"No leaked personalized explanation");
const noSite=websiteBrainCoaching();
yes(noSite.explanation.includes("Create a website"),"No fictitious draft advice");
const q={version:1,assessedTextCount:12,unassessedContrastCount:0,
 lowContrastCount:0,smallBodyTextCount:0,smallTouchTargetCount:0,
 unnamedControlsCount:0,missingInputLabelCount:0,missingImageAltCount:0,
 headingLevelSkips:0,hasDocumentLanguage:true,hasMainLandmark:true};
const vp=quality=>({horizontalOverflowPixels:0,headingVisible:true,
 navigationFits:true,heroHeadingFontPx:35,qualityAudit:quality});
const audit=quality=>({mobileAudit:vp(quality),desktopAudit:vp(quality)});
const before=audit({...q,smallTouchTargetCount:3}),after=audit(q);
const improved=websiteDesignDecision({before,after});
eq(improved.status,"measured-improvement","Real quality reduction classified");
eq(improved.publishAllowed,false,"Improved design still cannot auto-publish");
const current="91edb6db-3a02-4de4-9ba8-5c93b4e790a1";
const outcome=websiteOutcomeEvidence({before,after,businessId:current,
 authorizedBusinessId:current,family:"editorial",revision:"7",feedback});
eq(outcome.status,"owner-choice-and-browser-review",
 "Measured quality and matching owner preference can be combined safely");
eq(outcome.verifiedConversionLift,null,"Even combined evidence isn't revenue telemetry");
eq(outcome.crossBusinessLearning,false,"No cross-business learning");
const missingReport=founderNextSafeAction(null);
eq(missingReport.status,"unavailable","No trusted founder report");
eq(missingReport.automaticRepair,false,"No automatic repairs");
const report={scope:"platform_aggregate",privacy:"aggregate_only",status:"read_only",
 checkedAt:"2026-10-10T10:00:00Z",
 metrics:{failedWebsiteJobs:3,failedSocialPosts:1,failedBusinessApps:0,pendingWebsiteJobs:0},
 reliability:{monitoringIsVerified:true}};
const priorities=founderOperationalPriorities(report,{nowISO:"2026-10-10T10:01:00Z"});
eq(founderNextSafeAction(priorities).key,"website",
 "First action goes to largest verified problem category");
eq(founderNextSafeAction(priorities).status,"review-failure",
 "Founder's next task is manual review, not automatically fixed");
eq(founderNextSafeAction(priorities).notificationSent,false,"No false external alerts");
eq(founderNextSafeAction(founderOperationalPriorities(report,
 {nowISO:"2026-10-12T10:01:00Z"})).key,"snapshot",
 "Stale founder snapshot requires refresh before evaluating old failures");
const allClear={...report,metrics:{failedWebsiteJobs:0,failedSocialPosts:0,
 failedBusinessApps:0,pendingWebsiteJobs:0}};
eq(founderNextSafeAction(founderOperationalPriorities(allClear,
 {nowISO:"2026-10-10T10:01:00Z"})).status,"measured-no-issues",
 "Only complete recent counters can say measured no issues");
eq(founderNextSafeAction(founderOperationalPriorities(allClear,
 {nowISO:"2026-10-12T10:01:00Z"})).key,"snapshot",
 "Stale zero-failure report causes verification reminder");
eq(websitePilotReadiness().status,"blocked","Staging pilot never starts by default");
eq(websiteReleaseReadiness().status,"blocked","Release readiness never inferred from unit tests");
const ui=readFileSync(new URL("../src/screens/websiteBuilder.js",import.meta.url),"utf8");
yes(ui.includes("websiteJourneyAssurance({"),"Real customer screen uses verified journey");
yes(ui.includes("websiteBrainCoaching({"),"Real customer screen explains personalized design");
yes(ui.includes("alternative:{suggested:selectedStyle}"),
 "Rationale follows the currently viewed customer-selected design");
yes(ui.includes("assurance.progress.completed"),"Customer sees actual launch progress");
const founder=readFileSync(new URL("../src/screens/founderOperations.js",import.meta.url),"utf8");
yes(founder.includes("founderNextSafeAction(operational)"),"Real founder view includes next action");
yes(founder.includes("Next safe check:"),"Next founder step is visible");
const prod=readFileSync(new URL("../.github/workflows/production-check.yml",import.meta.url),"utf8");
yes(prod.includes("check-website-connected-experience-v3119.mjs"),
 "New checks included in standard production regression workflow");
console.log("V3.119 PASS: "+count+" integrated website, Business Brain, design-review and founder checks.");
