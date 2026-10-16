import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {CAPABILITIES,VERSION,getUniversalCapability,universalCapabilityCatalog}
 from "../src/core/universalCapabilityCatalogV3210.mjs";
import {INTENTS,detectRequestedCapabilities,planWebsiteSectionComposition,
 assessSurfaceCapability,planUniversalBuilderRequest}
 from "../src/core/universalBuilderPlanV3210.mjs";
import {SUPPORTED} from "../src/core/appRuntimeScreenSchema.mjs";
const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
let checks=0;
const ok=(v,msg)=>{assert.ok(v,msg);checks++};
const eq=(a,b,msg)=>{assert.deepEqual(a,b,msg);checks++};
const id="00000000-0000-4000-8000-000000003210";
const website={
 id:"site",businessId:id,generation:5,businessName:"Example Business",
 sections:[
  {id:"hero",type:"hero",enabled:true,title:"Welcome"},
  {id:"about",type:"text",enabled:true,title:"About"},
  {id:"faq",type:"faq",enabled:true,items:[{title:"Question",body:"Answer"}]},
  {id:"services",type:"services",enabled:true,items:[{title:"Pitch hire"}]},
  {id:"gallery",type:"gallery",enabled:true,items:[{approved:true,storagePath:"business/approved-work.jpg"}]},
  {id:"contact",type:"contact",enabled:true,email:"hello@example.test"}
 ],
 designPlan:{sectionOrder:["hero","about","faq","services","gallery","contact"]},
 theme:{}
};
const modules=[
 ["business_profile",{}],["services",{}],["contact",{}],["gallery",{}],
 ["enquiry",{customer_action:true}],
 ["booking_request",{confirmation_required_by_business:true}],
 ["offers",{}],["loyalty",{}]
];
const catalog=modules.map(([module_key,capabilities])=>({
 module_key,status:"available",capabilities,title:module_key
}));
const app={
 id:"app",business_id:id,draft_revision:8,
 draft_config:{
  modules:modules.slice(0,6).map(([key])=>({key,enabled:true})),
  navigation:modules.slice(0,6).map(([key])=>key),
  publicProfile:{businessName:"Example Business",services:[{name:"Pitch hire"}]},
  offers:[]
 }
};
eq(VERSION,"universal_capabilities_v3210");
eq(universalCapabilityCatalog().version,VERSION);
eq(universalCapabilityCatalog().canPublish,false);
eq(universalCapabilityCatalog().canConfirmBooking,false);
ok(CAPABILITIES.length>=25);
eq(new Set(CAPABILITIES.map(x=>x.id)).size,CAPABILITIES.length);
const ids=new Set(CAPABILITIES.map(x=>x.id));
const appModules=new Set(Object.keys(SUPPORTED));
const websiteSections=new Set(["hero","services","gallery","contact","faq","testimonials","products","events"]);
for(const c of CAPABILITIES){
 eq(c.version,1,"Every contract must carry an explicit schema version.");
 eq(c.ownerApprovalRequired,true);
 eq(c.liveProofProvided,false);
 ok(["section","guarded","planned"].includes(c.website.kind),"Known website mode: "+c.id);
 ok(["module","planned"].includes(c.app.kind),"Known app mode: "+c.id);
 for(const d of c.dependsOn)ok(ids.has(d)&&d!==c.id,"Dependency resolution "+d);
 if(c.app.kind==="module")ok(appModules.has(c.app.id),"App catalog must match real runtime: "+c.app.id);
 if(c.website.kind==="section")ok(websiteSections.has(c.website.id),
  "Website catalog must match real draft section: "+c.website.id);
 eq(getUniversalCapability(c.id).id,c.id);
}
eq(getUniversalCapability("invented_feature"),null);
for(const feature of [
 "Build a website where customers book holiday pitches, see availability, pay deposits, and receive confirmation emails.",
 "Create an independent shop with products, shopping basket, checkout, and an account.",
 "Our charity wants to accept donations and show upcoming events.",
 "Customers can upload photos, register accounts, and vote in competitions.",
 "I want a site to display my services, FAQ and customer testimonials.",
 "Build a members-only learning platform with subscriptions and courses."
]){
 const selected=detectRequestedCapabilities(feature);
 ok(selected.length>=2,"Multi-goal comprehension: "+feature);
 const result=planUniversalBuilderRequest({request:feature,businessId:id,website,app,catalog});
 ok(result.ok,result.reason);
 ok(result.detectedGoals.length>=2);
 eq(result.noIndustryRestrictions,true);
 eq(result.allLiveOutcomesUnverified,true);
 eq(result.generatedExecutableCode,false);
 eq(result.noModulesEnabled,true);
 eq(result.noChangeSaved,true);
 eq(result.noChargeMade,true);
 eq(result.noPublishPerformed,true);
 ok(result.capabilities.every(c=>!c.website.liveVerified&&!c.app.liveVerified));
 ok(result.capabilities.every(c=>c.ownerApprovalRequired===true));
 for(const c of result.capabilities)
  for(const dep of c.prerequisites)
   ok(result.capabilities.some(x=>x.id===dep),
    "Dependency included for "+c.id+": "+dep);
}
const camping=planUniversalBuilderRequest({
 request:"Customers reserve caravan pitches, see availability, pay deposits and receive confirmation emails.",
 businessType:"caravan park",businessId:id,website,app,catalog
});
ok(camping.ok);
for(const req of ["booking_request","availability","deposits","payments","notifications"])
 ok(camping.capabilities.some(c=>c.id===req),"Caravan booking need: "+req);
