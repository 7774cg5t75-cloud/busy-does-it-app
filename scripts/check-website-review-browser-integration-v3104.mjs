/**
 * Offline end-to-end V3.104 QA — ACTUAL Chromium screenshots of a fictional
 * website and a revision, but SIMULATED model feedback and credit reservation.
 * Never send customer images, call providers, modify a database, or publish.
 */
import assert from "node:assert/strict";
import {readFileSync,writeFileSync,mkdirSync} from "node:fs";
import {resolve,join} from "node:path";
import {chromium} from "playwright";
import {runWebsiteDesignReviewCycle} from "../supabase/functions/busy-website-worker/websiteReviewCycle.mjs";
import {planWebsiteDesign} from "../supabase/functions/busy-website-worker/designPlanner.mjs";
import {designForWebsite,designCss} from "../supabase/functions/busy-website-worker/designSystem.mjs";
import {reviewWebsiteDesign} from "../supabase/functions/busy-website-worker/designReview.mjs";
import {applyWebsiteVisualEdit} from "../supabase/functions/busy-website-worker/designEdits.mjs";
import {normalizeVisualCritique} from "../supabase/functions/busy-website-worker/visualCriticContract.mjs";

const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const strip=s=>s.replace(/export\s*\{[\s\S]*?\};?\s*$/,"");
const model=Function(strip(read("src/domain/websiteManagement.js"))+";return {syncWebsitePageModel};")();
let source=strip(read("src/domain/websiteBuilder.js"));
for(const imp of [
 'import { syncWebsitePageModel } from "./websiteManagement";',
 'import { designForWebsite, designCss } from "../../supabase/functions/busy-website-worker/designSystem.mjs";',
 'import { planWebsiteDesign } from "../../supabase/functions/busy-website-worker/designPlanner.mjs";',
 'import { reviewWebsiteDesign } from "../../supabase/functions/busy-website-worker/designReview.mjs";',
 'import { applyWebsiteVisualEdit } from "../../supabase/functions/busy-website-worker/designEdits.mjs";',
]){assert.ok(source.includes(imp),imp);source=source.replace(imp,"");}
const renderer=Function("syncWebsitePageModel","designForWebsite","designCss",
 "planWebsiteDesign","reviewWebsiteDesign","applyWebsiteVisualEdit",
 source+";return {buildWebsiteDraft,withHtml};")(
 model.syncWebsitePageModel,designForWebsite,designCss,planWebsiteDesign,
 reviewWebsiteDesign,applyWebsiteVisualEdit
);
const original=renderer.buildWebsiteDraft({brandBrain:{
 websiteReady:true,websiteBrief:{
 businessName:"Fictional Hillside Gardens",businessType:"Gardening",serviceArea:"Exeter",
 services:[{id:"lawns",name:"Lawn cutting",description:"Regular lawn mowing"},
 {id:"hedges",name:"Hedge care",description:"Seasonal hedge trimming"}]
}}});
const out=resolve(process.argv[2]||"/tmp/busy-v3104-private-review");
mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true});
let visionCalls=0,shots=0;
const captureScreenshots=async(draft,{stage,tenantId})=>{
 assert.equal(tenantId,"fictional-business-a");
 const result={source:"local-real-chromium"};
 for(const [name,viewport]of [
  ["mobile",{width:390,height:844}],["desktop",{width:1440,height:900}]
 ]){
  const ctx=await browser.newContext({viewport,deviceScaleFactor:1});
  const page=await ctx.newPage();
  await page.route("**/*",route=>{
   if(route.request().url().startsWith("data:")||route.request().url().startsWith("about:"))
    return route.continue();
   return route.abort();
  });
  try{
   await page.setContent(draft.html,{waitUntil:"load"});
   const audit=await page.evaluate(()=>{
    const root=document.documentElement;
    const h=document.querySelector("main h1");
    const nav=document.querySelector("nav");
    const links=Array.from(nav?.querySelectorAll("a")||[]);
    return {
     horizontalOverflowPixels:Math.max(0,root.scrollWidth-window.innerWidth),
     headingVisible:!!h&&h.getBoundingClientRect().width>0&&h.getBoundingClientRect().height>0,
     heroHeadingFontPx:h?parseFloat(getComputedStyle(h).fontSize):0,
     navigationFits:links.every(a=>{
       const b=a.getBoundingClientRect();return b.left>=-2&&b.right<=window.innerWidth+2;
     })
    };
   });
   const bytes=await page.screenshot({fullPage:true});
   shots++;
   result[name]=bytes;result[name+"Audit"]=audit;
   writeFileSync(join(out,stage+"-"+name+".png"),bytes);
  }finally{await ctx.close();}
 }
 return result;
};
const visionReview=async({mobile,desktop})=>{
 assert.ok(mobile.length>100&&desktop.length>100);
 visionCalls++;
 // This is a MOCK vision response used for integration, not a real AI call.
 const report=normalizeVisualCritique({
  reviewedScreenshots:true,summary:"Mock suggestion: use outlined service cards.",
  proposals:[{path:"theme.cardLayout",value:"outlines",reason:"Mock layout suggestion"}]
 },{approvedPhotos:0});
 return {status:"completed",source:"screenshot-ai",providerCalls:1,report,
  usage:{inputTokens:0,outputTokens:0}};
};
try{
 const result=await runWebsiteDesignReviewCycle({
  draft:original,tenantId:"fictional-business-a",allowedTenantId:"fictional-business-a",
  consent:true,allowPaidReview:true,ownerApprovedSuggestions:true,
  creditReservation:{reservationId:"fictional-qa-reservation",tenantId:"fictional-business-a",
   status:"reserved",maxCalls:1},
  captureScreenshots,visionReview,
  rebuildPrivateDraft:async d=>renderer.withHtml(d)
 });
 assert.equal(result.status,"candidate-ready",result.reason);
 assert.equal(visionCalls,1);
 assert.equal(shots,4);
 assert.equal(result.candidate.theme.cardLayout,"outlines");
 assert.equal(result.candidate.businessName,original.businessName);
 assert.deepEqual(result.candidate.sections,original.sections);
 assert.deepEqual(result.candidate.publish,original.publish);
 assert.notEqual(result.candidate.html,original.html);
 assert.equal(original.publicStatus,"Not published");
 writeFileSync(join(out,"private-website-review-cycle.json"),
  JSON.stringify({
   demo:true,simulatedVisionProvider:true,paidProviderCalls:0,published:false,
   status:result.status,original:result.original,revised:result.revised,
   comparison:result.comparison,ownerApprovedPrivateStyling:true,
   note:"This QA report compares real Chromium screenshots; the AI feedback is simulated."
  },null,2));
 console.log("V3.104 PASS: 4 real Chromium screenshots, one MOCK vision suggestion, safe private revision and recheck.");
}finally{await browser.close();}
