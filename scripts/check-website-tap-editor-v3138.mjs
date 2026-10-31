import {websiteBuilderTestHarnessV3222} from "./lib/website-builder-test-harness-v3222.mjs";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {makeTapToEditHtml,resolveTapSelection,CHANNEL} from "../src/core/websiteTapToEdit.mjs";
import {editWebsiteDraftField} from "../src/core/websiteStructuredEditing.mjs";
import {canonicalWebsiteHandoffUrl} from "../src/core/websiteAppHandoffV3214.mjs";
import {planWebsiteDesign} from "../supabase/functions/busy-website-worker/designPlanner.mjs";
import {designForWebsite,designCss} from "../supabase/functions/busy-website-worker/designSystem.mjs";
import {reviewWebsiteDesign} from "../supabase/functions/busy-website-worker/designReview.mjs";
import {applyWebsiteVisualEdit} from "../supabase/functions/busy-website-worker/designEdits.mjs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const {buildWebsiteDraft,renderWebsiteHtml,applyStructuredWebsiteEdit,applyWebsiteLayoutChange}=websiteBuilderTestHarnessV3222(["buildWebsiteDraft","renderWebsiteHtml","applyStructuredWebsiteEdit","applyWebsiteLayoutChange"]);

const a={id:"rose-1",storagePath:"private/rose-1.jpg",uri:"https://example.test/rose.jpg",approved:true,alt:"Roses"};
const b={id:"rose-2",storagePath:"private/rose-2.jpg",uri:"https://example.test/hedge.jpg",approved:true,alt:"Hedge"};
const site=buildWebsiteDraft({brandBrain:{websiteReady:true,websiteBrief:{
 businessName:"Example Garden Studio",businessType:"Landscape design",
 tagline:"Thoughtfully designed gardens",phone:"01392 111222",email:"hello@example.test",
 services:[{id:"design",name:"Garden design",description:"Beautiful, practical outdoor spaces."}],
 about:"A garden design studio in Devon.",photos:[a,b],heroAsset:a
}}});
const home=site.pages.find(p=>p.id==="home");
assert.ok(home?.sectionIds.includes("hero"));
const normal=renderWebsiteHtml(site,"home");
const marked=renderWebsiteHtml(site,"home",{editablePreview:true});
assert.ok(!normal.includes("data-busy-edit-")&&!normal.includes("<script"),"Normal public/static renderer unchanged");
assert.ok(marked.includes('data-busy-edit-section="hero" data-busy-edit-field="title"'));
assert.ok(marked.includes('data-busy-edit-section="hero" data-busy-edit-field="photo"'));
assert.ok(marked.includes('data-busy-edit-section="services" data-busy-edit-field="title" data-busy-edit-item="design"'));
assert.ok(marked.includes('data-busy-edit-section="gallery" data-busy-edit-field="photo"'));
const interactive=makeTapToEditHtml(marked);
assert.ok(interactive.includes('window.ReactNativeWebView.postMessage'));
assert.ok(interactive.includes('event.preventDefault()'));
assert.ok(!normal.includes("ReactNativeWebView"),"Published and portable HTML never receive the editor bridge");
assert.throws(()=>makeTapToEditHtml("<script>external()</script></body>"));
assert.throws(()=>makeTapToEditHtml("not a full website"));
const msg=(sectionId,field,itemId="",photoIndex="")=>({channel:CHANNEL,sectionId,field,itemId,photoIndex});
assert.deepEqual(resolveTapSelection(site,"home",msg("hero","title")),{sectionId:"hero",field:"title",itemId:null});
assert.deepEqual(resolveTapSelection(site,"home",msg("services","body","design")),{sectionId:"services",field:"body",itemId:"design"});
assert.deepEqual(resolveTapSelection(site,"home",msg("gallery","photo","","1")),{sectionId:"gallery",field:"photo",photoIndex:1});
for(const input of [
 msg("unknown","title"),msg("services","body","absent"),msg("gallery","asset"),
 msg("gallery","photo","","-1"),msg("gallery","photo","","100"),
 msg("hero","photo","","0"),msg("services","photo"),msg("hero","title","design"),
 msg("contact","token"),{...msg("hero","title"),channel:"other"},
 {...msg("hero","title"),photoIndex:"7"}, {...msg("hero","title"),itemId:"a".repeat(1000)}
])assert.equal(resolveTapSelection(site,"home",input),null,"Reject invalid or forged selection.");
assert.equal(resolveTapSelection(site,"missing",msg("hero","title")),null);
assert.equal(resolveTapSelection({...site,sections:site.sections.map(s=>s.id==="hero"?{...s,enabled:false}:s)},
 "home",msg("hero","title")),null,"Hidden sections are not editable");
const original=JSON.stringify(site);
const edit=applyStructuredWebsiteEdit(site,{...msg("services","body","design"),value:"A new approved garden description."});
assert.ok(edit.applied&&edit.draft.html.includes("A new approved garden description."));
assert.equal(JSON.stringify(site),original,"Tap-backed edits do not mutate original draft");
const moved=applyWebsiteLayoutChange(site,{action:"move-gallery-photo",sectionId:"gallery",photoIndex:0,direction:"down"});
assert.ok(moved.applied,"Photo reorder is a private structured action");
assert.equal(moved.draft.sections.find(s=>s.id==="gallery").items[0].storagePath,b.storagePath);
assert.equal(site.sections.find(s=>s.id==="gallery").items[0].storagePath,a.storagePath);
assert.equal(moved.draft.publicStatus,"Not published");
const unsafe=applyWebsiteLayoutChange(site,{action:"choose-feature-photo",sectionId:"hero",storagePath:"another-business/image.jpg"});
assert.equal(unsafe.applied,false,"No external unapproved photo substitution");
const removed=applyWebsiteLayoutChange(site,{action:"remove-gallery-photo",sectionId:"gallery",photoIndex:1});
assert.ok(removed.applied);
assert.equal(removed.draft.sections.find(s=>s.id==="gallery").items.length,1);
assert.equal(site.sections.find(s=>s.id==="gallery").items.length,2,"Removal is immutable and undoable");
const screen=read("src/screens/websiteBuilder.js");
const modal=read("src/screens/websiteTapEditor.js");
const controller=read("src/app/AppController.js");
assert.ok(screen.includes("javaScriptEnabled={tapEditMode||visualCheckOn||candidateCheckOn}"));
assert.ok(screen.includes("resolveTapToolbarAction(draft"));
assert.ok(screen.includes("onTextChange={change=>reportOwnerDraft.commit(()=>s.applyWebsiteFieldChange(change))}"),"Original field handler remains behind the exact editor draft guard");
assert.ok(screen.includes("onLayoutChange={s.applyWebsiteLayoutAction}"));
assert.ok(screen.includes("onShouldStartLoadWithRequest"));
assert.ok(modal.includes("Cancel — leave website unchanged")&&modal.includes("Save to private website draft"));
assert.ok(!modal.includes("fetch(")&&!modal.includes("publishWebsite"));
assert.ok(controller.includes("setWebsiteUndo(items=>")&&controller.includes("setWebsiteRedo([])"));
console.log("V3.138 PASS: local tap selection, real HTML markers, strict scope, safe photo controls, native history and no implicit publication.");
