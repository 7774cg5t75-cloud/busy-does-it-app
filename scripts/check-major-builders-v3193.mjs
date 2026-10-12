import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {PALETTES,LABELS,DEFAULT_PALETTE,contrast,safeHex,nativePalette}
 from "../src/core/nativePalette.mjs";
import {OPTIONS,previewPrivateAppAppearance}
 from "../src/core/appAppearanceEditing.mjs";
import {auditStandaloneContrast}
 from "../src/core/appContrastAudit.mjs";
import {nativeShellDescriptor}
 from "../src/core/standaloneNativePackage.mjs";
import {planMatchAppBrandToWebsite,confirmMatchAppBrandToWebsite}
 from "../src/core/ownerBuilderBrandBridgeV3193.mjs";
import {applyWebsiteLayoutOperation}
 from "../supabase/functions/busy-website-worker/websiteLayoutEditing.mjs";
import {designForWebsite} from "../supabase/functions/busy-website-worker/designSystem.mjs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
let assertions=0;
const eq=(a,b)=>{assert.deepEqual(a,b);assertions++;};
const ok=(a,label)=>{assert.ok(a,label);assertions++;};
eq(OPTIONS.brandPalette,[...Object.keys(PALETTES),"custom"]);
eq(Object.keys(PALETTES).length,20);
eq(safeHex("#aAbBcC"),"#AABBCC");
eq(safeHex("red"),null);
eq(safeHex("#123456;alert(1)"),null);
eq(safeHex("  #ABCDEF "),null);
eq(nativePalette("not-a-palette"),PALETTES[DEFAULT_PALETTE]);
const fingerprints=new Set();
for(const [id,colors] of Object.entries(PALETTES)){
 ok(typeof LABELS[id]==="string"&&LABELS[id].length>3,id+" labelled");
 for(const [a,b] of [["text","bg"],["text","surface"],["muted","surface"],["bg","accent"]])
  ok(contrast(colors[a],colors[b])>=4.5,id+" has insufficient "+a+" on "+b);
 const audit=auditStandaloneContrast(colors);
 ok(audit.normalTextAA,id+" audit contrast");
 fingerprints.add(colors.bg+"|"+colors.accent);
}
eq(fingerprints.size,20);
for(const seed of ["#000000","#FFFFFF","#FF0000","#00FF00","#0000FF",
 "#808080","#FAF1E2","#123456","#B04F2D","#F3CE12","#7FAFBA","#021423"]){
 const colors=nativePalette("custom",seed);
 for(const [a,b] of [["text","bg"],["text","surface"],["muted","surface"],["bg","accent"]])
  ok(contrast(colors[a],colors[b])>=4.5,"Custom "+seed+" insufficient "+a+" vs "+b);
 eq(nativePalette("custom",seed),nativePalette("custom",seed.toLowerCase()));
 ok(auditStandaloneContrast(colors).normalTextAA,"Custom palette contrasts");
}
eq(nativePalette("custom","javascript:alert(1)"),PALETTES[DEFAULT_PALETTE]);
eq(nativePalette("custom","#F00"),PALETTES[DEFAULT_PALETTE]);
const original={modules:[{key:"business_profile",enabled:true}],
 presentation:{headerStyle:"refined",brandPalette:"forest"}};
