import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {privateBuilderRevisionMatches,privateBuilderVisualIntegrity}
 from "../src/core/privateBuilderBoundary.mjs";
import {previewWebsiteAIStudio} from "../src/core/websiteAIStudio.mjs";
import {planWebsitePageInstructions} from "../src/core/websitePageInstructions.mjs";
import {normalizeVisualCritique,applyApprovedVisualProposals}
 from "../supabase/functions/busy-website-worker/visualCriticContract.mjs";
const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const draft={id:"owner-a",generation:22,updatedAt:"2026-10-11T12:00:00Z",
 businessName:"Catering Devon",businessType:"Event catering",
 description:"Customer-authored food menu",publicStatus:"Published previously",
 phone:"01392 000000",seo:{description:"Original owner text"},
 navigation:[{id:"home",href:"/"}],ownerUserId:"owner-a",
 pages:[{id:"home",enabled:true,sectionIds:["hero","gallery","contact"]}],
 sections:[{id:"hero",type:"hero",title:"Only approved pork rolls"},
 {id:"gallery",type:"gallery",items:[{id:"photo1",approved:true,uri:"https://example.invalid/food.jpg"}]},
 {id:"contact",type:"contact",phone:"01392 000000"}],
 theme:{cardLayout:"cards",typography:"confident",ctaEmphasis:"normal"},
 designPlan:{signals:{approvedPhotos:1}},assets:[{id:"photo1"}]};
assert.ok(privateBuilderRevisionMatches(draft,{draftId:draft.id,generation:22,pageId:"home"}));
for(const change of [
 {draftId:"owner-b",generation:22,pageId:"home"},
 {draftId:"owner-a",generation:23,pageId:"home"},
 {draftId:"owner-a",generation:22,pageId:"missing"}])
 assert.equal(privateBuilderRevisionMatches(draft,change),false);
const candidate={...draft,theme:{...draft.theme,cardLayout:"rows"},generation:23,
 updatedAt:"2026-10-11T13:00:00Z",html:"Rendered private preview",designReview:{pass:true}};
assert.equal(privateBuilderVisualIntegrity(draft,candidate).ok,true);
for(const mutated of [
 {...candidate,phone:"not their number"},
 {...candidate,navigation:[{href:"https://evil.invalid"}]},
 {...candidate,sections:[{id:"hero",title:"False health claim"}]},
 {...candidate,seo:{description:"changed without approval"}},
 {...candidate,ownerUserId:"different-user"},
 {...candidate,publicStatus:"Live"},
 {...candidate,assets:[]},
 {...candidate,pages:[{id:"home",enabled:false}]},
 {...candidate,theme:{...candidate.theme,customCss:"body{display:none}"}},
 {...candidate,theme:{...candidate.theme,cardLayout:"javascript:alert(1)"}},
 {...candidate,generation:22}
 ])assert.equal(privateBuilderVisualIntegrity(draft,mutated).ok,false,
  "Reject non-design edit: "+JSON.stringify(mutated));
const html=(site)=>'<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><main>'+JSON.stringify(site.theme)+'</main></body></html>';
const review=normalizeVisualCritique({reviewedScreenshots:true,summary:"Try clearer cards",
 proposals:[{path:"theme.cardLayout",value:"rows",reason:"Improves card hierarchy"}]},{approvedPhotos:1});
const args={draftId:draft.id,sourceGeneration:22,pageId:"home",
 deploymentId:"preview-immutable",reviewDeploymentId:"preview-immutable",report:review};
const allowed=previewWebsiteAIStudio(draft,args,{rebuild:site=>({...site,
 generation:site.generation+1,updatedAt:"2026-10-11T13:00:00Z"}),render:html});
assert.equal(allowed.ok,true,allowed.reason);
assert.equal(allowed.candidates.length,1);
assert.equal(JSON.stringify(draft.sections[0]),JSON.stringify({id:"hero",type:"hero",title:"Only approved pork rolls"}));
const poisoned=previewWebsiteAIStudio(draft,args,{rebuild:site=>({
 ...site,generation:site.generation+1,seo:{description:"Hacked"},theme:site.theme
}),render:html});
assert.equal(poisoned.ok,false,"Unsafe design preview must be refused");
const malformed=previewWebsiteAIStudio(draft,args,{rebuild:site=>({
 ...site,generation:site.generation+1,theme:{...site.theme,customCss:"html{display:none}"}
}),render:html});
assert.equal(malformed.ok,false);
const planned=planWebsitePageInstructions(draft,{
 draftId:draft.id,generation:draft.generation,pageId:"home",
 instruction:"make the hero heading bigger on phones"
});
assert.ok(planned.ok,planned.reason);
assert.equal(planWebsitePageInstructions(draft,{
 draftId:draft.id,generation:draft.generation,pageId:"not-your-page",
 instruction:"make the hero heading bigger on phones"
}).ok,false);
const ctl=read("src/app/AppController.js");
assert.ok(ctl.includes("privateBuilderVisualIntegrity(websiteDraft,next)"));
assert.ok(ctl.includes('commitReviewedBuilderDraft(websiteDraft,next,"Prepared reviewed visual changes.")'));
assert.ok(ctl.includes("setWebsiteUndo(items=>[...items,current].slice(-8))"));
const contract=read("supabase/functions/busy-website-design-review/designLoop.mjs");
assert.ok(contract.includes("published:false,changesApplied:false"));
console.log("V3.152 INTEGRITY PASS: preview and final Keep are owner/revision-bound, never change business facts, photos, navigation, SEO, publication or custom CSS.");
