import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {recommendMeasuredWebsiteChange,compareWebsiteVisualReports,
 recordWebsiteOwnerDesignFeedback,ownerDesignPreference,withoutPrivateWebsiteDesignFeedback} from "../src/core/websiteMeasuredDesignCoach.mjs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const draft={id:"customer-private-a",generation:12,publicStatus:"Not published",
 pages:[{id:"home",enabled:true,sectionIds:["hero","services"]}],
 theme:{cardLayout:"cards"},sections:[
  {id:"hero",type:"hero",title:"Long heading",enabled:true},
  {id:"services",type:"services",title:"Services",enabled:true}
 ]};
const base=JSON.stringify(draft);
const issues=(ids,metrics={})=>({counts:{viewport:390,width:390,overflow:0,
  unloadedImages:0,missingAlt:0,smallTargets:0,badAnchors:0,
  clippedHeadings:0,...metrics},
 issues:ids.map(id=>({id,label:id}))});
const clipped=issues(["headings"],{clippedHeadings:1});
const hint=recommendMeasuredWebsiteChange({draft,pageId:"home",report:clipped});
assert.equal(hint.operation.action,"section-style");
assert.equal(hint.operation.sectionId,"hero");
assert.equal(hint.operation.field,"headingScale");
assert.equal(hint.operation.value,"compact");
const overflow=issues(["overflow"],{width:465,overflow:1});
const alternative=recommendMeasuredWebsiteChange({draft,pageId:"home",report:overflow});
assert.equal(alternative.operation.field,"cardLayout");
assert.equal(alternative.operation.value,"rows");
for(const inputs of [
 {draft,pageId:"wrong",report:overflow},
 {draft,pageId:"home",report:issues([])},
 {draft:{...draft,sections:[draft.sections[0]]},pageId:"home",report:overflow},
 {draft:{...draft,theme:{cardLayout:"rows"}},pageId:"home",report:overflow}
 ])assert.equal(recommendMeasuredWebsiteChange(inputs),null);
const fixed=issues([],{width:390});
let result=compareWebsiteVisualReports(overflow,fixed);
assert.equal(result.valid,true);
assert.equal(result.improved,true);
assert.equal(result.noNewMeasuredProblems,true);
const identical=compareWebsiteVisualReports(overflow,overflow);
assert.equal(identical.noNewMeasuredProblems,true);
assert.equal(identical.improved,false,"Cannot fabricate an improvement");
const newBad=issues(["overflow","links"],{width:480,overflow:2,badAnchors:1});
result=compareWebsiteVisualReports(overflow,newBad);
assert.equal(result.noNewMeasuredProblems,false);
assert.ok(result.regressions.length>=2);
assert.equal(compareWebsiteVisualReports(overflow,{...fixed,counts:{...fixed.counts,viewport:1440}}).valid,false);
const wrongMetric=issues([],{smallTargets:4});
assert.equal(compareWebsiteVisualReports(fixed,wrongMetric).noNewMeasuredProblems,false);
const liked=recordWebsiteOwnerDesignFeedback(draft,{draftId:draft.id,pageId:"home",
 choice:"liked",changeId:"compact-hero-title",at:"2026-10-11T12:00:00.000Z"});
assert.ok(liked.applied);
assert.equal(ownerDesignPreference(liked.draft,"compact-hero-title"),"liked");
assert.equal(draft.ownerDesignFeedback,undefined,"Original remains immutable");
assert.equal(withoutPrivateWebsiteDesignFeedback(liked.draft).ownerDesignFeedback,undefined,
 "Private preferences never enter public/site preparation payload");
const dislike=recordWebsiteOwnerDesignFeedback(liked.draft,{
 draftId:draft.id,pageId:"home",choice:"disliked",
 changeId:"compact-hero-title",at:"2026-10-11T12:01:00.000Z"});
assert.equal(ownerDesignPreference(dislike.draft,"compact-hero-title"),"disliked");
assert.equal(recommendMeasuredWebsiteChange({draft:dislike.draft,pageId:"home",report:clipped}),null,
 "Busy stops proposing a style explicitly rejected for this website");
for(const faulty of [
 {draftId:"another-tenant",pageId:"home",choice:"liked",changeId:"compact-hero-title"},
 {draftId:draft.id,pageId:"deleted-page",choice:"liked",changeId:"compact-hero-title"},
 {draftId:draft.id,pageId:"home",choice:"trained",changeId:"compact-hero-title"},
 {draftId:draft.id,pageId:"home",choice:"liked",changeId:"<script>"}
 ])assert.equal(recordWebsiteOwnerDesignFeedback(draft,{
  at:"2026-10-11T12:00:00Z",...faulty}).applied,false);
let growing=draft;
for(let i=0;i<40;i++)growing=recordWebsiteOwnerDesignFeedback(growing,{
 draftId:draft.id,pageId:"home",choice:"liked",changeId:"style-"+i,
 at:"2026-10-11T12:00:00Z"}).draft;
assert.equal(growing.ownerDesignFeedback.length,20,"Bounded per-draft feedback memory");
assert.equal(JSON.stringify(draft),base);
const preview=read("src/screens/websiteBuilder.js");
for(const token of ["applyWebsiteLayoutChange(draft,advice.operation)",
 "compareWebsiteVisualReports(visualCheckResult,candidateCheckResult)",
 "makeWebsiteVisualCheckHtml(candidateHtml,candidateKey)",
 "noNewMeasuredProblems","Return to my original design",
 "Keep this design in my private draft","recordMeasuredWebsiteFeedback"])
 assert.ok(preview.includes(token),"Private candidate preview wiring: "+token);
const controller=read("src/app/AppController.js");
assert.ok(controller.includes("recordWebsiteOwnerDesignFeedback(websiteDraftRef.current"));
assert.ok(controller.includes("setWebsiteDraft(current=>"));
assert.ok(controller.includes("websiteDraft:withoutPrivateWebsiteDesignFeedback(websiteDraft)"),
 "Public website/domain gateway cannot include owner-only feedback");
assert.ok(!controller.includes("trainWebsiteModelFromFeedback"),"No unapproved self-training");
const domain=read("src/domain/websiteBuilder.js");
assert.ok(domain.includes("ownerDesignFeedback:safeArray(previousDraft?.ownerDesignFeedback)"));
assert.ok(domain.includes('scope==="this-website-draft-only"'));
assert.ok(preview.includes("javaScriptEnabled={tapEditMode||visualCheckOn||candidateCheckOn}"));
assert.ok(!preview.includes("publishWebsiteAutomatically"),"Owner still approves all publishing");
console.log("V3.144 COACH PASS: measured suggestions, unchanged/worse rejection, preview-only candidate, explicit draft feedback, no global training or publishing.");
