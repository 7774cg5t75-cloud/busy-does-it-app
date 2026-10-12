/**
 * V3.173 — compile bounded isolated-staging journey cases WITHOUT running them.
 * Designed for a later authenticated staging runner with separate owner consent,
 * sandbox identity, server-side signed receipts and a never-production transport.
 * This module creates no network client, credentials, emails, bookings or jobs.
 */
import {stagingJourneyTestPlan} from "./stagingJourneyContract.mjs";

const SAFE_CHANNELS=["busy_marketplace","standalone","guest_web"];
const CASES=Object.freeze([
 Object.freeze({id:"unauthenticated_submit_denied",step:"auth",
  expectation:"An unauthorised request is rejected before it enters a business inbox."}),
 Object.freeze({id:"wrong_tenant_denied",step:"auth",
  expectation:"A user from another tenant cannot view, modify or receive this request."}),
 Object.freeze({id:"idempotent_retry",step:"submitted",
  expectation:"Retrying with the same idempotency key does not create two requests."}),
 Object.freeze({id:"owner_inbox_scoped",step:"owner_inbox",
  expectation:"Only the matching business owner can inspect the request."}),
 Object.freeze({id:"receipt_status_consistent",step:"status",
  expectation:"Customer status matches the committed server lifecycle state."}),
 Object.freeze({id:"reply_delivery_channel",step:"reply_delivery",
  expectation:"Signed-in customers get verified replies; guests never inherit signed-in chat guarantees."}),
 Object.freeze({id:"booking_draft_unconfirmed",step:"diary",
  expectation:"A draft diary entry cannot mark a booking request as confirmed.",
  bookingOnly:true}),
 Object.freeze({id:"confirmed_diary_link",step:"diary",
  expectation:"Only the linked confirmed diary record allows booking acceptance.",
  bookingOnly:true}),
 Object.freeze({id:"guest_receipt_limitations",step:"guest",
  expectation:"Browser receipt status works, without implying chat replies reach guests."}),
 Object.freeze({id:"standalone_identity",step:"standalone",
  expectation:"Standalone identity, tenant and request routing independently pass."}),
 Object.freeze({id:"device_accessibility",step:"device",
  expectation:"Real devices and assistive technology must be checked separately."})
]);
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function prepareStagingJourneyRun({
 kind="booking_request",channel="busy_marketplace",businessId="",
 draftRevision=0,environment="dry_run",ownerApproved=false
}={}){
 const base=stagingJourneyTestPlan({kind,channel});
 if(!base.ok)return base;
 if(!UUID.test(businessId)||!Number.isSafeInteger(draftRevision)||
    draftRevision<1)return {ok:false,reason:"A valid isolated test business and current revision are required."};
 if(!["dry_run","isolated_staging"].includes(environment))return {ok:false,
  reason:"Only offline preparation or explicitly isolated staging is allowed."};
 const sourceCases=CASES.filter(x=>!x.bookingOnly||kind==="booking_request");
 const cases=sourceCases.map(x=>({
  id:x.id,requirement:x.step,expected:x.expectation,
  status:"not_run",proofRequired:true,hasExecuted:false
 }));
 // A "ready" flag NEVER constitutes permission to make a request;
 // authenticated server-side checks must re-enforce owner consent.
 const mayRequestSeparateLiveApproval=environment==="isolated_staging"&&
  ownerApproved===true;
 return {ok:true,kind:"bounded_staging_preparation_v3173",
  requestKind:kind,channel,businessScoped:true,draftRevision,
  environment,caseCount:cases.length,cases,
  requirements:base.steps.map(x=>({id:x.id,label:x.label,verified:false})),
  hasRealRequests:false,executedCount:0,
  ownerRequestedStagingRun:mayRequestSeparateLiveApproval,
  isolatedRunnerConnected:false,authorizationVerified:false,
  stagingTransportAvailable:false,
  canExecuteLive:false,
  reasonsToBlockExecution:[
    "A trusted server-side staging runner is not connected.",
    "Server-side owner permission and business isolation are not verified.",
    "Network/provider charges and notification side effects must be gated.",
    "Production traffic and real customer records are forbidden."
  ],
  separateApprovalRequired:true,noSecretsIncluded:true,
  noPIIIncluded:true,noMessagesSent:true,noBookingCreated:true,
  noPublishing:true,noClaimsOfEndToEndSuccess:true};
}
function planStagingCoverage({businessId="",draftRevision=0}={}){
 if(!UUID.test(businessId)||!Number.isSafeInteger(draftRevision)||draftRevision<1)
  return {ok:false,reason:"A verified test business scope and revision are required."};
 const plans=[];
 for(const channel of SAFE_CHANNELS)
  for(const kind of ["booking_request","enquiry"]){
   const plan=prepareStagingJourneyRun({kind,channel,businessId,draftRevision});
   plans.push({kind,channel,caseCount:plan.caseCount,
     requirementCount:plan.requirements.length,
     runState:"not_run",ownerApprovalRequired:true});
  }
 return {ok:true,kind:"all_entry_routes_staging_plan_v3173",
  plans,routeCount:plans.length,
  expectedCaseDefinitions:plans.reduce((n,x)=>n+x.caseCount,0),
  validatedDeliveryCount:0,ranAgainstRealEndpoints:false,
  requiresIsolatedRunner:true,neverAutoPublish:true};
}
export {CASES,prepareStagingJourneyRun,planStagingCoverage};
