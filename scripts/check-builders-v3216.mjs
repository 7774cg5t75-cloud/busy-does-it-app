/**
 * V3.216 isolated offline regression: site-origin intake preflight,
 * owner/visitor privacy, industry-neutral capability planning and UI wiring.
 * No network, provider, database, customer request or published website.
 */
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {exactOrigin,strictVisitorFields,verifySiteOriginIntakeV3216}
 from "../supabase/functions/busy-website-request-intake/siteOriginGuardV3216.mjs";
import {planWebsiteIntakeV3216}
 from "../src/core/websiteIntakePlanningV3216.mjs";
import {adviseCustomerCapabilityV3216}
 from "../src/core/customerCapabilityAdviceV3216.mjs";
const source=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
let count=0;
const yes=(x,label)=>{assert.ok(x,label);count++;};
const same=(a,b,label)=>{assert.deepEqual(a,b,label);count++;};
const BID="11111111-1111-4111-8111-111111111111";
const SITE="22222222-2222-4222-8222-222222222222";
const DEP="33333333-3333-4333-8333-333333333333";
const BAD="44444444-4444-4444-8444-444444444444";
const KEY="AbCdEf1234567890_-AbCdEf1234567890";
const NOW="2026-10-14T12:00:00Z";
const ORIGIN="https://slow-roast.example";
const consent={notice:"We use your details only to handle your enquiry.",
 revision:KEY};
const fixtures=()=>({
 request:{
  origin:ORIGIN,requestType:"enquiry",idempotencyKey:KEY,
  consentRevision:KEY,consentAccepted:true,
  payload:{name:"Example Person",email:"test@example.test",
   message:"Can you arrange a food stall?"}
 },
 serverFacts:{
  website:{id:SITE,business_id:BID,current_live_deployment_id:DEP},
  deployment:{id:DEP,website_id:SITE,business_id:BID,status:"live",
   public_origin:ORIGIN},
  approval:{website_id:SITE,business_id:BID,deployment_id:DEP,
   status:"approved",enabled:true,request_type:"enquiry",consent:{...consent}},
  challenge:{website_id:SITE,business_id:BID,deployment_id:DEP,
   idempotency_key:KEY,request_type:"enquiry",origin:ORIGIN,
   status:"verified",single_use:true,consumed:false,
   abuse_limits_passed:true,expires_at:"2026-10-14T12:05:00Z"}
 }
});
const check=x=>verifySiteOriginIntakeV3216({...x,now:NOW});
const good=check(fixtures());
yes(good.ok,"A completely bound source contract should pass preflight.");
same(good.publicEndpointActive,false);
same(good.mayCommit,false);
same(good.mayIssueReceipt,false);
same(good.bookingConfirmed,false);
same(good.providerDelivered,false);
same(good.requiresServerTransaction,true);
same(good.siteOriginIsNotAuthentication,true);
yes(!JSON.stringify(good).includes("test@example.test"),
 "Never echo contact details to the preflight response.");
yes(!JSON.stringify(good).includes("Example Person"));
for(const value of [ORIGIN,ORIGIN+"/"]){
 same(exactOrigin(value),ORIGIN);
}
for(const value of ["http://slow-roast.example",
 "https://slow-roast.example/path","https://slow-roast.example/?next=1",
 "https://slow-roast.example:8443","https://user@slow-roast.example",
 "https://localhost",
 "https://bad.local","javascript:alert(1)","https://slow-roast.example#fragment"]){
 same(exactOrigin(value),"","Never accept a non-canonical public origin.");
}
same(exactOrigin("https://slow-roast.example.evil.test"),
 "https://slow-roast.example.evil.test",
 "A valid-looking hostname is not proof of the allowed published origin.");
