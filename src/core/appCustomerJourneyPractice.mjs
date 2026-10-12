/**
 * V3.170 — synthetic customer-journey checks for private Business App Studio.
 *
 * Runs the EXISTING V3.158 request transition rules on fixed fictional states,
 * not on actual customer requests. No network, database, record mutation,
 * messaging, booking confirmation, screenshots or publishing.
 *
 * These tests prove only the bounded in-memory state machine under these
 * scenarios. They DO NOT demonstrate that an app can receive a real request,
 * dispatch a reply, confirm an actual diary slot or pass physical-device QA.
 */
import {taskReadiness} from "./appCustomerTaskDesign.mjs";
import {decideAppRequestTransition,appRequestJourney}
  from "./appRequestLifecycle.mjs";

const SCENARIOS=Object.freeze([
 Object.freeze({id:"booking_waiting",task:"book",label:"Request waits for confirmation",
  initial:"received",bridge:"",actions:[
   {next:"reviewing",bridge:"",allowed:true},
   {next:"accepted",bridge:"",allowed:false}
  ],expected:"reviewing",confirmed:false,denials:1}),
 Object.freeze({id:"booking_draft_only",task:"book",label:"Draft diary booking is not confirmation",
  initial:"received",bridge:"booking_draft",actions:[
   {next:"reviewing",bridge:"booking_draft",allowed:true},
   {next:"accepted",bridge:"booking_draft",allowed:false}
  ],expected:"reviewing",confirmed:false,denials:1}),
 Object.freeze({id:"booking_confirmed",task:"book",label:"Verified diary confirmation permits acceptance",
  initial:"received",bridge:"",actions:[
   {next:"reviewing",bridge:"",allowed:true},
   {next:"accepted",bridge:"booking_confirmed",allowed:true}
  ],expected:"accepted",confirmed:true,denials:0}),
 Object.freeze({id:"booking_declined",task:"book",label:"Declined request stays closed",
  initial:"received",bridge:"",actions:[
   {next:"declined",bridge:"",allowed:true},
   {next:"reviewing",bridge:"",allowed:false}
  ],expected:"declined",confirmed:false,denials:1}),
 Object.freeze({id:"booking_inconsistent_record",task:"book",
  label:"Accepted status alone cannot prove a booking",
  initial:"accepted",bridge:"booking_draft",actions:[],
  expected:"accepted",confirmed:false,denials:0}),
 Object.freeze({id:"enquiry_review",task:"enquire",label:"Enquiry moves to reviewing",
  initial:"received",bridge:"",actions:[
   {next:"reviewing",bridge:"",allowed:true}
  ],expected:"reviewing",confirmed:false,denials:0}),
 Object.freeze({id:"enquiry_accepted",task:"enquire",label:"Enquiry acceptance is not a sent reply",
  initial:"received",bridge:"",actions:[
   {next:"reviewing",bridge:"",allowed:true},
   {next:"accepted",bridge:"",allowed:true}
  ],expected:"accepted",confirmed:false,denials:0}),
 Object.freeze({id:"enquiry_closed",task:"enquire",label:"Closed enquiry cannot silently reopen",
  initial:"received",bridge:"",actions:[
   {next:"closed",bridge:"",allowed:true},
   {next:"reviewing",bridge:"",allowed:false}
  ],expected:"closed",confirmed:false,denials:1}),
 Object.freeze({id:"enquiry_declined",task:"enquire",label:"Declined enquiry cannot silently accept",
  initial:"received",bridge:"",actions:[
   {next:"declined",bridge:"",allowed:true},
   {next:"accepted",bridge:"",allowed:false}
  ],expected:"declined",confirmed:false,denials:1})
]);
const SCENARIO_BY_ID=new Map(SCENARIOS.map(x=>[x.id,x]));
const STATUS=["received","reviewing","accepted","declined","closed"];
function simulateCustomerJourney(config,scenarioId){
 const scenario=SCENARIO_BY_ID.get(scenarioId);
 if(!scenario)return {ok:false,reason:"Choose a supported practice scenario."};
 const ready=taskReadiness(config,scenario.task);
 if(!ready.ok)return {ok:false,reason:ready.reason};
 // Contact-only is not equivalent to a tracked enquiry backend.
 const exact=ready.available&&ready.targetModule===ready.primaryModule;
 if(!exact)return {ok:true,kind:"practice_journey_v3170",
  scenarioId,task:scenario.task,label:scenario.label,
  ran:false,passed:null,releaseStatus:"requires_feature_setup",
  blockers:[...ready.blockers,...(ready.fallbackUsed?
   ["Contact is not the tracked Enquiries module; this case cannot run."]:[])],
  noLiveRequests:true,noCustomerDataRead:true,noPublishing:true};
 let status=scenario.initial,bridgeState=scenario.bridge;
 const timeline=[],noisyDataNeverRead=true;
 for(const action of scenario.actions){
  const before=status;
  const transition=decideAppRequestTransition({
   status,request_type:scenario.task==="book"?"booking_request":"enquiry"
  },action.next,{bridgeState:action.bridge});
  const allowed=transition.ok===true&&transition.noChange!==true;
  if(allowed){
   status=action.next;
   bridgeState=action.bridge;
  }
  timeline.push({before,attempted:action.next,permitted:allowed,
   expectedPermitted:action.allowed,after:status,
   reason:allowed?transition.customerLabel:transition.reason||
    "Request state unchanged"});
 }
 const journey=appRequestJourney({
  status,request_type:scenario.task==="book"?"booking_request":"enquiry"
 },scenario.task==="book"?{bridge_state:bridgeState}:null);
 const deniedCount=timeline.filter(x=>!x.permitted).length;
 const safetyCheck=scenario.task!=="book"||!journey.confirmed||
  status==="accepted"&&bridgeState==="booking_confirmed";
 const passed=status===scenario.expected&&
  journey.confirmed===scenario.confirmed&&
  deniedCount===scenario.denials&&safetyCheck&&
  timeline.every(x=>x.permitted===x.expectedPermitted)&&
  (scenario.task!=="book"||journey.type==="booking_request");
 return {ok:true,kind:"practice_journey_v3170",
  scenarioId,task:scenario.task,label:scenario.label,ran:true,
  passed,releaseStatus:passed?"synthetic_logic_passed_only":"synthetic_logic_failed",
  finalStatus:status,confirmationShown:journey.confirmed,
  requiresOwnerConfirmation:journey.requiresHumanConfirmation,
  denialCount:deniedCount,timeline,
  customerMessage:journey.customerMessage,
  caution:scenario.task==="book"?
   "The test invents a confirmed-diary signal for this fixture; no real diary booking was made.":
   "A state transition does not prove an owner reply reached a customer.",
  noLiveRequests:true,noCustomerDataRead:noisyDataNeverRead,
  noRealDiaryConfirmed:true,noMessagesSent:true,noBookingCreated:true,
  noAutomaticApproval:true,noPublishing:true,notEndToEndTested:true};
}
function runCustomerJourneyPractice(config){
 const booking=taskReadiness(config,"book");
 const enquiry=taskReadiness(config,"enquire");
 if(!booking.ok||!enquiry.ok)return {ok:false,
  reason:booking.reason||enquiry.reason};
 const results=SCENARIOS.map(s=>simulateCustomerJourney(config,s.id));
 const ran=results.filter(x=>x.ran===true);
 const failures=ran.filter(x=>!x.passed);
 const blocked=results.filter(x=>x.ran===false);
 const checklist=[
  {id:"real_submission",label:"Submit a real isolated-staging booking and enquiry",
   verified:false,source:"requires_isolated_staging"},
  {id:"delivery",label:"Confirm the owner receives and can respond to each request",
   verified:false,source:"requires_end_to_end_test"},
  {id:"diary",label:"Verify diary link and separately confirmed appointment",
   verified:false,source:"requires_confirmed_diary_test"},
  {id:"auth_tenant",label:"Check auth, tenant isolation, replay and permissions",
   verified:false,source:"requires_security_test"},
  {id:"devices",label:"Test iPhone, tablet, accessibility and standalone app",
   verified:false,source:"requires_real_devices"},
  {id:"owner_approval",label:"Keep publication, spending and app-store submission owner-approved",
   verified:false,source:"release_approval_gate"}
 ];
 return {ok:true,kind:"synthetic_business_app_journey_suite_v3170",
  bookingReadiness:{status:booking.status,module:booking.targetModule,
   blockers:booking.blockers,cautions:booking.cautions},
  enquiryReadiness:{status:enquiry.status,module:enquiry.targetModule,
   blockers:enquiry.blockers,cautions:enquiry.cautions},
  scenarioCount:results.length,ranCount:ran.length,
  passedCount:ran.length-failures.length,failedCount:failures.length,
  unavailableCount:blocked.length,
  results:results.map(x=>({
   id:x.scenarioId,label:x.label,task:x.task,ran:x.ran,
   passed:x.passed,releaseStatus:x.releaseStatus,
   finalStatus:x.finalStatus||null,
   confirmationShown:x.confirmationShown===true,
   denied:x.denialCount||0,blockers:x.blockers||[]
  })),
  releaseChecklist:checklist,
  readiness:failures.length?"synthetic_guard_failure":
   blocked.length?"some_features_unavailable":"synthetic_guards_passed_not_live_verified",
  customerWorkflowVerified:false,bookingDelivered:false,
  enquiryDelivered:false,realDiaryBookingConfirmed:false,
  realUserTaskTested:false,
  checksAreOfflineAndFictional:true,onlyPublicConfigRead:true,
  noDataPersisted:true,noCustomerNotifications:true,noCharges:true,
  noPublishing:true,ownerApprovalRequiredForRealChanges:true};
}
export {SCENARIOS,simulateCustomerJourney,runCustomerJourneyPractice};
