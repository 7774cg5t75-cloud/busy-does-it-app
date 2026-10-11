import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {PREVIEW_WIDTHS,withWebsitePreviewViewport,websitePreviewWidthNote} from "../src/core/websiteResponsivePreview.mjs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const html='<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>Private concept</body></html>';
assert.equal(withWebsitePreviewViewport(html,"full"),html);
for(const [mode,width] of Object.entries(PREVIEW_WIDTHS)){
 const preview=withWebsitePreviewViewport(html,mode);
 assert.ok(preview.includes('content="width='+width+',initial-scale=1"'));
 assert.ok(!preview.includes("width=device-width"));
 assert.ok(websitePreviewWidthNote(mode,width).includes("Measured "+width+"px"));
 if(mode!=="phone")assert.ok(websitePreviewWidthNote(mode,390).includes("Do not treat"));
}
assert.throws(()=>withWebsitePreviewViewport(html,"bogus"));
assert.throws(()=>withWebsitePreviewViewport("<html>untrusted</html>","desktop"));
assert.throws(()=>withWebsitePreviewViewport(html+'<meta name="viewport">',"desktop"));
const builder=read("src/screens/websiteBuilder.js"),editor=read("src/screens/websiteTapEditor.js");
assert.ok(builder.includes("withWebsitePreviewViewport(unscaledInteractiveHtml,previewSize)"));
assert.ok(builder.includes('setPreviewSize("tablet")')&&builder.includes('setPreviewSize("desktop")'));
assert.ok(builder.includes("websitePreviewWidthNote(previewSize,visualCheckResult.counts.viewport)"));
assert.ok(builder.includes("recordWebsiteViewportEvidence(previous"));
assert.ok(editor.includes("withWebsitePreviewViewport(showPreviewOriginal"));
assert.ok(editor.includes('setComparisonSize("phone")'));
assert.ok(editor.includes("Compare "+'"'+mode+" layout"'));
assert.ok(read("src/domain/websiteBuilder.js").includes('content="width=device-width,initial-scale=1"'));
console.log("V3.148 RESPONSIVE PASS: bounded phone/tablet/desktop visual modes, unchanged public renderer and honest browser-width wording.");
