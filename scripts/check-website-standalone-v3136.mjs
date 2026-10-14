import {websiteBuilderTestHarnessV3222} from "./lib/website-builder-test-harness-v3222.mjs";
import assert from "node:assert/strict";
import {mkdirSync,writeFileSync,readFileSync} from "node:fs";
import {makeWebsiteZip,zipPath,crc32} from "../src/core/websiteZipArchive.mjs";
import {buildStandaloneWebsiteArchive,archiveRequirements,mimeFromBytes} from "../src/core/websiteStandaloneArchive.mjs";
import {editWebsitePages} from "../supabase/functions/busy-website-worker/websitePageEditing.mjs";
import {planWebsiteDesign} from "../supabase/functions/busy-website-worker/designPlanner.mjs";
import {designForWebsite,designCss} from "../supabase/functions/busy-website-worker/designSystem.mjs";
import {reviewWebsiteDesign} from "../supabase/functions/busy-website-worker/designReview.mjs";
import {applyWebsiteVisualEdit} from "../supabase/functions/busy-website-worker/designEdits.mjs";
import {editWebsiteDraftField} from "../src/core/websiteStructuredEditing.mjs";
import {canonicalWebsiteHandoffUrl} from "../src/core/websiteAppHandoffV3214.mjs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const {buildWebsiteDraft,renderWebsiteHtml,applyWebsitePageChange,applyStructuredWebsiteEdit}=websiteBuilderTestHarnessV3222(["buildWebsiteDraft","renderWebsiteHtml","applyWebsitePageChange","applyStructuredWebsiteEdit"]);

