/**
 * V3.126 — real loopback HTTP + Chromium rehearsal with fictional websites.
 * NO Supabase connection, real JWTs, remote staging, production data,
 * externally exposed server, paid AI, domain changes or cloud publishing.
 * The test server listens only on 127.0.0.1 with an ephemeral port.
 */
import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {createServer} from "node:http";
import {mkdir,readFile,writeFile} from "node:fs/promises";
import {join,resolve} from "node:path";
import {chromium} from "playwright";
import {selectRecordedWebsiteDeployment} from "../src/core/websiteDeploymentSelection.mjs";

const gallery=resolve(process.argv[2]||"/tmp/busy-v3126-gallery");
const output=resolve(process.argv[3]||"/tmp/busy-v3126-loopback");
await mkdir(output,{recursive:true});
const uuidA="91edb6db-3a02-4de4-9ba8-5c93b4e790a1";
const uuidB="d8836a0e-fbb0-4cb9-a613-509af50eb114";
const previewA="20f9279e-0dcf-4b1b-aad0-4952c4aab332";
const previewB="0aa3150d-8e85-4ca3-bda2-f8f3dd6c9bcf";
const tokens=new Map([["fictional-owner-a",uuidA],["fictional-owner-b",uuidB]]);
const sha=data=>createHash("sha256").update(data).digest("hex");
const sites=[
 {owner:uuidA,preview:previewA,token:"fictional-owner-a",
  business:"Hillside Gardens",file:"01-gardening-minimal.html"},
 {owner:uuidB,preview:previewB,token:"fictional-owner-b",
  business:"Fire & Table Catering",file:"03-catering-story.html"}
];
for(const site of sites){
 site.content=await readFile(join(gallery,site.file));
 site.digest=sha(site.content);
}
const previews=new Map(sites.map(site=>[site.preview,site]));
const server=createServer((req,res)=>{
 const deny=(status)=>{
  res.writeHead(status,{"Cache-Control":"no-store",
   "X-Robots-Tag":"noindex, nofollow, noarchive",
   "Content-Type":"text/plain; charset=utf-8"});
  res.end("Not available");
 };
 if(req.method!=="GET")return deny(405);
 let url;
 try{url=new URL(req.url,"http://127.0.0.1");}catch{return deny(400);}
 const match=/^\/preview\/([a-f0-9-]{36})$/.exec(url.pathname);
 if(!match||url.search)return deny(404);
 const token=(req.headers.authorization||"").replace(/^Bearer /,"");
 const signedIn=tokens.get(token);
 if(!signedIn)return deny(401);
 const target=previews.get(match[1]);
 if(!target||target.owner!==signedIn)return deny(404);
 res.writeHead(200,{
  "Content-Type":"text/html; charset=utf-8",
  "Cache-Control":"private, no-store, max-age=0",
  "X-Robots-Tag":"noindex, nofollow, noarchive",
  "X-Content-SHA256":target.digest,
  "X-Content-Type-Options":"nosniff",
  "Referrer-Policy":"no-referrer",
  // Real website HTML contains inline styles; block script and frames.
  "Content-Security-Policy":"default-src 'none'; style-src 'unsafe-inline'; img-src data:; font-src data:; base-uri 'none'; form-action 'none'; frame-ancestors 'none'"
 });
 res.end(target.content);
});
await new Promise((resolveListen,reject)=>{
 server.once("error",reject);
 server.listen(0,"127.0.0.1",resolveListen);
});
const port=server.address().port;
const root="http://127.0.0.1:"+port;
let browser;
const results=[];
try{
 async function check(url,token,expected){
  const headers=token?{"Authorization":"Bearer "+token}:{};
  const response=await fetch(root+url,{headers,redirect:"manual"});
  assert.equal(response.status,expected,url+" expected HTTP "+expected);
  if(expected!==200){
   assert.equal(response.headers.get("cache-control"),"no-store");
   return {status:response.status};
  }
  const bytes=Buffer.from(await response.arrayBuffer());
  assert.equal(response.headers.get("x-content-sha256"),sha(bytes),
   "SHA-256 header must reflect exact HTTP response bytes");
  assert.equal(response.headers.get("cache-control"),"private, no-store, max-age=0");
  assert.match(response.headers.get("x-robots-tag")||"",/noindex/);
  return {status:response.status,observedDigest:sha(bytes)};
 }
 const first=await check("/preview/"+previewA,"fictional-owner-a",200);
 const second=await check("/preview/"+previewB,"fictional-owner-b",200);
 assert.equal(first.observedDigest,sites[0].digest);
 assert.equal(second.observedDigest,sites[1].digest);
 await check("/preview/"+previewA,"fictional-owner-b",404);
 await check("/preview/"+previewB,"fictional-owner-a",404);
 await check("/preview/"+previewA,"",401);
 await check("/preview/"+previewB,"fictional-expired-token",401);
 await check("/preview/"+uuidB,"fictional-owner-b",404);
 const mutate=await fetch(root+"/preview/"+previewA,{
  method:"POST",headers:{"Authorization":"Bearer fictional-owner-a"},
  body:"DO NOT WRITE"});
 assert.equal(mutate.status,405,"No mutation route exists");
 const arbitrary=await fetch(root+"/preview/"+previewA,{
  headers:{"Authorization":"Bearer fictional-owner-a","X-Test-Role":"admin"}});
 assert.equal(arbitrary.status,200,"Caller-provided role header has no effect");
 assert.equal(selectRecordedWebsiteDeployment({
  deployments:[{id:previewB,state:"preview_ready"},
               {id:previewA,state:"preview_ready"}],
  website:{current_preview_deployment_id:previewA},kind:"preview"
 }).id,previewA,"Canonical version must beat unordered prior record");
 browser=await chromium.launch({headless:true});
 for(const site of sites){
  for(const [device,width] of [["iphone",390],["desktop",1440]]){
   const context=await browser.newContext({
    viewport:{width,height:850},
    extraHTTPHeaders:{"Authorization":"Bearer "+site.token}
   });
   const page=await context.newPage();
   const external=[];
   await page.route("**/*",route=>{
    const u=route.request().url();
    if(u.startsWith(root+"/preview/")||u.startsWith("data:")||u.startsWith("about:"))
      return route.continue();
    external.push(u.slice(0,50));
    return route.abort();
   });
   try{
    const response=await page.goto(root+"/preview/"+site.preview,{waitUntil:"load"});
    assert.equal(response.status(),200,"Actual loopback browser response");
    const actual=await page.evaluate(()=>({
     body:document.body.innerText,
     overflow:document.documentElement.scrollWidth-innerWidth,
     heading:!!document.querySelector("main h1"),
     validInternalLinks:[...document.querySelectorAll('a[href^="#"]')]
       .map(a=>a.getAttribute("href"))
       .filter(href=>href.length>1)
       .every(href=>!!document.getElementById(decodeURIComponent(href.slice(1))))
    }));
    assert.ok(actual.body.includes(site.business),
      "Website includes correct fictional business identity");
    assert.ok(!actual.body.includes(sites.find(s=>s!==site).business),
      "No other fictional tenant business information");
    assert.ok(actual.heading,"Website presents a real main heading");
    assert.ok(actual.overflow<=2,"No significant horizontal overflow");
    assert.equal(actual.validInternalLinks,true,"All internal links have destinations");
    assert.equal(external.length,0,"Rehearsal does not load external resources");
    const path=join(output,site.file.replace(".html","")+"-"+device+".png");
    await page.screenshot({path,fullPage:false});
    results.push({fixture:site.file,device,routeStatus:200,
      hashedResponse:true,noCrossTenantText:true,noExternalResources:true,
      localHttpOnly:true});
   }finally{await context.close();}
  }
 }
 const evidence={
  status:"local-http-rehearsal-passed",source:"fictional-loopback-ci",
  cloudStagingVerified:false,supabaseRlsVerified:false,httpsVerified:false,
  signedIphoneBuildVerified:false,productionPublishingEnabled:false,
  realCustomerCount:0,providerChargeCount:0,publicWebsiteCreated:false,
  twoTenantReadCasesPassed:2,twoWayForeignReadsDenied:2,
  unauthenticatedDenied:true,expiredSymbolicTokenDenied:true,
  mutationsBlocked:true,artifactBytesHashMatched:true,
  chromiumScreenshots:results.length,results
 };
 await writeFile(join(output,"fictional-loopback-evidence.json"),
  JSON.stringify(evidence,null,2)+"\n");
 console.log("V3.126 PASS: Two fictional tenants, exact SHA-256 previews, two-way denial, 4 browser screenshots and write rejection over 127.0.0.1 only. No real Supabase RLS or HTTPS claim.");
}finally{
 if(browser)await browser.close();
 await new Promise((done,reject)=>server.close(e=>e?reject(e):done()));
}
