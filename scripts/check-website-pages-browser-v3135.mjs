/**
 * Actual Chromium renders for the owner's private multi-page HTML generated
 * by the same draft source. Fictional content only, no cloud calls.
 */
import assert from "node:assert/strict";
import {chromium} from "playwright";
import {readFileSync,mkdirSync} from "node:fs";
const root="/tmp/busy-v3135-pages";
const files=[
 ["Home","index.html","Coastal Flower Studio",false],
 ["Meet the Team","pages/meet-the-team/index.html","Meet the Team",true]
];
const browser=await chromium.launch({headless:true});
try{
 for(const width of [390,1440]){
  for(const [label,path,expected,hasTeam] of files){
   const html=readFileSync(root+"/"+path,"utf8");
   const page=await browser.newPage({viewport:{width,height:900},deviceScaleFactor:1});
   await page.route("**/*",r=>r.abort());
   await page.setContent(html,{waitUntil:"load"});
   const details=await page.evaluate(()=>({
    title:document.title,
    h1:document.querySelector("h1")?.textContent,
    sectionText:document.querySelector("main")?.textContent||"",
    links:[...document.querySelectorAll("nav a")].map(a=>a.textContent),
    overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth+1,
    scriptCount:document.querySelectorAll("script").length,
    sections:document.querySelectorAll("main section").length,
    anchors:[...document.querySelectorAll("main [id]")].map(a=>a.id)
   }));
   assert.ok(details.title.includes(expected),"Page-specific SEO: "+label);
   assert.ok(details.h1?.includes(expected),"Semantic H1 on "+label);
   assert.equal(details.overflow,false,label+" overflow at "+width+"px");
   assert.equal(details.scriptCount,0,"Editable website concept has no executable scripts");
   assert.equal(details.sectionText.includes("Our friendly team prepares arrangements."),hasTeam,
    "Owner-only content appears on exactly the selected page");
   assert.ok(details.sections>0,"Page must contain actual visible content");
   mkdirSync(root+"/evidence",{recursive:true});
   await page.screenshot({path:root+"/evidence/"+(hasTeam?"team":"home")+"-"+width+".png",fullPage:true});
   console.log("V3.135 REAL BROWSER PASS:",label,width+"px",JSON.stringify(details));
   await page.close();
  }
 }
}finally{await browser.close();}
