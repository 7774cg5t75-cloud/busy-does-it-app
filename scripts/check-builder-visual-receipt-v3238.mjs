/** Source-level safety and fail-closed input checks; real browser is a separate CI job. */
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {verifyOfflineBuilderCapturePacketV3238 as verify,pngDimensions}
 from "./lib/verifyBuilderVisualArtifactsV3238.mjs";
const repoFile=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
let checks=0;
function check(x,message){assert.ok(x,message);checks++;}
function equal(a,b,message){assert.deepEqual(a,b,message);checks++;}
equal(pngDimensions(Buffer.from("this is not a PNG")),null);
const b="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
for(const packet of [null,{}, {kind:"offline_builder_visual_capture_v3238",
 fictionalOnly:true,networkRequestsAllowed:false,actualHostedCustomerSite:false,
 screenshotsFromRealChromium:true,source:{businessId:b}}]){
 const result=verify({packet,businessId:b,website:{id:"site",generation:1},
  plan:{ok:true},pageId:"home",artifactDir:"/tmp/nonexistent",
  originalHtml:"<!doctype html><html>original</html>",
  candidateHtml:"<!doctype html><html>candidate</html>"});
 equal(result.ok,false);equal(result.canApply,false);
 equal(result.canPublish,false);equal(result.ownerApprovalRequired,true);
}
const runner=repoFile("scripts/check-builder-browser-evidence-v3238.mjs");
for(const token of [
 "build-website-design-gallery-v3100.mjs",
 "makeWebsiteVisualCheckHtml",
 "reviewWebsiteVisualCheck",
 "page.screenshot({fullPage:true,type:\"png\"})",
 "verify({packet",
 "blockedExternal",
 "real Chromium",
 "deliberate horizontal overflow",
 "V3.238 BROWSER PASS",
 "canPublish"
])check(runner.includes(token),"Missing real-browser CI contract: "+token);
const validator=repoFile("scripts/lib/verifyBuilderVisualArtifactsV3238.mjs");
for(const token of ["createHash","readFixedArtifact","pngDimensions",
 "sha(JSON.stringify(capture.report))","source?.generation","noRealAppNativeScreenshots:true",
 "notCryptographicallyAttested:true","canApply:false","canPublish:false"])
 check(validator.includes(token),"Missing source-bound validation: "+token);
check(!validator.includes("fetch("));
const workflow=repoFile(".github/workflows/builders-major-v3238.yml");
check(workflow.includes("offline-real-browser-visual-compare"));
check(workflow.includes("scripts/check-builder-browser-evidence-v3238.mjs"));
check(workflow.includes("scripts/check-builder-visual-receipt-v3238.mjs"));
check(workflow.includes("scripts/check-builder-design-evidence-v3237.mjs"));
check(workflow.includes("actions/upload-artifact@v4"));
check(workflow.includes("npx playwright install --with-deps chromium"));
const ui=repoFile("src/screens/universalBuilderPlanReview.js");
check(ui.includes("Neither approach has been rendered"),
 "Customer UI must not mistake CI fictional screenshot for their website preview.");
console.log("V3.238: "+checks+" source-only browser receipt, provenance, screenshot, rollout and owner approval checks passed.");
