/**
 * V3.209 — pure offline regressions for both builders, their shared customer
 * journey and explicit evidence boundaries. No provider, network or live DB.
 */
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {deriveSector,planWebsiteDesign,photographicCount,selectVisualIdentity}
 from "../supabase/functions/busy-website-worker/designPlanner.mjs";
import {designForWebsite,designCss}
 from "../supabase/functions/busy-website-worker/designSystem.mjs";
import {websiteDesignAlternative} from "../src/core/websiteDesignAlternatives.mjs";
import {planFunctionalBusinessApp}
 from "../src/core/appExperiencePlanner.mjs";
import {reviewBuilderJourneyContinuity}
 from "../src/core/builderJourneyContinuityV3209.mjs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
let checks=0;
const eq=(a,b,message)=>{assert.deepEqual(a,b,message);checks++};
const ok=(value,message)=>{assert.ok(value,message);checks++};
const businessId="00000000-0000-4000-8000-000000003209";
const image=(i,approved=true)=>({storagePath:"business/gallery/"+i+".jpg",
 approved,alt:"Example work "+i});
const website=(businessType,photos=[])=>({
 id:"website-3209",businessId,generation:8,businessName:"Example Studio",businessType,
 theme:{primary:"#334455"},
 sections:[
  {id:"hero",enabled:true,type:"hero",body:"Owner-approved introduction"},
  {id:"services",enabled:true,type:"services",items:[
    {title:"Consultation",body:"Discuss requirements and agree a suitable scope."},
    {title:"Maintenance",body:"Owner-provided maintenance details are available."}
  ]},
  {id:"about",enabled:true,type:"text",body:"A real independent business in Devon offering local service, care and attention to customers."},
  {id:"gallery",enabled:true,type:"gallery",items:photos},
  {id:"faq",enabled:true,type:"faq",items:[{title:"How?",body:"Contact us."},{title:"Where?",body:"Devon."}]},
  {id:"contact",enabled:true,type:"contact",phone:"01234567890"}
 ]
});
const app=(modules=["business_profile","services","enquiry","booking_request"])=>({
 id:"app-3209",business_id:businessId,draft_revision:5,
 draft_config:{surface:"busy_mini_app",modules:modules.map(key=>({key,enabled:true})),
  navigation:[...modules],publicProfile:{businessName:"Example Studio",
   services:[{name:"Consultation",description:"Owner text"}],assets:{gallery:[]}}}
});
const allCatalog=[
 "business_profile","services","enquiry","booking_request","contact","gallery","offers"
].map(module_key=>({module_key,title:module_key,status:"available",capabilities:{}}));
for(const [type,expected] of [
 ["plumber","trades"],["festival food stall","hospitality"],["garden designer","nature"],
 ["photography studio","creative"],["independent bookshop","retail"],
 ["driving instructor","learning"],["wedding planner","events"],
 ["accountant","professional"],["barber","wellness"],["unknown local service","neutral"]
]){
 eq(deriveSector(type),expected,"Unexpected website sector for "+type);
 eq(designForWebsite({businessType:type}).sector,expected,
  "Rendered design must use the same sector as the planner: "+type);
}
for(const type of ["photography studio","independent bookshop","driving instructor","wedding planner"]){
 const visual=designForWebsite({businessType:type,plan:{
  visualIdentity:{paletteVariant:"b"}}});
 ok(visual.accent?.startsWith("#"),"A valid palette is required for "+type);
 ok(designCss(visual).includes("--accent:"),"Website CSS must use the sector palette.");
}
const webPhotos=[image(1),image(2)];
const creative=website("photography studio",webPhotos);
const creativePlan=planWebsiteDesign({
 businessType:creative.businessType,businessName:creative.businessName,
 sections:creative.sections,theme:creative.theme
});
eq(creativePlan.sector,"creative");
eq(creativePlan.signals.approvedPhotos,2);
eq(creativePlan.sectionOrder[1],"gallery");
ok(["portfolio","showcase","editorial"].includes(creativePlan.family));
ok(creativePlan.explanation.includes("creative"));
const another=planWebsiteDesign({businessType:creative.businessType,
 businessName:creative.businessName,sections:creative.sections,theme:creative.theme});
eq(creativePlan.visualIdentity,another.visualIdentity,
 "The same business should not randomly change its visual fingerprint.");
const learning=website("driving instructor");
const learningPlan=planWebsiteDesign({businessType:learning.businessType,
 businessName:learning.businessName,sections:learning.sections,theme:learning.theme});
eq(learningPlan.sector,"learning");
eq(learningPlan.sectionOrder.slice(0,3),["hero","services","faq"]);
const unapproved=website("photography studio",[image(1,false),image(2,false)]);
eq(photographicCount(unapproved.sections),0);
const noPhotoPlan=planWebsiteDesign({businessType:unapproved.businessType,
 businessName:unapproved.businessName,sections:unapproved.sections});
ok(!["showcase","portfolio"].includes(noPhotoPlan.family));
const noPhotoChoices=websiteDesignAlternative(unapproved);
ok(noPhotoChoices.options.every(p=>!["showcase","portfolio"].includes(p.family)));
const photoChoices=websiteDesignAlternative(creative);
ok(photoChoices.options.some(p=>["showcase","portfolio"].includes(p.family)));
const heroOnly=website("photography studio");
heroOnly.sections.find(s=>s.id==="hero").asset=image(3,true);
eq(photographicCount(heroOnly.sections),1);
ok(websiteDesignAlternative(heroOnly).options.some(x=>
 ["showcase","portfolio"].includes(x.family)),"Approved hero should count as a photo.");
