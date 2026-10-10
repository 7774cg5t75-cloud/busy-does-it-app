/**
 * V3.104 real-browser mobile + desktop screen audit, always offline.
 * Tested sites are trusted local HTML files, not customer/private URLs.
 * No third-party image requests; no browser-initiated API calls.
 */
import {chromium} from "playwright";
import {readFile,writeFile,mkdir} from "node:fs/promises";
import {resolve,join} from "node:path";
import {pathToFileURL} from "node:url";
import {visualRisks} from "../supabase/functions/busy-website-worker/websiteReviewCycle.mjs";

async function capture(browser,htmlPath,outputDir,label){
 const ret={};
 for(const [size,viewport] of [
   ["mobile",{width:390,height:844}],["desktop",{width:1440,height:900}]
 ]){
   const context=await browser.newContext({viewport,deviceScaleFactor:1});
   const page=await context.newPage();
   await page.route("**/*",route=>{
     const address=route.request().url();
     // Permit only top-level trusted local HTML, embedded CSS, data URLs.
     // Never fetch external fonts, analytics, third-party media, or scripts.
     if(address.startsWith("file://")||address.startsWith("data:"))
       return route.continue();
     return route.abort();
   });
   try{
     await page.goto(pathToFileURL(resolve(htmlPath)).href,{waitUntil:"load",timeout:12000});
     const audit=await page.evaluate(()=>{
       const width=window.innerWidth;
       const root=document.documentElement, body=document.body;
       const heading=document.querySelector("main h1");
       const nav=document.querySelector("nav");
       const navLinks=document.querySelector("nav .nav-links");
       const headingRect=heading?.getBoundingClientRect();
       const navRect=nav?.getBoundingClientRect();
       const links=navLinks?Array.from(navLinks.querySelectorAll("a")):[];
       return {
         viewportWidth:width,
         documentWidth:Math.max(root.scrollWidth,body?.scrollWidth||0),
         horizontalOverflowPixels:Math.max(0,Math.round(Math.max(root.scrollWidth,body?.scrollWidth||0)-width)),
         headingVisible:!!heading&&!!headingRect&&headingRect.width>0&&headingRect.height>0,
         heroHeadingFontPx:heading?Number.parseFloat(getComputedStyle(heading).fontSize)||0:0,
         navigationFits:!nav||(
           navRect.width<=width+2&&
           links.every(link=>{
             const rect=link.getBoundingClientRect();
             return rect.width>0&&rect.left>=-2&&rect.right<=width+2;
           })
         ),
         actionCount:document.querySelectorAll("main .cta").length,
         imagesMissingNaturalSize:Array.from(document.querySelectorAll("main img"))
           .filter(img=>img.complete&&!img.naturalWidth).length,
       };
     });
     const screenshot=join(outputDir,label+"-"+size+".png");
     await page.screenshot({path:screenshot,fullPage:true});
     ret[size+"Audit"]=audit;
     ret[size]=screenshot;
   }finally{await context.close();}
 }
 return ret;
}
async function main(){
 const [originalHtml,candidateHtml,outputDirectory]=process.argv.slice(2);
 if(!originalHtml||!outputDirectory)throw Error("Usage: original.html candidate.html output-dir (use - for no candidate)");
 const out=resolve(outputDirectory);
 await mkdir(out,{recursive:true});
 const browser=await chromium.launch({headless:true});
 try{
   const first=await capture(browser,originalHtml,out,"original");
   const baseline=visualRisks(first);
   let candidate=null;
   if(candidateHtml&&candidateHtml!=="-"){
     const second=await capture(browser,candidateHtml,out,"candidate");
     candidate={mobileAudit:second.mobileAudit,desktopAudit:second.desktopAudit,
       issues:visualRisks(second)};
   }
   const report={
     source:"real-chromium-dom-measurement",
     paidVisionReviewOccurred:false,
     websitePublished:false,
     original:{mobileAudit:first.mobileAudit,desktopAudit:first.desktopAudit,issues:baseline},
     candidate,
     comparison:candidate?{
       originalProblemCount:baseline.length,
       candidateProblemCount:candidate.issues.length,
       noNewMeasuredProblems:candidate.issues.length<=baseline.length,
       note:"Measured layout issues only; a vision model has not judged aesthetics."
     }:null
   };
   await writeFile(join(out,"offline-visual-audit.json"),JSON.stringify(report,null,2)+"\n");
   console.log("V3.104 real-browser audit:",report.original.issues.join(", ")||"no measured layout problems");
   console.log("Screenshots and measurements saved to",out);
 }finally{await browser.close();}
}
await main();
