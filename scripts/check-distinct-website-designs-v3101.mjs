import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {planWebsiteDesign,selectVisualIdentity} from "../supabase/functions/busy-website-worker/designPlanner.mjs";
import {designForWebsite,designCss} from "../supabase/functions/busy-website-worker/designSystem.mjs";
import {reviewWebsiteDesign} from "../supabase/functions/busy-website-worker/designReview.mjs";
import {applyWebsiteVisualEdit} from "../supabase/functions/busy-website-worker/designEdits.mjs";

const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const strip=s=>s.replace(/export\s*\{[\s\S]*?\};?\s*$/,"");
const m=Function(strip(read("src/domain/websiteManagement.js"))+";return {syncWebsitePageModel};")();
const builder=strip(read("src/domain/websiteBuilder.js"))
 .replace(/^import \{ syncWebsitePageModel \} from "\.\/websiteManagement";\s*/,"")
 .replace(/^import \{ designForWebsite, designCss \} from "\.\.\/\.\.\/supabase\/functions\/busy-website-worker\/designSystem\.mjs";\s*/,"")
 .replace(/^import \{ planWebsiteDesign \} from "\.\.\/\.\.\/supabase\/functions\/busy-website-worker\/designPlanner\.mjs";\s*/,"")
 .replace(/^import \{ reviewWebsiteDesign \} from "\.\.\/\.\.\/supabase\/functions\/busy-website-worker\/designReview\.mjs";\s*/,"")
 .replace(/^import \{ applyWebsiteVisualEdit \} from "\.\.\/\.\.\/supabase\/functions\/busy-website-worker\/designEdits\.mjs";\s*/,"");
const app=Function("syncWebsitePageModel","designForWebsite","designCss","planWebsiteDesign","reviewWebsiteDesign","applyWebsiteVisualEdit",
 builder+";return {buildWebsiteDraft,applyWebsiteInstruction};")(m.syncWebsitePageModel,designForWebsite,designCss,planWebsiteDesign,reviewWebsiteDesign,applyWebsiteVisualEdit);
let n=0;
const ok=(x,msg)=>{assert.ok(x,msg);n++};
const eq=(a,b,msg)=>{assert.deepEqual(a,b,msg);n++};
const site=(businessName,type="Exterior cleaning",theme={})=>app.buildWebsiteDraft({
 brandBrain:{websiteReady:true,websiteBrief:{
  businessName,businessType:type,services:[
   {id:"driveways",name:"Driveway cleaning"},
   {id:"patios",name:"Patio cleaning"}],
  serviceArea:"Exeter",
  ...theme
 }}});
