import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {planWebsitePageInstructions,prepareWebsitePageInstructionPreview} from "../src/core/websitePageInstructions.mjs";
import {applyWebsiteLayoutOperation} from "../supabase/functions/busy-website-worker/websiteLayoutEditing.mjs";
import {planSelectedWebsiteChanges,MAX_STEPS} from "../src/core/websiteContextPlan.mjs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const d={id:"owner-1",generation:9,pages:[{id:"home",enabled:true,sectionIds:["hero","services","about","gallery","contact"]},
 {id:"other",enabled:true,sectionIds:["contact"]}],theme:{},
 sections:[{id:"hero",type:"hero",title:"Welcome",enabled:true,cta:"Book",ctaHref:"/contact"},
  {id:"services",type:"services",title:"Our services",enabled:true},
  {id:"about",type:"about",title:"About us",enabled:true},
  {id:"gallery",type:"gallery",title:"Gallery",enabled:true,
   items:[{approved:true,storagePath:"owner-1/food.jpg"}]},
  {id:"contact",type:"contact",title:"Contact us",enabled:true}]};
const opts={draftId:d.id,generation:d.generation,pageId:"home"};
const sentence="move the services section down; make the hero heading smaller on phones; make the gallery photos larger on desktop; give the about section more space";
const original=JSON.stringify(d);
const plan=planWebsitePageInstructions(d,{...opts,instruction:sentence});
assert.equal(plan.ok,true,plan.reason);
assert.equal(plan.steps.length,4);
assert.deepEqual(plan.steps.map(x=>x.change.field),[undefined,"mobileHeadingScale","desktopGallerySize","sectionSpacing"]);
assert.equal(MAX_STEPS,10);
const safeLayout=(draft,change)=>{
 const next=applyWebsiteLayoutOperation(draft,change);
 return next.applied?{...next,draft:{...next.draft,generation:draft.generation+1}}:next;
};
const renderPage=(draft,pageId)=>'<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><main>'+
 pageId+':'+JSON.stringify(draft.sections.find(x=>x.id==="hero").appearance||{})+'</main></body></html>';
const comparison=prepareWebsitePageInstructionPreview(d,{...opts,instruction:sentence},{layoutEdit:safeLayout,renderPage});
assert.equal(comparison.ok,true,comparison.reason);
assert.ok(comparison.neverPublishes);
assert.notEqual(comparison.originalHtml,comparison.candidateHtml);
assert.equal(JSON.stringify(d),original,"No draft mutation from comparison");
for(const corrupt of [
 {...opts,draftId:"different-customer",instruction:sentence},
 {...opts,generation:8,instruction:sentence},
 {...opts,pageId:"other",instruction:sentence},
 {...opts,instruction:"publish the website"},
 {...opts,instruction:"make the contact section more beautiful"},
 {...opts,instruction:"move the services section down; move the services section up"},
 {...opts,instruction:"move the services section down; delete the about section"},
 {...opts,instruction:"move the services section down; move the services section down"}
 ])assert.equal(planWebsitePageInstructions(d,corrupt).ok,false,JSON.stringify(corrupt));
const failed=prepareWebsitePageInstructionPreview(d,{...opts,
 instruction:"make the hero heading larger; make the gallery photos smaller"},{
  layoutEdit:(draft,op)=>op.sectionId==="gallery"?{applied:false,reason:"Simulated failure"}:safeLayout(draft,op),
  renderPage
 });
assert.equal(failed.ok,false,"Second-step rollback");
assert.equal(JSON.stringify(d),original);
const originalCode=read("src/app/AppController.js"),ui=read("src/screens/websiteBuilder.js");
assert.ok(originalCode.includes("prepareWebsitePageInstructionPreview(current"));
assert.ok(originalCode.includes("planWebsitePageInstructions(current"));
assert.ok(originalCode.includes("setWebsiteUndo(items=>[...items,current].slice(-8))"));
assert.ok(ui.includes("Preview changes — do not save"));
assert.ok(ui.includes('pagePlanPreview.steps.length+" reviewed changes together"'));
console.log("V3.149 PAGE PLAN PASS: exact named multi-section atomic changes, private preview, no cross-tenant or stale edits.");
