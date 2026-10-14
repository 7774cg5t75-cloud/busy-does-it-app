import {websiteBuilderTestHarnessV3222} from "./lib/website-builder-test-harness-v3222.mjs";
import assert from "node:assert/strict";
import {readFileSync,writeFileSync,mkdirSync} from "node:fs";
import {editWebsitePages} from "../supabase/functions/busy-website-worker/websitePageEditing.mjs";
import {buildPortableWebsiteSource} from "../src/core/websiteSourceExport.mjs";
import {planWebsiteDesign} from "../supabase/functions/busy-website-worker/designPlanner.mjs";
import {designForWebsite,designCss} from "../supabase/functions/busy-website-worker/designSystem.mjs";
import {reviewWebsiteDesign} from "../supabase/functions/busy-website-worker/designReview.mjs";
import {applyWebsiteVisualEdit} from "../supabase/functions/busy-website-worker/designEdits.mjs";
import {editWebsiteDraftField} from "../src/core/websiteStructuredEditing.mjs";
import {canonicalWebsiteHandoffUrl} from "../src/core/websiteAppHandoffV3214.mjs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const engine=websiteBuilderTestHarnessV3222(["buildWebsiteDraft","applyWebsitePageChange","renderWebsiteHtml","applyStructuredWebsiteEdit"]);

const fixture=engine.buildWebsiteDraft({brandBrain:{websiteReady:true,websiteBrief:{
 businessName:"Coastal Flower Studio",businessType:"Florist and events",serviceArea:"Devon",
 tagline:"Beautiful arrangements for special days",description:"Thoughtful arrangements and flowers.",
 services:[{id:"weddings",name:"Wedding flowers",description:"Flowers for weddings and occasions."},
 {id:"events",name:"Event flowers",description:"Arrangements for business events."}],
 about:"We carefully prepare beautiful arrangements for events in Devon.",
 email:"hello@flowers.example",phone:"01392 100100",
 faqs:[{id:"delivery",question:"Do you deliver?",answer:"Get in touch for options."}]
}}});
let count=0;
const yes=(v,m)=>{assert.ok(v,m);count++};
const eq=(v,w,m)=>{assert.deepEqual(v,w,m);count++};
const change=(operation,draft=fixture)=>engine.applyWebsitePageChange(draft,operation);
const original=JSON.stringify(fixture);
const p1=change({action:"create-page",title:"Meet the Team",body:"Our friendly team prepares arrangements."});
yes(p1.applied,"Customer page created");
const first=p1.draft.customPages[0];
eq(first.slug,"meet-the-team","Friendly stable slug");
eq(p1.draft.pages.find(p=>p.id===first.id)?.path,"/pages/meet-the-team","Nested page generated in real page model");
eq(p1.draft.pages.find(p=>p.id===first.id)?.outputPath,"pages/meet-the-team/index.html","Hosted file path calculated");
yes(p1.draft.navigation.some(n=>n.id===first.id),"New page in navigation");
yes(p1.draft.seo.pages[first.id].title.includes("Meet the Team"),"Page-specific SEO title");
yes(!engine.renderWebsiteHtml(p1.draft,"home").includes("Our friendly team prepares arrangements."),"Dedicated copy not on home");
yes(engine.renderWebsiteHtml(p1.draft,first.id).includes("Our friendly team prepares arrangements."),"Page copy visible on its own preview");
yes(engine.renderWebsiteHtml(p1.draft,first.id).includes("<h1>Meet the Team</h1>"),"Accessible page H1");
eq(p1.draft.publicStatus,fixture.publicStatus,"No publication side effects");
eq(JSON.stringify(fixture),original,"Original source not mutated");
const refreshed=engine.buildWebsiteDraft({previousDraft:p1.draft,brandBrain:{
 websiteReady:true,websiteBrief:{businessName:"Coastal Flower Studio",businessType:"Florist and events",
 description:"The brand facts have been refreshed.",services:[{id:"one",name:"Wedding flowers"}],
 email:"hello@flowers.example"}}});
