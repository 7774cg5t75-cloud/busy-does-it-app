import assert from "node:assert/strict";
import {chromium} from "playwright";
import {makeTapToEditHtml} from "../src/core/websiteTapToEdit.mjs";
const raw='<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width,initial-scale=1">'+
 '<style>body{margin:0;font-family:system-ui}main{margin:auto;padding:12px;max-width:700px}'+
 'section{padding:12px 12px 120px;border-radius:9px}h1{font-size:32px;margin:10px 0}'+
 '.space{height:850px}</style></head><body><main>'+
 '<section data-busy-edit-section="hero" data-busy-edit-field="section" data-busy-edit-item="" data-busy-edit-photo-index="">'+
 '<h1 data-busy-edit-section="hero" data-busy-edit-field="title" data-busy-edit-item="" data-busy-edit-photo-index="">Example Studio</h1>'+
 '<p data-busy-edit-section="hero" data-busy-edit-field="body" data-busy-edit-item="" data-busy-edit-photo-index="">Friendly local help.</p></section>'+
 '<div class="space"></div></main></body></html>';
const browser=await chromium.launch({headless:true});
try{
 for(const width of [320,375,390,768]){
  const page=await browser.newPage({viewport:{width,height:740},hasTouch:true,isMobile:true});
  const seen=[];
  await page.exposeFunction("__context",(json)=>seen.push(JSON.parse(json)));
  await page.setContent(makeTapToEditHtml(raw));
  await page.evaluate(()=>{window.ReactNativeWebView={postMessage:window.__context};});
  await page.locator('h1').focus();
  await page.keyboard.press("Enter");
  assert.equal(await page.evaluate(()=>document.activeElement?.getAttribute("data-action")),"edit",
   "Keyboard focus jumps to contextual primary action at "+width);
  const toolbar=page.locator('.busy-selection-toolbar');
  assert.ok(await toolbar.isVisible());
  assert.ok((await toolbar.locator('button[data-action=edit]').getAttribute("aria-label")).includes("title"));
  await page.keyboard.press("Escape");
  assert.equal(await toolbar.isVisible(),false);
  assert.equal(await page.evaluate(()=>document.activeElement?.tagName),"H1",
   "Escape returns keyboard focus to the selected element");
  const section=page.locator('section[data-busy-edit-field=section]');
  await section.tap({position:{x:4,y:120}}); // Tap empty left padding, not a nested heading or paragraph
  assert.equal(await toolbar.locator('button[data-action=edit]').innerText(),"Adjust");
  await toolbar.locator('button[data-action=voice]').tap();
  assert.equal(seen.length,1);
  assert.equal(seen[0].field,"section");
  assert.equal(seen[0].action,"voice");
  const r=await page.evaluate(()=>{
   const box=document.querySelector('.busy-selection-toolbar').getBoundingClientRect();
   return {left:box.left,right:box.right,top:box.top,bottom:box.bottom,
    overflow:document.documentElement.scrollWidth>innerWidth};
  });
  assert.ok(r.left>=0&&r.right<=width+2&&r.top>=0&&r.bottom<=740+2,
   "Toolbar stays visible on narrow/touch viewport");
  assert.equal(r.overflow,false);
  await page.locator('.space').tap({position:{x:20,y:20}});
  assert.equal(await toolbar.isVisible(),false,"Tap outside collapses controls");
  await page.close();
 }
 console.log("V3.147 BROWSER PASS: whole-section touch context, 320px layout, keyboard-first navigation, Escape focus recovery and no outside-click clutter.");
}finally{await browser.close();}
