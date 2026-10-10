import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {planWebsiteDesign,deriveSector} from "../supabase/functions/busy-website-worker/designPlanner.mjs";
import {designForWebsite,designCss} from "../supabase/functions/busy-website-worker/designSystem.mjs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
let checks=0;
const equal=(a,b,msg)=>{assert.deepEqual(a,b,msg);checks++;};
const yes=(a,msg)=>{assert.ok(a,msg);checks++;};
const management=Function(read("src/domain/websiteManagement.js").replace(/export\s*\{[\s\S]*?\};?\s*$/,"")+";return {syncWebsitePageModel};")();
const websiteSource=read("src/domain/websiteBuilder.js")
  .replace(/^import \{ syncWebsitePageModel \} from "\.\/websiteManagement";\s*/,"")
  .replace(/^import \{ designForWebsite, designCss \} from "\.\.\/\.\.\/supabase\/functions\/busy-website-worker\/designSystem\.mjs";\s*/,"")
  .replace(/^import \{ planWebsiteDesign \} from "\.\.\/\.\.\/supabase\/functions\/busy-website-worker\/designPlanner\.mjs";\s*/,"")
  .replace(/export\s*\{[\s\S]*?\};?\s*$/,"");
const app=Function("syncWebsitePageModel","designForWebsite","designCss","planWebsiteDesign",
  websiteSource+";return {buildWebsiteDraft,applyWebsiteInstruction,renderWebsiteHtml};")(
  management.syncWebsitePageModel,designForWebsite,designCss,planWebsiteDesign
);
const service=(name,description="")=>({id:name.toLowerCase().replace(/\W+/g,"-"),name,description});
const fixture=(name,type,services,details={})=>({
  websiteReady:true,websiteReadinessLabel:"Ready",
  websiteBrief:{businessName:name,businessType:type,services,...details}
});
const short=app.buildWebsiteDraft({brandBrain:fixture("Tidy Lawns","Gardening",[service("Lawn mowing"),service("Hedge trimming")],{serviceArea:"Exeter"})});
equal(short.designPlan.architecture,"focused-landing","Sparse real brief yields one confident landing page");
equal(short.designPlan.contentTier,"essential","Sparse pages aren't falsely treated as content-rich");
equal(short.pages.length,1,"No empty about/FAQ/review pages");
yes(short.navigation.some(x=>x.href==="#services"),"Single-page navigation uses real anchors");
yes(short.html.includes("architecture-focused-landing"),"Concept uses landing-page composition");
yes(short.html.includes("family-organic"),"No-photo gardening receives organic layout");
yes(short.html.includes("hero-art"),"CSS-only hero when photos are absent");
yes(!short.html.includes("<img"),"No imaginary photographs");
yes(!short.html.includes('id="testimonials"'),"No fabricated reviews");
yes(!short.html.includes("10 years"),"No fabricated credentials");
yes(!short.html.includes('href="tel:'),"No invented telephone");
yes(!short.html.includes('href="mailto:'),"No invented email");
yes(short.html.includes("Lawn care • Hedge trimming"),"Sparse page uses supplied service facts rather than repeating the category");
yes(short.html.includes("Serving Exeter and surrounding villages"),"Sparse page reuses confirmed service area");
yes(short.html.includes("Where we work"),"An area-only section is not falsely labelled as a contact option");
yes(!short.html.includes("<h2>Get in touch</h2>"),"No empty get-in-touch section");
const noContactBrief=app.buildWebsiteDraft({brandBrain:fixture("Bare Basics","Beauty salon",[service("Hair styling")])});
yes(!noContactBrief.sections.some(s=>s.id==="contact"),"No empty contact section generated");
yes(!noContactBrief.navigation.some(n=>n.id==="contact"),"No broken empty contact link");
yes(!noContactBrief.html.includes('id="contact"'),"No hidden empty contact content");

