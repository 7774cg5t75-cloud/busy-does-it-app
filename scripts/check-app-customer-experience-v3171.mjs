import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {describeRequestExperience} from "../src/core/appRequestCommunication.mjs";
import {reviewCustomerExperience} from "../src/core/appCustomerExperienceReview.mjs";
import {proposeCoordinatedAppChanges} from "../src/core/appCoordinatedStudio.mjs";
import {SCENARIOS,simulateCustomerJourney}
 from "../src/core/appCustomerJourneyPractice.mjs";

const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const ALL=["business_profile","services","gallery","contact","enquiry",
  "booking_request","offers","loyalty"];
function cfg(enabled=ALL){
 return {modules:ALL.map(key=>({key,enabled:enabled.includes(key)})),
  navigation:ALL.filter(x=>enabled.includes(x)),
  presentation:{headerStyle:"refined",layoutDensity:"comfortable",
    navigationStyle:"tabs",imageScale:"regular",galleryLayout:"grid",imageCorners:"rounded"},
  publicProfile:{businessName:"Fictional Business",
   services:[{name:"Consultation",description:"Owner-approved description"}],
   assets:{gallery:[{approved:true,alt:"Approved photo",uri:"https://example.invalid/photo"}]}},
  privateCustomers:[{email:"do-not-leak@example.invalid"}],
  billing:{token:"not-for-display"},published:{live:true}};
}
const original=cfg(),snapshot=JSON.stringify(original);
for(const audience of ["business","customer"]){
 const waiting=describeRequestExperience({request_type:"booking_request",
  status:"received",contact_email:"secret@example.invalid"},null,{audience});
 assert.equal(waiting.ok,true);
 assert.equal(waiting.confirmationRecorded,false);
 assert.equal(waiting.cannotConfirmBooking,true);
 assert.match(waiting.explanation,/no appointment is confirmed/);
 assert.equal(JSON.stringify(waiting).includes("secret@example.invalid"),false);
 const draft=describeRequestExperience({request_type:"booking_request",
  status:"reviewing"},{bridge_state:"booking_draft"},{audience});
 assert.equal(draft.confirmationRecorded,false);
 assert.match(draft.explanation,/not yet confirmed/);
 const inconsistentA=describeRequestExperience({request_type:"booking_request",
  status:"accepted"},{bridge_state:"booking_draft"},{audience});
 assert.equal(inconsistentA.confirmationRecorded,false);
 assert.equal(inconsistentA.inconsistentRecords,true);
 assert.match(inconsistentA.explanation,/cannot confirm/);
 assert.ok(inconsistentA.stageLabels.every(x=>!x.complete));
 const inconsistentB=describeRequestExperience({request_type:"booking_request",
  status:"reviewing"},{bridge_state:"booking_confirmed"},{audience});
 assert.equal(inconsistentB.inconsistentRecords,true);
 assert.equal(inconsistentB.confirmationRecorded,false);
 assert.ok(inconsistentB.stageLabels.every(x=>!x.complete));
 const confirmed=describeRequestExperience({request_type:"booking_request",
  status:"accepted"},{bridge_state:"booking_confirmed"},{audience});
 assert.equal(confirmed.confirmationRecorded,true);
 assert.equal(confirmed.inconsistentRecords,false);
 assert.equal(confirmed.title,"Booking confirmed");
 assert.ok(confirmed.stageLabels.some(x=>x.key==="response"&&x.complete));
 const declined=describeRequestExperience({request_type:"booking_request",
  status:"declined"},null,{audience});
 assert.equal(declined.title,"Request declined");
 assert.equal(declined.confirmationRecorded,false);
 const closed=describeRequestExperience({request_type:"booking_request",
  status:"closed"},null,{audience});
 assert.equal(closed.title,"Request closed");
 const enquiry=describeRequestExperience({request_type:"enquiry",
  status:"accepted",payload:{message:"secret body"}},null,{audience});
 assert.equal(enquiry.title,"Enquiry accepted");
 assert.match(enquiry.explanation,/does not mean a reply was delivered/);
 assert.equal(enquiry.aCustomerReplyWasNotAssumed,true);
 assert.equal(JSON.stringify(enquiry).includes("secret body"),false);
 const guest=describeRequestExperience({request_type:"enquiry",
  status:"reviewing",request_origin:"guest_web"},null,{audience});
 assert.equal(guest.guestReplyDeliveryUnverified,true);
 assert.match(guest.nextStep,/not delivered/);
 assert.equal(guest.noNotificationSent,true);
}
assert.equal(describeRequestExperience(null,null).ok,false);
assert.equal(describeRequestExperience({request_type:"enquiry",status:"hacked"},null).ok,false);
assert.equal(describeRequestExperience({request_type:"booking_request",
 status:"accepted"},null).confirmationRecorded,false);