const copy=JSON.stringify(original);
const custom=previewPrivateAppAppearance(original,{field:"brandAccent",value:"#da5d40"});
ok(custom.ok,"Custom private appearance must preview");
eq(custom.nextConfig.presentation.brandPalette,"custom");
eq(custom.nextConfig.presentation.brandAccent,"#DA5D40");
eq(JSON.stringify(original),copy);
eq(previewPrivateAppAppearance(original,{field:"brandAccent",value:"#456"}).ok,false);
eq(previewPrivateAppAppearance(original,{field:"brandAccent",value:"#123456\n"}).ok,false);
eq(previewPrivateAppAppearance(original,{field:"brandPalette",value:"custom"}).ok,false);
eq(previewPrivateAppAppearance(original,{field:"brandPalette",value:"unsupported"}).ok,false);
const restore=previewPrivateAppAppearance(custom.nextConfig,{field:"brandPalette",value:"sage"});
ok(restore.ok);
eq(restore.nextConfig.presentation.brandAccent,undefined);
eq(restore.nextConfig.presentation.brandPalette,"sage");
eq(previewPrivateAppAppearance(custom.nextConfig,{field:"brandAccent",value:"#da5d40"}).ok,false);
for(const preset of Object.keys(PALETTES)){
 const result=previewPrivateAppAppearance(original,{field:"brandPalette",value:preset});
 if(preset!=="forest"){ok(result.ok,preset+" must be selectable");
  eq(result.nextConfig.presentation.brandPalette,preset);}
}
// Actual trusted Edge and owner screen must use the same allowlist and
// validation; a pretty local preview is not enough to save an owner change.
eq(read("src/core/appAppearanceEditing.mjs"),
 read("supabase/functions/busy-mini-apps/appAppearanceEditing.mjs"));
const api=read("supabase/functions/busy-mini-apps/index.ts");
ok(api.includes('action === "set_appearance"'));
ok(api.includes("previewPrivateAppAppearance(app.draft_config"));
const uuid=n=>"00000000-0000-4000-8000-"+n;
const descriptor={ok:true,kind:"private_standalone_planning_manifest_v1",
 ownerAppId:uuid("000000003193"),previewVersionId:uuid("000000003194"),
 previewVersionNo:1,sourceDraftRevision:1,platformTargets:["ios","android"],
 appName:"Example Studio",modules:["business_profile"],
 screenSchema:{ok:true,screens:[{key:"business_profile",component:"BusinessIdentity",title:"About"}]},
 automaticallyPublished:false,packageProduced:false,appStoreSubmitted:false,
 chargesCreated:false,requiresVerifiedBilling:true,
 appearance:custom.nextConfig.presentation};
const good=nativeShellDescriptor(descriptor);
ok(good.ok,good.reason);
eq(good.appearance.brandPalette,"custom");
eq(good.appearance.brandAccent,"#DA5D40");
eq(good.buildIsProductionReady,false);
for(const bad of [
 {...descriptor,appearance:{brandPalette:"custom",brandAccent:"red"}},
 {...descriptor,appearance:{brandPalette:"custom"}},
 {...descriptor,appearance:{brandPalette:"midnight",brandAccent:"#FF0022"}},
 {...descriptor,appearance:{brandPalette:"javascript:evil"}},
 {...descriptor,appearance:{brandPalette:"custom",brandAccent:"#FF0000\n"}}
 ])eq(nativeShellDescriptor(bad).ok,false);
const shell=read("standalone/template/App.js");
ok(shell.includes("nativePalette(LOOK.brandPalette,LOOK.brandAccent)"));
ok(shell.includes('title={"Ask about "+service.name}'));
ok(shell.includes("initialMessage={chosen.key==="));
ok(shell.includes('live.supportsEnquiry||!live.moduleKeys?.includes(intent)'));
ok(shell.includes('live.supportsBookingRequest||!live.moduleKeys?.includes(intent)'));
ok(shell.includes("setRequestedIntent(intent)"));
ok(!shell.includes("autoConfirmBooking"));
const packager=read("scripts/prepare-standalone-prototype-v3154.mjs");
ok(packager.includes('"src","core","nativePalette.mjs"'));
const ui=read("src/screens/miniApps.js");
ok(ui.includes("Show all 20 colour schemes"));
ok(ui.includes("setBrandAccentDraft"));
ok(ui.includes('field:"brandAccent",value:brandAccentDraft'));
ok(ui.includes("brandColours=nativePalette(presentation.brandPalette,presentation.brandAccent)"));
ok(ui.includes("backgroundColor:brandColours.bg"));
ok(ui.includes("brandColours.accent"));
ok(ui.includes("proposal.nextConfig.presentation.brandAccent"));

