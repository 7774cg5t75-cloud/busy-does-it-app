import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {SCENARIOS,simulateCustomerJourney,runCustomerJourneyPractice}
 from "../src/core/appCustomerJourneyPractice.mjs";
import {decideAppRequestTransition,appRequestJourney}
 from "../src/core/appRequestLifecycle.mjs";

const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const ALL=["business_profile","services","gallery","contact",
 "enquiry","booking_request","offers","loyalty"];
const cfg=(enabled=ALL)=>({
 modules:ALL.map(key=>({key,enabled:enabled.includes(key)})),
 navigation:ALL.filter(key=>enabled.includes(key)),
 presentation:{headerStyle:"refined",navigationStyle:"tabs",
  layoutDensity:"comfortable",galleryLayout:"grid",imageScale:"regular",
  imageCorners:"rounded"},
 publicProfile:{businessName:"Fictional business",
  services:[{name:"Fictional service"}],assets:{gallery:[]}},
 customerRecords:[{email:"fictional-secret@example.invalid"}],
 paymentTokens:{secret:"secret-token-do-not-copy"},
 publisher:{approved:false},
 entitlement:{remainingCredits:1}
});
const source=cfg(),frozen=JSON.stringify(source);
assert.equal(SCENARIOS.length,9);
assert.equal(new Set(SCENARIOS.map(s=>s.id)).size,SCENARIOS.length);
const report=runCustomerJourneyPractice(source);
assert.equal(report.ok,true);
assert.equal(report.scenarioCount,9);
assert.equal(report.ranCount,9);
assert.equal(report.passedCount,9);
assert.equal(report.failedCount,0);
assert.equal(report.unavailableCount,0);
assert.equal(report.readiness,"synthetic_guards_passed_not_live_verified");
assert.equal(report.customerWorkflowVerified,false);
assert.equal(report.bookingDelivered,false);
assert.equal(report.enquiryDelivered,false);
assert.equal(report.realDiaryBookingConfirmed,false);
assert.equal(report.noCustomerNotifications,true);
assert.equal(report.noCharges,true);
assert.equal(report.noPublishing,true);
assert.equal(report.ownerApprovalRequiredForRealChanges,true);
assert.equal(report.realUserTaskTested,false);
assert.equal(report.releaseChecklist.length,6);
assert.ok(report.releaseChecklist.every(x=>x.verified===false));
assert.equal(JSON.stringify(report).includes("fictional-secret@example.invalid"),false);
assert.equal(JSON.stringify(report).includes("secret-token-do-not-copy"),false);
assert.equal(JSON.stringify(source),frozen);
for(const s of SCENARIOS){
 const run=simulateCustomerJourney(source,s.id);
 assert.equal(run.ok,true,s.id);
 assert.equal(run.ran,true,s.id);
 assert.equal(run.passed,true,s.id);
 assert.equal(run.scenarioId,s.id);
 assert.equal(run.finalStatus,s.expected,s.id);
 assert.equal(run.confirmationShown,s.confirmed,s.id);
 assert.equal(run.denialCount,s.denials,s.id);
 assert.equal(run.timeline.length,s.actions.length,s.id);
 assert.ok(run.timeline.every(x=>x.permitted===x.expectedPermitted),s.id);
 assert.equal(run.noRealDiaryConfirmed,true);
 assert.equal(run.noMessagesSent,true);
 assert.equal(run.noLiveRequests,true);
 assert.equal(run.noBookingCreated,true);
 assert.equal(run.noPublishing,true);
 assert.equal(run.notEndToEndTested,true);
 assert.equal(JSON.stringify(run).includes("fictional-secret@example.invalid"),false);
}
assert.equal(simulateCustomerJourney(source,"not_supported").ok,false);
assert.equal(simulateCustomerJourney({...source,navigation:["bad"]},"booking_waiting").ok,false);
const waiting=simulateCustomerJourney(source,"booking_waiting");
assert.equal(waiting.confirmationShown,false);
assert.equal(waiting.requiresOwnerConfirmation,true);
assert.match(waiting.customerMessage,/not have a confirmed appointment/);
assert.equal(waiting.timeline[1].permitted,false);
const bookingDraft=simulateCustomerJourney(source,"booking_draft_only");
assert.equal(bookingDraft.confirmationShown,false);
assert.equal(bookingDraft.timeline[1].permitted,false);
const confirmed=simulateCustomerJourney(source,"booking_confirmed");
assert.equal(confirmed.confirmationShown,true);
assert.equal(confirmed.timeline[1].permitted,true);
assert.equal(confirmed.requiresOwnerConfirmation,false);
const inconsistent=simulateCustomerJourney(source,"booking_inconsistent_record");
assert.equal(inconsistent.confirmationShown,false);
assert.equal(inconsistent.requiresOwnerConfirmation,true);
assert.equal(inconsistent.timeline.length,0);
const declined=simulateCustomerJourney(source,"booking_declined");
assert.equal(declined.timeline[1].permitted,false);
const enquiryAccepted=simulateCustomerJourney(source,"enquiry_accepted");
assert.equal(enquiryAccepted.confirmationShown,false);
assert.equal(enquiryAccepted.noMessagesSent,true);
const enquiryClosed=simulateCustomerJourney(source,"enquiry_closed");
assert.equal(enquiryClosed.timeline[1].permitted,false);
const denied=decideAppRequestTransition(
 {request_type:"booking_request",status:"received"},"accepted",
 {bridgeState:"booking_draft"});
