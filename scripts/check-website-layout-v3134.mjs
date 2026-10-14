import {websiteBuilderTestHarnessV3222} from "./lib/website-builder-test-harness-v3222.mjs";
import assert from "node:assert/strict";
import {readFileSync,writeFileSync,mkdirSync} from "node:fs";
import {applyWebsiteLayoutOperation} from "../supabase/functions/busy-website-worker/websiteLayoutEditing.mjs";
import {planWebsiteDesign} from "../supabase/functions/busy-website-worker/designPlanner.mjs";
import {designForWebsite,designCss} from "../supabase/functions/busy-website-worker/designSystem.mjs";
import {reviewWebsiteDesign} from "../supabase/functions/busy-website-worker/designReview.mjs";
import {applyWebsiteVisualEdit} from "../supabase/functions/busy-website-worker/designEdits.mjs";
import {editWebsiteDraftField} from "../src/core/websiteStructuredEditing.mjs";
import {canonicalWebsiteHandoffUrl} from "../src/core/websiteAppHandoffV3214.mjs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const engine=websiteBuilderTestHarnessV3222(["buildWebsiteDraft","applyWebsiteInstruction","applyWebsiteLayoutChange","applyStructuredWebsiteEdit"]);

const site=engine.buildWebsiteDraft({brandBrain:{websiteReady:true,websiteBrief:{
 businessName:"Hillside Fictional Gardens",businessType:"Gardening",
 tagline:"Reliable garden visits and hedge care",description:"Outdoor maintenance for fictional clients.",
 phone:"01392 000100",email:"hello@example.test",about:"Our team visits gardens.",
 services:[{id:"lawn",name:"Lawn care",description:"Regular visits for garden care."},
 {id:"hedges",name:"Hedge trimming",description:"Trim and tidy your hedges."}],
}}});
let assertions=0;
const yes=(v,name)=>{assert.ok(v,name);assertions++};
const equal=(v,w,name)=>{assert.deepEqual(v,w,name);assertions++};
const edit=(patch,draft=site)=>engine.applyWebsiteLayoutChange(draft,patch);
const original=JSON.stringify(site);
const added=edit({action:"add-text",title:"Garden tips",body:"We can share practical care tips."});
yes(added.applied,"Add owner-written section");
yes(added.draft.sections.some(s=>s.title==="Garden tips"),"New section saved");
yes(added.draft.html.includes("Garden tips"),"New section in generated HTML");
const newId=added.draft.sections.find(s=>s.title==="Garden tips").id;
yes(added.draft.designPlan.homeSectionIds.includes(newId),"Custom owner-written section exists on hosted multi-page home selection");
equal(added.draft.generation,site.generation+1,"Private version incremented");
equal(added.draft.publicStatus,"Not published","Still private");
equal(JSON.stringify(site),original,"Source site was not mutated");
yes(added.draft.designReview?.checks?.length>0,"Quality review regenerated");
const dup=edit({action:"duplicate",sectionId:newId},added.draft);
yes(dup.applied,"Duplicate owner content block");
const twin=dup.draft.sections.find(s=>s.id!==newId&&s.title==="Garden tips (copy)");
yes(!!twin&&twin.id.startsWith("custom-")&&twin.id!==newId,"Duplicated block has unique ID");
yes(dup.draft.html.includes("Garden tips (copy)"),"Duplicated section rendered");
yes(dup.draft.designPlan.sectionOrder.indexOf(twin.id)===dup.draft.designPlan.sectionOrder.indexOf(newId)+1,"Copied section appears after original");
const moved=edit({action:"move",sectionId:twin.id,direction:"up"},dup.draft);
yes(moved.applied,"Owner can move custom section");
yes(moved.draft.designPlan.sectionOrder.indexOf(twin.id)<moved.draft.designPlan.sectionOrder.indexOf(newId),"Real ordered website changes");
yes(moved.draft.html.indexOf("Garden tips (copy)")<moved.draft.html.indexOf('id="'+newId+'"'),"HTML respects moved order");
const hidden=edit({action:"hide",sectionId:newId},moved.draft);
yes(hidden.applied,"Hide without deleting business text");
yes(!hidden.draft.html.includes('id="'+newId+'"'),"Hidden section absent from preview");
yes(hidden.draft.sections.some(s=>s.id===newId&&s.body.includes("practical")),"Hidden text preserved");
const shown=edit({action:"show",sectionId:newId},hidden.draft);
yes(shown.applied,"Restore previously hidden section");
yes(shown.draft.html.includes('id="'+newId+'"'),"Restored content visible again");
const deleted=edit({action:"delete",sectionId:twin.id},shown.draft);
yes(deleted.applied,"Delete explicit custom copy");
yes(!deleted.draft.sections.some(s=>s.id===twin.id),"Deleted extra block gone");
yes(!deleted.draft.designPlan.sectionOrder.includes(twin.id),"No dead section reference");

