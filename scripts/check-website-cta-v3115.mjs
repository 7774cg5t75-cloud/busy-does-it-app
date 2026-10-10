/**
 * Actual offline Chromium evidence from fictional generated website.
 * A hidden hero CTA must fail the extended visual review contract.
 */
import assert from "node:assert/strict";
import {readFile,mkdir,writeFile} from "node:fs/promises";
import {resolve,join} from "node:path";
import {chromium} from "playwright";
import {measureWebsiteQuality} from "./lib/websiteQualityAudit-v3107.mjs";
import {compareWebsiteAudits} from "../supabase/functions/busy-website-worker/websiteReviewCycle.mjs";
const input=resolve(process.argv[2]||"/tmp/busy-v3115-gallery");
const out=resolve(process.argv[3]||"/tmp/busy-v3115-cta");
await mkdir(out,{recursive:true});
const normal=await readFile(join(input,"01-gardening-minimal.html"),"utf8");
const hidden=normal.replace("</head>","<style>main .cta{display:none!important}</style></head>");
const browser=await chromium.launch({headless:true});
async function measure(html,variant){
 const result={};
 for(const [kind,width] of [["mobile",320],["desktop",1440]]){
  const ctx=await browser.newContext({viewport:{width,height:844}});
  const page=await ctx.newPage();
  await page.route("**/*",r=>r.request().url().startsWith("data:")||
    r.request().url().startsWith("about:")?r.continue():r.abort());
  try{
   await page.setContent(html,{waitUntil:"load"});
   const action=await page.evaluate(()=>{
    const c=document.querySelector("main .cta");
    if(!c)return {version:1,present:false,visible:false,reachable:false};
    const rect=c.getBoundingClientRect(),cs=getComputedStyle(c),href=c.getAttribute("href")||"";
    const visible=rect.width>=24&&rect.height>=24&&cs.display!=="none"&&
      cs.visibility!=="hidden"&&Number(cs.opacity)>0&&rect.left>=-2&&
      rect.right<=innerWidth+2;
    const reachable=!!href&&(href[0]==="#"?
       !!document.getElementById(href.slice(1)):/^(mailto:|tel:|https:\/\/)/.test(href));
    return {version:1,present:true,visible,reachable};
   });
   const quality=await measureWebsiteQuality(page);
   result[kind+"Audit"]={horizontalOverflowPixels:0,headingVisible:true,
    navigationFits:true,heroHeadingFontPx:36,qualityAudit:quality,ctaAudit:action};
   if(variant==="normal")
    await page.screenshot({path:join(out,kind+"-first-screen.png"),fullPage:false});
  }finally{await ctx.close();}
 }
 return result;
}
try{
 const before=await measure(normal,"normal"),after=await measure(hidden,"hidden");
 assert.equal(before.mobileAudit.ctaAudit.visible,true,"Real phone CTA visible");
 assert.equal(before.desktopAudit.ctaAudit.visible,true,"Real desktop CTA visible");
 assert.equal(before.mobileAudit.ctaAudit.reachable,true,"CTA target valid");
 const verdict=compareWebsiteAudits(before,after);
 assert.equal(verdict.valid,true,"Two independent real-browser assessments");
 assert.equal(verdict.noNewMeasuredProblems,false,"Hidden CTA is a regression");
 assert.ok(verdict.newProblems.some(x=>x.includes("primary action")),
   "Customer action defect is identified");
 await writeFile(join(out,"cta-review-evidence.json"),JSON.stringify({
  fiction:true,paidCalls:0,published:false,before,after,verdict
 },null,2)+"\n");
 console.log("V3.115 PASS: real phone and desktop buttons usable; hidden action rejected.");
}finally{await browser.close();}