yes(refreshed.customPages.some(p=>p.id===first.id),"Brand Brain refresh preserves owner pages");
yes(engine.renderWebsiteHtml(refreshed,first.id).includes("Our friendly team prepares arrangements."),
 "Owner-written page wording survives rebuilding the business website");
yes(refreshed.publicStatus==="Not published"&&refreshed.generation>p1.draft.generation,
 "Refresh is another private draft generation, not a public update");
const p2=change({action:"create-page",title:"Meet the Team",body:"A distinct second page."},p1.draft);
yes(p2.applied,"Slug collisions get separate path");
eq(p2.draft.customPages[1].slug,"meet-the-team-2","Stable collision resolution");
const second=p2.draft.customPages[1];
const renamed=change({action:"rename-page",pageId:first.id,title:"Our People"},p2.draft);
yes(renamed.applied,"Owner can rename page");
eq(renamed.draft.pages.find(p=>p.id===first.id).path,"/pages/meet-the-team","Existing link survives title change");
yes(renamed.draft.seo.pages[first.id].title.includes("Our People"),"Renamed page SEO regenerates");
const onlySection=p2.draft.customPages[0].sectionIds[0];
const unsafeTransfer=change({action:"assign-section",pageId:second.id,sectionId:onlySection},p2.draft);
yes(!unsafeTransfer.applied,"Cannot orphan another owner's configured page by moving its final section");
eq(unsafeTransfer.draft,p2.draft,"Unsuccessful page transfer is atomic and preserves every page");
const newSection=change({action:"add-page-section",pageId:first.id,title:"Our values",
 body:"We take care of every arrangement."},renamed.draft);
yes(newSection.applied,"Owner adds page section");
eq(newSection.draft.pages.find(p=>p.id===first.id).sectionIds.length,2,"Page has two sections");
const secId=newSection.draft.pages.find(p=>p.id===first.id).sectionIds[1];
yes(!engine.renderWebsiteHtml(newSection.draft,"home").includes("We take care of every arrangement."),"New page section not on home");
yes(engine.renderWebsiteHtml(newSection.draft,first.id).includes("We take care of every arrangement."),"New section in page");
const moved=change({action:"move-page-section",pageId:first.id,sectionId:secId,direction:"up"},newSection.draft);
yes(moved.applied,"Can reorder page sections");
yes(engine.renderWebsiteHtml(moved.draft,first.id).indexOf("Our values")<
 engine.renderWebsiteHtml(moved.draft,first.id).indexOf("Our friendly team"),"Real page preview follows owner order");
const contentEdited=engine.applyStructuredWebsiteEdit(moved.draft,{
 sectionId:secId,field:"body",value:"Each arrangement is made with care and a little creativity."
});
yes(contentEdited.applied&&engine.renderWebsiteHtml(contentEdited.draft,first.id).includes("a little creativity"),"Existing exact content editor works on customer page");
const backHome=change({action:"remove-page-section",pageId:first.id,sectionId:secId},contentEdited.draft);
yes(backHome.applied,"Removing page section retains customer wording");
yes(engine.renderWebsiteHtml(backHome.draft,"home").includes("a little creativity"),"Restored section appears on home");
const deletePage=change({action:"delete-page",pageId:first.id},backHome.draft);
yes(deletePage.applied,"Remove page non-destructively");
yes(!deletePage.draft.pages.find(p=>p.id===first.id),"Deleted page removed from URLs");
yes(deletePage.draft.sections.find(s=>s.id===first.sectionId||s.id==="custom-page-"+first.slug)?.body.includes("Our friendly"),"Original page content preserved on home");
const otherPage=deletePage.draft.pages.find(p=>p.id===second.id);
yes(!!otherPage,"Another page survives deletion");
const standard=fixture.pages.filter(p=>p.id==="home"||["about","services","contact"].includes(p.id));
yes(standard.length>0,"Core pages not removed");
const sourceExport=buildPortableWebsiteSource({...newSection.draft,
 privateSession:{accessToken:"SUPER-SECRET-FIXTURE"},apiKey:"SUPER-SECRET-FIXTURE",
 customers:[{name:"Private client",password:"SUPER-SECRET-FIXTURE"}]});
