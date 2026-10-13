/**
 * V3.212 offline regressions for one website + Business App REQUEST contract.
 * Synthetic owners and requests only, no real customer data or provider calls.
 */
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {requestTransitionEvidence,reviewSharedRequestJourney,TYPES}
 from "../src/core/sharedRequestJourneyV3212.mjs";
import {decideAppRequestTransition,appRequestJourney}
 from "../src/core/appRequestLifecycle.mjs";
import {applyWebsiteLayoutOperation}
 from "../supabase/functions/busy-website-worker/websiteLayoutEditing.mjs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
let checks=0;
const ok=(value,msg)=>{assert.ok(value,msg);checks++;};
const eq=(actual,expected,msg)=>{assert.deepEqual(actual,expected,msg);checks++;};
const businessId="00000000-0000-4000-8000-000000003212";
const website=()=>({
 id:"web-private",businessId,generation:12,businessName:"Sample Caravan Centre",
 sections:[
  {id:"hero",enabled:true,type:"hero",ctaHref:"#contact",cta:"Get in touch"},
  {id:"services",enabled:true,type:"services",items:[
   {title:"Pitch hire",body:"Owner-approved caravan pitch information"}]},
  {id:"gallery",enabled:true,type:"gallery",items:[]},
  {id:"contact",enabled:true,type:"contact",
   email:"public@example.test",phone:"01611000000"}
 ],
 designPlan:{sectionOrder:["hero","services","gallery","contact"]},
 theme:{}
});
const app=()=>({
 id:"app-private",business_id:businessId,draft_revision:9,
 draft_config:{
  modules:["business_profile","services","contact","enquiry","booking_request"].map(
   key=>({key,enabled:true})),
  navigation:["business_profile","services","contact","enquiry","booking_request"],
  publicProfile:{
   businessName:"Sample Caravan Centre",
   services:[{name:"Pitch hire",description:"Owner-approved details"}],
   assets:{gallery:[]}
  }
 }
});
const catalogue=[
 ["business_profile",{}],["services",{}],["contact",{}],
 ["enquiry",{customer_action:true}],
 ["booking_request",{confirmation_required_by_business:true}]
].map(([module_key,capabilities])=>({module_key,status:"available",
 title:module_key,capabilities}));
eq(TYPES,["enquiry","booking_request"]);
for(const kind of TYPES){
 const report=reviewSharedRequestJourney({
  businessId,website:website(),app:app(),catalog:catalogue,kind
 });
 ok(report.ok,report.reason);
 eq(report.kind,"shared_request_journey_v3212");
 eq(report.requestKind,kind);
 eq(report.source.websiteGeneration,12);
 eq(report.source.appRevision,9);
 eq(report.website.publicContactVisible,true);
 eq(report.website.heroPointsToContact,true);
 eq(report.website.contactPriority,"later_on_page");
 eq(report.website.transactionalFormVerified,false);
 eq(report.app.runtimeValidated,true);
 eq(report.app.requestScreenPresent,true);
 eq(report.app.requestReadyForDesign,true);
 eq(report.app.bookingConfirmed,false);
 eq(report.customerActions.website,"public_contact_details_only");
 eq(report.customerActions.app,"private_app_request_module_present");
 eq(report.noRealRequestCreated,true);
 eq(report.noCustomerDataIncluded,true);
 eq(report.noProviderDeliveryProven,true);
 eq(report.noWebsiteFormInstalled,true);
 eq(report.noModuleEnabled,true);
 eq(report.noPublicChange,true);
 eq(report.requestContract.authenticatedTenantServerBoundaryRequired,true);
 eq(report.requestContract.idempotentReceiptRequired,true);
 eq(report.requestContract.ownerInboxAndReplyReceiptRequired,true);
 ok(report.gaps.includes("website_transactional_request_endpoint_unverified"));
 ok(report.gaps.includes("real_customer_submission_unverified"));
 ok(report.gaps.includes("external_notification_delivery_unverified"));
 eq(report.responsive.method,"static_rule_only");
 eq(report.responsive.appWidths.map(x=>x.logicalWidth),[320,390,820]);
 eq(report.responsive.phoneScreenshotReviewed,false);
 eq(report.responsive.tabletScreenshotReviewed,false);
 eq(report.responsive.desktopScreenshotReviewed,false);
 ok(!JSON.stringify(report).includes("public@example.test"),
  "Never copy public data into a minimal evidence report.");
 ok(!JSON.stringify(report).includes("Pitch hire"),
  "Never embed service copy or other business facts in evidence.");
}
const booking=reviewSharedRequestJourney({
 businessId,website:website(),app:app(),catalog:catalogue,kind:"booking_request"
});
eq(booking.requestContract.confirmedAvailabilityRequired,true);
eq(booking.requestContract.diaryCommitAndBookingReceiptRequired,true);
ok(booking.gaps.includes("real_availability_and_diary_confirmation_unverified"));
const enquiry=reviewSharedRequestJourney({
 businessId,website:website(),app:app(),catalog:catalogue,kind:"enquiry"
});
ok(!enquiry.gaps.includes("real_availability_and_diary_confirmation_unverified"));
const noContact=website();noContact.sections.find(s=>s.id==="contact").phone="";
noContact.sections.find(s=>s.id==="contact").email="";
const noContactReport=reviewSharedRequestJourney({
 businessId,website:noContact,app:app(),catalog:catalogue
});
eq(noContactReport.website.publicContactVisible,false);
ok(noContactReport.gaps.includes("website_public_contact_details"));
eq(noContactReport.website.heroPointsToContact,false);
const wrongAnchor=website();wrongAnchor.sections[0].ctaHref="#services";
const anchor=reviewSharedRequestJourney({
 businessId,website:wrongAnchor,app:app(),catalog:catalogue
});
eq(anchor.website.heroPointsToContact,false);
ok(anchor.gaps.includes("website_hero_contact_route"));
const hidden=website();hidden.sections.find(s=>s.id==="contact").enabled=false;
eq(reviewSharedRequestJourney({
 businessId,website:hidden,app:app(),catalog:catalogue
}).website.publicContactVisible,false);
const missingServices=app();missingServices.draft_config.publicProfile.services=[];
const incomplete=reviewSharedRequestJourney({
 businessId,website:website(),app:missingServices,catalog:catalogue,kind:"booking_request"
});
eq(incomplete.app.requestScreenPresent,true);
eq(incomplete.app.requestReadyForDesign,false);
ok(incomplete.gaps.includes("app_recorded_services"));
const noAppModule=app();
noAppModule.draft_config.modules.find(m=>m.key==="booking_request").enabled=false;
noAppModule.draft_config.navigation=noAppModule.draft_config.navigation.filter(
 k=>k!=="booking_request");
