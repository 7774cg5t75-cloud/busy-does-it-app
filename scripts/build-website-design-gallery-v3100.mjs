/**
 * Builds a small set of fully fictional, offline website-design specimens.
 * No credentials, cloud AI, hosted preview, customer content or images used.
 * Runs in GitHub CI; files are build artifacts, not public websites.
 */
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {designForWebsite,designCss} from "../supabase/functions/busy-website-worker/designSystem.mjs";
import {reviewWebsiteDesign} from "../supabase/functions/busy-website-worker/designReview.mjs";
import {applyWebsiteVisualEdit} from "../supabase/functions/busy-website-worker/designEdits.mjs";
import {planWebsiteDesign} from "../supabase/functions/busy-website-worker/designPlanner.mjs";
import {websiteDesignAlternative} from "../src/core/websiteDesignAlternatives.mjs";
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
const strip=s=>s.replace(/export\s*\{[\s\S]*?\};?\s*$/,"");
const model=Function(strip(read("src/domain/websiteManagement.js"))+";return {syncWebsitePageModel};")();
const builderSource=strip(read("src/domain/websiteBuilder.js"))
 .replace(/^import \{ syncWebsitePageModel \} from "\.\/websiteManagement";\s*/,"")
 .replace(/^import \{ designForWebsite, designCss \} from "\.\.\/\.\.\/supabase\/functions\/busy-website-worker\/designSystem\.mjs";\s*/,"")
 .replace(/^import \{ planWebsiteDesign \} from "\.\.\/\.\.\/supabase\/functions\/busy-website-worker\/designPlanner\.mjs";\s*/,"")
 .replace(/^import \{ reviewWebsiteDesign \} from "\.\.\/\.\.\/supabase\/functions\/busy-website-worker\/designReview\.mjs";\s*/,"")
 .replace(/^import \{ applyWebsiteVisualEdit \} from "\.\.\/\.\.\/supabase\/functions\/busy-website-worker\/designEdits\.mjs";\s*/,"");
const {buildWebsiteDraft,applyWebsiteInstruction}=Function("syncWebsitePageModel","designForWebsite","designCss","planWebsiteDesign","reviewWebsiteDesign","applyWebsiteVisualEdit",builderSource+
  ";return {buildWebsiteDraft,applyWebsiteInstruction};")(model.syncWebsitePageModel,designForWebsite,designCss,planWebsiteDesign,reviewWebsiteDesign,applyWebsiteVisualEdit);
const S=(name,description="")=>({id:name.toLowerCase().replace(/\W+/g,"-"),name,description});
const demos=[
 {file:"01-gardening-minimal",name:"Hillside Gardens",type:"Gardening",
  services:[S("Lawn care"),S("Hedge trimming")],
  extra:{serviceArea:"Exeter and surrounding villages"}},
 {file:"02-exterior-cleaning",name:"Clearline Exterior Care",type:"Exterior cleaning",
  services:[S("Driveway cleaning","Cleaning paving and driveways to improve their appearance"),
   S("Patio cleaning","Patio washing and general surface care")],
  extra:{phone:"01392 000000",description:"Exterior cleaning for local homes and properties.",serviceArea:"Devon"}},
 {file:"03-catering-story",name:"Fire & Table Catering",type:"Festival catering",
  services:[S("Slow-roasted rolls","Overnight-roasted pork rolls at festival stalls"),
   S("Hearty bowls","Warm bowls served at events"),
   S("Private events","Catering by prior arrangement")],
  extra:{about:"We are a small catering team focused on preparing comforting food for festivals and local celebrations. Our menu stays concise because we prefer to prepare every dish carefully and serve it generously.",description:"Slow-cooked food for events and gatherings.",email:"hello@example.com"}},
 {file:"04-wellness-boutique",name:"Stillwater Beauty Studio",type:"Beauty salon",
  services:[S("Hair styling"),S("Beauty treatments")],
  extra:{visualStyle:"premium",tagline:"A calm space for beauty and wellbeing."}},
 {file:"05-professional-editorial",name:"Harbour Accounting",type:"Accounting consultancy",
  services:[S("Bookkeeping","Monthly bookkeeping for small businesses"),
   S("Accounts","Year-end accounts preparation"),
   S("Business support","Practical administration and financial record support")],
  extra:{about:"We work with small organisations and independent professionals to simplify their record keeping. Our focus is on clear conversations and helping business owners understand what information they need to keep.",phone:"01234 000000"}},
];
// Same trade, equivalent information: prove the result is not a single
// BUSY-branded template wearing different business names.
const sameTradeNames=[
 ["06-coastal-cleaning","Coastal Shine Exterior Cleaning"],
 ["07-village-cleaning","Westmoor Pressure Washing"],
 ["08-city-cleaning","Exeter Surface Specialists"],
 ["09-traditional-cleaning","Oakfield Exterior Care"]
];
for(const [file,name] of sameTradeNames){
 demos.push({
  file,name,type:"Exterior cleaning",
  services:[S("Driveway cleaning"),S("Patio cleaning")],
  extra:{serviceArea:"Devon"}
 });
}
const output=process.argv[2]||"/tmp/busy-v3100-design-gallery";
fs.mkdirSync(output,{recursive:true});
for(const f of demos){
 const draft=buildWebsiteDraft({brandBrain:{
  websiteReady:true,websiteBrief:{businessName:f.name,businessType:f.type,services:f.services,...f.extra}
 }});
 const target=path.join(output,f.file+".html");
 fs.writeFileSync(target,draft.html);
 if(f.file==="01-gardening-minimal"){
   const alternative=websiteDesignAlternative(draft);
   if(!alternative.suggested)throw Error("Expected a safe private layout alternative");
   const explored=applyWebsiteInstruction(draft,alternative.suggested.instruction);
   if(!explored.applied)throw Error("Guided layout was not applied: "+explored.reason);
   fs.writeFileSync(path.join(output,"01-gardening-minimal-guided-alternative.html"),explored.draft.html);
   // A separate private candidate of the SAME business, assembled from two
   // owner-approved design-only instructions. Not an AI-generated improvement.
   const first=applyWebsiteInstruction(draft,"use service cards outlines");
   if(!first.applied)throw Error(first.reason);
   const second=applyWebsiteInstruction(first.draft,"center the main headline");
   if(!second.applied)throw Error(second.reason);
   fs.writeFileSync(path.join(output,"01-gardening-minimal-candidate.html"),second.draft.html);
 }
 console.log(f.file+": "+draft.designPlan.family+" / "+draft.designPlan.architecture+" / "+draft.pages.length+" page(s)");
}
console.log("Saved "+demos.length+" offline demonstration websites in "+output);
