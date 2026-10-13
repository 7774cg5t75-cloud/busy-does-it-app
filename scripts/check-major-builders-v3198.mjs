import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {reconcileFirstAppReadback} from "../src/core/firstAppRecoveryV3198.mjs";
import {industryOf,suggestAppCustomerJourney}
 from "../src/core/industryAppJourneyV3198.mjs";
import {prepareBrandedCopyPreview}
 from "../src/core/brandedContentDraftV3198.mjs";
import {recommendedAppFirstSection}
 from "../src/core/websiteToAppBrandTransferV3196.mjs";
import {recommendOwnerBusinessApp}
 from "../src/core/ownerAppOpportunityV3197.mjs";

const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
let checks=0;
const eq=(a,b)=>{assert.deepEqual(a,b);checks++};
const ok=(v,m)=>{assert.ok(v,m);checks++};
const b="00000000-0000-4000-8000-000000003198";
const app={id:"a-private-app",business_id:b,draft_revision:5,
 draft_config:{modules:[{key:"business_profile",enabled:true},
 {key:"services",enabled:true},{key:"enquiry",enabled:true},
 {key:"booking_request",enabled:false},{key:"contact",enabled:true}],
 navigation:["business_profile","services","enquiry","contact"]}};
const server={ok:true,businessId:b,app};
const found=reconcileFirstAppReadback({status:server,businessId:b});
ok(found.ok);eq(found.exists,true);eq(found.mayCreate,false);
eq(found.appId,app.id);eq(found.revision,5);
eq(found.doesNotProveWebsiteTransfer,true);eq(found.noAutomaticOverwrite,true);
eq(found.noAutomaticPublish,true);
eq(reconcileFirstAppReadback({status:{ok:true,businessId:b,app:null},businessId:b}).mayCreate,true);
for(const status of [
 null,{},server&&{...server,ok:false},{...server,businessId:"another"},
 {...server,app:{...app,business_id:"another"}},
 {...server,app:{...app,draft_revision:"5"}},
 {...server,app:{...app,draft_revision:0}},
 {...server,app:{...app,id:"<evil>"}},
 {...server,app:{}}
])eq(reconcileFirstAppReadback({status,businessId:b}).ok,false);
eq(reconcileFirstAppReadback({status:server,businessId:"other"}).ok,false);
// Industry previews may not invent an enabled customer action.
for(const [type,industry] of [
 ["hairdresser","appointment"],["barber","appointment"],
 ["plumber","trade"],["gardening","trade"],
 ["food stall","food"],["café","food"],["florist","general"]
])eq(industryOf(type),industry);
const preset=mods=>({modules:mods.map(([key,enabled])=>({key,enabled}))});
const hair=suggestAppCustomerJourney({businessType:"hair salon",
 appConfig:preset([["booking_request",true],["services",true]])});
eq(hair.primaryModule,"booking_request");
ok(hair.cautions[0].includes("not an accepted appointment"));
eq(recommendedAppFirstSection("hair salon",preset([["booking_request",true]])),"booking_request");
eq(recommendedAppFirstSection("plumber",preset([["enquiry",true],["services",true]])),"enquiry");
eq(recommendedAppFirstSection("food stall",preset([["offers",true],["services",true]])),"offers");
const fallback=suggestAppCustomerJourney({businessType:"hair salon",
 appConfig:preset([["booking_request",false],["services",true]])});
eq(fallback.primaryModule,"services");
eq(fallback.availableInDraft,true);
const unavailable=suggestAppCustomerJourney({businessType:"plumber",
 appConfig:preset([["enquiry",false],["contact",false]])});
eq(unavailable.primaryModule,null);eq(unavailable.availableInDraft,false);
eq(unavailable.requiresFeatureSetup,true);eq(unavailable.noAutomaticFeatureActivation,true);
for(const value of [null,{},[],{modules:"booking_request"},{modules:[{key:"booking_request",enabled:"true"}]}])
 eq(suggestAppCustomerJourney({businessType:"salon",appConfig:value}).primaryModule,null);
