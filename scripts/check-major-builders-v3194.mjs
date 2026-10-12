import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {OPTIONS,DEFAULTS,previewPrivateAppAppearance}
 from "../src/core/appAppearanceEditing.mjs";
import {TYPE_STYLES,SERVICE_STYLES,TYPE_LABELS,SERVICE_LABELS,
 appVisualPresentation}
 from "../src/core/appVisualPresentationV3194.mjs";
import {nativeShellDescriptor}
 from "../src/core/standaloneNativePackage.mjs";
import {planMatchAppTypeToWebsite,confirmMatchAppTypeToWebsite}
 from "../src/core/ownerBuilderTypographyBridgeV3194.mjs";
import {applyWebsiteLayoutOperation,websiteAppearanceOptions}
 from "../supabase/functions/busy-website-worker/websiteLayoutEditing.mjs";
import {planWebsiteDesign}
 from "../supabase/functions/busy-website-worker/designPlanner.mjs";
import {designCss,designForWebsite}
 from "../supabase/functions/busy-website-worker/designSystem.mjs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
let checks=0;
const eq=(a,b,m)=>{assert.deepEqual(a,b,m);checks++};
const ok=(a,m)=>{assert.ok(a,m);checks++};
eq(OPTIONS.typeStyle,TYPE_STYLES);
eq(OPTIONS.serviceStyle,SERVICE_STYLES);
eq(DEFAULTS.typeStyle,"balanced");
eq(DEFAULTS.serviceStyle,"cards");
eq(appVisualPresentation({typeStyle:"javascript:1",serviceStyle:"unknown"}).typeStyle,"balanced");
eq(appVisualPresentation({typeStyle:"javascript:1",serviceStyle:"unknown"}).serviceStyle,"cards");
const appearances=new Set();
for(const typeStyle of TYPE_STYLES){
 ok(TYPE_LABELS[typeStyle]&&TYPE_LABELS[typeStyle].length>=7,typeStyle+" label");
 for(const serviceStyle of SERVICE_STYLES){
  ok(SERVICE_LABELS[serviceStyle]&&SERVICE_LABELS[serviceStyle].length>=7);
  const p=appVisualPresentation({typeStyle,serviceStyle});
  eq(p.typeStyle,typeStyle);eq(p.serviceStyle,serviceStyle);
  ok(p.type.titleSize>=24&&p.type.titleSize<=40,"bounded heading");
  ok(p.type.bodySize>=14&&p.type.bodySize<=18,"bounded body copy");
  ok(["700","600","800","900"].includes(p.type.sectionWeight),"bounded section weight");
  eq(p.serviceColumns,serviceStyle==="rows"?1:null);
  eq(p.featuredFirst,serviceStyle==="spotlight");
  eq(p.doesNotChangeCustomerData,true);
  appearances.add(p.type.titleSize+"|"+p.type.titleWeight+"|"+p.type.titleSpacing+"|"+p.serviceStyle);
 }
}
eq(appearances.size,12);
const base={modules:[{key:"business_profile",enabled:true}],
 presentation:{brandPalette:"forest"}};
for(const value of TYPE_STYLES){
 const res=previewPrivateAppAppearance(base,{field:"typeStyle",value});
 if(value==="balanced"){eq(res.ok,false);continue;}
 ok(res.ok,res.reason);eq(res.nextConfig.presentation.typeStyle,value);
 eq(res.privateOnly,true);eq(res.ownerApprovalRequired,true);
 eq(res.nextConfig.presentation.brandPalette,"forest");
}
for(const value of SERVICE_STYLES){
 const res=previewPrivateAppAppearance(base,{field:"serviceStyle",value});
 if(value==="cards"){eq(res.ok,false);continue;}
 ok(res.ok,res.reason);eq(res.nextConfig.presentation.serviceStyle,value);
 eq(res.changesBooking,false);
}
for(const [field,value]of[
 ["typeStyle","<script>"],["typeStyle","serif-from-url"],
 ["serviceStyle","html"],["serviceStyle","payment"],
 ["remoteFontUrl","https://evil.example/font.woff"]
])eq(previewPrivateAppAppearance(base,{field,value}).ok,false);
eq(read("src/core/appAppearanceEditing.mjs"),
 read("supabase/functions/busy-mini-apps/appAppearanceEditing.mjs"),
 "Client and trusted Edge must share exactly identical private design rules");
ok(read("supabase/functions/busy-mini-apps/index.ts")
 .includes('action === "set_appearance"'));
const uid=n=>"00000000-0000-4000-8000-"+n;
const manifest={ok:true,kind:"private_standalone_planning_manifest_v1",
 ownerAppId:uid("000000003194"),previewVersionId:uid("000000003195"),
 previewVersionNo:1,sourceDraftRevision:1,platformTargets:["ios","android"],
 appName:"Example Studio",modules:["business_profile"],
 screenSchema:{ok:true,screens:[{key:"business_profile",component:"BusinessIdentity",title:"About"}]},
 automaticallyPublished:false,packageProduced:false,appStoreSubmitted:false,
 chargesCreated:false,requiresVerifiedBilling:true,
 appearance:{typeStyle:"editorial",serviceStyle:"rows",brandPalette:"forest"}};
const descriptor=nativeShellDescriptor(manifest);
ok(descriptor.ok,descriptor.reason);
eq(descriptor.appearance.typeStyle,"editorial");
eq(descriptor.appearance.serviceStyle,"rows");
eq(descriptor.signingConfigured,false);
for(const bad of ["<script>","condensed_remote_font","serviceStyle:payments"])
 eq(nativeShellDescriptor({...manifest,appearance:{...manifest.appearance,typeStyle:bad}}).ok,false);
