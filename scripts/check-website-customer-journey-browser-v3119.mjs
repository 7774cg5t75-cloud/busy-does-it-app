/**
 * Genuine Chromium check: same fictional business, before and alternate
 * version, exact owner content preserved, safe publication never triggered.
 */
import assert from "node:assert/strict";
import {readFile,mkdir,writeFile} from "node:fs/promises";
import {resolve,join} from "node:path";
import {chromium} from "playwright";
import {websiteDesignDecision} from "../supabase/functions/busy-website-worker/websiteDesignDecision.mjs";
import {websiteJourneyAssurance} from "../src/core/websiteJourneyAssurance.mjs";
const gallery=resolve(process.argv[2]||"/tmp/busy-v3119-gallery");
const out=resolve(process.argv[3]||"/tmp/busy-v3119-customer");
await mkdir(out,{recursive:true});
const original=await readFile(join(gallery,"01-gardening-minimal.html"),"utf8");
const changed=await readFile(join(gallery,"01-gardening-minimal-guided-alternative.html"),"utf8");
assert.notEqual(original,changed,"Design candidate must actually be different");
const browser=await chromium.launch({headless:true});
const states={};
try{
 async function visit(source,tag){
  const result={};
  for(const [device,width] of [["phone",390],["desktop",1440]]){
   const context=await browser.newContext({viewport:{width,height:900}});
   const page=await context.newPage();
   await page.route("**/*",route=>{
    if(/^(data:|about:)/.test(route.request().url()))return route.continue();
    return route.abort();
   });
   try{
    await page.setContent(source,{waitUntil:"load"});
    result[device]=await page.evaluate(()=>{
      const text=document.body.innerText.replace(/\s+/g," ").trim();
      const hero=document.querySelector("main h1");
      return {text,heading:hero?.textContent.trim()||"",
        navLinks:[...document.querySelectorAll("nav a")].map(a=>a.textContent.trim()),
        forms:[...document.querySelectorAll("form")].length,
        horizontalOverflow:document.documentElement.scrollWidth>innerWidth+2,
        visibleHero:!!hero&&hero.getBoundingClientRect().height>0};
    });
    await page.screenshot({path:join(out,tag+"-"+device+".png"),fullPage:false});
   }finally{await context.close();}
  }
  return result;
 }
 states.before=await visit(original,"original");
 states.after=await visit(changed,"alternate");
 for(const device of ["phone","desktop"]){
  assert.equal(states.before[device].text,states.after[device].text,
   "Pure design changes must retain all customer words");
  assert.equal(states.after[device].horizontalOverflow,false,
   "Alternate never creates horizontal scrolling");
  assert.equal(states.after[device].visibleHero,true,"Owner can still see headline");
 }
 const decision=websiteDesignDecision({before:null,after:null});
 assert.equal(decision.status,"needs-review","No fake browser quality scores without measured audits");
 assert.equal(decision.publishAllowed,false,"Review cannot publish");
 const recorded={liveDeployment:{id:"fake-db-record"}};
 const status=websiteJourneyAssurance({journey:{isVerified:false,nextAction:"verify"},
  publishing:recorded,proof:{verified:false},hasDraft:true});
 assert.equal(status.action,"verify","Recorded publication alone isn't verified public delivery");
 assert.equal(status.publicWebsiteVerified,false);
 assert.equal(status.automaticPublication,false);
 await writeFile(join(out,"customer-journey-proof.json"),JSON.stringify({
   fictionalOnly:true,realBrowser:true,noCustomerData:true,
   imagesNotPublished:true,states,unverifiedWebsite:status
 },null,2)+"\n");
 console.log("V3.119 PASS: real desktop/phone customer wording retained across distinct layouts, no implied live publication.");
}finally{await browser.close();}
