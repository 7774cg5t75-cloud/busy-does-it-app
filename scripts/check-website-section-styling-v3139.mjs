import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {designForWebsite,designCss} from "../supabase/functions/busy-website-worker/designSystem.mjs";
import {planWebsiteDesign} from "../supabase/functions/busy-website-worker/designPlanner.mjs";
import {reviewWebsiteDesign} from "../supabase/functions/busy-website-worker/designReview.mjs";
import {applyWebsiteVisualEdit} from "../supabase/functions/busy-website-worker/designEdits.mjs";
import {editWebsiteDraftField} from "../src/core/websiteStructuredEditing.mjs";
import {canonicalWebsiteHandoffUrl} from "../src/core/websiteAppHandoffV3214.mjs";

const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const strip=s=>s.replace(/export\s*\{[\s\S]*?\};?\s*$/,"");
const management=Function(strip(read("src/domain/websiteManagement.js"))+";return {syncWebsitePageModel};")();
let code=strip(read("src/domain/websiteBuilder.js"));
for(const imp of [
 'import { syncWebsitePageModel } from "./websiteManagement";',
 'import {canonicalWebsiteHandoffUrl} from "../core/websiteAppHandoffV3214.mjs";',
 'import { designForWebsite, designCss } from "../../supabase/functions/busy-website-worker/designSystem.mjs";',
 'import { planWebsiteDesign } from "../../supabase/functions/busy-website-worker/designPlanner.mjs";',
 'import { reviewWebsiteDesign } from "../../supabase/functions/busy-website-worker/designReview.mjs";',
 'import { applyWebsiteVisualEdit } from "../../supabase/functions/busy-website-worker/designEdits.mjs";'
]){assert.ok(code.includes(imp),"Expected website domain import");code=code.replace(imp,"");}
const {buildWebsiteDraft,applyWebsiteLayoutChange,renderWebsiteHtml,applyWebsitePageChange}=
 Function("syncWebsitePageModel","designForWebsite","designCss","planWebsiteDesign",
 "reviewWebsiteDesign","applyWebsiteVisualEdit","editWebsiteDraftField","canonicalWebsiteHandoffUrl",
 code+";return {buildWebsiteDraft,applyWebsiteLayoutChange,renderWebsiteHtml,applyWebsitePageChange};"
)(management.syncWebsitePageModel,designForWebsite,designCss,planWebsiteDesign,reviewWebsiteDesign,applyWebsiteVisualEdit,editWebsiteDraftField,canonicalWebsiteHandoffUrl);
const photo={id:"p1",approved:true,uri:"https://media.example.test/private/rose.jpg",
 storagePath:"business/camera/rose.jpg",alt:"Owner photograph"};
const photo2={id:"p2",approved:true,uri:"https://media.example.test/private/ivy.jpg",
 storagePath:"business/camera/ivy.jpg",alt:"Owner photo 2"};
const brief={websiteReady:true,websiteBrief:{
 businessName:"Fictional Ivy Gardens",businessType:"Garden design",
 tagline:"Gardens with individual character",description:"Private fictional business.",
 about:"We design beautiful gardens.",
 phone:"01234 567890",email:"owner@example.test",serviceArea:"Devon",
 services:[{id:"plan",name:"Garden plan",description:"A clear garden plan."}],
 photos:[photo,photo2],heroAsset:photo,
 faqs:[{id:"one",question:"Where do you work?",answer:"Across Devon."}]
}};
const first=buildWebsiteDraft({brandBrain:brief});
const old=JSON.stringify(first);
const style=(draft,sectionId,field,value)=>applyWebsiteLayoutChange(draft,
 {action:"section-style",sectionId,field,value});
const heading=style(first,"services","headingScale","large");
assert.ok(heading.applied,"Independent service heading scale applied");
assert.ok(heading.draft.html.includes('id="services" class="owner-heading-large"'));
assert.ok(!heading.draft.html.includes('<script>'));
assert.equal(JSON.stringify(first),old,"Old draft never mutated");
assert.equal(heading.draft.publicStatus,"Not published");
assert.equal(heading.draft.generation,first.generation+1);
assert.equal(heading.draft.sections.find(s=>s.id==="hero").appearance,undefined);
const centered=style(heading.draft,"services","textAlign","center");
assert.ok(centered.applied);
assert.ok(centered.draft.html.includes('class="owner-heading-large owner-align-center"'));
const spaced=style(centered.draft,"services","sectionSpacing","generous");
assert.ok(spaced.applied&&spaced.draft.html.includes("owner-space-generous"));
const cropped=style(spaced.draft,"hero","photoCrop","top");
assert.ok(cropped.applied&&cropped.draft.html.includes("owner-crop-top"));
const gallerySize=style(cropped.draft,"gallery","gallerySize","large");
assert.ok(gallerySize.applied&&gallerySize.draft.html.includes("owner-gallery-large"));
const reset=applyWebsiteLayoutChange(gallerySize.draft,{action:"reset-section-style",sectionId:"services"});
assert.ok(reset.applied);
assert.equal(reset.draft.sections.find(s=>s.id==="services").appearance,undefined);
assert.ok(!reset.draft.html.includes('id="services" class="owner-heading-large"'),"Services reset removes the class while shared CSS stays available");
assert.ok(reset.draft.html.includes("owner-gallery-large"),"Reset affects selected section only");
const noChange=style(centered.draft,"services","textAlign","center");
assert.ok(!noChange.applied);
const defaultChoice=style(centered.draft,"services","textAlign","left");
assert.ok(defaultChoice.applied);
assert.ok(!defaultChoice.draft.html.includes('id="services" class="owner-heading-large owner-align-center"'),"Resetting alignment does not erase shared global CSS");
assert.ok(defaultChoice.draft.html.includes("owner-heading-large"));
for(const [sectionId,field,value] of [
 ["missing","textAlign","center"],
 ["services","textAlign","right"],
 ["hero","photoSide","right"],
 ["about","photoCrop","top"],
 ["gallery","gallerySize","gigantic"],
 ["services","__proto__","toString"],
 ["gallery","headingScale","<script>alert(1)</script>"],
 ["hero","sectionSpacing","25px"],
 ["services","photoCrop","top"]
]){
 const result=style(first,sectionId,field,value);
 assert.ok(!result.applied,"Unsupported style must not mutate: "+field+" "+value);
 assert.equal(result.draft,first);
}
const feature=applyWebsitePageChange(first,{action:"create-page",title:"Our gardeners",body:"A friendly local team."});
assert.ok(feature.applied);
const featureAdded=applyWebsitePageChange(feature.draft,{action:"add-photo-feature",
 pageId:feature.draft.customPages[0].id,title:"Owner photo",body:"A garden detail.",
 storagePath:photo.storagePath});
