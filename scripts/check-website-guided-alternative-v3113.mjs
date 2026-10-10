import assert from "node:assert/strict";
import {readFile,mkdir,writeFile} from "node:fs/promises";
import {resolve,join} from "node:path";
import {chromium} from "playwright";
import {measureWebsiteQuality} from "./lib/websiteQualityAudit-v3107.mjs";
import {compareWebsiteAudits} from "../supabase/functions/busy-website-worker/websiteReviewCycle.mjs";
const root=resolve(process.argv[2]||"/tmp/busy-v3113-gallery");
const out=resolve(process.argv[3]||"/tmp/busy-v3113-guided");
await mkdir(out,{recursive:true});
const original=await readFile(join(root,"01-gardening-minimal.html"),"utf8");
const alternate=await readFile(join(root,"01-gardening-minimal-guided-alternative.html"),"utf8");
const unsafe=alternate.replace("</head>",
 '<style>nav .nav-links a{min-height:9px!important;padding:0!important;font-size:8px!important}</style></head>');
assert.notEqual(original,alternate,"Alternative must change real generated markup");
const browser=await chromium.launch({headless:true}),all={};
async function capture(html,variant){
 const results={};
 for(const [label,width]of [["mobile",320],["desktop",1440]]){
  const ctx=await browser.newContext({viewport:{width,height:844},deviceScaleFactor:1});
  const page=await ctx.newPage();
  await page.route("**/*",r=>r.request().url().startsWith("data:")||
    r.request().url().startsWith("about:")?r.continue():r.abort());
  try{
   await page.setContent(html,{waitUntil:"load"});
   const layout=await page.evaluate(()=>{
    const head=document.querySelector("main h1"),rect=head?.getBoundingClientRect();
    const links=[...document.querySelectorAll("nav a")];
    return {heading:head?.textContent?.trim()||"",
     services:[...document.querySelectorAll("#services h3")].map(x=>x.textContent.trim()),
     text:document.body.innerText.replace(/\s+/g," ").trim(),
     horizontalOverflowPixels:Math.max(0,document.documentElement.scrollWidth-innerWidth),
     headingVisible:!!rect&&rect.height>0&&rect.width>0,
     navigationFits:links.every(link=>{
      const r=link.getBoundingClientRect();return r.left>=-2&&r.right<=innerWidth+2;
     }),
     heroHeadingFontPx:parseFloat(getComputedStyle(head).fontSize),
     family:document.body.className};
   });
   results[label+"Audit"]={
    horizontalOverflowPixels:layout.horizontalOverflowPixels,
    headingVisible:layout.headingVisible,
    navigationFits:layout.navigationFits,
    heroHeadingFontPx:layout.heroHeadingFontPx,
    qualityAudit:await measureWebsiteQuality(page)};
   results[label+"Content"]={heading:layout.heading,services:layout.services,text:layout.text};
   results[label+"Design"]=layout.family;
   if(variant!=="unsafe")await page.screenshot({path:join(out,variant+"-"+label+".png"),fullPage:true});
  }finally{await ctx.close();}
 }
 return results;
}
try{
 const before=await capture(original,"original");
 const after=await capture(alternate,"alternative");
 const bad=await capture(unsafe,"unsafe");
 const verified=compareWebsiteAudits(before,after);
 const rejected=compareWebsiteAudits(before,bad);
 assert.equal(verified.valid,true,"Actual mobile and desktop measurements available");
 assert.equal(verified.noNewMeasuredProblems,true,"Proposed design must not introduce measured problems");
 assert.equal(rejected.noNewMeasuredProblems,false,"Bad small-navigation candidate must be rejected");
 for(const viewport of ["mobile","desktop"])
  assert.deepEqual(before[viewport+"Content"],after[viewport+"Content"],
   "Business names, headings, services and contact words must not change with layout");
 assert.notEqual(before.mobileDesign,after.mobileDesign,"Design family must genuinely differ");
 all.original=before;all.alternative=after;all.safe=verified;all.rejected=rejected;
 await writeFile(join(out,"guided-website-quality.json"),JSON.stringify({
  realBrowser:true,fictionalOnly:true,noPaidAI:true,noPublicPublishing:true,results:all
 },null,2)+"\n");
 console.log("V3.113 PASS: verified private alternative at 320/1440px preserved all "+
 "business text and deliberately broken navigation candidate was rejected.");
}finally{await browser.close();}
