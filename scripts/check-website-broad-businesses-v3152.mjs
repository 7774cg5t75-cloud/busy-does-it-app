/**
 * V3.152 broad-industry regression: two end-to-end visual fixtures are NOT
 * a limit on the types of businesses that can use BUSY DOES IT.
 * Offline source/content tests only; not a guarantee of aesthetic quality.
 */
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {designForWebsite,designCss} from "../supabase/functions/busy-website-worker/designSystem.mjs";
import {planWebsiteDesign,deriveSector} from "../supabase/functions/busy-website-worker/designPlanner.mjs";
import {reviewWebsiteDesign} from "../supabase/functions/busy-website-worker/designReview.mjs";
import {applyWebsiteVisualEdit} from "../supabase/functions/busy-website-worker/designEdits.mjs";
import {editWebsiteDraftField} from "../src/core/websiteStructuredEditing.mjs";
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
]){assert.ok(source.includes(imp),imp);source=source.replace(imp,"");}
const {buildWebsiteDraft,renderWebsiteHtml}=Function(
 "syncWebsitePageModel","designForWebsite","designCss","planWebsiteDesign",
 "reviewWebsiteDesign","applyWebsiteVisualEdit","editWebsiteDraftField",
 source+";return {buildWebsiteDraft,renderWebsiteHtml};"
)(management.syncWebsitePageModel,designForWebsite,designCss,planWebsiteDesign,
 reviewWebsiteDesign,applyWebsiteVisualEdit,editWebsiteDraftField);

const types=[
 "Electrician","Plumbing business","Roof repair service","Window cleaning",
 "Handyman","Landscape gardener","Florist","Tree surgeon","Organic farm",
 "Cafe","Italian restaurant","Mobile food catering","Artisan bakery","Hotel",
 "Hair salon","Yoga studio","Massage therapy","Nail salon","Fitness trainer",
 "Accountancy practice","Law firm","Business consultancy","Architecture studio",
 "Graphic design agency","Maths tutoring","Photography studio","Pet grooming",
 "Dog walking","Bicycle shop","Bookshop","Pottery studio","Software startup",
 "Music teaching","Funeral director","Mobile vehicle detailing",
 "Upholstery workshop","Veterinary clinic","Aquarium maintenance",
 "Hydroponic sensor calibration","Niche museum guide"
];
const families=new Set(),fingerprints=new Set(),sectors=new Set();
let totalRendered=0;
for(let i=0;i<types.length;i++){
 const businessType=types[i],businessName="Example "+String(i+1)+" "+businessType;
 const rich=i%3!==0;
 const brief={
  businessName,businessType,
  description:"Independently provided information about "+businessType+".",
  about:rich
   ?"Our owner describes the work accurately. We provide local appointments, straightforward enquiries, contact details and information about our services. We help customers understand what is available before they contact the business. We explain our approach clearly without inventing customer reviews, photographs, accreditations or prices."
   :"The owner provides information directly.",
  phone:"01392 123456",
  services:rich?[
   {id:"service-a",name:"Service A",description:"Provided by this particular owner for local customers."},
   {id:"service-b",name:"Service B",description:"Information is reviewed and approved by the owner."},
   {id:"service-c",name:"Service C",description:"This is a legitimate user supplied service description."}
  ]:[
   {id:"service-a",name:"Main service",description:"Provided by this owner."}
  ]
 };
 const original=JSON.stringify(brief);
 const website=buildWebsiteDraft({brandBrain:{websiteReady:true,websiteBrief:brief}});
 const plan=website.designPlan;
 assert.ok(plan?.family&&plan?.visualIdentity?.fingerprint, "Missing design plan for "+businessType);
 assert.equal(website.businessType,businessType);
 assert.ok(["nature","hospitality","wellness","professional","trades","neutral"].includes(plan.sector));
 assert.equal(plan.sector,deriveSector(businessType),"Planner sector "+businessType);
 const design=designForWebsite({businessType,theme:website.theme,plan});
 assert.ok(designCss(design).includes(".gallery"),"Shared CSS for "+businessType);
 const html=renderWebsiteHtml(website,"home");
 assert.ok(html.startsWith("<!doctype html>"),"Site renders "+businessType);
 assert.ok(html.includes(businessName),"Owner identity preserved "+businessType);
 assert.ok(html.includes("01392 123456"),"Contact details remain "+businessType);
 assert.ok(html.includes("Main service")||html.includes("Service A"),"Owner service remains "+businessType);
 assert.ok(html.includes('name="viewport"'),"Responsive meta for "+businessType);
 assert.equal(JSON.stringify(brief),original,"Never mutate owner brief");
 assert.equal((html.match(/<main\b/g)||[]).length,1,"One page main for "+businessType);
 assert.equal(html.includes("data-busy-edit-section"),false,"No editor internals in published HTML");
 assert.equal(html.includes("example.invalid/"),false,"No invented stock photo");
 sectors.add(plan.sector);families.add(plan.family);fingerprints.add(plan.visualIdentity.fingerprint);
 totalRendered++;
}
assert.equal(totalRendered,40);
assert.equal(sectors.size,6,"Five tailored sectors plus neutral fallback were exercised");
assert.ok(families.size>=5,"Several layout families must actually be selected");
assert.ok(fingerprints.size>=20,"Individual designs must not all share a fixed template");
for(const unusual of ["Hydroponic sensor calibration","Niche museum guide","Upholstery workshop"]){
 assert.equal(deriveSector(unusual),"neutral","Unrecognised business still has safe fallback");
}
console.log("V3.152 BROAD BUSINESS COVERAGE PASS: "+totalRendered+
 " website drafts rendered, "+sectors.size+" sectors including neutral unknowns, "+
 families.size+" layout families, "+fingerprints.size+
 " distinct visual identities, no fixed business-type admission list.");
