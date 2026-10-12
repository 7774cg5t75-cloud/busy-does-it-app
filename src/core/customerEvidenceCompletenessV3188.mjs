/**
 * V3.188 evidence completeness and interpretation policy.
 * An absent message in a limited latest-N snapshot is not proof that
 * nobody replied. Likewise, a 90-day Work slice can't rule out older bookings.
 * Return bounded decisions and counts, NEVER personal details.
 */
function assessOwnerEvidenceCompleteness({
 outcomeProof=null,journey=null,work=null,
 messageSnapshot={rows:[],truncated:false},
 workSnapshot={rows:[],truncated:false},
 requestSnapshotLimit=30
}={}){
 const proof=outcomeProof,proofOk=proof?.ok===true;
 if(!proofOk||!Number.isSafeInteger(requestSnapshotLimit)||
    requestSnapshotLimit<1||requestSnapshotLimit>2000||
    !messageSnapshot||!Array.isArray(messageSnapshot.rows)||
    !workSnapshot||!Array.isArray(workSnapshot.rows))
   return {ok:false,reason:"Use bounded, current owner-scoped stored evidence."};
 const requests=Number(proof.counts?.requests);
 if(!Number.isSafeInteger(requests)||requests<0)return {ok:false,reason:"Invalid request evidence."};
 const messageComplete=messageSnapshot.truncated!==true&&messageSnapshot.rows.length<150;
 // No pagination contract exists for server messages; even under 150 rows
 // we cannot certify historical completeness when the snapshot is filtered.
 const messageAbsenceReliable=false;
 const workComplete=workSnapshot.truncated!==true&&workSnapshot.rows.length<200;
 const workAbsenceReliable=false; // 90-day, capped, date-filtered source
 const requestsComplete=requests<requestSnapshotLimit;
 const warnings=[];
 if(!requestsComplete)warnings.push("The request list may omit older customer requests.");
 if(!messageComplete)warnings.push("Recent messages are capped; missing replies need a direct conversation check.");
 if(!workComplete)warnings.push("The Work ledger reached its row limit.");
 warnings.push("A missing saved reply or Work record in this sample is not independently proven absent.");
 const signals=[];
 if((proof.counts?.closedButWorkActive||0)>0){
   signals.push({id:"active_work_after_closed_request",strength:"observed_conflict",
    title:"Review a closed request still showing an active Work booking",
    next:"Check both saved states before updating the customer."});
 }
 if((proof.counts?.acceptedWithoutConfirmedWork||0)>0){
   signals.push({id:"accepted_booking_unmatched",strength:"needs_direct_lookup",
    title:"Check an accepted booking without a matching Work row in this sample",
    next:"Open the original request and look up the full Work ledger before assuming the booking is missing."});
 }
 if((proof.counts?.requestsWithoutStoredOwnerReply||0)>0){
   signals.push({id:"reply_not_seen_in_snapshot",strength:"needs_direct_lookup",
    title:"Check requests with no owner reply in the sampled messages",
    next:"Read each actual conversation before sending another reply."});
 }
 return {ok:true,kind:"owner_evidence_completeness_v3188",
  requestSnapshotComplete:requestsComplete,
  messageSnapshotComplete:messageComplete,
  workSnapshotComplete:workComplete,
  messageAbsenceReliable,workAbsenceReliable,
  warnings,reviewSignals:signals,
  observedClosedActiveConflicts:proof.counts.closedButWorkActive||0,
  possibleUnmatchedAccepted:proof.counts.acceptedWithoutConfirmedWork||0,
  possibleUnansweredRequests:proof.counts.requestsWithoutStoredOwnerReply||0,
  confirmedRevenue:null,deliveredNotifications:null,
  noInferredCustomerConversion:true,
  automaticOwnerActionsAllowed:false,
  customerDetailsReturned:false,
  realEndToEndDeliveryVerified:false,
  needsAuthenticatedPerRequestLookup:signals.some(x=>x.strength==="needs_direct_lookup")};
}
export {assessOwnerEvidenceCompleteness};