// Owner-scoped preview uses only already visible Brand DNA draft fields.
const brand={ok:true,schema:"private_brand_dna_draft_v1",businessId:b,
 source:{websiteId:"owner-site",websiteGeneration:7,
 appId:app.id,appDraftRevision:5},
 identity:{name:"Example Florist",tagline:"Beautiful seasonal flowers",
 about:"Local flowers for special occasions."},
 services:[{name:"Bouquets",description:"Seasonal blooms"},
 {name:"Weddings",description:"Made to order"}],
 design:{primaryColour:"#AA4488",appTypography:"editorial"},
 voice:{ownerChosenTone:"warm"},
 assets:{photos:[{uri:"https://example.com/approved.jpg",alt:"Flowers"}]},
 conflicts:[]};
for(const channel of ["social","poster","advert"]){
 const generated=prepareBrandedCopyPreview(brand,{channel});
 ok(generated.ok,generated.reason);eq(generated.channel,channel);
 ok(generated.copy.toLowerCase().includes("example florist"));
 ok(generated.copy.includes("Bouquets"));
 ok(!generated.copy.includes("approved.jpg"));
 eq(generated.businessId,b);eq(generated.requiresOwnerApproval,true);
 eq(generated.neverPublishes,true);eq(generated.providerCallsMade,false);
 eq(generated.advertisingCampaignNotCreated,true);
}
for(const channel of ["video","website","app",""]){
 eq(prepareBrandedCopyPreview(brand,{channel}).ok,false);
}
eq(prepareBrandedCopyPreview({...brand,conflicts:["App and website name differ."]}).ok,false);
eq(prepareBrandedCopyPreview({...brand,identity:{name:"Example Florist",tagline:"",about:""},services:[]}).ok,false);
eq(prepareBrandedCopyPreview({...brand,ok:false}).ok,false);
const badCopy=prepareBrandedCopyPreview({...brand,identity:{...brand.identity,tagline:"<script>"}});
ok(badCopy.ok);ok(!badCopy.copy.includes("<script>"));
const firstUi=read("src/screens/firstAppFromWebsite.js");
const brandUi=read("src/screens/businessBrandDnaPreview.js");
const controller=read("src/app/AppController.js");
const transfer=read("src/core/websiteToAppBrandTransferV3196.mjs");
for(const piece of [
 'const before=await miniAppsRequest("owner_status")',
 'reconcileFirstAppReadback({status:before,businessId})',
 'if(preflight.exists){','applyMiniAppsStatus(before);',
 'if(verified.ok&&verified.exists&&',
 'expectedNoExistingApp:true',
 'miniAppsRequest("apply_coordinated_edits"',
 'firstAppFromWebsiteInFlightRef.current=false'
])ok(controller.includes(piece),"First-app reconciliation wiring: "+piece);
ok(firstUi.includes("result.alreadyExists===true"));
ok(firstUi.includes("opportunity.entitlementVerified===true"));
ok(firstUi.includes("suggestAppCustomerJourney({"));
ok(transfer.includes("suggestAppCustomerJourney({businessType:type,appConfig:config})"));
ok(brandUi.includes("prepareBrandedCopyPreview("));
ok(brandUi.includes("<Text selectable style={styles.cardBody}>{copyDraft.copy}</Text>"));
const website={id:"owner-site",generation:7,businessId:b,
 sections:[{type:"services",items:[{title:"Bouquets"}]}]};
const blocked=recommendOwnerBusinessApp({businessId:b,website,
 businessType:"florist",entitlement:{businessId:b,verified:true,
 eligible:true,remaining:0,authorizesBuild:false}});
eq(blocked.entitlementVerified,false);
console.log("V3.198 "+checks+" recovery, evidence-based industry journeys, brand draft, benefit and owner-review contracts PASS.");
