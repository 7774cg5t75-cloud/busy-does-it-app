import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {previewWebsiteAIStudio} from "../src/core/websiteAIStudio.mjs";
import {normalizeVisualCritique} from "../supabase/functions/busy-website-worker/visualCriticContract.mjs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const draft={id:"private-owner-1",generation:12,updatedAt:"2026-10-11T12:00:00Z",
 businessName:"Devon Cafe",businessType:"Cafe",publicStatus:"Not published",
 sections:[{id:"hero",title:"Welcome",enabled:true,type:"hero",asset:null}],
 pages:[{id:"home",title:"Home",enabled:true,sectionIds:["hero"]}],
 theme:{cardLayout:"cards"},designPlan:{signals:{approvedPhotos:0}}};
const review=normalizeVisualCritique({reviewedScreenshots:true,summary:"Preview",
 proposals:[{path:"theme.cardLayout",value:"rows",reason:"Improve service rhythm"},
 {path:"theme.typography",value:"refined",reason:"More coherent typography"},
 {path:"theme.spacing",value:"generous",reason:"Roomier sections"}]},{approvedPhotos:0});
assert.ok(review.valid&&review.providerConfirmed);
const render=(d,pageId)=>'<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><main>'+pageId+':'+JSON.stringify(d.theme)+'</main></body></html>';
const rebuild=d=>({...d,generation:d.generation+1,updatedAt:"2026-10-11T12:01:00Z"});
const req={draftId:draft.id,sourceGeneration:draft.generation,
 pageId:"home",deploymentId:"review-123",reviewDeploymentId:"review-123",report:review};
const before=JSON.stringify(draft);
const result=previewWebsiteAIStudio(draft,req,{rebuild,render});
assert.equal(result.ok,true,result.reason);
assert.equal(result.candidates.length,3);
assert.deepEqual(result.candidates.map(x=>x.count),[1,2,3]);
assert.equal(result.autoPublished,false);
assert.equal(result.requiresOwnerApproval,true);
assert.equal(result.laterScreenshotReviewRequired,true);
assert.equal(JSON.stringify(draft),before,"No changes to the live owner draft");
assert.notEqual(result.originalHtml,result.candidates[2].html);
for(const r of [
 {...req,draftId:"different-tenant"},
 {...req,sourceGeneration:11},
 {...req,reviewDeploymentId:"other-deployment"},
 {...req,report:{...review,source:"model-guess"}},
 {...req,report:{...review,providerConfirmed:false}},
 {...req,pageId:"missing"}
 ])assert.equal(previewWebsiteAIStudio(draft,r,{rebuild,render}).ok,false);
assert.equal(previewWebsiteAIStudio(draft,req,{rebuild:()=>{throw Error("offline")},render}).ok,false);
assert.equal(previewWebsiteAIStudio(draft,req,{
 rebuild:d=>({...d,sections:[{id:"hero",title:"Fake business claim"}],generation:d.generation+1}),render
 }).ok,false,"A candidate that changes business content is rejected");
const controller=read("src/app/AppController.js");
for(const s of ["const previewWebsiteVisualAlternatives=","previewWebsiteAIStudio(websiteDraft", 
 "websitePublishingView?.draftChangedSinceHosted","approveWebsiteVisualSuggestionCount",
 "Number.isSafeInteger(chosen)","setWebsiteUndo(items=>[...items,websiteDraft].slice(-8))"])
 assert.ok(controller.includes(s),"Controller safety check "+s);
const ui=read("src/screens/websiteBuilder.js");
for(const s of ["Have BUSY prepare private design alternatives",
 "Keep this reviewed alternative in my private draft",
 "They must be checked on real phone and desktop layouts",
 "aiStudio.deploymentId===s.websiteVisualReview.deploymentId"])
 assert.ok(ui.includes(s),"Customer approval and scope "+s);
console.log("V3.150 STUDIO PASS: validated AI source, staged one to three design options, tenant and revision isolation, no media/content changes or publication.");
