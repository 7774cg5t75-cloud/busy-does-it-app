/**
 * Browser-based zero-provider cost checks across actual, individually generated
 * fictional customer websites. Guard small phones/tablets plus desktop widths.
 * This is a responsive QA gate, not full WCAG certification.
 */
import assert from "node:assert/strict";
import {readdir,readFile,mkdir,writeFile} from "node:fs/promises";
import {resolve,join} from "node:path";
import {chromium} from "playwright";
import {measureWebsiteQuality} from "./lib/websiteQualityAudit-v3107.mjs";

const input=resolve(process.argv[2]||"/tmp/busy-v3109-gallery");
const output=resolve(process.argv[3]||"/tmp/busy-v3109-responsive");
await mkdir(output,{recursive:true});
const pages=(await readdir(input)).filter(x=>x.endsWith(".html")).sort();
assert.ok(pages.length>=9,"Expected multiple professional website designs");
const widths=[320,375,390,768,1440],errors=[],reports=[];
const browser=await chromium.launch({headless:true});
try{
 for(const file of pages){
  const html=await readFile(join(input,file),"utf8");
  for(const width of widths){
   const context=await browser.newContext({viewport:{width,height:900},deviceScaleFactor:1});
   const page=await context.newPage();
   await page.route("**/*",route=>{
     const url=route.request().url();
     return url.startsWith("about:")||url.startsWith("data:")?route.continue():route.abort();
   });
   try{
    await page.setContent(html,{waitUntil:"load"});
    const layout=await page.evaluate(()=>{
      const width=innerWidth,root=document.documentElement,body=document.body;
      const h=document.querySelector("main h1");
      const rect=h?.getBoundingClientRect();
      const navLinks=[...document.querySelectorAll("nav a")];
      return {width,documentWidth:Math.max(root.scrollWidth,body?.scrollWidth||0),
       headingVisible:!!rect&&rect.width>0&&rect.height>0,
       h1Count:document.querySelectorAll("main h1").length,
       navigationFits:navLinks.every(n=>{
         const r=n.getBoundingClientRect();
         return r.width>0&&r.left>=-2&&r.right<=width+2;
       }),
       pageLanguage:!!root.lang};
    });
    const quality=await measureWebsiteQuality(page);
    const record={file,width,...layout,overflow:Math.max(0,layout.documentWidth-width),
      smallText:quality.smallBodyTextCount,smallTargets:quality.smallTouchTargetCount,
      contrastWarnings:quality.lowContrastCount,unassessedContrast:quality.unassessedContrastCount};
    reports.push(record);
    if(record.overflow>2||!record.headingVisible||!record.navigationFits||
      !record.pageLanguage||record.h1Count!==1||record.smallText>0||record.smallTargets>0)
      errors.push(record);
    if(file===pages[0]&&[320,390,1440].includes(width))
      await page.screenshot({path:join(output,"example-"+width+".png"),fullPage:true});
   }finally{await context.close();}
  }
 }
 await writeFile(join(output,"responsive-quality.json"),JSON.stringify({
   source:"real-Chromium",fictionalOnly:true,billableRequests:0,livePublishes:0,
   pages:pages.length,viewports:widths,errors,reports
 },null,2)+"\n");
 assert.equal(errors.length,0,"Responsive design regressions: "+JSON.stringify(errors.slice(0,8)));
 console.log("V3.109 PASS: "+reports.length+" real-browser website checks at 320/375/390/768/1440px. No overflow, lost headings, clipped nav or undersized controls.");
}finally{await browser.close();}