function rejectMutation(mutator,name){
 const x=fixtures();mutator(x);
 const result=check(x);
 same(result.ok,false,name);
 same(result.mayCommit,false,name+" cannot commit");
 same(result.publicEndpointActive,false,name+" cannot activate endpoint");
 same(result.noCustomerDataReturned,true,name+" cannot return PII");
}
const denialCases=[
 ["forged visitor business ID",x=>x.request.businessId=BAD],
 ["forged visitor website ID",x=>x.request.websiteId=SITE],
 ["forged visitor approval",x=>x.request.approved=true],
 ["forged visitor version",x=>x.request.liveDeploymentId=DEP],
 ["missing request metadata",x=>delete x.request.origin],
 ["missing server website",x=>x.serverFacts.website=null],
 ["missing server deployment",x=>x.serverFacts.deployment=null],
 ["missing server approval",x=>x.serverFacts.approval=null],
 ["missing server challenge",x=>x.serverFacts.challenge=null],
 ["different business",x=>x.serverFacts.deployment.business_id=BAD],
 ["different site",x=>x.serverFacts.deployment.website_id=BAD],
 ["stale live deployment",x=>x.serverFacts.website.current_live_deployment_id=BAD],
 ["unpublished deployment",x=>x.serverFacts.deployment.status="draft"],
 ["malicious origin",x=>x.request.origin="https://phishing.example"],
 ["HTTP downgrade",x=>x.request.origin="http://slow-roast.example"],
 ["unapproved configuration",x=>x.serverFacts.approval.status="draft"],
 ["other tenant approval",x=>x.serverFacts.approval.business_id=BAD],
 ["different approval website",x=>x.serverFacts.approval.website_id=BAD],
 ["different approval version",x=>x.serverFacts.approval.deployment_id=BAD],
 ["disabled approval",x=>x.serverFacts.approval.enabled=false],
 ["changed action",x=>x.request.requestType="booking_request"],
 ["changed approved type",x=>x.serverFacts.approval.request_type="booking_request"],
 ["unknown action",x=>x.request.requestType="payment"],
 ["weak idempotency",x=>x.request.idempotencyKey="1234"],
 ["changed idempotency",x=>x.request.idempotencyKey="AB".repeat(20)],
 ["unverified challenge",x=>x.serverFacts.challenge.status="created"],
 ["different challenge website",x=>x.serverFacts.challenge.website_id=BAD],
 ["different challenge business",x=>x.serverFacts.challenge.business_id=BAD],
 ["different challenge deployment",x=>x.serverFacts.challenge.deployment_id=BAD],
 ["different challenge origin",x=>x.serverFacts.challenge.origin="https://fraud.test"],
 ["different challenge action",x=>x.serverFacts.challenge.request_type="booking_request"],
 ["different challenge key",x=>x.serverFacts.challenge.idempotency_key="AB".repeat(20)],
 ["challenge replay",x=>x.serverFacts.challenge.consumed=true],
 ["challenge not single-use",x=>x.serverFacts.challenge.single_use=false],
 ["traffic limits exceeded",x=>x.serverFacts.challenge.abuse_limits_passed=false],
 ["expired challenge",x=>x.serverFacts.challenge.expires_at="2026-10-14T11:59:59Z"],
 ["unbounded challenge lifespan",x=>x.serverFacts.challenge.expires_at="2026-10-14T12:30:00Z"],
 ["visitor did not consent",x=>x.request.consentAccepted=false],
 ["visitor consent changed",x=>x.request.consentRevision="AA".repeat(20)],
 ["notice missing",x=>x.serverFacts.approval.consent.notice=""],
 ["too-short notice",x=>x.serverFacts.approval.consent.notice="Yes"],
 ["unclear notice version",x=>x.serverFacts.approval.consent.revision="rev1"],
 ["customer missing name",x=>x.request.payload.name=""],
 ["customer missing contact method",x=>{
    x.request.payload.email="";x.request.payload.phone="";}],
 ["customer email invalid",x=>x.request.payload.email="not an email"],
 ["customer message missing",x=>x.request.payload.message=""],
 ["unexpected sensitive visitor field",x=>x.request.payload.creditCard="123"],
 ["nested unknown field",x=>x.request.payload.metadata={businessId:BAD}],
 ["oversized message",x=>x.request.payload.message="X".repeat(5001)],
 ["oversized optional email",x=>{x.request.payload.phone="+44 7700 900123";x.request.payload.email="x".repeat(251);}],
 ["oversized optional phone",x=>x.request.payload.phone="2".repeat(51)],
 ["unexpected payload type",x=>x.request.payload.phone={hidden:true}]
];
for(const [name,mutate] of denialCases)rejectMutation(mutate,name);
const booking=fixtures();
booking.request.requestType="booking_request";
booking.serverFacts.approval.request_type="booking_request";
booking.serverFacts.challenge.request_type="booking_request";
booking.serverFacts.approval.services=["Pitch hire","Marquee catering"];
booking.request.payload={name:"Example Person",phone:"+44 7700 900123",
 service:"Pitch hire",preferredDate:"2026-11-20"};
yes(check(booking).ok,"Approved booking REQUEST can pass a preflight.");
same(check(booking).bookingConfirmed,false,
 "An accepted request is never a confirmed diary appointment.");
rejectMutation(x=>{
 x.request.requestType="booking_request";
 x.serverFacts.approval.request_type="booking_request";
 x.serverFacts.challenge.request_type="booking_request";
 x.serverFacts.approval.services=["Pitch hire"];
 x.request.payload={name:"Example",phone:"+44 7700 900123",service:"Other"};
},"unsupported booked service");
yes(strictVisitorFields("booking_request",booking.request.payload).ok);
same(strictVisitorFields("enquiry",{...booking.request.payload}).ok,false);
const appCatalog=[{module_key:"enquiry",status:"available"}];
const appRef="55555555-5555-4555-8555-555555555555";
const versionRef="66666666-6666-4666-8666-666666666666";
const fullLive={businessType:"Plumber",businessId:BID,
 app:{id:appRef,business_id:BID,status:"live",
  current_live_version_id:versionRef},
 liveVersion:{id:versionRef,mini_app_id:appRef,state:"live",config:{modules:[{key:"enquiry",enabled:true}]}},
 catalog:appCatalog,publishedModules:[{key:"enquiry",enabled:true}]};
