import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {chromium} from "playwright";
import {makeWebsiteVisualCheckHtml,reviewWebsiteVisualCheck} from "../src/core/websiteVisualCheck.mjs";
import {designForWebsite,designCss} from "../supabase/functions/busy-website-worker/designSystem.mjs";
import {planWebsiteDesign} from "../supabase/functions/busy-website-worker/designPlanner.mjs";
import {reviewWebsiteDesign} from "../supabase/functions/busy-website-worker/designReview.mjs";
import {applyWebsiteVisualEdit} from "../supabase/functions/busy-website-worker/designEdits.mjs";
import {editWebsiteDraftField} from "../src/core/websiteStructuredEditing.mjs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const strip=s=>s.replace(/export\s*\{[\s\S]*?\};?\s*$/,"");
const management=Function(strip(read("src/domain/websiteManagement.js"))+";return {syncWebsitePageModel};")();
let domain=strip(read("src/domain/websiteBuilder.js"));
for(const imp of [
 'import { syncWebsitePageModel } from "./websiteManagement";',
 'import { designForWebsite, designCss } from "../../supabase/functions/busy-website-worker/designSystem.mjs";',
 'import { planWebsiteDesign } from "../../supabase/functions/busy-website-worker/designPlanner.mjs";',
 'import { reviewWebsiteDesign } from "../../supabase/functions/busy-website-worker/designReview.mjs";',
 'import { applyWebsiteVisualEdit } from "../../supabase/functions/busy-website-worker/designEdits.mjs";'
]){assert.ok(domain.includes(imp));domain=domain.replace(imp,"");}
const {buildWebsiteDraft,renderWebsiteHtml}=Function(
 "syncWebsitePageModel","designForWebsite","designCss","planWebsiteDesign",
 "reviewWebsiteDesign","applyWebsiteVisualEdit","editWebsiteDraftField",
 domain+";return {buildWebsiteDraft,renderWebsiteHtml};"
)(management.syncWebsitePageModel,designForWebsite,designCss,planWebsiteDesign,
 reviewWebsiteDesign,applyWebsiteVisualEdit,editWebsiteDraftField);
const photograph=(id)=>({id,approved:true,storagePath:"owner/photo-"+id+".jpg",
 uri:"https://example.test/"+id+".svg",alt:"A gardening project"});
const brand={websiteReady:true,websiteBrief:{businessName:"Example Garden Studio",
 businessType:"Garden design",tagline:"Gardens for people",
 description:"Friendly local garden design.",about:"Working across Devon.",
 phone:"01234 567890",email:"gardens@example.test",
 services:[{id:"hedges",name:"Hedge maintenance",description:"Keeping hedges neat."}],
 photos:[photograph("garden1"),photograph("garden2")],heroAsset:photograph("garden1")}};
const draft=buildWebsiteDraft({brandBrain:brand});
const svg='<svg xmlns="http://www.w3.org/2000/svg" width="480" height="480"><rect width="480" height="480" fill="#74aa91"/></svg>';
const browser=await chromium.launch({headless:true});
try{
 for(const width of [390,768,1440]){
  const page=await browser.newPage({viewport:{width,height:900}});
  await page.route("https://example.test/**",route=>route.fulfill({status:200,
   contentType:"image/svg+xml",body:svg}));
  const results=[];
  await page.exposeFunction("__busyPreviewReport",json=>results.push(JSON.parse(json)));
  await page.addInitScript(()=>{window.ReactNativeWebView={
   postMessage:json=>window.__busyPreviewReport(json)};});
  const ids=(draft.pages||[]).filter(p=>p.enabled!==false);
  let inspected=0;
  for(const currentPage of ids.slice(0,3)){
   const key=draft.generation+":"+currentPage.id+":full";
   const html=makeWebsiteVisualCheckHtml(renderWebsiteHtml(draft,currentPage.id),key);
   await page.setContent(html,{waitUntil:"load"});
   await page.waitForFunction((required)=>!!window.__busyPreviewReport&&
     !!document.querySelector("main")&&
     // allow the exact app-owned audit delay; bridge flush is checked outside
     window.innerWidth===required,width,{timeout:10000});
   const expected=inspected+1;
   for(let i=0;i<30&&results.length<expected;i++)
    await page.waitForTimeout(100);
   assert.equal(results.length,expected,"Local layout inspection bridge returns once at "+width);
   const report=reviewWebsiteVisualCheck(results[inspected],key);
   assert.ok(report,"Report scoped to exact page, generation and device width");
   assert.ok(report.counts.sections>0,"Actual website sections detected");
   assert.ok(report.counts.headings>0,"Actual headings detected");
   assert.ok(report.counts.viewport===width,"Viewport must match requested preview");
   assert.ok(report.counts.width<=width+2,"No page-wide overflow at "+width);
   assert.equal(report.counts.unloadedImages,0,"Business photos successfully load");
   inspected++;
  }
  await page.close();
 }
 const page=await browser.newPage({viewport:{width:390,height:780}});
 const captures=[];
 await page.exposeFunction("__busyPreviewReport",json=>captures.push(JSON.parse(json)));
 await page.addInitScript(()=>{window.ReactNativeWebView={postMessage:json=>window.__busyPreviewReport(json)};});
 const malformed='<html lang="en"><head><meta name="viewport" content="width=device-width,initial-scale=1">'+
 '<style>body{margin:0}main{width:550px}h1{width:600px;white-space:nowrap;overflow:hidden;height:20px;font-size:32px}</style></head>'+
 '<body><main><section><h1>A very long heading too big to fit</h1>'+
 '<a href="#missing" style="display:block;width:14px;height:14px">X</a>'+
 '<img src="https://example.invalid/no-such-image.jpg"></section></main></body></html>';
 const failHtml=makeWebsiteVisualCheckHtml('<!doctype html>'+malformed,"failure:home:phone");
 await page.route("https://example.invalid/**",route=>route.abort());
 await page.setContent(failHtml);
 for(let i=0;i<30&&!captures.length;i++)await page.waitForTimeout(100);
 assert.equal(captures.length,1);
 const failed=reviewWebsiteVisualCheck(captures[0],"failure:home:phone");
 for(const type of ["overflow","photos","descriptions","targets","links","headings"])
  assert.ok(failed.issues.some(i=>i.id===type),"Find "+type+" in intentionally bad website");
 await page.close();
 console.log("V3.143 BROWSER PASS: actual responsive business pages, loaded owner photos, detected broken links/images and overflowing headings.");
}finally{await browser.close();}
