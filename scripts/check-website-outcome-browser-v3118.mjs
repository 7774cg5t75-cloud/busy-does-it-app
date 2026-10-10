import assert from "node:assert/strict";
import {readFile,mkdir,writeFile} from "node:fs/promises";
import {resolve,join} from "node:path";
import {designPreferenceSummary} from "../supabase/functions/busy-website-publish/designFeedback.mjs";
import {websiteOutcomeEvidence} from "../supabase/functions/busy-website-worker/websiteOutcomeEvidence.mjs";
const path=resolve(process.argv[2]||"/tmp/busy-v3118-before-after");
const output=resolve(process.argv[3]||"/tmp/busy-v3118-outcomes");
await mkdir(output,{recursive:true});
const audit=JSON.parse(await readFile(join(path,"guided-website-quality.json"),"utf8"));
assert.equal(audit.realBrowser,true,"Actual browser measurements required");
assert.equal(audit.fictionalOnly,true,"Do not use customer sites in CI");
const tenant="91edb6db-3a02-4de4-9ba8-5c93b4e790a1";
const feedback=designPreferenceSummary([
 {design_family:"minimal",preference:"kept",draft_version:"4"}
]);
const evidence=websiteOutcomeEvidence({
 businessId:tenant,authorizedBusinessId:tenant,family:"minimal",revision:"4",
 before:audit.results.original,after:audit.results.alternative,feedback
});
assert.equal(evidence.ownerDecision?.choice,"kept","Owner choice retained");
assert.equal(evidence.design.comparison?.valid,true,"Actual before/after audits valid");
assert.equal(evidence.published,false,"No publication");
assert.equal(evidence.verifiedSalesLift,null,"Do not assume business improvement");
const degraded={...audit.results.alternative,
 mobileAudit:{...audit.results.alternative.mobileAudit,
  qualityAudit:{...audit.results.alternative.mobileAudit.qualityAudit,
   smallTouchTargetCount:audit.results.original.mobileAudit.qualityAudit.smallTouchTargetCount+12}}};
const rejected=websiteOutcomeEvidence({
 businessId:tenant,authorizedBusinessId:tenant,family:"minimal",revision:"4",
 before:audit.results.original,after:degraded,feedback
});
assert.equal(rejected.status,"regression","Owner opinion cannot override degraded accessibility");
assert.equal(rejected.autoApply,false,"Never auto-apply");
await writeFile(join(output,"evidence.json"),JSON.stringify({
 fictionalBusinessOnly:true,realChromiumMeasurements:true,
 paidCalls:0,ownerEvidence:"fixture_only",evidence,rejected
},null,2)+"\n");
console.log("V3.118 PASS: real browser quality and owner choices evaluated separately; impaired candidate rejected.");
