import assert from "node:assert/strict";
import {chromium} from "playwright";
import {mkdirSync} from "node:fs";
const root="/tmp/busy-v3136-zip/extracted";
mkdirSync("/tmp/busy-v3136-zip/evidence",{recursive:true});
const browser=await chromium.launch({headless:true});
try{
 for(const width of [390,1440]){
  const page=await browser.newPage({viewport:{width,height:900},deviceScaleFactor:1});
  const remote=[];
  page.on("request",request=>{
    if(/^https?:/i.test(request.url()))remote.push(request.url());
  });
  await page.goto("file://"+root+"/index.html",{waitUntil:"load"});
  const home=await page.evaluate(()=>({
   h1:document.querySelector("h1")?.textContent||"",
   links:[...document.querySelectorAll("nav a")].map(x=>({text:x.textContent,href:x.getAttribute("href")})),
   photos:[...document.querySelectorAll("img")].map(x=>({url:x.getAttribute("src"),width:x.naturalWidth})),
   overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth+1
  }));
  assert.match(home.h1,/Meadow Fictional Florists/);
  assert.equal(home.overflow,false,"Phone and desktop home remain responsive");
  assert.ok(home.photos.some(x=>x.width===1&&x.url?.startsWith("assets/")),
   "Home uses real unpacked local original image");
  const customLink=home.links.find(x=>x.text?.includes("Meet our makers"));
  assert.ok(customLink?.href==="pages/meet-our-makers/index.html",
   "Nested owner page reachable from website navigation");
  await page.screenshot({path:"/tmp/busy-v3136-zip/evidence/home-"+width+".png",fullPage:true});
  await page.getByRole("link",{name:"Meet our makers"}).click();
  await page.waitForLoadState("load");
  const custom=await page.evaluate(()=>({
   h1:document.querySelector("h1")?.textContent||"",
   text:document.querySelector("main")?.textContent||"",
   photo:[...document.images].map(x=>({src:x.getAttribute("src"),width:x.naturalWidth})),
   overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth+1,
   href:document.querySelector("a.brand")?.getAttribute("href")||""
  }));
  assert.match(custom.h1,/Meet our makers/);
  assert.match(custom.text,/Beautiful flowers arranged with care/);
  assert.equal(custom.overflow,false,"Nested photo feature has no horizontal overflow");
  assert.ok(custom.photo.some(x=>x.width===1&&x.src==="../../assets/photo-001.png"),
   "Nested page finds the actual local image without internet: "+JSON.stringify(custom.photo));
  assert.equal(custom.href,"../../index.html","Nested page links back to root");
  await page.screenshot({path:"/tmp/busy-v3136-zip/evidence/photo-page-"+width+".png",fullPage:true});
  await page.getByRole("link",{name:"Meadow Fictional Florists"}).click();
  await page.waitForLoadState("load");
  assert.equal(await page.locator("h1").first().textContent(),"Meadow Fictional Florists");
  assert.deepEqual(remote,[],"Static site works offline with no remote media or resources");
  console.log("V3.136 OFFLINE CHROMIUM PASS",width+"px",JSON.stringify({home,custom}));
  await page.close();
 }
}finally{await browser.close();}
