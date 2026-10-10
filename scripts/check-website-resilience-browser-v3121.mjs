import assert from "node:assert/strict";
import {readFile,mkdir,writeFile} from "node:fs/promises";
import {resolve,join} from "node:path";
import {chromium} from "playwright";
import {websitePublishApprovalGuide} from "../src/core/websitePublishApprovalGuide.mjs";
import {websiteRecoveryCoach} from "../src/core/websiteRecoveryCoach.mjs";
const folder=resolve(process.argv[2]||"/tmp/busy-v3121-sites");
const output=resolve(process.argv[3]||"/tmp/busy-v3121-browser");
await mkdir(output,{recursive:true});
const demos=[
 ["01-gardening-minimal","Hillside Gardens"],
 ["02-exterior-cleaning","Clearline Exterior Care"],
 ["03-catering-story","Fire & Table Catering"],
 ["04-wellness-boutique","Stillwater Beauty Studio"],
 ["05-professional-editorial","Harbour Accounting"],
 ["06-coastal-cleaning","Coastal Shine Exterior Cleaning"],
 ["07-village-cleaning","Westmoor Pressure Washing"],
 ["08-city-cleaning","Exeter Surface Specialists"],
 ["09-traditional-cleaning","Oakfield Exterior Care"]
];
const browser=await chromium.launch({headless:true}),results=[];
try{
 for(const [name,business] of demos){
  const html=await readFile(join(folder,name+".html"),"utf8");
  for(const [device,width] of [["phone",390],["desktop",1440]]){
   const ctx=await browser.newContext({viewport:{width,height:900}});
   const page=await ctx.newPage();
   await page.route("**/*",r=>
    /^(data:|about:)/.test(r.request().url())?r.continue():r.abort());
   try{
    await page.setContent(html,{waitUntil:"load"});
    const audit=await page.evaluate(()=>{
     const text=document.body.innerText;
     const links=[...document.querySelectorAll('a[href^="#"]')]
      .map(a=>a.getAttribute("href")).filter(x=>typeof x==="string");
     const missing=links.filter(href=>href.length<2||
      !document.getElementById(href.slice(1)));
     const heading=document.querySelector("main h1");
     return {text,missing,
      hasMainAction:!!document.querySelector("main .cta"),
      headingVisible:!!heading&&heading.getBoundingClientRect().height>0,
      overflow:document.documentElement.scrollWidth-innerWidth};
    });
    assert.ok(audit.text.includes(business),"Correct fictional business identity");
    for(const [,other] of demos.filter(([,b])=>b!==business))
      assert.ok(!audit.text.includes(other),"No mixing business identities");
    assert.equal(audit.hasMainAction,true,"Customer CTA present");
    assert.equal(audit.headingVisible,true,"Main heading visible");
    assert.ok(audit.overflow<=2,"No horizontal overflow");
    assert.deepEqual(audit.missing,[],"No broken in-page navigation");
    await page.screenshot({path:join(output,name+"-"+device+".png")});
    if(name==="01-gardening-minimal"){
     await page.evaluate(()=>{
      const a=document.createElement("a");
      a.href="#missing-section-v3121";
      document.querySelector("nav").appendChild(a);
     });
     const broken=await page.evaluate(()=>
      [...document.querySelectorAll('a[href^="#"]')]
       .filter(a=>!document.getElementById(a.getAttribute("href").slice(1)))
       .map(a=>a.getAttribute("href")));
     assert.ok(broken.includes("#missing-section-v3121"),
      "Negative control catches intentionally invalid link");
    }
    results.push({business,device,brokenLinks:0,noOverflow:true});
   }finally{await ctx.close();}
  }
 }
 const preview={id:"preview-a",content_hash:"revision-a"};
 const v={canPublish:true,draftChangedSinceHosted:false};
 assert.equal(websitePublishApprovalGuide({preview,view:v,
  openedId:preview.id,reviewedId:preview.id}).readyForOwnerClick,true);
 assert.equal(websitePublishApprovalGuide({preview,view:{
  ...v,draftChangedSinceHosted:true
 },openedId:preview.id,reviewedId:preview.id}).readyForOwnerClick,false);
 assert.equal(websiteRecoveryCoach({liveDeployment:{id:"live"},
  recoveryState:{healthy:false,automatic:true}}).retryAvailable,false);
 await writeFile(join(output,"rehearsal.json"),JSON.stringify({
  fictionalOnly:true,realChromium:true,siteCount:demos.length,
  browserViews:results.length,badAnchorDetected:true,
  staleApprovalBlocked:true,autoRecoveryNotDuplicated:true,
  customersEnrolled:0,publicSiteChanges:0,paidCalls:0,results
 },null,2)+"\n");
 console.log("V3.121 PASS: 9 fictional sites × 2 Chromium sizes, link negative control and stale approval.");
}finally{await browser.close();}