eq(camping.capabilities.find(x=>x.id==="booking_request").app.status,
 "present_in_private_draft");
eq(camping.capabilities.find(x=>x.id==="booking_request").website.status,
 "requires_new_implementation");
eq(camping.capabilities.find(x=>x.id==="deposits").app.status,
 "requires_new_implementation");
eq(camping.capabilities.find(x=>x.id==="deposits").requiresExternalProvider,true);
eq(camping.capabilities.find(x=>x.id==="availability").website.status,
 "requires_new_implementation");
eq(camping.websiteDraftComponents>0,true);
const novel=planUniversalBuilderRequest({
 request:"Invent a holographic caravan-layout configurator that simulates tyre pressure.",
 businessType:"future caravan technology",businessId:id,website,app,catalog
});
eq(novel.ok,true);
eq(novel.unfamiliarRequirement,true);
ok(novel.detectedGoals.includes("custom_feature"));
eq(novel.capabilities.find(x=>x.id==="custom_feature").website.status,
 "requires_new_implementation");
ok(novel.summary.includes("bespoke planning"));
const generic=planUniversalBuilderRequest({businessType:"unknown industry",
 businessId:id,website,app,catalog});
eq(generic.ok,true);
eq(generic.unfamiliarRequirement,false);
eq(generic.capabilityCount,1);
eq(generic.capabilities[0].id,"identity");
eq(detectRequestedCapabilities("Show my services but without payments"),
 ["services"]);
const current=planUniversalBuilderRequest({
 request:"Show photos and our services",businessId:id,website,app,catalog
});
eq(current.capabilities.find(x=>x.id==="gallery").website.status,
 "present_in_private_draft");
eq(current.capabilities.find(x=>x.id==="gallery").app.status,
 "present_in_private_draft");
const privatePlan=planWebsiteSectionComposition(website,["gallery","services"]);
eq(privatePlan.ok,true);
eq(privatePlan.before,
 ["hero","about","faq","services","gallery","contact"]);
eq(privatePlan.proposed.slice(0,3),["hero","gallery","services"]);
eq(privatePlan.changesSuggested,true);
eq(privatePlan.noEditApplied,true);
eq(privatePlan.privatePreviewOnly,true);
eq(website.designPlan.sectionOrder,
 ["hero","about","faq","services","gallery","contact"],
 "Preview never mutates source draft.");
const locked=planWebsiteSectionComposition({
 ...website,theme:{sectionOrder:["hero","about","services","gallery","faq","contact"]}
},["gallery"]);
eq(locked.ownerOrderPreserved,true);
eq(locked.changesSuggested,false);
eq(locked.noEditApplied,true);
const absent=planWebsiteSectionComposition({...website,
 sections:website.sections.filter(s=>s.id!=="gallery")},["gallery"]);
ok(!absent.proposed.includes("gallery"),"Never invent a site section.");
const noGallery=planWebsiteSectionComposition({...website,
 sections:website.sections.map(s=>s.id==="gallery"?{...s,enabled:false}:s)},["gallery"]);
ok(!noGallery.proposed.includes("gallery"),"Do not propose hidden sections as visible.");
const noApp=planUniversalBuilderRequest({
 request:"Customer booking requests",businessId:id,website,catalog
});
eq(noApp.capabilities.find(x=>x.id==="booking_request").app.status,
 "available_module_needs_owner_setup");
