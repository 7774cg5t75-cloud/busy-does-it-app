/**
 * V3.222: real source-checked React Native website-builder test harness.
 * Import semantics and behavior are unchanged; no publication, AI provider,
 * database action, credentials, signed build or customer data.
 */
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {websiteBuilderTestHarnessV3222,EXPECTED,AVAILABLE}
 from "./lib/website-builder-test-harness-v3222.mjs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
let n=0;
const ok=(x,m)=>{assert.ok(x,m);n++;};
const eq=(a,b,m)=>{assert.deepEqual(a,b,m);n++;};
eq(EXPECTED.length,6);
ok(EXPECTED.some(x=>x.includes("canonicalWebsiteHandoffUrl")));
ok(AVAILABLE.has("rebuildPrivateWebsiteDraft"));
const funcs=websiteBuilderTestHarnessV3222([
 "buildWebsiteDraft","renderWebsiteHtml","applyWebsiteInstruction",
 "applyStructuredWebsiteEdit","applyWebsiteLayoutChange","applyWebsitePageChange",
 "rebuildPrivateWebsiteDraft"
]);
for(const name of ["buildWebsiteDraft","renderWebsiteHtml",
 "applyWebsiteInstruction","applyStructuredWebsiteEdit",
 "applyWebsiteLayoutChange","applyWebsitePageChange",
 "rebuildPrivateWebsiteDraft"])
 ok(typeof funcs[name]==="function","Missing real "+name);
const first=funcs.buildWebsiteDraft({brandBrain:{websiteReady:true,websiteBrief:{
 businessName:"Fictional Devon Gardens",businessType:"Garden design",
 description:"Carefully maintained local gardens.",phone:"01392 123456",
 email:"hello@gardens.example.test",serviceArea:"Devon",
 services:[{id:"hedges",name:"Hedge care",description:"A tidy and thoughtful service."}]
}}});
ok(first&&Array.isArray(first.sections));
ok(first.html.includes("Fictional Devon Gardens"));
ok(first.publicStatus==="Not published");
const out=funcs.renderWebsiteHtml(first,"home");
ok(out.includes("Fictional Devon Gardens"));
const edit=funcs.applyWebsiteInstruction(first,"change primary colour to blue");
ok(edit&&typeof edit==="object");
ok(first.publicStatus==="Not published","No live publish from editor tests");
for(const names of [[],["unsafeMigration"],["buildWebsiteDraft","buildWebsiteDraft"],
 ["constructor"],["buildWebsiteDraft","unknown"]]){
 assert.throws(()=>websiteBuilderTestHarnessV3222(names));
 n++;
}
const scripts=[
 "check-intelligent-website-design-v3100.mjs",
 "check-distinct-website-designs-v3101.mjs",
 "check-website-edit-freedom-v3102.mjs",
 "check-website-direct-edit-v3133.mjs",
 "check-website-layout-v3134.mjs","check-website-pages-v3135.mjs",
 "check-website-standalone-v3136.mjs",
 "check-website-tap-editor-v3138.mjs",
 "check-website-section-styling-v3139.mjs",
 "check-website-context-v3140.mjs",
 "check-website-voice-selection-v3141.mjs",
 "check-website-voice-reliability-v3142.mjs",
 "check-website-context-plan-v3147.mjs",
 "check-website-selection-preview-v3148.mjs",
 "check-major-builders-v3191.mjs",
 "check-major-builders-v3192.mjs"
];
for(const name of scripts){
 const test=read("scripts/"+name);
 ok(test.includes("websiteBuilderTestHarnessV3222"),
   name+" still has a bespoke builder loader.");
 ok(!test.includes("const strip="),
   name+" should not have a stale source-stripper.");
 ok(!test.includes('Function("syncWebsitePageModel"')&&
    !test.includes('domain+";return {')&&
    !test.includes('source+";return {'),
   name+" must not evaluate a partially stripped production builder.");
}
const websiteSource=read("src/domain/websiteBuilder.js");
ok(websiteSource.includes('import {canonicalWebsiteHandoffUrl}'));
ok(websiteSource.includes('export {'));
console.log("V3.222 shared builder test harness: "+n+
 " checks passed across "+scripts.length+" migrated suites.");
