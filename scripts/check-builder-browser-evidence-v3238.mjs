/**
 * V3.238: real Chromium screenshots from the ORIGINAL first-party builder
 * gallery's two fictional draft alternatives. Absolutely no external URLs,
 * customer data, provider calls, deployment, paid AI or device signing.
 *
 * Workflow:
 * node scripts/build-website-design-gallery-v3100.mjs /tmp/bdi-v3238-gallery
 * node scripts/check-builder-browser-evidence-v3238.mjs
 */
import assert from "node:assert/strict";
import {readFileSync,writeFileSync,mkdirSync,copyFileSync} from "node:fs";
import {resolve,join} from "node:path";
import {createHash} from "node:crypto";
import {chromium} from "playwright";
import {makeWebsiteVisualCheckHtml,reviewWebsiteVisualCheck}
 from "../src/core/websiteVisualCheck.mjs";
import {planUniversalBuilderRequest}
 from "../src/core/universalBuilderPlanV3210.mjs";
import {verifyOfflineBuilderCapturePacketV3238 as verify}
 from "./lib/verifyBuilderVisualArtifactsV3238.mjs";
const gallery=resolve("/tmp/bdi-v3238-gallery");
const destination=resolve("/tmp/bdi-v3238-visual-evidence");
mkdirSync(destination,{recursive:true});
const read=name=>readFileSync(join(gallery,name),"utf8");
const originalHtml=read("01-gardening-minimal.html");
const candidateHtml=read("01-gardening-minimal-candidate.html");
assert.notEqual(originalHtml,candidateHtml,"Both designs must be distinct.");
for(const html of [originalHtml,candidateHtml]){
 assert.ok(html.startsWith("<!doctype html>"),"Only first-party HTML.");
 assert.doesNotMatch(html,/<script\b|<iframe\b/i,"No pre-existing active scripts.");
 assert.doesNotMatch(html,/(?:src|href)\s*=\s*["']\s*(?:https?:|\/\/)/i,
  "No network media in fictional gallery.");
}
const sha=x=>createHash("sha256").update(x).digest("hex");
const businessId="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const website={id:"fixture-garden-source",businessId,generation:7,
 businessType:"Gardening",pages:[{id:"home",enabled:true,sectionIds:["hero","services","contact"]}],
 sections:[{id:"hero",type:"hero",enabled:true,title:"Hillside Gardens"},
  {id:"services",type:"services",enabled:true,items:[{title:"Lawn care"},{title:"Hedge trimming"}]},
  {id:"contact",type:"contact",enabled:true,phone:""}]};
const plan=planUniversalBuilderRequest({request:"Show our services",
 businessId,businessType:"Gardening",website,app:null,catalog:[]});
assert.equal(plan.ok,true);
const source={businessId,websiteId:website.id,generation:website.generation,
 pageId:"home",sourceCommit:/^[a-f0-9]{40}$/i.test(process.env.GITHUB_SHA||"")?
  process.env.GITHUB_SHA:"local-run-not-a-signed-commit",
 originalHtmlSha256:sha(originalHtml),candidateHtmlSha256:sha(candidateHtml)};
