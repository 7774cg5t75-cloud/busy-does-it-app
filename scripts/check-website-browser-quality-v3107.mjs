/**
 * V3.107 Chromium acceptance tests, fictional local HTML only.
 * No customer URLs, network calls, paid vision models or publication.
 */
import assert from "node:assert/strict";
import {chromium} from "playwright";
import {mkdir,writeFile} from "node:fs/promises";
import {resolve,join} from "node:path";
import {measureWebsiteQuality} from "./lib/websiteQualityAudit-v3107.mjs";
import {compareWebsiteAudits,visualRisks,hasMeasuredAudits} from "../supabase/functions/busy-website-worker/websiteReviewCycle.mjs";

const good=`<!doctype html><html lang="en"><head>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
body{margin:0;background:#fff;color:#182738;font-family:Arial,sans-serif;line-height:1.5}
main,nav{padding:24px}h1{font-size:40px}p{font-size:18px}
nav a,main a,main button{display:inline-block;padding:14px 18px;min-height:44px;background:#182738;color:white;text-decoration:none;border:0}
main label{display:block;padding-block:9px}
</style></head><body><nav><a href="#start">Home</a></nav>
<main id="start"><h1>Fictional garden studio</h1><p>Welcome to a genuinely readable website.</p>
<a href="#contact">Learn more</a><section id="contact"><h2>Get in touch</h2>
<label for="email">Email address</label><input id="email" type="email" />
<button type="button">Request details</button></section></main></body></html>`;
const bad=`<!doctype html><html lang=""><head><meta name="viewport" content="width=device-width, initial-scale=1">
<style>body{margin:0;background:white;color:#182738;font-family:Arial,sans-serif}
main,nav{padding:20px}h1{font-size:40px}p{font-size:11px;color:#bebebe}
a.small{display:inline-block;font-size:9px;width:18px;height:14px;overflow:hidden;color:#bbb;background:white}
</style></head><body><nav><a class="small" href="#">Go</a></nav>
<main><h1>Fictional garden studio</h1><h3>Missing h2</h3>
<p>Light grey tiny text that visitors will struggle to read.</p>
<a class="small" href="#"></a><button style="width:12px;height:12px;padding:0">Go</button>
<input id="email" type="email" placeholder="Email" />
<img src="data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20width='36'%20height='36'%3E%3Crect%20width='36'%20height='36'%20fill='blue'/%3E%3C/svg%3E" width="36" height="36">
</main></body></html>`;
const gradient=`<!doctype html><html lang="en"><style>
body{background:#fff;color:#000}main{padding:30px;background:linear-gradient(white,#ddd)}
p{font-size:18px}
</style><main><h1>Fictional test</h1><p>Gradient contrast must be marked unknown.</p></main></html>`;
const dir=resolve(process.argv[2]||"/tmp/busy-v3107-accessibility");
await mkdir(dir,{recursive:true});
const browser=await chromium.launch({headless:true});
const audits={};
try{
  for(const [variant,html]of [["good",good],["bad",bad]]){
    const result={};
    for(const [size,viewport]of [["mobile",{width:390,height:844}],["desktop",{width:1440,height:900}]]){
      const context=await browser.newContext({viewport});
      const page=await context.newPage();
      await page.route("**/*",route=>{
        const url=route.request().url();
        return url.startsWith("data:")||url.startsWith("about:")?route.continue():route.abort();
      });
      try{
        await page.setContent(html,{waitUntil:"load"});
        const qualityAudit=await measureWebsiteQuality(page);
        const h=page.locator("main h1");
        result[size+"Audit"]={
          horizontalOverflowPixels:await page.evaluate(()=>Math.max(0,document.documentElement.scrollWidth-innerWidth)),
          headingVisible:await h.isVisible(),
          navigationFits:true,
          heroHeadingFontPx:Number.parseFloat(await h.evaluate(x=>getComputedStyle(x).fontSize)),
          qualityAudit
        };
        await page.screenshot({path:join(dir,variant+"-"+size+".png"),fullPage:true});
      }finally{await context.close();}
    }
    audits[variant]=result;
    assert.ok(hasMeasuredAudits(result),variant+" needs complete real-browser measurements");
  }
  const clean=audits.good.mobileAudit.qualityAudit;
  const poor=audits.bad.mobileAudit.qualityAudit;
  assert.ok(clean.assessedTextCount>0,"The good page actually has assessed colours");
  assert.equal(clean.lowContrastCount,0,"Good contrast is measured and clear");
  assert.equal(clean.smallBodyTextCount,0,"Comfortable paragraphs are not too small");
  assert.equal(clean.smallTouchTargetCount,0,"Good interactive targets are large enough");
  assert.equal(clean.missingInputLabelCount,0,"Explicit form labels pass");
  assert.equal(clean.hasDocumentLanguage,true,"Document language recorded");
  for(const field of ["lowContrastCount","smallBodyTextCount","smallTouchTargetCount",
    "unnamedControlsCount","missingInputLabelCount","missingImageAltCount",
    "headingLevelSkips"])assert.ok(poor[field]>0,"Poor page exposes "+field);
  assert.equal(poor.hasDocumentLanguage,false,"Missing HTML language is detected");
  const contrast=compareWebsiteAudits(audits.good,audits.bad);
  assert.equal(contrast.valid,true);
  assert.equal(contrast.noNewMeasuredProblems,false,"Do not approve an inaccessible change");
  assert.ok(contrast.newProblems.length>=6,"Real browser identifies distinct accessibility regressions");
  const repair=compareWebsiteAudits(audits.bad,audits.good);
  assert.equal(repair.improved,true,"Repair reduces measured problems");
  const gc=await browser.newContext({viewport:{width:390,height:844}});
  const gp=await gc.newPage();
  try{
    await gp.setContent(gradient,{waitUntil:"load"});
    const g=await measureWebsiteQuality(gp);
    assert.ok(g.unassessedContrastCount>0,"Gradient cannot be counted as known contrast");
    assert.equal(g.lowContrastCount,0,"Unmeasurable contrast is not invented as a failure");
  }finally{await gc.close();}
  const report={
    source:"real-chromium",fictionalOnly:true,paidAiCalls:0,published:false,
    original:audits.good,candidate:audits.bad,
    comparison:contrast,repair,originalIssues:visualRisks(audits.good),candidateIssues:visualRisks(audits.bad)
  };
  await writeFile(join(dir,"fictional-browser-quality-report.json"),JSON.stringify(report,null,2)+"\n");
  console.log("V3.107 PASS: 4 real browser screenshots, measured contrast, text, targets, labels, alt, headings and rejected accessibility regressions.");
}finally{await browser.close();}