for(const [change,why] of [
 [{action:"delete",sectionId:"hero"},"Never delete hero"],
 [{action:"delete",sectionId:"services"},"Never delete core services"],
 [{action:"hide",sectionId:"contact"},"Contact stays available"],
 [{action:"hide",sectionId:"hero"},"Hero stays available"],
 [{action:"move",sectionId:"hero",direction:"down"},"Hero pinned"],
 [{action:"move",sectionId:"missing",direction:"up"},"Invalid target rejected"],
 [{action:"move",sectionId:"about",direction:"left"},"Unsupported direction rejected"],
 [{action:"duplicate",sectionId:"testimonials"},"No fake reviews copied"],
 [{action:"duplicate",sectionId:"hero"},"No second hero"],
 [{action:"add-text",title:"",body:"Valid text"},"No blank heading"],
 [{action:"add-text",title:"Extra",body:""},"No empty invented section"],
 [{action:"add-text",title:"Bad",body:"x".repeat(2600)},"Bounded literal copy"],
 [{action:"style",field:"fontFamily",value:"http://malicious.example"},"No downloaded arbitrary fonts"],
 [{action:"style",field:"typography",value:"url(javascript:bad)"},"No CSS injection"],
 [{action:"style",field:"spacing",value:"300vh"},"Reject arbitrary spacing"],
 [{action:"choose-hero-photo",storagePath:"another-tenant/image.jpg"},"No foreign image path"],
 [{action:"style",field:"photoFocus",value:"top"},"No photo crop without owned photo"],
]){
 const x=edit(change);yes(!x.applied,why);equal(x.draft,site,why+" preserves draft");
}
for(const [field,value,classMarker] of [
 ["typography","refined","visual-type-refined"],
 ["spacing","generous","rhythm-generous"],
 ["spacing","compact","rhythm-compact"],
 ["cardLayout","rows","visual-cards-rows"],
 ["navStyle","pill","visual-nav-pill"],
 ["heroSize","extra-large","hero-extra-large"],
]){
 const x=edit({action:"style",field,value});
 yes(x.applied,"Allowed "+field+" choice "+value);
 yes(x.draft.html.includes(classMarker),"Appearance changes actual preview HTML: "+classMarker);
}
const prominent=edit({action:"style",field:"ctaEmphasis",value:"strong"});
yes(prominent.applied,"Owner can emphasise verified hero CTA");
yes(prominent.draft.html.includes("cta-strong"),"Private preview receives actual CTA class");
yes(designCss(designForWebsite()).includes(".cta-strong .hero .cta"),"Hosted and private CSS include prominent safe CTA style");
const gallerySite={...site,sections:site.sections.concat({
 id:"gallery",type:"gallery",enabled:true,title:"Our work",items:[
  {storagePath:"fictional-owner-asset/owned-image.jpg",uri:"https://photos.example.test/owned.jpg",approved:true},
  {storagePath:"fictional-owner-asset/not-approved.jpg",uri:"https://photos.example.test/unapproved.jpg",approved:false}
 ]})};