const chosen = app.buildWebsiteDraft({brandBrain:fixture("Green Sites","Landscaping",
 [service("Landscape design","Thoughtful garden design and detailed planting plans"),
  service("Maintenance","Ongoing garden care and seasonal upkeep"),
  service("Hedge trimming","Routine hedge shaping and tidy-ups")],{
   description:"Garden care for homes and small businesses.",
   about:"Green Sites is a local team working with residents to plan and care for outdoor spaces. We help homeowners with their gardens and enjoy practical tidy-up work.",
   serviceArea:"Exeter",
   phone:"01392 000000",
   photos:[{storagePath:"approved/one.jpg"},{storagePath:"approved/two.jpg"}],
   heroAsset:{storagePath:"approved/one.jpg"}
 })});
equal(chosen.designPlan.architecture,"multi-page","Rich evidence creates organised multipage site");
yes(chosen.designPlan.signals.approvedPhotos>=2,"Only supplied images count");
yes(chosen.pages.length>=3,"Actual dedicated pages created");
yes(chosen.pages.some(p=>p.id==="services"),"Dedicated services page");
yes(chosen.navigation.every(x=>x.href.startsWith("/")),"Multipage nav uses real page paths");
yes(chosen.html.includes("family-portfolio"),"Landscaper with images gets portfolio layout");
yes(!chosen.html.includes("10 years"),"Still no invented awards");
const cater=app.buildWebsiteDraft({brandBrain:fixture("Proper Feast","Festival catering",
 [service("Pork rolls","Overnight-roasted pork rolls with crackling"),
 service("Cassoulet","Slow-cooked cassoulet served warm"),
 service("Private events","Event catering by prior arrangement")],{
  about:"We're a small Devon-based family catering business serving hearty, carefully prepared food at festivals and private celebrations. We cook slowly and aim to keep our menu simple.",
  description:"Slow-cooked food for events, festivals and private celebrations."
 })});
equal(cater.designPlan.family,"artisan","Text-led hospitality gets warm artisan direction");
yes(cater.designPlan.sectionOrder.indexOf("about")<cater.designPlan.sectionOrder.indexOf("services"),"Hospitality story takes precedence");
for (const [type,family] of [["Window cleaning","conversion"],["Beauty salon","boutique"],
["Financial consultant","editorial"],["New unknown sector","minimal"]]){
 const site=app.buildWebsiteDraft({brandBrain:fixture("Sample",type,[service("Main service")])});
 equal(site.designPlan.family,family,"Industry-aware layout "+type);
 yes(site.html.includes("family-"+family),"Actual preview applies family "+family);
 yes(designCss(designForWebsite({businessType:type})).includes(".family-"+family),"Family has bespoke CSS "+family);
}
const noReview=app.buildWebsiteDraft({brandBrain:fixture("Local Services","Trades",
 [service("Cleaning","Regular cleaning")],{testimonials:[],faqs:[]})});
yes(!noReview.pages.some(p=>["faq","testimonials"].includes(p.id)),"No filler pages");
const altered=app.applyWebsiteInstruction(short,"add service Garden tidy-ups");
yes(altered.applied,"Existing safe editor remains functional");
equal(altered.draft.designPlan.signals.services,3,"Edit refreshes design intelligence");
yes(altered.draft.html.includes("Garden tidy-ups"),"Edited services appear in real preview");
const worker=read("supabase/functions/busy-website-worker/index.ts");
yes(worker.includes('import {planWebsiteDesign} from "./designPlanner.mjs"'),"Deployable worker owns planner");
yes(worker.includes('plan.sectionOrder'),"Worker respects same order as native");
yes(worker.includes('String(item.href||"").startsWith("#")'),"On-page links work on signed hosted website");
yes(worker.includes("name=\"busy-deployment\""),"Signed preview version markers retained");
yes(worker.includes("formMarkup"),"Opt-in forms unaffected");
const ui=read("src/screens/websiteBuilder.js");
yes(ui.includes("liveConceptHtml"),"Real website preview rendered inside app");
const p=JSON.parse(read("package.json"));const expo=JSON.parse(read("app.json")).expo;
equal(p.version,"3.100.0","Version aligned");equal(expo.version,p.version);
equal(expo.ios.buildNumber,"20");equal(expo.android.versionCode,20);
yes(read(".github/workflows/production-check.yml").includes("check-intelligent-website-design-v3100.mjs"),"CI gate present");
console.log("V3.100 PASS: "+checks+" intelligent-design choices, rich and sparse examples, safe edits and publication controls");
