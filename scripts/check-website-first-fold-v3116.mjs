import assert from "node:assert/strict";
import {chromium} from "playwright";
import {readFile,mkdir,writeFile} from "node:fs/promises";
import {join,resolve} from "node:path";
import {checkScreenshotProof} from "../supabase/functions/busy-website-design-review/screenshotProof.mjs";
import {compareWebsiteAudits} from "../supabase/functions/busy-website-worker/websiteReviewCycle.mjs";
import {measureWebsiteQuality} from "./lib/websiteQualityAudit-v3107.mjs";
const input=resolve(process.argv[2]||"/tmp/busy-v3116-gallery");
const output=resolve(process.argv[3]||"/tmp/busy-v3116-fold");
await mkdir(output,{recursive:true});
const html=await readFile(join(input,"01-gardening-minimal.html"),"utf8");
const id="11111111-2222-4333-8444-555555555555";
const browser=await chromium.launch({headless:true}), evidence={};
try{
 for(const [name,viewport] of [["mobile",{width:390,height:844}],["desktop",{width:1440,height:900}]]){
  const context=await browser.newContext({viewport,deviceScaleFactor:1});
  const page=await context.newPage();
  await page.route("**/*",r=>r.request().url().startsWith("about:")||
   r.request().url().startsWith("data:")?r.continue():r.abort());
  try{
   await page.setContent(html,{waitUntil:"load"});
   async function measure(){
    const action=await page.evaluate(()=>{
     const c=document.querySelector("main .cta");
     if(!c)return {version:1,present:false,visible:false,reachable:false};
     const r=c.getBoundingClientRect(),css=getComputedStyle(c);
     const x=(r.left+r.right)/2,y=(r.top+r.bottom)/2;
     const hit=x>=0&&x<innerWidth&&y>=0&&y<innerHeight?
      document.elementFromPoint(x,y):null;
     const visible=r.width>=24&&r.height>=24&&r.left>=0&&r.right<=innerWidth&&
      r.top>=0&&r.bottom<=innerHeight&&css.visibility!=="hidden"&&
      css.display!=="none"&&Number(css.opacity)>0&&!!hit&&(hit===c||c.contains(hit));
     const href=c.getAttribute("href")||"";
     const reachable=!!href&&(href.startsWith("#")?!!document.getElementById(href.slice(1)):
       /^(tel:|mailto:|https:\/\/)/.test(href));
     return {version:1,present:true,visible,reachable};
    });
    return {horizontalOverflowPixels:0,headingVisible:true,navigationFits:true,
      heroHeadingFontPx:36,qualityAudit:await measureWebsiteQuality(page),ctaAudit:action};
   }
   const original=await measure();
   assert.equal(original.ctaAudit.visible,true,name+" first-fold CTA unobstructed");
   assert.equal(original.ctaAudit.reachable,true,name+" CTA destination exists");
   const screenshot=await page.screenshot({fullPage:false});
   const headers=new Headers({"Content-Type":"image/png","Cache-Control":"no-store",
    "X-Busy-Deployment":id,"X-Busy-Viewport":viewport.width+"x"+viewport.height});
   const proof=checkScreenshotProof({bytes:screenshot,headers,deploymentId:id,viewport});
   assert.equal(proof.valid,true,name+" actual Chromium PNG has verified dimensions");
   assert.equal(checkScreenshotProof({bytes:screenshot,headers,
    deploymentId:"22222222-2222-4333-8444-555555555555",viewport}).valid,false,
    "Cannot replay another deployment's screenshot");
   await writeFile(join(output,name+".png"),screenshot);
   await page.evaluate(()=>{
    const mask=document.createElement("div");
    mask.style.cssText="position:fixed;inset:0;z-index:2147483647;background:rgba(255,255,255,.2)";
    document.body.appendChild(mask);
   });
   const covered=await measure();
   assert.equal(covered.ctaAudit.visible,false,"Overlay interception blocks CTA");
   evidence[name]={proof,original,covered};
  }finally{await context.close();}
 }
 const before={mobileAudit:evidence.mobile.original,desktopAudit:evidence.desktop.original};
 const after={mobileAudit:evidence.mobile.covered,desktopAudit:evidence.desktop.covered};
 const result=compareWebsiteAudits(before,after);
 assert.equal(result.valid,true,"Comparable measured browser states");
 assert.equal(result.noNewMeasuredProblems,false,"Covered CTA rejected");
 assert.ok(result.newProblems.some(x=>x.includes("primary action")),"Specific reason recorded");
 await writeFile(join(output,"evidence.json"),JSON.stringify({evidence,result,
  realChromium:true,paidProviderCalls:0,fictionalOnly:true},null,2)+"\n");
 console.log("V3.116 PASS: trustworthy phone and desktop screenshots, obscured CTA rejected.");
}finally{await browser.close();}