const photo=edit({action:"choose-hero-photo",storagePath:"fictional-owner-asset/owned-image.jpg"},gallerySite);
yes(photo.applied,"Approved gallery photo can be selected as hero");
equal(photo.draft.sections.find(s=>s.id==="hero").asset.storagePath,"fictional-owner-asset/owned-image.jpg","Only already owned media path stored");
yes(photo.draft.html.includes("https://photos.example.test/owned.jpg"),"Selected gallery photo visible in private HTML");
yes(!edit({action:"choose-hero-photo",storagePath:"fictional-owner-asset/not-approved.jpg"},gallerySite).applied,"Unapproved gallery image blocked");
const crop=edit({action:"style",field:"photoFocus",value:"top"},photo.draft);
yes(crop.applied,"Photo focus on real owned photo");
yes(crop.draft.html.includes("photo-focus-top"),"CSS focus class applied to hero image");
yes(designCss(designForWebsite()).includes(".photo-focus-top .hero-image"),"Photo focus styling actually compiled");

const compound=engine.applyWebsiteInstruction(site,"make website more premium; move about before services; make booking button stand out");
yes(compound.applied,"Three owner directives in one request");
yes(compound.draft.theme.mood==="premium"&&compound.draft.theme.ctaEmphasis==="strong","All independent theme effects survive");
yes(compound.draft.designPlan.sectionOrder.indexOf("about")<compound.draft.designPlan.sectionOrder.indexOf("services"),"Middle step section move retained");
equal(compound.draft.generation,site.generation+3,"Each stage creates private version, no hidden publish");
const incomplete=engine.applyWebsiteInstruction(site,"make website more premium; move made-up section before services; make booking button stand out");
yes(!incomplete.applied,"Atomic failure when second step unsupported");
equal(incomplete.draft,site,"No partial changes or side effects on failure");
const tooMany=engine.applyWebsiteInstruction(site,"make website more premium; move about before services; use a minimal design; use an editorial design; make booking button stand out");
yes(!tooMany.applied,"Explicit bound on multi-step request");
equal(tooMany.draft,site,"Many commands cannot accidentally partially apply");
const phrase=engine.applyWebsiteInstruction(site,"make website more spacious and then make booking button stand out");
yes(phrase.applied,"And-then clauses supported");
yes(phrase.draft.html.includes("rhythm-generous")&&phrase.draft.html.includes("cta-strong"),"Both clause effects visible in HTML");
equal(JSON.stringify(site),original,"All generated edits leave the original private draft unchanged");

const worker=read("supabase/functions/busy-website-worker/index.ts");
const screen=read("src/screens/websiteBuilder.js");
const controls=read("src/screens/websiteLayoutControls.js");
const controller=read("src/app/AppController.js");
for(const expected of ["photo-focus-","cta-","rhythm-"]){
 yes(worker.includes(expected),"Hosted renderer carries validated class "+expected);
 yes(read("src/domain/websiteBuilder.js").includes(expected),"Local renderer carries validated class "+expected);
}
yes(worker.includes("plan.sectionOrder"),"Hosted published renderer honours section order");
yes(screen.includes("WebsiteLayoutControls"),"Website Builder displays optional controls");
yes(controls.includes("Change layout and appearance")&&controls.includes("Duplicate this text section"),"Owners have no-code layout and duplication controls");
yes(controller.includes("applyWebsiteLayoutAction,")&&controller.includes("setWebsiteRedo([])"),"Native undo stack receives layout edits");
yes(!controls.includes("fetch(")&&!controls.includes("publishWebsite"),"Layout editor does not publish remotely");
yes(read(".github/workflows/production-check.yml").includes("check-website-layout-v3134.mjs"),"V3.134 checks enforced in production foundation CI");

// Offline, fictional HTML fixture for an actual Chromium mobile/desktop pass.
if(process.env.BUSY_V3134_EXPORT_BROWSER_FIXTURE==="1"){
 const custom=edit({action:"add-text",title:"Our approach",
   body:"This fictional business helps with local gardens."},site);
 const strong=edit({action:"style",field:"ctaEmphasis",value:"strong"},custom.draft);
 const spaced=edit({action:"style",field:"spacing",value:"generous"},strong.draft);
 assert.ok(spaced.applied,"Browser evidence fixture must be valid");
 mkdirSync("/tmp/busy-v3134-web",{recursive:true});
 writeFileSync("/tmp/busy-v3134-web/index.html",spaced.draft.html,"utf8");
}
console.log("V3.134 WEBSITE LAYOUT PASS:",assertions,"private section, HTML, custom homepage, photo provenance, CSS, atomic commands, and release-safety assertions");
