import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {chromium} from "playwright";
import {designForWebsite,designCss} from "../supabase/functions/busy-website-worker/designSystem.mjs";
import {planWebsiteDesign} from "../supabase/functions/busy-website-worker/designPlanner.mjs";
import {reviewWebsiteDesign} from "../supabase/functions/busy-website-worker/designReview.mjs";
import {applyWebsiteVisualEdit} from "../supabase/functions/busy-website-worker/designEdits.mjs";
import {editWebsiteDraftField} from "../src/core/websiteStructuredEditing.mjs";
import {reviewScreenshots,validateScreenshot} from "./lib/websiteVisionReview-v3103.mjs";
import {applyApprovedVisualProposals} from "../supabase/functions/busy-website-worker/visualCriticContract.mjs";
import {compareWebsiteAudits} from "../supabase/functions/busy-website-worker/websiteReviewCycle.mjs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const strip=s=>s.replace(/export\s*\{[\s\S]*?\};?\s*$/,"");
const management=Function(strip(read("src/domain/websiteManagement.js"))+";return {syncWebsitePageModel};")();
let source=strip(read("src/domain/websiteBuilder.js"));
for(const imp of [
 'import { syncWebsitePageModel } from "./websiteManagement";',
 'import { designForWebsite, designCss } from "../../supabase/functions/busy-website-worker/designSystem.mjs";',
 'import { planWebsiteDesign } from "../../supabase/functions/busy-website-worker/designPlanner.mjs";',
 'import { reviewWebsiteDesign } from "../../supabase/functions/busy-website-worker/designReview.mjs";',
 'import { applyWebsiteVisualEdit } from "../../supabase/functions/busy-website-worker/designEdits.mjs";'
]){assert.ok(source.includes(imp),"Domain import missing");source=source.replace(imp,"");}
const {buildWebsiteDraft,renderWebsiteHtml,rebuildPrivateWebsiteDraft}=Function(
 "syncWebsitePageModel","designForWebsite","designCss","planWebsiteDesign",
 "reviewWebsiteDesign","applyWebsiteVisualEdit","editWebsiteDraftField",
 source+";return {buildWebsiteDraft,renderWebsiteHtml,rebuildPrivateWebsiteDraft:withHtml};"
)(management.syncWebsitePageModel,designForWebsite,designCss,planWebsiteDesign,reviewWebsiteDesign,applyWebsiteVisualEdit,editWebsiteDraftField);
const brief={websiteReady:true,websiteBrief:{
 businessName:"Fictional Web Design Gardens",businessType:"Gardening",description:"Local garden design.",
 tagline:"Beautiful garden planning.",about:"Independent garden design team.",
 phone:"01234 567890",email:"contact@example.test",
 services:[{id:"a",name:"Garden layout",description:"An accurate planting plan"},
 {id:"b",name:"Garden maintenance",description:"Routine maintenance"}]
}};
const draft=buildWebsiteDraft({brandBrain:brief}),original=JSON.stringify(draft);
const browser=await chromium.launch({headless:true});
const screenshots={};
const auditOne=async(page)=>page.evaluate(()=>{
 const root=document.documentElement;
 const h=document.querySelector("main h1");
 const r=h?.getBoundingClientRect();
 const nav=document.querySelector("nav");
 const links=[...document.querySelectorAll("nav a")];
 return {horizontalOverflowPixels:Math.max(0,root.scrollWidth-innerWidth),
   headingVisible:!!r&&r.width>0&&r.height>0,
   navigationFits:(!nav||nav.getBoundingClientRect().width<=innerWidth+2)&&
     links.every(x=>x.getBoundingClientRect().right<=innerWidth+2),
   heroHeadingFontPx:h?parseFloat(getComputedStyle(h).fontSize)||0:0};
});
async function captureAll(html,broken=false){
 const out={};
 for(const [name,width,height] of [["mobile",390,844],["desktop",1440,900]]){
  const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1});
  await page.route("**/*",route=>route.request().url().startsWith("data:")
    ?route.continue():route.abort());
  let pageHtml=html;
  if(broken)pageHtml=html.replace("</style>",
    "main{min-width:1900px!important}</style>");
  try{
   await page.setContent(pageHtml,{waitUntil:"load"});
   out[name]=await page.screenshot({fullPage:false,type:"png"});
   out[name+"Audit"]=await auditOne(page);
  }finally{await page.close();}
 }
 return out;
}
try{
 const baseline=await captureAll(renderWebsiteHtml(draft));
 for(const name of ["mobile","desktop"])
  assert.ok(validateScreenshot(baseline[name],name).width>300,
    "Real Chromium PNG evidence for "+name);
 const disabled=await reviewScreenshots({mobile:baseline.mobile,desktop:baseline.desktop,
  enabled:false,ownerApproved:false,apiKey:"unit-fake-key",model:"gpt-test",
  fetchImpl:()=>{throw Error("Never send without permission");}});
 assert.equal(disabled.providerCalls,0);
 let requests=0;
 const mockProvider=async(_url,options)=>{
  requests++;
  assert.equal(options.method,"POST");
  const body=JSON.parse(options.body);
  assert.equal(body.store,false,"Never store customer screenshots with provider");
  assert.equal(body.input[0].content.filter(c=>c.type==="input_image").length,2);
  for(const image of body.input[0].content.filter(c=>c.type==="input_image")){
   assert.ok(image.image_url.startsWith("data:image/png;base64,"));
   assert.equal(validateScreenshot(Buffer.from(image.image_url.split(",")[1],"base64"),"embedded").width>=320,true);
  }
  return {ok:true,json:async()=>({
   output:[{content:[{type:"output_text",text:JSON.stringify({
    summary:"Fictional screenshot-only test: try simpler service rows.",
    proposals:[{path:"theme.cardLayout",value:"rows",reason:"Test more space between service entries"},
     {path:"theme.unsafeHtml",value:"<script>",reason:"Must be discarded"}]
   })}]}],usage:{input_tokens:240,output_tokens:60}
  })};
 };
 const review=await reviewScreenshots({mobile:baseline.mobile,desktop:baseline.desktop,
  enabled:true,ownerApproved:true,apiKey:"unit-fake-key",model:"gpt-test",
  approvedPhotos:0,fetchImpl:mockProvider});
 assert.equal(requests,1,"Exactly one mocked screenshot-review request");
 assert.equal(review.status,"completed");
 assert.equal(review.report.proposals.length,1,"Unsafe proposal discarded");
 assert.equal(review.report.proposals[0].path,"theme.cardLayout");
 const approved=applyApprovedVisualProposals(draft,review.report,{ownerApproved:true});
 assert.equal(approved.applied,true);
 const rebuilt=rebuildPrivateWebsiteDraft(approved.draft);
 const candidate=await captureAll(renderWebsiteHtml(rebuilt));
 const comparison=compareWebsiteAudits(baseline,candidate);
 assert.ok(comparison.valid&&comparison.noNewMeasuredProblems,
  "Actual responsive screenshot candidate must not introduce measured issues");
 const damaged=await captureAll(renderWebsiteHtml(rebuilt),true);
 const rejected=compareWebsiteAudits(baseline,damaged);
 assert.ok(rejected.valid&&!rejected.noNewMeasuredProblems,
  "Widening candidate to 1900px is independently caught and rejected");
 assert.equal(JSON.stringify(draft),original,"Original owner site never modified");
 assert.equal(draft.publicStatus,"Not published");
 console.log("V3.144 SCREENSHOTS PASS: real offline Chromium mobile/desktop PNG, one mocked vision request with opt-in, strict safe proposal, before/after browser recheck and rejection of a regression. Paid provider calls: 0.");
}finally{await browser.close();}
