import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {buildOwnerDesignPatterns,prepareOwnerAwareDesignExperiments,
 explainOwnerDesignOutcome} from "../src/core/appDesignPatterns.mjs";
import {proposeCoordinatedAppChanges} from "../src/core/appCoordinatedStudio.mjs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const config={modules:["business_profile","services","gallery","contact"].map(
 key=>({key,enabled:true})),
 navigation:["business_profile","services","gallery","contact"],
 presentation:{headerStyle:"refined",layoutDensity:"compact",
  navigationStyle:"tabs",galleryLayout:"grid",imageCorners:"rounded"},
 publicProfile:{businessName:"Test studio",services:[{name:"Workshop"}]},
 secretCustomerRecords:[{email:"secret@example.invalid"}],payments:{enabled:false}};
const frozen=JSON.stringify(config);
const record=(field,value,verdict,revision,context="preview")=>({
 field,value,verdict,draftRevision:revision,context,source:"measured"});
const history=[
 record("galleryLayout","stack","worse",11),
 record("galleryLayout","stack","worse",10),
 record("navigationStyle","list","better",9,"saved_revision"),
 record("layoutDensity","comfortable","better",8),
 record("layoutDensity","comfortable","worse",7)
];
const patterns=buildOwnerDesignPatterns(history);
assert.equal(patterns.ok,true);
assert.equal(patterns.distinctChoiceCount,3);
assert.equal(patterns.repeatedDislikeCount,1);
assert.equal(patterns.mixedPreferenceCount,1);
assert.equal(patterns.noCrossBusinessLearning,true);
assert.equal(patterns.screenshotsIncluded,false);
const rejected=patterns.choices.find(c=>c.field==="galleryLayout");
assert.equal(rejected.repeatedlyDisliked,true);
assert.equal(rejected.negativeRevisionCount,2);
assert.equal(rejected.independentlyProven,false);
assert.equal(patterns.choices.find(c=>c.field==="layoutDensity").conflicted,true);
const repeatTap=buildOwnerDesignPatterns([
 record("galleryLayout","stack","worse",11),
 record("galleryLayout","stack","worse",11)
]);
assert.equal(repeatTap.repeatedDislikeCount,0,
 "Two repeated taps at one revision are not independent dislikes.");
assert.equal(repeatTap.choices[0].feedbackCount,1);
const renewed=buildOwnerDesignPatterns([
 record("galleryLayout","stack","better",13),
 ...history
]);
assert.equal(renewed.choices.find(c=>c.field==="galleryLayout").rejectedCurrently,false);
assert.equal(renewed.choices.find(c=>c.field==="galleryLayout").conflicted,true);
assert.equal(buildOwnerDesignPatterns(Array(81).fill(history[0])).ok,false);
const malformed=buildOwnerDesignPatterns([
 {...record("galleryLayout","stack","better",9),field:"privateCustomer"},
 {...record("galleryLayout","stack","better",8),value:"<script>"},
 {...record("galleryLayout","stack","better",7),draftRevision:0}
]);
assert.equal(malformed.ok,true);
assert.equal(malformed.distinctChoiceCount,0);
const proposals=prepareOwnerAwareDesignExperiments(config,{history,
 measured:[{field:"galleryLayout",value:"stack"},
  {field:"navigationStyle",value:"list"}],
 ai:[{field:"navigationStyle",value:"list"},
  {field:"headerStyle",value:"bold"}],
 responsive:[{field:"layoutDensity",value:"airy"},
  {field:"galleryLayout",value:"stack"}]});
assert.equal(proposals.ok,true,proposals.reason);
assert.ok(proposals.preview?.ok,proposals.preview?.reason);
assert.equal(proposals.suppressed.length,1);
assert.equal(proposals.suppressed[0].field,"galleryLayout");
assert.equal(proposals.suppressed[0].repeated,true);
assert.equal(proposals.proposed.length,3);
assert.deepEqual(proposals.proposed.map(x=>x.field),
 ["navigationStyle","headerStyle","layoutDensity"]);
assert.equal(proposals.proposed[0].score,61,
 "Independent measured and AI support plus positive saved owner feedback");
assert.equal(proposals.preview.ownerApprovalRequired,true);
assert.equal(proposals.noAutomaticApproval,true);
assert.equal(proposals.noAutoPublish,true);
assert.equal(proposals.noAIExpense,true);
assert.equal(proposals.scoresAreHeuristics,true);
assert.equal(JSON.stringify(config),frozen);
assert.deepEqual(proposals.preview.nextConfig.secretCustomerRecords,
 config.secretCustomerRecords);
assert.deepEqual(proposals.preview.nextConfig.payments,config.payments);
const undo=proposeCoordinatedAppChanges(proposals.preview.nextConfig,
 proposals.preview.undoOperations);