assert.equal(describeRequestExperience({request_type:"enquiry",
 status:"reviewing"},null,{audience:"outsider"}).ok,false);
assert.equal(describeRequestExperience({request_type:"booking_request",
 status:"received"},{bridge_state:"unexpected"}).confirmationRecorded,false);
assert.equal(JSON.stringify(original),snapshot);

for(const goal of ["book","enquire","services","photos","offers","rewards"]){
 const review=reviewCustomerExperience(original,{goal});
 assert.equal(review.ok,true,goal);
 assert.equal(review.goal,goal);
 assert.equal(review.noChangesPerformed,true);
 assert.equal(review.noRealCustomerDataRead,true);
 assert.equal(review.noGeneratedPublicCopy,true);
 assert.equal(review.noProviderCalls,true);
 assert.equal(review.noPublishing,true);
 assert.equal(review.finalOwnerControl,true);
 assert.equal(review.marketplaceStandaloneSameDraft,true);
 assert.equal(review.applicableReleaseTests.length,6);
 assert.ok(review.applicableReleaseTests.every(x=>x.verified===false));
 assert.ok(review.improvements.every(x=>x.canAutoFix===false&&x.requiresOwnerApproval));
 assert.ok(review.improvements.length<=6);
 assert.equal(JSON.stringify({findings:review.improvements,
  readiness:review.readinessWarnings,practice:review.practiceCoverage,
  release:review.applicableReleaseTests}).includes("do-not-leak@example.invalid"),false);
 if(["book","enquire"].includes(goal)){
  assert.ok(review.practiceCoverage);
  assert.ok(review.practiceCoverage.ran>0);
  assert.equal(review.practiceCoverage.simulatedOnly,true);
 }
 if(review.navigationPreview?.ok){
  const reversed=proposeCoordinatedAppChanges(review.navigationPreview.nextConfig,
   review.navigationPreview.undoOperations);
  assert.equal(reversed.ok,true);
  assert.deepEqual(reversed.nextConfig.navigation,original.navigation);
  assert.deepEqual(review.navigationPreview.nextConfig.privateCustomers,
   original.privateCustomers);
  assert.deepEqual(review.navigationPreview.nextConfig.billing,original.billing);
 }
}
assert.ok(reviewCustomerExperience(original,{goal:"book"}).improvements
 .some(x=>x.id==="confirm_diary_handoff"));
assert.ok(reviewCustomerExperience(original,{goal:"enquire"}).improvements
 .some(x=>x.id==="verify_enquiry_reply"));
assert.ok(reviewCustomerExperience(original,{goal:"offers"}).improvements
 .some(x=>x.id==="validate_offer_terms"));
assert.ok(reviewCustomerExperience(original,{goal:"rewards"}).improvements
 .some(x=>x.id==="verify_loyalty_workflow"));
