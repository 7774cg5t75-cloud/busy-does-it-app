import {websiteBuilderTestHarnessV3222} from "./lib/website-builder-test-harness-v3222.mjs";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {PALETTES,DEFAULT_PALETTE,nativePalette}
 from "../src/core/nativePalette.mjs";
import {nativePreferredDates}
 from "../standalone/template/nativePreferredDates.mjs";
import {OPTIONS,DEFAULTS,previewPrivateAppAppearance}
 from "../src/core/appAppearanceEditing.mjs";
import {nativeShellDescriptor}
 from "../src/core/standaloneNativePackage.mjs";
import {planCopyMissingAppServices,confirmCopyMissingAppServices}
 from "../src/core/ownerBuilderServiceBridgeV3192.mjs";
import {planWebsiteDesign}
 from "../supabase/functions/busy-website-worker/designPlanner.mjs";
import {designForWebsite,designCss}
 from "../supabase/functions/busy-website-worker/designSystem.mjs";
import {reviewWebsiteDesign}
 from "../supabase/functions/busy-website-worker/designReview.mjs";
import {applyWebsiteVisualEdit}
 from "../supabase/functions/busy-website-worker/designEdits.mjs";
import {canonicalWebsiteHandoffUrl} from "../src/core/websiteAppHandoffV3214.mjs";

const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
let assertions=0;
const eq=(a,b,label="same")=>{assert.deepEqual(a,b,label);assertions++};
const yes=(a,label="expected true")=>{assert.ok(a,label);assertions++};

// Curated palettes genuinely change screen colours and retain AA text
// contrast on both their card and body surfaces. This is a maths check,
// NOT manual screen-reader, dynamic text or photo overlay certification.
const luminance=hex=>{
 const rgb=hex.replace("#","").match(/../g).map(x=>parseInt(x,16)/255);
 const adjusted=rgb.map(x=>x<=0.04045?x/12.92:Math.pow((x+0.055)/1.055,2.4));
 return adjusted[0]*0.2126+adjusted[1]*0.7152+adjusted[2]*0.0722;
};
const contrast=(a,b)=>{
 const x=luminance(a),y=luminance(b);
 return (Math.max(x,y)+0.05)/(Math.min(x,y)+0.05);
};
eq(OPTIONS.brandPalette,[...Object.keys(PALETTES),"custom"]);
eq(read("src/core/appAppearanceEditing.mjs"),
 read("supabase/functions/busy-mini-apps/appAppearanceEditing.mjs"),
 "Public appearance options must be byte-identical in owner UI and trusted Edge.");
yes(read("supabase/functions/busy-mini-apps/index.ts").includes('action === "set_appearance"')||
 read("supabase/functions/busy-mini-apps/index.ts").includes('action==="set_appearance"'),
 "Trusted appearance update action stays connected.");

