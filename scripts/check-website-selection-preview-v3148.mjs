import {websiteBuilderTestHarnessV3222} from "./lib/website-builder-test-harness-v3222.mjs";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {previewSelectedWebsiteInstruction} from "../src/core/websiteSelectedChangePreview.mjs";
import {editWebsiteDraftField} from "../src/core/websiteStructuredEditing.mjs";
import {designForWebsite,designCss} from "../supabase/functions/busy-website-worker/designSystem.mjs";
import {planWebsiteDesign} from "../supabase/functions/busy-website-worker/designPlanner.mjs";
import {reviewWebsiteDesign} from "../supabase/functions/busy-website-worker/designReview.mjs";
import {applyWebsiteVisualEdit} from "../supabase/functions/busy-website-worker/designEdits.mjs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const {buildWebsiteDraft,applyWebsiteLayoutChange,applyStructuredWebsiteEdit,renderWebsiteHtml}=websiteBuilderTestHarnessV3222(["buildWebsiteDraft","applyWebsiteLayoutChange","applyStructuredWebsiteEdit","renderWebsiteHtml"]);

const pic={id:"p1",approved:true,storagePath:"private/owner/p1.jpg",uri:"https://example.test/owner.jpg"};
const draft=buildWebsiteDraft({brandBrain:{websiteReady:true,websiteBrief:{
 businessName:"Devon Gardens",businessType:"Garden design",
 description:"Natural garden transformations.",about:"Careful local garden design.",
 phone:"01392 010101",services:[{id:"gardens",name:"Garden design",description:"Practical planting plans"}],
 photos:[pic],heroAsset:pic
}}});
const before=JSON.stringify(draft);
const selection={draftId:draft.id,pageId:"home",generation:draft.generation,
 sectionId:"hero",field:"title",itemId:null,photoIndex:-1};
const deps={fieldEdit:applyStructuredWebsiteEdit,layoutEdit:applyWebsiteLayoutChange,renderPage:renderWebsiteHtml};
const request=(text,selected=selection,current=draft)=>
 previewSelectedWebsiteInstruction(current,{selection:selected,instruction:text},deps);
const result=request("Make this heading bigger and centre this section");
assert.ok(result.ok,result.reason);
assert.equal(result.steps.length,2);
assert.ok(result.candidateHtml.includes("owner-heading-large"));
assert.ok(result.candidateHtml.includes("owner-align-center"));
assert.notEqual(result.originalHtml,result.candidateHtml);
assert.equal(result.draftId,draft.id);
assert.equal(result.generation,draft.generation);
assert.ok(!result.candidateHtml.includes("busy.contextual-action.v1"));
assert.ok(!result.candidateHtml.includes("data-busy-edit-section"));
assert.ok(!result.candidateHtml.includes("ReactNativeWebView"));
assert.ok(result.summary.includes("original stays untouched"));
assert.equal(JSON.stringify(draft),before,"Preview must not change source or create an Undo snapshot");
assert.ok(request("Change this heading to Fish and Chips").ok,"Literal 'and' preserved in owner words");
for(const input of [
 "Make this heading bigger and publish this site now",
 "Make this heading bigger and move this picture to the right",
 "Make this heading bigger and make this heading smaller",
 "Change this heading to Hello; change this heading to Goodbye",
 "a".repeat(401),""
])assert.equal(request(input).ok,false,"Reject ambiguous or unsupported instructions");
for(const selected of [
 {...selection,draftId:"different-owner"},
 {...selection,generation:draft.generation-1},
 {...selection,pageId:"services"},
 {...selection,sectionId:"absent"},
 {...selection,photoIndex:400}
])assert.equal(request("Make this heading bigger",selected).ok,false,"Reject stale/cross-tenant/forged selection");
const unsaved=request("Make this heading bigger",selection,{...draft,id:"different-owner"});
assert.equal(unsaved.ok,false);
const simulateBadRenderer=previewSelectedWebsiteInstruction(draft,
 {selection,instruction:"Make this heading bigger"},{
 ...deps,renderPage:()=>'<!doctype html><body><script>alert(1)</script></body>'
});
assert.equal(simulateBadRenderer.ok,false,"No script-capable preview accepted");
let layoutCalls=0;
const failure=previewSelectedWebsiteInstruction(draft,
 {selection,instruction:"Make this heading bigger and centre this section"},{
 ...deps,layoutEdit:(current,op)=>++layoutCalls===2
  ?{applied:false,draft:current,reason:"Second edit refused"}:applyWebsiteLayoutChange(current,op)
});
assert.equal(failure.ok,false,"All-or-nothing preview must not show partial application");
assert.equal(JSON.stringify(draft),before);
const controller=read("src/app/AppController.js");
const editor=read("src/screens/websiteTapEditor.js");
const screen=read("src/screens/websiteBuilder.js");
assert.ok(controller.includes("prepareWebsiteSelectionPreview(websiteDraftRef.current"));
assert.ok(screen.includes("onPreviewInstruction={s.previewSelectedWebsiteInstruction}"));
assert.ok(editor.includes("See these changes before saving"));
assert.ok(editor.includes("Show original website")&&editor.includes("Show proposed changes"));
assert.ok(editor.includes("javaScriptEnabled={false}"));
assert.ok(editor.includes('selectedInstructionPreview.generation===draft?.generation'));
assert.ok(editor.includes('onChangeText={words=>')&&editor.includes("setSelectedInstructionPreview(null)"));
assert.ok(editor.includes('section?.items?.[photoIndex]?.appearance?.[field]'),
 "Gallery focal point and whole-photo-fit controls display the actual selected choice");
assert.ok(controller.includes("setWebsiteUndo(items=>[...items,current].slice(-8))"),
 "Only explicit Apply stores one Undo snapshot");
console.log("V3.148 PREVIEW PASS: private exact-page multi-step before/after, no mutation, stale/security guards, one-Undo approval, image-fit UI.");
