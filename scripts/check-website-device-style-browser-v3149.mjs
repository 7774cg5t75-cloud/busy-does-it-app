import assert from "node:assert/strict";
import {chromium} from "playwright";
import {designCss,designForWebsite} from "../supabase/functions/busy-website-worker/designSystem.mjs";
const css=designCss(designForWebsite({businessType:"Event catering"}));
const html=(headingClass="",galleryClass="")=>
 '<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>'+
 css+'</style></head><body><main>'+
 '<section class="hero hero-no-image '+headingClass+'"><div class="wrap"><div class="hero-content"><h1>Fresh local food for festivals</h1></div></div></section>'+
 '<section id="gallery" class="'+galleryClass+'"><div class="wrap"><h2>Gallery</h2><div class="gallery">'+
 '<div class="gallery-image" aria-label="Photograph one"></div><div class="gallery-image" aria-label="Photograph two"></div>'+
 '</div></div></section></main></body></html>';
const browser=await chromium.launch({headless:true});
try{
 for(const width of [390,1280]){
  const page=await browser.newPage({viewport:{width,height:840}});
  const read=async (heading="",gallery="")=>{
   await page.setContent(html(heading,gallery),{waitUntil:"load"});
   return page.evaluate(()=>({
    heading:parseFloat(getComputedStyle(document.querySelector("h1")).fontSize),
    imageHeight:parseFloat(getComputedStyle(document.querySelector(".gallery-image")).height),
    width:innerWidth,
    overflow:document.documentElement.scrollWidth>innerWidth+2,
    scripts:document.scripts.length
   }));
  };
  const baseline=await read();
  const mobile=await read("owner-mobile-heading-compact","owner-mobile-gallery-large");
  const desktop=await read("owner-desktop-heading-large","owner-desktop-gallery-large");
  assert.equal(baseline.width,width);
  assert.ok(!mobile.overflow&&!desktop.overflow&&!baseline.overflow);
  assert.equal(mobile.scripts,0);
  assert.equal(desktop.scripts,0);
  if(width===390){
   assert.ok(mobile.heading<baseline.heading,"Mobile heading override is smaller");
   assert.ok(mobile.imageHeight>baseline.imageHeight,"Mobile gallery override is larger");
   assert.equal(desktop.heading,baseline.heading,"Desktop heading override does not leak to phone");
   assert.equal(desktop.imageHeight,baseline.imageHeight,"Desktop gallery override does not leak to phone");
  }else{
   assert.ok(desktop.heading>baseline.heading,"Desktop heading override is larger");
   assert.ok(desktop.imageHeight>baseline.imageHeight,"Desktop gallery override is larger");
   assert.equal(mobile.heading,baseline.heading,"Phone heading override does not leak to desktop");
   assert.equal(mobile.imageHeight,baseline.imageHeight,"Phone gallery override does not leak to desktop");
  }
  assert.ok((await page.screenshot({type:"png"})).length>1000);
  await page.close();
 }
 console.log("V3.149 DEVICE BROWSER PASS: desktop/phone overrides isolated in real Chromium CSS, no sideways overflow, actual screenshots.");
}finally{await browser.close();}
