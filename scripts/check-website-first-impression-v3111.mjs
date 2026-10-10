/**
 * Real-browser quality bar for first impressions of fictional websites,
 * complementing V3.109 responsive and V3.110 keyboard/a11y gates.
 */
import assert from "node:assert/strict";
import {chromium} from "playwright";
import {mkdir,readdir,readFile,writeFile} from "node:fs/promises";
import {join,resolve} from "node:path";
const input=resolve(process.argv[2]||"/tmp/busy-v3111-gallery");
const output=resolve(process.argv[3]||"/tmp/busy-v3111-first-impression");
await mkdir(output,{recursive:true});
const files=(await readdir(input)).filter(f=>f.endsWith(".html")).sort();
assert.ok(files.length>=9,"Render several individual business websites");
const browser=await chromium.launch({headless:true});
const checks=[],issues=[];
try{
 for(const name of files){
  const html=await readFile(join(input,name),"utf8");
  for(const width of [320,390,1440]){
   const ctx=await browser.newContext({viewport:{width,height:844},deviceScaleFactor:1});
   const page=await ctx.newPage();
   await page.route("**/*",r=>r.request().url().startsWith("data:")||
     r.request().url().startsWith("about:")?r.continue():r.abort());
   try{
    await page.setContent(html,{waitUntil:"load"});
    const evidence=await page.evaluate(()=>{
      const h=document.querySelector("main h1"),
       cta=document.querySelector("main .cta"),
       title=document.title,
       description=document.querySelector('meta[name="description"]')?.getAttribute("content")||"";
      const box=e=>{const r=e?.getBoundingClientRect();return r?{left:r.left,right:r.right,top:r.top,bottom:r.bottom,height:r.height}:null};
      const hb=box(h),cb=box(cta),w=innerWidth;
      const pageLinks=[...document.querySelectorAll('main a[href^="#"]')].filter(a=>{
        const dest=a.getAttribute("href")?.slice(1);
        return dest&&!document.getElementById(dest);
      }).map(x=>x.getAttribute("href"));
      return {width:w,titleLength:title.trim().length,
       descriptionLength:description.trim().length,h1:hb,cta:cb,
       headingText:h?.textContent?.trim().slice(0,120)||"",
       ctaText:cta?.textContent?.trim().slice(0,80)||"",
       ctaHref:cta?.getAttribute("href")||"",
       brokenAnchorLinks:pageLinks,
       headingTextClipped:!!hb&&(hb.left<-2||hb.right>w+2||hb.height<22),
       ctaOutsideScreen:!!cb&&(cb.left<-2||cb.right>w+2),
       ctaOverlapsHeading:!!cb&&!!hb&&!(cb.bottom<hb.top||cb.top>hb.bottom)
      };
    });
    const record={file:name,...evidence};
    checks.push(record);
    if(evidence.titleLength<4||!evidence.h1||
      evidence.headingTextClipped||evidence.ctaOutsideScreen||
      evidence.ctaOverlapsHeading||evidence.brokenAnchorLinks.length>0)
      issues.push(record);
    if(name===files[0]&&width===390)
      await page.screenshot({path:join(output,"example-first-screen-390.png"),fullPage:false});
   }finally{await ctx.close();}
  }
 }
 await writeFile(join(output,"first-impression-audit.json"),JSON.stringify({
  origin:"offline fiction",browser:"Chromium",customerData:false,paidProviderCalls:0,
  checks:checks.length,issues,records:checks
 },null,2)+"\n");
 assert.equal(issues.length,0,"Unprofessional website opening section: "+JSON.stringify(issues.slice(0,4)));
 console.log("V3.111 PASS: "+checks.length+" real-browser website first-impression checks across phone and desktop.");
}finally{await browser.close();}
