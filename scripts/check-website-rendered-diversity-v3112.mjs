/**
 * Actual Chromium computed design diversity: changing business names alone
 * is insufficient to pass. Fictional sites, no external assets or AI calls.
 */
import assert from "node:assert/strict";
import {chromium} from "playwright";
import {createHash} from "node:crypto";
import {readdir,mkdir,readFile,writeFile} from "node:fs/promises";
import {join,resolve} from "node:path";
const input=resolve(process.argv[2]||"/tmp/busy-v3112-gallery");
const output=resolve(process.argv[3]||"/tmp/busy-v3112-diversity");
await mkdir(output,{recursive:true});
const files=(await readdir(input)).filter(x=>/^(?:01|02|03|04|05)-.*\.html$/.test(x)).sort();
assert.equal(files.length,5,"Five different fictional industries required");
const browser=await chromium.launch({headless:true}),records=[];
try{
 for(const file of files){
  const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1});
  const page=await context.newPage();
  await page.route("**/*",r=>r.request().url().startsWith("about:")||
   r.request().url().startsWith("data:")?r.continue():r.abort());
  try{
   await page.setContent(await readFile(join(input,file),"utf8"),{waitUntil:"load"});
   const style=await page.evaluate(()=>{
    const main=document.querySelector("main"),hero=document.querySelector(".hero");
    const h=hero?getComputedStyle(hero):null;
    const heading=main?.querySelector("h1"),call=main?.querySelector(".cta");
    const hc=heading?getComputedStyle(heading):null;
    const cc=call?getComputedStyle(call):null;
    return {theme:document.body.className,
     hero:hero?.className||"",bg:h?.backgroundColor||"",
     gradient:h?.backgroundImage||"",font:hc?.fontFamily||"",
     button:cc?.backgroundColor||"",radius:cc?.borderRadius||"",
     heading:!!heading?.textContent?.trim()};
   });
   assert.ok(style.heading,file+" must display a real headline");
   const png=await page.screenshot({fullPage:false});
   records.push({file,...style,visualHash:createHash("sha256").update(png).digest("hex")});
   await writeFile(join(output,file.replace(".html",".png")),png);
  }finally{await context.close();}
 }
 const visuals=new Set(records.map(x=>x.visualHash));
 const styles=new Set(records.map(x=>JSON.stringify([
  x.theme,x.hero,x.bg,x.gradient,x.font,x.button,x.radius])));
 assert.equal(visuals.size,5,"Five distinct screenshots, not one recycled template");
 assert.ok(styles.size>=4,"At least four computed design identities: "+styles.size);
 await writeFile(join(output,"visual-diversity.json"),JSON.stringify({
  realChromium:true,fictionalOnly:true,checks:records.length,distinctVisuals:visuals.size,
  distinctDesignIdentities:styles.size,records
 },null,2)+"\n");
 console.log("V3.112 PASS: "+records.length+" screenshot designs and "+styles.size+
   " distinct actual design identities across fictional industries.");
}finally{await browser.close();}