const variants=[["original",originalHtml],["candidate",candidateHtml]];
const screens=[["phone",390,844],["tablet",768,1024],["desktop",1440,900]];
const browser=await chromium.launch({headless:true});
let blockedExternal=0;
const captures=[];
async function capture(variant,html,device,width,height){
 const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1});
 const reports=[];
 try{
  await page.route("**/*",route=>{
   const url=route.request().url();
   if(url.startsWith("data:"))return route.continue();
   blockedExternal++;
   return route.abort();
  });
  await page.exposeFunction("__busyVisualFixtureMessage",raw=>{
   reports.push(JSON.parse(raw));
  });
  const key="fixture:"+variant+":"+device+":g7:home";
  const injected=makeWebsiteVisualCheckHtml(html,key);
  await page.setContent(injected,{waitUntil:"load",timeout:15000});
  // setContent(document.write) does not always replay addInitScript.
  await page.evaluate(()=>{window.ReactNativeWebView={
   postMessage:raw=>window.__busyVisualFixtureMessage(raw)
  };});
  for(let retry=0;retry<40&&!reports.length;retry++)
   await page.waitForTimeout(100);
  assert.equal(reports.length,1,"One actual browser report for "+variant+" "+device);
  const report=reviewWebsiteVisualCheck(reports[0],key);
  assert.ok(report,"First-party metrics must validate.");
  assert.equal(report.counts.viewport,width);
  assert.ok(report.counts.sections>0&&report.counts.headings>0,
   "Actual original builder's headings/sections rendered.");
  const file=variant+"-"+device+".png";
  const buffer=await page.screenshot({fullPage:true,type:"png"});
  assert.ok(buffer.length>1000);
  writeFileSync(join(destination,file),buffer);
  captures.push({variant,device,width,viewportHeight:height,file,
   pngSha256:sha(buffer),pngBytes:buffer.length,
   htmlSha256:source[variant+"HtmlSha256"],reportSha256:sha(JSON.stringify(report)),
   report});
 }finally{await page.close();}
}
try{
 for(const [variant,html] of variants)
  for(const [device,width,height] of screens)
   await capture(variant,html,device,width,height);
 assert.equal(blockedExternal,0,"No external resource may be requested.");
 const packet={kind:"offline_builder_visual_capture_v3238",
  fictionalOnly:true,networkRequestsAllowed:false,actualHostedCustomerSite:false,
  screenshotsFromRealChromium:true,
  generatedFrom:"first-party fictional website gallery",
  source,captures};
 const checked=verify({packet,artifactDir:destination,originalHtml,candidateHtml,
  businessId,website,plan,pageId:"home"});
 assert.equal(checked.ok,true,checked.reason);
 assert.equal(checked.screenshotCount,6);
 assert.equal(checked.canApply,false);
 assert.equal(checked.canPublish,false);
 assert.equal(checked.comparison.noAppDeviceMeasurement,true);
 const copy=JSON.parse(JSON.stringify(packet));
 copy.captures[0].pngSha256="0".repeat(64);
 assert.equal(verify({packet:copy,artifactDir:destination,
  originalHtml,candidateHtml,businessId,website,plan,pageId:"home"}).ok,false,
  "Tampered screenshot fingerprint must fail.");
 const altered=JSON.parse(JSON.stringify(packet));
 altered.captures[0].report.counts.overflow=99;
 assert.equal(verify({packet:altered,artifactDir:destination,
  originalHtml,candidateHtml,businessId,website,plan,pageId:"home"}).ok,false,
  "Tampered measurements must fail.");
 const swapped=JSON.parse(JSON.stringify(packet));
 swapped.captures[0].sourceHtmlSha256="0".repeat(64);
 assert.equal(verify({packet,artifactDir:destination,originalHtml,
  candidateHtml,businessId:"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  website,plan,pageId:"home"}).ok,false,"Wrong business must fail.");
 assert.equal(verify({packet,artifactDir:destination,originalHtml,
  candidateHtml,businessId,website:{...website,generation:8},
  plan,pageId:"home"}).ok,false,"Stale revision must fail.");
 const difference=checked.comparison;
 const safeSummary={
  captureType:"REAL_OFFLINE_CHROMIUM_FICTIONAL_WEBSITE",
  screenshots:checked.screenshotCount,
  deviceWidths:difference.results.map(x=>x.width),
  candidateReviewEligible:difference.eligibleForOwnerReview,
  anyMeasuredRegressions:difference.regressionDevices.length>0,
  actualHostedCustomerSite:false,customerJourneyVerified:false,
  verifiedHashes:true,
  provenanceAttested:false,
  noPaidBuild:true,noProviderCalls:true,noWebsitePublished:true
 };
 writeFileSync(join(destination,"capture-manifest.json"),
  JSON.stringify(packet,null,2)+"\n");
 writeFileSync(join(destination,"visual-review-result.json"),
  JSON.stringify({summary:safeSummary,comparison:difference},null,2)+"\n");
 // Prove a deliberately broken responsive candidate is rejected using the
 // ORIGINAL measured baseline, without pretending this is a genuine design.
 const damaged=originalHtml.replace("</style>",
  "main{min-width:1900px!important}</style>");
 assert.notEqual(damaged,originalHtml);
 const probe=await browser.newPage({viewport:{width:390,height:844}});
 const probeMessages=[];
 try{
  await probe.exposeFunction("__busyBrokenProbe",raw=>probeMessages.push(JSON.parse(raw)));
  await probe.route("**/*",route=>route.abort());
  await probe.setContent(makeWebsiteVisualCheckHtml(damaged,"broken:fixture:phone"));
  await probe.evaluate(()=>{window.ReactNativeWebView={
   postMessage:raw=>window.__busyBrokenProbe(raw)};});
  for(let i=0;i<40&&!probeMessages.length;i++)await probe.waitForTimeout(100);
  assert.equal(probeMessages.length,1);
  const broken=reviewWebsiteVisualCheck(probeMessages[0],"broken:fixture:phone");
  assert.ok(broken.issues.some(x=>x.id==="overflow"),
   "Real Chromium catches deliberate horizontal overflow.");
 }finally{await probe.close();}
 console.log("V3.238 BROWSER PASS: 6 real Chromium PNG screenshots at phone/tablet/desktop, exact first-party fictional original/candidate, manifest hash verification, tamper/tenant/revision rejection and actual overflow regression. No provider calls or paid builds.");
 console.log("Visual review candidate:",difference.summary);
}finally{await browser.close();}