const absent=reviewSharedRequestJourney({
 businessId,website:website(),app:noAppModule,catalog:catalogue,kind:"booking_request"
});
eq(absent.app.requestScreenPresent,false);
ok(absent.gaps.includes("app_request_module"));
const notAvailable=reviewSharedRequestJourney({
 businessId,website:website(),app:app(),
 catalog:catalogue.map(r=>r.module_key==="enquiry"?{...r,status:"planned"}:r)
});
eq(notAvailable.app.runtimeValidated,false);
eq(notAvailable.app.requestScreenPresent,false);
ok(notAvailable.gaps.includes("app_supported_runtime"));
const unsafeBooking=reviewSharedRequestJourney({
 businessId,website:website(),app:app(),kind:"booking_request",
 catalog:catalogue.map(r=>r.module_key==="booking_request"?
  {...r,capabilities:{confirmation_required_by_business:false}}:r)
});
eq(unsafeBooking.app.requestScreenPresent,false);
for(const pair of [
 {businessId:"",website:website(),app:app(),catalog:catalogue},
 {businessId:"someone-else",website:website(),app:app(),catalog:catalogue},
 {businessId,website:{...website(),businessId:"someone-else"},app:app(),catalog:catalogue},
 {businessId,website:website(),app:{...app(),business_id:"someone-else"},catalog:catalogue},
 {businessId,website:{...website(),generation:0},app:app(),catalog:catalogue},
 {businessId,website:website(),app:{...app(),draft_revision:0},catalog:catalogue},
 {businessId,website:website(),app:{...app(),draft_config:{
   ...app().draft_config,navigation:["business_profile"]}},catalog:catalogue},
 {businessId,website:null,app:app(),catalog:catalogue},
 {businessId,website:website(),app:null,catalog:catalogue},
 {businessId,website:website(),app:app(),catalog:catalogue,kind:"payments"},
 {businessId,website:website(),app:app(),catalog:catalogue.concat(
  Array.from({length:51},(_,i)=>({module_key:"extra"+i,status:"available"})))}
]){
 const result=reviewSharedRequestJourney(pair);
 eq(result.ok,false,"Missing/stale/cross-tenant context must not produce joined report.");
 eq(result.noCustomerDataIncluded,true);
}
for(const [status,bridge,expected] of [
 ["received","",false],["reviewing","",false],["accepted","booking_draft",false],
 ["accepted","booking_confirmed",true],["closed","booking_confirmed",false]
]){
 const result=requestTransitionEvidence({kind:"booking_request",status,bridgeState:bridge});
 ok(result.ok,result.reason);
 eq(result.journey.confirmed,expected);
 eq(result.realBookingConfirmed,false);
 eq(result.independentProof,false);
 eq(result.serverReceiptNotQueried,true);
 eq(result.outboundReplySent,false);
}
eq(requestTransitionEvidence({kind:"booking_request",status:"received",
 bridgeState:"booking_draft",nextStatus:"accepted"}).proposedTransition.ok,false);
