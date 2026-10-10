/**
 * Use actual generated fictional websites from the V3.100 design gallery.
 * Verify mobile and desktop touch targets and body text improved in Chromium.
 * No model calls, customer data, DNS changes or public deployments.
 */
import assert from "node:assert/strict";
import {readdir,readFile,writeFile,mkdir} from "node:fs/promises";
import {resolve,join} from "node:path";
import {chromium} from "playwright";
import {measureWebsiteQuality} from "./lib/websiteQualityAudit-v3107.mjs";
const folder=resolve(process.argv[2]||"/tmp/busy-v3108-gallery");
const output=resolve(process.argv[3]||"/tmp/busy-v3108-measured");
await mkdir(output,{recursive:true});
const htmlFiles=(await readdir(folder)).filter(x=>x.endsWith(".html"));
assert.ok(htmlFiles.length>=9,"Expected varied fictional website specimens");
const browser=await chromium.launch({headless:true});
const results=[];
try{
 for(const file of htmlFiles){
  const html=await readFile(join(folder,file),"utf8");
  for(const [mode,viewport]of [["mobile",{width:390,height:844}],["desktop",{width:1440,height:900}]]){
   const context=await browser.newContext({viewport,deviceScaleFactor:1});
   const page=await context.newPage();
   await page.route("**/*",route=>{
     const url=route.request().url();
     return url.startsWith("data:")||url.startsWith("about:")?route.continue():route.abort();
   });
   try{
    await page.setContent(html,{waitUntil:"load"});
    const audit=await measureWebsiteQuality(page);
    const record={file,mode,smallBodyTextCount:audit.smallBodyTextCount,
      smallTouchTargetCount:audit.smallTouchTargetCount,
      lowContrastCount:audit.lowContrastCount,
      unassessedContrastCount:audit.unassessedContrastCount};
    results.push(record);
    assert.equal(audit.smallBodyTextCount,0,file+" "+mode+" text is no longer undersized");
    assert.equal(audit.smallTouchTargetCount,0,file+" "+mode+" links and buttons are comfortable");
    if(results.length<=4)
      await page.screenshot({path:join(output,file.replace(".html","")+"-"+mode+".png"),fullPage:true});
   }finally{await context.close();}
  }
 }
 await writeFile(join(output,"readability-results.json"),JSON.stringify({
  source:"real-chromium",fictionalOnly:true,publishActions:0,aiProviderCalls:0,
  specimens:results.length,results
 },null,2)+"\n");
 console.log("V3.108 PASS: "+results.length+" true-browser mobile/desktop specimens, no undersized body copy or touch targets.");
}finally{await browser.close();}