const preferences=websiteDesignAlternative(creative,{
 likedFamilies:["editorial"],rejectedFamilies:["showcase"]});
ok(preferences.options.find(x=>x.family==="showcase")?.previouslyRejected);
eq(preferences.suggested?.family,"editorial");
eq(selectVisualIdentity({businessName:"Example",businessType:"photography"}).fingerprint,
 selectVisualIdentity({businessName:"Example",businessType:"photography"}).fingerprint);
const pub={assets:{gallery:[{approved:true,uri:"https://example.test/real.jpg"}]},
 offers:[]};
const photographer=planFunctionalBusinessApp({businessType:"photography studio",
 businessGoals:"Show our photo portfolio",catalog:allCatalog,profile:pub});
eq(photographer.category,"creative");eq(photographer.layout,"gallery-first");
eq(photographer.suggestedModules.find(x=>x.key==="gallery")?.suggested,true);
eq(photographer.ownerApprovalRequired,true);
eq(photographer.recommendedNotEnabled,true);
eq(photographer.customerTaskNotTested,true);
for(const [type,sector] of [
 ["independent bookshop","retail"],["driving instructor","learning"],
 ["wedding planner","events"],["plumber","trades"],["food stall","food"],
 ["hair salon","appointments"],["accountant","professional"]
])eq(planFunctionalBusinessApp({businessType:type,catalog:allCatalog}).category,sector);
const noGallery=planFunctionalBusinessApp({businessType:"photography studio",
 businessGoals:"Show our photo portfolio",catalog:allCatalog,
 profile:{assets:{gallery:[{approved:false,uri:"https://example.test/x.jpg"}]}}});
ok(noGallery.missingOwnerFacts.includes("approved_gallery_photos"));
eq(noGallery.suggestedModules.find(x=>x.key==="gallery")?.suggested,false);
eq(noGallery.layout!=="gallery-first",true);
const offers=planFunctionalBusinessApp({businessType:"independent bookshop",
 businessGoals:"Show our special offers",catalog:allCatalog,
 profile:{offers:[{title:"Sale",approved:false}]}});
eq(offers.suggestedModules.find(x=>x.key==="offers")?.suggested,false);
ok(offers.missingOwnerFacts.includes("approved_offer_terms"));
const approvedOffers=planFunctionalBusinessApp({businessType:"independent bookshop",
 businessGoals:"Show our special offers",catalog:allCatalog,
 profile:{offers:[{title:"Owner approved promotion",approved:true}]}});
eq(approvedOffers.suggestedModules.find(x=>x.key==="offers")?.suggested,true);
const disabled=allCatalog.map(x=>x.module_key==="booking_request"?{...x,status:"planned"}:x);
const waiting=planFunctionalBusinessApp({businessType:"driving instructor",
 businessGoals:"Let customers book lessons",catalog:disabled});
ok(waiting.unavailableGoalCapabilities.includes("booking_request"));
ok(!waiting.visibleModuleKeys.includes("booking_request"));
eq(waiting.canConfirmBooking,false);
eq(waiting.canEnablePayments,false);
const two=app();
const aligned=reviewBuilderJourneyContinuity({website:creative,app:two,businessId});
ok(aligned.ok,aligned.reason);
eq(aligned.source.websiteGeneration,8);eq(aligned.source.appRevision,5);
eq(aligned.evidence.matchingServiceNames,1);
ok(aligned.recommendations.some(x=>x.id==="booking-handoff"));
eq(aligned.customerActionVerified,false);eq(aligned.neverPublishes,true);
eq(aligned.noContentTransferred,true);eq(aligned.noCustomerRecordsRead,true);
const missingServices=app();
missingServices.draft_config.publicProfile.services=[{name:"Different service"}];
const mismatch=reviewBuilderJourneyContinuity({
 website:creative,app:missingServices,businessId});
ok(mismatch.recommendations.some(x=>x.id==="services"&&x.level==="important"));
for(const pair of [
 {website:creative,app:two,businessId:"some-other-business"},
 {website:creative,app:{...two,business_id:"other"},businessId},
 {website:{...creative,businessId:"other"},app:two,businessId},
 {website:{...creative,generation:0},app:two,businessId},
 {website:creative,app:{...two,draft_revision:0},businessId},
 {website:creative,app:{...two,draft_config:{...two.draft_config,
   navigation:["business_profile","enquiry"]}},businessId}
]){
 eq(reviewBuilderJourneyContinuity(pair).ok,false,
  "Reject stale, cross-business or invalid builder pairs.");
}
const dnaUi=read("src/screens/businessBrandDnaPreview.js");
const builderUi=read("src/screens/miniApps.js");
const websiteUi=read("src/screens/websiteBuilder.js");
for(const text of ["reviewBuilderJourneyContinuity({website,app,businessId})",
 "Check how my website and app work together","journey.recommendations.map"])
 ok(dnaUi.includes(text),"Missing approved UI continuity hook: "+text);
ok(builderUi.includes("experience.missingOwnerFacts?.length"));
ok(builderUi.includes("experience.layoutReason"));
ok(builderUi.includes("<BusinessBrandDnaPreview"));
ok(websiteUi.includes("<BusinessBrandDnaPreview"));
ok(websiteUi.includes("View my hosted website again"));
console.log("V3.209 "+checks+" sector design, content approval, module gating, cross-builder scope and UI contract checks PASS.");
