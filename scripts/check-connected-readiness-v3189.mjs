import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {prepareOwnerNextAction} from "../src/core/ownerNextActionV3189.mjs";
import {reviewSingleJourney} from "../src/core/singleJourneyProofV3189.mjs";
import {assessAmbiguousTaskOutcome} from "../src/core/ambiguousTaskOutcomeV3189.mjs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
let tests=0;
const eq=(x,y)=>{assert.deepEqual(x,y);tests++};
const yes=x=>{assert.ok(x);tests++};
const business="11111111-1111-4111-8111-111111111111";
const app="33333333-3333-4333-8333-333333333333";
const id="55555555-5555-4555-8555-555555555555";
const proof={ok:true,counts:{requests:3,closedButWorkActive:1,
 acceptedWithoutConfirmedWork:1,requestsWithoutStoredOwnerReply:1}};
const completeness={ok:true,requestSnapshotComplete:false,
 messageAbsenceReliable:false,workAbsenceReliable:false};
const selected=prepareOwnerNextAction({outcomeProof:proof,evidenceCompleteness:completeness});
yes(selected.ok);eq(selected.suggestions.length,3);
eq(selected.suggestions[0].id,"conflicting_booking");
eq(selected.fullRecordLookupsPerformed,false);
eq(selected.customersContacted,false);
eq(selected.verifiedCustomerDelivery,false);
yes(!prepareOwnerNextAction({}).ok);
yes(!prepareOwnerNextAction({outcomeProof:{ok:true,counts:{...proof.counts,
 closedButWorkActive:-2}},evidenceCompleteness:completeness}).ok);
const base={businessId:business,appId:app,
 request:{id,business_id:business,mini_app_id:app,
 request_type:"booking_request",status:"accepted"},
 messages:[],work:[{business_id:business,request_id:id,state:"confirmed"}],
 links:[{business_id:business,request_id:id,bridge_state:"booking_confirmed"}]};
const complete={request:true,messages:true,work:true,links:true};
const confirmed=reviewSingleJourney({...base,complete});
yes(confirmed.ok);eq(confirmed.confirmedInBusyWork,true);
eq(confirmed.ownerReplySaved,false);eq(confirmed.replyNotFoundInCompleteRecord,true);
eq(confirmed.automaticActionAllowed,false);eq(confirmed.deviceDeliveryVerified,false);
const partial=reviewSingleJourney({...base,complete:{request:true}});
eq(partial.confirmedInBusyWork,false);eq(partial.replyNotFoundInCompleteRecord,false);
eq(partial.sourceReportedComplete,false);
const conflict=reviewSingleJourney({...base,
 request:{...base.request,status:"closed"},complete});
yes(conflict.issues.includes("closed_request_has_active_booking"));
eq(conflict.confirmedInBusyWork,false);
yes(!reviewSingleJourney({...base,work:[{business_id:
 "22222222-2222-4222-8222-222222222222",request_id:id,state:"confirmed"}]}).ok);
yes(!reviewSingleJourney({...base,messages:"malformed"}).ok);
const uncertainty=assessAmbiguousTaskOutcome({transportUnknown:true,databaseSaved:true});
eq(uncertainty.stage,"needs_same_key_readback");
eq(uncertainty.safeToRetryWithNewKey,false);
eq(uncertainty.preserveExistingKey,true);
const stored=assessAmbiguousTaskOutcome({databaseSaved:true,
 readbackComplete:true,idempotencyKeyMatches:true,gatewayAccepted:true});
eq(stored.stage,"accepted_by_gateway_not_device");
eq(stored.customerDeliveryIndependentlyVerified,false);
const source=read("src/domain/miniApps.js"),screen=read("src/screens/miniApps.js");
yes(source.includes("prepareOwnerNextAction({outcomeProof,evidenceCompleteness})"));
yes(source.includes("ownerNextAction,"));
yes(screen.includes("Busy's next check"));
yes(screen.includes("view.ownerNextAction.suggestions[0].next"));
yes(read("staging/ci-evidence-readback-v3189.sql").includes("Other business replied to tenant A"));
console.log("V3.189 "+tests+" focused business evidence, replay and UI assertions PASS.");
