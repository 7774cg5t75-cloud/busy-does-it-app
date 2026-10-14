import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {selectedWebsiteVoiceContextIsCurrent as current} from "../src/core/websiteSelectedVoiceContext.mjs";
import {interpretSelectedWebsiteRequest} from "../src/core/websiteContextualEdit.mjs";
import {designCss,designForWebsite} from "../supabase/functions/busy-website-worker/designSystem.mjs";
import {planWebsiteDesign} from "../supabase/functions/busy-website-worker/designPlanner.mjs";
import {reviewWebsiteDesign} from "../supabase/functions/busy-website-worker/designReview.mjs";
import {applyWebsiteVisualEdit} from "../supabase/functions/busy-website-worker/designEdits.mjs";
import {editWebsiteDraftField} from "../src/core/websiteStructuredEditing.mjs";
import {canonicalWebsiteHandoffUrl} from "../src/core/websiteAppHandoffV3214.mjs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const strip=s=>s.replace(/export\s*\{[\s\S]*?\};?\s*$/,"");
const manager=Function(strip(read("src/domain/websiteManagement.js"))+";return {syncWebsitePageModel};")();
let source=strip(read("src/domain/websiteBuilder.js"));
for(const imp of [
 'import { syncWebsitePageModel } from "./websiteManagement";',
 'import {canonicalWebsiteHandoffUrl} from "../core/websiteAppHandoffV3214.mjs";',
 'import { designForWebsite, designCss } from "../../supabase/functions/busy-website-worker/designSystem.mjs";',
 'import { planWebsiteDesign } from "../../supabase/functions/busy-website-worker/designPlanner.mjs";',
 'import { reviewWebsiteDesign } from "../../supabase/functions/busy-website-worker/designReview.mjs";',
 'import { applyWebsiteVisualEdit } from "../../supabase/functions/busy-website-worker/designEdits.mjs";'
]){assert.ok(source.includes(imp),"Old website builder import changed");source=source.replace(imp,"");}
const {buildWebsiteDraft,applyWebsiteLayoutChange,renderWebsiteHtml}=Function(
 "syncWebsitePageModel","designForWebsite","designCss","planWebsiteDesign",
 "reviewWebsiteDesign","applyWebsiteVisualEdit","editWebsiteDraftField","canonicalWebsiteHandoffUrl",
 source+";return {buildWebsiteDraft,applyWebsiteLayoutChange,renderWebsiteHtml};"
)(manager.syncWebsitePageModel,designForWebsite,designCss,planWebsiteDesign,reviewWebsiteDesign,applyWebsiteVisualEdit,editWebsiteDraftField,canonicalWebsiteHandoffUrl);
const photo=(id)=>({id,storagePath:"tenant/photos/"+id+".jpg",uri:"https://example.test/"+id+".jpg",approved:true});
const brand={websiteReady:true,websiteBrief:{
 businessName:"Example Garden Studio",businessType:"Garden design",serviceArea:"Devon",
 phone:"01111 234567",description:"Gardens for people",about:"Careful landscaping",
 services:[{id:"design",name:"Garden design",description:"Design for you"}],
 heroAsset:photo("first"),photos:[photo("first"),photo("second"),photo("third")]}};
const draft=buildWebsiteDraft({brandBrain:brand});
const selection=(sectionId,field,photoIndex=-1)=>{
 const page=draft.pages.find(page=>page.sectionIds.includes(sectionId));
 return {draftId:draft.id,pageId:page?.id,sectionId,field,
 itemId:field==="title"&&sectionId==="services"?"design":null,photoIndex,
 generation:draft.generation};
};
const heading=selection("services","title");
const image=selection("gallery","photo",1);
assert.ok(current(draft,heading),"Current exact heading, page and item accepted");
assert.ok(current(draft,image),"Current exact gallery image accepted");
assert.ok(!current(draft,{...image,draftId:"another-site"}),"Wrong website never authorizes transcription");
assert.ok(!current(draft,{...image,generation:draft.generation+1}),"Rebuilt draft invalidates voice selection");
if(!draft.pages.find(p=>p.id==="home")?.sectionIds.includes("gallery"))
 assert.equal(current(draft,{...image,pageId:"home"}),false,"Wrong page must not pass");