assert.ok(featureAdded.applied,"Owner photo section created from approved gallery");
const block=featureAdded.draft.sections.find(s=>s.type==="photo-feature");
const right=style(featureAdded.draft,block.id,"photoSide","right");
assert.ok(right.applied);
const output=renderWebsiteHtml(right.draft,featureAdded.draft.customPages[0].id);
assert.ok(output.includes("owner-photo-right"));
assert.ok(output.includes("photo-feature-grid"));
const rebuilt=buildWebsiteDraft({brandBrain:brief,previousDraft:right.draft});
assert.equal(rebuilt.sections.find(s=>s.id===block.id).appearance.photoSide,"right",
 "Custom page block styling survives business fact refresh");
const rebuiltGallery=buildWebsiteDraft({brandBrain:brief,previousDraft:gallerySize.draft});
assert.equal(rebuiltGallery.sections.find(s=>s.id==="gallery").appearance.gallerySize,"large",
 "Default page styling survives Brand Brain factual rebuild");
assert.equal(rebuiltGallery.sections.find(s=>s.id==="hero").appearance.photoCrop,"top",
 "Hero photo positioning preserved");
// Voice and typed commands must resolve one exact section, never an ambiguous "that".
const spokenHeading=applyWebsiteVisualEdit(first,"make the services heading larger");
assert.ok(spokenHeading.applied&&spokenHeading.draft.sections.find(s=>s.id==="services").appearance.headingScale==="large");
const spokenCentre=applyWebsiteVisualEdit(first,"centre the about section");
assert.ok(spokenCentre.applied&&spokenCentre.draft.sections.find(s=>s.id==="about").appearance.textAlign==="center");
const spokenGallery=applyWebsiteVisualEdit(first,"make gallery photos bigger");
assert.ok(spokenGallery.applied&&spokenGallery.draft.sections.find(s=>s.id==="gallery").appearance.gallerySize==="large");
const spokenSpacing=applyWebsiteVisualEdit(first,"give the contact section more space");
assert.ok(spokenSpacing.applied&&spokenSpacing.draft.sections.find(s=>s.id==="contact").appearance.sectionSpacing==="generous");
const spokenNoGuess=applyWebsiteVisualEdit(first,"centre that section");
assert.equal(spokenNoGuess.applied,false,"Deictic selection must not be guessed");
assert.equal(JSON.stringify(first),old,"Voice instructions never modify their source draft");
const css=designCss(designForWebsite({businessType:"Garden design"}));
for(const token of ["owner-heading-large","owner-heading-compact","owner-align-center",
 "owner-space-compact","owner-space-generous","owner-photo-right","owner-crop-top",
 "owner-crop-bottom","owner-gallery-large","owner-gallery-compact"]){
 assert.ok(css.includes(token),"Shared responsive CSS provides "+token);
}
assert.ok(css.includes("@media(max-width:800px)"),"Responsive CSS available");
assert.ok(css.includes("section.owner-photo-right .photo-feature-grid img"),"Photo side CSS uses section scope");
const worker=read("supabase/functions/busy-website-worker/index.ts");
assert.ok(worker.includes("function sectionAppearanceClasses(section: any)"));
assert.ok(worker.includes('const sectionClasses=sectionAppearanceClasses(section);'));
for(const part of [
 'class="hero hero-${escapeHtml(theme.heroSize||"large")} ${image?"hero-with-image":"hero-no-image"}${sectionClasses?',
 'id="gallery"${sectionAttrs}',
 'id="services"${sectionAttrs}',
 'id="contact"${sectionAttrs}',
 'class="photo-feature${sectionClasses?'
]) assert.ok(worker.includes(part),"Worker honours section presentation: "+part);
const screen=read("src/screens/websiteTapEditor.js");
assert.ok(screen.includes('onLayoutChange?.(change)'));
assert.ok(screen.includes('action:"section-style"'));
assert.ok(screen.includes('action:"reset-section-style"'));
assert.ok(!screen.includes("fetch(")&&!screen.includes("publishWebsite"),"Section styling does not perform network/publish calls");
const controller=read("src/app/AppController.js");
assert.ok(controller.includes("const applyWebsiteLayoutAction")&&controller.includes("setWebsiteRedo([])"));
console.log("V3.139 PASS: section-specific design, source/hosted style parity, media controls, repeatable revisions, private undo/redo, regeneration and no raw CSS.");