const unavailable=planUniversalBuilderRequest({
 request:"Customer booking requests",businessId:id,website,app,
 catalog:catalog.map(m=>m.module_key==="booking_request"?{...m,status:"planned"}:m)
});
eq(unavailable.capabilities.find(x=>x.id==="booking_request").app.status,
 "runtime_module_not_verified_available");
const unsafeBooking=planUniversalBuilderRequest({
 request:"Customer booking requests",businessId:id,website,app,
 catalog:catalog.map(m=>m.module_key==="booking_request"?
 {...m,capabilities:{confirmation_required_by_business:false}}:m)
});
eq(unsafeBooking.capabilities.find(x=>x.id==="booking_request").app.status,
 "runtime_module_not_verified_available");
const noConfirm=planUniversalBuilderRequest({
 request:"Customer enquiries",businessId:id,website,app,
 catalog:catalog.map(m=>m.module_key==="enquiry"?{...m,capabilities:{}}:m)
});
eq(noConfirm.capabilities.find(x=>x.id==="enquiry").app.status,
 "runtime_module_not_verified_available");
const offersApp={...app,draft_config:{
 ...app.draft_config,modules:[...app.draft_config.modules,{key:"offers",enabled:true}],
 navigation:[...app.draft_config.navigation,"offers"]}};
const unapproved=planUniversalBuilderRequest({
 request:"Offer coupons",businessId:id,website,app:offersApp,catalog
});
ok(unapproved.capabilities.some(c=>c.id==="offers"));
eq(unapproved.capabilities.find(c=>c.id==="offers").app.status,
 "available_module_needs_owner_setup");
const approved=planUniversalBuilderRequest({
 request:"Offer coupons",businessId:id,website,
 app:{...offersApp,draft_config:{...offersApp.draft_config,
 offers:[{approved:true,title:"An owner's real offer"}]}},catalog
});
eq(approved.capabilities.find(c=>c.id==="offers").app.status,
 "present_in_private_draft");
for(const invalid of [
 {request:"Show bookings",businessId:"another-business",website,app,catalog},
 {request:"Show bookings",businessId:"",website,app,catalog},
 {request:"Show bookings",businessId:id,website,
  app:{...app,business_id:null},catalog},
 {request:"Show bookings",businessId:id,
  website:{...website,businessId:"other"},app,catalog},
 {request:"Show bookings",businessId:id,website,
  app:{...app,business_id:"other"},catalog},
 {request:"Show bookings",businessId:id,website,app,catalog,
  businessType:"x".repeat(200)},
 {request:"Show bookings",businessId:id,website,app,catalog,
  request:"x".repeat(1401)},
 {request:"hi\u0001",businessId:id,website,app,catalog}
])eq(planUniversalBuilderRequest(invalid).ok,false,"Reject invalid/tenant-conflicting requests.");
const badNavigation=planUniversalBuilderRequest({
 request:"Customer bookings",businessId:id,website,
 app:{...app,draft_config:{...app.draft_config,navigation:["business_profile","services"]}},catalog
});
eq(badNavigation.capabilities.find(c=>c.id==="booking_request").app.status,
 "available_module_needs_owner_setup");
const ui=read("src/screens/universalBuilderPlanReview.js");
const websiteUi=read("src/screens/websiteBuilder.js");
const appUi=read("src/screens/miniApps.js");
for(const match of ["planUniversalBuilderRequest({","setReport(next.ok?next:null)",
 "Plan the requirements (no AI credits)","Nothing has been changed",
 "report.sectionPlan.proposed","report.source.appRevision"])
 ok(ui.includes(match),"Missing UI proof: "+match);
for(const [name,text] of [["website",websiteUi],["app",appUi]]){
 ok(text.includes('import {UniversalBuilderPlanReview} from "./universalBuilderPlanReview";'),
  "Missing shared planner import: "+name);
 ok(text.includes("<UniversalBuilderPlanReview surface=\""+name+"\""),
  "Missing shared planner surface wiring: "+name);
}
ok(websiteUi.includes("WebsiteLayoutControls"));
ok(appUi.includes("IndustryFirstExperienceReview"));
ok(read("ARCHITECTURE.md").includes("Permanent architecture decision — Universal Business Website & App Composition"));
console.log("V3.210 "+checks+
 " assertions PASS: universal capability contracts, novel business requests, dependencies, "+
 "draft-only composition, module approvals, tenant boundaries and two-builder UI wiring.");
