import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {websiteDesignAlternative} from "../src/core/websiteDesignAlternatives.mjs";
import {checkRegistrarDomain} from "../supabase/functions/busy-website-publish/domainRegistrarGateway.mjs";
import {makeSandboxRegistrar} from "./lib/domainRegistrarSandbox-v3113.mjs";
let n=0;
const eq=(a,b,m)=>{assert.deepEqual(a,b,m);n++};
const ok=(a,m)=>{assert.ok(a,m);n++};
eq(websiteDesignAlternative().available,false,"No website cannot be redesigned");
const draft={id:"private-draft",businessType:"Gardening",theme:{designFamily:"organic"},
 designPlan:{family:"organic"},sections:[
 {id:"hero",title:"Family gardens",body:"Owner words"},
 {id:"gallery",items:[{storagePath:"tenant1/img.jpg",approved:false}]},
 {id:"services",items:[{title:"Garden maintenance",body:"Owner words"}]}],
 contact:{email:"owner@example.test"},publish:{state:"not-published"}};
const snapshot=JSON.stringify(draft),recommended=websiteDesignAlternative(draft);
eq(recommended.available,true,"Safe private alternative recommended");
eq(recommended.current,"organic","Original family tracked");
ok(recommended.options.every(x=>!["showcase","portfolio"].includes(x.family)),
 "Without approved photographs no gallery-driven family is suggested");
ok(recommended.suggested.instruction.startsWith("try "), "Existing editor grammar reused");
ok(recommended.options.every(x=>x.privateDraftOnly&&x.ownerApprovalRequired),
 "No design applied without owner action");
eq(JSON.stringify(draft),snapshot,"No source mutation from suggestion");
const photo=websiteDesignAlternative({...draft,sections:[
 draft.sections[0],{id:"gallery",items:[{storagePath:"tenant1/approved.jpg",approved:true}]}]});
ok(photo.options.some(x=>x.family==="showcase"),"Approved photo permits photo-led designs");
eq(websiteDesignAlternative({...draft,businessType:"Accounting consultancy",
 theme:{designFamily:"editorial"}}).suggested.family,"minimal",
 "Different sector suggests a different style");
eq(websiteDesignAlternative({...draft,theme:{designFamily:"minimal"}}).suggested.family,
 "organic","Current design is not suggested again");
for(const x of ["Hair salon","Exterior cleaning","Festival catering"]){
 const rec=websiteDesignAlternative({...draft,businessType:x});
 ok(rec.options.length>=3,"Alternatives for "+x);
 ok(rec.options.every(y=>!["showcase","portfolio"].includes(y.family)),
  "No made-up image suggestions for "+x);
}
const screen=readFileSync(new URL("../src/screens/websiteBuilder.js",import.meta.url),"utf8");
ok(screen.includes("websiteDesignAlternative(draft,{"),"Customer editor uses suggestions");
ok(screen.includes("s.applyWebsiteChange(selectedStyle.instruction)"),
 "Button uses private editor's tracked and undoable action");
ok(screen.includes("Your business information, photos and"),"Plain-language scope warning");
const generator=readFileSync(new URL("./build-website-design-gallery-v3100.mjs",import.meta.url),"utf8");
ok(generator.includes("01-gardening-minimal-guided-alternative.html"),
 "Actual generator builds alternative using owner-style design command");
const backend=readFileSync(new URL("../supabase/functions/busy-website-publish/index.ts",import.meta.url),"utf8");
const mock=readFileSync(new URL("./lib/domainRegistrarSandbox-v3113.mjs",import.meta.url),"utf8");
ok(!backend.includes("domainRegistrarSandbox"),"Fake registry never imported in production");
ok(!mock.includes("fetch("),"Mock makes no network requests");
const now=Date.parse("2026-10-10T16:00:00Z");
const tenant="91edb6db-3a02-4de4-9ba8-5c93b4e790a1";
const other="d8836a0e-fbb0-4cb9-a613-509af50eb114";
const mockRegistrar=makeSandboxRegistrar({now});
const check=domain=>checkRegistrarDomain({domain,businessId:tenant,adapter:mockRegistrar,now});
const available=await check("devon-gardens.co.uk");
eq(available.availability,"available","Available test name is accepted");
eq(available.quote.registrationMinor,1199,"Known fixture registration price");
eq(available.quote.renewalMinor,1699,"Fixture renewal pricing disclosed");
eq(available.checkoutEnabled,false,"Even a complete fake quote is unpurchasable");
const unavailable=await check("devon-gardens.com");
eq(unavailable.availability,"unavailable","Taken fixture name");
eq(unavailable.quote,null,"Taken fixture cannot be bought");
const premium=await check("special-premium.uk");
eq(premium.quote.premium,true,"Premium cost disclosed");
eq(premium.quote.registrationMinor,42000,"Premium first term clearly flagged");
const incomplete=await check("missing-renewal.uk");
eq(incomplete.availability,"unknown","Missing renewal quote means unknown, not available");
eq(incomplete.quote,null,"Incomplete price never exposed");
eq((await check("unknown-brand.com")).availability,"unknown","Unsupported name fails closed");
const outage=await checkRegistrarDomain({domain:"devon-gardens.co.uk",businessId:tenant,
 adapter:makeSandboxRegistrar({now,outcome:"failure"}),now});
eq(outage.status,"unavailable-service","Mock timeout handled");
const spoofed=await checkRegistrarDomain({domain:"devon-gardens.co.uk",businessId:other,
 adapter:{...mockRegistrar,lookup:async()=>({...await mockRegistrar.lookup({
 domain:"devon-gardens.co.uk",businessId:tenant})})},now});
eq(spoofed.availability,"unknown","Cross-business quote rejected");
const realDisabled=await checkRegistrarDomain({domain:"devon-gardens.co.uk",businessId:tenant,now});
eq(realDisabled.status,"not-connected","Real gateway still not connected");
eq(realDisabled.liveLookupPerformed,false,"No accidental live search");
eq(mockRegistrar.calls.length,6,"Only six isolated test lookup fixtures");
console.log("V3.113 PASS: "+n+" website alternative and offline registrar sandbox checks.");
