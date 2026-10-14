import {websiteBuilderTestHarnessV3222} from "./lib/website-builder-test-harness-v3222.mjs";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {interpretSelectedWebsiteRequest as interpret} from "../src/core/websiteContextualEdit.mjs";
import {applyWebsiteLayoutOperation} from "../supabase/functions/busy-website-worker/websiteLayoutEditing.mjs";
import {editWebsiteDraftField} from "../src/core/websiteStructuredEditing.mjs";
import {canonicalWebsiteHandoffUrl} from "../src/core/websiteAppHandoffV3214.mjs";
import {designForWebsite,designCss} from "../supabase/functions/busy-website-worker/designSystem.mjs";
import {planWebsiteDesign} from "../supabase/functions/busy-website-worker/designPlanner.mjs";
import {reviewWebsiteDesign} from "../supabase/functions/busy-website-worker/designReview.mjs";
import {applyWebsiteVisualEdit} from "../supabase/functions/busy-website-worker/designEdits.mjs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const {buildWebsiteDraft,applyWebsiteLayoutChange,applyStructuredWebsiteEdit,renderWebsiteHtml}=websiteBuilderTestHarnessV3222(["buildWebsiteDraft","applyWebsiteLayoutChange","applyStructuredWebsiteEdit","renderWebsiteHtml"]);

const photo={id:"p1",approved:true,uri:"https://example.test/p1.jpg",storagePath:"business/owner/p1.jpg"};
const second={id:"p2",approved:true,uri:"https://example.test/p2.jpg",storagePath:"business/owner/p2.jpg"};
const brand={websiteReady:true,websiteBrief:{businessName:"Devon Gardens",businessType:"Garden design",
 description:"Local garden design",about:"Garden planning in Devon.",phone:"01392 000111",
 email:"hello@example.test",services:[{id:"hedge",name:"Hedge care",description:"Careful hedge care"},
 {id:"lawn",name:"Lawn care",description:"Grass and lawn care"}],
 photos:[photo,second],heroAsset:photo,faqs:[{id:"visits",question:"Can you visit?",answer:"Yes."}]}};
const draft=buildWebsiteDraft({brandBrain:brand});
const original=JSON.stringify(draft);
const selected=(sectionId,field,itemId="",photoIndex=-1)=>{
 const page=draft.pages.find(p=>p.sectionIds.includes(sectionId));
 return {sectionId,field,itemId:itemId||null,photoIndex,
  pageId:page?.id||"home",generation:draft.generation};
};
const ask=(target,text,working=draft)=>interpret(working,target.pageId,target,text);
const apply=plan=>plan.type==="field"?applyStructuredWebsiteEdit(draft,plan.change):
 applyWebsiteLayoutChange(draft,plan.change);
let count=0;const check=(value,message)=>{assert.ok(value,message);count++;};
const heroHeading=ask(selected("hero","title"),"Make this heading bigger");
check(heroHeading.ok&&heroHeading.change.action==="section-style"&&heroHeading.change.sectionId==="hero","Hero heading resolves to exact section");
const heroApplied=apply(heroHeading);check(heroApplied.applied,"Hero heading uses approved layout action");
check(heroApplied.draft.html.includes("owner-heading-large"),"Hero CSS class displayed in regenerated draft");
check(!draft.sections.find(s=>s.id==="hero").appearance,"Old draft isn't mutated");
const selectedService=selected("services","title","hedge");
const bigService=ask(selectedService,"Make this heading bigger");
check(bigService.ok&&bigService.change.action==="item-style"&&bigService.change.itemId==="hedge","Selected card doesn't modify section heading");
const changed=apply(bigService);check(changed.applied,"Allowed item heading action accepted");
check(changed.draft.html.includes('class="owner-item-heading-large"'),"Item heading uses safe CSS token");
check(!changed.draft.html.includes('class="owner-heading-large"'),"Other section heading not resized");
check(!changed.draft.sections.find(s=>s.id==="services").items.find(x=>x.id==="lawn").appearance,"Other card unchanged");
check(changed.draft.publicStatus==="Not published","Editing does not publish");
check(changed.draft.generation===draft.generation+1,"New revision created for private undo");
const restore=applyWebsiteLayoutChange(changed.draft,{action:"item-style",sectionId:"services",
 itemId:"hedge",field:"headingScale",value:"normal"});
check(restore.applied&&restore.draft.sections.find(s=>s.id==="services").items.find(x=>x.id==="hedge").appearance===undefined,
 "Reset individual heading without removing content");