eq(requestTransitionEvidence({kind:"booking_request",status:"received",
 bridgeState:"booking_confirmed",nextStatus:"accepted"}).proposedTransition.ok,true);
eq(requestTransitionEvidence({kind:"enquiry",status:"received",
 nextStatus:"reviewing"}).proposedTransition.ok,true);
eq(requestTransitionEvidence({kind:"enquiry",status:"closed",
 nextStatus:"reviewing"}).proposedTransition.ok,false);
eq(requestTransitionEvidence({kind:"booking_request",status:"accepted",
 bridgeState:"booking_confirmed"}).independentProof,false);
eq(requestTransitionEvidence({kind:"donation",status:"received"}).ok,false);
eq(requestTransitionEvidence({kind:"booking_request",status:"fictitious"}).ok,false);
eq(requestTransitionEvidence({kind:"booking_request",status:"received",
 bridgeState:"x".repeat(61)}).ok,false);
eq(decideAppRequestTransition({status:"received",
 request_type:"booking_request"},"accepted",{bridgeState:"booking_draft"}).ok,false);
eq(appRequestJourney({status:"accepted",request_type:"booking_request"},
 {bridge_state:"booking_draft"}).confirmed,false);
const ui=read("src/screens/businessBrandDnaPreview.js");
const w=read("src/screens/websiteBuilder.js");
const a=read("src/screens/miniApps.js");
for(const token of [
 "reviewSharedRequestJourney({","Check enquiry and booking journeys",
 "requestReport.gaps.slice(0,5)","requestReport.responsive.appWidths",
 "A website Contact section is not a verified enquiry form."])
 ok(ui.includes(token),"Shared Brand DNA review must show true limits: "+token);
ok(w.includes("catalog={s.miniAppsView?.catalog||s.miniAppsStatus?.catalog||[]}"));
ok(a.includes("catalog={view.catalog||s.miniAppsStatus?.catalog||[]}"));
ok(read("src/core/universalCapabilityCatalogV3210.mjs")
 .includes("Website form delivery needs approved hosting"));
ok(read("src/core/appRequestLifecycle.mjs")
 .includes('bridgeState!=="booking_confirmed"'));
const improve=applyWebsiteLayoutOperation(website(),{
 action:"style",field:"ctaEmphasis",value:"strong"
});
ok(improve.applied,"A recorded real hero contact CTA can be made prominent privately.");
eq(improve.draft.theme.ctaEmphasis,"strong");
eq(website().theme.ctaEmphasis,undefined,"The original website fixture is not mutated.");
const withoutLink=website();withoutLink.sections[0].ctaHref="";
eq(applyWebsiteLayoutOperation(withoutLink,{
 action:"style",field:"ctaEmphasis",value:"strong"
}).applied,false,"No CTA may be promoted without a recorded target.");
const uiController=read("src/app/AppController.js");
const websiteUI=read("src/screens/websiteBuilder.js");
ok(uiController.includes("options.expectedGeneration!==websiteDraft.generation"),
 "Reviewed CTA changes are checked against the current website generation.");
ok(uiController.includes("options.expectedBusinessId!==cloudWorkspace?.businessId"),
 "Reviewed CTA changes are checked against the current signed-in business.");
ok(websiteUI.includes("onApplyWebsiteLayout={s.applyWebsiteLayoutAction}"),
 "The shared review reuses the existing private editor/undo controller.");
ok(ui.includes('field:"ctaEmphasis",value:"strong"'));
ok(ui.includes("requestReport.website.heroPointsToContact"));
ok(ui.includes("This only emphasises your already-existing, owner-approved contact link."));
ok(ui.includes("expectedGeneration:website.generation"));
ok(ui.includes("expectedWebsiteId:website.id"));
ok(ui.includes("expectedBusinessId:businessId"));
console.log("V3.212 "+checks+" assertions PASS: privacy-scoped shared requests, real runtime and owner facts, booking state boundaries, three-width static UX risks, UI wiring.");