eq(DEFAULTS.brandPalette,DEFAULT_PALETTE);
eq(nativePalette("definitely-not-a-real-palette"),PALETTES.midnight);
const distinct=new Set();
for(const [key,colours] of Object.entries(PALETTES)){
 for(const field of ["bg","surface","text","muted","accent","line"])
  yes(/^#[0-9a-fA-F]{6}$/.test(colours[field]),"finite hex token "+key+"."+field);
 yes(contrast(colours.text,colours.bg)>=4.5,key+" page text");
 yes(contrast(colours.text,colours.surface)>=4.5,key+" card text");
 yes(contrast(colours.muted,colours.surface)>=4.5,key+" muted card text");
 yes(contrast(colours.bg,colours.accent)>=4.5,key+" button label");
 distinct.add(colours.bg+"_"+colours.accent);
}
eq(distinct.size,Object.keys(PALETTES).length);
const config={modules:[{key:"business_profile",enabled:true}],
 presentation:{headerStyle:"refined",layoutDensity:"comfortable",navigationStyle:"tabs"}};
for(const colour of Object.keys(PALETTES)){
 const preview=previewPrivateAppAppearance(config,{field:"brandPalette",value:colour});
 if(colour!==DEFAULT_PALETTE){
  yes(preview.ok,"preview "+colour);
  eq(preview.nextConfig.presentation.brandPalette,colour);
  eq(config.presentation.brandPalette,undefined);
 }
}
eq(previewPrivateAppAppearance(config,{field:"brandPalette",value:"#bad"}).ok,false);
const id=s=>"00000000-0000-4000-8000-"+s;
const manifest={ok:true,kind:"private_standalone_planning_manifest_v1",
 ownerAppId:id("000000003192"),previewVersionId:id("000000003193"),
 previewVersionNo:1,sourceDraftRevision:1,platformTargets:["ios","android"],
 appName:"Example Flowers",modules:["business_profile"],
 screenSchema:{ok:true,screens:[{key:"business_profile",title:"About",component:"BusinessIdentity"}]},
 automaticallyPublished:false,packageProduced:false,appStoreSubmitted:false,
 chargesCreated:false,requiresVerifiedBilling:true,
 appearance:{brandPalette:"forest",layoutDensity:"airy"}};
const descriptor=nativeShellDescriptor(manifest);
yes(descriptor.ok,descriptor.reason);
eq(descriptor.appearance.brandPalette,"forest");
eq(descriptor.runtimeConnection.enabled,false);
eq(descriptor.signingConfigured,false);
eq(nativeShellDescriptor({...manifest,appearance:{brandPalette:"<script>"}}).ok,false);
eq(nativeShellDescriptor({...manifest,appearance:{brandPalette:"unknown"}}).ok,false);
const shell=read("standalone/template/App.js");
yes(shell.includes("const COLORS=nativePalette(LOOK.brandPalette,LOOK.brandAccent)"));
yes(shell.includes("nativePreferredDates(new Date(),7)"));
yes(shell.includes("inFlight.current=true"));
yes(shell.includes("possibleDuplicateRetry"));
yes(shell.includes("I understand — allow one more attempt"));
yes(shell.includes("Start a separate new request"));
yes(shell.includes("These are NOT available appointment slots."));
const packager=read("scripts/prepare-standalone-prototype-v3154.mjs");
yes(packager.includes('"nativePalette.mjs"'));
yes(packager.includes('"nativePreferredDates.mjs"'));
const appUi=read("src/screens/miniApps.js");
yes(appUi.includes('["brandPalette","Business App colours",appAppearanceOptions.brandPalette.filter(x=>x!=="custom")]'));
yes(appUi.includes('nativePalette(proposal.nextConfig.presentation.brandPalette,'));
// Date shortcuts are preferences only. Leap years and UK DST changes must
// retain consecutive local calendar dates, not browser availability claims.
eq(nativePreferredDates(new Date(2026,1,27,11,0),3).map(x=>x.value),
 ["2026-02-28","2026-03-01","2026-03-02"]);
eq(nativePreferredDates(new Date(2028,1,27,11,0),3).map(x=>x.value),
 ["2028-02-28","2028-02-29","2028-03-01"]);
eq(nativePreferredDates(new Date("invalid")),[]);
eq(nativePreferredDates(new Date(),15),[]);
eq(nativePreferredDates(new Date(),0),[]);

// Same-tenant copy of MISSING owner-written services only.
const businessId=id("000000003194");
const website={id:"website-owner",generation:5,sections:[
 {id:"hero",type:"hero",enabled:true,title:"Flowers"},
 {id:"services",type:"services",enabled:true,title:"What we offer",
  items:[{id:"old",title:"Bouquets",body:"Website wording we must not replace"}]}
]};
const app={id:id("000000003195"),business_id:businessId,draft_revision:9,
 draft_config:{modules:[{key:"business_profile",enabled:true},
 {key:"services",enabled:true}],publicProfile:{services:[
  {id:"bouquets",name:"Bouquets",description:"APP wording must be ignored"},
  {id:"wedding",name:"Wedding flowers",description:"Owner-reviewed events service"},
  {id:"dried",name:"Dried arrangements",description:"Handmade gift arrangements"}
 ]}}};
const original=JSON.stringify(website);
const plan=planCopyMissingAppServices(website,app,{businessId});
yes(plan.ok,plan.reason);
eq(plan.addedCount,2);
eq(plan.skippedExisting,["Bouquets"]);
eq(plan.nextDraft.sections.find(s=>s.id==="services").items[0].body,
 "Website wording we must not replace");
eq(plan.nextDraft.sections.find(s=>s.id==="services").items.length,3);
eq(plan.privateOnly,true);
eq(plan.autoPublishes,false);
eq(JSON.stringify(website),original);
const accepted=confirmCopyMissingAppServices(website,app,{businessId,evidence:plan});
yes(accepted.ok,accepted.reason);
eq(confirmCopyMissingAppServices(website,{...app,draft_revision:10},
 {businessId,evidence:plan}).ok,false);
eq(confirmCopyMissingAppServices({...website,generation:6},app,
 {businessId,evidence:plan}).ok,false);
eq(confirmCopyMissingAppServices(website,app,
 {businessId:id("000000003196"),evidence:plan}).ok,false);
eq(confirmCopyMissingAppServices(website,{
 ...app,draft_config:{...app.draft_config,publicProfile:{services:[
  {...app.draft_config.publicProfile.services[0]},
  {...app.draft_config.publicProfile.services[1],description:"Silently updated text"},
  {...app.draft_config.publicProfile.services[2]}]}}},
 {businessId,evidence:plan}).ok,false);
eq(planCopyMissingAppServices(website,{...app,business_id:"other"},
 {businessId}).ok,false);
eq(planCopyMissingAppServices(website,{...app,draft_config:{...app.draft_config,
 publicProfile:{services:[{name:"Bouquets",description:"No new services"}]}}},
 {businessId}).ok,false);
eq(planCopyMissingAppServices(website,{...app,draft_config:{...app.draft_config,
 publicProfile:{services:[{name:"Unsafe <script>",description:"Bad"}]}}},
 {businessId}).ok,false);
eq(planCopyMissingAppServices(website,{...app,draft_config:{...app.draft_config,
 publicProfile:{services:[{name:"Two",description:"A"},{name:"two",description:"B"}]}}},
 {businessId}).ok,false);
const emptySite={...website,sections:website.sections.filter(s=>s.id!=="services")};
const fresh=planCopyMissingAppServices(emptySite,app,{businessId});
yes(fresh.ok,fresh.reason);
yes(fresh.nextDraft.sections.some(s=>s.id==="services"&&s.ownerEditedItems));
eq(fresh.nextDraft.sections.find(s=>s.id==="services").items.length,3);
eq(fresh.nextDraft.sections.find(s=>s.id==="services").items[0].title,"Bouquets");
// Test the actual existing website HTML rebuild, not a planning-only helper.
const {rebuildPrivateWebsiteDraft}=websiteBuilderTestHarnessV3222(["rebuildPrivateWebsiteDraft"]);

const rebuilt=rebuildPrivateWebsiteDraft({...fresh.nextDraft,businessName:"Example Flowers",
 businessType:"Florist",theme:{}});
yes(rebuilt.html.includes("Wedding flowers"));
yes(rebuilt.html.includes("Dried arrangements"));
eq(rebuilt.generation,6);
const controller=read("src/app/AppController.js");
const screen=read("src/screens/websiteBuilder.js");
const copyUi=read("src/screens/websiteAppServiceCopy.js");
yes(controller.includes("confirmCopyMissingAppServices(current,app,{businessId,evidence})"));
yes(controller.includes("setWebsiteUndo(items=>[...items,current].slice(-8))"));
yes(controller.includes("applyMissingAppServicesToWebsite,"));
yes(screen.includes("<WebsiteAppServiceCopy website={draft}"));
yes(copyUi.includes("Copy these services into my PRIVATE website"));
yes(copyUi.includes("setReview(null)"));
console.log("V3.192 "+assertions+
 " curated native palettes, preference dates, duplicate safety and owner-approved cross-builder copy assertions PASS.");