const missingBooking=cfg(ALL.filter(k=>k!=="booking_request"));
const absent=reviewCustomerExperience(missingBooking,{goal:"book"});
assert.equal(absent.taskEnabled,false);
assert.equal(absent.navigationPreview,null);
assert.ok(absent.improvements.some(x=>x.id==="enable_real_module"));
assert.equal(absent.practiceCoverage.unavailable,5);
const contactOnly=cfg(ALL.filter(k=>k!=="enquiry"));
const limited=reviewCustomerExperience(contactOnly,{goal:"enquire"});
assert.ok(limited.improvements.some(x=>x.id==="enable_real_module"));
assert.equal(limited.practiceCoverage.unavailable,4);
const emptyServices=cfg();emptyServices.publicProfile.services=[];
assert.ok(reviewCustomerExperience(emptyServices,{goal:"services"}).improvements
 .some(x=>x.id==="missing_services"));
const vague=cfg();vague.publicProfile.services=[{name:"Consultation"}];
assert.ok(reviewCustomerExperience(vague,{goal:"services"}).improvements
 .some(x=>x.id==="unclear_services"));
const emptyGallery=cfg();emptyGallery.publicProfile.assets.gallery=[];
assert.ok(reviewCustomerExperience(emptyGallery,{goal:"photos"}).improvements
 .some(x=>x.id==="no_approved_photos"));
const missingAlt=cfg();missingAlt.publicProfile.assets.gallery=[{approved:true}];
assert.ok(reviewCustomerExperience(missingAlt,{goal:"photos"}).improvements
 .some(x=>x.id==="photo_accessibility"));
assert.equal(reviewCustomerExperience(original,{goal:"unknown"}).ok,false);
assert.equal(reviewCustomerExperience({...original,navigation:["bogus"]}).ok,false);
assert.equal(JSON.stringify(original),snapshot);

for(const s of SCENARIOS){
 const baseline=simulateCustomerJourney(original,s.id);
 assert.equal(baseline.ok,true);
 if(!baseline.ran)continue;
 const request={request_type:s.task==="book"?"booking_request":"enquiry",
  status:baseline.finalStatus};
 const linked=s.task==="book"?{bridge_state:s.bridge}:null;
 const status=describeRequestExperience(request,linked);
 assert.equal(status.ok,true);
 // The fixture state transition is the source of truth; a confirmed
 // booking can only be shown if BOTH request status and diary agree.
 if(s.task==="book"&&s.id!=="booking_confirmed"){
  assert.equal(status.confirmationRecorded,false,s.id);
 }
 if(s.id==="booking_confirmed"){
  const exact=describeRequestExperience(request,{bridge_state:"booking_confirmed"});
  assert.equal(exact.confirmationRecorded,true);
 }
}
const ui=read("src/screens/miniApps.js");
for(const anchor of ["appRequestCommunication.mjs",
 "appCustomerExperienceReview.mjs",
 "describeRequestExperience(request,link,",
 "experienceMessage?.confirmationRecorded?","experienceMessage.inconsistentRecords?",
 "reviewCustomerExperience(view.draftConfig,{goal:selectedCustomerTask})",
 "How Busy would improve this","customerExperience.improvements.map",
 "practiceReport.releaseChecklist||[]","Preview a clearer customer journey"]){
 assert.ok(ui.includes(anchor),"Missing real UI integration: "+anchor);
}
const ci=read(".github/workflows/app-customer-experience-v3171.yml");
for(const anchor of ["node scripts/check-app-customer-experience-v3171.mjs",
 "node scripts/check-app-customer-journeys-v3170.mjs",
 "node scripts/check-app-customer-tasks-v3169.mjs",
 "node scripts/check-app-industry-v3168.mjs",
 "expo export --platform ios","expo export --platform android",
 "prepare-standalone-prototype-v3154.mjs"]){
 assert.ok(ci.includes(anchor),"Missing CI gate: "+anchor);
}
console.log("V3.171 PASS: safe booking/enquiry wording, guest receipts, consistency warnings, six actionable customer-goal audits, missing setup and reversible previews, live UI and inherited CI.");
