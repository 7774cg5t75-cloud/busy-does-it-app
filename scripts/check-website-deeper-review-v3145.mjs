import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {recommendMeasuredWebsiteChange,compareWebsiteVisualReports,
 describeWebsiteDesignComparison,recordWebsiteOwnerDesignFeedback,
 ownerDesignPreference} from "../src/core/websiteMeasuredDesignCoach.mjs";
import {reviewWebsiteVisualCheck,CHANNEL} from "../src/core/websiteVisualCheck.mjs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const draft={id:"draft-tenant-a",generation:7,pages:[
 {id:"home",enabled:true,sectionIds:["hero","services"]},
 {id:"services",enabled:true,sectionIds:["services"]}],
 sections:[{id:"hero",enabled:true,appearance:{},type:"hero"},
  {id:"services",enabled:true,type:"services"}],theme:{cardLayout:"cards"}};
const metrics=(overrides={})=>({
 viewport:390,width:390,overflow:0,images:0,missingAlt:0,unloadedImages:0,
 smallTargets:0,badAnchors:0,clippedHeadings:0,headings:2,sections:2,
 lowContrast:0,smallBodyText:0,contrastUnknown:0,contrastChecked:4,...overrides});
const report=(counts,ids=[])=>({counts,issues:ids.map(id=>({id,label:id}))});
const pass=report(metrics(),[]);
const low=report(metrics({lowContrast:2,smallBodyText:2}),["contrast","readability"]);
const warnings=reviewWebsiteVisualCheck({...metrics({lowContrast:2,smallBodyText:2,contrastUnknown:1}),
 channel:CHANNEL,key:"7:home:phone"},"7:home:phone");
assert.ok(warnings.issues.some(x=>x.id==="contrast"));
assert.ok(warnings.issues.some(x=>x.id==="readability"));
assert.ok(warnings.issues.some(x=>x.id==="contrast-unchecked"));
assert.equal(reviewWebsiteVisualCheck({...metrics(),lowContrast:"3",channel:CHANNEL,key:"7:home:phone"},"7:home:phone"),null);
let res=compareWebsiteVisualReports(pass,low);
assert.ok(res.valid&&!res.noNewMeasuredProblems&&res.regressions.some(x=>x.includes("contrast")));
assert.ok(res.regressions.some(x=>x.includes("readability")));
const contrastHidden=report(metrics({contrastUnknown:2,contrastChecked:2}),["contrast-unchecked"]);
assert.ok(!compareWebsiteVisualReports(pass,contrastHidden).noNewMeasuredProblems,
 "Loss of measured contrast coverage cannot masquerade as design improvement");
const noCoverage={...pass,counts:{...pass.counts}};
delete noCoverage.counts.contrastChecked;
assert.equal(compareWebsiteVisualReports(pass,noCoverage).valid,false);
const fixed=compareWebsiteVisualReports(low,pass);
assert.equal(fixed.valid,true);
assert.equal(fixed.improved,true);
assert.equal(fixed.evidence,"same-width-rendered-dom");
assert.deepEqual(fixed.resolvedWarnings,["contrast","readability"]);
const words=describeWebsiteDesignComparison(fixed);
assert.ok(words.headline.includes("fixed"));
assert.deepEqual(words.facts,["Original: 2 layout warnings","Alternative: 0 layout warnings"]);
assert.equal(words.mayKeep,true);
assert.equal(words.evidence,"rendered layout, not AI screenshot scoring");
const poor=describeWebsiteDesignComparison(res);
assert.equal(poor.mayKeep,false);
assert.ok(poor.description.includes("cannot be kept"));
assert.equal(describeWebsiteDesignComparison({valid:false}).mayKeep,false);
const liked=recordWebsiteOwnerDesignFeedback(draft,{draftId:draft.id,pageId:"home",
 choice:"liked",changeId:"simpler-service-layout",at:"2026-10-11T13:00:00Z"});
assert.ok(liked.applied);
assert.equal(ownerDesignPreference(liked.draft,"simpler-service-layout","home"),"liked");
assert.equal(ownerDesignPreference(liked.draft,"simpler-service-layout","services"),null,
 "Owner preferences are scoped to their chosen page");
const mixed=report(metrics({overflow:1,width:420,clippedHeadings:1}),["overflow","headings"]);
const advice=recommendMeasuredWebsiteChange({draft:liked.draft,pageId:"home",report:mixed});
assert.equal(advice.id,"simpler-service-layout","Liked change is prioritised only when measured risk exists");
assert.equal(recommendMeasuredWebsiteChange({draft:liked.draft,pageId:"home",
 report:report(metrics(),[])}),null,"Preference alone is never evidence to suggest a change");
const rejected=recordWebsiteOwnerDesignFeedback(liked.draft,{draftId:draft.id,
 pageId:"home",choice:"disliked",changeId:"simpler-service-layout",at:"2026-10-11T13:02:00Z"});
assert.equal(recommendMeasuredWebsiteChange({draft:rejected.draft,pageId:"home",report:mixed}).id,
 "compact-hero-title","Rejected suggestions cannot override eligible alternatives");
const controller=read("src/app/AppController.js");
assert.ok(controller.includes("const applyWebsiteLayoutAction = (operation,options={})"));
assert.ok(controller.includes("Number(options.baseGeneration)!==Number(websiteDraft.generation)"));
assert.ok(controller.includes("let next=result.draft"));
assert.ok(controller.includes("next=recorded.draft"));
assert.ok(controller.includes("setWebsiteDraft(next)"),
 "Layout change and feedback must be committed together");
const ui=read("src/screens/websiteBuilder.js");
assert.ok(ui.includes("describeWebsiteDesignComparison(candidateComparison)"));
assert.ok(ui.includes('label={showOriginalComparison?"See proposed alternative":"See my original design"}'));
assert.ok(ui.includes("ownerFeedback:{draftId:draft.id"));
assert.ok(!ui.includes("publishWebsiteAutomatically"));
console.log("V3.145 COORDINATED PASS: concrete contrast/readability, no coverage loss, clear before/after comparisons, page-specific preferences, atomic owner Keep.");
