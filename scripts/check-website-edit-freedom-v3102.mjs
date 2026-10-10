import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {planWebsiteDesign} from "../supabase/functions/busy-website-worker/designPlanner.mjs";
import {designForWebsite,designCss} from "../supabase/functions/busy-website-worker/designSystem.mjs";
import {reviewWebsiteDesign} from "../supabase/functions/busy-website-worker/designReview.mjs";
import {applyWebsiteVisualEdit} from "../supabase/functions/busy-website-worker/designEdits.mjs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const strip=s=>s.replace(/export\s*\{[\s\S]*?\};?\s*$/,"");
const model=Function(strip(read("src/domain/websiteManagement.js"))+";return {syncWebsitePageModel};")();
let source=strip(read("src/domain/websiteBuilder.js"));
for(const exp of [
  'import { syncWebsitePageModel } from "./websiteManagement";',
  'import { designForWebsite, designCss } from "../../supabase/functions/busy-website-worker/designSystem.mjs";',
  'import { planWebsiteDesign } from "../../supabase/functions/busy-website-worker/designPlanner.mjs";',
  'import { reviewWebsiteDesign } from "../../supabase/functions/busy-website-worker/designReview.mjs";',
  'import { applyWebsiteVisualEdit } from "../../supabase/functions/busy-website-worker/designEdits.mjs";',
]){ assert.ok(source.includes(exp),exp);source=source.replace(exp,"");}
const {buildWebsiteDraft,applyWebsiteInstruction}=Function(
 "syncWebsitePageModel","designForWebsite","designCss","planWebsiteDesign","reviewWebsiteDesign","applyWebsiteVisualEdit",
 source+";return {buildWebsiteDraft,applyWebsiteInstruction};")(
 model.syncWebsitePageModel,designForWebsite,designCss,planWebsiteDesign,reviewWebsiteDesign,applyWebsiteVisualEdit
);
let checks=0;
const yes=(v,msg)=>{assert.ok(v,msg);checks++};
const eq=(v,w,msg)=>{assert.deepEqual(v,w,msg);checks++};
const site=buildWebsiteDraft({brandBrain:{websiteReady:true,websiteBrief:{
 businessName:"Elmwood Gardens",businessType:"Gardening",
 services:[{id:"lawn",name:"Lawn cutting"},{id:"hedges",name:"Hedge trimming"}],
 serviceArea:"Exeter",phone:"01392 100100",about:"We work on gardens in Exeter and surrounding areas.",
 description:"Lawn cutting and hedge trimming.",
}}});
const changed=(prompt,draft=site)=>applyWebsiteInstruction(draft,prompt);
for(const [prompt,key,value] of [
 ["use a minimal design","designFamily","minimal"],
 ["change primary colour to blue","primary","#205978"],
 ["set secondary colour to gold","secondary","#97702B"],
 ["use service cards outlines","cardLayout","outlines"],
 ["center the main headline","heroLayout","type-center"],
]){
 const x=changed(prompt);yes(x.applied,prompt);eq(x.draft.theme[key],value,prompt+" actually changes theme");
 yes(x.draft.html.includes("visual-cards-")&&x.draft.designReview?.checks?.length>0,prompt+" regenerates safe draft");
 yes(x.draft.publicStatus==="Not published","No edits auto-publish a website");
}
const changeSection=changed("change services heading to Our garden care");
yes(changeSection.applied,"Customer can change individual section heading");
yes(changeSection.draft.html.includes("Our garden care"),"Section heading rendered");
const changeAbout=changed("change about text to We provide lawn and hedge care in Exeter.");
yes(changeAbout.applied,"Customer can change their own about copy");
yes(changeAbout.draft.html.includes("We provide lawn and hedge care in Exeter."),"Exact customer copy rendered");
const service=changed("change description for Lawn cutting to Regular mowing for gardens in Exeter.");
yes(service.applied,"Edit a specific service description");
yes(service.draft.html.includes("Regular mowing for gardens in Exeter."),"Service edit visible in preview");
const reorder=changed("move about before services");
yes(reorder.applied,"Reorder individual sections");
yes(reorder.draft.designPlan.sectionOrder.indexOf("about")<reorder.draft.designPlan.sectionOrder.indexOf("services"),"Section order retained in design plan");
yes(reorder.draft.html.indexOf('id="about"')<reorder.draft.html.indexOf('id="services"'),"Actual HTML order follows owner");
const falsePhoto=changed("replace hero photo with some random stock photo");
yes(!falsePhoto.applied,"No invented/unlicensed hero photo from vague instruction");
yes(!falsePhoto.draft.html.includes("stock-photo"),"No stock image injected");
const invalidColour=changed("change the colour to javascript");
yes(!invalidColour.applied,"Reject unsupported/insecure colour");
const invalidSection=changed("move testimonials before services");
yes(!invalidSection.applied,"Can't create fictional testimonial section");
const photoStyle=changed("use a portfolio design");
yes(!photoStyle.applied,"Photo-led portfolio style needs approved images");
const fakeService=changed("change description for Award Winning to We are the best");
yes(!fakeService.applied,"No invented service from approximate name");
yes(site.designPlan.visualIdentity.fingerprint===changed("change about text to New copy").draft.designPlan.visualIdentity.fingerprint,
 "Changing wording does not randomly change business visual identity");
const worker=read("supabase/functions/busy-website-worker/index.ts");
yes(worker.includes("plan.sectionOrder"),"Hosted renderer honours owned order");
yes(worker.includes('name="busy-deployment"'),"Signed hosted preview markers unchanged");
const pub=read("src/screens/websitePublishing.js");
yes(pub.includes("reviewedHostedPreview!==preview.id"),"Explicit go-live review gate remains");
const pkg=JSON.parse(read("package.json")), app=JSON.parse(read("app.json")).expo;
yes(["3.102.0","3.103.0"].includes(pkg.version),"Editing sweep supported");eq(app.version,pkg.version,"App version");
eq(app.ios.buildNumber,String(Number(pkg.version.split(".")[1])-80),"iOS metadata");eq(app.android.versionCode,Number(pkg.version.split(".")[1])-80),"Android metadata");
yes(read(".github/workflows/production-check.yml").includes("check-website-edit-freedom-v3102.mjs"),"CI regression enforced");
console.log("V3.102 PASS:",checks,"customer-directed section, content, identity and contrast-safe design edits; no publication.");
