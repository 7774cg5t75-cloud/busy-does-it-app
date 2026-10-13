import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {planIndustryFirstExperience,confirmIndustryFirstExperience}
 from "../src/core/industryFirstExperienceV3200.mjs";
import {reviewCrossChannelBrandContent}
 from "../src/core/brandCampaignReviewV3200.mjs";
import {proposeCoordinatedAppChanges}
 from "../src/core/appCoordinatedStudio.mjs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
let checks=0;
const ok=(v,m)=>{assert.ok(v,m);checks++};
const eq=(a,b,m)=>{assert.deepEqual(a,b,m);checks++};
const businessId="00000000-0000-4000-8000-000000003200";
const catalog=[
 ["business_profile","Business profile",{}],
 ["services","Services",{}],
 ["booking_request","Booking requests",{confirmation_required_by_business:true}],
 ["enquiry","Enquiries",{customer_action:true}],
 ["contact","Contact",{}],
 ["offers","Offers",{}]
].map(([module_key,title,capabilities])=>({module_key,title,capabilities,status:"available"}));
function makeApp(type="hair salon", keys=["business_profile","services","enquiry","booking_request"]){
 const profile={businessName:"Example Studio",businessType:type,tagline:"Owner approved care",
  about:"A studio with services in Devon.",
  services:[{name:"Consultation",description:"A discussion of your requirements."}]};
 return {id:"draft-app",business_id:businessId,draft_revision:5,category:type,
  draft_config:{surface:"busy_mini_app",modules:keys.map(key=>({key,enabled:true})),
  navigation:[...keys],display:{name:profile.businessName,category:type,tagline:profile.tagline},
  publicProfile:profile,presentation:{brandPalette:"custom",brandAccent:"#AA4488",
  typeStyle:"friendly",serviceStyle:"cards"}}};
}
const hair=makeApp();
const salon=planIndustryFirstExperience({businessId,app:hair,catalog});
ok(salon.ok,salon.reason);
eq(salon.industry,"appointment");eq(salon.targetModule,"booking_request");
eq(salon.actionLabel,"Request a booking");
eq(salon.preview.before,["business_profile","services","enquiry","booking_request"]);
eq(salon.preview.after,["business_profile","booking_request","services","enquiry"]);
eq(salon.preview.operations.length,1);
eq(salon.preview.operations[0].kind,"navigation");
eq(salon.checks.find(x=>x.id==="request_lifecycle").result,"synthetic_pass");
eq(salon.checks.find(x=>x.id==="live_delivery").result,"not_tested");
eq(salon.liveSubmissionVerified,false);
eq(salon.realDiaryConfirmationVerified,false);
eq(salon.providerDeliveryVerified,false);
eq(salon.realDeviceTested,false);
eq(salon.neverPublishes,true);
eq(salon.noCustomerRecordsAccess,true);
ok(confirmIndustryFirstExperience({businessId,app:hair,catalog,evidence:salon}).ok);
const edited=proposeCoordinatedAppChanges(hair.draft_config,salon.preview.operations);
ok(edited.ok,edited.reason);
eq(edited.nextConfig.navigation,salon.preview.after);
eq(edited.privateOnly,true);
for(const [changed,expected] of [
 [{...hair,draft_revision:6},false],
 [{...hair,business_id:"other"},false],
 [{...hair,id:"other-app"},false],
 [{...hair,draft_config:{...hair.draft_config,
  navigation:["business_profile","booking_request","services","enquiry"]}},false]
]){
 eq(confirmIndustryFirstExperience({businessId,app:changed,catalog,evidence:salon}).ok,expected);
}
for(const evidence of [
 null,{}, {...salon,businessId:"other"},
 {...salon,appRevision:4},{...salon,targetModule:"contact"},
 {...salon,preview:{...salon.preview,operations:[{kind:"first",moduleKey:"enquiry"}]}},
 {...salon,preview:{...salon.preview,before:["different"]}}
])eq(confirmIndustryFirstExperience({businessId,app:hair,catalog,evidence}).ok,false);
eq(planIndustryFirstExperience({businessId:"wrong",app:hair,catalog}).ok,false);
eq(planIndustryFirstExperience({businessId,app:hair,catalog:[]}).ok,false);
const fakeCatalog=catalog.map(x=>x.module_key==="booking_request"?
 {...x,capabilities:{confirmation_required_by_business:false}}:x);
eq(planIndustryFirstExperience({businessId,app:hair,catalog:fakeCatalog}).ok,false);
const disabled=catalog.map(x=>x.module_key==="booking_request"?
 {...x,status:"planned"}:x);