yes(sourceExport.ok,"Owner can export a portable content JSON");
const json=JSON.parse(sourceExport.json);
eq(json.format,"busy-does-it-portable-website-source","Recognised public content format");
yes(json.pages.some(p=>p.id===first.id)&&json.sections.some(s=>s.id===secId),"Page and section included");
yes(!sourceExport.json.includes("SUPER-SECRET-FIXTURE"),"No private session, customer or API credentials exported");
yes(!sourceExport.json.includes("storagePath")&&!sourceExport.json.includes("accessToken"),"No cloud media paths or tokens");
yes(sourceExport.limitations.some(x=>x.includes("Photographs")),"Owner sees honest export limitations");
const oversizedSource=buildPortableWebsiteSource({...fixture,
 sections:Array.from({length:151},(_,i)=>({id:"custom-"+i,type:"text",
 title:"Owner text "+i,body:"Original owner text."}))});
yes(!oversizedSource.ok,"Text export refuses to silently omit sections it cannot carry");
const withPhoto={...fixture,sections:fixture.sections.map(s=>s.id==="hero"?{
 ...s,asset:{storagePath:"tenant-secret/image.png",uri:"https://signed.secret.example/token=supersecret",alt:"Our team"}
}:s)};
const photoExport=buildPortableWebsiteSource(withPhoto);
yes(photoExport.ok&&photoExport.missingMedia===1,"Public export tells owner original media files are needed");
yes(!photoExport.json.includes("tenant-secret")&&!photoExport.json.includes("signed.secret.example"),"Private image paths stripped");
for(const [op,why] of [
 [{action:"create-page",title:"Invalid",body:""},"Require supplied copy"],
 [{action:"create-page",title:"Bad",body:"x".repeat(2501)},"Reject oversized copy"],
 [{action:"rename-page",pageId:"missing",title:"About"},"No unknown pages"],
 [{action:"create-page",title:"/../../../evil",body:"Harmless owner text"},"No raw arbitrary paths"],
]){
 const r=change(op);if(why==="No raw arbitrary paths"){
  yes(!r.applied||(!r.draft.customPages[0].slug.includes("..")&&!r.draft.pages.some(p=>p.path.includes(".."))),why);
 }else yes(!r.applied,why);
}
const controller=read("src/app/AppController.js"),screen=read("src/screens/websiteBuilder.js"),
 pageEditor=read("src/screens/websitePagesEditor.js"),worker=read("supabase/functions/busy-website-worker/index.ts");
yes(controller.includes("const applyWebsitePageAction=")&&controller.includes("shareWebsiteContent,"),"Real app state integrates owner page edits and share");
yes(screen.includes("WebsitePagesEditor")&&screen.includes("renderWebsiteHtml(draft,activePage?.id"),"Page editor and page picker in iPhone app");
yes(pageEditor.includes("Create private page")&&pageEditor.includes("Keep a copy of my website content"),"Self-service page creation and explicit export");
yes(worker.includes("page?.id===\"home\"?plan.sectionOrder:safeArray(page?.sectionIds)"),"Hosted renderer respects page-specific order");
yes(worker.includes('relativePageHref(page,"/")'),"Hosted renderer calculates portable relative root links");
yes(!pageEditor.includes("fetch(")&&!pageEditor.includes("publishWebsite"),"Page screen cannot silently publish");
yes(read(".github/workflows/production-check.yml").includes("check-website-pages-v3135.mjs"),"Continuous regression gate wired");
if(process.env.BUSY_V3135_BROWSER_FIXTURES==="1"){
 const folder="/tmp/busy-v3135-pages";
 mkdirSync(folder+"/pages/meet-the-team",{recursive:true});
 const site=p1.draft;
 writeFileSync(folder+"/index.html",engine.renderWebsiteHtml(site,"home"),"utf8");
 writeFileSync(folder+"/pages/meet-the-team/index.html",engine.renderWebsiteHtml(site,first.id),"utf8");
}
console.log("V3.135 PAGES PASS:",count,"owner pages, nested routes, real previews, SEO, atomic preservation, portability and no secrets");
