/**
 * Chromium renders actual static HTML output packaged for the staging Worker.
 * Browser stays offline; this does NOT verify publicly hosted HTTPS or real JWT.
 */
import assert from "node:assert/strict";
import {mkdir} from "node:fs/promises";
import {chromium} from "playwright";
import {artifacts,sourceSha} from "../staging/generated/preview-worker.mjs";
import {createFictionalHostedPreviewWorker}
 from "../staging/fictional-hosted-preview-worker-v3129.mjs";
const out="/tmp/busy-v3129-browser";
await mkdir(out,{recursive:true});
const host="https://staging.busydoesit.co.uk";
const owners={a:"91edb6db-3a02-4de4-9ba8-5c93b4e790a1",
 b:"d8836a0e-fbb0-4cb9-a613-509af50eb114"};
const env={BUSY_STAGING_SUPABASE_REF:"pnjdlogwegnqbsfpcofw",
 BUSY_PRODUCTION_SUPABASE_REF:"qgkmuiipicazmcxxmoxv",
 BUSY_OTHER_PROTECTED_SUPABASE_REF:"rtqqnqbrqpjondvcyann",
 BUSY_STAGING_EXPECTED_HOST:"staging.busydoesit.co.uk",
 BUSY_STAGING_SOURCE_SHA:sourceSha,
 BUSY_STAGING_PUBLISHABLE_KEY:"sb_publishable_CI_fake_key_not_for_cloud",
 BUSY_STAGING_OWNER_A_ID:owners.a,BUSY_STAGING_OWNER_B_ID:owners.b};
const authFetch=async(_url,options)=>({
 status:200,json:async()=>({id:options.headers.Authorization?.includes("fictionalOwnerA")
  ? owners.a:owners.b})
});
const worker=createFictionalHostedPreviewWorker({assets:artifacts,sourceSha,authFetch});
const browser=await chromium.launch({headless:true});
let checks=0;
try{
 for(const item of artifacts){
  const expected=item.slot==="a"?"Hillside Gardens":"Fire & Table Catering";
  const foreign=item.slot==="a"?"Fire & Table Catering":"Hillside Gardens";
  const token=item.slot==="a"?"fictionalOwnerA_protected_token_1234567890":
   "fictionalOwnerB_protected_token_1234567890";
  const r=await worker.fetch(new Request(host+"/preview/"+item.id,
    {headers:{Authorization:"Bearer "+token}}),env);
  assert.equal(r.status,200,"Offline hosted-preview contract authorizes correct owner");
  const html=await r.text();
  for(const [device,width] of [["phone",390],["desktop",1440]]){
   const context=await browser.newContext({viewport:{width,height:900}});
   const page=await context.newPage();
   const external=[];
   await page.route("**/*",route=>{
    external.push(route.request().url().slice(0,80));
    return route.abort();
   });
   try{
    await page.setContent(html,{waitUntil:"load"});
    const result=await page.evaluate(()=>{
     const text=document.body?.innerText||"";
     const h=document.querySelector("main h1");
     const rect=h?.getBoundingClientRect();
     const validAnchors=[...document.querySelectorAll('a[href^="#"]')]
      .map(a=>a.getAttribute("href")).filter(x=>x.length>1)
      .every(x=>!!document.getElementById(decodeURIComponent(x.slice(1))));
     return {text,heading:!!rect&&rect.width>0&&rect.height>0,
      overflow:document.documentElement.scrollWidth-innerWidth,validAnchors};
    });
    assert.ok(result.text.includes(expected),"Fictional owner website visible");
    assert.ok(!result.text.includes(foreign),"Other business never mixed into fixture");
    assert.equal(result.heading,true,"Visible main heading");
    assert.ok(result.overflow<=2,"No horizontal overflow");
    assert.equal(result.validAnchors,true,"All internal anchors point to sections");
    assert.deepEqual(external,[],"No outside images, fonts or scripts");
    await page.screenshot({path:out+"/"+item.slot+"-"+device+".png",fullPage:false});
    checks+=6;
   }finally{await context.close();}
  }
 }
 console.log("V3.129 PASS: "+checks+" Chromium observations across 2 actual BUSY-built fictional websites and phone/desktop viewports; screenshots saved offline.");
}finally{await browser.close();}
