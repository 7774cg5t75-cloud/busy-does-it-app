import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {hasMeasuredAudits,visualRisks,compareWebsiteAudits} from "../supabase/functions/busy-website-worker/websiteReviewCycle.mjs";
const q=(change={})=>({
 version:1,assessedTextCount:5,unassessedContrastCount:0,
 lowContrastCount:0,smallBodyTextCount:0,smallTouchTargetCount:0,
 unnamedControlsCount:0,missingInputLabelCount:0,missingImageAltCount:0,
 headingLevelSkips:0,hasDocumentLanguage:true,hasMainLandmark:true,...change
});
const a=(qmobile=q(),qdesktop=q())=>({
 mobileAudit:{horizontalOverflowPixels:0,headingVisible:true,navigationFits:true,heroHeadingFontPx:40,qualityAudit:qmobile},
 desktopAudit:{horizontalOverflowPixels:0,headingVisible:true,navigationFits:true,heroHeadingFontPx:42,qualityAudit:qdesktop}
});
let n=0;
const same=(a,b,msg)=>{assert.deepEqual(a,b,msg);n++};
const yes=(v,msg)=>{assert.ok(v,msg);n++};
const good=a();
yes(hasMeasuredAudits(good),"Good browser evidence can be compared");
const low=a(q({lowContrastCount:2,smallTouchTargetCount:1,missingInputLabelCount:1,
 missingImageAltCount:1,hasDocumentLanguage:false}));
const issues=visualRisks(low);
for(const s of ["mobile low text contrast","mobile small touch targets",
 "mobile unlabelled form fields","mobile images without alternative text",
 "mobile document language missing"])yes(issues.includes(s),"Detect "+s);
same(compareWebsiteAudits(good,low).noNewMeasuredProblems,false,"Detect new accessibility regressions");
const lowWorse=a(q({lowContrastCount:3,smallTouchTargetCount:1,missingInputLabelCount:1,
 missingImageAltCount:1,hasDocumentLanguage:false}));
const compared=compareWebsiteAudits(low,lowWorse);
yes(compared.worsenedMetrics.includes("mobile low text contrast increased"),
 "Detect worsening even with the same number of issue categories");
same(compared.noNewMeasuredProblems,false,"Do not falsely accept same-category count regression");
const repaired=compareWebsiteAudits(low,good);
same(repaired.improved,true,"Measured fixes can be accepted");
same(repaired.candidateProblemCount,0,"All previously measured warnings resolved");
yes(!hasMeasuredAudits(a(q({lowContrastCount:-1}))),"Reject negative browser counters");
yes(!hasMeasuredAudits(a(q({smallBodyTextCount:1.5}))),"Reject fractional browser counters");
yes(!hasMeasuredAudits(a(q({hasMainLandmark:"yes"}))),"Reject untyped browser flags");
yes(!hasMeasuredAudits(a(q(),{...q(),version:99})),"Reject mismatched quality versions");
same(compareWebsiteAudits(good,a(q(),{...q(),version:99})).valid,false,
 "Do not compare invented measurements");
const legacy={mobileAudit:{horizontalOverflowPixels:0,headingVisible:true,
 navigationFits:true,heroHeadingFontPx:38},desktopAudit:{horizontalOverflowPixels:0,
 headingVisible:true,navigationFits:true,heroHeadingFontPx:38}};
yes(hasMeasuredAudits(legacy),"Older verified layout contracts remain supported");
same(compareWebsiteAudits(legacy,good).valid,false,
 "Cannot silently compare different audit generations");
const source=readFileSync(new URL("./lib/websiteQualityAudit-v3107.mjs",import.meta.url),"utf8");
for(const marker of ["getComputedStyle","getBoundingClientRect","backgroundImage",
 "lowContrastCount","smallTouchTargetCount","missingInputLabelCount",
 "missingImageAltCount","headingLevelSkips","hasDocumentLanguage"])
 yes(source.includes(marker),"Browser measurement source includes "+marker);
console.log("V3.107 PASS: "+n+" verified accessibility evidence, metric regressions and no fabricated WCAG claims.");