assert.ok(!current(draft,{...image,photoIndex:999}),"Forged image index refused");
assert.ok(!current(draft,{...heading,itemId:"unowned"}),"Other service card refused");
assert.ok(!current(draft,{...image,field:"onClick"}),"Arbitrary DOM fields refused");
assert.ok(!current(null,image),"No website means no transcription");
const crop=interpretSelectedWebsiteRequest(draft,image.pageId,image,"Crop this photo to the top");
assert.equal(crop.ok,true);
assert.equal(crop.type,"layout");
assert.equal(crop.change.action,"image-style");
assert.equal(crop.change.photoIndex,1);
const applied=applyWebsiteLayoutChange(draft,crop.change);
assert.ok(applied.applied);
const gallery=applied.draft.sections.find(s=>s.id==="gallery");
assert.equal(gallery.items[1].appearance.photoCrop,"top");
assert.equal(gallery.items[0].appearance,undefined,"Other photo unchanged");
assert.equal(gallery.items[2].appearance,undefined,"Other photo unchanged");
assert.equal(draft.sections.find(s=>s.id==="gallery").items[1].appearance,undefined,"Original draft immutable");
const page=applied.draft.pages.find(p=>p.sectionIds.includes("gallery"));
const html=renderWebsiteHtml(applied.draft,page.id);
assert.ok(html.includes('class="gallery-image owner-image-crop-top"'),"Private and ZIP HTML carry exact photo class");
assert.ok(!html.includes('class="gallery-image owner-image-crop-bottom"'));
assert.equal(applied.draft.publicStatus,"Not published");
const refreshed=buildWebsiteDraft({brandBrain:brand,previousDraft:applied.draft});
assert.equal(refreshed.sections.find(s=>s.id==="gallery").items[1].appearance.photoCrop,"top",
 "Owner crop survives business profile regeneration");
const undone=applyWebsiteLayoutChange(applied.draft,{action:"image-style",sectionId:"gallery",
 photoIndex:1,field:"photoCrop",value:"center"});
assert.ok(undone.applied);
assert.equal(undone.draft.sections.find(s=>s.id==="gallery").items[1].appearance,undefined);
for(const op of [
 {action:"image-style",sectionId:"gallery",photoIndex:0,field:"css",value:"left:0"},
 {action:"image-style",sectionId:"gallery",photoIndex:80,field:"photoCrop",value:"top"},
 {action:"image-style",sectionId:"hero",photoIndex:0,field:"photoCrop",value:"top"},
 {action:"image-style",sectionId:"gallery",photoIndex:1,field:"photoCrop",value:"javascript:bad()"}
])assert.equal(applyWebsiteLayoutChange(draft,op).applied,false,"Unsafe image-style action rejected");
const stylesheet=designCss(designForWebsite({businessType:"Garden design"}));
assert.ok(stylesheet.includes("#gallery .gallery-image.owner-image-crop-top"),"Live shared CSS supports specific photo crop");
const worker=read("supabase/functions/busy-website-worker/index.ts");
assert.ok(worker.includes('owner-image-crop-')&&worker.includes('class="gallery-image${crop}"'),
 "Hosted renderer emits same per-photo class, not only private preview");
const controller=read("src/app/AppController.js");
const screen=read("src/screens/websiteTapEditor.js");
const voice=read("src/screens/websiteSelectedVoice.js");
const preview=read("src/screens/websiteBuilder.js");
const backend=read("supabase/functions/busy-command/index.ts");
assert.ok(controller.includes("transcribeSelectedWebsiteAudio")&&
 controller.includes("selectedWebsiteVoiceContextIsCurrent(websiteDraftRef.current,selection)"));
assert.ok(controller.includes("form.append(\"mode\",\"website-selection-transcript-v1\")"));
assert.ok(controller.includes("payload.command!==null||payload.action!==null"),
 "App refuses an Operator command in place of a transcription");
assert.ok(controller.includes("if(!selectionIsCurrent())return {ok:false,error:"),
 "App revalidates selection after asynchronous transcription");
assert.ok(preview.includes("draftId:draft.id")&&preview.includes("onTranscribe={s.transcribeSelectedWebsiteAudio}"));
assert.ok(screen.includes('onTranscript={words=>')&&
 screen.includes('Please check these words carefully')&&screen.includes('Apply reviewed instruction'));
assert.ok(!voice.includes("submitBusyCommand")&&!voice.includes("executeBusyCommand"),
 "Selected voice does not route into standard Operator actions");
assert.ok(voice.includes("requestRecordingPermissionsAsync")&&voice.includes("await recorder.stop()"));
assert.ok(backend.includes('form.get("mode")==="website-selection-transcript-v1"'));
assert.ok(backend.includes("auth.auth.getUser(rawToken)")&&backend.includes("audio.size>9_000_000"));
const start=backend.indexOf('if(form.get("mode")==="website-selection-transcript-v1"');
const stop=backend.indexOf('const rawContext = cleanText(form.get("context")',start);
assert.ok(stop>start&&backend.slice(start,stop).includes("command:null")&&
 !backend.slice(start,stop).includes("routeOperator("),
 "Server verifies owner, transcribes only and returns no action/command");
assert.ok(backend.includes("[functions")===false,"Function is code, not a deployment");
console.log("V3.141 PASS: scoped voice capture and transcript review, stale auth guard, exact gallery edits, private/hosted parity, no auto-publish.");
