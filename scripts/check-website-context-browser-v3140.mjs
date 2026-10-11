import assert from "node:assert/strict";
import {chromium} from "playwright";
import {makeTapToEditHtml} from "../src/core/websiteTapToEdit.mjs";

const html=makeTapToEditHtml(`<!doctype html><html lang="en"><head>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>body{margin:0;font-family:sans-serif}main{padding:24px;max-width:720px;margin:auto}</style>
</head><body><main>
<h1 data-busy-edit-section="hero" data-busy-edit-field="title" data-busy-edit-item="" data-busy-edit-photo-index="">My accessible heading</h1>
<p data-busy-edit-section="about" data-busy-edit-field="body" data-busy-edit-item="" data-busy-edit-photo-index="">About the studio.</p>
<a href="https://blocked.example/" data-busy-edit-section="hero" data-busy-edit-field="cta" data-busy-edit-item="" data-busy-edit-photo-index="">Contact us</a>
</main></body></html>`);
const browser=await chromium.launch({headless:true});
try{
 for(const width of [375,390,768,1440]){
  const page=await browser.newPage({viewport:{width,height:820}});
  const selections=[];
  await page.exposeFunction("__bridge",data=>selections.push(JSON.parse(data)));
  await page.setContent(html);
  await page.evaluate(()=>{window.ReactNativeWebView={postMessage:window.__bridge};});
  const heading=page.locator("h1[data-busy-edit-section]");
  await heading.focus();
  await heading.press("Enter");
  await page.locator("p[data-busy-edit-section]").focus();
  await page.keyboard.press("Space");
  const link=page.locator("a[data-busy-edit-section]");
  await link.focus();
  await link.press("Enter");
  await page.waitForFunction(()=>document.querySelectorAll(".busy-selected-for-edit").length===1);
  assert.deepEqual(selections.map(x=>x.field),["title","body","cta"],"Keyboard selects exact field at "+width);
  assert.equal(new URL(page.url()).hostname,"","Editor must not follow customer site links.");
  const state=await page.evaluate(()=>({
   roles:[...document.querySelectorAll("[data-busy-edit-section]")].map(x=>x.getAttribute("role")),
   labels:[...document.querySelectorAll("[data-busy-edit-section]")].map(x=>x.getAttribute("aria-label")),
   tabIndices:[...document.querySelectorAll("[data-busy-edit-section]")].map(x=>x.tabIndex),
   overflow:document.documentElement.scrollWidth>innerWidth
  }));
  assert.deepEqual(state.tabIndices,[0,0,0],"Every editable element is keyboard reachable");
  assert.ok(state.roles.slice(0,2).every(x=>x==="button"),"Native text selections exposed as accessible buttons");
  assert.ok(state.labels.every(x=>x?.startsWith("Edit website ")),"Accessible labels on editor targets");
  assert.ok(!state.overflow,"No horizontal overflow at "+width);
  await page.close();
 }
 console.log("V3.140 BROWSER PASS: accessible selection via Enter/Space and blocked CTA navigation at phone/tablet/desktop sizes.");
}finally{await browser.close();}