const names=[
 "Seabright Cleaning","Clearline Surfaces","Fresh Path Exeter",
 "Evergreen Pressure Cleaning","Atlas Exterior Care","Whitewater Outdoors",
 "Rockwell Jet Wash","Westmoor Exterior Services","Patio Revival Co",
 "Coastal Surface Care","Sunrise Driveway Care","Green Lane Wash",
 "Riverside Property Care","Devon Shine","Brightleaf Cleaning",
 "Goldstone Patio Services","Hilltop Exterior Care","Cleanline Devon",
 "Silverpine Outdoor Cleaning","Oakfield Property Care"
];
const samples=names.map(nm=>site(nm));
const fingerprints=new Set(samples.map(s=>s.designPlan.visualIdentity.fingerprint));
const families=new Set(samples.map(s=>s.designPlan.family));
ok(families.size>=3,"Similar trade businesses must span at least three genuinely different overall layout families");
ok(fingerprints.size>=14,"20 same-sector businesses must NOT get one near-identical composition");
eq(samples.length,20);
for(const sample of samples){
 const second=site(sample.businessName);
 eq(sample.designPlan.visualIdentity,second.designPlan.visualIdentity,"Visual identity stable across runs");
 ok(["conversion","editorial","minimal"].includes(sample.designPlan.family),"Same sector uses an appropriate but not fixed design family");
 ok(sample.html.includes("visual-hero-"+sample.designPlan.visualIdentity.heroLayout),"Chosen hero affects real HTML");
 ok(sample.html.includes("visual-cards-"+sample.designPlan.visualIdentity.cardLayout),"Chosen cards affect real HTML");
 ok(sample.html.includes("visual-nav-"+sample.designPlan.visualIdentity.navStyle),"Chosen navigation affects real HTML");
 ok(sample.html.includes("visual-ornament-"+sample.designPlan.visualIdentity.ornament),"Chosen ornament affects real HTML");
 ok(sample.html.includes("visual-type-"+sample.designPlan.visualIdentity.typography),"Chosen type affects real HTML");
 ok(sample.designReview.visualInspectionPending===true,"Never claim screenshot AI inspection occurred");
 ok(sample.designReview.checks.some(c=>c.id==="individual-design"&&c.passed),"Reviewer knows selected identity");
 ok(!sample.html.includes("5-star rated")&&!sample.html.includes("Award-winning"),"No made-up endorsements");
 ok(sample.designReview.score<=100&&sample.designReview.score>=0,"Review score bounded");
}
const original=samples[0], after=app.applyWebsiteInstruction(original,"change the headline to Cleaning that fits your schedule");
ok(after.applied,"Website edits still work");
eq(after.draft.designPlan.visualIdentity,original.designPlan.visualIdentity,"Normal wording edit MUST NOT randomly redesign identity");
ok(after.draft.designReview?.checks?.length>0,"Draft rechecked after edit");
const override=planWebsiteDesign({businessName:"Named",businessType:"Gardening",theme:{
 heroLayout:"type-center",cardLayout:"rows",ornament:"stripes",navStyle:"pill",
 typography:"refined",paletteVariant:"c"
}});
for(const [key,value] of Object.entries({heroLayout:"type-center",cardLayout:"rows",ornament:"stripes",navStyle:"pill",typography:"refined",paletteVariant:"c"})){
 eq(override.visualIdentity[key],value,"Explicit customer design preferences preserved");
}
const unsafe=selectVisualIdentity({businessName:"Unsafe",businessType:"Gardening",theme:{
 heroLayout:"<script>",cardLayout:"url(javascript:bad)",paletteVariant:"style=display:none"
}});
ok(!JSON.stringify(unsafe).includes("javascript:"),"Never permit raw CSS in design choices");
const layoutCss=designCss(designForWebsite({businessType:"Exterior cleaning",plan:samples[0].designPlan}));
for(const value of ["visual-hero-type-center","visual-hero-type-right","visual-hero-type-poster","visual-hero-image-left",
 "visual-hero-image-frame","visual-hero-image-feature","visual-cards-outlines","visual-cards-rows",
 "visual-nav-underline","visual-nav-pill","visual-ornament-glow","visual-ornament-stripes",
 "visual-type-refined","visual-type-compact","@media(max-width:800px)"]){
 ok(layoutCss.includes(value),"CSS supports actual composition "+value);
}
const compare=reviewWebsiteDesign({draft:original,comparisonFingerprints:[original.designPlan.visualIdentity.fingerprint]});
ok(compare.suggestions.some(x=>x.id==="local-diversity"),"Can detect matching comparison design fingerprint");
const differing=reviewWebsiteDesign({draft:original,comparisonFingerprints:[samples[1].designPlan.visualIdentity.fingerprint]});
ok(differing.checks.find(x=>x.id==="local-diversity").passed,"Distinct comparison fingerprints pass");
ok(read("src/screens/websiteBuilder.js").includes("not an AI screenshot review"),"Customer isn't misled about AI review");
ok(read("supabase/functions/busy-website-worker/index.ts").includes('visual-hero-'),"Hosting worker uses same visual identity");
const pkg=JSON.parse(read("package.json")),cfg=JSON.parse(read("app.json")).expo;
ok(["3.101.0","3.102.0"].includes(pkg.version),"Release version supported");eq(cfg.version,pkg.version);
eq(cfg.ios.buildNumber,String(Number(pkg.version.split(".")[1])-80));eq(cfg.android.versionCode,Number(pkg.version.split(".")[1])-80);
ok(read(".github/workflows/production-check.yml").includes("check-distinct-website-designs-v3101.mjs"),"CI coverage");
console.log("V3.101 PASS:",n,"distinct per-business styles, repeatable edits, safe user overrides and truthful design review checks");
