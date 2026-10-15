import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {recordPrivateWebsiteCandidateWidthV3239 as add,
 reviewPrivateWebsiteCandidateWidthsV3239 as review}
 from "../src/core/privateWebsiteCandidateWidthV3239.mjs";
const B="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const OTHER="bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const website={id:"current-private",businessId:B,generation:4,
 businessType:"Gardening",pages:[{id:"home",enabled:true}],
 sections:[{id:"hero",enabled:true},{id:"services",enabled:true,
 items:[{title:"Factual service"}]}]};
const source={businessId:B,website,pageId:"home",candidateId:"simpler-service-layout",
 baseGeneration:4};
const width={phone:390,tablet:768,desktop:1280};
let count=0;
const eq=(a,b)=>{assert.deepEqual(a,b);count++};
const ok=(a)=>{assert.ok(a);count++};
const report=(mode,bad=false)=>({
 counts:{viewport:width[mode],width:width[mode]+(bad?20:0),
  overflow:bad?1:0,images:0,missingAlt:0,
  unloadedImages:0,smallTargets:0,badAnchors:0,
  clippedHeadings:0,headings:1,sections:3,
  lowContrast:0,contrastUnknown:0,contrastChecked:4,smallBodyText:0},
 issues:bad?[{id:"overflow",label:"Not exported to owner"}]:[]
});
let notebook=null;
for(const mode of Object.keys(width)){
 const first=add(notebook,{...source,mode,variant:"original",report:report(mode,true)});
 ok(first.ok);notebook=first.state;
 const next=add(notebook,{...source,mode,variant:"candidate",report:report(mode,false)});
 ok(next.ok);notebook=next.state;
 eq(next.mayApply,false);eq(next.mayPublish,false);
 eq(next.recordedWidth,width[mode]);
}
const full=review(notebook,source);
ok(full.ok);eq(full.complete,true);eq(full.checked.length,3);
eq(full.incomplete.length,0);eq(full.hasRegressions,false);
eq(full.eligibleForOwnerReview,true);
eq(full.allWidthReview.eligibleForOwnerReview,true);
eq(full.noScreenshotsCaptured,true);eq(full.mayApply,false);
eq(full.customerJourneyVerified,false);
ok(!JSON.stringify(notebook).includes("Not exported to owner"));
ok(!JSON.stringify(notebook).includes("Factual service"));
const partial=review(
 {...notebook,records:{phone:notebook.records.phone,tablet:notebook.records.tablet}},
 source);
ok(partial.ok);eq(partial.complete,false);eq(partial.incomplete,["desktop"]);
eq(partial.eligibleForOwnerReview,false);
const regressed=add(notebook,{...source,mode:"tablet",variant:"candidate",
 report:report("tablet",true)});
ok(regressed.ok);
const checked=review(regressed.state,source);
ok(checked.ok);eq(checked.complete,true);
// An unchanged tablet is neutral; improvements elsewhere can still justify
// owner inspection, provided no measured regressions are introduced.
eq(checked.hasRegressions,false);
eq(checked.eligibleForOwnerReview,true);
// A worsening on any size must prevent a claim of overall improvement.
const badBaseline=add(regressed.state,{...source,mode:"tablet",
 variant:"original",report:report("tablet",false)});
const worse=review(badBaseline.state,source);
ok(worse.ok);eq(worse.hasRegressions,true);
eq(worse.eligibleForOwnerReview,false);
for(const changed of [
 {...source,businessId:OTHER},
 {...source,website:{...website,generation:5}},
 {...source,website:{...website,businessId:OTHER}},
 {...source,pageId:"unknown"},
 {...source,candidateId:"different"},
 {...source,baseGeneration:5},
 {...source,candidateId:"<script>"},
]){
 const rejected=review(notebook,changed);
 eq(rejected.ok,false);eq(rejected.mayApply,false);
}
for(const changes of [
 {mode:"full"},
 {mode:"unsupported"},
 {variant:"published"},
 {report:report("tablet")},
 {report:{...report("phone"),counts:{...report("phone").counts,viewport:800}}},
 {report:{...report("phone"),issues:[{id:"invented"}]}},
 {report:{...report("phone"),counts:{...report("phone").counts,lowContrast:-1}}},
 {candidateId:"owner-other"},
 {businessId:OTHER},
 {website:{...website,generation:5}},
]){
 const candidate={...source,mode:"phone",variant:"candidate",report:report("phone"),...changes};
 const rejected=add(notebook,candidate);
 eq(rejected.ok,false);eq(rejected.mayApply,false);
}
const sourceFile=readFileSync(new URL("../src/screens/websiteBuilder.js",import.meta.url),"utf8");
for(const excerpt of [
 "recordPrivateWebsiteCandidateWidthV3239",
 "reviewPrivateWebsiteCandidateWidthsV3239",
 "setPrivateWidthEvidence",
 "Check original at this width",
 "Check alternative at this width",
 "Measured across screen sizes",
 "setPreviewSize(\"tablet\")",
 "setPreviewSize(\"desktop\")",
 "applyWebsiteLayoutChange(draft,advice.operation)",
 "Keep this design in my private draft",
 "Return to my original design"
])ok(sourceFile.includes(excerpt));
const productionGuard=readFileSync(new URL("../src/core/privateWebsiteCandidateWidthV3239.mjs",import.meta.url),"utf8");
ok(!productionGuard.includes("fetch("));
ok(!productionGuard.includes("AsyncStorage"));
ok(!productionGuard.includes("publishWebsite("));
const appReview=readFileSync(new URL("../src/screens/universalBuilderPlanReview.js",import.meta.url),"utf8");
ok(appReview.includes("Check on real devices before calling this a visual improvement"));
console.log("V3.239: "+count+" private WebView responsive, tenant, revision, full/partial device, regression and no-write assertions passed.");
