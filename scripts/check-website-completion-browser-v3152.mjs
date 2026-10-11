import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {chromium} from "playwright";
import {editWebsiteDraftField} from "../src/core/websiteStructuredEditing.mjs";
import {applyWebsiteLayoutOperation} from "../supabase/functions/busy-website-worker/websiteLayoutEditing.mjs";
import {designForWebsite,designCss} from "../supabase/functions/busy-website-worker/designSystem.mjs";
import {planWebsiteDesign} from "../supabase/functions/busy-website-worker/designPlanner.mjs";
import {reviewWebsiteDesign} from "../supabase/functions/busy-website-worker/designReview.mjs";
import {applyWebsiteVisualEdit} from "../supabase/functions/busy-website-worker/designEdits.mjs";
import {normalizeVisualCritique} from "../supabase/functions/busy-website-worker/visualCriticContract.mjs";
import {previewWebsiteAIStudio} from "../src/core/websiteAIStudio.mjs";
import {planWebsitePageInstructions} from "../src/core/websitePageInstructions.mjs";
import {prepareSelectedWebsiteTransaction} from "../src/core/websiteContextPlan.mjs";
import {makeWebsiteRecoveryPoint,restoreWebsiteRecoveryPoint} from "../src/core/websiteRecoveryPoint.mjs";
import {privateBuilderVisualIntegrity} from "../src/core/privateBuilderBoundary.mjs";
import {buildWebsiteLaunchProof} from "../src/core/websiteLaunchProof.mjs";
import {websiteReleaseReadiness} from "../src/core/websiteReleaseReadiness.mjs";
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
]){assert.ok(source.includes(imp));source=source.replace(imp,"");}
const {buildWebsiteDraft,applyWebsiteLayoutChange,renderWebsiteHtml,rebuild}=Function(
 "syncWebsitePageModel","designForWebsite","designCss","planWebsiteDesign","reviewWebsiteDesign",
 "applyWebsiteVisualEdit","editWebsiteDraftField",
 source+";return {buildWebsiteDraft,applyWebsiteLayoutChange,renderWebsiteHtml,rebuild:withHtml};"
)(management.syncWebsitePageModel,designForWebsite,designCss,planWebsiteDesign,reviewWebsiteDesign,applyWebsiteVisualEdit,editWebsiteDraftField);
const samples=[
 {businessName:"Devon Electrical",businessType:"Electrician",
  description:"Owner supplied electric repairs",about:"We fit lights safely.",
  services:[{id:"wiring",name:"Electrical repairs",description:"Electrical repairs and sockets"},
   {id:"lights",name:"Lights",description:"Lighting installation"}]},
 {businessName:"Festival Food",businessType:"Mobile food catering",
  description:"Slow cooked rolls and bowls",about:"We cook at festivals.",
  services:[{id:"roll",name:"Pork rolls",description:"Fresh bread and crackling"},
   {id:"bowl",name:"Hearty bowls",description:"Hot hearty food"}]}
];
const browser=await chromium.launch({headless:true});
try{
 for(const brief of samples){
  const website=buildWebsiteDraft({brandBrain:{websiteReady:true,websiteBrief:{
   ...brief,phone:"01392 111111"}}});
  const initial=JSON.stringify(website);
  const scope={draftId:website.id,generation:website.generation,pageId:"home"};
  const request="make the hero heading bigger on phones; give the services section more space";
  const plan=planWebsitePageInstructions(website,{...scope,instruction:request});
  assert.equal(plan.ok,true,plan.reason);
  const revised=prepareSelectedWebsiteTransaction(website,plan,{
   fieldEdit:()=>({applied:false}),layoutEdit:applyWebsiteLayoutChange});
  assert.equal(revised.applied,true,revised.reason);
  assert.equal(JSON.stringify(website),initial,"Preview/edit preparation cannot mutate source");
  assert.notEqual(revised.draft.generation,website.generation);
  assert.equal(planWebsitePageInstructions(revised.draft,{...scope,instruction:request}).ok,false,
   "Stale AI/page instructions must not apply after change");
  const checkpoint=makeWebsiteRecoveryPoint(website,"2026-10-11T14:00:00Z");
  const restored=restoreWebsiteRecoveryPoint(revised.draft,checkpoint,rebuild);
  assert.equal(restored.applied,true);
  assert.equal(restored.draft.sections.find(s=>s.id==="hero").title,website.sections.find(s=>s.id==="hero").title);
  assert.equal(restored.draft.generation>revised.draft.generation,true);
  const report=normalizeVisualCritique({reviewedScreenshots:true,summary:"Improve appearance",
   proposals:[{path:"theme.cardLayout",value:"rows",reason:"Fewer visual boxes"}]},
   {approvedPhotos:0});
  const preview=previewWebsiteAIStudio(website,{
   draftId:website.id,sourceGeneration:website.generation,pageId:"home",
   deploymentId:"isolated-preview",reviewDeploymentId:"isolated-preview",
   report
  },{rebuild,render:renderWebsiteHtml});
  assert.ok(preview.ok,preview.reason);
  assert.ok(preview.candidates.length>0);
  assert.ok(privateBuilderVisualIntegrity(website,rebuild({
   ...website,theme:{...website.theme,cardLayout:"rows"}})).ok);
  for(const width of [390,768,1440]){
   const page=await browser.newPage({viewport:{width,height:850}});
   try{
    for(const html of [renderWebsiteHtml(website),renderWebsiteHtml(revised.draft),
      preview.originalHtml,preview.candidates[0].html]){
     await page.setContent(html,{waitUntil:"load"});
     const audit=await page.evaluate(()=>({
      viewport:innerWidth,overflow:document.documentElement.scrollWidth>innerWidth+2,
      unwantedScripts:document.scripts.length,
      hero:document.querySelector("h1")?.textContent||"",
      phone:document.body.textContent.includes("01392 111111")
     }));
     assert.equal(audit.viewport,width);
     assert.equal(audit.overflow,false,brief.businessName+" overflow at "+width);
     assert.equal(audit.unwantedScripts,0,"Preview must stay static");
     assert.ok(audit.phone&&audit.hero.length>0);
     assert.ok((await page.screenshot({type:"png"})).length>1000);
    }
   }finally{await page.close();}
  }
  assert.equal(buildWebsiteLaunchProof({websiteDraftPresent:true}).verified,false,
   "A local render cannot be mistaken for live public delivery");
  assert.equal(websiteReleaseReadiness({}).status,"blocked");
  console.log("INTEGRATED "+brief.businessType+" PASS: edit/undo, AI alternative, phone/tablet/desktop screenshots and gated publishing.");
 }
}finally{await browser.close();}
console.log("V3.152 WEBSITE COMPLETION BROWSER PASS: two different real design families, no source mutations, private AI variations and full screen-size regression.");