assert.equal(denied.ok,false,"No false diary acceptance from draft");
assert.equal(appRequestJourney(
 {request_type:"booking_request",status:"accepted"},
 {bridge_state:"booking_draft"}).confirmed,false);
const realConfirmation=decideAppRequestTransition(
 {request_type:"booking_request",status:"reviewing"},"accepted",
 {bridgeState:"booking_confirmed"});
assert.equal(realConfirmation.ok,true);
const contact=cfg(ALL.filter(k=>k!=="enquiry"));
const contactReport=runCustomerJourneyPractice(contact);
assert.equal(contactReport.ok,true);
assert.equal(contactReport.bookingReadiness.status,"available_not_end_to_end_verified");
assert.equal(contactReport.enquiryReadiness.status,"limited_fallback_unverified");
assert.equal(contactReport.ranCount,5);
assert.equal(contactReport.unavailableCount,4);
assert.equal(contactReport.readiness,"some_features_unavailable");
assert.equal(contactReport.results.filter(x=>x.task==="enquire").every(x=>x.ran===false),true);
assert.match(simulateCustomerJourney(contact,"enquiry_accepted").blockers.join(" "),/not the tracked Enquiries module/);
const missingBooking=cfg(ALL.filter(k=>k!=="booking_request"));
const reportWithoutBooking=runCustomerJourneyPractice(missingBooking);
assert.equal(reportWithoutBooking.unavailableCount,5);
assert.equal(reportWithoutBooking.ranCount,4);
assert.equal(reportWithoutBooking.results.filter(x=>x.task==="book").every(x=>x.ran===false),true);
const neither=cfg(["business_profile","contact"]);
const neitherReport=runCustomerJourneyPractice(neither);
assert.equal(neitherReport.ranCount,0);
assert.equal(neitherReport.unavailableCount,9);
assert.equal(neitherReport.customerWorkflowVerified,false);
assert.equal(neitherReport.readiness,"some_features_unavailable");
assert.equal(runCustomerJourneyPractice({...source,navigation:["missing"]}).ok,false);
const secondBusiness=cfg(["business_profile","services","enquiry"]);
secondBusiness.customerRecords=[{email:"other-business-private@example.invalid"}];
const secondReport=runCustomerJourneyPractice(secondBusiness);
assert.equal(secondReport.ranCount,4);
assert.equal(JSON.stringify(secondReport).includes("other-business-private@example.invalid"),false);
assert.equal(JSON.stringify(source),frozen);
assert.equal(JSON.stringify(contact).includes("fictional-secret@example.invalid"),true,
 "The test did not erase source data, only excluded it from its report");

const ui=read("src/screens/miniApps.js");
for(const token of ["appCustomerJourneyPractice.mjs",
 "runCustomerJourneyPractice(view.draftConfig)",
 "Check sample booking & enquiry journeys",
 "V3.170 • Practice journeys (fictional, offline)",
 "practiceReport.releaseChecklist||[]",
 "Not verified: ",
 "These are offline state-machine exercises, not end-to-end"]){
 assert.ok(ui.includes(token),"Studio does not expose guarded practice results: "+token);
}
const workflow=read(".github/workflows/app-customer-journeys-v3170.yml");
for(const required of ["node scripts/check-app-customer-journeys-v3170.mjs",
 "node scripts/check-app-customer-tasks-v3169.mjs",
 "node scripts/check-app-industry-v3168.mjs",
 "node scripts/check-native-public-booking-v3155.mjs",
 "expo export --platform ios","expo export --platform android",
 "prepare-standalone-prototype-v3154.mjs"]){
 assert.ok(workflow.includes(required),"CI missing "+required);
}
console.log("V3.170 PASS: 9 fictional booking/enquiry scenarios, guards against unconfirmed acceptance, closed/declined terminal states, separate diary confirmation, untracked Contact fallback, missing modules, tenant privacy, read-only UI and inherited CI.");