eq(nativeShellDescriptor({...manifest,appearance:{...manifest.appearance,serviceStyle:"payment"}}).ok,false);
const packager=read("scripts/prepare-standalone-prototype-v3154.mjs");
ok(packager.includes('"src","core","appVisualPresentationV3194.mjs"'),
 "Canonical source must be included in standalone app export");
const native=read("standalone/template/App.js");
const market=read("src/screens/miniApps.js");
for(const marker of[
 'const VISUAL=appVisualPresentation(LOOK)',
 'fontSize:VISUAL.type.titleSize',
 'fontWeight:VISUAL.type.titleWeight',
 'VISUAL.headerCentered?"center":"left"',
 'VISUAL.serviceColumns===1?"100%"',
 'VISUAL.featuredFirst',
 'backgroundColor:VISUAL.serviceStyle==="cards"?',
 'onOpenOfferEnquiry={offerTitle=>',
 'if(!live.supportsEnquiry||!live.moduleKeys?.includes("enquiry"))return;',
 'setRequestedKind("offer")',
 'onOpenOfferEnquiry?.(offer.title)',
 'requestedKind==="offer"?',
 'setRequestedIntent("enquiry");setCurrent("enquiry")'
])ok(native.includes(marker),"Native service / offer integration missing: "+marker);
for(const marker of[
 'appVisualPresentation(presentation)',
 'fontSize:visual.headerCompact?',
 'fontWeight:visual.type.titleWeight',
 'visual.serviceColumns===1?"100%"',
 'visual.featuredFirst',
 '["typeStyle","Headings and typography",appAppearanceOptions.typeStyle]',
 '["serviceStyle","Service presentation",appAppearanceOptions.serviceStyle]',
 'TYPE_LABELS[value]','SERVICE_LABELS[value]'
])ok(market.includes(marker),"Marketplace and owner controls missing: "+marker);
ok(!native.includes("autoRedeemLoyalty"));
ok(!native.includes("autoConfirmBooking"));
ok(!market.includes('require("remote-font-installer")'));

// Real private Website Builder style validation and HTML CSS rule coverage
ok(websiteAppearanceOptions.typography.includes("editorial"));
ok(websiteAppearanceOptions.typography.includes("friendly"));
const site={id:"website-draft",generation:4,businessName:"Example Studio",
 businessType:"Hair salon",
 sections:[{id:"hero",type:"hero",enabled:true,
  title:"Custom heading",body:"Original owner wording"}],theme:{}};
const orig=JSON.stringify(site);
for(const [style,expected]of[
 ["editorial","visual-type-editorial"],["friendly","visual-type-friendly"]
]){
 const changed=applyWebsiteLayoutOperation(site,{action:"style",field:"typography",value:style});
 ok(changed.applied,changed.reason);
 eq(changed.draft.theme.typography,style);
 eq(changed.draft.sections[0].title,site.sections[0].title);
 const design=planWebsiteDesign({businessType:site.businessType,
  businessName:site.businessName,sections:changed.draft.sections,theme:changed.draft.theme});
 eq(design.visualIdentity.typography,style);
 ok(designCss(designForWebsite({businessType:site.businessType,theme:changed.draft.theme,
  plan:design})).includes("."+expected+" h1"),"HTML stylesheet must truly style selected heading");
}
eq(JSON.stringify(site),orig);
eq(applyWebsiteLayoutOperation(site,
 {action:"style",field:"typography",value:"<style>"}).applied,false);
// User-reviewed app/site typography cross-bridge
const businessId=uid("000000003196");
const app={id:uid("000000003197"),business_id:businessId,draft_revision:6,
 draft_config:{modules:[{key:"business_profile",enabled:true}],
  presentation:{typeStyle:"editorial"}}};
const plan=planMatchAppTypeToWebsite(site,app,{businessId});
ok(plan.ok,plan.reason);
eq(plan.webTypography,"editorial");eq(plan.privateOnly,true);
eq(plan.autoPublishes,false);eq(plan.changesCustomerData,false);
ok(confirmMatchAppTypeToWebsite(site,app,{businessId,evidence:plan}).ok);
eq(confirmMatchAppTypeToWebsite(site,{...app,draft_revision:7},
 {businessId,evidence:plan}).ok,false);
eq(confirmMatchAppTypeToWebsite({...site,generation:5},app,
 {businessId,evidence:plan}).ok,false);
eq(confirmMatchAppTypeToWebsite(site,{...app,draft_config:{...app.draft_config,
 presentation:{typeStyle:"impact"}}},
 {businessId,evidence:plan}).ok,false);
eq(planMatchAppTypeToWebsite(site,{...app,business_id:"another"},
 {businessId}).ok,false);
eq(planMatchAppTypeToWebsite(site,{...app,draft_config:{modules:[],
 presentation:{typeStyle:"javascript:bad"}}},{businessId}).ok,false);
const website=read("src/screens/websiteBuilder.js");
const bridgeUi=read("src/screens/websiteAppTypographyMatch.js");
const controller=read("src/app/AppController.js");
ok(website.includes("<WebsiteAppTypographyMatch website={draft}"));
ok(bridgeUi.includes("Apply typography to my PRIVATE website"));
ok(controller.includes("confirmMatchAppTypeToWebsite(current,app,{businessId,evidence})"));
ok(controller.includes('action:"style",field:"typography",value:check.webTypography'));
ok(controller.includes("setWebsiteUndo(items=>[...items,current].slice(-8))"));
eq(read("supabase/functions/busy-website-worker/designSystem.mjs")
 .includes(".visual-type-friendly h1"),true);
console.log("V3.194 "+checks+" app typography, native service, safe public offer enquiry, website coordination and source gates PASS.");