const understood=adviseCustomerCapabilityV3216(fullLive);
same(understood.capability,"enquiry");
same(understood.verifiedAvailableInCurrentBusinessApp,true);
same(adviseCustomerCapabilityV3216({...fullLive,
 liveVersion:{...fullLive.liveVersion,state:"draft"}})
 .verifiedAvailableInCurrentBusinessApp,false);
same(adviseCustomerCapabilityV3216({...fullLive,businessId:BAD})
 .verifiedAvailableInCurrentBusinessApp,false);
same(adviseCustomerCapabilityV3216({...fullLive,
 app:{...fullLive.app,current_live_version_id:BAD}})
 .verifiedAvailableInCurrentBusinessApp,false);
same(understood.recommendationOnly,true);
same(understood.providerSpendAuthorised,false);
const unknown=adviseCustomerCapabilityV3216({businessType:"Novel creative cooperative"});
same(unknown.ok,true);
same(unknown.unknownIndustryFallback,true);
same(unknown.industryRestrictionsApplied,false);
same(unknown.verifiedAvailableInCurrentBusinessApp,false);
same(adviseCustomerCapabilityV3216({businessType:"Restaurant"}).capability,
 "booking_request");
same(adviseCustomerCapabilityV3216({businessType:"Online store"}).capability,
 "catalogue");
same(adviseCustomerCapabilityV3216({
 businessType:"Restaurant",description:"We do not take bookings"
}).capability,"enquiry","Do not force industry booking stereotypes.");
same(adviseCustomerCapabilityV3216({
 businessType:"Restaurant",description:"We do not take bookings"
}).explicitlyDeclinedBookings,true);
same(adviseCustomerCapabilityV3216({
 businessType:"Restaurant",description:"We only want enquiries, not bookings"
}).suggestionEvidenceSource,"stated_business_goal");
same(adviseCustomerCapabilityV3216({
 businessType:"Plumber",description:"Please help customers book appointments"
}).capability,"booking_request","Explicit owner goal beats industry hint.");
same(adviseCustomerCapabilityV3216({
 businessType:"Plumber",description:"We want an online shop for parts"
}).capability,"catalogue","Owner description wins over trade stereotype.");
const businessWebsite={id:"private-site",businessId:BID,generation:5,
 sections:[],theme:{}};
const planInput={businessId:BID,website:businessWebsite,kind:"enquiry"};
const plan=planWebsiteIntakeV3216(planInput);
yes(plan.ok);
same(plan.publicFormEnabled,false);
same(plan.customerRequestSaved,false);
same(plan.noNewEndpoint,true);
same(plan.ownerPrivacyNoticeRequired,true);
same(plan.proposedFields.map(x=>x.key),["name","email","phone","message"]);
same(plan.completedStagingChecks,0);
same(planWebsiteIntakeV3216({...planInput,kind:"booking_request"})
 .proposedFields.map(x=>x.key),["name","email","phone","service","preferredDate"]);
same(planWebsiteIntakeV3216({...planInput,kind:"checkout"}).ok,false);
same(planWebsiteIntakeV3216({...planInput,businessId:BAD}).ok,false);
const withDeployment=planWebsiteIntakeV3216({...planInput,
 publishing:{liveDeployment:{id:DEP},
 website:{current_live_deployment_id:DEP},draftChangedSinceHosted:false},
 deliveryProof:{verified:true}});
same(withDeployment.completedSourceChecks,1);
same(withDeployment.completedStagingChecks,0);
same(withDeployment.publicFormEnabled,false);
const withStale=planWebsiteIntakeV3216({...planInput,
 publishing:{liveDeployment:{id:DEP},
 website:{current_live_deployment_id:BAD},draftChangedSinceHosted:true},
 deliveryProof:{verified:true}});
same(withStale.completedSourceChecks,0);
const ui=source("src/screens/websiteAppHandoffReview.js");
yes(ui.includes("planWebsiteIntakeV3216"));
yes(ui.includes("adviseCustomerCapabilityV3216"));
yes(ui.includes("Proposed customer form (not live)"));
yes(ui.includes("zero live browser tests"));
const builder=source("src/screens/websiteBuilder.js");
yes(builder.includes("businessType={draft?.businessType"));
const journey=source("src/core/sharedRequestJourneyV3212.mjs");
yes(journey.includes("websiteOriginMustBeServerResolved:true"));
yes(journey.includes("websiteIntakeEndpointActive:false"));
const edgeDirectory=source("supabase/functions/busy-website-request-intake/siteOriginGuardV3216.mjs");
yes(edgeDirectory.includes("publicEndpointActive:false"));
yes(!source("src/core/websiteIntakePlanningV3216.mjs").includes("fetch("));
console.log("V3.216 offline regressions passed: "+count+" assertions; no customer/provider or database calls.");