assert.equal(undo.ok,true,undo.reason);
assert.equal(undo.nextConfig.presentation.navigationStyle,"tabs");
const changedMind=prepareOwnerAwareDesignExperiments(config,{
 history:[record("galleryLayout","stack","better",13),
          record("galleryLayout","stack","worse",11)],
 measured:[{field:"galleryLayout",value:"stack"}]
});
assert.equal(changedMind.suppressed.length,0);
assert.equal(changedMind.proposed[0].value,"stack");
const fallbackConfig={...config,presentation:{...config.presentation,headerStyle:"quiet"}};
const fallback=prepareOwnerAwareDesignExperiments(fallbackConfig,{
 history:[record("headerStyle","bold","worse",5),
          record("headerStyle","bold","worse",4)],
 ai:[{field:"headerStyle",value:"bold"}]
});
assert.equal(fallback.ok,true);
assert.equal(fallback.suppressed.length,1);
assert.equal(fallback.proposed.length,1);
assert.equal(fallback.proposed[0].value,"refined");
assert.equal(fallback.proposed[0].fallback,true);
assert.equal(fallback.proposed[0].confidence,"untested_alternative");
const noFallback=prepareOwnerAwareDesignExperiments(config,{
 history,measured:[{field:"galleryLayout",value:"stack"}]
});
assert.equal(noFallback.ok,true);
assert.equal(noFallback.preview,null);
assert.equal(noFallback.keptOriginal,true);
const protectActive=prepareOwnerAwareDesignExperiments(config,{
 history:[record("layoutDensity","compact","better",16)],
 responsive:[{field:"layoutDensity",value:"comfortable"}]
});
assert.equal(protectActive.preview,null);
assert.equal(protectActive.suppressed.length,1);
const justifiedCheck=prepareOwnerAwareDesignExperiments(config,{
 history:[record("layoutDensity","compact","better",16)],
 measured:[{field:"layoutDensity",value:"comfortable"}]
});
assert.equal(justifiedCheck.proposed[0].field,"layoutDensity");
assert.equal(justifiedCheck.proposed[0].confidence,"heuristic_not_verified");
const rejectedAI=prepareOwnerAwareDesignExperiments(config,{
 ai:[{field:"publish",value:"true"},
 {field:"headerStyle",value:"arbitrary"}]
});
assert.equal(rejectedAI.preview,null);
assert.equal(prepareOwnerAwareDesignExperiments(config,{
 measured:Array(13).fill({field:"galleryLayout",value:"stack"})
}).ok,false);
const verdict=explainOwnerDesignOutcome({
 verdict:"worse",beforeWarnings:5,afterWarnings:3,actuallySaved:true});
assert.equal(verdict.ok,true);
assert.equal(verdict.assessment,"owner_disagrees_with_measurements");
assert.equal(verdict.autoImprovementProven,false);
assert.equal(verdict.ownerOpinionNotCommercialOutcome,true);
assert.equal(verdict.accessibilityCertified,false);
assert.equal(explainOwnerDesignOutcome({
 verdict:"better",beforeWarnings:4,afterWarnings:2}).assessment,
 "promising_not_proven");
assert.equal(explainOwnerDesignOutcome({
 verdict:"better",beforeWarnings:2,afterWarnings:4}).assessment,
 "new_warnings_to_review");
assert.equal(explainOwnerDesignOutcome({verdict:"other"}).ok,false);
assert.equal(explainOwnerDesignOutcome({beforeWarnings:99}).ok,false);
assert.equal(read("src/core/appDesignPatterns.mjs"),
 read("supabase/functions/busy-mini-apps/appDesignPatterns.mjs"),
 "Pure pattern contract must remain byte-identical to the future Edge mirror");
const ui=read("src/screens/miniApps.js");
for(const key of ["buildOwnerDesignPatterns(","prepareOwnerAwareDesignExperiments(config,",
 "explainOwnerDesignOutcome({","nextDesignExperiment?.preview?.ok?",
 "Why is Busy recommending these designs?","Repeated dislikes across revisions",
 "Mixed or changing preferences","Preview Busy’s ",
 "BUSY's assessment:","setVisualProposal(next)","Keep my original design",
 "saveCoordinatedAppChanges?.({","recordDesignChoice(\"worse\",\"preview\")",
 "recordDesignChoice(\"better\",\"saved_revision\")"])
 assert.ok(ui.includes(key),"App Builder lacks owner pattern integration: "+key);
const server=read("supabase/functions/busy-mini-apps/appDesignLearningService.mjs");
assert.ok(server.includes(".eq(\"business_id\",businessId).eq(\"app_id\",app.id)"));
assert.ok(server.includes(".limit(80)"));
assert.ok(server.includes("validated.context===\"saved_revision\""));
const workflow=read(".github/workflows/app-design-patterns-v3167.yml");
assert.ok(workflow.includes("node scripts/check-app-design-learning-v3166.mjs"));
assert.ok(workflow.includes("node scripts/check-responsive-app-v3163.mjs"));
assert.ok(workflow.includes("prepare-standalone-prototype-v3154.mjs"));
assert.ok(workflow.includes("expo export --platform ios"));
console.log("V3.167 PASS: repeated preferences across revisions, latest verdict override, conflicting history, protected active choice, safe alternative, owner-vs-measured outcome, tenant-safe reuse and private Undo.");