const refresh=buildWebsiteDraft({brandBrain:brand,previousDraft:changed.draft});
check(refresh.sections.find(s=>s.id==="services").items.find(x=>x.id==="hedge").appearance?.headingScale==="large",
 "Per-item owner choices survive factual Brand Brain refresh");
check(refresh.sections.find(s=>s.id==="services").items.find(x=>x.id==="lawn").appearance===undefined,
 "Refresh does not move owner settings to other items");
const copied=ask(selected("services","body","hedge"),"change this text to Arrive by appointment");
check(copied.ok&&copied.type==="field"&&copied.change.itemId==="hedge","Text replacement scoped to exact item");
const copiedResult=apply(copied);
check(copiedResult.applied&&copiedResult.draft.sections.find(s=>s.id==="services")?.items.find(i=>i.id==="hedge")?.body==="Arrive by appointment","Existing structured content guard processes literal text on its correct page");
const centre=ask(selected("about","body"),"Centre this section");
check(centre.ok&&centre.change.sectionId==="about"&&centre.change.value==="center","Centre selected section only");
const spacing=ask(selected("about","body"),"Give this section more space");
check(spacing.ok&&spacing.change.value==="generous","Simple spacing request scoped");
const crop=ask(selected("hero","photo"),"Crop this photo to the top");
check(crop.ok&&crop.change.sectionId==="hero"&&crop.change.value==="top","Crop approved hero only");
const move=ask(selected("gallery","photo","",1),"Move this photo to the right");
check(move.ok&&move.change.photoIndex===1&&move.change.direction==="down","Selected gallery index preserved");
check(ask(selected("hero","cta"),"Make this button stand out").ok,"Hero CTA emphasis supported");
for(const [target,query] of [
 [selected("services","body","hedge"),"Make this heading bigger"],
 [selected("hero","title"),"Move this photo to the right"],
 [selected("services","title","hedge"),"Centre this section"],
 [selected("hero","title"),"Change this text to wrong part"],
 [selected("hero","title"),"Publish this website now"],
 [selected("hero","title"),"Run this JavaScript"],
 [selected("hero","title"),"Move that random image to https://example.test"],
 [selected("services","title","missing"),"Make this heading bigger"],
 [{...selected("hero","title"),pageId:"missing"},"Make this heading bigger"],
 [{...selected("hero","title"),generation:draft.generation-1},"Make this heading bigger"],
 [selected("hero","photo","",999),"Crop this photo to the bottom"],
 [selected("hero","title"),"a".repeat(401)]
])check(!ask(target,query).ok,"Reject unsupported/stale/wrong field: "+query.slice(0,34));
const hidden=JSON.parse(JSON.stringify(draft));hidden.sections.find(s=>s.id==="hero").enabled=false;
check(!ask(selected("hero","title"),"Make this heading bigger",hidden).ok,"Hidden section cannot be changed");
check(!interpret(draft,"services",selected("hero","title"),"Make this heading bigger").ok,
 "Cross-page field mismatch rejected");
check(JSON.stringify(draft)===original,"No interpreter action mutates original website draft");
const hosted=read("supabase/functions/busy-website-worker/index.ts");
check(hosted.includes("owner-item-heading-large")&&hosted.includes("itemHeadingClass(item)"),
 "Hosted website uses the same item presentation tokens");
const stylesheet=designCss(designForWebsite({businessType:"Garden design"}));
check(stylesheet.includes("h3.owner-item-heading-large"),"Shared CSS has large item heading");
check(stylesheet.includes("h3.owner-item-heading-compact"),"Shared CSS has compact item heading");
const modal=read("src/screens/websiteTapEditor.js");
const screen=read("src/screens/websiteBuilder.js");
check(modal.includes("interpretSelectedWebsiteRequest(draft,selection?.pageId,selection,instruction)"),
 "Modal uses verified selection for every interpreted request");
check(modal.includes('onTextChange:onLayoutChange')&&modal.includes("onClose?.()"),
 "Owner request goes through existing field/layout undo history");
check(screen.includes("generation:draft.generation")&&screen.includes('pageId:activePage?.id||"home"'),
 "Every selection bound to exact page and draft generation");
check(!modal.includes("publishWebsite")&&!modal.includes("fetch("),"Context controls have no network or publishing calls");
console.log("V3.140 CONTEXT PASS:",count,"selection, no-guess grammar, private changes, individual headings, rebuild and safety assertions.");