eq(planIndustryFirstExperience({businessId,app:hair,catalog:disabled}).ok,false);
const noServices=makeApp("hair salon",["business_profile","services","booking_request"]);
noServices.draft_config.publicProfile.services=[];
const noServicesPlan=planIndustryFirstExperience({businessId,app:noServices,catalog});
ok(noServicesPlan.ok);
eq(noServicesPlan.targetModule,"booking_request");
ok(noServicesPlan.missingSetup.some(x=>x.includes("Services")));
const noRoute=makeApp("food stall",["business_profile","services"]);
noRoute.draft_config.publicProfile.services=[];
const incomplete=planIndustryFirstExperience({businessId,app:noRoute,catalog});
ok(incomplete.ok);eq(incomplete.targetModule,null);
eq(incomplete.preview,null);
eq(incomplete.checks.find(x=>x.id==="public_facts").result,"setup_required");
const plumber=makeApp("plumber",["business_profile","services","contact","enquiry"]);
const trade=planIndustryFirstExperience({businessId,app:plumber,catalog});
ok(trade.ok,trade.reason);
eq(trade.industry,"trade");eq(trade.targetModule,"enquiry");
eq(trade.preview.after[1],"enquiry");
eq(trade.checks.find(x=>x.id==="request_lifecycle").result,"synthetic_pass");
const stall=makeApp("food stall",["business_profile","enquiry","services"]);
const food=planIndustryFirstExperience({businessId,app:stall,catalog});
ok(food.ok,food.reason);eq(food.industry,"food");
eq(food.targetModule,"services");eq(food.preview.after[1],"services");
eq(food.checks.find(x=>x.id==="request_lifecycle").result,"not_applicable");
// Approved Offers may be considered only after the runtime and terms pass.
const special=makeApp("food stall",["business_profile","offers","services"]);
const blockedOffers=planIndustryFirstExperience({businessId,app:special,catalog});
eq(blockedOffers.ok,false);
special.draft_config.offers=[{approved:true,title:"Owner approved special"}];
const validOffers=planIndustryFirstExperience({businessId,app:special,catalog});
ok(validOffers.ok);
eq(validOffers.targetModule,"services");
const atTop=makeApp("plumber",["business_profile","enquiry","services"]);
const top=planIndustryFirstExperience({businessId,app:atTop,catalog});
ok(top.ok);eq(top.preview,null);
// Same business Brand DNA, three actual copy preparations; never marketing sends.
const website={id:"owner-website",generation:7,businessId,
 businessName:"Example Studio",businessType:"hair salon",
 theme:{primary:"#AA4488",typography:"friendly"},
 sections:[{type:"hero",body:"Owner approved care"},
 {type:"about",body:"A studio with services in Devon."}]};
const campaign=reviewCrossChannelBrandContent({businessId,website,app:hair});
ok(campaign.ok,campaign.reason);
eq(campaign.channelCount,3);
eq(campaign.drafts.map(x=>x.channel),["social","poster","advert"]);
for(const d of campaign.drafts){
 ok(d.text.toLowerCase().includes("example studio"));
 eq(d.brandColour,"#AA4488");eq(d.notPublished,true);
}
eq(campaign.checklist.find(x=>x.id==="channels").status,"not_approved");
eq(campaign.checklist.find(x=>x.id==="tone").status,"needs_owner_choice");
eq(campaign.contentWasActuallyPrepared,true);
eq(campaign.nothingPersisted,true);
eq(campaign.externalProviderCalls,0);
eq(campaign.generatedImages,0);
eq(campaign.neverPublishes,true);
eq(reviewCrossChannelBrandContent({businessId:"wrong",website,app:hair}).ok,false);
eq(reviewCrossChannelBrandContent({businessId,website,
 app:{...hair,draft_revision:0}}).ok,false);
eq(reviewCrossChannelBrandContent({businessId,website:{
 ...website,theme:{primary:"#112233"}},app:hair}).ok,false);
// The UI must save only the reviewed current private revision via the existing
// authenticated, optimistic-concurrency controller.
const screen=read("src/screens/industryFirstExperienceReview.js");
const builder=read("src/screens/miniApps.js");
const brain=read("src/screens/businessBrandDnaPreview.js");
const controller=read("src/app/AppController.js");
for(const pattern of [
 "confirmIndustryFirstExperience({",
 "onSave?.({operations:verified.preview.operations",
 "appId:verified.appId,expectedRevision:verified.appRevision",
 "Nothing was changed.",
 "No safe section reorder is needed.",
 "Refresh the verified app and feature list"
])ok(screen.includes(pattern),"Missing actual industry approval: "+pattern);
ok(builder.includes("<IndustryFirstExperienceReview"));
ok(builder.includes("catalog={s.miniAppsStatus?.catalog||[]}"));
ok(builder.includes("onSave={s.saveCoordinatedAppChanges}"));
for(const pattern of [
 'miniAppsRequest("apply_coordinated_edits"',
 "Number(data.app.draft_revision)!==Number(expectedRevision)+1",
 "applyMiniAppsStatus(data.status)"
])ok(controller.includes(pattern),"Trusted save verification missing "+pattern);
ok(brain.includes("reviewCrossChannelBrandContent({"));
ok(brain.includes("Review three branded content drafts together"));
ok(brain.includes("campaignReview.drafts.map("));
console.log("V3.200 "+checks+" industry runtime, prepared navigation, fictional transitions, "+
 "tenant/revision rejection, brand continuity and owner-verification contracts PASS.");
