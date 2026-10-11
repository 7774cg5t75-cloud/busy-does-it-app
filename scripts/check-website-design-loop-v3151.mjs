import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {normalizeVisualCritique} from "../supabase/functions/busy-website-design-review/visualCriticContract.mjs";
import {MAX_PASSES,FIELDS,validSource,stageHostedDesignToken,runPrivateWebsiteDesignLoop}
 from "../supabase/functions/busy-website-design-review/designLoop.mjs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const deployment="00000000-0000-4000-8000-000000000099";
const body='mood-clean sector-trades family-conversion tier-rich architecture-full-site visual-hero-type-left visual-cards-cards visual-ornament-ripple visual-nav-quiet visual-type-confident rhythm-comfortable cta-normal photo-focus-center';
const html='<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="busy-deployment" content="'+deployment+'"><style>body{font-size:16px}</style></head><body class="'+body+'"><main><section class="hero hero-large"><h1>Keep actual business words</h1></section><p>Contact 01234 567890</p><a href="tel:01234567890">Call us</a></main><footer>Owned photos and private content remain unchanged</footer></body></html>';
assert.ok(html.length>=300&&validSource(html,deployment));
assert.equal(MAX_PASSES,3);
const good={path:"theme.cardLayout",value:"rows",reason:"A simpler grid"};
let staged=stageHostedDesignToken(html,good,{deploymentId:deployment});
assert.equal(staged.ok,true,staged.reason);
assert.ok(staged.html.includes("visual-cards-rows"));
assert.equal(staged.html.replace("visual-cards-rows","visual-cards-cards"),html,
 "Only ONE finite class token may change");
for(const bad of [
 {path:"theme.paletteVariant",value:"b"},
 {path:"theme.cardLayout",value:"rows;display:none"},
 {path:"theme.heroLayout",value:"url(javascript:alert(1))"},
 {path:"theme.spacing",value:"<script>alert(1)</script>"},
 {path:"theme.ownerData",value:"unsafe"}
])assert.equal(stageHostedDesignToken(html,bad,{deploymentId:deployment}).ok,false);
assert.equal(stageHostedDesignToken(html,good,{deploymentId:"other"}).ok,false);
assert.equal(stageHostedDesignToken(html,good,{deploymentId:deployment}).html.includes("Contact 01234 567890"),true);
assert.equal(validSource(html.replace('<style>','<style></style><style>'),deployment),false);
const start=normalizeVisualCritique({reviewedScreenshots:true,summary:"Private original",
 proposals:[good,{path:"theme.typography",value:"refined",reason:"Better hierarchy"}]},
 {approvedPhotos:0});
const verified={verified:true,mobile:"m".repeat(96),desktop:"d".repeat(96)};
let captures=0,comparisons=0;
const result=await runPrivateWebsiteDesignLoop({html,deploymentId:deployment,
 firstReport:start,maxPasses:3,baseline:verified},{
 captureCandidate:async({html,pass})=>{
  captures++;assert.ok(pass<=3&&html.includes('visual-cards-rows'));
  return {...verified,mobile:"x".repeat(95)+pass};
 },
 compareScreenshots:async({pass,baseline,candidate})=>{
  comparisons++;
  assert.ok(baseline.verified&&candidate.verified);
  return {verdict:pass===1?"better":"worse",reviewedScreenshots:true,
   reason:pass===1?"Better card rhythm on mobile and desktop":"Heading worsened",
   summary:"Actual private candidate screenshot reviewed",
   proposals:[{path:"theme.typography",value:"refined",reason:"Typography adjustment"}]};
 }});
assert.equal(result.ok,true);
assert.equal(captures,2);
assert.equal(comparisons,2);
assert.equal(result.completedPasses,1);
assert.deepEqual(result.bestChanges.map(x=>x.path),["theme.cardLayout"]);
assert.equal(result.passes[1].status,"rejected");
assert.equal(result.published,false);
assert.equal(result.changesApplied,false);
assert.equal(result.requiresOwnerApproval,true);
let spent=0;
const missing=await runPrivateWebsiteDesignLoop({html,deploymentId:deployment,
 firstReport:start,maxPasses:1,baseline:verified},{
 captureCandidate:async()=>{spent++;return {mobile:"x".repeat(90),desktop:"y".repeat(90),verified:false};},
 compareScreenshots:async()=>{spent++;return {verdict:"better",reviewedScreenshots:true};}});
assert.equal(missing.completedPasses,0);
assert.equal(spent,1,"No AI comparison should happen without verified screenshots");
assert.equal((await runPrivateWebsiteDesignLoop({html,deploymentId:deployment,
 firstReport:start,maxPasses:4,baseline:verified},{})).ok,false);
assert.equal((await runPrivateWebsiteDesignLoop({html,deploymentId:deployment,
 firstReport:{...start,source:"guess"},maxPasses:1,baseline:verified},{})).ok,false);
const api=read("supabase/functions/busy-website-design-review/index.ts");
for(const value of ["BUSY_WEBSITE_AUTONOMOUS_DESIGN_ENABLED",
 'cap-used<requestedPasses+1','busy_reserve_website_visual_ai_call',
 'busy_finish_website_visual_ai_call',
 'body.ownerConsent!==true',
 'deployment.data.state!=="preview_ready"',
 'bucket.download(deployment.data.preview_storage_path)',
 'new Blob([html]', 'createSignedUrl(path,600)',
 'imageFromTrustedRenderer(url.data.signedUrl',
 'runPrivateWebsiteDesignLoop({',
 'bucket.remove(stagedPaths)',
 'published:false,changesApplied:false'])
 assert.ok(api.includes(value),"Provider boundary: "+value);
for(const value of ["BUSY_WEBSITE_SCREENSHOT_SECRET",
 'page.setJavaScriptEnabled(false)',
 'parsed.pathname.includes("/deployments/"+deployment+"/")'])
 assert.ok(read("cloudflare/busy-website-screenshot/worker.js").includes(value));
assert.ok(FIELDS["theme.cardLayout"].values.includes("rows"));
console.log("V3.151 DESIGN LOOP PASS: real-candidate provenance contract, finite immutable HTML changes, three-pass ceiling, rollback on unclear/worse, explicit provider allowance.");
