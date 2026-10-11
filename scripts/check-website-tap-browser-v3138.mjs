import assert from "node:assert/strict";
import {chromium} from "playwright";
import {makeTapToEditHtml,CHANNEL} from "../src/core/websiteTapToEdit.mjs";
const markup=`<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1">
<style>body{margin:0;font-family:Arial}main{max-width:800px;margin:auto;padding:20px}button,a,h1,p,img{display:block;margin:16px 0;max-width:100%}</style></head>
<body><main>
 <h1 data-busy-edit-section="hero" data-busy-edit-field="title" data-busy-edit-item="" data-busy-edit-photo-index="">Website headline</h1>
 <p data-busy-edit-section="hero" data-busy-edit-field="body" data-busy-edit-item="" data-busy-edit-photo-index="">Original wording</p>
 <a href="https://invalid.example/leave" data-busy-edit-section="hero" data-busy-edit-field="cta" data-busy-edit-item="" data-busy-edit-photo-index="">Click to edit button label</a>
 <section><h2>Services</h2>
  <p data-busy-edit-section="services" data-busy-edit-field="body" data-busy-edit-item="design" data-busy-edit-photo-index="">Garden service</p>
 </section>
</main></body></html>`;
const html=makeTapToEditHtml(markup);
const browser=await chromium.launch({headless:true});
try{
 for(const width of [390,1440]){
  const page=await browser.newPage({viewport:{width,height:830}});
  const events=[];
  await page.exposeFunction("__captureTap",data=>{events.push(JSON.parse(data));});
  await page.route(/https:\/\/invalid\.example\//,route=>route.abort());
  await page.setContent(html);
  await page.evaluate(()=>{window.ReactNativeWebView={postMessage:window.__captureTap};});
  await page.locator('[data-busy-edit-section="hero"][data-busy-edit-field="title"]').click();
  await page.locator('[data-busy-edit-section="services"][data-busy-edit-item="design"]').click();
  await page.locator('a[data-busy-edit-field="cta"]').click();
  await page.waitForFunction(()=>document.querySelectorAll(".busy-selected-for-edit").length===1);
  assert.deepEqual(events.map(e=>e.field),["title","body","cta"]);
  assert.equal(events[0].channel,CHANNEL);
  assert.equal(events[1].itemId,"design");
  assert.equal(new URL(page.url()).hostname,"","Editor must never navigate to clicked external CTA.");
  const x=await page.evaluate(()=>({
   selected:document.querySelectorAll(".busy-selected-for-edit").length,
   overflow:document.documentElement.scrollWidth>window.innerWidth
  }));
  assert.equal(x.selected,1);
  assert.equal(x.overflow,false,"No horizontal overflow on "+width);
  await page.close();
 }
 console.log("V3.138 BROWSER PASS: 390px and 1440px tap selections, CTA navigation cancelled, highlight and no overflow.");
}finally{await browser.close();}
