/**
 * Consume REAL Chromium before/after quality captures from the existing
 * trusted fictional website test, then classify them without claiming
 * aesthetic superiority, customer sales or permission to publish.
 */
import assert from "node:assert/strict";
import {readFile,mkdir,writeFile} from "node:fs/promises";
import {resolve,join} from "node:path";
import {websiteDesignDecision} from "../supabase/functions/busy-website-worker/websiteDesignDecision.mjs";
const source=resolve(process.argv[2]||"/tmp/busy-v3117-alternative");
const output=resolve(process.argv[3]||"/tmp/busy-v3117-decisions");
await mkdir(output,{recursive:true});
const parsed=JSON.parse(await readFile(join(source,"guided-website-quality.json"),"utf8"));
assert.equal(parsed.realBrowser,true,"Only real-browser measurements are relevant");
assert.equal(parsed.fictionalOnly,true,"No customer data ever used in QA");
const data=parsed.results;
const alternative=websiteDesignDecision({before:data.original,after:data.alternative});
const regression=websiteDesignDecision({before:data.original,after:{
 ...data.alternative,
 mobileAudit:{...data.alternative.mobileAudit,
  qualityAudit:{...data.alternative.mobileAudit.qualityAudit,
   smallTouchTargetCount:data.original.mobileAudit.qualityAudit.smallTouchTargetCount+8}}
}});
assert.equal(alternative.comparison.valid,true,"Candidate classified from actual before/after measurements");
assert.ok(["safe-alternative","measured-improvement","regression"].includes(alternative.status),
 "Candidate explicitly classified; changed design not assumed to improve");
assert.equal(alternative.publishAllowed,false,"Never auto-publish even if measured safe");
assert.equal(alternative.measuredRevenueLift,null,"Cannot infer revenue from screenshots");
assert.equal(regression.status,"regression","Deliberately broken touch targets rejected");
assert.equal(regression.publishAllowed,false,"Regression never reaches publishing");
await writeFile(join(output,"evidence.json"),JSON.stringify({
 evidence:"real_offline_chromium_quality_audits",fictionalOnly:true,paidAI:false,
 candidate:alternative,negativeControl:regression
},null,2)+"\n");
console.log("V3.117 PASS: real before/after browser quality classified; worsened touch targets rejected.");
