import {verifyOriginalWebsiteInstructionRuntime} from "./lib/original-website-instruction-runtime.mjs";
import {websiteBuilderTestHarnessV3222} from "./lib/website-builder-test-harness-v3222.mjs";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {splitSelectedWebsiteInstruction,planSelectedWebsiteChanges,
 prepareSelectedWebsiteTransaction} from "../src/core/websiteContextPlan.mjs";
import {editWebsiteDraftField} from "../src/core/websiteStructuredEditing.mjs";
import {designForWebsite,designCss} from "../supabase/functions/busy-website-worker/designSystem.mjs";
import {planWebsiteDesign} from "../supabase/functions/busy-website-worker/designPlanner.mjs";
import {reviewWebsiteDesign} from "../supabase/functions/busy-website-worker/designReview.mjs";
import {applyWebsiteVisualEdit} from "../supabase/functions/busy-website-worker/designEdits.mjs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const {buildWebsiteDraft,applyWebsiteLayoutChange,applyStructuredWebsiteEdit}=websiteBuilderTestHarnessV3222(["buildWebsiteDraft","applyWebsiteLayoutChange","applyStructuredWebsiteEdit"]);

const photo={id:"ph1",approved:true,storagePath:"owner/private.jpg",uri:"https://example.test/photo.jpg"};
const draft=buildWebsiteDraft({brandBrain:{websiteReady:true,websiteBrief:{
 businessName:"Devon Garden Studio",businessType:"Garden design",
 description:"Beautiful gardens",about:"Friendly garden designers.",
 services:[{id:"design",name:"Garden design",description:"Garden care."}],
 photos:[photo],heroAsset:photo
}}});
const original=JSON.stringify(draft);
const selection={draftId:draft.id,pageId:"home",generation:draft.generation,
 sectionId:"hero",field:"title",itemId:null,photoIndex:-1};
const parse=text=>planSelectedWebsiteChanges(draft,"home",selection,text);
assert.deepEqual(splitSelectedWebsiteInstruction("Make this heading bigger and centre this section"),
 ["Make this heading bigger","centre this section"]);
assert.deepEqual(splitSelectedWebsiteInstruction("Change this heading to Fish and Chips"),
 ["Change this heading to Fish and Chips"]);
assert.deepEqual(splitSelectedWebsiteInstruction("make this heading bigger; give this section more space"),
 ["make this heading bigger","give this section more space"]);
for(const text of ["","a".repeat(401),"make this heading bigger;;;;",
 "make this heading bigger; give this section more space; centre this section; align this section left"])
 assert.equal(parse(text).ok,false,"Bounded input and steps");
const both=parse("Make this heading bigger and centre this section");
assert.ok(both.ok&&both.steps.length===2);
assert.deepEqual(both.steps.map(x=>x.change.field),["headingScale","textAlign"]);
assert.equal(both.requiresExplicitApproval,true);
const options={fieldEdit:applyStructuredWebsiteEdit,layoutEdit:applyWebsiteLayoutChange};
const applied=prepareSelectedWebsiteTransaction(draft,both,options);
assert.ok(applied.applied,applied.reason);
assert.equal(applied.steps,2);
assert.equal(applied.draft.generation,draft.generation+2);
assert.equal(applied.draft.sections.find(x=>x.id==="hero").appearance.headingScale,"large");
assert.equal(applied.draft.sections.find(x=>x.id==="hero").appearance.textAlign,"center");
assert.equal(applied.draft.publicStatus,"Not published");
assert.equal(JSON.stringify(draft),original,"Original remains untouched, Undo needs only one snapshot");
const reversed=prepareSelectedWebsiteTransaction(draft,parse("change this heading to Fish and Chips"),options);
assert.ok(reversed.applied,reversed.reason);
assert.ok(reversed.draft.sections.find(x=>x.id==="hero").title.includes("Fish and Chips"));
for(const text of [
 "make this heading bigger and publish this website now",
 "make this heading bigger and move this picture to the right",
 "make this heading bigger and make this heading smaller",
 "change this heading to Hello; change this heading to Goodbye",
 "make this heading bigger and give this section more space and publish this website now"
])assert.equal(parse(text).ok,false,"No guesses, duplicate writes, publishing or partial execution");
const changed={...selection,generation:draft.generation-1};
assert.equal(planSelectedWebsiteChanges(draft,"home",changed,"make this heading bigger").ok,false);
const wrongPage={...selection,pageId:"services"};
assert.equal(planSelectedWebsiteChanges(draft,"services",wrongPage,"make this heading bigger").ok,false);
const other={...draft,id:"different-tenant"};
assert.equal(planSelectedWebsiteChanges(other,"home",selection,"make this heading bigger").ok,true,
 "Pure grammar does not establish caller's tenant; controller MUST verify draftId and current ref");
let call=0;
const failed=prepareSelectedWebsiteTransaction(draft,both,{
 fieldEdit:applyStructuredWebsiteEdit,
 layoutEdit:(working,change)=>++call===2
  ?{applied:false,draft:working,reason:"Unsafe second step"}
  :applyWebsiteLayoutChange(working,change)
});
assert.equal(failed.applied,false);
assert.equal(failed.draft,draft,"Failed second step restores entire untouched source");
assert.equal(JSON.stringify(draft),original);
const controller=read("src/app/AppController.js"),modal=read("src/screens/websiteTapEditor.js");
const screen=read("src/screens/websiteBuilder.js");
assert.ok(controller.includes("const applySelectedWebsiteInstruction ="));
assert.ok(controller.includes("selection.draftId!==current.id"));
assert.ok(controller.includes("planSelectedWebsiteChanges(current,selection.pageId,selection,instruction)"));
verifyOriginalWebsiteInstructionRuntime();
assert.ok(controller.includes("setWebsiteUndo(items=>[...items,current].slice(-8))"),
 "Atomic multi-step change uses exactly one Undo entry");
assert.ok(screen.includes("onApplyInstruction={s.applySelectedWebsiteInstruction}"));
assert.ok(modal.includes("These changes will be saved together")&&modal.includes("Apply reviewed instruction"));
assert.ok(!modal.includes("fetch("),"No paid provider call for typed instructions");
console.log("V3.147 CONTEXT PASS: safe multi-step selected edits, literal 'and' text, atomic rollback, stale rejection, one Undo and no publishing.");
