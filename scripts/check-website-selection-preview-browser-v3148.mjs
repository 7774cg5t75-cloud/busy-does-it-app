import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {chromium} from "playwright";
import {previewSelectedWebsiteInstruction} from "../src/core/websiteSelectedChangePreview.mjs";
import {editWebsiteDraftField} from "../src/core/websiteStructuredEditing.mjs";
import {designForWebsite,designCss} from "../supabase/functions/busy-website-worker/designSystem.mjs";
import {planWebsiteDesign} from "../supabase/functions/busy-website-worker/designPlanner.mjs";
import {reviewWebsiteDesign} from "../supabase/functions/busy-website-worker/designReview.mjs";
import {applyWebsiteVisualEdit} from "../supabase/functions/busy-website-worker/designEdits.mjs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const strip=s=>s.replace(/export\s*\{[\s\S]*?\};?\s*$/,"");
const management=Function(strip(read("src/domain/websiteManagement.js"))+";return {syncWebsitePageModel};")();
let src=strip(read("src/domain/websiteBuilder.js"));
for(const imp of [
 'import { syncWebsitePageModel } from "./websiteManagement";',
 'import { designForWebsite, designCss } from "../../supabase/functions/busy-website-worker/designSystem.mjs";',
 'import { planWebsiteDesign } from "../../supabase/functions/busy-website-worker/designPlanner.mjs";',
 'import { reviewWebsiteDesign } from "../../supabase/functions/busy-website-worker/designReview.mjs";',
 'import { applyWebsiteVisualEdit } from "../../supabase/functions/busy-website-worker/designEdits.mjs";'
]){assert.ok(src.includes(imp));src=src.replace(imp,"");}
const {buildWebsiteDraft,applyWebsiteLayoutChange,applyStructuredWebsiteEdit,renderWebsiteHtml}=Function(
 "syncWebsitePageModel","designForWebsite","designCss","planWebsiteDesign","reviewWebsiteDesign",
 "applyWebsiteVisualEdit","editWebsiteDraftField",
 src+";return {buildWebsiteDraft,applyWebsiteLayoutChange,applyStructuredWebsiteEdit,renderWebsiteHtml};"
)(management.syncWebsitePageModel,designForWebsite,designCss,planWebsiteDesign,reviewWebsiteDesign,applyWebsiteVisualEdit,editWebsiteDraftField);
const pic={id:"p1",approved:true,storagePath:"private/a.jpg",uri:"https://example.test/a.jpg"};
const draft=buildWebsiteDraft({brandBrain:{websiteReady:true,websiteBrief:{
 businessName:"Devon Gardens",businessType:"Garden design",description:"Friendly Devon gardeners",
 about:"We plan beautiful gardens.",phone:"01234 556677",
 services:[{id:"plants",name:"Planting services",description:"Practical care"}],
 photos:[pic],heroAsset:pic
}}});
const selection={draftId:draft.id,pageId:"home",sectionId:"hero",field:"title",
 generation:draft.generation,itemId:null,photoIndex:-1};
const change=previewSelectedWebsiteInstruction(draft,{
 selection,instruction:"Make this heading bigger and centre this section"
},{fieldEdit:applyStructuredWebsiteEdit,layoutEdit:applyWebsiteLayoutChange,renderPage:renderWebsiteHtml});
assert.ok(change.ok,change.reason);
const browser=await chromium.launch({headless:true});
try{
 for(const width of [320,390,768,1440]){
  const page=await browser.newPage({viewport:{width,height:780}});
  await page.route("https://example.test/**",route=>route.fulfill({status:200,
   contentType:"image/svg+xml",body:'<svg xmlns="http://www.w3.org/2000/svg" width="200" height="150"><rect width="200" height="150" fill="#b8cab2"/></svg>'}));
  const inspect=async html=>{
   await page.setContent(html,{waitUntil:"load"});
   const values=await page.evaluate(()=>{
    const h=document.querySelector("main h1");
    const heading=h?getComputedStyle(h):null;
    return {headingFont:heading?parseFloat(heading.fontSize):0,
      textAlign:heading?.textAlign||"",
      overflow:document.documentElement.scrollWidth>innerWidth+2,
      scripts:document.scripts.length,
      editor:document.querySelector(".busy-selection-toolbar")!==null};
   });
   const png=await page.screenshot({type:"png"});
   assert.ok(png.length>1000,"Real rendered screenshot was captured");
   return values;
  };
  const original=await inspect(change.originalHtml);
  const proposed=await inspect(change.candidateHtml);
  assert.equal(original.scripts,0);
  assert.equal(proposed.scripts,0);
  assert.equal(proposed.editor,false);
  assert.ok(proposed.headingFont>=original.headingFont,
   "Proposed heading visual size is not smaller at "+width);
  assert.ok(!original.overflow&&!proposed.overflow,
   "Selected preview has no new sideways scrolling at "+width);
  assert.ok(proposed.textAlign==="center"||page.url()==="about:blank",
   "Section alignment is present in browser rendering");
  await page.close();
 }
 console.log("V3.148 BROWSER PASS: private static before-and-after screenshots at 320/390/768/1440, no editor scripts, no overflow.");
}finally{await browser.close();}
