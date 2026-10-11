import assert from "node:assert/strict";
import {recordWebsiteViewportEvidence,reviewWebsiteViewportPortfolio} from "../src/core/websiteViewportEvidence.mjs";
const args={draftId:"tenant-1",generation:7,pageId:"home"};
const report=(viewport,issues=[])=>({counts:{viewport},passed:issues.length===0,
 issues:issues.map(id=>({id}))});
let state=recordWebsiteViewportEvidence(null,{...args,report:report(390,["overflow"])});
let summary=reviewWebsiteViewportPortfolio(state,args);
assert.deepEqual(summary.checked,["phone"]);
assert.deepEqual(summary.missing,["tablet","wide"]);
assert.deepEqual(summary.flagged,["phone"]);
assert.ok(summary.measuredOnly&&summary.notAiAestheticReview&&summary.notReleaseApproval);
state=recordWebsiteViewportEvidence(state,{...args,report:report(768)});
state=recordWebsiteViewportEvidence(state,{...args,report:report(1280,["contrast"])});
summary=reviewWebsiteViewportPortfolio(state,args);
assert.deepEqual(summary.missing,[]);
assert.deepEqual(summary.flagged,["phone","wide"]);
assert.ok(summary.message.includes("overflow")&&summary.message.includes("contrast"));
for(const other of [{...args,draftId:"other"},{...args,pageId:"about"},{...args,generation:8}])
 assert.deepEqual(reviewWebsiteViewportPortfolio(state,other).checked,[]);
console.log("V3.149 SCREEN REVIEW PASS: verified width-specific findings, no owner/page/revision leaks or fake screenshot AI scoring.");
