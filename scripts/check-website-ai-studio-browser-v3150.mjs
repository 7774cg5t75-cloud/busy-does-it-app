import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {chromium} from "playwright";
import {previewWebsiteAIStudio} from "../src/core/websiteAIStudio.mjs";
import {normalizeVisualCritique} from "../supabase/functions/busy-website-worker/visualCriticContract.mjs";
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
const {buildWebsiteDraft,rebuildPrivateWebsiteDraft,renderWebsiteHtml}=Function(
 "syncWebsitePageModel","designForWebsite","designCss","planWebsiteDesign","reviewWebsiteDesign",
 "applyWebsiteVisualEdit","editWebsiteDraftField",
 src+";return {buildWebsiteDraft,rebuildPrivateWebsiteDraft:withHtml,renderWebsiteHtml};"
)(management.syncWebsitePageModel,designForWebsite,designCss,planWebsiteDesign,reviewWebsiteDesign,applyWebsiteVisualEdit,editWebsiteDraftField);
const draft=buildWebsiteDraft({brandBrain:{websiteReady:true,websiteBrief:{
 businessName:"Local Repairs",businessType:"Electrician",description:"Local repairs and installations",
 about:"We help with repairs and small installations around Devon.",
 phone:"01392 000000",services:[
 {id:"repair",name:"Electrical repairs",description:"Repairing minor faults"},
 {id:"install",name:"Lighting installation",description:"Installing indoor lights"}]
}}});
const before=JSON.stringify(draft);
const review=normalizeVisualCritique({reviewedScreenshots:true,summary:"Improve hierarchy",
 proposals:[{path:"theme.cardLayout",value:"rows",reason:"Clear service rows"},
 {path:"theme.spacing",value:"generous",reason:"More breathing room"}]},{approvedPhotos:0});
const preview=previewWebsiteAIStudio(draft,{
 draftId:draft.id,sourceGeneration:draft.generation,pageId:"home",
 deploymentId:"trusted-preview",reviewDeploymentId:"trusted-preview",report:review
},{rebuild:rebuildPrivateWebsiteDraft,render:renderWebsiteHtml});
assert.ok(preview.ok,preview.reason);
assert.ok(preview.candidates.length>=1);
assert.equal(JSON.stringify(draft),before,"Owner site untouched");
const browser=await chromium.launch({headless:true});
try{
 for(const width of [390,1440]){
  const page=await browser.newPage({viewport:{width,height:800}});
  for(const html of [preview.originalHtml,...preview.candidates.map(x=>x.html)]){
   await page.setContent(html,{waitUntil:"load"});
   const stats=await page.evaluate(()=>({viewport:innerWidth,
    overflow:document.documentElement.scrollWidth>innerWidth+2,
    scripts:document.scripts.length,site:document.querySelector("main")!==null}));
   assert.equal(stats.viewport,width);
   assert.equal(stats.scripts,0);
   assert.equal(stats.overflow,false,"No side scrolling at "+width);
   assert.ok(stats.site);
   assert.ok((await page.screenshot({type:"png"})).length>1000);
  }
  await page.close();
 }
 console.log("V3.150 STUDIO BROWSER PASS: original and automated screenshot-AI-driven private design variations render without overflow at phone and desktop.");
}finally{await browser.close();}
