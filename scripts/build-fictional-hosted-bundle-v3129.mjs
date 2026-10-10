/**
 * Creates a DEPLOYABLE but NOT DEPLOYED staging Worker from BUSY's existing
 * offline website builder output. The generated module contains only two
 * fictional static HTML artifacts and SHA-256 fingerprints.
 *
 * Usage: node scripts/build-fictional-hosted-bundle-v3129.mjs
 *   <offline-gallery-dir> <output-dir> <full-40-character-source-sha>
 *
 * The output folder MUST be staging/generated so relative Worker imports
 * resolve, and must only be produced in an isolated CI checkout. Credentials
 * are neither needed nor copied. Actual deployment requires separate approval.
 */
import {readFile,mkdir,writeFile} from "node:fs/promises";
import {resolve,join} from "node:path";
import {createHash} from "node:crypto";
import assert from "node:assert/strict";
const gallery=resolve(process.argv[2]||"/tmp/busy-v3129-gallery");
const output=resolve(process.argv[3]||"staging/generated");
const sha=process.argv[4]||process.env.GITHUB_SHA||"";
assert.match(sha,/^[a-f0-9]{40}$/i,"Full immutable source SHA required");
assert.ok(output.endsWith("/staging/generated"),
 "Output must be the staging/generated subfolder, never the production Worker tree");
const defs=[
 {slot:"a",id:"20f9279e-0dcf-4b1b-aad0-4952c4aab332",
  file:"01-gardening-minimal.html",name:"Hillside Gardens"},
 {slot:"b",id:"0aa3150d-8e85-4ca3-bda2-f8f3dd6c9bcf",
  file:"03-catering-story.html",name:"Fire & Table Catering"}
];
const assets=[];
for(const d of defs){
 const html=await readFile(join(gallery,d.file),"utf8");
 assert.ok(html.includes(d.name),"Fictional fixture identity must be visible");
 assert.ok(!html.includes(defs.find(x=>x!==d).name),
  "Fictional businesses must not leak into each other's artifacts");
 assert.ok(html.length>200&&html.length<150000,"Bound asset size");
 assert.doesNotMatch(html,/<script\b|<iframe\b|<form\b/i,
  "Only inert static preview HTML is permitted");
 assert.doesNotMatch(html,/(?:src|href)\s*=\s*["']\s*(?:https?:|\/\/)/i,
  "No remote resources may be requested from staged fictional previews");
 const digest=createHash("sha256").update(html,"utf8").digest("hex");
 assets.push({slot:d.slot,id:d.id,revision:1,html,digest,fictionalOnly:true});
}
await mkdir(output,{recursive:true});
const source=[
 '/* AUTO GENERATED from fictional BUSY website gallery. DO NOT EDIT OR PUBLISH AUTOMATICALLY. */',
 'import {createFictionalHostedPreviewWorker} from "../fictional-hosted-preview-worker-v3129.mjs";',
 'export const sourceSha='+JSON.stringify(sha)+';',
 'export const artifacts='+JSON.stringify(assets)+';',
 'export default createFictionalHostedPreviewWorker({assets:artifacts,sourceSha});',
 ''
].join("\n");
const manifest={status:"generated-not-deployed",sourceCommit:sha,
 stagingCloudConfigured:false,hostedHttpsVerified:false,
 genuineSupabaseAuthVerified:false,fictionalOnly:true,
 publishedToInternet:false,websiteCount:assets.length,
 previews:assets.map(({slot,id,revision,digest})=>({slot,id,revision,digest}))};
await writeFile(join(output,"preview-worker.mjs"),source);
await writeFile(join(output,"preview-manifest.json"),JSON.stringify(manifest,null,2)+"\n");
console.log("V3.129 generated two fictional Busy website artifacts with exact SHA-256 versions. Not deployed; no customer or credentials.");
