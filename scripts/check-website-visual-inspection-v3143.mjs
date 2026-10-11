import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {makeWebsiteVisualCheckHtml,reviewWebsiteVisualCheck,CHANNEL}
 from "../src/core/websiteVisualCheck.mjs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const literal="<!doctype html><html lang=\"en\"><head><title>Preview</title></head><body><main><section><h1>Example</h1></section></main></body></html>";
const injected=makeWebsiteVisualCheckHtml(literal,"12:home:phone");
assert.ok(injected.includes("busy.website.visual-review.v1"));
assert.ok(injected.includes('key:"12:home:phone"'));
assert.ok(injected.includes("</script></body>"));
assert.equal(makeWebsiteVisualCheckHtml(literal).includes("busy.website.visual-review.v1"),true);
for(const html of ["","bad","<!doctype html><body><script>alert(1)</script></body>"])
 assert.throws(()=>makeWebsiteVisualCheckHtml(html));
assert.throws(()=>makeWebsiteVisualCheckHtml(literal,'"</script>'));
const base={channel:CHANNEL,key:"12:home:phone",viewport:390,width:390,
 overflow:0,images:2,missingAlt:0,unloadedImages:0,smallTargets:0,
 badAnchors:0,clippedHeadings:0,headings:2,sections:3};
const clean=reviewWebsiteVisualCheck(base,"12:home:phone");
assert.ok(clean.passed&&clean.issues.length===0);
assert.ok(clean.message.includes("Still inspect"));
assert.equal(reviewWebsiteVisualCheck(base,"13:home:phone"),null,"Stale preview result rejected");
assert.equal(reviewWebsiteVisualCheck({...base,viewport:25},"12:home:phone"),null);
assert.equal(reviewWebsiteVisualCheck({...base,viewport:"390"},"12:home:phone"),null);
assert.equal(reviewWebsiteVisualCheck({...base,images:-5},"12:home:phone"),null);
assert.equal(reviewWebsiteVisualCheck({...base,width:Infinity},"12:home:phone"),null);
assert.equal(reviewWebsiteVisualCheck({...base,channel:"busy.website.tap-to-edit.v1"},"12:home:phone"),null);
const issues=reviewWebsiteVisualCheck({...base,width:480,overflow:3,unloadedImages:1,
 missingAlt:1,smallTargets:2,badAnchors:1,clippedHeadings:1,headings:0},
 "12:home:phone");
assert.ok(issues.issues.some(x=>x.id==="overflow"));
for(const id of ["photos","descriptions","targets","links","headings","empty"])
 assert.ok(issues.issues.some(x=>x.id===id),id+" must be reported");
assert.equal(issues.passed,false);
const preview=read("src/screens/websiteBuilder.js");
assert.ok(preview.includes("reviewWebsiteVisualCheck(raw,inspectionKey)"),
 "Only matching WebView report reaches app UI");
assert.ok(preview.includes("javaScriptEnabled={tapEditMode||visualCheckOn||candidateCheckOn}"),
 "JavaScript only on explicit private editor/check actions");
assert.ok(preview.includes("setVisualCheckOn(false)")&&
 preview.includes("setVisualCheckResult(null)"),
 "Never carry previous report across website/version/viewport");
assert.ok(preview.includes("Check this page for layout problems"));
assert.ok(!preview.includes("confirmPublishHostedWebsite("),
 "Layout warning does not automatically approve public publishing");
const editor=read("src/screens/websiteTapEditor.js");
assert.ok(editor.includes("photoPreviewSource")&&editor.includes("<Image source={selectedPhotoSource}"));
assert.ok(editor.includes('showPhotoChoices?"Hide other approved pictures"'));
assert.ok(editor.includes('const [showPhotoChoices,setShowPhotoChoices]'));
assert.ok(editor.includes("["+"photoCrop"+",")===false,
 "Selection controls should not construct arbitrary CSS");
const publishing=read("src/screens/websitePublishing.js");
assert.ok(publishing.includes("Check phone layout in my private design"),
 "Owner can open the private mobile layout check from publishing review");
assert.ok(publishing.includes("reviewedHostedPreview!==preview.id")&&
 publishing.includes("confirmPublishHostedWebsite(preview.id)"),
 "Real hosted version and explicit owner approval remain mandatory");
const css=read("supabase/functions/busy-website-worker/designSystem.mjs");
assert.ok(css.includes(".gallery-image")&&css.includes("object-fit:cover"),
 "Image frame diagnostics use real styling");
console.log("V3.143 PASS: safe opt-in private DOM visual report, stale-result rejection, owner photo preview and no publishing bypass.");
