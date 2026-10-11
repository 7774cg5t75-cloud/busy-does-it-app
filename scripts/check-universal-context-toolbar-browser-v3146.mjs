import assert from "node:assert/strict";
import {chromium} from "playwright";
import {makeTapToEditHtml} from "../src/core/websiteTapToEdit.mjs";
const raw='<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width,initial-scale=1">'+
 '<style>body{margin:0;font-family:system-ui}main{padding:16px;max-width:900px;margin:auto}'+
 'h1,p,a,img{display:block;margin:18px 0}img{width:100%;max-height:240px;object-fit:cover}'+
 '.spacer{height:850px}</style></head><body><main>'+
 '<h1 data-busy-edit-section="hero" data-busy-edit-field="title" data-busy-edit-item="" data-busy-edit-photo-index="">Garden Studio</h1>'+
 '<p data-busy-edit-section="hero" data-busy-edit-field="body" data-busy-edit-item="" data-busy-edit-photo-index="">Personal garden design.</p>'+
 '<img alt="Example approved garden photograph" src="data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 200 200%22%3E%3Crect width=%22200%22 height=%22200%22 fill=%22%2381a499%22/%3E%3C/svg%3E" data-busy-edit-section="hero" data-busy-edit-field="photo" data-busy-edit-item="" data-busy-edit-photo-index="">'+
 '<div class="spacer"></div><a href="https://invalid.example/offsite" data-busy-edit-section="hero" data-busy-edit-field="cta" data-busy-edit-item="" data-busy-edit-photo-index="">Contact this garden studio</a>'+
 '</main></body></html>';
const browser=await chromium.launch({headless:true});
try{
 for(const width of [375,390,768,1440]){
  const page=await browser.newPage({viewport:{width,height:760}});
  const events=[];
  await page.exposeFunction("__bridge",(json)=>events.push(JSON.parse(json)));
  await page.route("https://invalid.example/**",route=>route.abort());
  await page.setContent(makeTapToEditHtml(raw));
  await page.evaluate(()=>{window.ReactNativeWebView={postMessage:window.__bridge};});
  assert.equal(await page.locator(".busy-selection-toolbar:visible").count(),0,"Toolbar stays hidden by default");
  const heading=page.locator("h1[data-busy-edit-field=title]");
  await heading.click();
  assert.equal(events.length,0,"Selecting is not an editing command");
  const toolbar=page.locator(".busy-selection-toolbar");
  assert.equal(await toolbar.isVisible(),true);
  assert.equal(await toolbar.getAttribute("role"),"toolbar");
  assert.equal(await toolbar.locator("button").count(),3);
  let geometry=await page.evaluate(()=>{
   const r=document.querySelector(".busy-selection-toolbar").getBoundingClientRect();
   const selected=document.querySelector(".busy-selected-for-edit").getBoundingClientRect();
   const buttons=[...document.querySelectorAll(".busy-selection-toolbar button")];
   return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,
    selectedBottom:selected.bottom,widths:buttons.map(b=>b.getBoundingClientRect().width),
    heights:buttons.map(b=>b.getBoundingClientRect().height),
    overflow:document.documentElement.scrollWidth>innerWidth};
  });
  assert.ok(geometry.left>=0&&geometry.right<=width+2,"Toolbar fits screen "+width);
  assert.ok(geometry.top>=geometry.selectedBottom||geometry.bottom<=geometry.selectedBottom,
   "Toolbar adjacent to selected element");
  assert.ok(geometry.widths.every(x=>x>=44)&&geometry.heights.every(x=>x>=44),
   "All actions remain finger-friendly");
  assert.equal(geometry.overflow,false);
  await toolbar.locator("button[data-action=edit]").click();
  assert.deepEqual(events.map(x=>x.action),["edit"]);
  assert.equal(events[0].field,"title");
  const photo=page.locator("img[data-busy-edit-field=photo]");
  await photo.click();
  assert.equal(await toolbar.locator("button[data-action=edit]").innerText(),"Replace",
   "Photo shows Replace instead of generic Edit");
  await toolbar.locator("button[data-action=voice]").click();
  assert.deepEqual(events.map(x=>x.action),["edit","voice"]);
  assert.equal(events[1].field,"photo");
  assert.equal(events[1].sectionId,"hero");
  await page.locator("a[data-busy-edit-field=cta]").click();
  assert.equal(new URL(page.url()).hostname,"","Clicking real website CTA doesn't navigate in editor");
  await toolbar.locator("button[data-action=more]").click();
  assert.equal(events[2].action,"more");
  assert.equal(events[2].field,"cta");
  const view=await page.evaluate(()=>{
   const r=document.querySelector(".busy-selection-toolbar").getBoundingClientRect();
   return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,
    scrollWidth:document.documentElement.scrollWidth};
  });
  assert.ok(view.left>=0&&view.right<=width+2&&view.top>=0&&view.bottom<=760+2,
    "Floating toolbar stays inside visible viewport near bottom link");
  assert.ok(view.scrollWidth<=width+2);
  await page.keyboard.press("Escape");
  assert.equal(await toolbar.isVisible(),false,"Escape dismisses selection controls");
  await heading.focus();
  await heading.press("Enter");
  assert.equal(await toolbar.isVisible(),true,"Keyboard selection opens toolbar");
  await toolbar.locator("button[data-action=voice]").focus();
  await page.keyboard.press("Enter");
  assert.equal(events[3].action,"voice","Keyboard can initiate the exact selected context");
  await page.close();
 }
 console.log("V3.146 BROWSER PASS: responsive floating toolbar, selection-only highlighting, 44px targets, scoped voice/More actions, Escape and CTA navigation guard.");
}finally{await browser.close();}
