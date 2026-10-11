import assert from "node:assert/strict";
import {chromium} from "playwright";
import {designForWebsite,designCss} from "../supabase/functions/busy-website-worker/designSystem.mjs";
import {normalizeVisualCritique} from "../supabase/functions/busy-website-design-review/visualCriticContract.mjs";
import {runPrivateWebsiteDesignLoop} from "../supabase/functions/busy-website-design-review/designLoop.mjs";
const deploy="00000000-0000-4000-8000-000000000099";
const css=designCss(designForWebsite({businessType:"Local electrician"}));
const html='<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="busy-deployment" content="'+deploy+'"><style>'+css+'</style></head><body class="mood-clean sector-trades family-conversion tier-rich architecture-full-site visual-hero-type-left visual-cards-cards visual-ornament-ripple visual-nav-quiet visual-type-confident rhythm-comfortable cta-normal photo-focus-center">'+
'<nav aria-label="Main navigation"><div class="nav-wrap"><a href="#main">Electrician</a><div class="nav-links"><a href="#services">Services</a></div></div></nav><main id="main"><section class="hero hero-large hero-no-image"><div class="wrap"><h1>Trusted local electrical repairs</h1><p>Customer-supplied wording must not change.</p></div></section>'+
'<section id="services"><div class="wrap"><h2>Services</h2><div class="grid"><article><h3>Small repairs</h3><p>Local repairs</p></article><article><h3>Lighting</h3><p>Lighting installation</p></article></div></div></section></main></body></html>';
const providerReport=normalizeVisualCritique({reviewedScreenshots:true,summary:"Try simpler service rows",
 proposals:[{path:"theme.cardLayout",value:"rows",reason:"Less visual crowding"}]},
 {approvedPhotos:0});
const browser=await chromium.launch({headless:true});
let captured=0, compared=0;
async function capture(source){
 const images={verified:true};
 for(const [kind,width] of [["mobile",390],["desktop",1440]]){
  const page=await browser.newPage({viewport:{width,height:800}});
  try{
   await page.setContent(source,{waitUntil:"load"});
   const stats=await page.evaluate(()=>({
    width:window.innerWidth,overflow:document.documentElement.scrollWidth>window.innerWidth+2,
    scriptCount:document.scripts.length,content:document.querySelector("main")?.textContent||""
   }));
   assert.equal(stats.width,width);
   assert.equal(stats.overflow,false);
   assert.equal(stats.scriptCount,0);
   assert.ok(stats.content.includes("Customer-supplied wording must not change."));
   const png=await page.screenshot({type:"png",fullPage:true});
   assert.ok(png.byteLength>1000);
   images[kind]=png.toString("base64");
  }finally{await page.close();}
 }
 captured++;return images;
}
try{
 const baseline=await capture(html);
 const result=await runPrivateWebsiteDesignLoop({
  html,deploymentId:deploy,firstReport:providerReport,
  approvedPhotos:0,baseline,maxPasses:3
 },{
  captureCandidate:async({html})=>capture(html),
  // An OFFLINE mock model decision: this test proves the real screenshots
  // travel between bounded passes, not that a real provider improved quality.
  compareScreenshots:async({baseline,candidate})=>{
   compared++;
   assert.ok(baseline.verified&&candidate.verified);
   assert.notEqual(baseline.mobile,candidate.mobile);
   assert.notEqual(baseline.desktop,candidate.desktop);
   return {verdict:"better",reason:"Simulated reviewer acceptance",
    summary:"Mocked model verdict for CI",reviewedScreenshots:true,proposals:[]};
  }
 });
 assert.ok(result.ok);
 assert.equal(result.completedPasses,1);
 assert.equal(compared,1);
 assert.equal(captured,2);
 assert.deepEqual(result.bestChanges.map(x=>x.value),["rows"]);
 assert.equal(result.published,false);
 console.log("V3.151 REAL BROWSER PASS: original and private candidate screenshots independently captured on phone and desktop, with offline mock AI comparison and no publishing.");
}finally{await browser.close();}
