import assert from "node:assert/strict";
import {chromium} from "playwright";
import {makeWebsiteVisualCheckHtml,reviewWebsiteVisualCheck}
 from "../src/core/websiteVisualCheck.mjs";
import {compareWebsiteVisualReports} from "../src/core/websiteMeasuredDesignCoach.mjs";
const browser=await chromium.launch({headless:true});
async function measure(width,style,key){
 const p=await browser.newPage({viewport:{width,height:844}});
 const messages=[];
 await p.exposeFunction("__receiveBusyReport",message=>messages.push(JSON.parse(message)));
 try{
  const html=`<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width,initial-scale=1">
   <style>body{margin:0;background:#fff;color:#111}main{padding:20px}
   h1{font-size:32px;margin:0 0 20px}p{font-size:17px;line-height:1.6}
   ${style}</style></head><body><main><section><h1>Garden design for Devon</h1>
   <p>Beautiful gardens, planned and cared for locally.</p>
   <p class="other">A second informative paragraph.</p>
   </section></main></body></html>`;
  await p.setContent(makeWebsiteVisualCheckHtml(html,key));
  await p.evaluate(()=>{window.ReactNativeWebView={postMessage:window.__receiveBusyReport};});
  for(let i=0;i<35&&!messages.length;i++)await p.waitForTimeout(100);
  assert.equal(messages.length,1,"One bounded DOM report at "+width+"px");
  const result=reviewWebsiteVisualCheck(messages[0],key);
  assert.ok(result,"Viewport-scoped report expected");
  assert.equal(result.counts.viewport,width);
  return result;
 }finally{await p.close();}
}
try{
 for(const width of [390,768,1440]){
  const original=await measure(width,"","original:"+width);
  assert.equal(original.counts.lowContrast,0,"Legible black-on-white text");
  assert.equal(original.counts.smallBodyText,0,"Normal readable paragraph size");
  assert.ok(original.counts.contrastChecked>=3,"Actual styled text was measured");
  const broken=await measure(width,"p{font-size:11px;color:rgb(200,200,200)}","bad:"+width);
  assert.ok(broken.counts.lowContrast>=2,"Low-contrast text detected from actual computed styles");
  assert.ok(broken.counts.smallBodyText>=2,"Small text detected from actual rendered size");
  const comparison=compareWebsiteVisualReports(original,broken);
  assert.ok(comparison.valid&&!comparison.noNewMeasuredProblems,
   "Lowering contrast and font size must block approving alternative");
  const reversed=compareWebsiteVisualReports(broken,original);
  assert.ok(reversed.valid&&reversed.improved,
   "Recovering legibility must be reported as a measured improvement");
 }
 const unknown=await measure(390,"p.other{background-image:linear-gradient(red,blue)}","complex:390");
 assert.ok(unknown.counts.contrastUnknown>=1,
  "Complex gradient background must not be labelled accessible without measurement");
 console.log("V3.145 BROWSER PASS: Chromium verified actual text contrast, small text, unknown gradient coverage and safe before/after at 390/768/1440.");
}finally{await browser.close();}