let assertions=0;
const yes=(v,m)=>{assert.ok(v,m);assertions++};
const eq=(a,b,m)=>{assert.deepEqual(a,b,m);assertions++};
const png=new Uint8Array(Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGNIWeUGAALKAVUd7qGdAAAAAElFTkSuQmCC","base64"));
const asset={id:"flower",key:"flower",storagePath:"fictional-private/photos/flower.png",uri:"file:///private/flower.png",approved:true,alt:"Roses in the garden"};
const site=buildWebsiteDraft({brandBrain:{websiteReady:true,websiteBrief:{
 businessName:"Meadow Fictional Florists",businessType:"Florist",
 serviceArea:"Devon",tagline:"Flowers for important moments.",
 phone:"01392 000100",email:"hello@example.test",
 services:[{id:"bouquets",name:"Flower bouquets",description:"Our hand-made bouquets."}],
 photos:[asset],heroAsset:asset,
 about:"Fictional local team arranging flowers for events."
}}});
const p=applyWebsitePageChange(site,{action:"create-page",title:"Meet our makers",body:"Every bouquet is prepared with care."});
yes(p.applied,"Owner creates an independent page");
const page=p.draft.customPages[0];
const feature=applyWebsitePageChange(p.draft,{action:"add-photo-feature",pageId:page.id,
 title:"A little about our flowers",body:"We prepare each flower arrangement with care.",
 storagePath:asset.storagePath});
yes(feature.applied,"Owner can add verified gallery photo block");
const photoFeature=feature.draft.sections.find(s=>s.type==="photo-feature");
yes(photoFeature?.asset?.storagePath===asset.storagePath,"Feature inherits approved owner photo");
yes(renderWebsiteHtml(feature.draft,page.id).includes("photo-feature-grid"),"Feature uses responsive renderer");
yes(designCss(designForWebsite()).includes(".photo-feature-grid"),"Real photo CSS shared with worker");
const edited=applyStructuredWebsiteEdit(feature.draft,{sectionId:photoFeature.id,field:"body",
 value:"Beautiful flowers arranged with care."});
yes(edited.applied,"Direct editing works on owner photo block");
const draft=edited.draft;
const prior=JSON.stringify(draft);
const ready=archiveRequirements(draft);
yes(ready.ok,"Ready to export a complete owner-managed multi-page website");
eq(ready.assets.length,1,"One original photograph is deduplicated across hero/gallery/photo block");
const noReader=await buildStandaloneWebsiteArchive(draft,{renderPage:renderWebsiteHtml});
yes(!noReader.ok,"Cannot export silently without a media reader");
const missing=await buildStandaloneWebsiteArchive(draft,{renderPage:renderWebsiteHtml,
 readPhoto:async()=>{throw Error("Missing local original.");}});
yes(!missing.ok&&missing.missingPhoto===1,"Missing approved original blocks ZIP instead of broken images");
const oversized=await buildStandaloneWebsiteArchive(draft,{renderPage:renderWebsiteHtml,
 readPhoto:async()=>new Uint8Array(10*1024*1024)});
yes(!oversized.ok,"Oversized picture rejected");
const notImage=await buildStandaloneWebsiteArchive(draft,{renderPage:renderWebsiteHtml,
 readPhoto:async()=>new Uint8Array([60,115,99,114,105,112,116,62])});
yes(!notImage.ok,"Executable or fake media rejected even with .png extension");
const unapproved={...draft,sections:draft.sections.map(s=>s.id==="gallery"?{
 ...s,items:[{...asset,approved:false}]
}:s)};
yes(!archiveRequirements(unapproved).ok,"Explicitly unapproved gallery photo cannot export");
const success=await buildStandaloneWebsiteArchive(draft,{renderPage:renderWebsiteHtml,
 readPhoto:async()=>png});
yes(success.ok,"Actual archive produced");
yes(success.bytes instanceof Uint8Array&&success.bytes[0]===0x50&&success.bytes[1]===0x4b,"ZIP magic verified");
eq(success.photos,1,"Deduplicated approved photograph bundled once");
eq(success.pages,draft.pages.filter(s=>s.enabled!==false).length,"All generated pages included");
eq(JSON.stringify(draft),prior,"Export never mutates the owner's private draft");
for(const unsafe of ["../secrets.env","/etc/passwd","evil\\image.jpg","pages/../index.html","x//y.jpg"]){
 assert.throws(()=>zipPath(unsafe));assertions++;
}
assert.throws(()=>makeWebsiteZip([{path:"index.html",content:"1"},{path:"index.html",content:"2"}]));assertions++;
assert.throws(()=>makeWebsiteZip([{path:"a.jpg",content:new Uint8Array(13*1024*1024)}]));assertions++;
eq(mimeFromBytes(png),"png","Magic signature used rather than filename");
eq(crc32(new TextEncoder().encode("123456789")),0xcbf43926,"ZIP CRC32 matches ISO reference value");
const worker=read("supabase/functions/busy-website-worker/index.ts");
const controller=read("src/app/AppController.js");
const screens=read("src/screens/websitePagesEditor.js")+read("src/screens/websiteBuilder.js");
for(const marker of ['section?.type === "photo-feature"','section.type === "photo-feature"','photo-feature-grid']){
 yes(worker.includes(marker),"Hosted renderer, assets and responsive photo block: "+marker);
}
yes(worker.includes("collectAssetRefs"),"Hosted engine already collects source media for asset packaging");
yes(controller.includes("const shareStandaloneWebsiteZip=async")&&controller.includes("new ExpoFile(ExpoPaths.cache"),
 "Native export writes bytes to actual file location before share");
yes(controller.includes("readOriginalPhoto")&&controller.includes("source.bytes()"),"Native media loader reads real local original bytes");
yes(controller.includes('! /^(?:file')===false,"No accidental unsupported URL reader implementation");
yes(controller.includes("onShareZip")===false&&screens.includes("onShareZip"),"Customer-initiated exporter controlled by page UI");
yes(read("src/core/websiteStandaloneArchive.mjs").includes("readPhoto")&&
 !read("src/core/websiteStandaloneArchive.mjs").includes("fetch("),
 "Zip compiler performs no unapproved remote fetches");
yes(read(".github/workflows/production-check.yml").includes("check-website-standalone-v3136.mjs"),"Future sweeps retain ZIP validation gates");
mkdirSync("/tmp/busy-v3136-zip",{recursive:true});
writeFileSync("/tmp/busy-v3136-zip/website.zip",success.bytes);
console.log("V3.136 STANDALONE ZIP PASS:",assertions,
 "actual ZIP bytes, approved original media, private customer pages, photo feature, no silent omissions or unsafe paths");