// One-time owner confirmation for matching the website to their app.
// No foreign business can apply another tenant's brand, and later edits
// invalidate old previews. Never publish or modify customer records.
const businessId=uuid("000000003195");
const website={id:"website-draft",generation:3,sections:[
 {id:"hero",type:"hero",enabled:true,title:"Hello",body:"Welcome"}],
 businessName:"Example Studio",businessType:"Hairdresser",
 theme:{primary:"#334455"}};
const app={id:uuid("000000003196"),business_id:businessId,draft_revision:4,
 draft_config:{modules:[{key:"business_profile",enabled:true}],
  presentation:{brandPalette:"custom",brandAccent:"#DA5D40"}}};
const plan=planMatchAppBrandToWebsite(website,app,{businessId});
ok(plan.ok,plan.reason);
eq(plan.targetColour,"#DA5D40");
eq(plan.privateOnly,true);
eq(plan.doesNotPublish,true);
eq(plan.colourOnly,true);
ok(confirmMatchAppBrandToWebsite(website,app,{businessId,evidence:plan}).ok);
eq(confirmMatchAppBrandToWebsite({...website,generation:4},app,
 {businessId,evidence:plan}).ok,false);
eq(confirmMatchAppBrandToWebsite(website,{...app,draft_revision:5},
 {businessId,evidence:plan}).ok,false);
eq(confirmMatchAppBrandToWebsite(website,{
 ...app,draft_config:{...app.draft_config,
 presentation:{brandPalette:"custom",brandAccent:"#000000"}}},
 {businessId,evidence:plan}).ok,false);
eq(planMatchAppBrandToWebsite(website,{...app,business_id:"another"},
 {businessId}).ok,false);
eq(planMatchAppBrandToWebsite(website,{...app,draft_config:{
 modules:[],presentation:{brandPalette:"not-supported"}}},
 {businessId}).ok,false);
const old=JSON.stringify(website);
const layout=applyWebsiteLayoutOperation(website,{action:"brand-colour",value:plan.targetColour});
ok(layout.applied,layout.reason);
eq(layout.draft.theme.primary,"#DA5D40");
eq(JSON.stringify(website),old);
eq(layout.draft.sections,website.sections);
const finished=designForWebsite({businessType:"Hairdresser",theme:layout.draft.theme});
ok(finished.hasCustomColour);
ok(contrast("#FFFFFF",finished.accent)>=4.5,"Website CTA white text must contrast");
eq(applyWebsiteLayoutOperation(website,
 {action:"brand-colour",value:"red"}).applied,false);
eq(applyWebsiteLayoutOperation(website,
 {action:"brand-colour",value:"#F00;alert(1)"}).applied,false);
eq(applyWebsiteLayoutOperation(website,
 {action:"brand-colour",value:"#123456",url:"https://evil.example"}).applied,false);
eq(applyWebsiteLayoutOperation(layout.draft,
 {action:"brand-colour",value:"#DA5D40"}).applied,false);
const controller=read("src/app/AppController.js");
const screen=read("src/screens/websiteBuilder.js");
const websiteUi=read("src/screens/websiteAppBrandMatch.js");
ok(controller.includes("confirmMatchAppBrandToWebsite(current,app,{businessId,evidence})"));
ok(controller.includes("setWebsiteUndo(items=>[...items,current].slice(-8))"));
ok(controller.includes("applyBusinessAppBrandToWebsite,"));
ok(screen.includes("<WebsiteAppBrandMatch website={draft}"));
ok(websiteUi.includes("Apply this colour to my PRIVATE website"));
console.log("V3.193 "+assertions+
 " palette, owner branding, trusted validation, cross-builder, contrast and native service journey assertions PASS.");
