import assert from "node:assert/strict";
import {readFile,mkdir,writeFile} from "node:fs/promises";
import {resolve,join} from "node:path";
import {chromium} from "playwright";
import {websiteReviewAdvice} from "../supabase/functions/busy-website-worker/websiteReviewAdvice.mjs";
import {websiteRehearsalTimeline} from "../src/core/websiteRehearsalTimeline.mjs";
const gallery=resolve(process.argv[2]||"/tmp/busy-v3120-sites");
const reviews=resolve(process.argv[3]||"/tmp/busy-v3120-reviewed");
const out=resolve(process.argv[4]||"/tmp/busy-v3120-rehearsal");
await mkdir(out,{recursive:true});
const demos=[
 ["01-gardening-minimal","Hillside Gardens"],
 ["02-exterior-cleaning","Clearline Exterior Care"],
 ["03-catering-story","Fire & Table Catering"],
 ["04-wellness-boutique","Stillwater Beauty Studio"],
 ["05-professional-editorial","Harbour Accounting"]
];
const browser=await chromium.launch({headless:true});
const results=[];
try{
 for(const [file,business] of demos){
  const html=await readFile(join(gallery,file+".html"),"utf8");
  for(const [device,width] of [["phone",390],["desktop",1440]]){
   const context=await browser.newContext({viewport:{width,height:900}});
   const page=await context.newPage();
   await page.route("**/*",route=>
    /^(data:|about:)/.test(route.request().url())?route.continue():route.abort());
   try{
    await page.setContent(html,{waitUntil:"load"});
    const examined=await page.evaluate(()=>{
     const text=document.body.innerText.replace(/\s+/g," ").trim();
     const h=document.querySelector("main h1");
     const cta=document.querySelector("main .cta");
     const rect=h?.getBoundingClientRect();
     const links=[...document.querySelectorAll('a[href^="#"]')]
       .map(a=>a.getAttribute("href"))
       .filter(x=>typeof x==="string"&&x.length>1);
     return {text,headingVisible:!!rect&&rect.width>0&&rect.height>0,
      horizontalOverflow:document.documentElement.scrollWidth-innerWidth,
      primaryActionFound:!!cta,validInternalLinks:
       links.every(link=>!!document.getElementById(link.slice(1))),
      internalLinkCount:links.length};
    });
    assert.ok(examined.text.includes(business),business+" is identifiable on "+device);
    assert.equal(examined.headingVisible,true,business+" shows heading on "+device);
    assert.equal(examined.primaryActionFound,true,business+" has primary action on "+device);
    assert.ok(examined.horizontalOverflow<=2,business+" has no horizontal overflow");
    assert.equal(examined.validInternalLinks,true,business+" links point to real section IDs");
    for(const [,other] of demos.filter(([,value])=>value!==business))
     assert.ok(!examined.text.includes(other),"No fictional business data mixes with "+other);
    await page.screenshot({path:join(out,file+"-"+device+".png"),fullPage:false});
    results.push({id:file,device,business,internalLinkCount:examined.internalLinkCount,
      noOverflow:true,privateBrowserOnly:true});
   }finally{await context.close();}
  }
 }
 const audit=JSON.parse(await readFile(join(reviews,"guided-website-quality.json"),"utf8"));
 assert.equal(audit.realBrowser,true,"Compare real browser measurements");
 assert.equal(audit.fictionalOnly,true,"No genuine customer websites");
 const verdict=websiteReviewAdvice({before:audit.results.original,after:audit.results.alternative});
 assert.ok(["safe-alternative","measured-improvement","regression"].includes(verdict.status),
  "Correct classification cannot imply aesthetic or commercial success");
 assert.equal(verdict.publishAllowed,false,"Measured improvement cannot auto-publish");
 assert.equal(verdict.autoApply,false,"No autonomous edits");
 assert.equal(verdict.measuredSalesLift,null,"No invented sales improvement");
 const tenant="91edb6db-3a02-4de4-9ba8-5c93b4e790a1";
 const ctx={businessId:tenant,ownerBusinessId:tenant,role:"owner",
  environment:"local",productionCredentialsPresent:false,fictionalDataOnly:true,
  tenantIsolationVerified:true,dryRun:true,allowExternalWrites:false,
  allowPaidCalls:false,rollbackTested:true,testDataDeletionReviewed:true,
  founderApproved:true};
 const evt=(type,fields={})=>({type,businessId:tenant,...fields});
 const timeline=websiteRehearsalTimeline({context:ctx,events:[
  evt("draft_created",{hash:"fictional-website-v1"}),
  evt("preview_prepared",{hash:"fictional-website-v1",previewId:"fake-preview"}),
  evt("owner_approved",{hash:"fictional-website-v1",
   actorRole:"owner",explicitApproval:true}),
  evt("deployment_recorded",{hash:"fictional-website-v1",previewId:"fake-preview",
   deploymentId:"fake-deployment"}),
  evt("delivery_observed",{hash:"fictional-website-v1",
   deploymentId:"fake-deployment",httpsHealthy:true})
 ]});
 assert.equal(timeline.status,"simulated");
 assert.equal(timeline.simulatedDeliveryMatched,true);
 assert.equal(timeline.liveWebsiteVerified,false,"Synthetic delivery isn't public proof");
 assert.equal(timeline.publishedToInternet,false,"No cloud/network publication");
 await writeFile(join(out,"rehearsal-evidence.json"),JSON.stringify({
  fictionalOnly:true,realChromium:true,businessCount:demos.length,
  viewportCount:results.length,visualReviewAdvice:verdict,
  noCustomerInformation:true,paidProviderCalls:0,simulation:timeline,views:results
 },null,2)+"\n");
 console.log("V3.120 PASS: 5 distinct fictional businesses tested at 390/1440px with "+
 "offline owner approval and evidence-grounded review.");
}finally{await browser.close();}
