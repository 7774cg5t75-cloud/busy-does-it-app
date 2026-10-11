/**
 * Real Chromium offline visual/interaction smoke check for owner-edited
 * fictional website HTML. No external requests, services or customer data.
 */
import assert from "node:assert/strict";
import {readFileSync,mkdirSync} from "node:fs";
import {chromium} from "playwright";
const fixture=readFileSync("/tmp/busy-v3134-web/index.html","utf8");
assert.ok(fixture.includes("Our approach")&&fixture.includes("cta-strong"),
 "The browser must receive an edited owner draft, not a canned HTML template");
mkdirSync("/tmp/busy-v3134-web/evidence",{recursive:true});
const browser=await chromium.launch({headless:true});
try{
 for(const width of [390,1440]){
  const page=await browser.newPage({viewport:{width,height:900},deviceScaleFactor:1});
  await page.route("**/*",route=>route.abort());
  await page.setContent(fixture,{waitUntil:"load"});
  const report=await page.evaluate(()=>{
   const hero=document.querySelector("h1");
   const custom=[...document.querySelectorAll("main section")].find(s=>s.textContent?.includes("Our approach"));
   const cta=document.querySelector(".hero .cta");
   const layout=document.documentElement;
   return {
    hero:hero?.textContent||"",custom:custom?.textContent||"",
    button:cta?.textContent||"",buttonHeight:cta?.getBoundingClientRect().height||0,
    bodyClass:document.body.className,
    overflow:layout.scrollWidth>layout.clientWidth+1,
    mobileNavLinks:[...document.querySelectorAll("nav a")].filter(a=>a.getBoundingClientRect().height<40).length,
    computedPadding:custom?Number.parseFloat(getComputedStyle(custom).paddingTop):0,
    ctaBg:cta?getComputedStyle(cta).backgroundColor:"",
    title:document.title
   };
  });
  assert.match(report.hero,/Hillside Fictional Gardens|Garden visits/i,"Actual hero rendered");
  assert.match(report.custom,/fictional business helps/i,"Owner-created content rendered");
  assert.equal(report.overflow,false,"No horizontal overflow at "+width+"px: "+JSON.stringify(report));
  assert.ok(report.bodyClass.includes("rhythm-generous")&&report.bodyClass.includes("cta-strong"),
   "Owner choices must affect rendered CSS classes");
  assert.ok(report.buttonHeight>=44&&report.computedPadding>40,"Touch targets and section spacing remain accessible");
  assert.equal(report.mobileNavLinks,0,"Navigation touch targets remain at least 40px");
  assert.ok(report.ctaBg.startsWith("rgb"),"Prominent CTA has real computed background");
  await page.screenshot({path:"/tmp/busy-v3134-web/evidence/fictional-"+width+".png",fullPage:true});
  console.log("V3.134 REAL BROWSER PASS:",width+"px",JSON.stringify(report));
  await page.close();
 }
}finally{await browser.close();}
