/**
 * Real Chromium keyboard and accessibility smoke tests on distinct fictional
 * business websites. No customer data, provider charges or public publishing.
 */
import assert from "node:assert/strict";
import {chromium} from "playwright";
import {mkdir,readdir,readFile,writeFile} from "node:fs/promises";
import {resolve,join} from "node:path";
import {measureWebsiteQuality} from "./lib/websiteQualityAudit-v3107.mjs";

const input=resolve(process.argv[2]||"/tmp/busy-v3110-gallery");
const output=resolve(process.argv[3]||"/tmp/busy-v3110-keyboard");
await mkdir(output,{recursive:true});
const files=(await readdir(input)).filter(file=>file.endsWith(".html")).sort();
assert.ok(files.length>=9,"Multiple different business sites must be checked");
const browser=await chromium.launch({headless:true});
const report=[];
try{
 for(const file of files){
  const html=await readFile(join(input,file),"utf8");
  for(const width of [320,390,1440]){
   const context=await browser.newContext({viewport:{width,height:844},deviceScaleFactor:1});
   const page=await context.newPage();
   await page.route("**/*",route=>{
    const u=route.request().url();
    return u.startsWith("data:")||u.startsWith("about:")?route.continue():route.abort();
   });
   try{
    await page.setContent(html,{waitUntil:"load"});
    const quality=await measureWebsiteQuality(page);
    const focuses=[];
    for(let index=0;index<3;index++){
     await page.keyboard.press("Tab");
     focuses.push(await page.evaluate(()=>{
      const e=document.activeElement;
      const c=e instanceof Element?getComputedStyle(e):null;
      const r=e instanceof Element?e.getBoundingClientRect():null;
      return {tag:e?.tagName||"",outlineStyle:c?.outlineStyle||"none",
       outlineWidth:Number.parseFloat(c?.outlineWidth||"0"),
       visible:!!r&&r.width>0&&r.height>0,
       label:String(e?.textContent||e?.getAttribute?.("aria-label")||"").trim().slice(0,80)};
     }));
    }
    const broken=focuses.filter(x=>!["A","BUTTON","INPUT"].includes(x.tag)||
     x.outlineStyle==="none"||x.outlineWidth<2||!x.visible);
    assert.equal(broken.length,0,file+" "+width+" keyboard controls need visible focus: "+JSON.stringify(broken));
    assert.equal(quality.missingImageAltCount,0,file+" "+width+" image alt required");
    assert.equal(quality.missingInputLabelCount,0,file+" "+width+" labelled inputs required");
    assert.equal(quality.hasDocumentLanguage,true,file+" "+width+" document language required");
    report.push({file,width,focuses,missingAlt:quality.missingImageAltCount,
      missingLabels:quality.missingInputLabelCount});
   }finally{await context.close();}
  }
 }
 await writeFile(join(output,"keyboard-report.json"),JSON.stringify({
  realBrowser:true,fictionalSites:true,paidAiCalls:0,publishCalls:0,
  specimens:report.length,report
 },null,2)+"\n");
 console.log("V3.110 PASS: "+report.length+" generated-site keyboard journeys with visible focus, alt and form-label checks.");
}finally{await browser.close();}
